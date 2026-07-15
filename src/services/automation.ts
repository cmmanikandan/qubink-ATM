import { updateOrderState, logMachineEvent, getSupabase } from './supabase';
import { MachineAuthService } from './auth';

export type PipelineStep =
  | 'Machine Connected'
  | 'Waiting For Orders'
  | 'Order Detected'
  | 'Payment Verified'
  | 'Downloading Document'
  | 'Validating File'
  | 'Reading Print Options'
  | 'Preparing Printer'
  | 'Creating Print Job'
  | 'Sending To Printer'
  | 'Printing Started'
  | 'Printing Progress'
  | 'Printing Completed'
  | 'Cleaning Temporary Files'
  | 'Sending Customer Notification'
  | 'Machine Ready';

export const PIPELINE_STEPS: PipelineStep[] = [
  'Machine Connected',
  'Waiting For Orders',
  'Order Detected',
  'Payment Verified',
  'Downloading Document',
  'Validating File',
  'Reading Print Options',
  'Preparing Printer',
  'Creating Print Job',
  'Sending To Printer',
  'Printing Started',
  'Printing Progress',
  'Printing Completed',
  'Cleaning Temporary Files',
  'Sending Customer Notification',
  'Machine Ready'
];

type ProgressCallback = (step: PipelineStep, progress: number, orderDetails: any | null) => void;

export class AutomationPipelineService {
  private static listeners: Set<ProgressCallback> = new Set();
  private static activeOrder: any | null = null;
  private static isProcessing = false;

  public static addListener(callback: ProgressCallback) {
    this.listeners.add(callback);
  }

  public static removeListener(callback: ProgressCallback) {
    this.listeners.delete(callback);
  }

  private static notify(step: PipelineStep, progress: number, orderDetails: any | null = null) {
    this.listeners.forEach((cb) => cb(step, progress, orderDetails || this.activeOrder));
  }

  public static isPipelineRunning() {
    return this.isProcessing;
  }

  public static async processOrder(order: any): Promise<boolean> {
    if (this.isProcessing) return false;
    
    this.isProcessing = true;
    this.activeOrder = order;
    const session = MachineAuthService.getSession();
    const machineId = session?.machineId || order.machine_id || 'unknown';

    try {
      logMessage('INFO', `Automation pipeline triggered for Order ${order.id}`);

      // Setup window listeners for Electron main process print progress feedback
      const cleanProgressEvents = window.api.onPrintProgress((_event, data) => {
        // Map print progress steps from main process to pipeline steps
        if (data.step) {
          this.notify(data.step as PipelineStep, data.progress);
          // Sync live sub-state steps to estimated_pickup column in Supabase
          updateOrderState(order.id, 'printing', { estimated_pickup: data.step }).catch(err => {
            console.error('Failed to sync realtime progress step to DB:', err);
          });
        }
      });

      // 1. Order Detected
      this.notify('Order Detected', 5);
      await new Promise((r) => setTimeout(r, 1000));

      // 2. Payment Verified (confirmed by status paid in DB)
      this.notify('Payment Verified', 10);
      await new Promise((r) => setTimeout(r, 1000));

      // 3. Mark as printing in database
      await updateOrderState(order.id, 'printing', { estimated_pickup: 'Downloading Document' });
      await logMachineEvent(machineId, `Order ${order.id} status changed to PRINTING.`);

      // 4. Download and Spool file natively in Electron main process
      // Extract file URL (check order.file_url or files json array)
      let targetFileUrl = order.file_url || '';
      if (!targetFileUrl && order.files) {
        try {
          const parsedFiles = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
          if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
            targetFileUrl = parsedFiles[0].cloudinary_secure_url || parsedFiles[0].url || '';
          }
        } catch (e) {
          console.error('Failed to parse order.files JSON:', e);
        }
      }

      if (!targetFileUrl) {
        throw new Error('No printable file URL found in order records.');
      }

      // Map options
      const printOptions = {
        fileUrl: targetFileUrl,
        copies: order.copies || 1,
        colorMode: order.color_mode || 'mono',
        paperSize: order.paper_size || 'A4',
        duplex: order.duplex || 'simplex',
        orientation: order.orientation || 'portrait'
      };

      // Call Electron silent printing downloader pipeline
      const printSuccess = await window.api.downloadAndPrint(printOptions, order.id);
      
      cleanProgressEvents();

      if (!printSuccess) {
        throw new Error('Silent print operation spooled failed inside host system.');
      }

      // 5. Printing Completed
      this.notify('Printing Completed', 90);
      await new Promise((r) => setTimeout(r, 800));

      // 6. Clean Temporary Files (done in main process automatically, animate in UI)
      this.notify('Cleaning Temporary Files', 95);
      await new Promise((r) => setTimeout(r, 800));

      // 7. Update status to ready in DB
      await updateOrderState(order.id, 'ready', {
        estimated_pickup: 'Printing Completed',
        rack_slot: 'A1' // Auto assign a common mock slot for ATM retrieval
      });

      // 8. Create Customer Notification in public.notifications
      this.notify('Sending Customer Notification', 98);
      try {
        const supabase = await getSupabase();
        const notifId = `notif-${Math.random().toString(36).substring(2, 11)}`;
        await supabase.from('notifications').insert([
          {
            id: notifId,
            user_id: order.student_id,
            title: 'Print Job Complete!',
            body: `Your documents for order ${order.id} are ready. Please collect them at the Qubink ATM slot.`,
            type: 'order_status',
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);
        await logMachineEvent(machineId, `Dispatched ready notification to student: ${order.student_name}`);
      } catch (err) {
        console.error('Failed to write customer notification in DB:', err);
      }
      await new Promise((r) => setTimeout(r, 1200));

      // 9. Machine Ready
      this.notify('Machine Ready', 100);
      await new Promise((r) => setTimeout(r, 1500));

      this.isProcessing = false;
      this.activeOrder = null;
      return true;
    } catch (err: any) {
      logMessage('ERROR', `Automation pipeline failed: ${err.message}`);
      await logMachineEvent(machineId, `Order ${order.id} printing failed: ${err.message}`);
      
      // Fallback: reset status so it can be retried
      try {
        await updateOrderState(order.id, 'received');
      } catch {}

      this.isProcessing = false;
      this.activeOrder = null;
      throw err;
    }
  }
}

// Log utility bridge
function logMessage(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  console.log(`[${level}] ${message}`);
}
