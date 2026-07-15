import React, { useState, useEffect } from 'react';
import { 
  Download, RefreshCw, X, ArrowUpCircle, 
  CheckCircle, AlertCircle, Loader2, Clock, 
  Package, History
} from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: any;
  currentVersion: string;
}

interface UpdateDialogProps {
  onClose: () => void;
  initialInfo?: UpdateInfo | null;
}

type UpdateState = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export function UpdateDialog({ onClose, initialInfo }: UpdateDialogProps) {
  const [state, setState] = useState<UpdateState>(initialInfo ? 'available' : 'idle');
  const [info, setInfo] = useState<UpdateInfo | null>(initialInfo || null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [tab, setTab] = useState<'update' | 'changelog'>('update');
  const [backups, setBackups] = useState<Array<{ timestamp: string; version: string }>>([]);

  useEffect(() => {
    // Load current app version
    window.api?.getAppVersion?.().then(v => setAppVersion(v)).catch(() => {});
    // Load backup history
    window.api?.getUpdateBackups?.().then(b => setBackups(b)).catch(() => {});

    // Wire update event listeners
    const cleanups: Array<() => void> = [];

    if (window.api?.onUpdateChecking) {
      const off = window.api.onUpdateChecking(() => setState('checking'));
      if (off) cleanups.push(off);
    }

    if (window.api?.onUpdateAvailable) {
      const off = window.api.onUpdateAvailable((_e, info) => {
        setInfo(info);
        setState('available');
      });
      if (off) cleanups.push(off);
    }

    if (window.api?.onUpdateNotAvailable) {
      const off = window.api.onUpdateNotAvailable(() => setState('not-available'));
      if (off) cleanups.push(off);
    }

    if (window.api?.onUpdateDownloadProgress) {
      const off = window.api.onUpdateDownloadProgress((_e, p) => {
        setProgress(p.percent);
        setState('downloading');
      });
      if (off) cleanups.push(off);
    }

    if (window.api?.onUpdateDownloaded) {
      const off = window.api.onUpdateDownloaded(() => setState('downloaded'));
      if (off) cleanups.push(off);
    }

    if (window.api?.onUpdateError) {
      const off = window.api.onUpdateError((_e, err) => {
        setError(err.message);
        setState('error');
      });
      if (off) cleanups.push(off);
    }

    return () => cleanups.forEach(fn => fn());
  }, []);

  const handleCheck = async () => {
    setState('checking');
    setError('');
    const result = await window.api?.checkForUpdates?.();
    if (!result?.success) {
      setError(result?.error || 'Unable to check for updates. Check your internet connection.');
      setState('error');
    }
  };

  const handleDownload = async () => {
    setState('downloading');
    setProgress(0);
    const result = await window.api?.downloadUpdate?.();
    if (!result?.success) {
      setError(result?.error || 'Download failed.');
      setState('error');
    }
  };

  const handleInstall = () => {
    window.api?.installUpdate?.();
  };

  const releaseNotesText = typeof info?.releaseNotes === 'string'
    ? info.releaseNotes
    : Array.isArray(info?.releaseNotes)
    ? info.releaseNotes.map((r: any) => r.note || r).join('\n')
    : 'No release notes available.';

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-zinc-950/95 border border-violet-950/50 rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.12)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Software Updates</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Qubink Nexus™ {appVersion && `v${appVersion}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-900">
          {[
            { id: 'update', label: 'Update', icon: Package },
            { id: 'changelog', label: 'Backup History', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all ${
                tab === id ? 'text-violet-400 border-b-2 border-violet-500' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'update' && (
            <div className="space-y-5">
              
              {/* Status Card */}
              {state === 'idle' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 mx-auto bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Check for Updates</p>
                    <p className="text-zinc-500 text-xs mt-1">Currently running Qubink Nexus™ {appVersion && `v${appVersion}`}</p>
                  </div>
                  <button
                    onClick={handleCheck}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Check Now
                  </button>
                </div>
              )}

              {state === 'checking' && (
                <div className="text-center space-y-3 py-6">
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
                  <p className="text-zinc-400 text-sm">Checking for updates...</p>
                </div>
              )}

              {state === 'not-available' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">You're up to date!</p>
                    <p className="text-zinc-500 text-xs mt-1">Qubink Nexus™ {appVersion && `v${appVersion}`} is the latest version.</p>
                  </div>
                  <button onClick={handleCheck} className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 mx-auto transition-colors">
                    <RefreshCw className="w-3 h-3" /> Check again
                  </button>
                </div>
              )}

              {state === 'available' && info && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-violet-950/30 border border-violet-500/20 rounded-2xl">
                    <ArrowUpCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">Update Available — v{info.version}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Current: v{info.currentVersion}
                        {info.releaseDate && ` • Released: ${new Date(info.releaseDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  {releaseNotesText && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 max-h-32 overflow-y-auto">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Release Notes</p>
                      <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{releaseNotesText}</p>
                    </div>
                  )}

                  <div className="p-3 bg-amber-950/20 border border-amber-500/15 rounded-xl flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-[11px]">A backup of your machine settings will be created automatically before installing.</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-400 font-semibold text-sm rounded-xl transition-all">
                      Later
                    </button>
                    <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all">
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              )}

              {state === 'downloading' && (
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <Download className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                    <p className="text-white font-bold text-sm">Downloading Update...</p>
                    <p className="text-zinc-500 text-xs mt-1">{Math.round(progress)}% complete</p>
                  </div>
                  <div className="h-2.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] text-zinc-600 font-mono">Do not close the application during download.</p>
                </div>
              )}

              {state === 'downloaded' && (
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Update Ready to Install!</p>
                      <p className="text-zinc-500 text-xs mt-1">The application will restart to complete the update.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleInstall}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Restart & Install
                  </button>
                </div>
              )}

              {state === 'error' && (
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-white font-bold text-sm">Update Failed</p>
                    <p className="text-zinc-500 text-xs mt-1">{error}</p>
                  </div>
                  <button onClick={handleCheck} className="w-full py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-400 font-semibold text-sm rounded-xl transition-all">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'changelog' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pre-Update Backups</p>
                <span className="text-[10px] text-zinc-600 font-mono">{backups.length} saved</span>
              </div>
              {backups.length === 0 ? (
                <div className="text-center py-8 text-zinc-600">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No backups yet. Backups are created automatically before each update.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {backups.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-zinc-300">Version {b.version}</p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{new Date(b.timestamp).toLocaleString()}</p>
                      </div>
                      {i === 0 && <span className="text-[9px] font-bold text-violet-400 bg-violet-950/50 px-2 py-0.5 rounded-full">LATEST</span>}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-zinc-600 text-center">Backups are stored in your AppData folder and restored automatically if an update fails.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
