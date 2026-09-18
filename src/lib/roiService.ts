import { supabase } from './supabase';

export interface RoiLog {
  id?: string;
  user_id?: string;
  plan_id?: string;
  plan_name?: string;
  amount: number;
  percentage?: number;
  date: string;
  status?: string;
  created_at?: string;
}

/**
 * Fetch the last 7 days of ROI performance records from the 'roi_logs' Supabase table.
 * If user_id is provided, filters for that specific user.
 * Falls back gracefully to date-sorted records or local structure.
 */
export async function fetchLast7DaysRoiLogs(userId?: string): Promise<{ data: RoiLog[]; error: Error | null }> {
  if (!supabase) {
    return {
      data: [],
      error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    };
  }

  try {
    // Calculate cutoff date 7 days ago (YYYY-MM-DD)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateThreshold = sevenDaysAgo.toISOString().split('T')[0];

    let query = supabase
      .from('roi_logs')
      .select('*')
      .gte('date', dateThreshold)
      .order('date', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching last 7 days ROI logs from Supabase:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data as RoiLog[]) || [], error: null };
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error('Unexpected exception querying roi_logs:', errorObj);
    return { data: [], error: errorObj };
  }
}

/**
 * Inserts an ROI performance entry into the 'roi_logs' table.
 */
export async function logRoiPerformance(log: Omit<RoiLog, 'id' | 'created_at'>): Promise<{ data: RoiLog | null; error: Error | null }> {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase
      .from('roi_logs')
      .insert([
        {
          ...log,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data && data[0] ? (data[0] as RoiLog) : null, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
