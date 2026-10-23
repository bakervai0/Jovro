import type { Order, OrderStatus, Lang, CartItem, TimeSlot } from '../types';

// ============================================================
// Shared order helpers for the rider / operator / affiliate
// sections (Phase 5). Demo data uses fixed sample dates
// (latest order day = "today"), so "today" is derived from
// the newest order day present in state — that keeps every
// demo screen consistent instead of empty.
// ============================================================

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(value: number | string, lang: Lang): string {
  if (lang !== 'bn') return String(value);
  return String(value).replace(/\d/g, d => BN_DIGITS[Number(d)]);
}

export function fmtTk(amount: number, lang: Lang): string {
  return `৳${toBnDigits(amount, lang)}`;
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** The newest calendar day that has any order — the demo "today". */
export function latestOrderDay(orders: Order[]): string {
  if (orders.length === 0) return new Date().toISOString().slice(0, 10);
  return orders.reduce((max, o) => (dayKey(o.createdAt) > max ? dayKey(o.createdAt) : max), dayKey(orders[0].createdAt));
}

export function isTodayOrder(order: Order, orders: Order[]): boolean {
  const today = latestOrderDay(orders);
  const realToday = new Date().toISOString().slice(0, 10);
  return dayKey(order.createdAt) === today || dayKey(order.createdAt) === realToday;
}

export function todayOrders(orders: Order[]): Order[] {
  return orders.filter(o => isTodayOrder(o, orders));
}

/** Orders still needing work (not delivered/failed/cancelled/refunded). */
export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way'];

export function isActiveOrder(order: Order): boolean {
  return ACTIVE_STATUSES.includes(order.status);
}

const NEXT_FLOW: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way', 'delivered'];

export function nextStatus(order: Order): OrderStatus | null {
  const idx = NEXT_FLOW.indexOf(order.status);
  if (idx === -1 || idx >= NEXT_FLOW.length - 1) return null;
  return NEXT_FLOW[idx + 1];
}

export const STATUS_META: Record<OrderStatus, { labelBn: string; labelEn: string; variant: 'primary' | 'success' | 'warning' | 'error' | 'surface'; icon: string }> = {
  pending: { labelBn: 'অপেক্ষায়', labelEn: 'Pending', variant: 'warning', icon: 'receipt' },
  confirmed: { labelBn: 'নিশ্চিত হয়েছে', labelEn: 'Confirmed', variant: 'primary', icon: 'check_circle' },
  buying: { labelBn: 'কেনাকাটা হচ্ছে', labelEn: 'Buying', variant: 'warning', icon: 'shopping_basket' },
  'on-the-way': { labelBn: 'আসছে', labelEn: 'On the way', variant: 'primary', icon: 'directions_bike' },
  delivered: { labelBn: 'ডেলিভারি হয়েছে', labelEn: 'Delivered', variant: 'success', icon: 'task_alt' },
  failed: { labelBn: 'ডেলিভারি ব্যর্থ', labelEn: 'Delivery Failed', variant: 'error', icon: 'error' },
  cancelled: { labelBn: 'বাতিল হয়েছে', labelEn: 'Cancelled', variant: 'error', icon: 'cancel' },
  'refund-in-progress': { labelBn: 'রিফান্ড হচ্ছে', labelEn: 'Refunding', variant: 'warning', icon: 'currency_exchange' },
  refunded: { labelBn: 'রিফান্ড হয়েছে', labelEn: 'Refunded', variant: 'success', icon: 'paid' },
};

export const SLOT_META: Record<string, { labelBn: string; labelEn: string; rangeBn: string; rangeEn: string }> = {
  morning: { labelBn: 'সকালের রান', labelEn: 'Morning run', rangeBn: 'সকাল ৬:০০–দুপুর ১:৩০', rangeEn: '6:00 AM–1:30 PM' },
  afternoon: { labelBn: 'দুপুরের রান', labelEn: 'Afternoon run', rangeBn: 'দুপুর ১২:০০–১:৩০', rangeEn: '12:00–1:30 PM' },
  evening: { labelBn: 'বিকেলের রান', labelEn: 'Evening run', rangeBn: 'বিকেল ৪:৩০–রাত ১০:৩০', rangeEn: '4:30–10:30 PM' },
};

export function areaName(
  areas: { id: string; nameBn: string; nameEn: string }[],
  areaId: string,
  lang: Lang,
): string {
  const a = areas.find(x => x.id === areaId);
  if (!a) return areaId;
  return lang === 'bn' ? a.nameBn : a.nameEn;
}

/** Cash the rider collects for an order (customer pays on delivery). */
export function cashToCollect(order: Order): number {
  return order.finalTotal;
}

/** Company cut kept from an order's delivery fee. Uses the cut
 *  frozen on the order at delivery time when present
 *  (fee − riderEarning); otherwise the currently configured
 *  cut, clamped to the fee. */
export function companyCutOf(order: Order, configuredCut: number): number {
  if (typeof order.riderEarning === 'number') {
    return Math.max(0, order.deliveryFee - order.riderEarning);
  }
  return Math.min(Math.max(0, configuredCut), order.deliveryFee);
}

/** What the rider earned (earns) for an order: fee − cut. */
export function riderEarningOf(order: Order, configuredCut: number): number {
  return order.deliveryFee - companyCutOf(order, configuredCut);
}

let uidCounter = 0;
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

// ── Service hours (Asia/Dhaka) ────────────────────────────────
// Baker's split shifts: 06:00–13:30 and 16:30–22:30, always
// evaluated in Dhaka time regardless of the device timezone.
export const SERVICE_WINDOWS_MIN = [
  { start: 6 * 60, end: 13 * 60 + 30 },
  { start: 16 * 60 + 30, end: 22 * 60 + 30 },
];

export function dhakaMinutesNow(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  return (h % 24) * 60 + m;
}

export function isWithinServiceHours(d: Date = new Date()): boolean {
  const mins = dhakaMinutesNow(d);
  return SERVICE_WINDOWS_MIN.some(w => mins >= w.start && mins < w.end);
}

/** Checkout slot that matches the current Dhaka time of day. */
export function defaultSlotForNow(d: Date = new Date()): TimeSlot {
  const mins = dhakaMinutesNow(d);
  if (mins < SERVICE_WINDOWS_MIN[0].end) return 'morning';
  if (mins < SERVICE_WINDOWS_MIN[1].start) return 'afternoon';
  if (mins < SERVICE_WINDOWS_MIN[1].end) return 'evening';
  return 'morning'; // after close → tomorrow's first run
}

// ── Cart line lookup (price-split lines) ──────────────────────
// The same product can sit in the cart on several lines (regular
// vs flash-sale price, pack variants `${id}:${pack}`). Steppers
// must act on the real line id, never assume id === productId.
/** Line for a product at one exact unit price (e.g. flash price). */
export function cartLineForPrice(cart: CartItem[], productId: string, price: number): CartItem | undefined {
  return cart.find(i => (i.productId ?? i.id) === productId && i.price === price);
}

/** The product's primary line: exact-id line first, else any line
 * carrying the productId (pack / price-split variants). */
export function primaryCartLine(cart: CartItem[], productId: string): CartItem | undefined {
  return cart.find(i => i.id === productId)
    ?? cart.find(i => (i.productId ?? i.id) === productId);
}
