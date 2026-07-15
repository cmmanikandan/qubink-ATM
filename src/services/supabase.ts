import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabase) return supabase;

  try {
    const env = window.api ? await window.api.getEnv() : {
      supabaseUrl: 'https://drszakonbtzncjenfzqs.supabase.co',
      supabaseAnonKey: 'sb_publishable_Qe5wMpbomfGbwg96oCtNKw_3AiQzNpO'
    };
    
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is missing in connection settings.');
    }
    const isElectron = !!window.api;
    supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: !isElectron,
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabase;
  } catch (err: any) {
    console.error('Supabase Client Init Failure:', err.message);
    throw err;
  }
}

// 1. Machine Authentication
export async function getMachine(machineId: string) {
  const client = await getSupabase();
  const { data, error } = await client
    .from('machines')
    .select('*')
    .eq('machine_id', machineId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 2. Machine Status & Logs
export async function updateMachineStatus(machineId: string, status: string, printerStatus: string) {
  const client = await getSupabase();
  const { error } = await client
    .from('machines')
    .update({
      status,
      printer_status: printerStatus,
      last_seen: new Date().toISOString()
    })
    .eq('machine_id', machineId);

  if (error) {
    console.error('Failed to update machine status in Supabase:', error.message);
  }
}

export async function logMachineEvent(machineId: string, event: string) {
  const client = await getSupabase();
  const { error } = await client
    .from('machine_logs')
    .insert([
      {
        machine_id: machineId,
        event,
        created_at: new Date().toISOString()
      }
    ]);

  if (error) {
    console.error('Failed to write machine log in Supabase:', error.message);
  }
}

// 3. Fetch logs for admin view
export async function fetchMachineLogs(machineId: string, limit = 50) {
  const client = await getSupabase();
  const { data, error } = await client
    .from('machine_logs')
    .select('*')
    .eq('machine_id', machineId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// 4. Fetch Order queues for this machine
export async function fetchOrders(machineId: string) {
  const client = await getSupabase();
  
  // Fetch active queue orders
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('machine_id', machineId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 5. Update order state
export async function updateOrderState(orderId: string, status: string, additionalParams: any = {}) {
  const client = await getSupabase();
  
  const updateData: any = {
    status,
    ...additionalParams
  };

  // Add specific timestamp fields based on status transitions matching database schema
  if (status === 'printing') {
    updateData.printing_at = new Date().toISOString();
  } else if (status === 'ready') {
    updateData.ready_at = new Date().toISOString();
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select();

  if (error) throw error;
  return data;
}

// 6. Realtime Active Listener Subscriptions
export async function subscribeToMachineOrders(
  machineId: string,
  onOrderUpdated: (payload: any) => void
) {
  const client = await getSupabase();

  const channel = client
    .channel(`orders:machine_id=${machineId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `machine_id=eq.${machineId}`
      },
      (payload) => {
        onOrderUpdated(payload);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function updateMachineTelemetry(
  machineId: string,
  telemetry: {
    status: string;
    printer_status: string;
    paper_level: number;
    toner_level: number;
    temperature: number;
    software_version?: string;
  }
) {
  try {
    const client = await getSupabase();
    await client
      .from('machines')
      .update({
        status: telemetry.status,
        printer_status: telemetry.printer_status,
        paper_level: telemetry.paper_level,
        toner_level: telemetry.toner_level,
        temperature: telemetry.temperature,
        software_version: telemetry.software_version || '1.0.0',
        last_seen: new Date().toISOString()
      })
      .eq('machine_id', machineId);
  } catch (err: any) {
    console.error('Failed to sync controller telemetry to Supabase:', err.message);
  }
}

