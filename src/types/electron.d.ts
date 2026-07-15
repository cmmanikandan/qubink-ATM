import { SystemStats, PrinterInfo, PrintJobOptions } from '../../electron/preload';

export interface ElectronAPI {
  getMachineInfo: () => Promise<{
    os: string;
    arch: string;
    hostname: string;
    platform: string;
    version: string;
  }>;
  getEnv: () => Promise<{
    supabaseUrl: string;
    supabaseAnonKey: string;
    firebaseApiKey: string;
    firebaseAuthDomain: string;
    firebaseProjectId: string;
    firebaseStorageBucket: string;
    firebaseMessagingSenderId: string;
    firebaseAppId: string;
    cloudinaryCloudName: string;
  }>;
  getSystemStats: () => Promise<SystemStats>;
  getPrinterStatus: () => Promise<PrinterInfo>;
  sendTestPrint: (printerName: string) => Promise<boolean>;
  restartPrinterSpooler: () => Promise<boolean>;
  downloadAndPrint: (options: PrintJobOptions, orderId: string) => Promise<boolean>;
  saveSession: (sessionData: string) => Promise<boolean>;
  getSession: () => Promise<string | null>;
  clearSession: () => Promise<boolean>;
  restartApp: () => void;
  restartSystem: () => void;
  shutdownSystem: () => void;
  minimizeWindow: () => void;
  closeWindow: () => void;
  toggleKiosk: () => void;
  notifyMachineAuthenticated?: (machineId: string) => void;
  notifyMachineLogout?: () => void;
  pushTelemetry?: (data: { paperLevel: number; tonerLevel: number; temperature: number; printerStatus: string }) => void;
  reportRevenue?: (amount: number) => void;
  onPrintProgress: (callback: (event: any, status: { step: string; progress: number }) => void) => () => void;
  onPrinterStatusChanged: (callback: (event: any, status: PrinterInfo) => void) => () => void;
  onSystemLog: (callback: (event: any, log: { timestamp: string; level: string; message: string }) => void) => () => void;
  onRemoteMaintenanceMode?: (callback: (event: any, enabled: boolean) => void) => () => void;
  onRemotePauseQueue?: (callback: () => void) => () => void;
  onRemoteResumeQueue?: (callback: () => void) => () => void;
  onRemoteClearQueue?: (callback: () => void) => () => void;
  onRemoteTestPrint?: (callback: () => void) => () => void;
  onRemoteOtaUpdate?: (callback: (event: any, data: { version: string }) => void) => () => void;
  onRemoteRestartPrinter?: (callback: () => void) => () => void;

  // ── Auto-Updater ──
  getAppVersion?: () => Promise<string>;
  checkForUpdates?: () => Promise<{ success: boolean; error?: string }>;
  downloadUpdate?: () => Promise<{ success: boolean; error?: string }>;
  installUpdate?: () => Promise<void>;
  getUpdateBackups?: () => Promise<Array<{ timestamp: string; version: string; dir: string }>>;
  restoreBackup?: () => Promise<boolean>;
  onUpdateChecking?: (callback: () => void) => () => void;
  onUpdateAvailable?: (callback: (event: any, info: { version: string; releaseDate: string; releaseNotes: any; currentVersion: string }) => void) => () => void;
  onUpdateNotAvailable?: (callback: (event: any, info: { version: string; currentVersion: string }) => void) => () => void;
  onUpdateDownloadProgress?: (callback: (event: any, progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => () => void;
  onUpdateDownloaded?: (callback: (event: any, info: { version: string; currentVersion: string }) => void) => () => void;
  onUpdateError?: (callback: (event: any, err: { message: string }) => void) => () => void;

  // ── First-Run Setup ──
  getSetupComplete?: () => Promise<boolean>;
  getSetupConfig?: () => Promise<Record<string, string> | null>;
  saveSetupConfig?: (config: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  resetSetupConfig?: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
