import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Cpu, HardDrive, Thermometer, Database, Wifi, WifiOff, 
  Printer, Clock, Lock, Settings, RefreshCw, Play, CheckCircle, 
  AlertCircle, LogOut, FileText, Sparkles, DollarSign, Layers, 
  AlertTriangle, ChevronRight, ListCollapse, BookOpen, User, ArrowUpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MachineAuthService } from './services/auth';
import type { MachineSession } from './services/auth';
import { fetchOrders, updateOrderState, logMachineEvent, subscribeToMachineOrders, fetchMachineLogs, updateMachineTelemetry } from './services/supabase';
import { AutomationPipelineService, PIPELINE_STEPS } from './services/automation';
import type { PipelineStep } from './services/automation';
import { 
  BootScreen, LoginScreen, IdleAdvertisement, ReadyScreen,
  CustomerConnected, UploadScreen, PaymentScreen, PrintingScreen, CompletedScreen
} from './components/ScreenComponents';
import { SetupWizard } from './components/SetupWizard';
import { UpdateDialog } from './components/UpdateDialog';
import { AdminCenter } from './components/AdminCenter';

// --- Types ---
interface SystemStats {
  cpu: number;
  ram: number;
  storage: number;
  temperature: number;
}

interface PrintJobDetails {
  id: number;
  documentName: string;
  jobStatus: string;
  totalPages: number;
  pagesPrinted: number;
}

interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
  isOnline: boolean;
  jobsCount: number;
  paperLevel: number;
  tonerLevel: number;
  connectionType?: 'USB' | 'Network' | 'WiFi' | 'Local';
  driverStatus?: string;
  driverName?: string;
  currentJobName?: string;
  jobsInQueue?: PrintJobDetails[];
}

class SoundService {
  private static ctx: AudioContext | null = null;
  
  private static init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static playBeep(freq = 440, duration = 0.1, type: OscillatorType = 'sine') {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  public static playOrderReceived() {
    this.playBeep(523.25, 0.15, 'triangle'); // C5
    setTimeout(() => this.playBeep(659.25, 0.15, 'triangle'), 150); // E5
    setTimeout(() => this.playBeep(783.99, 0.25, 'triangle'), 300); // G5
  }

  public static playSuccess() {
    this.playBeep(587.33, 0.15, 'sine'); // D5
    setTimeout(() => this.playBeep(880.00, 0.35, 'sine'), 100); // A5
  }

  public static playPrintStart() {
    this.playBeep(330, 0.2, 'sine');
    setTimeout(() => this.playBeep(440, 0.2, 'sine'), 200);
  }

  public static playError() {
    this.playBeep(180, 0.45, 'sawtooth');
  }
}

const AD_BANNERS = [
  { title: "WELCOME TO QUBINK", desc: "Scan QR ➔ Upload ➔ Pay ➔ Collect", highlight: "Smart Print ATM", sub: "Animated Background Loop" },
  { title: "PRINT IN LESS THAN 30 SECONDS", desc: "Fast • Secure • Contactless", highlight: "Super Fast Dispatch" },
  { title: "PRINT YOUR UNIVERSITY DOCUMENTS", desc: "Assignments • Projects • Certificates • Resumes • Hall Tickets • Notes", highlight: "Campus Central Ready" },
  { title: "UNIVERSAL FILE SUPPORT", desc: "PDF • DOCX • PPTX • PNG • JPG", highlight: "All Formats Welcome" },
  { title: "NO PEN DRIVE REQUIRED", desc: "Upload directly from your phone's browser or cloud storage.", highlight: "Zero Cable Hassles" },
  { title: "SECURE CLOUD PRINTING", desc: "Encrypted Upload ➔ Private Printing ➔ Automatic Document Destruction", highlight: "Data Safety First" },
  { title: "HOW IT WORKS IN 5 STEPS", desc: "1. Scan QR ➔ 2. Upload File ➔ 3. Choose Print Options ➔ 4. Pay Online ➔ 5. Collect Documents", highlight: "Quick Spool Flow" },
  { title: "FLEXIBLE PRINT OPTIONS", desc: "Black & White • Vibrant Color • Simplex/Duplex • A4/A3 Layouts • Multiple Copies", highlight: "Fully Custom Tailored" },
  { title: "WHY STUDENTS CHOOSE QUBINK", desc: "High-Speed Spooling • Professional Quality • Live Telemetry Tracking • Secure Payments", highlight: "Prime Kiosk Standards" },
  { title: "TODAY'S SPECIAL OFFERS", desc: "Bulk Printing Discounts • Exam Prep Specials • Student Union Promotions", highlight: "Active Discounts Live" },
  { title: "QUBINK TERMINAL ONLINE", desc: "Standby Mode Active ➔ Node Synced ➔ Local Printer Ready ➔ Scan To Spool", highlight: "Terminal Standby" },
  { title: "POWERED BY QUBINK NEXUS™", desc: "Commercial Grade Smart Print Kiosk Software Suite", highlight: "Industrial Grade ATM" }
];

export default function App() {
  const isPrinterOnlineRef = useRef<boolean | null>(null);
  
  // --- Setup Wizard & Update Dialog ---
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [pendingUpdateInfo, setPendingUpdateInfo] = useState<any>(null);

  // --- Screen State ---
  const [screen, setScreen] = useState<'boot' | 'login' | 'dashboard' | 'ad' | 'printing' | 'complete'>('boot');
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname.startsWith('/admin'));
  
