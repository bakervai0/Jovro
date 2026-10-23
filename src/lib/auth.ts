// ============================================================
// Jovro — Supabase Auth helpers (backend Phase 2)
//
// Thin, typed wrappers around supabase.auth + the `profiles`
// table. Identity model (Baker's rule): ONE app — the role is
// decided by the email registered in `profiles`. Signup creates
// a 'customer' profile automatically (DB trigger); Baker
// promotes accounts by changing profiles.role.
//
// SAFE WHEN UNCONFIGURED: every function checks
// `isSupabaseConfigured` first and returns a typed
// 'not-configured' error instead of throwing — the app keeps
// running on demo state until Baker sets the .env keys.
// Nothing in the app calls these yet (Phase 3 wires them in).
// ============================================================

import type {
  AuthChangeEvent,
  Session,
  User as SupabaseAuthUser,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import type { User, UserRole } from '../types';

// ── Shared result / error shape (also used by backend.ts) ────
export type BackendErrorCode = 'not-configured' | 'auth' | 'db' | 'unknown';

export interface BackendError {
  code: BackendErrorCode;
  message: string;
  cause?: unknown;
}

export type AuthResult<T> = { data: T | null; error: BackendError | null };

export const NOT_CONFIGURED_ERROR: BackendError = {
  code: 'not-configured',
  message:
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see supabase/SETUP.md).',
};

function toBackendError(e: unknown, code: BackendErrorCode = 'unknown'): BackendError {
  if (e instanceof Error) return { code, message: e.message, cause: e };
  return { code, message: String(e), cause: e };
}

// ── Profile (public.profiles row, camelCased) ────────────────
export interface DbProfileRow {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  name_bn: string;
  mobile: string;
  avatar_url: string | null;
  delivery_area_id: string | null;
  is_verified: boolean;
  status: 'active' | 'inactive';
  referral_code: string | null;
  referred_by: string | null;
  has_active_pass: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  nameBn: string;
  mobile: string;
  avatarUrl?: string;
  deliveryAreaId?: string;
  isVerified: boolean;
  status: 'active' | 'inactive';
  referralCode?: string;
  referredBy?: string;
  hasActivePass: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapProfileRow(row: DbProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    nameBn: row.name_bn,
    mobile: row.mobile,
    avatarUrl: row.avatar_url ?? undefined,
    deliveryAreaId: row.delivery_area_id ?? undefined,
    isVerified: row.is_verified,
    status: row.status,
    referralCode: row.referral_code ?? undefined,
    referredBy: row.referred_by ?? undefined,
    hasActivePass: row.has_active_pass,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert a backend Profile into the app's session `User` shape. */
export function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.name,
    nameBn: p.nameBn,
    mobile: p.mobile,
    email: p.email,
    role: p.role,
    avatarUrl: p.avatarUrl,
    deliveryAreaId: p.deliveryAreaId,
    isVerified: p.isVerified,
    createdAt: p.createdAt,
    referralCode: p.referralCode ?? '',
    referredBy: p.referredBy,
    hasActivePass: p.hasActivePass,
  };
}

// ── Role → home route (matches src/App.tsx) ──────────────────
// admin → /admin/* · staff → /staff/* · rider → /rider ·
// affiliate → /affiliate/* · customer → / (CustomerLayout)
export function routeForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    case 'rider':
      return '/rider';
    case 'affiliate':
      return '/affiliate';
    case 'customer':
    default:
      return '/';
  }
}

// ── Sign up ──────────────────────────────────────────────────
export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  nameBn?: string;
  mobile?: string;
  /** Referral code of whoever referred this user (stored on the profile). */
  referredBy?: string;
}

export interface AuthSuccess {
  user: SupabaseAuthUser;
  session: Session | null;
  /** Null when email confirmation is still pending (no session yet). */
  profile: Profile | null;
}

export async function signUp(input: SignUpInput): Promise<AuthResult<AuthSuccess>> {
  const db = supabase;
  if (!isSupabaseConfigured || !db) return { data: null, error: NOT_CONFIGURED_ERROR };
  try {
    // The handle_new_user() trigger reads name / name_bn / mobile
    // from raw_user_meta_data — keep these keys exactly as-is.
    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          name_bn: input.nameBn ?? '',
          mobile: input.mobile ?? '',
        },
      },
    });
    if (error) return { data: null, error: toBackendError(error, 'auth') };
    if (!data.user) {
      return {
        data: null,
        error: { code: 'auth', message: 'Sign-up did not return a user.' },
      };
    }
    // Record who referred this user (self-update is allowed by RLS;
    // referred_by is not one of the trigger-guarded fields).
    if (data.session && input.referredBy) {
      await db
        .from('profiles')
        .update({ referred_by: input.referredBy })
        .eq('id', data.user.id);
    }
    const profile = data.session ? (await getMyProfile()).data : null;
    return { data: { user: data.user, session: data.session, profile }, error: null };
  } catch (e) {
    return { data: null, error: toBackendError(e, 'auth') };
  }
}

// ── Sign in ──────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult<AuthSuccess>> {
  const db = supabase;
  if (!isSupabaseConfigured || !db) return { data: null, error: NOT_CONFIGURED_ERROR };
  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: toBackendError(error, 'auth') };
    if (!data.user) {
      return {
        data: null,
        error: { code: 'auth', message: 'Sign-in did not return a user.' },
      };
    }
    const profile = (await getMyProfile()).data;
    return { data: { user: data.user, session: data.session, profile }, error: null };
  } catch (e) {
    return { data: null, error: toBackendError(e, 'auth') };
  }
}

// ── Sign out ─────────────────────────────────────────────────
export async function signOut(): Promise<{ success: boolean; error: BackendError | null }> {
  const db = supabase;
  if (!isSupabaseConfigured || !db) return { success: false, error: NOT_CONFIGURED_ERROR };
  try {
    const { error } = await db.auth.signOut();
    if (error) return { success: false, error: toBackendError(error, 'auth') };
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: toBackendError(e, 'auth') };
  }
}

// ── My profile ───────────────────────────────────────────────
/** Fetch the signed-in user's row from `profiles` (role incl.). */
export async function getMyProfile(): Promise<AuthResult<Profile>> {
  const db = supabase;
  if (!isSupabaseConfigured || !db) return { data: null, error: NOT_CONFIGURED_ERROR };
  try {
    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError) return { data: null, error: toBackendError(userError, 'auth') };
    const user = userData.user;
    if (!user) {
      return { data: null, error: { code: 'auth', message: 'Not signed in.' } };
    }
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) return { data: null, error: toBackendError(error, 'db') };
    return { data: mapProfileRow(data as DbProfileRow), error: null };
  } catch (e) {
    return { data: null, error: toBackendError(e) };
  }
}

// ── Auth state subscription ──────────────────────────────────
export interface AuthChangeState {
  event: AuthChangeEvent;
  session: Session | null;
  /** Freshly fetched profile when a user is signed in, else null. */
  profile: Profile | null;
}

/**
 * Subscribe to auth changes. Returns an unsubscribe function
 * (a safe no-op when Supabase is not configured).
 */
export function onAuthChange(callback: (state: AuthChangeState) => void): () => void {
  const db = supabase;
  if (!isSupabaseConfigured || !db) return () => undefined;
  const { data } = db.auth.onAuthStateChange((event, session) => {
    void (async () => {
      const profile = session?.user ? (await getMyProfile()).data : null;
      callback({ event, session, profile });
    })();
  });
  return () => data.subscription.unsubscribe();
}
