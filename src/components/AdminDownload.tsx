import React, { useState } from 'react';
import { 
  Download, FileText, ArrowRight, ShieldCheck, Terminal, 
  Cpu, HardDrive, Laptop, Wifi, ExternalLink, Printer, Info, CheckCircle2 
} from 'lucide-react';

export function AdminDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const startDownloadSimulation = (fileName: string) => {
    if (downloading) return;
    setDownloading(fileName);
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloading(null);
            // Trigger actual download of the release asset from GitHub
            const link = document.createElement('a');
            if (fileName.endsWith('.exe')) {
              link.href = 'https://github.com/cmmanikandan/qubink-ATM/releases/latest/download/Qubink-Nexus-Setup.exe';
            } else {
              link.href = 'https://github.com/cmmanikandan/qubink-ATM/releases/latest/download/Qubink-Nexus-Portable.zip';
            }
            link.target = '_blank';
            link.click();
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const steps = [
    { title: 'Download Installer', desc: 'Fetch the setup executable Qubink-Nexus-Setup.exe to your host system.', detail: 'Size: 68.4 MB' },
    { title: 'Run Setup Executable', desc: 'Double-click the installer. If Windows SmartScreen blocks it, choose "Run anyway".', detail: 'Publisher: Qubink Inc.' },
    { title: 'Install Software', desc: 'Follow the setup wizard instructions. Choose installation path and click Install.', detail: 'Est. time: 30 seconds' },
    { title: 'Launch Controller', desc: 'Open the Qubink Nexus shortcut on your Desktop or Start Menu.', detail: 'Runs inside custom Electron shell' },
    { title: 'Login with Machine ID', desc: 'Enter the Machine ID and password provided in your admin panel for this terminal.', detail: 'Auto-logs on startup' },
    { title: 'Connect Printer', desc: 'Connect the smart print ATM printer to the host system via USB.', detail: 'Detects online status in real-time' },
    { title: 'Run Test Print', desc: 'Enter the Admin PIN (9900) on the terminal controller and click "Send Test Print".', detail: 'Verifies queue communication' },
    { title: 'Machine Ready', desc: 'The controller enters Idle Signage Mode. The kiosk is now ready for customer orders.', detail: 'Status updates in cloud' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up text-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-950/40 border border-violet-950/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md shadow-[0_0_80px_rgba(124,58,237,0.05)]">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-600/10 rounded-full filter blur-[80px]" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full filter blur-[80px]" />

        <div className="space-y-4 max-w-xl text-left z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold tracking-wide font-mono uppercase">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" />
            <span>Windows Controller Release</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-violet-300 bg-clip-text text-transparent">
            QUBINK NEXUS™
          </h1>
          <p className="text-lg text-zinc-400 font-medium">
            Smart Print ATM Controller Node Software. Connect terminal peripherals, sync cloud queues, and orchestrate print transactions.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-zinc-500 pt-2">
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">Stable: v1.0.0</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">Build: 1.0.0.124</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">Size: ~68.4 MB</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">Platform: Windows x64</span>
          </div>
        </div>

        {/* Dynamic Graphic */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0 flex items-center justify-center bg-violet-950/20 border border-violet-500/10 rounded-3xl animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-blue-500/10 rounded-3xl" />
          <div className="absolute w-24 h-24 bg-violet-500/20 rounded-full filter blur-xl animate-pulse" />
          <div className="relative border border-violet-400/30 bg-zinc-950/80 rounded-2xl p-4 shadow-2xl flex flex-col items-center space-y-3 z-10 w-36">
            <Terminal className="w-10 h-10 text-violet-400" />
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">SYS STACK</p>
              <div className="w-16 h-1 bg-violet-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 w-4/5 animate-pulse" />
              </div>
            </div>
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD CARD & REQUIREMENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DOWNLOAD CARD */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-violet-950/20 pb-3">Download Packages</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* package 1 */}
              <div className="bg-zinc-950/50 border border-violet-950/20 hover:border-violet-500/30 p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-violet-600/10 rounded-xl">
                      <Download className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">RECOMMENDED</span>
                  </div>
                  <h3 className="font-bold text-base text-zinc-100">Windows Installer</h3>
                  <p className="text-xs text-zinc-400">
                    Full executable installer with automated desktop shortcut creation, start menu icons, and uninstaller.
                  </p>
                </div>
                <div className="space-y-3 pt-3">
                  <button 
                    onClick={() => startDownloadSimulation('Qubink-Nexus-Setup.exe')}
                    disabled={!!downloading}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Download Installer (.exe)</span>
                  </button>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>SHA-256 Verified</span>
                    <span>v1.0.0</span>
                  </div>
                </div>
              </div>

              {/* package 2 */}
              <div className="bg-zinc-950/50 border border-violet-950/20 hover:border-violet-500/30 p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-blue-600/10 rounded-xl">
                      <Download className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">PORTABLE</span>
                  </div>
                  <h3 className="font-bold text-base text-zinc-100">Portable Version</h3>
                  <p className="text-xs text-zinc-400">
                    Pre-compiled zip file containing direct binary. Run from any folder without system installation.
                  </p>
                </div>
                <div className="space-y-3 pt-3">
                  <button 
                    onClick={() => startDownloadSimulation('Qubink-Nexus-Portable.zip')}
                    disabled={!!downloading}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Download Portable (.zip)</span>
                  </button>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>Standalone Build</span>
                    <span>v1.0.0</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ACTIVE DOWNLOAD BAR */}
          {downloading && (
            <div className="bg-violet-950/10 border border-violet-500/20 rounded-2xl p-4 space-y-2 animate-fade-in-up">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-violet-300">Downloading {downloading}...</span>
                <span className="text-violet-400 font-bold">{downloadProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ADDITIONAL LINKS */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-violet-950/25">
            <a 
              href="https://github.com/cmmanikandan/qubink-ATM/releases" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center space-x-1.5 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open GitHub Releases</span>
            </a>
            <a 
              href="#installation-guide" 
              className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors flex items-center space-x-1.5 font-medium"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Release Notes</span>
            </a>
          </div>

        </div>

        {/* SYSTEM REQUIREMENTS */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-violet-950/20 pb-3 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-violet-400" /> System Requirements
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Verify terminal host matches the specifications below for seamless integration with Qubink Smart Spool engine.
            </p>

            <ul className="space-y-3.5 pt-2">
              {[
                { icon: Laptop, title: 'Operating System', desc: 'Windows 10 or 11 (64-bit)' },
                { icon: Cpu, title: 'Hardware Core', desc: 'Intel i3 / Ryzen 3, 4 GB RAM Min.' },
                { icon: Wifi, title: 'Connectivity', desc: 'High-speed active Internet connection' },
                { icon: Printer, title: 'Printing Node', desc: 'USB Printer connected with driver loaded' },
                { icon: ShieldCheck, title: 'Privilege', desc: 'Admin rights (required for Print Spooler control)' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start space-x-3 text-left">
                  <div className="p-1.5 bg-violet-600/10 rounded-lg shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 tracking-wide">{title}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-950/40 border border-violet-950/10 p-3 rounded-xl flex items-center space-x-2 text-[10px] text-zinc-500 font-mono mt-4">
            <Info className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Ensure print spooler service is enabled.</span>
          </div>
        </div>

      </section>

      {/* INSTALLATION GUIDE */}
      <section id="installation-guide" className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Step-by-Step Installation Guide</h2>
          <p className="text-xs text-zinc-500 mt-1">Detailed orchestration flow to deploy the controller node on any smart print ATM terminal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {steps.map((step, idx) => (
            <div key={idx} className="relative bg-zinc-950/30 border border-violet-950/10 hover:border-violet-500/20 p-5 rounded-2xl space-y-3 transition-all text-left">
              {/* Step indicator */}
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-violet-500/10 font-mono select-none">
                0{idx + 1}
              </div>
              
              <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 font-mono">
                S{idx + 1}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono border-t border-violet-950/20 pt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                <span>{step.detail}</span>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[42%] -right-4 translate-x-1/2 z-20">
                  <ArrowRight className="w-4 h-4 text-violet-500/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
