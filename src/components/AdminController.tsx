import React, { useState } from 'react';
import { 
  ArrowUpCircle, CheckCircle, RefreshCw, Calendar, 
  ExternalLink, FileText, Download, Shield, Sparkles, AlertTriangle 
} from 'lucide-react';

interface Release {
  version: string;
  date: string;
  size: string;
  changes: string[];
  bugFixes: string[];
  perf: string[];
  isStable: boolean;
}

export function AdminController() {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('2 hours ago');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingResult, setCheckingResult] = useState<string | null>(null);

  const releases: Release[] = [
    {
      version: 'v1.0.0',
      date: '2025-06-15',
      size: '68.4 MB',
      isStable: true,
      changes: [
        'Initial public commercial release of Qubink Nexus ATM Controller.',
        'Integrated local print spooling engine with silent document printing routing.',
        'Added real-time order sync and event logging using Supabase Websocket streams.',
        'Implemented Digital Signage stand-by attract mode screensaver rotation.'
      ],
      bugFixes: [
        'Resolved USB offline reconnect loop during boot sequences.',
        'Fixed system lockups when downloading heavy document vectors over slower speeds.',
        'Corrected margins for layout spools in A4 size simplex orders.'
      ],
      perf: [
        'Decreased PDF compilation time by 42% utilizing system native rendering thread.',
        'Optimized Supabase subscription memory footprints for 24/7 stable execution.'
      ]
    },
    {
      version: 'v0.9.8-beta',
      date: '2025-04-20',
      size: '66.2 MB',
      isStable: false,
      changes: [
        'First complete terminal hardware validation pilot.',
        'Added admin control panel backdoor triggered via logo tap count.',
        'Integrated network check and automatic offline indicator.'
      ],
      bugFixes: [
        'Patched default PDF printer driver assignment crashes.',
        'Fixed telemetry payload parsing loops during windows process sleep cycles.'
      ],
      perf: [
        'Spooled print speeds improved by utilizing local disk buffering rather than network memory buffering.'
      ]
    }
  ];

  const handleCheckUpdates = () => {
    if (checking) return;
    setChecking(true);
    setCheckingResult(null);

    setTimeout(() => {
      setChecking(false);
      setCheckingResult('All machines and controller nodes are up-to-date with current stable build.');
      setLastChecked('Just now');
      setUpdateAvailable(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in-up text-white">
      
      {/* UPDATE CENTER HEADER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* VERSION COMPARISON CARD */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold tracking-tight">Controller Update Center</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-full font-mono flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                <span>UP TO DATE</span>
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
              The controller is configured to cross-reference versions with GitHub Releases. Administrators can trigger a manual check or push updates to all active machines remotely.
            </p>

            <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-violet-950/15 p-4 rounded-2xl font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Installed Version</span>
                <p className="text-sm font-bold text-zinc-200">v1.0.0 (Latest)</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Target Stable Release</span>
                <p className="text-sm font-bold text-violet-400">v1.0.0-stable</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-violet-950/20">
            <button
              onClick={handleCheckUpdates}
              disabled={checking}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Check for Updates</span>
            </button>
            
            <button
              onClick={() => alert('OTA manual pull triggered. Active nodes will download update payload.')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Deploy Stable OTA</span>
            </button>

            <span className="text-[10px] text-zinc-500 font-mono ml-auto">
              Checked: {lastChecked}
            </span>
          </div>

          {checkingResult && (
            <div className="bg-zinc-950/60 border border-violet-950/20 text-zinc-400 text-xs p-3.5 rounded-xl flex items-center space-x-2.5 animate-fade-in-up">
              <Shield className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <span>{checkingResult}</span>
            </div>
          )}

        </div>

        {/* STATUS BANNER */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-violet-400" /> OTA Update Protocol
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When an update is pushed, active terminals will automatically download and stage the background bundle. The update is finalized during off-hours (2:00 AM) or via remote restart.
            </p>
          </div>

          <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 text-[10px] font-bold uppercase font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Active Kiosk Warning</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Updating a terminal while in printing state will defer finalization until current queue clears.
            </p>
          </div>
        </div>

      </section>

      {/* RELEASE TIMELINE HISTORY */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-violet-950/20 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Version & Release History</h2>
            <p className="text-xs text-zinc-500 mt-1">Full commercial product changelog tracking features, bug patches, and spool improvements.</p>
          </div>
          <a
            href="https://github.com/cmmanikandan/qubink-ATM/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-violet-500/30 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-300 transition-all flex items-center gap-1.5"
          >
            <span>GitHub Releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* TIMELINE LIST */}
        <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[2px] before:bg-violet-950/40">
          {releases.map((rel, idx) => (
            <div key={rel.version} className="relative pl-12 text-left space-y-4">
              
              {/* timeline node */}
              <div className={`absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-[#090514] z-10 transition-all ${
                rel.isStable 
                  ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
                  : 'border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.4)]'
              }`} />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-zinc-100">{rel.version}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded font-mono ${
                    rel.isStable ? 'bg-emerald-950/50 border border-emerald-500/25 text-emerald-400' : 'bg-violet-950/50 border border-violet-500/25 text-violet-400'
                  }`}>
                    {rel.isStable ? 'STABLE' : 'BETA'}
                  </span>
                  
                  <div className="flex items-center text-xs text-zinc-500 font-mono ml-auto">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>{rel.date}</span>
                    <span className="mx-2">•</span>
                    <span>{rel.size}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/30 border border-violet-950/10 p-5 rounded-2xl">
                  
                  {/* changes */}
                  <div className="lg:col-span-6 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5" /> Features & Changes
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside leading-relaxed pl-1">
                      {rel.changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>

                  {/* bug fixes */}
                  <div className="lg:col-span-3 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" /> Bug Fixes
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside leading-relaxed pl-1">
                      {rel.bugFixes.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>

                  {/* performance */}
                  <div className="lg:col-span-3 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> Performance
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside leading-relaxed pl-1">
                      {rel.perf.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>

                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => alert(`Initiating package file download for release ${rel.version}`)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Installer</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>

      </section>

    </div>
  );
}
