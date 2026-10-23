import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { useCurrentAffiliate } from '../../components/shared/AffiliateBits';
import { REFERRALS_SEED } from '../../data/seed';
import { fmtTk, toBnDigits, latestOrderDay } from '../../services/orderUtils';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

/**
 * I3 — Affiliate home, aligned to Stitch af1.3: greeting card,
 * admin-set commission rate card, pending-balance hero,
 * 2×2 performance stats, quick-share code box and the recent
 * referral activity stream. Figures come from the affiliate
 * record in shared state plus the seeded referred-customer list
 * (sample data).
 */
export default function AffiliateHomeScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const affiliate = useCurrentAffiliate();
  const [copied, setCopied] = useState(false);

  const referredOrders = useMemo(
    () => [...REFERRALS_SEED.filter(r => r.affiliateId === affiliate?.id)]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate)),
    [affiliate?.id],
  );
  const customersBrought = affiliate?.totalReferrals ?? 0;
  const ordersFromThem = referredOrders.length;
  const monthCommission = referredOrders.reduce((s, r) => s + r.commission, 0);
  const allTime = affiliate?.totalEarnings ?? monthCommission;
  const pending = affiliate?.pendingPayout ?? 0;

  const latestRefDate = referredOrders[0]?.orderDate;
  const thisWeekCount = latestRefDate
    ? referredOrders.filter(r => {
        const diff = (new Date(latestRefDate).getTime() - new Date(r.orderDate).getTime()) / 86400000;
        return diff >= 0 && diff < 7;
      }).length
    : 0;
  const anchorMonth = BN_MONTHS[new Date(`${latestOrderDay(state.orders)}T00:00:00`).getMonth()];

  const firstName = (bn ? affiliate?.nameBn : affiliate?.name)?.split(' ')[0] ?? '';

  const stats = [
    {
      icon: 'group', tone: 'text-primary', tag: `+${toBnDigits(thisWeekCount, lang)} ${bn ? 'এই সপ্তাহে' : 'this week'}`, tagClass: 'text-primary',
      value: toBnDigits(customersBrought, lang), valueClass: 'text-on-surface',
      labelBn: 'মোট কাস্টমার এনেছেন', labelEn: 'Customers you brought',
      foot: bn ? `${toBnDigits(customersBrought, lang)} জন কাস্টমার` : `${customersBrought} customers`,
    },
    {
      icon: 'shopping_bag', tone: 'text-tertiary', tag: bn ? 'সফল ডেলিভারি' : 'Successful', tagClass: 'text-tertiary',
      value: toBnDigits(ordersFromThem, lang), valueClass: 'text-on-surface',
      labelBn: 'তাদের মোট অর্ডার', labelEn: 'Orders from them',
      foot: bn ? `${toBnDigits(ordersFromThem, lang)}টি সফল অর্ডার` : `${ordersFromThem} successful orders`,
    },
    {
      icon: 'calendar_today', tone: 'text-primary', tag: bn ? anchorMonth : '', tagClass: 'text-primary',
      value: fmtTk(monthCommission, lang), valueClass: 'text-primary',
      labelBn: 'এই মাসের কমিশন', labelEn: 'Commission this month',
      foot: bn ? `${toBnDigits(ordersFromThem, lang)}টি ডেলিভারি` : `${ordersFromThem} deliveries`,
    },
    {
      icon: 'savings', tone: 'text-secondary', tag: bn ? 'সর্বমোট' : 'All-time', tagClass: 'text-secondary',
      value: fmtTk(allTime, lang), valueClass: 'text-on-surface',
      labelBn: 'সর্বমোট কমিশন', labelEn: 'All-time commission',
      foot: bn ? `${toBnDigits(ordersFromThem, lang)}টি সফল অর্ডার` : `${ordersFromThem} successful orders`,
    },
  ];

  const copyCode = () => {
    try { navigator.clipboard?.writeText(affiliate?.referralCode ?? ''); } catch { /* noop */ }
    setCopied(true);
  };

  const dayLabel = (dateStr: string) => {
    if (!latestRefDate) return dateStr;
    const diff = Math.round((new Date(latestRefDate).getTime() - new Date(dateStr).getTime()) / 86400000);
    if (diff <= 0) return bn ? 'আজ' : 'Today';
    if (diff === 1) return bn ? 'গতকাল' : 'Yesterday';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <PageFrame>
      {/* Greeting card */}
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-sm font-headline-sm text-on-surface font-bold">
              {bn ? `আসসালামু আলাইকুম, ${firstName}` : `Hello, ${firstName}`}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">
              Hello, {affiliate?.name ?? ''}
            </p>
          </div>
          <span className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">
            <span className="text-primary font-bold">{bn ? 'সক্রিয় অ্যাফিলিয়েট' : 'Active Affiliate'}</span> / Active Partner • {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
          </p>
        </div>
      </section>

      {/* Commission rate card */}
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border-2 border-primary/20 relative overflow-hidden mt-3">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-fixed/20 rounded-full pointer-events-none" />
        <div className="flex items-start justify-between gap-2 relative">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </span>
            <div>
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant uppercase tracking-wider">
                {bn ? 'আপনার কমিশন / Your commission' : 'Your commission'}
              </span>
              <p className="text-headline-sm font-headline-sm font-bold text-primary mt-0.5">
                {bn ? `প্রতি অর্ডারে ${fmtTk(affiliate?.commissionRate ?? 20, lang)}` : `${fmtTk(affiliate?.commissionRate ?? 20, lang)} per order`}
                <span className="text-label-md font-label-md text-on-surface-variant font-normal"> / ৳{affiliate?.commissionRate ?? 20} per order</span>
              </p>
            </div>
          </div>
          <span className="bg-primary text-on-primary text-label-sm font-label-sm px-2 py-0.5 rounded-full shrink-0">
            {bn ? 'ফিক্সড রেট' : 'Fixed rate'}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center gap-1 text-on-surface-variant relative">
          <span className="material-symbols-outlined text-label-md">shield</span>
          <p className="text-bilingual-sub font-bilingual-sub">
            {bn ? 'অ্যাডমিন নির্ধারণ করেছেন / Set by the admin (নমুনা রেট • প্রতিটি সফল ডেলিভারিতে কার্যকর)' : 'Set by the admin (applies to every successful delivery)'}
          </p>
        </div>
      </section>

      {/* Pending balance hero */}
      <section className="bg-secondary-fixed/30 rounded-xl p-4 border border-secondary/20 relative mt-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </span>
            <div>
              <p className="text-label-md font-label-md text-secondary font-bold">
                {bn ? 'তোলার বাকি / Pending balance' : 'Pending balance'}
              </p>
              <h2 className="text-headline-lg font-headline-lg font-bold text-on-secondary-fixed leading-tight">
                {fmtTk(pending, lang)} <span className="text-label-md font-label-md font-normal text-on-surface-variant">(৳{pending})</span>
              </h2>
            </div>
          </div>
          <span className="bg-surface-container-lowest text-secondary font-label-sm text-label-sm px-2 py-1 rounded-md border border-secondary/20 shrink-0">
            {bn ? `${toBnDigits(ordersFromThem, lang)}টি ডেলিভারি` : `${ordersFromThem} deliveries`}
          </span>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-2.5">
          {bn ? 'অ্যাডমিন বিকাশ বা নগদে ম্যানুয়ালি পেমেন্ট পরিশোধ করবেন' : 'The admin pays manually by bKash or Nagad'}
        </p>
        <button
          onClick={() => navigate('/affiliate/earnings')}
          className="mt-4 w-full h-12 bg-primary text-on-primary rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-95 duration-150 transition-all"
        >
          <span>{bn ? 'পেমেন্ট রিকোয়েস্ট / Request payout' : 'Request payout'}</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </section>

      {/* Performance stats */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-label-lg font-label-lg text-on-surface font-bold">
            {bn ? 'অ্যাফিলিয়েট পরিসংখ্যান / Performance Overview' : 'Performance Overview'}
          </h3>
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'রিয়েল-টাইম ডাটা' : 'Real-time data'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center">
                  <span className={`material-symbols-outlined text-label-lg ${s.tone}`}>{s.icon}</span>
                </span>
                <span className={`text-label-sm font-label-sm font-bold ${s.tagClass}`}>{s.tag}</span>
              </div>
              <div className="mt-3">
                <p className={`text-headline-md font-headline-md font-bold ${s.valueClass}`}>{s.value}</p>
                <p className="text-label-sm font-label-sm text-on-surface font-bold leading-tight mt-0.5">{bn ? s.labelBn : s.labelEn}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{s.labelEn}</p>
                <div className="mt-1 text-label-sm font-label-sm text-on-surface-variant">{s.foot}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick share */}
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mt-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-label-lg font-label-lg text-on-surface font-bold">
              {bn ? 'দ্রুত রেফারেল শেয়ার / Quick Share' : 'Quick Share'}
            </h4>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
              {bn ? 'বন্ধুদের শেয়ার করে নতুন কাস্টমার আনুন' : 'Share with friends to bring new customers'}
            </p>
          </div>
          <button onClick={() => navigate('/affiliate/tools')} className="text-primary text-label-sm font-label-sm flex items-center shrink-0">
            <span>{bn ? 'শেয়ার ট্যাব' : 'Share tab'}</span>
            <span className="material-symbols-outlined text-label-sm">chevron_right</span>
          </button>
        </div>
        <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary shrink-0">qr_code_2</span>
            <div className="min-w-0">
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'আপনার রেফারেল কোড' : 'Your referral code'}</p>
              <p className="text-label-lg font-label-lg font-bold text-primary tracking-wide truncate">{affiliate?.referralCode ?? ''}</p>
            </div>
          </div>
          <button
            onClick={copyCode}
            className="h-9 px-3.5 bg-primary text-on-primary rounded-full text-label-md font-label-md active:scale-95 duration-150 flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-label-md">content_copy</span>
            <span>{copied ? (bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : (bn ? 'কপি করুন / Copy' : 'Copy')}</span>
          </button>
        </div>
      </section>

      {/* Recent referral activity */}
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mt-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div>
            <h4 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'সাম্প্রতিক রেফারেল অ্যাক্টিভিটি' : 'Recent referral activity'}</h4>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Recent Referral Activity Stream</p>
          </div>
          <span className="text-label-sm font-label-sm text-primary font-bold shrink-0">
            {bn ? `${toBnDigits(referredOrders.length, lang)}টি` : `${referredOrders.length} total`}
          </span>
        </div>
        {referredOrders.length === 0 ? (
          <p className="py-4 text-center text-body-sm text-on-surface-variant">
            {bn ? 'এখনো কোনো রেফারেল অর্ডার নেই।' : 'No referral orders yet.'}
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {referredOrders.map((r, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-label-md" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-label-md font-label-md text-on-surface font-bold truncate">{r.customerName}</p>
                    <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                      {bn ? 'অর্ডার' : 'Order'} #{r.orderId} • {bn ? 'সফল ডেলিভারি' : 'Successful delivery'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-label-md font-label-md font-bold text-primary block">+{fmtTk(r.commission, lang)}</span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">{dayLabel(r.orderDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