  // --- Authentication State ---
  const [machineId, setMachineId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [autoLogin, setAutoLogin] = useState(true);
  const [session, setSession] = useState<MachineSession | null>(null);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Boot Sequence ---
  const [bootStep, setBootStep] = useState(0);
  const bootLogs = [
    "Initializing Machine...",
    "Loading Printer Spoolers...",
    "Connecting Cloud Database...",
    "Authenticating Machine Session...",
    "Ready"
  ];

  // --- Real-time Metrics ---
  const [systemStats, setSystemStats] = useState<SystemStats>({ cpu: 0, ram: 0, storage: 0, temperature: 0 });
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo>({
    name: 'Resolving Printer...', isDefault: true, status: 'Offline', isOnline: false, jobsCount: 0, paperLevel: 100, tonerLevel: 100
  });
  const [internetStatus, setInternetStatus] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Orders & Queue ---
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any | null>(null);
  const [nextJobs, setNextJobs] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [cancelledJobs, setCancelledJobs] = useState<any[]>([]);
  const [estimatedQueueTime, setEstimatedQueueTime] = useState<string>('0 mins');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showKioskToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Automation Printing Pipeline State ---
  const [activePipelineStep, setActivePipelineStep] = useState<PipelineStep>('Waiting For Orders');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [activePrintOrder, setActivePrintOrder] = useState<any | null>(null);

  // --- Live ATM Status Message ---
  const [liveStatusMessage, setLiveStatusMessage] = useState('Waiting for Customer');

  // --- Phase 3: Remote Control State ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [otaUpdateActive, setOtaUpdateActive] = useState(false);
  const [otaVersion, setOtaVersion] = useState('');
  const [queuePaused, setQueuePaused] = useState(false);

  // --- Screen Saver (Ad Mode) & Idle Watcher ---
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Admin Mode ---
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLogs, setAdminLogs] = useState<{ timestamp: string; level: string; message: string }[]>([]);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // --- Admin Route Listener ---
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- Initialization & Setup ---
  useEffect(() => {
    // 1. Boot screen ticks
    const bootInterval = setInterval(() => {
      setBootStep((prev) => {
        if (prev < bootLogs.length - 1) {
          return prev + 1;
        } else {
          clearInterval(bootInterval);
          checkSessionAndRoute();
          return prev;
        }
      });
    }, 1200);

    // 2. Clock update
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // 3. System metrics updates
    const statsInterval = setInterval(fetchStatsAndPrinter, 4000);

    // 4. Listen to native logs from Main process
    if (window.api && window.api.onSystemLog) {
      window.api.onSystemLog((_event, log) => {
        setAdminLogs((prev) => [log, ...prev].slice(0, 100));
      });
    }

    // 5. Watch online status
    const updateOnline = () => setInternetStatus(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    setInternetStatus(navigator.onLine);

    // 6. Phase 3: Remote command IPC listeners
    const cleanupListeners: Array<() => void> = [];
    if (window.api) {
      if (window.api.onRemoteMaintenanceMode) {
        const off = window.api.onRemoteMaintenanceMode((_e: any, enabled: boolean) => {
          setMaintenanceMode(enabled);
          setLiveStatusMessage(enabled ? 'Maintenance Mode Active' : 'Machine Ready');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemotePauseQueue) {
        const off = window.api.onRemotePauseQueue(() => {
          setQueuePaused(true);
          setLiveStatusMessage('Queue Paused By Admin');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemoteResumeQueue) {
        const off = window.api.onRemoteResumeQueue(() => {
          setQueuePaused(false);
          setLiveStatusMessage('Queue Resumed');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemoteClearQueue) {
        const off = window.api.onRemoteClearQueue(() => {
          setNextJobs([]);
          setLiveStatusMessage('Queue Cleared By Admin');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemoteTestPrint) {
        const off = window.api.onRemoteTestPrint(() => {
          window.api?.sendTestPrint('').catch(() => {});
          setLiveStatusMessage('Test Print Sent');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemoteOtaUpdate) {
        const off = window.api.onRemoteOtaUpdate((_e: any, data: { version: string }) => {
          setOtaUpdateActive(true);
          setOtaVersion(data.version);
          setLiveStatusMessage('Downloading OTA Update...');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onRemoteRestartPrinter) {
        const off = window.api.onRemoteRestartPrinter(() => {
          window.api?.restartPrinterSpooler();
          setLiveStatusMessage('Printer Spooler Restarting...');
        });
        if (off) cleanupListeners.push(off);
      }
      if (window.api.onPrinterStatusChanged) {
        const off = window.api.onPrinterStatusChanged((_e: any, status: any) => {
          console.log('Printer status event received:', status);
          
          if (isPrinterOnlineRef.current !== null && isPrinterOnlineRef.current !== status.isOnline) {
            if (!status.isOnline) {
              SoundService.playError();
              showKioskToast('USB printer disconnected.', 'error');
            } else {
              SoundService.playSuccess();
              showKioskToast('Printer connected successfully.', 'success');
            }
          }
          isPrinterOnlineRef.current = status.isOnline;

          setPrinterInfo(status);
          if (!status.isOnline) {
            setLiveStatusMessage('USB CONNECTION LOST');
          } else {
            setLiveStatusMessage(status.status === 'Ready' ? 'Machine Ready' : status.status);
          }
        });
        if (off) cleanupListeners.push(off);
      }
    }

    // ── Auto-Update Listener ──
    if (window.api?.onUpdateAvailable) {
      const off = window.api.onUpdateAvailable((_e: any, info: any) => {
        setPendingUpdateInfo(info);
        setShowUpdateDialog(true);
      });
      if (off) cleanupListeners.push(off);
    }

    return () => {
      clearInterval(bootInterval);
      clearInterval(clockInterval);
      clearInterval(statsInterval);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      cleanupListeners.forEach(fn => fn());
    };
  }, []);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    checkSessionAndRoute();
  };

  // --- Route after boot (checks first-run setup) ---
  const checkSessionAndRoute = async () => {
    try {
      // First-run check: if setup.json not found, show wizard
      const setupComplete = await window.api?.getSetupComplete?.();
      if (!setupComplete) {
        setShowSetupWizard(true);
        return;
      }

      const activeSession = await MachineAuthService.checkAutoLogin();
      if (activeSession) {
        setSession(activeSession);
        setMachineId(activeSession.machineId);
        setScreen('dashboard');
        startRealtimeSubscription(activeSession.machineId);
        resetIdleTimer();
        // Phase 3: Signal main process to start remote listener
        window.api?.notifyMachineAuthenticated?.(activeSession.machineId);
      } else {
        setScreen('login');
      }
    } catch {
      setScreen('login');
    }
  };

  // --- Fetch hardware stats and printer statuses ---
  const fetchStatsAndPrinter = async () => {
    if (!window.api) return;
    try {
      const stats = await window.api.getSystemStats();
      setSystemStats(stats);
      
      const printer = await window.api.getPrinterStatus();
      setPrinterInfo(printer);

      if (session) {
        updateMachineTelemetry(session.machineId, {
          status: maintenanceMode ? 'maintenance' : (screen === 'printing' ? 'printing' : 'online'),
          printer_status: printer.isOnline ? (printer.status === 'Ready' ? 'ready' : printer.status.toLowerCase()) : 'offline',
          paper_level: printer.paperLevel,
          toner_level: printer.tonerLevel,
          temperature: Math.round(stats.temperature || 0),
          software_version: '1.0.0'
        });
      }
    } catch (err) {
      console.error('Failed to query local hardware:', err);
    }
  };

  // --- Real-time subscription setup ---
  const startRealtimeSubscription = async (mId: string) => {
    try {
      // 1. Initial orders fetch
      await refreshOrdersQueue(mId);

      // 2. Realtime listen
      const unsubscribe = await subscribeToMachineOrders(mId, async (payload) => {
        console.log('Supabase Realtime Order Update:', payload);
        await refreshOrdersQueue(mId);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Failed to setup Realtime listeners:', err);
    }
  };

  // --- Refresh local orders queue lists ---
  const refreshOrdersQueue = async (mId: string) => {
    try {
      const list = await fetchOrders(mId);
      setOrdersList(list);

      // Wake up from Attract Mode if any customer scanned QR (pending order) or print starts
      const unpaidOrder = list.find((o: any) => o.payment_status === 'pending');
      const printingOrder = list.find((o: any) => o.status === 'printing' || o.status === 'received' || o.status === 'accepted');
      if (screen === 'ad' && (unpaidOrder || printingOrder)) {
        setScreen('dashboard');
        resetIdleTimer();
      }

      // Filter statuses
      const active = list.find((o: any) => o.status === 'printing');
      const next = list.filter((o: any) => o.status === 'received' || o.status === 'accepted');
      const completed = list.filter((o: any) => o.status === 'ready' || o.status === 'delivered');
      const cancelled = list.filter((o: any) => o.status === 'cancelled');

      setNextJobs(next);
      setCompletedJobs(completed);
      setCancelledJobs(cancelled);

      // Calculate queue wait
      const pendingPages = next.reduce((sum, job) => {
        let pages = 1;
        if (job.files) {
          try {
            const filesObj = typeof job.files === 'string' ? JSON.parse(job.files) : job.files;
            if (Array.isArray(filesObj)) {
              pages = filesObj.reduce((pSum, f) => pSum + (f.pages || 1), 0);
            }
          } catch {}
        }
        return sum + (pages * (job.copies || 1));
      }, 0);
      
      // Simulate 12 seconds per page printed
      const mins = Math.max(1, Math.round((pendingPages * 12) / 60));
      setEstimatedQueueTime(next.length === 0 ? '0 mins' : `${mins} mins`);

      // Trigger automatic pipeline processing
      if (!AutomationPipelineService.isPipelineRunning()) {
        const nextJob = list.find((o: any) => o.payment_status === 'paid' && o.status === 'received');
        if (nextJob) {
          triggerPrintJob(nextJob);
        }
      }
    } catch (err) {
      console.error('Failed to refresh orders list:', err);
    }
  };

  // --- Automation trigger ---
  const triggerPrintJob = async (order: any) => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    // Play Order Received sound chord
    SoundService.playOrderReceived();
    
    setActivePrintOrder(order);
    setScreen('printing');
    
    // Register listener for pipeline events
    const progressListener = (step: PipelineStep, progress: number) => {
      setActivePipelineStep(step);
      setPipelineProgress(progress);
      setLiveStatusMessage(step);
      
      // Play brief spool beep on print start phases
      if (step === 'Preparing Printer' && progress === 60) {
        SoundService.playPrintStart();
      }
    };

    setLiveStatusMessage('New Order Received!');
    AutomationPipelineService.addListener(progressListener);

    try {
      const success = await AutomationPipelineService.processOrder(order);
      if (success) {
        setScreen('complete');
        setLiveStatusMessage('Printing Completed!');
        // Play success sound and confetti
        SoundService.playSuccess();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        
        setTimeout(() => {
          setScreen('ad');
          setActivePrintOrder(null);
          setLiveStatusMessage('Machine Ready');
          startAdRotator();
        }, 10000); // Wait 10s then return to Attract Mode
      } else {
        SoundService.playError();
        setTimeout(() => {
          setScreen('ad');
          setActivePrintOrder(null);
          setLiveStatusMessage('Machine Ready');
          startAdRotator();
        }, 4000);
      }
    } catch (err) {
      console.error('Automation pipeline failed processing order:', err);
      SoundService.playError();
      setTimeout(() => {
        setScreen('ad');
        setActivePrintOrder(null);
        setLiveStatusMessage('Machine Ready');
        startAdRotator();
      }, 4000);
    } finally {
      AutomationPipelineService.removeListener(progressListener);
      if (session) refreshOrdersQueue(session.machineId);
    }
  };

  // --- Auth Actions ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !password) {
      setAuthError('All credentials are required.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');

    try {
      const activeSession = await MachineAuthService.login(machineId, password, rememberMe);
      setSession(activeSession);
      setScreen('dashboard');
      startRealtimeSubscription(activeSession.machineId);
      resetIdleTimer();
      // Phase 3: Signal main process to start remote listener
      window.api?.notifyMachineAuthenticated?.(activeSession.machineId);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to shut down this terminal session?')) {
      await MachineAuthService.logout();
      window.api?.notifyMachineLogout?.();
      setSession(null);
      setMaintenanceMode(false);
      setScreen('login');
    }
  };

  // --- Screen Saver / Ad Rotator Watchers ---
  const resetIdleTimer = () => {
    if (screen === 'printing' || screen === 'complete' || screen === 'boot') return;
    
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    idleTimeoutRef.current = setTimeout(() => {
      if (screen === 'dashboard') {
        setScreen('ad');
        startAdRotator();
      }
    }, 20000); // 20s of inactivity triggers Screensaver
  };

  const startAdRotator = () => {
    setActiveAdIndex(0);
  };

  useEffect(() => {
    if (screen !== 'ad') return;

    const interval = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % AD_BANNERS.length);
    }, 5000); // Rotates banner every 5s

    return () => clearInterval(interval);
  }, [screen]);

  const wakeFromIdle = () => {
    if (screen === 'ad') {
      setScreen('dashboard');
      resetIdleTimer();
    }
  };

  // --- Admin Mode Backdoor ---
  const handleLogoClick = () => {
    const nextCount = logoClickCount + 1;
    setLogoClickCount(nextCount);
    if (nextCount >= 5) {
      setLogoClickCount(0);
      setIsAdminOpen(true);
      setAdminPin('');
      setAdminError('');
    }
    // Timeout to reset counts
    setTimeout(() => setLogoClickCount(0), 4000);
  };

  const verifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '9900') {
      setAdminError('');
      setIsAdminRoute(true);
      window.history.pushState(null, '', '/admin');
      setIsAdminOpen(false);
    } else {
      setAdminError('Access Denied. Pin Incorrect.');
    }
  };

  // --- Test Print trigger ---
  const handleAdminTestPrint = async () => {
    if (!printerInfo.name) {
      alert('Test Print Failed: No default printer detected.');
      return;
    }
    const ok = await window.api.sendTestPrint(printerInfo.name);
    if (ok) {
      alert('Test Print Successful');
    } else {
      alert('Test Print Failed');
    }
  };

  // --- Restart Spooler ---
  const handleAdminSpoolerRestart = async () => {
    const success = await window.api.restartPrinterSpooler();
    if (success) {
      alert('Windows Print Spooler restart command sent.');
    } else {
      alert('Spooler restart failed. Ensure app runs as Administrator.');
    }
  };

  const renderCenterPanel = () => {
    // If active print order is running
    if (activePrintOrder) {
      if (screen === 'complete') {
        return <CompletedScreen activePrintOrder={activePrintOrder} />;
      }
      
      // In progress printing
      if (pipelineProgress < 30) {
        return <UploadScreen activePrintOrder={activePrintOrder} pipelineProgress={pipelineProgress} />;
      }
      
      return (
        <PrintingScreen 
          activePrintOrder={activePrintOrder}
          pipelineProgress={pipelineProgress}
          activePipelineStep={activePipelineStep}
          pipelineSteps={PIPELINE_STEPS}
          printerInfo={printerInfo}
        />
      );
    }

    // If there is an unpaid pending order (customer is currently in checkout/upload)
    const unpaidOrder = ordersList.find(o => o.payment_status === 'pending');
    if (unpaidOrder) {
      return <PaymentScreen activePrintOrder={unpaidOrder} />;
    }

    // Default ready state
    return (
      <ReadyScreen 
        session={session}
        liveStatusMessage={liveStatusMessage}
        internetStatus={internetStatus}
        printerInfo={printerInfo}
      />
    );
  };

  // ─── FULL SCREEN SCREEN STATE SHORT-CIRCUITS ───
  const renderAppContent = () => {
    if (isAdminRoute) {
    return (
      <AdminCenter 
        onBackToKiosk={window.api ? () => {
          window.history.pushState(null, '', '/');
          setIsAdminRoute(false);
          setScreen('ad');
          startAdRotator();
        } : undefined} 
      />
    );
  }

  if (maintenanceMode) {
    return (
      <div className="relative w-screen h-screen grid-bg overflow-hidden flex flex-col justify-center items-center text-white">
        <div className="absolute inset-0 bg-[#090514] flex flex-col items-center justify-center space-y-8 animate-fade-in-up">
          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
          <div className="relative p-6 bg-amber-950/30 border border-amber-500/30 rounded-full">
            <AlertTriangle className="h-20 w-20 text-amber-400" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold text-amber-400 tracking-widest">MAINTENANCE</h1>
            <p className="text-xl text-zinc-300 font-medium">This machine is temporarily unavailable.</p>
            <p className="text-zinc-500 text-sm font-mono max-w-sm text-center">
              Please use another nearby Qubink Smart Print ATM.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-amber-950/20 border border-amber-500/20 rounded-full px-6 py-3 text-xs font-mono text-amber-400">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            <span>Maintenance Mode Active • Controlled by Qubink Admin</span>
          </div>
        </div>
      </div>
    );
  }

  if (otaUpdateActive) {
    return (
      <div className="relative w-screen h-screen grid-bg overflow-hidden flex flex-col justify-center items-center text-white">
        <div className="absolute inset-0 bg-[#090514] flex flex-col items-center justify-center space-y-8 animate-fade-in-up">
          <div className="relative p-6 bg-violet-950/30 border border-violet-500/30 rounded-full">
            <RefreshCw className="h-16 w-16 text-violet-400 animate-spin" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold text-violet-400 tracking-widest">UPDATING</h1>
            <p className="text-zinc-300">Downloading Qubink Nexus™ {otaVersion} update...</p>
            <p className="text-zinc-600 text-xs font-mono">Do not power off this machine.</p>
          </div>
          <div className="w-64 h-2 bg-zinc-950 border border-violet-950/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (showSetupWizard) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (screen === 'boot') {
    return <BootScreen bootStep={bootStep} bootLogs={bootLogs} />;
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        machineId={machineId}
        setMachineId={setMachineId}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        autoLogin={autoLogin}
        setAutoLogin={setAutoLogin}
        authError={authError}
        isLoggingIn={isLoggingIn}
        handleLogin={handleLogin}
      />
    );
  }

  if (screen === 'ad') {
    return (
      <IdleAdvertisement 
        activeAdIndex={activeAdIndex} 
        adBanners={AD_BANNERS} 
        session={session}
        internetStatus={internetStatus}
        printerInfo={printerInfo}
        systemStats={systemStats}
      />
    );
  }

  return (
    <div 
      className="relative w-screen h-screen grid-bg overflow-hidden flex flex-col justify-between text-white font-sans"
      onClick={wakeFromIdle}
    >
      
      {/* ─── HEADER ─── */}
      <header className="glass-panel border-b border-violet-950/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img 
            src="logo.png" 
            className="h-9 w-auto cursor-pointer filter hover:brightness-110 active:scale-95 transition-all" 
            alt="Qubink Logo"
            onClick={handleLogoClick}
          />
          <div className="h-6 w-[1px] bg-zinc-800"></div>
          <div>
            <div className="text-sm font-bold tracking-tight">{session?.machineName || 'OFFLINE TERMINAL'}</div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-widest">{session?.machineId || 'QBK-ATM-OFFLINE'}</div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-zinc-400">
          <div className="flex items-center space-x-2 font-mono">
            <Clock className="h-4 w-4 text-violet-500" />
            <span>{currentTime.toLocaleDateString()}</span>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800"></div>

          {/* Connection Indicators */}
          <div className="flex items-center space-x-4 font-mono text-[10px] uppercase">
            <div className="flex items-center space-x-1">
              {internetStatus ? (
                <>
                  <Wifi className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500">NET ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500 animate-pulse" />
                  <span className="text-red-500">NET OFFLINE</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <Database className={`h-4 w-4 ${session ? 'text-emerald-500' : 'text-zinc-600 animate-pulse'}`} />
              <span className={session ? 'text-emerald-500' : 'text-zinc-500'}>{session ? 'CLOUD SYNCED' : 'CLOUD OFF'}</span>
            </div>

            <div className="flex items-center space-x-1.5 font-bold">
              <span className={printerInfo.isOnline ? 'text-emerald-500 animate-pulse' : 'text-red-500'}>
                {printerInfo.isOnline ? '🟢 Printer Connected' : '🔴 Printer Offline'}
              </span>
            </div>
          </div>

          {session && (
            <button 
              onClick={handleLogout} 
              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Logout Machine"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN APP WORKSPACE ─── */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 h-[calc(100vh-140px)]">
        
        {/* LEFT PANEL: MACHINE HEALTH */}
        <section className="col-span-3 glass-panel rounded-2xl p-4 flex flex-col space-y-6 overflow-hidden">
          <div className="flex justify-between items-center border-b border-violet-950/20 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Machine Health</h3>
            <Activity className="h-4 w-4 text-violet-500 animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col justify-between py-2 space-y-4 font-mono text-xs text-zinc-400">
            <div className="space-y-3.5 bg-zinc-950/40 border border-violet-950/30 p-3.5 rounded-2xl">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Device Name</span>
                <span className="text-zinc-200 font-bold truncate text-[11px]" title={printerInfo.name}>{printerInfo.name}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Driver Specification</span>
                <span className="text-zinc-200 font-semibold truncate text-[11px]" title={printerInfo.driverName}>{printerInfo.driverName || 'Generic / Text Only'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Connection Type</span>
                <span className="px-2 py-0.5 bg-violet-950/70 border border-violet-500/20 text-violet-300 rounded font-bold uppercase">{printerInfo.connectionType || 'USB'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">USB Connectivity</span>
                <span className={`font-bold ${printerInfo.connectionType === 'USB' && printerInfo.isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {printerInfo.connectionType === 'USB' && printerInfo.isOnline ? 'CONNECTED' : 'LOCAL'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Print Status</span>
                <span className={`font-bold uppercase ${printerInfo.isOnline ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>{printerInfo.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Jobs In Queue</span>
                <span className="text-zinc-200 font-bold">{printerInfo.jobsCount}</span>
              </div>
            </div>

            <div className="h-[1px] bg-violet-950/20"></div>

            {/* Paper Level */}
            <div className="space-y-1 bg-zinc-950/30 p-2.5 rounded-xl border border-violet-950/10">
              <div className="flex justify-between text-xs">
                <span className="flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <span>Paper Capacity</span>
                </span>
                <span className="font-bold text-zinc-200">{printerInfo.paperLevel}%</span>
              </div>
              <div className="h-2.5 bg-zinc-950 border border-violet-950/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${printerInfo.paperLevel < 15 ? 'bg-red-500' : 'bg-teal-500'}`} 
                  style={{ width: `${printerInfo.paperLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Toner Level */}
            <div className="space-y-1 bg-zinc-950/30 p-2.5 rounded-xl border border-violet-950/10">
              <div className="flex justify-between text-xs">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-fuchsia-400" />
                  <span>Laser Toner Level</span>
                </span>
                <span className="font-bold text-zinc-200">{printerInfo.tonerLevel}%</span>
              </div>
              <div className="h-2.5 bg-zinc-950 border border-violet-950/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${printerInfo.tonerLevel < 10 ? 'bg-red-500 animate-pulse' : 'bg-fuchsia-500'}`} 
                  style={{ width: `${printerInfo.tonerLevel}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER PANEL */}
        <section className="col-span-6 flex flex-col space-y-6">
          <div className="flex-1 glass-panel rounded-2xl flex flex-col justify-center items-center p-8 relative overflow-hidden">
            {renderCenterPanel()}
          </div>
        </section>

        {/* RIGHT PANEL: LIVE QUEUES */}
        <section className="col-span-3 glass-panel rounded-2xl p-4 flex flex-col space-y-4 overflow-hidden">
          <div className="flex justify-between items-center border-b border-violet-950/20 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Job Queue Spooler</h3>
            <span className="px-2 py-0.5 bg-zinc-950 border border-violet-950/30 rounded text-[10px] font-mono text-zinc-500">
              Est: {estimatedQueueTime}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* CURRENT ACTIVE JOB */}
            {activePrintOrder && (
              <div>
                <div className="text-[10px] uppercase font-bold text-violet-500 tracking-wider mb-2 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping"></span>
                  <span>Printing Now</span>
                </div>
                <div className="bg-violet-950/20 border border-violet-500/30 p-3 rounded-xl flex flex-col space-y-2 shadow-[0_0_16px_rgba(139,92,246,0.1)]">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs text-violet-200">{activePrintOrder.student_name}</div>
                    <span className="px-2 py-0.5 bg-violet-600/20 border border-violet-500/30 rounded text-[9px] font-mono text-violet-400">
                      {activePrintOrder.id}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500" style={{ width: `${pipelineProgress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{activePrintOrder.color_mode?.toUpperCase()} • {activePrintOrder.copies || 1} Copies</span>
                    <span className="text-violet-400">{pipelineProgress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* NEXT JOBS SECTION */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Up Next ({nextJobs.length})</div>
              {nextJobs.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-700 border border-dashed border-zinc-800/60 rounded-lg font-mono">
                  Queue is empty
                </div>
              ) : (
                nextJobs.map((job, index) => {
                  // Estimate wait: previous jobs * 30s each, then +30s for this one
                  let pages = 1;
                  try {
                    const f = typeof job.files === 'string' ? JSON.parse(job.files) : job.files;
                    if (Array.isArray(f)) pages = f.reduce((s: number, x: any) => s + (x.pages || 1), 0);
                  } catch {}
                  const estSecs = (index + 1) * Math.max(30, pages * 8);
                  
                  return (
                    <div key={job.id} className="bg-zinc-950/40 border border-violet-950/10 p-3 rounded-xl flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-xs text-zinc-200">{job.student_name}</div>
                        <span className="px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 rounded text-[9px] font-mono text-violet-400">
                          {job.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                        <span>{job.copies || 1} Copies • {job.color_mode?.toUpperCase()}</span>
                        <span className="text-blue-400">~{estSecs}s</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="h-[1px] bg-violet-950/20 my-2"></div>

            {/* COMPLETED JOBS SECTION */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Completed ({completedJobs.length})</div>
              {completedJobs.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-700 font-mono">No completed jobs yet</div>
              ) : (
                completedJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="bg-zinc-950/15 border border-zinc-900 p-2.5 rounded-lg flex justify-between items-center text-xs opacity-75">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-300">{job.student_name}</span>
                      <span className="text-[9px] text-zinc-600 font-mono">{job.id}</span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER METRIC BANNER ─── */}
      <footer className="bg-zinc-950/80 border-t border-violet-950/20 px-6 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>QUBINK CAMPUS PRINT ECOSYSTEM</span>
        <span>CONTROLLER LOGS PORT: OK</span>
        <span>VERSION 1.0.0-ATM-PROD</span>
      </footer>

      {/* ─── ADMIN DASHBOARD MODAL ─── */}
      {isAdminOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in-up">
          <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 flex flex-col space-y-4 max-h-[90vh]">
            
            {/* Admin Header */}
            <div className="flex justify-between items-center border-b border-violet-950/30 pb-3">
              <div className="flex items-center space-x-3 text-violet-400">
                <Settings className="h-5 w-5" />
                <h3 className="font-bold text-lg text-white">Qubink Nexus™ Administrator Panel</h3>
              </div>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-xs rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Close Admin
              </button>
            </div>

            {/* Auth Gate for Admin (Enter PIN) */}
            {adminPin !== '9900' ? (
              <div className="flex-1 flex flex-col justify-center items-center py-12">
                <form onSubmit={verifyAdminPin} className="w-80 space-y-4 text-center">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Enter Admin Authorization PIN</label>
                    <input 
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-xl font-bold bg-zinc-950 border border-violet-950/50 rounded-lg p-3 focus:outline-none focus:border-violet-500 font-mono"
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminError('');
                      }}
                    />
                  </div>
                  {adminError && <div className="text-red-400 text-xs">{adminError}</div>}
                  <button 
                    type="submit"
                    className="w-full bg-violet-600 py-2.5 rounded-lg text-sm font-bold hover:bg-violet-500 cursor-pointer"
                  >
                    Unlock Diagnostic Tools
                  </button>
                </form>
              </div>
            ) : (
              // ADMIN CONTROL CENTER
              <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                
                {/* Options Panel */}
                <div className="col-span-3 flex flex-col space-y-3 pr-2 border-r border-violet-950/20">
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Diagnostic Spools</div>
                  
                  <button 
                    onClick={handleAdminTestPrint}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-violet-950/20 hover:border-violet-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-violet-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Send Test Print</div>
                      <div className="text-[10px] text-zinc-500">Prints diagnostic sheet to default</div>
                    </div>
                  </button>

                  <button 
                    onClick={handleAdminSpoolerRestart}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-violet-950/20 hover:border-violet-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Restart Windows Spooler</div>
                      <div className="text-[10px] text-zinc-500">Resets default printer queuing spool</div>
                    </div>
                  </button>

                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider pt-2">System Commands</div>

                  <button 
                    onClick={() => {
                      if(confirm('Relaunch the Electron Controller application?')) {
                        window.api.restartApp();
                      }
                    }}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-900 hover:border-violet-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Restart Controller App</div>
                      <div className="text-[10px] text-zinc-500">Triggers safe relaunch</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      if(confirm('Shut down the Windows OS? Kiosk will stop!')) {
                        window.api.shutdownSystem();
                      }
                    }}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-red-950/30 hover:border-red-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-semibold text-red-400">Shutdown Windows ATM</div>
                      <div className="text-[10px] text-zinc-500">Shuts down host operating system</div>
                    </div>
                  </button>

                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider pt-2">Kiosk Maintenance</div>

                  <button 
                    onClick={() => {
                      setPendingUpdateInfo(null);
                      setShowUpdateDialog(true);
                    }}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-900 hover:border-violet-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <ArrowUpCircle className="h-4 w-4 text-violet-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Check for Updates</div>
                      <div className="text-[10px] text-zinc-500">Manual update check & log</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm('Reconfigure this machine? Local settings will be wiped.')) {
                        window.api?.resetSetupConfig?.().then(() => {
                          setShowSetupWizard(true);
                          setIsAdminOpen(false);
                        });
                      }
                    }}
                    className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-900 hover:border-violet-500/30 rounded-xl transition-all flex items-center space-x-3 text-sm cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-zinc-400" />
                    <div>
                      <div className="font-semibold text-zinc-200">Reconfigure Kiosk</div>
                      <div className="text-[10px] text-zinc-500">Launch First-Run Setup</div>
                    </div>
                  </button>
                </div>

                {/* Printer Diagnostics & Telemetry Panel */}
                <div className="col-span-4 flex flex-col space-y-3 px-2 border-r border-violet-950/20 overflow-hidden h-[50vh]">
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Printer Diagnostics</div>
                  
                  <div className="bg-zinc-950/50 border border-violet-950/20 rounded-xl p-3.5 space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Device Name:</span>
                      <span className="text-zinc-200 truncate max-w-[130px] font-semibold" title={printerInfo.name}>{printerInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status:</span>
                      <span className={`font-bold uppercase ${printerInfo.isOnline ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`}>
                        {printerInfo.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Connection:</span>
                      <span className="text-zinc-200 font-semibold">{printerInfo.connectionType || 'USB'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Driver Health:</span>
                      <span className={`font-semibold ${printerInfo.driverStatus === 'Error' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {printerInfo.driverStatus || 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Jobs In Queue:</span>
                      <span className="text-zinc-200 font-semibold">{printerInfo.jobsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Current Job:</span>
                      <span className="text-zinc-200 truncate max-w-[130px]" title={printerInfo.currentJobName || 'None'}>
                        {printerInfo.currentJobName || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pt-1">Active Job Queue</div>
                  <div className="flex-1 bg-black border border-violet-950/30 rounded-xl p-2.5 overflow-y-auto space-y-2 font-mono text-[10px]">
                    {!printerInfo.jobsInQueue || printerInfo.jobsInQueue.length === 0 ? (
                      <div className="text-zinc-700 text-center py-4">No active spool print jobs.</div>
                    ) : (
                      printerInfo.jobsInQueue.map((job) => (
                        <div key={job.id} className="border-b border-zinc-900 pb-1.5 last:border-b-0 space-y-1">
                          <div className="flex justify-between text-zinc-300">
                            <span className="truncate max-w-[120px] font-semibold" title={job.documentName}>{job.documentName}</span>
                            <span className="text-[9px] px-1 bg-violet-950 text-violet-300 rounded font-semibold">{job.jobStatus}</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-zinc-500">
                            <span>Job ID: {job.id}</span>
                            <span>Pages: {job.pagesPrinted} / {job.totalPages}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Console Log Panel */}
                <div className="col-span-5 flex flex-col space-y-2 overflow-hidden h-[50vh]">
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider flex justify-between">
                    <span>Terminal Console Logs</span>
                    <span className="font-mono text-[9px] text-zinc-600">nexus.log</span>
                  </div>

                  <div className="flex-1 bg-black border border-violet-950/30 p-3 rounded-xl overflow-y-auto font-mono text-[11px] space-y-1.5 select-text selection:bg-violet-600/30">
                    {adminLogs.length === 0 ? (
                      <div className="text-zinc-700 text-center py-12">Console log streams are empty.</div>
                    ) : (
                      adminLogs.map((log, index) => (
                        <div key={index} className="flex items-start space-x-2 leading-relaxed">
                          <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp.split('T')[1].substring(0, 8)}]</span>
                          <span className={`shrink-0 select-none font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-blue-400'}`}>
                            [{log.level}]
                          </span>
                          <span className="text-zinc-300 break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── KIOSK TOAST NOTIFICATION ─── */}
      {toast && (
        <div className={`absolute bottom-16 right-6 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md z-[200] animate-fade-in-up flex items-center space-x-3 text-sm font-semibold tracking-wide transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50'
            : toast.type === 'error'
            ? 'bg-red-950/80 border-red-500/40 text-red-300 shadow-red-950/50'
            : 'bg-violet-950/80 border-violet-500/40 text-violet-300 shadow-violet-950/50'
        }`}>
          <span className="text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="font-mono text-xs tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* ─── AUTO UPDATE DIALOG ─── */}
      {showUpdateDialog && (
        <UpdateDialog 
          onClose={() => setShowUpdateDialog(false)} 
          initialInfo={pendingUpdateInfo}
        />
      )}

    </div>
  );
  };

  return (
    <div className="relative w-screen h-screen">
      {renderAppContent()}

      {/* ─── Electron Window Controls Overlay ─── */}
      {window.api && (
        <div className="fixed top-2.5 right-2.5 flex items-center space-x-1.5 z-[99999] opacity-45 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => window.api.minimizeWindow()} 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer font-bold text-xs"
            title="Minimize Window"
          >
            —
          </button>
          <button 
            onClick={() => window.api.toggleKiosk()} 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer font-mono text-[9px]"
            title="Toggle Kiosk Fullscreen"
          >
            🔲
          </button>
          <button 
            onClick={() => {
              if (confirm('Close Qubink Nexus app?')) {
                window.api.closeWindow();
              }
            }} 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-950/85 border border-red-900/40 text-red-400 hover:bg-red-650 hover:text-white transition-all cursor-pointer font-bold text-xs"
            title="Close App"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
