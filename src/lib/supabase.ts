import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Jovro — Supabase client
//
// The app runs 100% on local demo state until the project keys
// exist. Two ways to provide them (see supabase/SETUP.md):
//   1. a `.env` file in the repo root (recommended) with
//      VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, or
//   2. paste the same two values as the FALLBACK constants
//      below.
// The anon key is public-safe BY DESIGN: Row Level Security
// (supabase/schema.sql) is what guards the data. NEVER put the
// service_role key here — it bypasses RLS entirely.
// When neither is set, `supabase` is null and nothing changes.
// ============================================================

const FALLBACK_SUPABASE_URL = '';
const FALLBACK_SUPABASE_ANON_KEY = '';

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  FALLBACK_SUPABASE_URL ||
  undefined;
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  FALLBACK_SUPABASE_ANON_KEY ||
  undefined;

export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
