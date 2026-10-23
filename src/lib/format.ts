import type { Lang } from '../types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const EN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Convert every ASCII digit in a value to Bangla digits (or back). */
export function toBn(value: number | string, lang: Lang = 'bn'): string {
  const s = String(value);
  if (lang !== 'bn') return s;
  return s.replace(/\d/g, d => BN_DIGITS[Number(d)]);
}

export function toEn(value: string): string {
  return value.replace(/[০-৯]/g, d => EN_DIGITS[BN_DIGITS.indexOf(d)] ?? d);
}

/** ৳ + digits, localised. */
export function tk(amount: number, lang: Lang = 'bn'): string {
  return `৳${toBn(Math.round(amount).toLocaleString('en-US'), lang)}`;
}

/** Bangla month-ish short date used by orders and activity logs. */
export function formatDate(iso: string, lang: Lang = 'bn'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const monthsBn = ['জানু', 'ফেব', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগ', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = toBn(d.getDate(), lang);
  const month = lang === 'bn' ? monthsBn[d.getMonth()] : monthsEn[d.getMonth()];
  return `${day} ${month}`;
}

export function formatTime(iso: string, lang: Lang = 'bn'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 6 ? (lang === 'bn' ? 'রাত' : 'night') : h < 12 ? (lang === 'bn' ? 'সকাল' : 'AM')
    : h < 16 ? (lang === 'bn' ? 'দুপুর' : 'noon') : h < 19 ? (lang === 'bn' ? 'বিকেল' : 'PM')
      : (lang === 'bn' ? 'রাত' : 'PM');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const twelve = h >= 6 && h < 19;
  const label = twelve ? toBn(h12, lang) : toBn(h12, lang);
  return `${period} ${label}:${toBn(m, lang)}`;
}

export function timeAgo(iso: string, lang: Lang = 'bn'): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return lang === 'bn' ? `${toBn(mins, 'bn')} মিনিট আগে` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return lang === 'bn' ? `${toBn(hrs, 'bn')} ঘণ্টা আগে` : `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return lang === 'bn' ? `${toBn(days, 'bn')} দিন আগে` : `${days} day${days > 1 ? 's' : ''} ago`;
}

/** Two-digit countdown mm:ss (Bangla digits by default). */
export function countdownParts(msLeft: number) {
  const clamped = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return { h, m, s };
}
