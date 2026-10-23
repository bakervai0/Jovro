import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { PayoutStatusBadge } from '../../components/shared/RiderBits';
import { useCurrentAffiliate } from '../../components/shared/AffiliateBits';
import { REFERRALS_SEED } from '../../data/seed';
import { fmtTk, toBnDigits, uid } from '../../services/orderUtils';
import type { PaymentRequest } from '../../types';

const METHODS = [
  { id: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash', tile: 'বি', tileCls: 'bg-[#E2136E]/10 text-[#E2136E]' },
  { id: 'nagad', labelBn: 'নগদ', labelEn: 'Nagad', tile: 'ন', tileCls: 'bg-[#F7921E]/15 text-[#F7921E]' },
] as const;

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const BN_NUM = ['১', '২', '৩', '৪', '৫'];

/**
 * I5 — Affiliate earnings & payout, aligned to Stitch af1.6:
 * rate/balance/all-time strip, this-month commission card with
 * week-by-week breakdown + previous months, the numbered payout
 * request form, and payout history. Requests still write to
 * shared paymentRequests (riderId carries the affiliate id).
 */
export default function AffiliateEarningsScreen() {
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const affiliate = useCurrentAffiliate();

  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(affiliate?.mobile ?? '');
  const [justRequested, setJustRequested] = useState(false);

  const referredOrders = useMemo(
    () => REFERRALS_SEED.filter(r => r.affiliateId === affiliate?.id),
    [affiliate?.id],
  );
  const earnedFromOrders = referredOrders.reduce((s, r) => s + r.commission, 0);
  const myRequests = state.paymentRequests.filter(r => r.riderId === affiliate?.id);
  const paidOut = myRequests.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const pendingRequests = myRequests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const pendingBalance = affiliate?.pendingPayout ?? 0;
  const allTime = affiliate?.totalEarnings ?? earnedFromOrders;
  const amountNum = parseInt(amount, 10);

  // Month + week breakdowns from the referred orders (seed data).
  const sorted = [...referredOrders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  const anchorMonthKey = sorted[0]?.orderDate.slice(0, 7);
  const anchorDate = anchorMonthKey ? new Date(`${anchorMonthKey}-01T00:00:00`) : new Date();
  const monthOrders = referredOrders.filter(r => r.orderDate.slice(0, 7) === anchorMonthKey);
  const monthCommission = monthOrders.reduce((s, r) => s + r.commission, 0);
  const weeks = useMemo(() => {
    const map = new Map<number, { count: number; sum: number }>();
    for (const r of monthOrders) {
      const day = parseInt(r.orderDate.slice(8, 10), 10);
      const w = Math.min(5, Math.ceil(day / 7));
      const cur = map.get(w) ?? { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += r.commission;
      map.set(w, cur);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [monthOrders]);
  const prevMonths = useMemo(() => {
    const map = new Map<string, { count: number; sum: number }>();
    for (const r of referredOrders) {
      const k = r.orderDate.slice(0, 7);
      if (k === anchorMonthKey) continue;
      const cur = map.get(k) ?? { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += r.commission;
      map.set(k, cur);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [referredOrders, anchorMonthKey]);

  const monthLabel = `${BN_MONTHS[anchorDate.getMonth()]} ${toBnDigits(anchorDate.getFullYear(), lang)}`;

  const submitRequest = () => {
    if (!affiliate || !amountNum || amountNum <= 0 || !account.trim()) return;
    const req: PaymentRequest = {
      id: uid('pay'),
      riderId: affiliate.id, // paymentRequests serves affiliates too; id prefix 'aff-' distinguishes
      amount: amountNum,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      method,
      accountNumber: account.trim(),
    };
    dispatch({ type: 'ADD_PAYMENT_REQUEST', request: req });
    dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...affiliate, pendingPayout: Math.max(0, affiliate.pendingPayout - amountNum) } });
    setAmount('');
    setJustRequested(true);
  };

  return (
    <PageFrame>
      {/* Summary strip (af1.6) */}
      <section className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 shadow-sm mt-4">
        <div className="flex flex-col items-center text-center py-1">
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'কমিশন রেট' : 'Commission rate'}</span>
          <span className="text-headline-sm font-headline-sm text-primary mt-0.5">{fmtTk(affiliate?.commissionRate ?? 20, lang)}</span>
          <span className="text-label-sm font-label-sm text-on-surface-variant/80">{bn ? 'প্রতি অর্ডারে' : 'Per order'}</span>
        </div>
        <div className="flex flex-col items-center text-center py-1 border-x border-outline-variant/30">
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'উত্তোলনযোগ্য' : 'Withdrawable'}</span>
          <span className="text-headline-sm font-headline-sm text-secondary mt-0.5">{fmtTk(pendingBalance, lang)}</span>
          <span className="text-label-sm font-label-sm text-secondary font-semibold">
            {bn ? `${toBnDigits(referredOrders.length, lang)}টি অর্ডার বাকি` : `${referredOrders.length} orders`}
          </span>
        </div>
        <div className="flex flex-col items-center text-center py-1">
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'সর্বমোট কমিশন' : 'All-time commission'}</span>
          <span className="text-headline-sm font-headline-sm text-on-surface mt-0.5">{fmtTk(allTime, lang)}</span>
          <span className="text-label-sm font-label-sm text-on-surface-variant/80">
            {bn ? `${toBnDigits(referredOrders.length, lang)}টি সর্বমোট` : `${referredOrders.length} total`}
          </span>
        </div>
      </section>

      {/* This month (af1.6) */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm mt-3">
        <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-label-sm font-label-sm bg-primary/10 text-primary mb-1">
              {monthLabel} {bn ? 'পরিসংখ্যান' : 'stats'}
            </span>
            <h2 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'এই মাসের কমিশন' : 'Commission this month'}</h2>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Commission this month: ৳{monthCommission}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-headline-md font-headline-md text-primary font-bold">{fmtTk(monthCommission, lang)}</span>
            <div className="flex items-center justify-end text-label-sm font-label-sm text-primary">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
              {bn ? `${toBnDigits(monthOrders.length, lang)}টি ডেলিভারি` : `${monthOrders.length} deliveries`}
            </div>
          </div>
        </div>
        <div className="py-3 space-y-2.5">
          <span className="text-bilingual-sub font-bilingual-sub font-bold text-on-surface-variant uppercase tracking-wider">
            {bn ? 'সাপ্তাহিক বিভাজন (Week by Week)' : 'Week by week'}
          </span>
          <div className="space-y-2">
            {weeks.map(([w, agg], i) => {
              const startDay = (w - 1) * 7 + 1;
              const endDay = Math.min(w * 7, 31);
              return (
                <div key={w} className={clsx('flex items-center justify-between text-body-sm font-body-sm p-2 rounded-lg', i === 0 ? 'bg-surface-container-low/60' : 'bg-surface')}>
                  <div className="flex items-center gap-2">
                    <span className={clsx('w-1.5 h-1.5 rounded-full', i === 0 ? 'bg-primary' : 'bg-outline')} />
                    <span className="font-medium text-on-surface">
                      {bn ? `${BN_NUM[w - 1]}র্থ সপ্তাহ (${toBnDigits(startDay, lang)}-${toBnDigits(endDay, lang)} ${BN_MONTHS[anchorDate.getMonth()]})` : `Week ${w} (${startDay}–${endDay})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant text-label-sm font-label-sm">
                      {bn ? `${toBnDigits(agg.count, lang)}টি অর্ডার` : `${agg.count} orders`}
                    </span>
                    <span className="text-primary font-bold">{fmtTk(agg.sum, lang)}</span>
                  </div>
                </div>
              );
            })}
            {weeks.length === 0 && (
              <p className="text-body-sm text-on-surface-variant py-2 text-center">{bn ? 'এই মাসে এখনো কমিশন নেই।' : 'No commission this month yet.'}</p>
            )}
          </div>
        </div>
        {prevMonths.length > 0 && (
          <div className="pt-3 border-t border-outline-variant/20">
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block mb-2">{bn ? 'পূর্ববর্তী মাসের হিসেব' : 'Previous months'}</span>
            <div className="grid grid-cols-2 gap-2 text-label-md font-label-md">
              {prevMonths.map(([k, agg]) => {
                const d = new Date(`${k}-01T00:00:00`);
                return (
                  <div key={k} className="p-2 rounded bg-surface border border-outline-variant/30 flex justify-between items-center">
                    <div>
                      <span className="block text-on-surface text-body-sm font-body-sm">
                        {bn ? `${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear(), lang)}` : `${BN_MONTHS[d.getMonth()]} ${d.getFullYear()}`}
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        {bn ? `${toBnDigits(agg.count, lang)}টি ডেলিভারি` : `${agg.count} deliveries`}
                      </span>
                    </div>
                    <span className="font-bold text-on-surface">{fmtTk(agg.sum, lang)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Payout request (af1.6) */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border-2 border-primary/20 shadow-md mt-3">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">account_balance_wallet</span>
            <div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'টাকা তোলার আবেদন' : 'Payout request'}</h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Payout Request</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm shrink-0">
            {bn ? 'ব্যালেন্স' : 'Balance'}: {fmtTk(pendingBalance, lang)}
          </span>
        </div>
        <div className="mt-2.5 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified_user</span>
          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            {bn ? 'অ্যাডমিন নিজে যাচাই করে বিকাশ বা নগদে ম্যানুয়ালি টাকা পাঠিয়ে দেবেন।' : 'The admin verifies and sends the money manually by bKash or Nagad.'}
          </p>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-label-lg font-label-lg text-on-surface">{bn ? '১. পরিমাণ / Amount (৳)' : '1. Amount (৳)'}</label>
              <button
                type="button"
                onClick={() => { setAmount(String(pendingBalance)); setJustRequested(false); }}
                className="text-label-sm font-label-sm text-primary font-bold bg-primary-fixed/30 px-2 py-0.5 rounded active:scale-95 duration-150"
              >
                {bn ? `সব টাকা: ৳${pendingBalance}` : `All: ৳${pendingBalance}`}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-headline-sm font-headline-sm text-on-surface-variant">৳</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => { setAmount(e.target.value); setJustRequested(false); }}
                placeholder="300"
                className="w-full h-12 pl-8 pr-4 bg-surface rounded-lg border border-outline-variant text-headline-sm font-headline-sm text-on-surface font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-lg font-label-lg text-on-surface mb-1.5">
              {bn ? '২. পেমেন্ট মাধ্যম / Select Method' : '2. Select Method'}
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
                      'relative flex items-center p-3 rounded-lg text-left transition-all',
                      selected ? 'border-2 border-primary bg-primary-fixed/20' : 'border border-outline-variant bg-surface opacity-85',
                    )}
                  >
                    <span className={clsx('w-8 h-8 rounded-full flex items-center justify-center mr-2.5 shrink-0 font-bold text-label-lg font-label-lg', m.tileCls)}>
                      {m.tile}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-label-md font-label-md text-on-surface font-bold">{bn ? m.labelBn : m.labelEn}</span>
                      <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{m.labelEn}</span>
                    </span>
                    {selected && (
                      <span className="absolute right-2.5 top-2.5">
                        <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-label-lg font-label-lg text-on-surface">
                {bn ? `৩. ${method === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বর / ${method === 'bkash' ? 'bKash' : 'Nagad'} number` : `3. ${method === 'bkash' ? 'bKash' : 'Nagad'} number`}
              </label>
              <span className="inline-flex items-center text-label-sm font-label-sm text-primary">
                <span className="material-symbols-outlined text-[13px] mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {bn ? 'যাচাইকৃত (Verified)' : 'Verified'}
              </span>
            </div>
            <input
              type="tel"
              value={account}
              onChange={e => setAccount(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full h-12 px-3 bg-surface rounded-lg border border-outline-variant text-body-lg font-body-lg text-on-surface font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {pendingRequests > 0 && (
            <p className="text-label-md text-warning">
              {bn ? `আগের অনুরোধ অপেক্ষমাণ: ${fmtTk(pendingRequests, lang)}` : `Earlier request pending: ${fmtTk(pendingRequests, lang)}`}
            </p>
          )}
          {justRequested && (
            <p className="text-label-md text-success flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {bn ? 'অনুরোধ পাঠানো হয়েছে।' : 'Request sent.'}
            </p>
          )}
          <div className="pt-2">
            <button
              onClick={submitRequest}
              disabled={!amountNum || amountNum <= 0 || !account.trim()}
              className="w-full h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold shadow-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="text-label-lg font-label-lg mr-2">{bn ? 'রিকোয়েস্ট পাঠান / Send request' : 'Send request'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Payout history */}
      <div className="flex items-baseline justify-between mt-6 mb-2.5">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'পেআউট ইতিহাস' : 'Payout history'}</h3>
        {paidOut > 0 && (
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            {bn ? `মোট তোলা হয়েছে ${fmtTk(paidOut, lang)}` : `Total paid out ${fmtTk(paidOut, lang)}`}
          </span>
        )}
      </div>
      {myRequests.length === 0 ? (
        <p className="text-body-md text-on-surface-variant py-4 text-center">
          {bn ? 'এখনো কোনো পেমেন্ট অনুরোধ নেই।' : 'No payout requests yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {myRequests.map(r => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3.5">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                {r.method === 'bkash' ? 'smartphone' : 'account_balance_wallet'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-semibold text-on-surface">{fmtTk(r.amount, lang)}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {r.method === 'bkash' ? (bn ? 'বিকাশ' : 'bKash') : (bn ? 'নগদ' : 'Nagad')} · {r.accountNumber} ·{' '}
                  {new Date(r.requestedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <PayoutStatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
