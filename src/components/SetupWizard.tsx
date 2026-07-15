import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, CheckCircle, Printer, 
  Server, Cloud, Cpu, MapPin, Building2, Wifi, 
  AlertCircle, Loader2, Zap
} from 'lucide-react';

interface SetupConfig {
  machineId: string;
  shopName: string;
  location: string;
  selectedPrinter: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

interface SetupWizardProps {
  onComplete: (config: SetupConfig) => void;
}

const STEPS = [
  { id: 0, title: 'Welcome', icon: Zap },
  { id: 1, title: 'Machine Identity', icon: Cpu },
  { id: 2, title: 'Printer Setup', icon: Printer },
  { id: 3, title: 'Cloud Services', icon: Cloud },
  { id: 4, title: 'Complete', icon: CheckCircle },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [printers, setPrinters] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [config, setConfig] = useState<SetupConfig>({
    machineId: 'QBK-ATM-001',
    shopName: '',
    location: '',
    selectedPrinter: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
  });

  // Load detected printers
  useEffect(() => {
    if (step === 2) {
      loadPrinters();
    }
  }, [step]);

  const loadPrinters = async () => {
    try {
      const info = await window.api?.getPrinterStatus?.();
      if (info?.name && info.name !== 'Default Printer') {
        setPrinters([info.name]);
        setConfig(prev => ({ ...prev, selectedPrinter: info.name }));
      }
    } catch {
      setPrinters(['No printers detected']);
    }
  };

  const update = (key: keyof SetupConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!config.machineId.trim()) { setError('Machine ID is required.'); return false; }
      if (!config.shopName.trim()) { setError('Shop Name is required.'); return false; }
    }
    if (step === 2) {
      if (!config.selectedPrinter) { setError('Please select a printer.'); return false; }
    }
    if (step === 3) {
      if (!config.supabaseUrl.trim()) { setError('Supabase URL is required.'); return false; }
      if (!config.supabaseAnonKey.trim()) { setError('Supabase Anon Key is required.'); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await window.api?.saveSetupConfig?.(config as any);
      if (result?.success) {
        onComplete(config);
      } else {
        setError(result?.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#05030a] flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-6">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <img src="logo.png" alt="Qubink Nexus" className="h-12 w-auto mx-auto mb-3 filter drop-shadow-[0_0_16px_rgba(124,58,237,0.5)]" />
          <p className="text-[10px] font-mono tracking-widest text-violet-400 uppercase">Machine Setup Wizard</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-violet-600 text-white ring-2 ring-violet-400/40' :
                'bg-zinc-900 border border-zinc-700 text-zinc-600'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : <span>{i + 1}</span>}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-[2px] w-8 transition-all duration-300 ${i < step ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-zinc-950/80 border border-violet-950/40 rounded-3xl p-8 backdrop-blur-md shadow-[0_0_80px_rgba(124,58,237,0.08)]">
          
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 mx-auto bg-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome to Qubink Nexus™</h2>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-md mx-auto">
                  This wizard will configure your Smart Print ATM machine. You'll set up the Machine ID, printer, and cloud connections.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[
                  { icon: Cpu, label: 'Machine Identity' },
                  { icon: Printer, label: 'Printer Setup' },
                  { icon: Cloud, label: 'Cloud Connect' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                    <Icon className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-500 font-mono">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Machine Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-violet-400" /> Machine Identity
                </h2>
                <p className="text-zinc-500 text-xs mt-1">Configure this terminal's unique identifier and location.</p>
              </div>
              {[
                { key: 'machineId', label: 'Machine ID', placeholder: 'QBK-ATM-001', icon: Cpu, hint: 'Unique ID for this Print ATM terminal.' },
                { key: 'shopName', label: 'Shop / Campus Name', placeholder: 'Central Library, Campus A', icon: Building2, hint: 'Displayed in the admin dashboard.' },
                { key: 'location', label: 'Location / Hub', placeholder: 'Ground Floor, Block B', icon: MapPin, hint: 'Physical location of this terminal.' },
              ].map(({ key, label, placeholder, icon: Icon, hint }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-colors placeholder:text-zinc-600 font-mono"
                      placeholder={placeholder}
                      value={config[key as keyof SetupConfig]}
                      onChange={e => update(key as keyof SetupConfig, e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Printer Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Printer className="w-5 h-5 text-violet-400" /> Printer Setup
                </h2>
                <p className="text-zinc-500 text-xs mt-1">Select the printer connected to this ATM terminal.</p>
              </div>
              <div className="space-y-3">
                {printers.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
                    <span className="text-amber-300 text-sm">Detecting installed printers...</span>
                  </div>
                ) : (
                  printers.map(p => (
                    <button
                      key={p}
                      onClick={() => update('selectedPrinter', p)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        config.selectedPrinter === p
                          ? 'border-violet-500 bg-violet-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Printer className={`w-5 h-5 flex-shrink-0 ${config.selectedPrinter === p ? 'text-violet-400' : 'text-zinc-600'}`} />
                      <div>
                        <div className="text-sm font-semibold">{p}</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Windows Installed Printer</div>
                      </div>
                      {config.selectedPrinter === p && <CheckCircle className="w-4 h-4 text-violet-400 ml-auto" />}
                    </button>
                  ))
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Or Enter Manually</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white text-sm px-4 py-3 rounded-xl outline-none transition-colors placeholder:text-zinc-600 font-mono"
                    placeholder="HP LaserJet Pro MFP M428fdw"
                    value={config.selectedPrinter}
                    onChange={e => update('selectedPrinter', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cloud Services */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-violet-400" /> Cloud Services
                </h2>
                <p className="text-zinc-500 text-xs mt-1">Connect to Supabase and Cloudinary for live sync.</p>
              </div>
              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl flex items-start gap-2">
                <Wifi className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-300 text-[11px] leading-relaxed">These values are copied from your Qubink project's <code className="bg-blue-950 px-1 rounded">.env.local</code> file. The wizard saves them encrypted on this machine.</p>
              </div>
              {[
                { key: 'supabaseUrl', label: 'Supabase Project URL', placeholder: 'https://xxxx.supabase.co', icon: Server },
                { key: 'supabaseAnonKey', label: 'Supabase Anon Key', placeholder: 'eyJhbGci...', icon: Server },
                { key: 'cloudinaryCloudName', label: 'Cloudinary Cloud Name', placeholder: 'your-cloud-name', icon: Cloud },
                { key: 'cloudinaryUploadPreset', label: 'Cloudinary Upload Preset', placeholder: 'qubink-uploads', icon: Cloud },
              ].map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-500 text-white text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-colors placeholder:text-zinc-600 font-mono"
                      placeholder={placeholder}
                      value={config[key as keyof SetupConfig]}
                      onChange={e => update(key as keyof SetupConfig, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Configuration Complete!</h2>
                <p className="text-zinc-400 text-sm">Review your settings below and click <strong>Launch Controller</strong> to start.</p>
              </div>

              <div className="space-y-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 font-mono text-xs">
                {[
                  { label: 'Machine ID', value: config.machineId },
                  { label: 'Shop Name', value: config.shopName },
                  { label: 'Location', value: config.location || '—' },
                  { label: 'Printer', value: config.selectedPrinter },
                  { label: 'Supabase URL', value: config.supabaseUrl ? config.supabaseUrl.substring(0, 30) + '...' : '—' },
                  { label: 'Cloudinary', value: config.cloudinaryCloudName || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50 last:border-0">
                    <span className="text-zinc-500 uppercase tracking-widest text-[10px]">{label}</span>
                    <span className="text-zinc-200 font-semibold truncate max-w-[220px] text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-xs">{error}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-mono">{step + 1} / {STEPS.length}</span>
            </div>

            {step < 4 ? (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold text-sm rounded-xl transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Launch Controller'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-700 font-mono mt-6">
          QUBINK NEXUS™ v{import.meta.env.VITE_APP_VERSION || '1.0.0'} • Smart Print ATM Machine Controller
        </p>
      </div>
    </div>
  );
}
