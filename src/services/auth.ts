import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/seed';

const delay = (ms = 800) => new Promise(res => setTimeout(res, ms));

/** Any phone + any password → customer. Demo role switcher: pass role as phone */
export async function loginWithPhone(phone: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  await delay();
  const role = (Object.keys(DEMO_USERS) as UserRole[]).find(r => r === phone);
  const user = role ? DEMO_USERS[role] : DEMO_USERS.customer;
  // Simple check: password must be at least 4 chars
  if (password.length < 4) return { success: false, error: 'invalid_credentials' };
  return { success: true, user };
}

export async function requestOtp(phone: string): Promise<{ success: boolean }> {
  await delay(500);
  console.log(`[Mock OTP] Sending OTP to ${phone}: 1234`);
  return { success: true };
}

export async function verifyOtp(phone: string, otp: string, name?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  await delay(600);
  if (otp !== '1234') return { success: false, error: 'invalid_otp' };
  // A name typed on the OTP screen belongs to the session user —
  // never silently replace it with the demo profile's name.
  const trimmed = name?.trim();
  const user = trimmed ? { ...DEMO_USERS.customer, name: trimmed, nameBn: trimmed } : DEMO_USERS.customer;
  return { success: true, user };
}

export async function resetPassword(phone: string): Promise<{ success: boolean }> {
  await delay(600);
  console.log(`[Mock] Reset password for ${phone}`);
  return { success: true };
}

export async function setNewPassword(phone: string, otp: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  await delay(700);
  if (otp !== '1234') return { success: false, error: 'invalid_otp' };
  if (newPassword.length < 6) return { success: false, error: 'password_too_short' };
  return { success: true };
}

export async function signUp(name: string, phone: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  await delay(900);
  if (phone.length < 11) return { success: false, error: 'invalid_phone' };
  if (password.length < 6) return { success: false, error: 'password_too_short' };
  const user: User = {
    id: `user-${Date.now()}`,
    name,
    nameBn: name,
    mobile: phone,
    role: 'customer',
    isVerified: false,
    referralCode: `JVR${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  return { success: true, user };
}
