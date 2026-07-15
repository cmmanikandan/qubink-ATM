import React, { useState, useEffect } from 'react';
import { AdminAuthService } from '../services/admin';
import type { AdminUser } from '../services/admin';
import { AdminDownload } from './AdminDownload';
import { AdminController } from './AdminController';
import { AdminMachines } from './AdminMachines';
import { 
  Activity, Cpu, ShieldAlert, LogOut, Terminal, 
  ExternalLink, Mail, Lock, LogIn, Laptop, Globe, Info, RefreshCw
} from 'lucide-react';

interface AdminCenterProps {
  onBackToKiosk?: () => void;
}

export function AdminCenter({ onBackToKiosk }: AdminCenterProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('machines');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Notification Toast Stack
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  // Helper to sync path with active tab
  const getActiveTabFromPath = (path: string) => {
    if (path.includes('/admin/machines')) return 'machines';
    if (path.includes('/admin/download')) return 'download';
    if (path.includes('/admin/controller')) return 'controller';
    return 'machines';
  };

  useEffect(() => {
    // Initial check of admin session
    AdminAuthService.getAdminUser().then((user) => {
      setAdminUser(user);
      setCheckingAuth(false);
      
      if (user) {
        addNotification(`Authenticated as ${user.email || 'administrator'}.`, 'success');
      }
    });

    // Check if path is already set to something specific
    setActiveTab(getActiveTabFromPath(window.location.pathname));

    const handlePopState = () => {
      setActiveTab(getActiveTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tabName: string) => {
    const newPath = `/admin/${tabName}`;
    window.history.pushState(null, '', newPath);
    setActiveTab(tabName);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('All credentials are required.');
      return;
    }
    setAuthenticating(true);
    setAuthError('');

    try {
      const user = await AdminAuthService.loginWithEmail(email, password);
      setAdminUser(user);
      addNotification('Logged in successfully.', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'Login attempt failed.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthenticating(true);
    setAuthError('');
    try {
      await AdminAuthService.loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize Google Login.');
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out of the Administrator Panel?')) {
      await AdminAuthService.logout();
      setAdminUser(null);
      addNotification('Admin session closed.', 'info');
    }
  };

  if (checkingAuth) {
    return (
      <div className="absolute inset-0 bg-[#090514] flex flex-col items-center justify-center text-white z-[600]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 text-xs font-mono">Syncing Secure Gateways...</p>
        </div>
      </div>
    );
  }

  // --- RENDER LOGIN VIEW ---
  if (!adminUser) {
    return (
      <div className="absolute inset-0 w-screen h-screen bg-[#05030a] text-white flex items-center justify-center p-6 z-[600] overflow-hidden select-none animate-gradient bg-gradient-to-tr from-[#05030a] via-[#11082d] to-[#05030a]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[120px] animate-pulse" />

        <div className="glass-panel p-8 w-[440px] rounded-3xl animate-fade-in-up space-y-6 border border-violet-950/40 shadow-2xl relative">
          <div className="flex flex-col items-center space-y-3">
            <img src="logo.png" className="h-12 w-auto filter drop-shadow-[0_0_16px_rgba(124,58,237,0.5)]" alt="Qubink Logo" />
            <h2 className="text-xl font-bold tracking-tight text-white uppercase">Qubink Admin</h2>
            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              Smart Print ATM Management Console. Access restricted to shop owners and managers.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-650">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="admin@qubink.in"
                  className="w-full bg-zinc-950/60 border border-violet-950/40 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none transition-all text-violet-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-650">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/60 border border-violet-950/40 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none transition-all text-violet-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authenticating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-bold transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-lg"
            >
              {authenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-violet-950/20"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono text-zinc-500 uppercase">OR</span>
            <div className="flex-grow border-t border-violet-950/20"></div>
          </div>

          {/* OAuth Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={authenticating}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-4 h-4 text-violet-400" />
            <span>Continue with Google</span>
          </button>

          {onBackToKiosk && (
            <button 
              onClick={onBackToKiosk}
              className="w-full text-center text-xs text-zinc-650 hover:text-zinc-400 transition-colors pt-2 block underline"
            >
              Return to terminal signage mode
            </button>
          )}

        </div>
      </div>
    );
  }

  // --- RENDER ADMINISTRATIVE DASHBOARD WORKSPACE ---
  return (
    <div className="absolute inset-0 w-screen h-screen grid-bg overflow-hidden flex flex-col justify-between text-white font-sans z-[600] select-text">
      
      {/* ─── HEADER ─── */}
      <header className="glass-panel border-b border-violet-950/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="logo.png" 
            className="h-9 w-auto filter drop-shadow-[0_0_12px_rgba(124,58,237,0.4)]" 
            alt="Qubink Logo"
          />
          <div className="h-6 w-[1px] bg-zinc-800" />
          <div>
            <div className="text-sm font-bold tracking-tight">Qubink Smart Spool Desk</div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Admin Terminal Portal</div>
          </div>
        </div>

        {/* TABS SELECTOR (Large screen sidebar alternative) */}
        <nav className="flex items-center space-x-2.5">
          {[
            { id: 'machines', label: 'Monitor Machines' },
            { id: 'download', label: 'Controller Download' },
            { id: 'controller', label: 'Updates & Timeline' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/40'
                  : 'bg-zinc-950/40 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* PROFILE CONTROL */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-zinc-200">{adminUser.email?.split('@')[0] || 'Admin'}</p>
            <p className="text-[9px] text-zinc-500 font-mono tracking-wide">{adminUser.email}</p>
          </div>
          
          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block" />

          {onBackToKiosk && (
            <button
              onClick={onBackToKiosk}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              title="Return to signage mode"
            >
              Kiosk Screen
            </button>
          )}

          <button 
            onClick={handleLogout} 
            className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Sign Out Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN DESK WORKSPACE ─── */}
      <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-140px)]">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'machines' && (
            <AdminMachines onNotification={addNotification} />
          )}
          {activeTab === 'download' && (
            <AdminDownload />
          )}
          {activeTab === 'controller' && (
            <AdminController />
          )}
        </div>
      </main>

      {/* ─── FOOTER BANNER ─── */}
      <footer className="bg-zinc-950/80 border-t border-violet-950/20 px-6 py-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>QUBINK CAMPUS MANAGEMENT DESK</span>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-zinc-300">DOCUMENTATION</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-300">LICENSES</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-300 flex items-center gap-1">
            <span>SUPPORT</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <span>VERSION 1.0.0-PWA-PROD</span>
      </footer>

      {/* ─── NOTIFICATION TOAST OVERLAYS ─── */}
      <div className="absolute bottom-16 right-6 flex flex-col space-y-2.5 z-[700] max-w-sm pointer-events-none select-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-in-right flex items-center space-x-2.5 text-xs font-semibold tracking-wide transition-all ${
              notif.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40'
                : notif.type === 'error'
                ? 'bg-red-950/85 border-red-500/30 text-red-300 shadow-red-950/40'
                : 'bg-violet-950/85 border-violet-500/30 text-violet-300 shadow-violet-950/40'
            }`}
          >
            <span className="text-base shrink-0">
              {notif.type === 'success' ? '✅' : notif.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{notif.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
