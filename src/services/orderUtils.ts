import type { Order, OrderStatus, Lang } from '../types';

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

let uidCounter = 0;
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${uidCounter.toString(36)}`;
}
