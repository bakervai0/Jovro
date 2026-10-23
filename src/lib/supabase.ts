import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Jovro — Supabase client (backend foundation, Phase: backend-1)
//
// The app runs 100% on local demo state until these env vars
// are set. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
// missing, `supabase` is null and nothing in the app changes.
// Setup steps: see supabase/SETUP.md
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
