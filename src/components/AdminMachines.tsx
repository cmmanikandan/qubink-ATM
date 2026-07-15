import React, { useState, useEffect } from 'react';
import { AdminMachineService } from '../services/admin';
import type { MachineAdminInfo } from '../services/admin';
import { fetchOrders, fetchMachineLogs } from '../services/supabase';
import { 
  Activity, Cpu, HardDrive, Thermometer, Wifi, Database, CheckCircle, 
  AlertCircle, RefreshCw, Printer, Settings, QrCode, Play, Pause, Trash2, 
  Download, FileText, ChevronRight, BookOpen, Clock, AlertTriangle, 
  User, Mail, Phone, Building, Info, ShieldAlert, WifiOff, Sparkles
} from 'lucide-react';

export function AdminMachines({ onNotification }: { onNotification: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const [machines, setMachines] = useState<MachineAdminInfo[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<MachineAdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time details state for active machine
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Shop Settings editing state
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editGst, setEditGst] = useState('27AAACQ9900B1ZP');
  const [editHours, setEditHours] = useState('09:00 AM - 09:00 PM');
  const [editEmail, setEditEmail] = useState('shop@qubink.in');
  
  // Action triggers loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load registered machines
  useEffect(() => {
    loadMachines();
    
    // Subscribe to database changes for real-time sync
    const unsubscribe = AdminMachineService.subscribeToMachines(() => {
      loadMachines(false); // Reload silently on update
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Monitor changes for selected machine details
  useEffect(() => {
    if (!selectedMachine) return;
    
    // Load orders & logs initially
    loadSelectedMachineDetails();

    // Subscribe to order changes for this machine
    const unsubOrders = AdminMachineService.subscribeToMachineOrders(selectedMachine.machine_id, () => {
      loadSelectedMachineOrders();
    });

    // Subscribe to log insertions for this machine
    const unsubLogs = AdminMachineService.subscribeToMachineLogs(selectedMachine.machine_id, () => {
      loadSelectedMachineLogs();
    });

    return () => {
      unsubOrders();
      unsubLogs();
    };
  }, [selectedMachine?.machine_id]);

  const loadMachines = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const list = await AdminMachineService.fetchMachines();
      setMachines(list);
      
      // Update selected machine state to keep it sync'd with real-time status updates
      if (selectedMachine) {
        const updated = list.find(m => m.machine_id === selectedMachine.machine_id);
        if (updated) {
          // Compare status to dispatch notifications if changed
          if (updated.status !== selectedMachine.status) {
            onNotification(
              `Machine ${updated.machine_name} went ${updated.status.toUpperCase()}`,
              updated.status === 'online' ? 'success' : 'error'
            );
          }
          if (updated.printer_status !== selectedMachine.printer_status) {
            onNotification(
              `Printer on ${updated.machine_name} is ${updated.printer_status.toUpperCase()}`,
              updated.printer_status === 'ready' ? 'success' : 'error'
            );
          }
          setSelectedMachine(updated);
        }
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to query machines.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadSelectedMachineDetails = async () => {
    if (!selectedMachine) return;
    setEditName(selectedMachine.machine_name || '');
    setEditLocation(selectedMachine.location || '');
    setEditAddress(selectedMachine.address || '');
    setEditContact(selectedMachine.contact_number || '');
    
    await Promise.all([
      loadSelectedMachineOrders(),
      loadSelectedMachineLogs()
    ]);
  };

  const loadSelectedMachineOrders = async () => {
    if (!selectedMachine) return;
    try {
      const list = await fetchOrders(selectedMachine.machine_id);
      setOrders(list);
    } catch {}
  };

  const loadSelectedMachineLogs = async () => {
    if (!selectedMachine) return;
    try {
      const logRecords = await fetchMachineLogs(selectedMachine.machine_id, 30);
      setLogs(logRecords);
    } catch {}
  };

  const handleDispatchCommand = async (commandName: string, label: string) => {
    if (!selectedMachine) return;
    setActionLoading(commandName);
    try {
      await AdminMachineService.sendMachineCommand(selectedMachine.machine_id, commandName);
      onNotification(`Dispatched remote command [${label}] to machine.`, 'success');
    } catch (err: any) {
      onNotification(err.message || 'Command dispatch failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    try {
      await AdminMachineService.updateShopSettings(selectedMachine.machine_id, {
        machine_name: editName,
        location: editLocation,
        address: editAddress,
        contact_number: editContact
      });
      onNotification('Shop settings updated successfully.', 'success');
      loadMachines(false);
    } catch (err: any) {
      onNotification(err.message || 'Failed to save settings.', 'error');
    }
  };

  const handleDownloadLogs = () => {
    if (logs.length === 0) {
      alert('No logs available for download.');
      return;
    }
    const logContent = logs.map(l => `[${l.created_at}] ${l.event}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nexus_${selectedMachine?.machine_id}_logs.log`;
    link.click();
    onNotification('Log download initiated.', 'success');
  };

  const handleRegenerateQR = async () => {
    if (!selectedMachine) return;
    const size = '250x250';
    const data = `https://qubink.vercel.app/atm/${selectedMachine.machine_id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(data)}`;
    
    try {
      await AdminMachineService.updateQrCodeUrl(selectedMachine.machine_id, qrUrl);
      onNotification('QR code regenerated successfully.', 'success');
      loadMachines(false);
    } catch (err: any) {
      onNotification(err.message || 'Failed to update QR code URL.', 'error');
    }
  };

  const getMachineHealthScore = (m: MachineAdminInfo) => {
    if (m.status !== 'online') return 0;
    let score = 100;
    if (m.paper_level < 15) score -= 25;
    if (m.toner_level < 10) score -= 30;
    if (m.printer_status !== 'ready') score -= 20;
    if (m.temperature > 50) score -= 15;
    return Math.max(10, score);
  };

  // Mock fluctuation of system stats based on node state
  const getLiveCpuLoad = () => {
    if (!selectedMachine || selectedMachine.status !== 'online') return 0;
    if (selectedMachine.printer_status === 'printing') {
      return Math.round(55 + Math.random() * 20);
    }
    return Math.round(10 + Math.random() * 15);
  };

  const getLiveRamLoad = () => {
    if (!selectedMachine || selectedMachine.status !== 'online') return 0;
    return Math.round(54 + Math.random() * 5);
  };

  const getLiveDiskLoad = () => {
    if (!selectedMachine || selectedMachine.status !== 'online') return 0;
    return 32;
  };

  return (
    <div className="space-y-6 text-white text-left animate-fade-in-up">
      
      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP ROW GRID SUMMARY OR MAIN VIEW */}
      {!selectedMachine ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-violet-950/20 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Machine Telemetry Desk</h1>
              <p className="text-xs text-zinc-500 mt-1">Real-time sync monitor listing all active smart print ATM terminals.</p>
            </div>
            <button 
              onClick={() => loadMachines(true)}
              className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center space-x-1 text-xs"
              title="Refresh terminals list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Desk</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-zinc-500 text-xs font-mono">Syncing with terminal node network...</p>
            </div>
          ) : machines.length === 0 ? (
            <div className="text-center py-16 text-xs text-zinc-700 border border-dashed border-zinc-850 rounded-3xl font-mono">
              No registered Smart Print ATM machines detected.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {machines.map((m) => {
                const health = getMachineHealthScore(m);
                return (
                  <div 
                    key={m.machine_id}
                    onClick={() => setSelectedMachine(m)}
                    className="glass-panel glass-panel-hover rounded-3xl p-5 cursor-pointer flex flex-col justify-between space-y-4 transition-all relative overflow-hidden group border-violet-950/25"
                  >
                    {/* Glow edge background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* TOP INFO ROW */}
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h3 className="font-bold text-base text-zinc-100 group-hover:text-violet-300 transition-colors">{m.machine_name}</h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{m.machine_id}</p>
                      </div>
                      
                      {/* Status pill */}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border uppercase flex items-center gap-1 ${
                        m.status === 'online'
                          ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-950/60 border-red-500/20 text-red-400 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{m.status}</span>
                      </span>
                    </div>

                    {/* STATS MATRIX */}
                    <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 border border-violet-950/15 p-3 rounded-2xl font-mono text-[10px] text-zinc-500 z-10">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">Printer State</span>
                        <span className={`font-semibold uppercase truncate ${m.printer_status === 'ready' ? 'text-zinc-300' : 'text-amber-400'}`}>
                          {m.printer_status || 'offline'}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">Paper capacity</span>
                        <span className="font-semibold text-zinc-300">{m.paper_level}%</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">Toner level</span>
                        <span className="font-semibold text-zinc-300">{m.toner_level}%</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[8px] text-zinc-600 uppercase tracking-wider">Software Node</span>
                        <span className="font-semibold text-zinc-300">v{m.software_version || '1.0.0'}</span>
                      </div>
                    </div>

                    {/* BOTTOM HEALTH BAR & ARROW */}
                    <div className="flex justify-between items-center z-10">
                      <div className="flex items-center space-x-2 w-4/5">
                        <div className="flex flex-col space-y-0.5 w-full">
                          <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                            <span>Kiosk Health</span>
                            <span className={health > 70 ? 'text-emerald-400' : health > 40 ? 'text-amber-400' : 'text-red-400'}>{health}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-violet-950/20">
                            <div 
                              className={`h-full transition-all ${
                                health > 70 ? 'bg-emerald-500' : health > 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1.5 bg-violet-600/10 border border-violet-500/10 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DETAIL LIVE MACHINE MONITOR WINDOW */
        <div className="space-y-6">
          
          {/* NAV HEADER */}
          <div className="flex items-center justify-between border-b border-violet-950/20 pb-4">
            <div className="flex items-center space-x-3.5">
              <button 
                onClick={() => setSelectedMachine(null)}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                ◀ Desk View
              </button>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>{selectedMachine.machine_name}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedMachine.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                </h2>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                  ID: {selectedMachine.machine_id} • Location: {selectedMachine.location}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 font-mono text-xs text-zinc-500">
              {selectedMachine.status === 'online' ? (
                <div className="flex items-center space-x-1">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{selectedMachine.internet_speed_mbps || 45} Mbps</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-400 animate-pulse">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
              <span className="text-zinc-700">|</span>
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">Cloud Link Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT AREA: TELEMETRY GAUGES & ACTION BUTTONS */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* TELEMETRY GAUGES */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Activity className="w-4 h-4 text-violet-400" /> Kiosk hardware telemetry
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Cpu, label: 'CPU Usage', val: `${getLiveCpuLoad()}%`, color: 'text-violet-400', barBg: 'bg-violet-500' },
                    { icon: HardDrive, label: 'RAM Occupancy', val: `${getLiveRamLoad()}%`, color: 'text-blue-400', barBg: 'bg-blue-500' },
                    { icon: HardDrive, label: 'SSD Storage', val: `${getLiveDiskLoad()}%`, color: 'text-teal-400', barBg: 'bg-teal-500' },
                    { icon: Thermometer, label: 'Temperature', val: `${selectedMachine.temperature || 34}°C`, color: 'text-amber-400', barBg: 'bg-amber-500' },
                  ].map((g, idx) => (
                    <div key={idx} className="bg-zinc-950/40 border border-violet-950/15 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-center text-zinc-500 font-mono text-[10px] uppercase">
                        <span>{g.label}</span>
                        <g.icon className={`w-4 h-4 ${g.color}`} />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xl font-bold font-mono tracking-tight ${g.color}`}>{g.val}</p>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-violet-950/10">
                          <div className={`h-full ${g.barBg}`} style={{ width: g.val.replace(/[^0-9]/g, '') + '%' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PRINTER MEDIA & CAPACITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Paper Capacity */}
                  <div className="bg-zinc-950/30 border border-violet-950/10 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-teal-400 font-semibold flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Paper capacity
                      </span>
                      <span className="font-bold text-zinc-300">{selectedMachine.paper_level}%</span>
                    </div>
                    <div className="h-2.5 bg-zinc-900 border border-violet-950/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedMachine.paper_level < 15 ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`} 
                        style={{ width: `${selectedMachine.paper_level}%` }}
                      />
                    </div>
                  </div>

                  {/* Toner Level */}
                  <div className="bg-zinc-950/30 border border-violet-950/10 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-fuchsia-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Toner Level
                      </span>
                      <span className="font-bold text-zinc-300">{selectedMachine.toner_level}%</span>
                    </div>
                    <div className="h-2.5 bg-zinc-900 border border-violet-950/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedMachine.toner_level < 10 ? 'bg-red-500 animate-pulse' : 'bg-fuchsia-500'}`} 
                        style={{ width: `${selectedMachine.toner_level}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTION COMMAND CENTER */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="w-4 h-4 text-violet-400" /> Remote Controller Commands
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { cmd: 'restart', label: 'Relaunch App', color: 'bg-zinc-950 border border-violet-950/40 text-violet-400 hover:border-violet-500/50' },
                    { cmd: 'restart_printer', label: 'Restart Spooler', color: 'bg-zinc-950 border border-violet-950/40 text-blue-400 hover:border-blue-500/50' },
                    { cmd: 'test_print', label: 'Test Print', color: 'bg-zinc-950 border border-violet-950/40 text-teal-400 hover:border-teal-500/50' },
                    { cmd: 'update', label: 'Check Updates', color: 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700' },
                  ].map((btn) => (
                    <button
                      key={btn.cmd}
                      onClick={() => handleDispatchCommand(btn.cmd, btn.label)}
                      disabled={actionLoading !== null || selectedMachine.status !== 'online'}
                      className={`py-3 rounded-2xl text-xs font-bold font-mono transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btn.color}`}
                    >
                      {actionLoading === btn.cmd ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{btn.label}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Maintenance Command toggle */}
                  <button
                    onClick={() => {
                      const enabled = selectedMachine.maintenance_mode;
                      handleDispatchCommand(enabled ? 'maintenance_off' : 'maintenance_on', enabled ? 'End Maintenance' : 'Start Maintenance');
                    }}
                    disabled={actionLoading !== null || selectedMachine.status !== 'online'}
                    className={`py-3.5 rounded-2xl text-xs font-bold font-mono transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-30 ${
                      selectedMachine.maintenance_mode 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50' 
                        : 'bg-zinc-950 border border-amber-900/40 text-amber-500 hover:border-amber-500/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{selectedMachine.maintenance_mode ? 'End Maintenance Mode' : 'Go Into Maintenance Mode'}</span>
                  </button>

                  {/* Print Queue Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDispatchCommand('pause_queue', 'Pause Queue')}
                      disabled={actionLoading !== null || selectedMachine.status !== 'online'}
                      className="py-3.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold font-mono flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-30"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Queue</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Clear entire pending spool queue? This cannot be undone.')) {
                          handleDispatchCommand('clear_queue', 'Clear Queue');
                        }
                      }}
                      disabled={actionLoading !== null || selectedMachine.status !== 'online'}
                      className="py-3.5 bg-red-950/20 border border-red-950/40 hover:border-red-500/40 text-red-400 rounded-2xl text-xs font-semibold font-mono flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Queue</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ACTIVE SPOOL QUEUES */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-violet-950/20 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                    <Printer className="w-4 h-4 text-violet-400" /> Active Job Queue Spooler
                  </h3>
                  <span className="px-2 py-0.5 bg-zinc-950 border border-violet-950/20 rounded text-[9px] font-mono text-zinc-500">
                    Online Real-Time Tracker
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pending/Printing Queue */}
                  <div className="space-y-3.5 bg-zinc-950/20 border border-violet-950/10 p-4 rounded-2xl max-h-[300px] overflow-y-auto">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 border-b border-violet-950/20 pb-1.5 flex items-center justify-between">
                      <span>Pending Orders</span>
                      <span>{orders.filter(o => o.status !== 'ready' && o.status !== 'delivered' && o.status !== 'cancelled').length}</span>
                    </h4>
                    
                    {orders.filter(o => o.status !== 'ready' && o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-zinc-700 font-mono">
                        No orders in queue
                      </div>
                    ) : (
                      orders.filter(o => o.status !== 'ready' && o.status !== 'delivered' && o.status !== 'cancelled').map((o) => (
                        <div key={o.id} className="bg-zinc-950/50 border border-violet-950/20 p-3 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-zinc-200">{o.student_name}</span>
                            <span className="text-violet-400 font-mono text-[10px]">{o.id}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                            <span>Copies: {o.copies || 1} • {o.color_mode?.toUpperCase()}</span>
                            <span className={`px-1.5 rounded uppercase font-bold text-[9px] ${
                              o.status === 'printing' ? 'bg-violet-950 text-violet-400 animate-pulse' : 'bg-zinc-900 text-zinc-400'
                            }`}>{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Completed Queue */}
                  <div className="space-y-3.5 bg-zinc-950/20 border border-violet-950/10 p-4 rounded-2xl max-h-[300px] overflow-y-auto">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-violet-950/20 pb-1.5 flex items-center justify-between">
                      <span>Completed Today</span>
                      <span>{orders.filter(o => o.status === 'ready' || o.status === 'delivered').length}</span>
                    </h4>
                    
                    {orders.filter(o => o.status === 'ready' || o.status === 'delivered').length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-zinc-700 font-mono">
                        No completed orders
                      </div>
                    ) : (
                      orders.filter(o => o.status === 'ready' || o.status === 'delivered').map((o) => (
                        <div key={o.id} className="bg-zinc-950/25 border border-zinc-900/40 p-2.5 rounded-xl flex justify-between items-center text-xs opacity-75">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-zinc-300">{o.student_name}</p>
                            <p className="text-[9px] text-zinc-600 font-mono">{o.id} • {o.color_mode?.toUpperCase()}</p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT AREA: SETTINGS, LOG CONSOLE, QR CODE, TUTORIALS */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SHOP SETTINGS */}
              <div className="glass-panel rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                  <Settings className="w-4 h-4 text-violet-400" /> Terminal Location & Shop Details
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs text-zinc-400">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Terminal Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input 
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-violet-500 transition-colors"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Campus / Hub</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input 
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-violet-500 transition-colors"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Exact Address / Floor</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input 
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none focus:border-violet-500 transition-colors"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Support No.</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        <input 
                          type="text"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-2 py-2.5 text-[11px] text-white outline-none focus:border-violet-500 transition-colors font-mono"
                          value={editContact}
                          onChange={(e) => setEditContact(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase font-mono">GST Number</label>
                      <input 
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-[11px] text-white outline-none focus:border-violet-500 transition-colors font-mono"
                        value={editGst}
                        onChange={(e) => setEditGst(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-lg shadow-violet-950/40"
                  >
                    Save Shop Configuration
                  </button>
                </form>
              </div>

              {/* QR CODE MANAGEMENT */}
              <div className="glass-panel rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                  <QrCode className="w-4 h-4 text-violet-400" /> QR Spool Signage Management
                </h3>

                <div className="flex flex-col items-center p-3 bg-zinc-950/60 border border-violet-950/15 rounded-2xl space-y-3.5 text-center">
                  {selectedMachine.qr_code_url ? (
                    <img 
                      src={selectedMachine.qr_code_url} 
                      className="w-32 h-32 rounded-xl bg-white p-2 border border-violet-500/20" 
                      alt="Machine QR" 
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-[10px] text-zinc-600 font-mono">
                      No QR url synced
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-400 leading-normal max-w-[200px]">
                    Customers scan this QR on-site to upload documents and checkout their print jobs.
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                    <button
                      onClick={handleRegenerateQR}
                      className="py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer"
                    >
                      Regenerate
                    </button>
                    
                    <a
                      href={selectedMachine.qr_code_url}
                      target="_blank"
                      download={`Qubink_${selectedMachine.machine_id}_QR.png`}
                      className="py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] font-bold font-mono transition-all text-center flex items-center justify-center cursor-pointer"
                    >
                      Download QR
                    </a>
                  </div>
                </div>
              </div>

              {/* CONSOLE STREAM & LOGS */}
              <div className="glass-panel rounded-3xl p-5 space-y-4 h-[350px] flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-violet-950/20 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                    <FileText className="w-4 h-4 text-violet-400" /> Terminal Console Logs
                  </h3>
                  <button
                    onClick={handleDownloadLogs}
                    className="p-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded hover:text-white transition-all cursor-pointer"
                    title="Download complete logs"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 bg-black border border-violet-950/30 rounded-2xl p-3 overflow-y-auto space-y-2 font-mono text-[9px] text-zinc-500 my-3">
                  {logs.length === 0 ? (
                    <div className="text-zinc-700 text-center py-16">
                      No logs synced to cloud.
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 leading-relaxed text-left">
                        <span className="text-zinc-700 shrink-0 select-none">
                          [{new Date(log.created_at).toLocaleTimeString()}]
                        </span>
                        <span className="text-zinc-300 break-all">{log.event}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-zinc-950/40 border border-violet-950/10 p-2.5 rounded-xl flex items-center space-x-2 text-[9px] text-zinc-500 font-mono text-left leading-normal">
                  <Info className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Streams logs sent by host agent in last 48h.</span>
                </div>
              </div>

              {/* HELP & TUTORIAL CENTER */}
              <div className="glass-panel rounded-3xl p-5 space-y-4 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-4 h-4 text-violet-400" /> Kiosk Support & Help Center
                </h3>

                <ul className="space-y-2.5 text-xs">
                  {[
                    { label: 'Printer Installation Guide', href: '#' },
                    { label: 'Controller Setup Walkthrough', href: '#' },
                    { label: 'Offline Spooler Troubleshooting', href: '#' },
                    { label: 'Video Tutorial: Node Registration', href: '#' },
                  ].map((link, idx) => (
                    <li key={idx} className="flex justify-between items-center py-1.5 border-b border-zinc-900 last:border-b-0 hover:text-zinc-200 transition-colors">
                      <a href={link.href} className="font-semibold text-zinc-400 hover:text-violet-300 transition-all flex items-center gap-1">
                        <span>•</span> {link.label}
                      </a>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
