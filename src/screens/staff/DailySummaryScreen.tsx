import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { todayOrders, latestOrderDay, fmtTk, toBnDigits } from '../../services/orderUtils';

const DAILY_TARGET = 30;

/**
 * G3 — Daily summary, aligned to Stitch 22b: operator strip,
 * 2×2 key metrics, per-rider cash reconciliation, hub cash/memo
 * reconciliation, and the lock-shift actions (demo state).
 * Income = delivery fees only, as before.
 */
export default function DailySummaryScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [tally1, setTally1] = useState(true);
  const [tally2, setTally2] = useState(true);
  const [locked, setLocked] = useState(false);

  const todays = useMemo(() => todayOrders(state.orders), [state.orders]);
  const delivered = todays.filter(o => o.status === 'delivered');
  const failed = todays.filter(o => o.status === 'failed');
  const cancelled = todays.filter(o => o.status === 'cancelled');
  const income = delivered.reduce((s, o) => s + o.deliveryFee, 0);
  const cashCollected = delivered.reduce((s, o) => s + o.finalTotal, 0);
  const goodsValue = delivered.reduce((s, o) => s + o.productsTotal, 0);
  const targetPct = Math.round((delivered.length / DAILY_TARGET) * 100);

  const riderRows = useMemo(() => {
    return state.riders
      .map(rider => {
        const mine = todays.filter(o => o.riderId === rider.id);
        const done = mine.filter(o => o.status === 'delivered');
        const active = mine.filter(o => !['delivered', 'failed', 'cancelled'].includes(o.status));
        return {
          rider,
          deliveries: done.length,
          cash: done.reduce((s, o) => s + o.finalTotal, 0),
          pendingCash: active.reduce((s, o) => s + o.finalTotal, 0),
          hasWork: mine.length > 0,
        };
      })
      .filter(r => r.hasWork);
  }, [state.riders, todays]);

  const totalPending = riderRows.reduce((s, r) => s + r.pendingCash, 0);
  const drawerCash = cashCollected - 0; // collected cash is in hand; pending is separate (not yet collected)
  const firstPending = riderRows.find(r => r.pendingCash > 0);

  const anchor = latestOrderDay(state.orders);
  const dateLine = new Date(`${anchor}T00:00:00`).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  });

  const metrics = [
    {
      label: bn ? 'মোট ডেলিভারি' : 'Total deliveries', icon: 'local_shipping', tone: 'bg-primary/10 text-primary',
      value: `${toBnDigits(delivered.length, lang)}${bn ? 'টি' : ''}`,
      extra: `${toBnDigits(targetPct, lang)}%`,
      sub: bn ? `লক্ষ্যমাত্রা: ${toBnDigits(DAILY_TARGET, lang)}টি সম্পন্ন` : `Target: ${DAILY_TARGET} completed`,
      valueClass: 'text-primary',
    },
    {
      label: bn ? 'বাজার ক্রয়মূল্য' : 'Bazaar purchase value', icon: 'receipt_long', tone: 'bg-tertiary-fixed text-tertiary',
      value: fmtTk(goodsValue, lang),
      extra: null as string | null,
      sub: bn ? 'আসল দোকানের ভাউচার মিলিয়ে' : 'Matched with shop vouchers',
      valueClass: 'text-on-surface',
    },
    {
      label: bn ? 'মোট ডেলিভারি ফি' : 'Total delivery fees', icon: 'payments', tone: 'bg-secondary-fixed text-secondary',
      value: fmtTk(income, lang),
      extra: null,
      sub: bn ? 'জিরো প্ল্যাটফর্ম মার্কআপ' : 'Zero platform markup',
      valueClass: 'text-secondary',
    },
    {
      label: bn ? 'বাতিল / ফেরত' : 'Cancelled / returned', icon: 'assignment_return', tone: 'bg-error-container text-error',
      value: `${toBnDigits(failed.length + cancelled.length, lang)}${bn ? 'টি' : ''}`,
      extra: bn ? 'সমাধানকৃত' : 'Resolved',
      sub: bn ? 'পণ্য মেমো অ্যাডজাস্টেড' : 'Memo adjusted',
      valueClass: 'text-error',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Design 22b header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button
            aria-label={bn ? 'ফিরে যান' : 'Go back'}
            onClick={() => navigate('/staff')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-sm font-headline-sm text-on-surface leading-tight font-bold">
              {bn ? 'অপারেটর দৈনিক হিসাব' : 'Operator Daily Summary'}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium">Operator Daily Summary</p>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-label-sm font-label-sm tracking-wide border border-primary/20">
            {bn ? 'লালমনিরহাট সদর হাব' : 'Lalmonirhat Sadar Hub'}
          </span>
          <span className="text-bilingual-sub font-bilingual-sub text-outline mt-0.5">{dateLine}</span>
        </div>
      </header>

      <PageFrame>
        {/* Operator strip */}
        <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-body-lg shrink-0">
              <span className="material-symbols-outlined text-[22px]">badge</span>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-surface-container-lowest rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body-md font-body-md font-bold text-on-surface truncate">{bn ? state.user?.nameBn : state.user?.name}</span>
                <span className="text-label-sm font-label-sm bg-primary-container text-on-primary-container px-1.5 py-0.2 rounded shrink-0">{bn ? 'লাইভ ডিউটি' : 'Live duty'}</span>
              </div>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                <span>{bn ? 'শিফট: সকাল ৬:০০–দুপুর ১:৩০ ও বিকেল ৪:৩০–রাত ১০:৩০ (সেন্ট্রাল ডেস্ক)' : 'Shifts: 6:00 AM–1:30 PM and 4:30–10:30 PM (Central desk)'}</span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-surface-container text-on-surface-variant text-label-sm font-label-sm shrink-0">
            {bn ? 'আইডি' : 'ID'}: #{(state.staff[0]?.id ?? 'OP').toUpperCase()}
          </span>
        </section>

        {/* Key metrics */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-label-lg font-label-lg font-bold text-on-surface">
              {bn ? 'দৈনিক সমাপনী মেট্রিক্স (Key Metrics)' : 'Daily closing metrics (Key Metrics)'}
            </h2>
            <span className="text-bilingual-sub font-bilingual-sub text-primary flex items-center shrink-0">
              <span className="material-symbols-outlined text-[14px] mr-0.5">sync</span> {bn ? 'রিয়েল-টাইম ডাটা' : 'Real-time data'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m, i) => (
              <div key={i} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{m.label}</span>
                  <span className={clsx('w-6 h-6 rounded-lg flex items-center justify-center', m.tone)}>
                    <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className={clsx('text-headline-md font-headline-md font-bold', m.valueClass)}>{m.value}</span>
                    {m.extra && <span className="text-label-sm font-label-sm text-primary font-semibold">{m.extra}</span>}
                  </div>
                  <p className="text-bilingual-sub font-bilingual-sub text-outline mt-0.5">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rider cash reconciliation */}
        <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm mt-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div>
              <h2 className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'রাইডার ক্যাশ রিকনসিলিয়েশন' : 'Rider cash reconciliation'}</h2>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Rider Cash Settlement Summary</p>
            </div>
            <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-label-sm font-label-sm shrink-0">
              {bn ? `${toBnDigits(riderRows.length, lang)} জন রাইডার` : `${riderRows.length} riders`}
            </span>
          </div>
          <div className="divide-y divide-surface-container mt-1">
            {riderRows.length === 0 && (
              <p className="py-4 text-center text-body-sm text-on-surface-variant">{bn ? 'আজ কোনো রাইডার ডেলিভারি করেনি।' : 'No rider deliveries today.'}</p>
            )}
            {riderRows.map(({ rider, deliveries, cash, pendingCash }) => (
              <div key={rider.id} className="py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-md shrink-0',
                    pendingCash > 0 ? 'bg-secondary-fixed/50 text-secondary' : 'bg-surface-container text-on-surface',
                  )}>
                    <span className="material-symbols-outlined text-[18px]">pedal_bike</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-md font-body-md font-bold text-on-surface leading-snug truncate">{bn ? rider.nameBn : rider.name}</p>
                    <div className="flex items-center gap-2 text-bilingual-sub font-bilingual-sub text-outline">
                      <span>{bn ? `${toBnDigits(deliveries, lang)}টি ডেলিভারি` : `${deliveries} deliveries`}</span>
                      <span>•</span>
                      <span>{bn ? 'ক্যাশ' : 'Cash'}: <strong className="text-on-surface font-semibold">{fmtTk(cash, lang)}</strong></span>
                    </div>
                  </div>
                </div>
                {pendingCash > 0 ? (
                  <span className="inline-flex flex-col items-end shrink-0">
                    <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-secondary font-bold bg-secondary-fixed px-2 py-0.5 rounded-full border border-secondary/20">
                      <span className="material-symbols-outlined text-[13px]">pending</span>
                      <span>{fmtTk(pendingCash, lang)} {bn ? 'বাকি' : 'due'}</span>
                    </span>
                    <span className="text-bilingual-sub font-bilingual-sub text-outline text-[10px] mt-0.5">{bn ? 'পথে আছেন' : 'On the way'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-label-sm font-label-sm text-primary font-bold bg-[#E8F5E9] px-2 py-1 rounded-full border border-primary/30 shrink-0">
                    <span className="material-symbols-outlined text-[15px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>{bn ? 'জমা সম্পন্ন' : 'Settled'}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Hub cash & memo reconciliation */}
        <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm relative overflow-hidden mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </span>
            <div>
              <h3 className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'ক্যাশ ইন হ্যান্ড ও পাকা মেমো হিসাব' : 'Cash in hand & memo reconciliation'}</h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Hub Drawer &amp; Memo Reconciliation</p>
            </div>
          </div>
          <div className="space-y-2.5 bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <div className="flex justify-between items-center text-body-md font-body-md gap-2">
              <span className="text-on-surface-variant">{bn ? 'মোট সংগৃহীত ক্যাশ (Expected):' : 'Total collected cash (Expected):'}</span>
              <span className="font-bold text-on-surface">{fmtTk(cashCollected, lang)}</span>
            </div>
            <div className="flex justify-between items-center text-body-md font-body-md gap-2">
              <span className="text-on-surface-variant flex items-center gap-1">
                <span>{bn ? 'দোকানের আসল ভাউচার স্ক্যান:' : 'Shop voucher scans:'}</span>
                <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </span>
              <span className="font-semibold text-primary">
                {bn ? `${toBnDigits(delivered.length, lang)}টি পাকা মেমো সংরক্ষিত` : `${delivered.length} memos saved`}
              </span>
            </div>
            <div className="h-[1px] bg-outline-variant/30" />
            <div className="flex justify-between items-center text-body-md font-body-md gap-2">
              <span className="text-on-surface font-semibold">{bn ? 'হাব ক্যাশ ড্রয়ারে সরাসরি জমা:' : 'Deposited in hub cash drawer:'}</span>
              <span className="font-bold text-headline-sm font-headline-sm text-primary">{fmtTk(drawerCash, lang)}</span>
            </div>
            {firstPending && (
              <div className="flex justify-between items-center text-bilingual-sub font-bilingual-sub text-secondary bg-[#FFF7ED] p-2 rounded border border-[#F97316]/30 gap-2">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  <span>{bn ? `রাইডার ${firstPending.rider.nameBn}-এর বাকি ক্যাশ (পথে আছেন):` : `Rider ${firstPending.rider.name} cash still out:`}</span>
                </span>
                <span className="font-bold">{fmtTk(firstPending.pendingCash, lang)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2 text-body-sm font-body-sm text-on-surface cursor-pointer select-none">
              <input type="checkbox" checked={tally1} onChange={e => setTally1(e.target.checked)} className="mt-0.5 rounded accent-[#1D9D57] h-4 w-4 shrink-0" />
              <span>{bn ? 'সকল দোকানের ভাউচারের দাম ও ক্যাশ মেমো ড্রয়ারে সংরক্ষণ ও ট্যালি করা হয়েছে।' : 'All shop voucher prices and cash memos are saved and tallied in the drawer.'}</span>
            </label>
            <label className="flex items-start gap-2 text-body-sm font-body-sm text-on-surface cursor-pointer select-none">
              <input type="checkbox" checked={tally2} onChange={e => setTally2(e.target.checked)} className="mt-0.5 rounded accent-[#1D9D57] h-4 w-4 shrink-0" />
              <span>{bn ? 'ক্যাশ ড্রয়ার হিসাব এবং ডিজিটাল লগ শিটের মিল নিশ্চিত করা হয়েছে।' : 'Cash drawer totals match the digital log sheet.'}</span>
            </label>
          </div>
        </section>

        {/* Failed deliveries (kept from previous build — not in design 22b) */}
        {failed.length > 0 && (
          <div className="mt-3 rounded-xl border border-error/25 bg-error/5 px-4 py-1">
            <p className="text-label-lg font-semibold text-on-surface py-3">{bn ? 'ব্যর্থ ডেলিভারি' : 'Failed deliveries'}</p>
            {failed.map(o => (
              <div key={o.id} className="flex justify-between gap-2 py-2.5 border-t border-error/10">
                <span className="text-body-sm text-on-surface">#{o.id} · {o.customerName}</span>
                <span className="text-label-md text-error font-medium text-right">{o.failReason ?? ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lock actions (design 22b — demo state) */}
        <section className="space-y-2 pt-4">
          <button
            onClick={() => setLocked(v => !v)}
            className={clsx(
              'w-full h-12 rounded-full font-label-lg text-label-lg tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2',
              locked ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary text-on-primary',
            )}
          >
            <span className="material-symbols-outlined text-[20px]">{locked ? 'lock_open' : 'lock'}</span>
            <span>{locked ? (bn ? 'হিসাব লক হয়েছে ✓ (ডেমো)' : 'Shift locked ✓ (demo)') : (bn ? 'দৈনিক হিসাব লক ও কনফার্ম করুন (Lock Shift)' : 'Lock & confirm daily summary (Lock Shift)')}</span>
          </button>
          <button
            className="w-full h-11 bg-surface-container-lowest text-primary border border-primary rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2"
            onClick={() => { /* demo: report export is visual only in the design */ }}
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>{bn ? 'পিডিএফ রসিদ ডাউনলোড / Download Shift Report' : 'Download Shift Report (PDF)'}</span>
          </button>
          <p className="text-center text-[11px] text-outline pt-1">
            {bn ? `মোট অর্ডার ${toBnDigits(todays.length, lang)}টি • চলমান বাকি ক্যাশ ${fmtTk(totalPending, lang)}` : `${todays.length} orders total • ${fmtTk(totalPending, lang)} cash still out`}
          </p>
        </section>
      </PageFrame>
    </div>
  );
}
