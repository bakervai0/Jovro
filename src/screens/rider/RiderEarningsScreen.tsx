import React, { useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { useCurrentRider } from '../../components/shared/RiderBits';
import { fmtTk, toBnDigits, dayKey, latestOrderDay, uid, areaName } from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';
import type { PaymentRequest } from '../../types';

const METHODS = [
  { id: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash', tile: 'bK', tileClass: 'bg-[#E2136E]', dotClass: 'bg-[#E2136E]' },
  { id: 'nagad', labelBn: 'নগদ', labelEn: 'Nagad', tile: 'নগদ', tileClass: 'bg-[#F7941D]', dotClass: 'bg-[#F7941D]' },
] as const;

/**
 * F7 Earnings + F8 payout, aligned to Stitch r2.3 (overview) and
 * r2.4 (withdrawal form + previous requests): identity strip,
 * pending-payout hero, request form, stats, recent earnings,
 * request history. A rider's earning per delivery = the order's
 * delivery fee. Periods anchor to the newest order day (demo
 * "today").
 */
export default function RiderEarningsScreen() {
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const rider = useCurrentRider();

  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(rider?.mobile ?? '');
  const [justRequested, setJustRequested] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const delivered = useMemo(
    () => state.orders
      .filter(o => o.riderId === rider?.id && o.status === 'delivered')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.orders, rider?.id],
  );

  const anchor = latestOrderDay(state.orders);
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const inLastDays = (iso: string, days: number) => {
    const d = new Date(`${dayKey(iso)}T00:00:00`);
    const diff = Math.round((anchorDate.getTime() - d.getTime()) / 86400000);
    return diff >= 0 && diff < days;
  };

  const sumFee = (list: typeof delivered) => list.reduce((s, o) => s + o.deliveryFee, 0);
  const todayList = delivered.filter(o => dayKey(o.createdAt) === anchor);
  const weekList = delivered.filter(o => inLastDays(o.createdAt, 7));

  const periods = [
    { labelBn: 'আজ / Today', labelEn: 'Today', value: sumFee(todayList), count: todayList.length, icon: null as string | null, dot: true },
    { labelBn: 'এই সপ্তাহ', labelEn: 'This week', value: sumFee(weekList), count: weekList.length, icon: 'calendar_today', dot: false },
    { labelBn: 'সর্বমোট', labelEn: 'All-time', value: sumFee(delivered), count: delivered.length, icon: 'savings', dot: false },
  ];

  const myRequests = state.paymentRequests.filter(r => r.riderId === rider?.id);
  const pendingPayout = rider?.pendingPayout ?? 0;
  const amountNum = parseInt(amount, 10);

  const submitRequest = () => {
    if (!rider || !amountNum || amountNum <= 0 || !account.trim()) return;
    const req: PaymentRequest = {
      id: uid('pay'),
      riderId: rider.id,
      amount: amountNum,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      method,
      accountNumber: account.trim(),
    };
    dispatch({ type: 'ADD_PAYMENT_REQUEST', request: req });
    dispatch({ type: 'UPDATE_RIDER', rider: { ...rider, pendingPayout: rider.pendingPayout + amountNum } });
    setAmount('');
    setJustRequested(true);
  };

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
        {/* Identity strip */}
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

        {/* Title */}
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
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 text-white text-label-md font-label-md">
                <span className="material-symbols-outlined text-sm mr-1.5 text-primary-fixed">hourglass_top</span>
                {bn ? 'তোলার বাকি / Pending payout' : 'Pending payout'}
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
                ? <>প্রতিটা সম্পন্ন ডেলিভারির ফি এখানে জমা হয় <span className="text-primary-fixed text-xs">• The fee of every completed delivery collects here</span></>
                : 'The fee of every completed delivery collects here.'}
            </p>
            <div className="w-full h-px bg-white/15 my-3.5" />
            <div className="flex items-center gap-2 text-[11px] text-white/90 font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>{bn ? 'সর্বনিম্ন তোলার সীমা নেই • কোনো ফি বা কমিশন কাটা হয় না (Zero platform deduction)' : 'No minimum limit • zero platform deduction'}</span>
            </div>
          </div>
        </section>

        {/* Request entry (r2.3) → scrolls to the r2.4 form */}
        <section className="space-y-2 mt-4">
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full min-h-[56px] rounded-full bg-primary text-white font-label-lg text-body-lg shadow-md flex items-center justify-center gap-2.5 px-6 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="font-bold">{bn ? 'পেমেন্ট রিকোয়েস্ট পাঠান / Request payment' : 'Request payment'}</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <div className="flex items-start gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-on-surface-variant text-body-sm shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">support_agent</span>
            <div className="text-[12px] leading-snug">
              <span className="font-semibold text-on-surface">{bn ? 'পেমেন্ট অ্যাডমিন নিজে বিকাশ/নগদে পাঠিয়ে দেবেন' : 'The admin sends payment personally by bKash/Nagad'}</span>
              <span className="text-outline text-[11px] block mt-0.5">
                {bn ? 'সাধারণতঃ ১২ ঘণ্টার মধ্যে পরিশোধ করা হয় / Usually processed within 12 hours' : 'Usually processed within 12 hours'}
              </span>
            </div>
          </div>
        </section>

        {/* Withdrawal form (r2.4) */}
        <section ref={formRef} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-4 mt-4 scroll-mt-20">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2.5">
            <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
            <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
              {bn ? 'টাকা উত্তোলনের ফর্ম (Withdrawal Form)' : 'Withdrawal Form'}
            </h2>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                {bn ? 'পরিমাণ / Amount (৳)' : 'Amount (৳)'}
              </label>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{bn ? 'সর্বনিম্ন ৳১০০' : 'Minimum ৳100'}</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-bold text-primary font-headline-sm text-[18px]">৳</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => { setAmount(e.target.value); setJustRequested(false); }}
                placeholder="500"
                className="w-full h-12 pl-9 pr-32 bg-surface-container-lowest rounded-xl border border-outline-variant text-on-surface font-headline-sm text-[18px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => { setAmount(String(pendingPayout)); setJustRequested(false); }}
                className="absolute right-2 px-2.5 py-1.5 bg-primary-container/10 text-primary border border-primary/20 rounded-lg font-label-md text-label-md font-bold flex items-center gap-1"
              >
                <span>{bn ? 'পুরো টাকা তুলুন' : 'Withdraw all'}</span>
                <span className="font-bilingual-sub text-[10px] opacity-80">(All: ৳{pendingPayout})</span>
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-on-surface-variant font-bilingual-sub text-bilingual-sub pt-0.5">
              <span className="material-symbols-outlined text-[15px] text-primary">info</span>
              {bn ? `সর্বোচ্চ তোলার বাকি ব্যালেন্স ৳${toBnDigits(pendingPayout.toLocaleString('en-IN'), lang)}` : `Maximum available balance ৳${pendingPayout}`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface font-semibold block">
              {bn ? 'পেমেন্ট মাধ্যম বেছে নিন / Select Method' : 'Select Method'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {METHODS.map(m => {
                const selected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={clsx(
                      'flex flex-col p-3 rounded-xl text-left transition-all',
                      selected ? 'border-2 border-primary bg-primary/5 shadow-sm' : 'border border-outline-variant bg-surface-container-lowest',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 w-full">
                      <span className={clsx('w-8 h-8 rounded-lg text-white flex items-center justify-center font-extrabold text-[13px] tracking-tighter shadow-sm', m.tileClass)}>
                        {m.tile}
                      </span>
                      {selected ? (
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-outline-variant" />
                      )}
                    </div>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">{bn ? m.labelBn : m.labelEn} / {m.labelEn}</span>
                    <span className="font-bilingual-sub text-[10px] text-on-surface-variant mt-0.5">{bn ? 'ব্যক্তিগত নম্বর (Personal)' : 'Personal number'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
              <span>{bn ? 'বিকাশ/নগদ নম্বর / bKash/Nagad number' : 'bKash/Nagad number'}</span>
              <span className="text-primary font-bilingual-sub text-[11px] font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">verified_user</span> {bn ? 'ভেরিফাইড' : 'Verified'}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">phone_android</span>
              <input
                type="tel"
                value={account}
                onChange={e => setAccount(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full h-12 pl-10 pr-24 bg-surface-container-low/50 rounded-xl border border-outline-variant text-on-surface font-body-lg font-semibold tracking-wide focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                Personal
              </span>
            </div>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
              {bn ? 'আপনার নিবন্ধিত রাইডার ব্যক্তিগত অ্যাকাউন্ট ভেরিফাইড করা আছে।' : 'Your registered personal account is verified.'}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            {justRequested && (
              <p className="text-label-md text-success flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {bn ? 'অনুরোধ পাঠানো হয়েছে — অনুমোদন হলে টাকা পাঠিয়ে দেওয়া হবে।' : 'Request sent — money will be sent once approved.'}
              </p>
            )}
            <button
              onClick={submitRequest}
              disabled={!amountNum || amountNum <= 0 || !account.trim()}
              className="w-full h-14 bg-primary text-on-primary rounded-full font-label-lg text-[16px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{bn ? 'রিকোয়েস্ট পাঠান / Send request' : 'Send request'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">admin_panel_settings</span>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">{bn ? 'দ্রষ্টব্য:' : 'Note:'}</strong>{' '}
                {bn ? 'অ্যাডমিন ভেরিফাই করে সরাসরি আপনার নম্বরে টাকা পাঠাবেন / Admin pays directly via bKash/Nagad' : 'Admin verifies and pays directly to your number via bKash/Nagad.'}
              </p>
            </div>
          </div>
        </section>

        {/* Stats (r2.3) */}
        <section className="space-y-2 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'আয়ের পরিসংখ্যান' : 'Earnings statistics'}</h3>
            <span className="text-bilingual-sub font-bilingual-sub text-outline">Earnings Breakdown</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {periods.map((p, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-label-sm font-label-sm text-outline">{bn ? p.labelBn : p.labelEn}</span>
                  {p.dot
                    ? <span className="w-2 h-2 rounded-full bg-primary" />
                    : <span className="material-symbols-outlined text-[14px] text-secondary">{p.icon}</span>}
                </div>
                <div className={clsx('text-headline-md font-headline-md font-bold', i === 0 ? 'text-primary' : 'text-on-surface')}>
                  {fmtTk(p.value, lang)}
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-tight">
                  {bn ? `${toBnDigits(p.count, lang)}টি ডেলিভারি` : `${p.count} deliveries`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent earnings stream (r2.3) */}
        <section className="space-y-2.5 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'সর্বশেষ লেনদেন' : 'Recent transactions'}</h3>
              <p className="text-bilingual-sub font-bilingual-sub text-outline">Recent Earnings Stream</p>
            </div>
          </div>
          {delivered.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">
              {bn ? 'এখনো কোনো সম্পন্ন ডেলিভারি নেই।' : 'No completed deliveries yet.'}
            </p>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm divide-y divide-outline-variant/20 overflow-hidden">
              {delivered.slice(0, 8).map(o => (
                <div key={o.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-label-md font-label-md text-on-surface font-bold truncate">#{o.id} • {o.customerName}</h4>
                      <p className="flex items-center gap-1 text-bilingual-sub font-bilingual-sub text-outline">
                        <span>{areaName(state.areas, o.deliveryAreaId, lang)}</span>
                        <span>•</span>
                        <span className="text-primary font-semibold">{bn ? 'জমা হয়েছে' : 'Credited'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-label-lg font-label-lg font-bold text-primary">+{fmtTk(o.deliveryFee, lang)}</span>
                    <span className="block text-[10px] text-outline">
                      {new Date(o.createdAt).toLocaleDateString(bn ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Previous requests (r2.4) */}
        <section className="space-y-3 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">{bn ? 'আগের রিকোয়েস্ট / Previous requests' : 'Previous requests'}</h2>
            </div>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-semibold">
              {bn ? `মোট ${toBnDigits(myRequests.length, lang)}টি লেনদেন` : `${myRequests.length} total`}
            </span>
          </div>
          {myRequests.length === 0 ? (
            <p className="text-body-md text-on-surface-variant py-4 text-center">
              {bn ? 'এখনো কোনো পেমেন্ট অনুরোধ নেই।' : 'No payout requests yet.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {myRequests.map(r => {
                const meta = METHODS.find(m => m.id === r.method) ?? METHODS[0];
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
                        <span className="font-bilingual-sub text-[11px] font-semibold text-on-surface-variant">
                          {new Date(r.requestedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight mt-0.5">
                          {fmtTk(r.amount, lang)}
                        </div>
                      </div>
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold border border-secondary-container/30">
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
                    <div className="pl-1 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant font-bilingual-sub text-bilingual-sub">
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
            className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-label-md font-bold text-xs shrink-0"
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
        className="fixed bottom-20 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl">chat</span>
      </a>
    </div>
  );
}
