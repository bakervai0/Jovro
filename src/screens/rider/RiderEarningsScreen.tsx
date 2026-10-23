import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { useCurrentRider } from '../../components/shared/RiderBits';
import { fmtTk, toBnDigits, dayKey, latestOrderDay, riderEarningOf } from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';
import type { Order, PaymentRequest } from '../../types';

const METHODS = [
  { id: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash', tile: 'bK', tileClass: 'bg-[#E2136E]', dotClass: 'bg-[#E2136E]' },
  { id: 'nagad', labelBn: 'নগদ', labelEn: 'Nagad', tile: 'নগদ', tileClass: 'bg-[#F7941D]', dotClass: 'bg-[#F7941D]' },
] as const;

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function fmtTime(iso: string, lang: 'bn' | 'en'): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return lang === 'bn'
    ? `${toBnDigits(h, 'bn')}:${toBnDigits(String(m).padStart(2, '0'), 'bn')} ${ampm}`
    : `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function dayShiftKey(anchor: string, daysBack: number): string {
  const d = new Date(`${anchor}T00:00:00`);
  d.setDate(d.getDate() - daysBack);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtShortDay(day: string, lang: 'bn' | 'en'): string {
  const d = new Date(`${day}T00:00:00`);
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${toBnDigits(d.getDate(), 'bn')} ${BN_MONTHS[d.getMonth()]}`;
}

function fmtFullDay(day: string, lang: 'bn' | 'en'): string {
  const d = new Date(`${day}T00:00:00`);
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${toBnDigits(d.getDate(), 'bn')} ${BN_MONTHS[d.getMonth()]}, ${toBnDigits(d.getFullYear(), 'bn')}`;
}

/**
 * F7 Earnings + F8 payout — strict Stitch replica: r2.3 (overview)
 * sections in design order — identity strip, title, pending-payout
 * hero, request CTA, 3-card stats grid, recent earnings stream,
 * help card — followed by the r2.4 sections (withdrawal form +
 * previous requests) merged into the same scroll. A rider's earning
 * per delivery = the order's delivery fee. Periods anchor to the
 * newest order day (demo "today").
 */
export default function RiderEarningsScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const rider = useCurrentRider();

  // Owner's model (Oct 23): no per-request withdrawals — riders
  // deposit all cash at the office and are paid their accumulated
  // share (fee − company cut) as a MONTHLY settlement.

  const delivered = useMemo(
    () => state.orders
      .filter(o => o.riderId === rider?.id && o.status === 'delivered')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.orders, rider?.id],
  );

  const anchor = latestOrderDay(state.orders);
  const yesterday = dayShiftKey(anchor, 1);
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const inLastDays = (iso: string, days: number) => {
    const d = new Date(`${dayKey(iso)}T00:00:00`);
    const diff = Math.round((anchorDate.getTime() - d.getTime()) / 86400000);
    return diff >= 0 && diff < days;
  };

  const cut = state.adminSettings.companyCutPerDelivery ?? 10;
  // All rider-facing totals are the rider's share: fee − cut.
  const sumFee = (list: typeof delivered) => list.reduce((s, o) => s + riderEarningOf(o, cut), 0);
  const todayList = delivered.filter(o => dayKey(o.createdAt) === anchor);
  const weekList = delivered.filter(o => inLastDays(o.createdAt, 7));
  const monthList = delivered.filter(o => dayKey(o.createdAt).slice(0, 7) === anchor.slice(0, 7));
  const monthEarning = sumFee(monthList);
  const todayFeeUniform = todayList.length > 0 && todayList.every(o => riderEarningOf(o, cut) === riderEarningOf(todayList[0], cut));

  const periods = [
    { kind: 'today' as const, labelBn: 'আজ / Today', labelEn: 'Today', value: sumFee(todayList), count: todayList.length, icon: null as string | null, iconClass: '', dot: true },
    { kind: 'week' as const, labelBn: 'এই সপ্তাহ', labelEn: 'This week', value: sumFee(weekList), count: weekList.length, icon: 'calendar_today', iconClass: 'text-secondary', dot: false },
    { kind: 'all' as const, labelBn: 'সর্বমোট', labelEn: 'All-time', value: sumFee(delivered), count: delivered.length, icon: 'savings', iconClass: 'text-tertiary', dot: false },
  ];

  const myRequests = state.paymentRequests.filter(r => r.riderId === rider?.id);
  const pendingPayout = rider?.pendingPayout ?? 0;

  /* Recent stream (r2.3): completed deliveries aggregated per day,
     interleaved with paid-out requests (outbox rows), newest first. */
  type StreamItem =
    | { kind: 'earn'; key: string; day: string; count: number; total: number; latestIso: string }
    | { kind: 'payout'; key: string; req: PaymentRequest; iso: string };
  const streamItems = useMemo<StreamItem[]>(() => {
    const byDay = new Map<string, Order[]>();
    delivered.forEach(o => {
      const k = dayKey(o.createdAt);
      byDay.set(k, [...(byDay.get(k) ?? []), o]);
    });
    const earns: StreamItem[] = [...byDay.entries()].map(([day, list]) => ({
      kind: 'earn',
      key: `earn-${day}`,
      day,
      count: list.length,
      total: list.reduce((s, o) => s + riderEarningOf(o, cut), 0),
      latestIso: list[0].createdAt,
    }));
    const payouts: StreamItem[] = myRequests
      .filter(r => r.status === 'paid')
      .map(r => ({ kind: 'payout', key: `pay-${r.id}`, req: r, iso: r.paidAt ?? r.requestedAt }));
    const sortKey = (it: StreamItem) => (it.kind === 'earn' ? it.latestIso : it.iso);
    return [...earns, ...payouts].sort((a, b) => sortKey(b).localeCompare(sortKey(a))).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivered, state.paymentRequests, rider?.id]);

  const relLabel = (day: string) =>
    day === anchor ? (bn ? 'আজ' : 'Today')
      : day === yesterday ? (bn ? 'গতকাল' : 'Yesterday')
        : fmtShortDay(day, lang);

  const riderName = bn ? rider?.nameBn : rider?.name;
  const riderInitial = riderName?.trim().charAt(0) ?? 'র';
  const activeTrips = state.orders.filter(o => o.riderId === rider?.id && !['delivered', 'failed', 'cancelled'].includes(o.status)).length;

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* r2.3 header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 shadow-sm shrink-0">
        <div className="flex justify-between items-center w-full px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">pedal_bike</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Jovro</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary tracking-wide uppercase">
                  {bn ? 'রাইডার' : 'Rider'}
                </span>
              </div>
              <div className="flex items-center text-outline text-[11px] font-bilingual-sub">
                <span className="material-symbols-outlined text-[13px] mr-0.5 text-primary">location_on</span>
                <span>{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'} • Lalmonirhat Sadar</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
            className="flex items-center px-2 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-label-md font-label-md"
          >
            <span className="material-symbols-outlined text-sm mr-1 text-primary">language</span>
            বাংলা | EN
          </button>
        </div>
      </header>

      <PageFrame>
        {/* Identity strip (r2.3) */}
        <section className="flex items-center justify-between bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20 shadow-sm mt-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm shadow-sm ring-2 ring-primary-fixed/50">
                {riderInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full ring-2 ring-surface-container-lowest" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface truncate">{riderName}</h2>
                <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1">
                <span>{rider?.vehicleType === 'motorbike' ? 'Motorbike Courier' : 'Bicycle Courier'}</span>
                <span className="text-outline-variant">•</span>
                <span className="font-mono text-[11px] font-semibold text-secondary">#{rider?.id.replace('rider-', 'JVR-')}</span>
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
              {bn ? 'সক্রিয় ডিউটি' : 'Active duty'}
            </div>
            <p className="text-[10px] text-outline mt-0.5">
              {bn ? `${toBnDigits(activeTrips, lang)}টি ট্রিপ প্রস্তুত` : `${activeTrips} trips ready`}
            </p>
          </div>
        </section>

        {/* Title (r2.3) */}
        <div className="flex items-baseline justify-between pt-4">
          <div>
            <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">{bn ? 'আমার আয় ও পেমেন্ট' : 'My Earnings & Payout'}</h1>
            <p className="text-bilingual-sub font-bilingual-sub text-outline">Rider Earnings &amp; Payout Summary</p>
          </div>
          <span className="text-[11px] font-label-md text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10 shrink-0">
            {bn ? 'রিয়েল-টাইম হিসাব' : 'Real-time'}
          </span>
        </div>

        {/* Pending payout hero (r2.3) */}
        <section className="bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl p-5 shadow-lg relative overflow-hidden mt-3">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-2 right-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[88px]">account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-label-md font-label-md">
                <span className="material-symbols-outlined text-sm mr-1.5 text-primary-fixed">hourglass_top</span>
                {bn ? 'মোট পাওনা বাকি / Pending payable' : 'Pending payable'}
              </span>
              <span className="text-xs text-primary-fixed-dim font-medium tracking-wide">{bn ? '১০০% স্বচ্ছ হিসাব' : '100% transparent'}</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-3xl font-bold tracking-tight text-white">৳</span>
              <span className="text-5xl font-extrabold tracking-tight text-white leading-none">{toBnDigits(pendingPayout.toLocaleString('en-IN'), lang)}</span>
              <span className="text-sm font-medium text-primary-fixed ml-1">(৳{pendingPayout} BDT)</span>
            </div>
            <p className="text-body-sm font-body-sm text-white/90 mt-2 leading-relaxed">
              {bn
                ? <>প্রতিটা ডেলিভারির আয় (ফি − কোম্পানি কাট) এখানে জমা হয় <span className="text-primary-fixed text-xs">• Your share of every delivery fee (fee − company cut) collects here</span></>
                : 'Your share of every delivery fee (fee − company cut) collects here.'}
            </p>
            <div className="w-full h-px bg-white/15 my-3.5" />
            <div className="flex items-center gap-2 text-[11px] text-white/90 font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>{bn ? 'মাসের শেষে অফিস থেকে পেমেন্ট দেওয়া হবে • Paid from the office at month-end' : 'Paid from the office at month-end'}</span>
            </div>
          </div>
        </section>

        {/* Monthly settlement summary (owner's model, Oct 23 —
            replaces the old per-request withdrawal entry) */}
        <section className="mt-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-label-lg font-label-lg font-bold text-on-surface">
                {bn ? 'মাসিক সেটেলমেন্ট / Monthly settlement' : 'Monthly settlement'}
              </p>
              <p className="text-body-sm text-on-surface-variant leading-relaxed mt-0.5">
                {bn
                  ? 'মাসের শেষে অফিস থেকে পেমেন্ট দেওয়া হবে। প্রতিদিনের সব ডেলিভারির ক্যাশ অফিসে জমা দিন — আলাদা করে টাকা তোলার রিকোয়েস্ট লাগবে না।'
                  : 'You will be paid from the office at the end of the month. Deposit all delivery cash at the office daily — no separate withdrawal request is needed.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-3 text-center">
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'এই মাসের আয়' : "This month's earnings"}</p>
              <p className="text-headline-sm font-headline-sm font-bold text-primary mt-0.5">{fmtTk(monthEarning, lang)}</p>
              <p className="text-[10px] text-outline">{bn ? `${toBnDigits(monthList.length, lang)}টি ডেলিভারি` : `${monthList.length} deliveries`}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-3 text-center">
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'মোট পাওনা বাকি' : 'Total pending payable'}</p>
              <p className="text-headline-sm font-headline-sm font-bold text-on-surface mt-0.5">{fmtTk(pendingPayout, lang)}</p>
              <p className="text-[10px] text-outline">{bn ? 'সেটেলমেন্টে পরিশোধ হবে' : 'Paid at settlement'}</p>
            </div>
          </div>
        </section>

        {/* Stats (r2.3) */}
        <section className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'আয়ের পরিসংখ্যান' : 'Earnings statistics'}</h3>
            <span className="text-bilingual-sub font-bilingual-sub text-outline">Earnings Breakdown</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {periods.map(p => (
              <div key={p.kind} className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-label-sm font-label-sm text-outline">{bn ? p.labelBn : p.labelEn}</span>
                  {p.dot
                    ? <span className="w-2 h-2 rounded-full bg-primary" />
                    : <span className={clsx('material-symbols-outlined text-[14px]', p.iconClass)}>{p.icon}</span>}
                </div>
                <div>
                  <div className={clsx('text-headline-md font-headline-md font-bold', p.kind === 'today' ? 'text-primary' : 'text-on-surface')}>
                    {fmtTk(p.value, lang)}
                  </div>
                  {p.kind === 'today' && (
                    <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-tight">
                      {bn ? `${toBnDigits(p.count, lang)}টি ডেলিভারি` : `${p.count} deliveries`}
                      {todayFeeUniform && (
                        <>
                          <br />
                          <span className="text-outline text-[9px]">({toBnDigits(p.count, lang)} × {fmtTk(riderEarningOf(todayList[0], cut), lang)})</span>
                        </>
                      )}
                    </p>
                  )}
                  {p.kind === 'week' && (
                    <p className="text-[10px] text-outline font-medium mt-1 leading-tight">
                      This week
                      <br />
                      <span className="text-primary font-bold text-[9px]">{bn ? `${toBnDigits(p.count, lang)}টি ট্রিপ` : `${p.count} trips`}</span>
                    </p>
                  )}
                  {p.kind === 'all' && (
                    <p className="text-[10px] text-outline font-medium mt-1 leading-tight">
                      All-time
                      <br />
                      <span className="text-on-surface-variant text-[9px]">{bn ? `${toBnDigits(p.count, lang)}টি সফল ট্রিপ` : `${p.count} successful trips`}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent earnings stream (r2.3) */}
        <section className="space-y-2.5 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'সর্বশেষ লেনদেন' : 'Recent transactions'}</h3>
              <p className="text-bilingual-sub font-bilingual-sub text-outline">Recent Earnings Stream</p>
            </div>
            <button
              onClick={() => navigate('/rider/history')}
              className="text-primary hover:text-primary-container text-label-md font-label-md flex items-center"
            >
              <span>{bn ? 'সব দেখুন' : 'View all'}</span>
              <span className="material-symbols-outlined text-sm ml-0.5">chevron_right</span>
            </button>
          </div>
          {streamItems.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">
              {bn ? 'এখনো কোনো সম্পন্ন ডেলিভারি নেই।' : 'No completed deliveries yet.'}
            </p>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm divide-y divide-outline-variant/20 overflow-hidden">
              {streamItems.map(it => {
                if (it.kind === 'earn') {
                  const rel = relLabel(it.day);
                  return (
                    <div key={it.key} className="p-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-label-md font-label-md text-on-surface font-bold truncate">
                            {bn ? `${rel} সম্পন্ন ${toBnDigits(it.count, lang)}টি ডেলিভারি` : `${rel} — ${it.count} deliveries completed`}
                          </h4>
                          <div className="flex items-center gap-1 text-bilingual-sub font-bilingual-sub text-outline">
                            <span>{bn ? `${rel} ${it.count} Deliveries` : `${rel} • ${it.count} deliveries`}</span>
                            <span>•</span>
                            <span className="text-primary font-semibold">{bn ? 'জমা হয়েছে' : 'Credited'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-label-lg font-label-lg font-bold text-primary">+{fmtTk(it.total, lang)}</span>
                        <span className="block text-[10px] text-outline">{rel}, {fmtTime(it.latestIso, lang)}</span>
                      </div>
                    </div>
                  );
                }
                const meta = it.req.method === 'office'
                  ? { labelBn: 'অফিস', labelEn: 'Office', tile: 'OF', tileClass: 'bg-primary', dotClass: 'bg-primary' }
                  : METHODS.find(m => m.id === it.req.method) ?? METHODS[0];
                const paidDay = dayKey(it.iso);
                return (
                  <div key={it.key} className="p-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">outbox</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-label-md font-label-md text-on-surface font-bold truncate">
                            {bn ? `${fmtShortDay(paidDay, lang)} পেমেন্ট উত্তোলন` : `${fmtShortDay(paidDay, lang)} payment withdrawal`}
                          </h4>
                          <span className="text-[10px] bg-secondary-fixed/50 text-on-secondary-fixed px-1.5 py-[1px] rounded font-bold shrink-0">{meta.labelEn}</span>
                        </div>
                        <div className="flex items-center gap-1 text-bilingual-sub font-bilingual-sub text-outline">
                          <span>{bn ? `${meta.labelBn}ে পরিশোধিত` : `Paid via ${meta.labelEn}`}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">ID: {it.req.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-label-lg font-label-lg font-bold text-error">-{fmtTk(it.req.amount, lang)}</span>
                      <span className="block text-[10px] text-outline">{fmtShortDay(paidDay, lang)}, {fmtTime(it.iso, lang)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pay breakdown (owner's model, Oct 23 — replaces the
            r2.4 withdrawal form: riders never request payouts;
            the office settles the accumulated share monthly) */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3 mt-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2.5">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
              {bn ? 'হিসাবের বিবরণ (How your pay works)' : 'How your pay works'}
            </h2>
          </div>
          <div className="space-y-2.5 text-body-sm">
            <p className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[19px] shrink-0 mt-0.5">pedal_bike</span>
              <span className="text-on-surface-variant">
                {bn
                  ? <>প্রতি ডেলিভারিতে কোম্পানি কাট <b className="text-on-surface">{fmtTk(cut, lang)}</b> — বাকি পুরো ফি-ই আপনার আয়।</>
                  : <>The company keeps <b className="text-on-surface">{fmtTk(cut, lang)}</b> per delivery — the rest of the fee is entirely your earning.</>}
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[19px] shrink-0 mt-0.5">storefront</span>
              <span className="text-on-surface-variant">
                {bn
                  ? 'ডেলিভারিতে পাওয়া সব ক্যাশ প্রতিদিন অফিসে জমা দিন।'
                  : 'Deposit all cash collected on deliveries at the office every day.'}
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[19px] shrink-0 mt-0.5">calendar_month</span>
              <span className="text-on-surface-variant">
                {bn
                  ? 'মাসের শেষে অফিস থেকে আপনার জমা হওয়া পুরো পাওনা একসাথে পরিশোধ করা হবে।'
                  : 'At month-end the office pays your full accumulated balance in one settlement.'}
              </span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">admin_panel_settings</span>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">{bn ? 'দ্রষ্টব্য:' : 'Note:'}</strong>{' '}
              {bn ? 'হিসাবে কোনো গরমিল দেখলে অফিসে জানান / Report any mismatch to the office' : 'Report any mismatch to the office.'}
            </p>
          </div>
        </section>
        {/* Previous requests (r2.4) */}
        <section className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">{bn ? 'পেমেন্ট ইতিহাস / Payment history' : 'Payment history'}</h2>
            </div>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-semibold">
              {bn ? `মোট ${toBnDigits(myRequests.length, lang)}টি লেনদেন` : `${myRequests.length} total`}
            </span>
          </div>
          {myRequests.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">
              {bn ? 'এখনো কোনো পেমেন্ট হয়নি।' : 'No payments yet.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {myRequests.map(r => {
                const meta = r.method === 'office'
                  ? { labelBn: 'অফিস (মাসিক সেটেলমেন্ট)', labelEn: 'Office (monthly settlement)', dotClass: 'bg-primary' }
                  : METHODS.find(m => m.id === r.method) ?? METHODS[0];
                const reqDay = dayKey(r.requestedAt);
                return (
                  <div
                    key={r.id}
                    className={clsx(
                      'bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm relative overflow-hidden',
                      r.status === 'pending' ? 'border-2 border-secondary/40' : 'border border-outline-variant/30',
                    )}
                  >
                    {r.status === 'pending' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container" />}
                    <div className="flex items-start justify-between gap-2 mb-2 pl-1">
                      <div>
                        {r.status === 'pending' ? (
                          <span className="font-bilingual-sub text-[11px] font-semibold text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {bn
                              ? `${relLabel(reqDay)}, ${fmtShortDay(reqDay, lang)} ${fmtTime(r.requestedAt, lang)}`
                              : `${relLabel(reqDay)}, ${fmtShortDay(reqDay, lang)} ${fmtTime(r.requestedAt, lang)}`}
                          </span>
                        ) : (
                          <span className="font-bilingual-sub text-[11px] font-semibold text-on-surface-variant">
                            {fmtFullDay(reqDay, lang)}
                          </span>
                        )}
                        <div className={clsx(
                          'font-bold text-on-surface tracking-tight mt-0.5',
                          r.status === 'pending' ? 'font-headline-md text-headline-md' : 'text-[20px]',
                        )}>
                          {fmtTk(r.amount, lang)}
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold border border-secondary-container/30 animate-pulse">
                          <span className="material-symbols-outlined text-[13px]">pending</span>
                          {bn ? 'অপেক্ষমাণ / Pending' : 'Pending'}
                        </span>
                      )}
                      {r.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-primary font-label-sm text-label-sm font-bold border border-primary/20">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {bn ? 'পেমেন্ট হয়েছে / Paid' : 'Paid'}
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold border border-error/20">
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          {bn ? 'বাতিল / Rejected' : 'Rejected'}
                        </span>
                      )}
                    </div>
                    <div className="pl-1 pt-2 border-t border-outline-variant/20 flex flex-col gap-1 text-on-surface-variant font-bilingual-sub text-bilingual-sub">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-medium text-on-surface">
                          <span className={clsx('w-2 h-2 rounded-full', meta.dotClass)} />
                          {bn ? meta.labelBn : meta.labelEn} • {r.accountNumber}
                        </span>
                        <span className={r.status === 'pending' ? 'text-secondary font-semibold' : 'text-primary font-semibold'}>
                          {r.status === 'pending'
                            ? (bn ? 'অ্যাডমিন অনুমোদনের অপেক্ষায়' : 'Awaiting admin approval')
                            : r.status === 'paid'
                              ? (bn ? 'সফল' : 'Successful')
                              : (bn ? 'বাতিল হয়েছে' : 'Rejected')}
                        </span>
                      </div>
                      {r.status === 'paid' && r.paidAt && (
                        <div className="text-[10px] text-on-surface-variant/80 pt-0.5">
                          {bn
                            ? `পরিশোধিত: ${fmtShortDay(dayKey(r.paidAt), lang)} ${fmtTime(r.paidAt, lang)}`
                            : `Paid: ${fmtShortDay(dayKey(r.paidAt), lang)} ${fmtTime(r.paidAt, lang)}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Help card (r2.3) */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between mt-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-base">phone_in_talk</span>
            </span>
            <div>
              <p className="text-label-md font-label-md text-on-surface font-bold">{bn ? 'পেমেন্ট সংক্রান্ত কোনো সমস্যা?' : 'Any payment problem?'}</p>
              <p className="text-[11px] text-outline">{bn ? 'সরাসরি অ্যাডমিন হটলাইনে কল করুন' : 'Call the admin hotline directly'}</p>
            </div>
          </div>
          <a
            href={OPERATOR.phoneTel}
            className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-label-md font-bold text-xs shrink-0 hover:bg-surface-container transition-colors"
          >
            {bn ? 'কল দিন' : 'Call'}
          </a>
        </section>
      </PageFrame>

      {/* WhatsApp FAB (r2.3) */}
      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        style={{ boxShadow: '0 6px 16px rgba(37, 211, 102, 0.40)' }}
        className="fixed bottom-20 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:opacity-95"
      >
        <span className="material-symbols-outlined text-3xl">chat</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1D9D57]" />
        </span>
      </a>
    </div>
  );
}
