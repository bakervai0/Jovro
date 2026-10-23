import React from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { DEMO_USERS } from '../../data/seed';
import type { Order, OrderStatus, ProblemType } from '../../types';
import { STATUS_META, fmtTk, toBnDigits, uid } from '../../services/orderUtils';

// ============================================================
// Shared building blocks for the Admin section (Section H).
// Layouts, headings and labels follow the Stitch design files
// in ~/workspace/github-work/jovro-design (see the per-screen
// notes in each admin file).
// ============================================================

export function useBn() {
  const { state } = useApp();
  return state.lang === 'bn';
}

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={clsx('material-symbols-outlined', className)}>{name}</span>;
}

/** Page heading block used at the top of most admin designs. */
export function PageTitle({
  icon, titleBn, titleEn, subBn, subEn, right,
}: {
  icon: string; titleBn: string; titleEn: string; subBn?: string; subEn?: string; right?: React.ReactNode;
}) {
  const bn = useBn();
  return (
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon name={icon} className="text-primary text-[24px]" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-headline-sm font-bold text-on-surface leading-tight">{bn ? titleBn : titleEn}</h2>
        {(subBn || subEn) && (
          <p className="text-label-md text-on-surface-variant mt-0.5">{bn ? subBn : subEn}</p>
        )}
      </div>
      {right}
    </div>
  );
}

/** Section heading with icon, as in the designs ("দৈনিক পরিসংখ্যান · Today's Metrics"). */
export function SectionHead({
  icon, titleBn, titleEn, right,
}: {
  icon: string; titleBn: string; titleEn: string; right?: React.ReactNode;
}) {
  const bn = useBn();
  return (
    <div className="flex items-center gap-2 mt-1">
      <Icon name={icon} className="text-primary text-[20px]" />
      <h3 className="text-label-lg font-bold text-on-surface flex-1">{bn ? titleBn : titleEn}</h3>
      {right}
    </div>
  );
}

export function AdminCard({
  children, className, onClick,
}: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 shadow-card',
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={clsx(
      'w-10 h-10 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold text-body-lg flex-shrink-0',
      className,
    )}>
      {name.trim().charAt(0)}
    </div>
  );
}

export function ToggleRow({
  titleBn, titleEn, subBn, subEn, checked, onChange, danger,
}: {
  titleBn: string; titleEn: string; subBn?: string; subEn?: string;
  checked: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  const bn = useBn();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface">{bn ? titleBn : titleEn}</p>
        {(subBn || subEn) && <p className="text-label-sm text-on-surface-variant mt-0.5">{bn ? subBn : subEn}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
          checked ? (danger ? 'bg-error' : 'bg-primary') : 'bg-surface-container-highest',
        )}
      >
        <span className={clsx(
          'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-6' : 'left-1',
        )} />
      </button>
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border-2 border-outline-variant focus:border-primary bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none';

export function Field({
  labelBn, labelEn, required, children, hint,
}: {
  labelBn: string; labelEn: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  const bn = useBn();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md font-semibold text-on-surface-variant">
        {bn ? labelBn : labelEn}{required && <span className="text-error"> *</span>}
      </span>
      {children}
      {hint && <span className="text-label-sm text-on-surface-variant/70">{hint}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const bn = useBn();
  const meta = STATUS_META[status];
  const color = {
    primary: 'bg-primary/12 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-error/12 text-error',
    surface: 'bg-surface-container text-on-surface-variant',
  }[meta.variant];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-semibold', color)}>
      <Icon name={meta.icon} className="text-[13px]" />
      {bn ? meta.labelBn : meta.labelEn}
    </span>
  );
}

/** Dispatch a team-activity entry (H24) for a key admin action. */
export function logAction(
  dispatch: ReturnType<typeof useApp>['dispatch'],
  actorName: string,
  action: string,
  category?: 'order' | 'refund' | 'general',
) {
  dispatch({
    type: 'LOG_ACTIVITY',
    entry: { id: uid('act'), actorName, action, at: new Date().toISOString(), category },
  });
}

export function useActorName() {
  const { state } = useApp();
  return state.user?.nameBn || state.user?.name || 'অ্যাডমিন';
}

export function fmtDate(iso: string, lang: 'bn' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(iso: string, lang: 'bn' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: 'numeric', minute: '2-digit' });
}

export { fmtTk, toBnDigits };

// ── Customer directory (H11/H17/H18) ──────────────────────────
// Customers come from DEMO_USERS + whoever appears in orders.
// Identity is the user id / order.customerId, used consistently
// in search, the customers list and the 360° view.
export interface CustomerRow {
  id: string;
  name: string;
  mobile: string;
  areaId?: string;
  address?: string;
  joinedAt?: string;
  hasPass: boolean;
  orders: Order[];
  totalSpent: number;
  lastOrderAt?: string;
  openComplaints: number;
}

export function buildCustomers(
  orders: Order[],
  problemReports: { customerId: string; status: string }[],
): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  const demo = DEMO_USERS.customer;
  map.set(demo.id, {
    id: demo.id, name: demo.nameBn, mobile: demo.mobile,
    areaId: demo.deliveryAreaId, joinedAt: demo.createdAt,
    hasPass: !!demo.hasActivePass, orders: [], totalSpent: 0, openComplaints: 0,
  });
  for (const o of orders) {
    let row = map.get(o.customerId);
    if (!row) {
      row = {
        id: o.customerId, name: o.customerName, mobile: o.customerMobile,
        areaId: o.deliveryAreaId, address: o.deliveryAddress,
        hasPass: false, orders: [], totalSpent: 0, openComplaints: 0,
      };
      map.set(o.customerId, row);
    }
    row.orders.push(o);
    row.totalSpent += o.finalTotal;
    if (!row.address) row.address = o.deliveryAddress;
    if (!row.lastOrderAt || o.createdAt > row.lastOrderAt) row.lastOrderAt = o.createdAt;
  }
  for (const r of problemReports) {
    const row = map.get(r.customerId);
    if (row && r.status !== 'resolved') row.openComplaints += 1;
  }
  for (const row of map.values()) {
    row.orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return [...map.values()].sort((a, b) => b.orders.length - a.orders.length);
}

/** Visible customer id, e.g. u-001 → CUS-001 (search accepts both). */
export function customerCode(id: string): string {
  const m = id.match(/(\d+)$/);
  return m ? `CUS-${m[1]}` : id.toUpperCase();
}

export const PROBLEM_LABELS: Record<ProblemType, { bn: string; en: string; icon: string }> = {
  'wrong-item': { bn: 'ভুল জিনিস', en: 'Wrong item', icon: 'swap_horiz' },
  'missing-item': { bn: 'কম এসেছে', en: 'Missing item', icon: 'remove_shopping_cart' },
  damaged: { bn: 'নষ্ট বা পচা জিনিস', en: 'Damaged or spoiled', icon: 'warning' },
  'late-delivery': { bn: 'দেরি হয়েছে', en: 'Late delivery', icon: 'schedule' },
  overcharged: { bn: 'বেশি দাম নেওয়া হয়েছে', en: 'Overcharged', icon: 'price_change' },
  other: { bn: 'অন্যান্য', en: 'Other', icon: 'report' },
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'confirmed', 'buying', 'on-the-way', 'delivered', 'cancelled', 'failed',
];
