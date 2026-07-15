import { contextBridge, ipcRenderer } from 'electron';

export interface SystemStats {
  cpu: number;
  ram: number;
  storage: number;
  temperature: number;
}

export interface PrintJobDetails {
  id: number;
  documentName: string;
  jobStatus: string;
  totalPages: number;
  pagesPrinted: number;
}

export interface PrinterInfo {
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

export interface PrintJobOptions {
  fileUrl: string;
  copies: number;
  colorMode: 'color' | 'mono' | string;
  paperSize: 'A4' | 'A3' | 'Letter' | string;
  duplex: 'simplex' | 'duplex' | string;
  orientation: 'portrait' | 'landscape' | string;
}

contextBridge.exposeInMainWorld('api', {
  // Machine details
  getMachineInfo: () => ipcRenderer.invoke('get-machine-info'),
  getEnv: (): Promise<any> => ipcRenderer.invoke('get-env'),

  // System stats (CPU, RAM, Disk, Temperature)
  getSystemStats: (): Promise<SystemStats> => ipcRenderer.invoke('get-system-stats'),

  // Printer status and diagnostics
  getPrinterStatus: (): Promise<PrinterInfo> => ipcRenderer.invoke('get-printer-status'),
  sendTestPrint: (printerName: string): Promise<boolean> => ipcRenderer.invoke('send-test-print', { printerName }),
  restartPrinterSpooler: (): Promise<boolean> => ipcRenderer.invoke('restart-printer-spooler'),

  // Printing Operations
  downloadAndPrint: (options: PrintJobOptions, orderId: string): Promise<boolean> => 
    ipcRenderer.invoke('download-and-print', { options, orderId }),

  // Local Session Management (DPAPI encrypted)
  saveSession: (sessionData: string): Promise<boolean> => ipcRenderer.invoke('save-session', { sessionData }),
  getSession: (): Promise<string | null> => ipcRenderer.invoke('get-session'),
  clearSession: (): Promise<boolean> => ipcRenderer.invoke('clear-session'),

  // System actions (Admin panel)
  restartApp: () => ipcRenderer.send('restart-app'),
  restartSystem: () => ipcRenderer.send('restart-system'),
  shutdownSystem: () => ipcRenderer.send('shutdown-system'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleKiosk: () => ipcRenderer.send('toggle-kiosk'),

  // ── Phase 3: Remote command signals ──────────────────────────────────────
  // Signal main process that machine authenticated (starts remote listener)
  notifyMachineAuthenticated: (machineId: string) => ipcRenderer.send('machine-authenticated', machineId),
  // Signal logout
  notifyMachineLogout: () => ipcRenderer.send('machine-logout'),
  // Push printer telemetry to Supabase via main process
  pushTelemetry: (data: { paperLevel: number; tonerLevel: number; temperature: number; printerStatus: string }) =>
    ipcRenderer.send('update-machine-telemetry', data),
  // Report revenue from completed order
  reportRevenue: (amount: number) => ipcRenderer.send('update-revenue', amount),

  // Event Listeners
  onPrintProgress: (callback: (event: any, status: { step: string; progress: number }) => void) => {
    ipcRenderer.on('print-progress', callback);
    return () => ipcRenderer.removeListener('print-progress', callback);
  },

  onPrinterStatusChanged: (callback: (event: any, status: PrinterInfo) => void) => {
    ipcRenderer.on('printer-status-changed', callback);
    return () => ipcRenderer.removeListener('printer-status-changed', callback);
  },

  onSystemLog: (callback: (event: any, log: { timestamp: string; level: string; message: string }) => void) => {
    ipcRenderer.on('system-log', callback);
    return () => ipcRenderer.removeListener('system-log', callback);
  },

  // ── Phase 3: Remote command listeners ────────────────────────────────────
  onRemoteMaintenanceMode: (callback: (event: any, enabled: boolean) => void) => {
    ipcRenderer.on('remote-maintenance-mode', callback);
    return () => ipcRenderer.removeListener('remote-maintenance-mode', callback);
  },

  onRemotePauseQueue: (callback: () => void) => {
    ipcRenderer.on('remote-pause-queue', callback);
    return () => ipcRenderer.removeListener('remote-pause-queue', callback as any);
  },

  onRemoteResumeQueue: (callback: () => void) => {
    ipcRenderer.on('remote-resume-queue', callback);
    return () => ipcRenderer.removeListener('remote-resume-queue', callback as any);
  },

  onRemoteClearQueue: (callback: () => void) => {
    ipcRenderer.on('remote-clear-queue', callback);
    return () => ipcRenderer.removeListener('remote-clear-queue', callback as any);
  },

  onRemoteTestPrint: (callback: () => void) => {
    ipcRenderer.on('remote-test-print', callback);
    return () => ipcRenderer.removeListener('remote-test-print', callback as any);
  },

  onRemoteOtaUpdate: (callback: (event: any, data: { version: string }) => void) => {
    ipcRenderer.on('remote-ota-update', callback);
    return () => ipcRenderer.removeListener('remote-ota-update', callback);
  },

  onRemoteRestartPrinter: (callback: () => void) => {
    ipcRenderer.on('remote-restart-printer', callback);
    return () => ipcRenderer.removeListener('remote-restart-printer', callback as any);
  },

  // ── Auto-Updater ──────────────────────────────────────────────────────────
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getUpdateBackups: (): Promise<Array<{ timestamp: string; version: string; dir: string }>> => ipcRenderer.invoke('get-update-backups'),
  restoreBackup: (): Promise<boolean> => ipcRenderer.invoke('restore-backup'),

  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback);
    return () => ipcRenderer.removeListener('update-checking', callback as any);
  },

  onUpdateAvailable: (callback: (event: any, info: { version: string; releaseDate: string; releaseNotes: any; currentVersion: string }) => void) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },

  onUpdateNotAvailable: (callback: (event: any, info: { version: string; currentVersion: string }) => void) => {
    ipcRenderer.on('update-not-available', callback);
    return () => ipcRenderer.removeListener('update-not-available', callback);
  },

  onUpdateDownloadProgress: (callback: (event: any, progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => {
    ipcRenderer.on('update-download-progress', callback);
    return () => ipcRenderer.removeListener('update-download-progress', callback);
  },

  onUpdateDownloaded: (callback: (event: any, info: { version: string; currentVersion: string }) => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },

  onUpdateError: (callback: (event: any, err: { message: string }) => void) => {
    ipcRenderer.on('update-error', callback);
    return () => ipcRenderer.removeListener('update-error', callback);
  },

  // ── First-Run Setup Config ────────────────────────────────────────────────
  getSetupComplete: (): Promise<boolean> => ipcRenderer.invoke('get-setup-complete'),
  getSetupConfig: (): Promise<Record<string, string> | null> => ipcRenderer.invoke('get-setup-config'),
  saveSetupConfig: (config: Record<string, string>): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('save-setup-config', config),
  resetSetupConfig: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('reset-setup-config'),
});
