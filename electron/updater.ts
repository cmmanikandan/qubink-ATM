/**
 * Qubink Nexus™ — Auto-Updater Module
 * 
 * Handles:
 * - Automatic update checking on startup
 * - Download progress streaming to renderer
 * - Backup of user data before installing updates
 * - Restore from backup on failed updates
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';

// ─── Types ───
export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  info: UpdateInfo | null;
  progress: number;
}

const logPath = path.join(app.getPath('userData'), 'updater.log');

function updaterLog(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  const line = `[${new Date().toISOString()}] [UPDATER] [${level}] ${message}\n`;
  try { fs.appendFileSync(logPath, line); } catch {}
  console.log(line.trim());
}

// ─── Backup Before Update ───
export function backupBeforeUpdate(): string | null {
  try {
    const userData = app.getPath('userData');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(userData, 'backups', `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    const filesToBackup = [
      'setup.json',
      'nexus.log',
      'updater.log',
      'paper_level.txt',
      'toner_level.txt',
    ];

    for (const file of filesToBackup) {
      const src = path.join(userData, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(backupDir, file));
        updaterLog('INFO', `Backed up: ${file}`);
      }
    }

    // Backup credentials (encrypted blob)
    const credPath = path.join(userData, 'credentials.enc');
    if (fs.existsSync(credPath)) {
      fs.copyFileSync(credPath, path.join(backupDir, 'credentials.enc'));
      updaterLog('INFO', 'Backed up encrypted credentials.');
    }

    // Write backup manifest
    const manifest = {
      timestamp,
      appVersion: app.getVersion(),
      files: fs.readdirSync(backupDir)
    };
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    updaterLog('INFO', `Backup completed: ${backupDir}`);
    return backupDir;
  } catch (err: any) {
    updaterLog('ERROR', `Backup failed: ${err.message}`);
    return null;
  }
}

// ─── Restore From Latest Backup ───
export function restoreFromLatestBackup(): boolean {
  try {
    const userData = app.getPath('userData');
    const backupsDir = path.join(userData, 'backups');
    if (!fs.existsSync(backupsDir)) return false;

    const backups = fs.readdirSync(backupsDir)
      .filter(d => d.startsWith('backup-'))
      .sort()
      .reverse();

    if (backups.length === 0) return false;

    const latestBackup = path.join(backupsDir, backups[0]);
    const manifestPath = path.join(latestBackup, 'manifest.json');
    if (!fs.existsSync(manifestPath)) return false;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    updaterLog('INFO', `Restoring backup from version ${manifest.appVersion} (${manifest.timestamp})`);

    for (const file of manifest.files) {
      if (file === 'manifest.json') continue;
      const src = path.join(latestBackup, file);
      const dest = path.join(userData, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        updaterLog('INFO', `Restored: ${file}`);
      }
    }

    updaterLog('INFO', 'Restore from backup completed.');
    return true;
  } catch (err: any) {
    updaterLog('ERROR', `Restore failed: ${err.message}`);
    return false;
  }
}

// ─── List Available Backups ───
export function listBackups(): Array<{ timestamp: string; version: string; dir: string }> {
  try {
    const backupsDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupsDir)) return [];
    return fs.readdirSync(backupsDir)
      .filter(d => d.startsWith('backup-'))
      .sort().reverse()
      .map(dir => {
        const mPath = path.join(backupsDir, dir, 'manifest.json');
        if (!fs.existsSync(mPath)) return null;
        const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));
        return { timestamp: m.timestamp, version: m.appVersion, dir: path.join(backupsDir, dir) };
      })
      .filter(Boolean) as Array<{ timestamp: string; version: string; dir: string }>;
  } catch {
    return [];
  }
}

// ─── Initialize Auto-Updater ───
export function initAutoUpdater(win: BrowserWindow) {
  // Configure logger
  autoUpdater.logger = {
    info: (msg: any) => updaterLog('INFO', typeof msg === 'string' ? msg : JSON.stringify(msg)),
    warn: (msg: any) => updaterLog('WARN', typeof msg === 'string' ? msg : JSON.stringify(msg)),
    error: (msg: any) => updaterLog('ERROR', typeof msg === 'string' ? msg : JSON.stringify(msg)),
    debug: (_msg: any) => {}
  };

  // Allow pre-release updates? Set to false for stable only
  autoUpdater.allowPrerelease = false;
  autoUpdater.autoDownload = false; // Manual download trigger
  autoUpdater.autoInstallOnAppQuit = true;

  // ─── Event Handlers ───

  autoUpdater.on('checking-for-update', () => {
    updaterLog('INFO', 'Checking for updates...');
    if (!win.isDestroyed()) {
      win.webContents.send('update-checking');
    }
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    updaterLog('INFO', `Update available: v${info.version}`);
    if (!win.isDestroyed()) {
      win.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes || '',
        currentVersion: app.getVersion()
      });
    }
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    updaterLog('INFO', `Already on latest version: v${info.version}`);
    if (!win.isDestroyed()) {
      win.webContents.send('update-not-available', {
        version: info.version,
        currentVersion: app.getVersion()
      });
    }
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    updaterLog('INFO', `Download progress: ${Math.round(progress.percent)}%`);
    if (!win.isDestroyed()) {
      win.webContents.send('update-download-progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
    }
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    updaterLog('INFO', `Update downloaded: v${info.version}. Backing up before install...`);
    backupBeforeUpdate();
    if (!win.isDestroyed()) {
      win.webContents.send('update-downloaded', {
        version: info.version,
        currentVersion: app.getVersion()
      });
    }
  });

  autoUpdater.on('error', (err: Error) => {
    updaterLog('ERROR', `Auto-updater error: ${err.message}`);
    if (!win.isDestroyed()) {
      win.webContents.send('update-error', { message: err.message });
    }
  });

  // ─── IPC Handlers ───

  ipcMain.handle('check-for-updates', async () => {
    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (err: any) {
      updaterLog('ERROR', `Manual check failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err: any) {
      updaterLog('ERROR', `Download failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('install-update', () => {
    updaterLog('INFO', 'Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-update-backups', () => {
    return listBackups();
  });

  ipcMain.handle('restore-backup', () => {
    return restoreFromLatestBackup();
  });

  // ─── Auto-check on startup (delayed 5s after app ready) ───
  setTimeout(async () => {
    try {
      updaterLog('INFO', 'Running scheduled startup update check...');
      await autoUpdater.checkForUpdates();
    } catch (err: any) {
      updaterLog('WARN', `Startup update check failed (likely dev mode or no internet): ${err.message}`);
    }
  }, 5000);

  updaterLog('INFO', `Auto-updater initialized. App version: ${app.getVersion()}`);
}
