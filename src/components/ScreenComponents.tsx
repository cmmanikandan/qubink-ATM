import React from 'react';
import { 
  Printer, Cpu, HardDrive, Thermometer, Database, Wifi, WifiOff,
  Clock, Lock, Settings, RefreshCw, Play, CheckCircle, 
  AlertCircle, FileText, Sparkles, AlertTriangle, ChevronRight, User, CreditCard, ArrowUpRight
} from 'lucide-react';

interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
  isOnline: boolean;
  jobsCount: number;
  paperLevel: number;
  tonerLevel: number;
}

// ─── BOOT SCREEN ───
export function BootScreen({ bootStep, bootLogs }: { bootStep: number; bootLogs: string[] }) {
  return (
    <div className="absolute inset-0 bg-[#090514] flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8 animate-fade-in-up">
        <img src="logo.png" className="h-16 w-auto drop-shadow-[0_0_24px_rgba(124,58,237,0.5)] animate-pulse" alt="Qubink Logo" />
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
        
        <div className="w-80 bg-zinc-950/80 border border-violet-950/30 rounded-2xl p-5 space-y-3 shadow-2xl">
          <div className="text-[10px] font-mono text-zinc-500 flex justify-between tracking-widest uppercase">
            <span>SYSTEM DIAGNOSTIC</span>
            <span>BOOT SEQ</span>
          </div>
          <div className="h-[3px] bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-1000"
              style={{ width: `${(bootStep + 1) * 20}%` }}
            ></div>
          </div>
          <div className="space-y-1.5 pt-2 font-mono text-xs text-left">
            {bootLogs.slice(0, bootStep + 1).map((log, index) => (
              <div key={index} className="flex items-center space-x-2 text-violet-400">
                <span className="text-[10px] animate-pulse">▶</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ───
export function LoginScreen({
  machineId, setMachineId,
  password, setPassword,
  rememberMe, setRememberMe,
  autoLogin, setAutoLogin,
  authError, isLoggingIn,
  handleLogin
}: any) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#090514]">
      {/* Decorative glowing background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] animate-pulse"></div>

      <div className="glass-panel p-8 w-[420px] rounded-2xl animate-fade-in-up space-y-6 border border-violet-950/40 shadow-2xl z-50">
        <div className="flex flex-col items-center space-y-3">
          <img src="logo.png" className="h-12 w-auto" alt="Qubink Logo" />
          <h2 className="text-xl font-bold tracking-tight text-white">QUBINK NEXUS™</h2>
          <p className="text-xs text-zinc-400">ATM Machine Controller Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Machine ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Printer className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. QBK-ATM-001"
                className="w-full bg-zinc-950/50 border border-violet-950/40 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none transition-all font-mono text-violet-300"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Machine Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-zinc-950/50 border border-violet-950/40 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none transition-all text-violet-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="rounded border-zinc-800 text-violet-600 focus:ring-0 bg-transparent"
              />
              <span>Remember ATM</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoLogin} 
                onChange={(e) => setAutoLogin(e.target.checked)} 
                className="rounded border-zinc-800 text-violet-600 focus:ring-0 bg-transparent"
              />
              <span>Auto Login</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-bold transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-950/40"
          >
            {isLoggingIn ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Connecting Securely...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Boot Controller</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── IDLE ADVERTISEMENT SCREEN (DIGITAL SIGNAGE MODE) ───
export function IdleAdvertisement({ 
  activeAdIndex, 
  adBanners,
  session,
  internetStatus,
  printerInfo,
  systemStats
}: { 
  activeAdIndex: number; 
  adBanners: any[];
  session: any;
  internetStatus: boolean;
  printerInfo: PrinterInfo;
  systemStats: any;
}) {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const qrUrl = `https://qubink.vercel.app/atm/${session?.machineId || 'QBK-ATM-001'}`;

  // Static/Realistic Weather Telemetry
  const weatherTemp = 24;
  const weatherDesc = 'Cloudy';
  const atmLocation = session?.location || 'Campus Central Hub';

  return (
    <div className="absolute inset-0 w-screen h-screen bg-[#05030a] text-white flex flex-col justify-between p-6 z-50 overflow-hidden select-none animate-gradient bg-gradient-to-tr from-[#05030a] via-[#11082d] to-[#05030a]">
      {/* Background neon glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-violet-600/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-blue-600/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

      {/* 1. TOP HEADER ROW */}
      <header className="flex justify-between items-center w-full z-10 bg-zinc-950/45 border border-violet-950/20 px-6 py-3.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <img src="logo.png" className="h-9 w-auto filter drop-shadow-[0_0_12px_rgba(124,58,237,0.4)]" alt="Logo" />
          <div className="h-5 w-[1px] bg-zinc-800"></div>
          <span className="text-xs font-mono font-bold tracking-widest text-violet-400 uppercase">
            {atmLocation}
          </span>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono text-zinc-400">
          {/* Weather Pill */}
          <div className="flex items-center space-x-2 bg-violet-950/20 border border-violet-500/10 px-3 py-1.5 rounded-full">
            <span className="text-violet-300">☀ {weatherTemp}°C • {weatherDesc}</span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-850"></div>

          {/* Clock */}
          <div className="flex items-center space-x-2.5">
            <Clock className="h-4 w-4 text-violet-500 animate-spin" style={{ animationDuration: '20s' }} />
            <span className="text-zinc-200 font-bold tracking-wider">
              {time.toLocaleDateString()}
            </span>
            <span className="text-violet-400 font-extrabold tracking-widest text-sm bg-violet-950/30 border border-violet-500/20 px-2.5 py-1 rounded-lg">
              {time.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CORE SIGNAGE BODY */}
      <main className="flex-1 grid grid-cols-12 gap-6 my-6 items-center overflow-hidden z-10">
        
        {/* Left/Center Slides Panel (col-span-8) */}
        <section className="col-span-8 h-full flex flex-col justify-center items-start text-left pl-6 pr-4 space-y-6 relative">
          <div key={activeAdIndex} className="animate-fade-in-up w-full space-y-4">
            
            {/* Banner Category Badge */}
            <span className="inline-block text-[11px] font-extrabold px-4 py-1.5 bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-violet-500/35 text-violet-300 rounded-full tracking-widest uppercase">
              {adBanners[activeAdIndex].highlight}
            </span>

            {/* Banner Main Title */}
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white uppercase bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
              {adBanners[activeAdIndex].title}
            </h1>

            {/* Banner Description */}
            <p className="text-base lg:text-lg text-zinc-400 max-w-xl leading-relaxed">
              {adBanners[activeAdIndex].desc}
            </p>

            {/* Custom Animated Elements per Slide */}
            {activeAdIndex === 9 && ( // Slide 10: Special Offer animated card
              <div className="animate-float pt-2">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-4 rounded-xl shadow-lg border border-violet-400/30 text-white font-bold flex items-center space-x-4 max-w-sm">
                  <div className="text-3xl">🔥</div>
                  <div>
                    <div className="text-sm tracking-wide uppercase">EXAM SEASON SPECIAL</div>
                    <div className="text-xs text-violet-100">Get 50% discount on print spools &gt; 50 pages!</div>
                  </div>
                </div>
              </div>
            )}

            {activeAdIndex === 10 && ( // Slide 11: Real-time Terminal state list
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-md font-mono text-[10px]">
                <div className="bg-zinc-950/60 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-zinc-300">ATM NODE: HEALTHY</span>
                </div>
                <div className="bg-zinc-950/60 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-zinc-300">PRINTER: {printerInfo.status.toUpperCase()}</span>
                </div>
              </div>
            )}
            
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center space-x-2 pt-6">
            {adBanners.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-700 ${i === activeAdIndex ? 'w-8 bg-gradient-to-r from-violet-500 to-blue-500' : 'w-2 bg-zinc-800'}`}
              ></div>
            ))}
          </div>
        </section>

        {/* Right QR Scanning Card (col-span-4) */}
        <section className="col-span-4 h-full flex flex-col justify-center items-center">
          <div className="relative p-6 bg-zinc-950/65 border border-violet-500/30 rounded-3xl shadow-[0_0_50px_rgba(124,58,237,0.18)] flex flex-col items-center gap-6 w-72 animate-float">
            {/* Glowing Corner Vectors */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-violet-500 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-violet-500 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-violet-500 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-violet-500 rounded-br-2xl"></div>

            {/* Laser Scanning Line */}
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_rgba(139,92,246,0.9)] animate-scan pointer-events-none z-20"></div>

            {/* QR Card Label */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest font-mono">Mobile Spool Link</span>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Contactless Scan</h3>
            </div>

            {/* QR Code Container */}
            <div className="relative p-3 bg-white rounded-2xl select-none flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.1)]">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=165x165&data=${encodeURIComponent(qrUrl)}`}
                alt="Scan QR" 
                className="w-40 h-40 opacity-95 filter contrast-125"
              />
            </div>

            {/* Action Banner */}
            <div className="bg-violet-600 w-full py-2.5 rounded-xl text-center shadow-lg shadow-violet-950/30 animate-pulse">
              <span className="text-[11px] font-extrabold tracking-widest font-mono text-white block uppercase">
                ⚡ SCAN TO PRINT ⚡
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* 3. BOTTOM FOOTER TICKER ROW */}
      <footer className="w-full z-10 flex flex-col space-y-4">
        {/* Scrolling Ticker Line */}
        <div className="w-full bg-zinc-950/70 border border-violet-950/30 rounded-xl overflow-hidden py-3 relative shadow-inner">
          <div className="animate-marquee font-mono text-xs font-bold text-violet-300 tracking-wider">
            ★ WELCOME TO QUBINK SMART PRINT ATM MACHINE ★ PRINT YOUR ASSIGNMENTS, LAB RECORDS, CERTIFICATES AND HALL TICKETS INSTANTLY ★ SUPPORTED FILES: PDF, DOCX, PPTX, JPG, PNG ★ SECURE CLOUD ENCRYPTED DOCUMENT HANDLING ★ NO PEN DRIVES OR CABLES REQUIRED - UPLOAD DIRECTLY FROM YOUR MOBILE PHONE DEVICE ★ 
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            ★ WELCOME TO QUBINK SMART PRINT ATM MACHINE ★ PRINT YOUR ASSIGNMENTS, LAB RECORDS, CERTIFICATES AND HALL TICKETS INSTANTLY ★ SUPPORTED FILES: PDF, DOCX, PPTX, JPG, PNG ★ SECURE CLOUD ENCRYPTED DOCUMENT HANDLING ★ NO PEN DRIVES OR CABLES REQUIRED - UPLOAD DIRECTLY FROM YOUR MOBILE PHONE DEVICE ★ 
          </div>
        </div>

        {/* Telemetry Indicator Pills Row */}
        <div className="flex justify-between items-center bg-zinc-950/45 border border-violet-950/20 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
            <span>TERMINAL ID: <strong className="text-zinc-300">{session?.machineId || 'QBK-ATM-001'}</strong></span>
            <span>•</span>
            <span>OS STATUS: <strong className="text-emerald-400">ACTIVE</strong></span>
          </div>

          <div className="flex flex-wrap gap-3.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${internetStatus ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              Internet: {internetStatus ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${session ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></span>
              Cloud Sync: {session ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${printerInfo.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              Printer State: {printerInfo.status}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${printerInfo.paperLevel < 15 ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              Paper: {printerInfo.paperLevel}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${printerInfo.tonerLevel < 10 ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              Toner: {printerInfo.tonerLevel}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Machine: HEALTHY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── READY SCREEN (100% of Center Panel) ───
export function ReadyScreen({ session, liveStatusMessage, internetStatus, printerInfo }: {
  session: any;
  liveStatusMessage: string;
  internetStatus: boolean;
  printerInfo: PrinterInfo;
}) {
  const qrUrl = `https://qubink.vercel.app/atm/${session?.machineId || 'QBK-ATM-001'}`;
  
  return (
    <div className="w-full h-full flex flex-col justify-between items-center py-6 px-8 relative overflow-hidden animate-fade-in-up">
      {/* Background glow orb inside center panel */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 ${printerInfo.isOnline ? 'bg-violet-600/5' : 'bg-red-600/5'} rounded-full filter blur-[60px] pointer-events-none`}></div>

      {/* Breathing Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold tracking-widest text-white uppercase">ATM Terminal Spool</h2>
        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Node Ready Status</p>
      </div>

      {/* Center Printer Icon & Scanning QR Box / Offline Warning Box */}
      {printerInfo.isOnline ? (
        <div className="flex flex-col items-center space-y-6 z-10 relative">
          <div className="relative">
            <span className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full blur opacity-40 animate-pulse"></span>
            <div className="relative p-6 bg-[#090514] border border-violet-500/30 rounded-full text-violet-400 shadow-2xl">
              <Printer className="h-14 w-14" />
            </div>
          </div>

          {/* Animated Scanning Box */}
          <div className="relative p-3 bg-zinc-950/80 border border-violet-500/20 rounded-2xl shadow-2xl flex flex-col items-center gap-3 w-48">
            {/* Glowing Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-violet-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-500 rounded-br-lg"></div>

            {/* Holographic scanner line */}
            <div className="absolute top-0 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_8px_#8b5cf6] animate-[scan_2.5s_ease-in-out_infinite] pointer-events-none z-20"></div>

            {/* Simple Vector Placeholder QR Code */}
            <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center select-none">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                alt="Scan QR" 
                className="w-full h-full opacity-90 filter contrast-125"
              />
            </div>
            <span className="text-[10px] font-semibold tracking-wider font-mono text-zinc-500 uppercase">Scan to Print</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 z-10 relative">
          <div className="relative">
            <span className="absolute -inset-1 bg-red-600/30 rounded-full blur opacity-55 animate-pulse"></span>
            <div className="relative p-6 bg-red-950/20 border border-red-500/50 rounded-full text-red-500 shadow-2xl">
              <AlertTriangle className="h-14 w-14 animate-bounce" />
            </div>
          </div>

          {/* Red Flashing Offline Warning Card */}
          <div className="relative p-5 bg-zinc-950 border border-red-500/30 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.15)] flex flex-col items-center text-center gap-3 w-64">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-lg"></div>

            <span className="text-xs font-bold font-mono text-red-400 uppercase tracking-widest animate-pulse">PRINTER OFFLINE</span>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              USB Connection Lost or Printer Offline. Kiosk operations paused until connection is recovered.
            </p>
            <span className="text-[8px] font-semibold tracking-widest font-mono text-zinc-600 uppercase">Please Wait</span>
          </div>
        </div>
      )}

      {/* Live state message marquee ticker */}
      <div className="w-full max-w-sm space-y-4">
        <div className={`bg-zinc-950/80 border ${printerInfo.isOnline ? 'border-violet-500/20' : 'border-red-500/25'} rounded-xl px-5 py-3 text-center shadow-lg relative`}>
          <p className={`${printerInfo.isOnline ? 'text-violet-300' : 'text-red-400 font-bold'} font-semibold text-sm tracking-wider animate-pulse uppercase`}>
            {printerInfo.isOnline ? (liveStatusMessage || 'Waiting For Customer') : 'USB CONNECTION LOST'}
          </p>
        </div>

        {/* Telemetry Indicator Pills Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-500">
          <span className="px-2.5 py-1 bg-zinc-950 border border-violet-950/30 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            SYNC: ON
          </span>
          <span className="px-2.5 py-1 bg-zinc-950 border border-violet-950/30 rounded-full flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${internetStatus ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            NET: {internetStatus ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className="px-2.5 py-1 bg-zinc-950 border border-violet-950/30 rounded-full flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${printerInfo.isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            PRINTER: {printerInfo.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMER CONNECTED ───
export function CustomerConnected({ activePrintOrder }: { activePrintOrder: any }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-8 space-y-6 animate-fade-in-up">
      <div className="p-5 bg-violet-600/10 border border-violet-500/30 rounded-full text-violet-400 animate-bounce">
        <User className="h-12 w-12" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold tracking-wide text-white">Customer Connected</h2>
        <p className="text-zinc-400 text-sm">Hello, <span className="text-violet-400 font-bold">{activePrintOrder?.student_name || 'Student'}</span>!</p>
        <p className="text-zinc-500 text-xs font-mono">Preparing to sync document uploads...</p>
      </div>
    </div>
  );
}

// ─── UPLOADING SCREEN ───
export function UploadScreen({ activePrintOrder, pipelineProgress }: { activePrintOrder: any; pipelineProgress: number }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-8 space-y-6 animate-fade-in-up">
      <div className="p-5 bg-blue-600/10 border border-blue-500/30 rounded-full text-blue-400 animate-pulse">
        <RefreshCw className="h-10 w-10 animate-spin" />
      </div>
      <div className="text-center space-y-3 w-full max-w-sm">
        <h2 className="text-2xl font-extrabold tracking-wide text-white">Syncing Files...</h2>
        <p className="text-zinc-400 text-xs truncate">Cloud: {activePrintOrder?.file_url || 'Fetching file stream'}</p>
        <div className="h-2 w-full bg-zinc-950 border border-violet-950/40 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-violet-500 transition-all duration-500" style={{ width: `${pipelineProgress}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT SCREEN ───
export function PaymentScreen({ activePrintOrder }: { activePrintOrder: any }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-8 space-y-6 animate-fade-in-up">
      <div className="p-5 bg-amber-600/10 border border-amber-500/30 rounded-full text-amber-400 animate-pulse">
        <CreditCard className="h-10 w-10" />
      </div>
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-extrabold tracking-wide text-white">Awaiting Payment</h2>
        <p className="text-zinc-400 text-sm">Please pay the amount on your mobile device to start printing.</p>
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-4 flex justify-between items-center min-w-80 shadow-lg font-mono">
          <div className="text-left">
            <span className="text-[10px] text-zinc-500 uppercase">Order ID</span>
            <p className="text-xs font-bold text-slate-300">{activePrintOrder?.id}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase">Amount Due</span>
            <p className="text-lg font-extrabold text-amber-400">₹{activePrintOrder?.amount || '0.00'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRINTING SCREEN ───
export function PrintingScreen({
  activePrintOrder,
  pipelineProgress,
  activePipelineStep,
  pipelineSteps,
  printerInfo
}: {
  activePrintOrder: any;
  pipelineProgress: number;
  activePipelineStep: string;
  pipelineSteps: string[];
  printerInfo: PrinterInfo;
}) {
  let totalPages = 1;
  if (activePrintOrder.files) {
    try {
      const filesObj = typeof activePrintOrder.files === 'string' ? JSON.parse(activePrintOrder.files) : activePrintOrder.files;
      if (Array.isArray(filesObj)) {
        totalPages = filesObj.reduce((pSum: number, f: any) => pSum + (f.pages || 1), 0);
      }
    } catch {}
  }
  
  let currentPage = 0;
  if (pipelineProgress >= 75 && pipelineProgress < 90) {
    const ratio = (pipelineProgress - 75) / 15;
    currentPage = Math.min(totalPages, Math.max(1, Math.ceil(ratio * totalPages)));
  } else if (pipelineProgress >= 90) {
    currentPage = totalPages;
  }

  const pagesRemaining = Math.max(0, totalPages - currentPage);
  const estTimeRemaining = pagesRemaining * 8;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center py-6 px-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col items-center space-y-1">
        <span className="p-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl animate-pulse">
          <Printer className="h-6 w-6" />
        </span>
        <h2 className="text-xl font-extrabold text-white tracking-wide">Printing Document...</h2>
        <p className="text-[10px] text-zinc-500 font-mono">Job Spool ID: {activePrintOrder.id}</p>
      </div>

      {/* Progress Gauges Grid */}
      <div className="grid grid-cols-3 gap-3 w-full font-mono text-center">
        {[
          { label: 'Page Status', value: `${currentPage} / ${totalPages}` },
          { label: 'Pages Left', value: `${pagesRemaining} pages` },
          { label: 'Time Remaining', value: `${estTimeRemaining}s` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-950/60 border border-violet-950/20 p-2.5 rounded-xl shadow-lg">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wide block">{label}</span>
            <span className="text-sm font-bold text-violet-300">{value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar container */}
      <div className="w-full space-y-3 text-left">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>STAGE: {activePipelineStep}</span>
          <span className="text-violet-400 font-semibold">{pipelineProgress}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-violet-950/40">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500"
            style={{ width: `${pipelineProgress}%` }}
          ></div>
        </div>

        {/* Dynamic mini checklists grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 border-t border-violet-950/10 text-[9px] font-mono">
          {pipelineSteps.slice(2, 14).map((step, idx) => {
            const currentIdx = pipelineSteps.indexOf(activePipelineStep);
            const stepIdx = pipelineSteps.indexOf(step);
            let state = 'waiting';
            if (stepIdx < currentIdx) state = 'done';
            else if (stepIdx === currentIdx) state = 'active';

            return (
              <div key={idx} className="flex items-center space-x-1.5">
                {state === 'done' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                {state === 'active' && <RefreshCw className="h-3 w-3 text-violet-400 animate-spin" />}
                {state === 'waiting' && <div className="w-3 h-3 border border-zinc-800 rounded-full"></div>}
                <span className={state === 'active' ? 'text-violet-300 font-bold' : state === 'done' ? 'text-zinc-500' : 'text-zinc-700'}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document details box */}
      <div className="bg-zinc-950/40 border border-violet-950/15 p-3 rounded-xl flex items-center justify-between text-[10px] w-full font-sans">
        <div className="flex items-center space-x-2 text-left truncate">
          <FileText className="h-6 w-6 text-blue-400 shrink-0" />
          <div className="truncate">
            <div className="font-semibold text-zinc-300 truncate">Student: {activePrintOrder.student_name}</div>
            <div className="text-zinc-500 font-mono text-[9px]">Color: {activePrintOrder.color_mode?.toUpperCase()} • Duplex: {activePrintOrder.duplex || 'simplex'} • Printer: {printerInfo.name}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-violet-400">{activePrintOrder.copies || 1} Copies</div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPLETED SCREEN ───
export function CompletedScreen({ activePrintOrder }: { activePrintOrder: any }) {
  const [counter, setCounter] = React.useState(10);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-around items-center py-6 px-8 animate-fade-in-up">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Printing Completed!</h1>
          <p className="text-sm text-zinc-400">Please Collect Your Documents From The Spool Output Tray.</p>
        </div>
      </div>

      <div className="bg-zinc-950/60 border border-violet-500/20 p-5 rounded-2xl text-center space-y-2 max-w-sm shadow-xl font-sans">
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Retrieval Slot</p>
        <div className="text-4xl font-extrabold text-violet-400 tracking-wider">SLOT A1</div>
        <p className="text-[11px] text-zinc-500">Thank You For Choosing Qubink. Have A Great Day!</p>
      </div>

      <span className="text-[10px] text-zinc-650 font-mono animate-pulse">
        Returning to Attract Mode in <strong className="text-violet-400 font-bold">{counter}s</strong>...
      </span>
    </div>
  );
}
