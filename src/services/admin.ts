import { getSupabase } from './supabase';

export interface AdminUser {
  id: string;
  email?: string;
}

export class AdminAuthService {
  public static async getAdminUser(): Promise<AdminUser | null> {
    try {
      const supabase = await getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email
      };
    } catch {
      return null;
    }
  }

  public static async loginWithEmail(email: string, password: string): Promise<AdminUser> {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message || 'Failed to authenticate.');
    }

    if (!data.user) {
      throw new Error('User not found.');
    }

    return {
      id: data.user.id,
      email: data.user.email
    };
  }

  public static async loginWithGoogle(): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin'
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to initialize Google Login.');
    }
  }

  public static async logout(): Promise<void> {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  }
}

export interface MachineAdminInfo {
  id: string;
  machine_id: string;
  machine_name: string;
  location: string;
  address: string;
  status: string;
  printer_status: string;
  last_seen: string;
  paper_level: number;
  toner_level: number;
  temperature: number;
  software_version: string;
  internet_speed_mbps: number;
  contact_number: string;
  qr_code_url: string;
  maintenance_mode: boolean;
}

export class AdminMachineService {
  public static async fetchMachines(): Promise<MachineAdminInfo[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('machine_name', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Failed to fetch machines.');
    }

    return data || [];
  }

  public static async sendMachineCommand(machineId: string, command: string): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('machine_commands')
      .insert([
        {
          machine_id: machineId,
          command: command,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      throw new Error(error.message || 'Failed to dispatch command to machine.');
    }
  }

  public static async updateShopSettings(
    machineId: string,
    settings: {
      machine_name: string;
      location: string;
      address: string;
      contact_number: string;
    }
  ): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('machines')
      .update({
        machine_name: settings.machine_name,
        location: settings.location,
        address: settings.address,
        contact_number: settings.contact_number
      })
      .eq('machine_id', machineId);

    if (error) {
      throw new Error(error.message || 'Failed to update shop settings.');
    }
  }

  public static async updateQrCodeUrl(machineId: string, qrCodeUrl: string): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('machines')
      .update({ qr_code_url: qrCodeUrl })
      .eq('machine_id', machineId);

    if (error) {
      throw new Error(error.message || 'Failed to update QR code URL.');
    }
  }

  public static subscribeToMachines(onUpdate: () => void) {
    let channel: any = null;
    getSupabase().then((supabase) => {
      channel = supabase
        .channel('admin-machines-all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'machines' },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        getSupabase().then((supabase) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }

  public static subscribeToMachineOrders(machineId: string, onUpdate: () => void) {
    let channel: any = null;
    getSupabase().then((supabase) => {
      channel = supabase
        .channel(`admin-orders-${machineId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `machine_id=eq.${machineId}` },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        getSupabase().then((supabase) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }

  public static subscribeToMachineLogs(machineId: string, onUpdate: () => void) {
    let channel: any = null;
    getSupabase().then((supabase) => {
      channel = supabase
        .channel(`admin-logs-${machineId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'machine_logs', filter: `machine_id=eq.${machineId}` },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        getSupabase().then((supabase) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }
}
