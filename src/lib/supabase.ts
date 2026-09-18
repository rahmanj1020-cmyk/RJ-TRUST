import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  '';

const supabaseKey: string =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.SUPABASE_ANON_KEY ||
  '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Executes a query on a Supabase table with automatic safety checks
 */
export async function queryTable<T = any>(
  tableName: string,
  columns: string = '*'
): Promise<{ data: T[] | null; error: Error | null }> {
  if (!supabase) {
    const errorMsg = 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    console.warn(errorMsg);
    return { data: null, error: new Error(errorMsg) };
  }

  try {
    const { data, error } = await supabase.from(tableName).select(columns);
    if (error) {
      console.error(`Supabase query error on '${tableName}':`, error);
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as T[], error: null };
  } catch (err: any) {
    console.error(`Unexpected error querying Supabase table '${tableName}':`, err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Inserts a record into a Supabase table
 */
export async function insertRecord<T = any>(
  tableName: string,
  record: Record<string, any>
): Promise<{ data: T | null; error: Error | null }> {
  if (!supabase) {
    const errorMsg = 'Supabase is not configured.';
    return { data: null, error: new Error(errorMsg) };
  }

  try {
    const { data, error } = await supabase.from(tableName).insert([record]).select();
    if (error) {
      console.error(`Supabase insert error on '${tableName}':`, error);
      return { data: null, error: new Error(error.message) };
    }
    return { data: (data && data[0]) as T, error: null };
  } catch (err: any) {
    console.error(`Unexpected error inserting to Supabase table '${tableName}':`, err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export function getClientSupabase(): SupabaseClient | null {
  if (!supabase) {
    console.warn('Supabase client environment variables are missing or not yet configured.');
  }
  return supabase;
}
