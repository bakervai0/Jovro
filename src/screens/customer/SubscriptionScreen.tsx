import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits } from '../../services/orderUtils';

// Pass naming follows Stitch 28 / g5. Price + included deliveries
// stay driven by admin settings (sample monthly pass — no online
// payment; "Activate" registers interest exactly as before).
const PASS = {
  nameBn: 'সদর সুপার সেভার পাস',
  nameEn: 'Sadar Super Saver Pass',
  familyNameBn: 'সদর ফ্যামিলি প্যাক',
  familyNameEn: 'Sadar Family Pack',
};
// Weekly pack figures come straight from design 28 (no settings backing).
const WEEKLY = { price: 99, deliveries: 5, days: 7 };
// Demo usage shown in the active state (g5) until real pass data exists.
const DEMO_USED = 18;
const AVG_FEE = 40;

export default function SubscriptionScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const hasPass = !!state.user?.hasActivePass;
  const settings = state.adminSettings;
  const [previewActive, setPreviewActive] = useState(false);
  const [interested, setInterested] = useState(false);
  const [paused, setPaused] = useState(false);
  const [renewed, setRenewed] = useState(false);
  const [plan, setPlan] = useState<'family' | 'weekly'>('family');
  const [payMethod, setPayMethod] = useState<'bkash' | 'cod'>('bkash');

  const showActive = hasPass || previewActive;
  const used = DEMO_USED;
  const totalDeliveries = settings.passDeliveries;
  const left = totalDeliveries - used;
  const pct = Math.round((used / totalDeliveries) * 100);
  const saved = used * AVG_FEE;
  const strike = totalDeliveries * AVG_FEE;
  const familySavings = strike - settings.passPrice;
  const selectedPrice = plan === 'family' ? settings.passPrice : WEEKLY.price;

  const now = new Date();
  const validTill = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const validTillStr = validTill.toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const validTillShort = validTill.toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'short',
  });

  const registerInterest = () => {
    setInterested(true);
    if (
      state.user &&
      !settings.subscriptionInterests.some(i => i.mobile === state.user?.mobile)
    ) {
      dispatch({
        type: 'UPDATE_ADMIN_SETTINGS',
        settings: {
          ...settings,
          subscriptionInterests: [
            {
              id: `sub-int-${Date.now()}`,
              name: state.user.nameBn || state.user.name,
              mobile: state.user.mobile,
              areaId: state.user.deliveryAreaId,
              requestedAt: new Date().toISOString(),
            },
            ...settings.subscriptionInterests,
          ],
        },
      });
    }
  };

  const radioDot = (selected: boolean) => (
    <span className={clsx(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 bg-surface-container-lowest',
      selected ? 'border-primary' : 'border-outline',
    )}>
      {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
    </span>
  );

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
      {/* Header (Stitch 28) */}
      <header className="bg-surface-container-lowest shadow-sm flex items-center justify-between px-4 h-14 select-none shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} aria-label={bn ? 'ফিরে যান' : 'Go back'} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">{bn ? 'মাসিক সাইকেল পাস' : 'Monthly Cycle Pass'}</h1>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">Monthly Pass · লালমনিরহাট সদর</span>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="px-2 py-1 border border-outline-variant rounded-full font-label-md text-label-md text-primary bg-surface-container-low active:scale-95 duration-150"
        >
          বাংলা | EN
        </button>
      </header>

      {showActive ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-24 space-y-5">
          {/* Identity card (g5) */}
          {state.user && (
            <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-surface-container-low border-2 border-primary flex items-center justify-center text-primary overflow-hidden">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{bn ? state.user.nameBn || state.user.name : state.user.name}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {bn ? 'গ্রাহক' : 'Customer'}
                    </span>
                  </div>
                  <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{state.user.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant/90 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">phone_iphone</span>
                    <span>{toBnDigits(state.user.mobile, lang)} • লালমনিরহাট সদর</span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Active pass card (g5) */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 border-2 border-primary relative overflow-hidden shadow-sm">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full pointer-events-none" />
            <div className="flex items-start justify-between gap-2 mb-3 relative">
              <div className={clsx(
                'flex items-center gap-1.5 border px-2.5 py-1 rounded-full',
                paused ? 'bg-surface-container text-on-surface-variant border-outline-variant/40' : 'bg-[#FFF7ED] text-[#C2410C] border-[#F97316]/40',
              )}>
                <span className={clsx('w-2 h-2 rounded-full', paused ? 'bg-outline' : 'bg-[#F97316] animate-pulse')} />
                <span className="font-label-sm text-label-sm font-bold tracking-tight">
                  {paused ? (bn ? 'বিরতি দেওয়া / Paused' : 'Paused') : bn ? 'সক্রিয় মাসিক প্যাকেজ / Active Monthly Pass' : 'Active Monthly Pass'}
                </span>
              </div>
              <span className="material-symbols-outlined text-primary text-[22px]">card_membership</span>
            </div>
            <div className="mb-4 relative">
              <h2 className="font-headline-md text-headline-md text-on-surface">{bn ? PASS.nameBn : PASS.nameEn}</h2>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Sadar Super Saver Pass • Unlimited Free Deliveries</p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 mb-4 relative">
              <div className="flex flex-col justify-between pr-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">pedal_bike</span>
                  {bn ? 'বাকি আছে' : 'Remaining'}
                </span>
                <div className="my-1">
                  <span className="text-[26px] leading-[30px] font-bold text-primary">{toBnDigits(left, lang)}{bn ? 'টি' : ''}</span>
                </div>
                <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant/80">Left this month</span>
              </div>
              <div className="flex flex-col justify-between px-1.5 border-x border-outline-variant/40">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'ব্যবহৃত হয়েছে' : 'Used'}</span>
                <div className="my-1">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {toBnDigits(used, lang)} / {toBnDigits(totalDeliveries, lang)}
                  </span>
                </div>
                <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant/80">Used deliveries</span>
              </div>
              <div className="flex flex-col justify-between pl-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-secondary">event</span>
                  {bn ? 'মেয়াদ শেষ' : 'Expires'}
                </span>
                <div className="my-1">
                  <span className="font-label-md text-label-md font-bold text-on-surface leading-snug">{validTillShort}</span>
                </div>
                <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant/80">Valid till {validTill.getFullYear()}</span>
              </div>
            </div>

            <div className="mb-4 relative">
              <div className="flex justify-between items-center mb-1.5 font-label-sm text-label-sm">
                <span className="text-on-surface-variant">{bn ? `ব্যবহারের অগ্রগতি (${toBnDigits(pct, lang)}%)` : `Usage progress (${pct}%)`}</span>
                <span className="text-primary font-bold">
                  {bn ? `${toBnDigits(used, lang)}টি শেষ • ${toBnDigits(left, lang)}টি অবশিষ্ট` : `${used} used • ${left} left`}
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-label-sm text-on-surface-variant mt-1.5">
                {bn ? `মেয়াদ: ${validTillStr} পর্যন্ত` : `Valid till: ${validTillStr}`}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F5E9] border border-primary/30 mb-4 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md font-bold text-primary">{bn ? 'মোট ডেলিভারি সেভ করেছেন' : 'Total saved on deliveries'}</p>
                  <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Total saved on delivery fees</p>
                </div>
              </div>
              <span className="text-[20px] font-bold text-primary">{fmtTk(saved, lang)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 relative">
              <button
                onClick={() => setPaused(v => !v)}
                className="h-11 px-3 rounded-full border-[1.5px] border-outline text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 bg-surface-container-lowest active:scale-95 duration-150 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{paused ? 'play_circle' : 'pause_circle'}</span>
                <span>{paused ? (bn ? 'আবার চালু / Resume' : 'Resume') : bn ? 'বিরতি দিন / Pause' : 'Pause'}</span>
              </button>
              <button
                onClick={() => setRenewed(true)}
                className="h-11 px-3 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 duration-150 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">cached</span>
                <span>{bn ? 'নবায়ন / Renew' : 'Renew'}</span>
              </button>
            </div>
            {renewed && (
              <p className="text-label-md text-success flex items-center gap-1.5 mb-2 relative">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {bn ? 'নবায়নের আগ্রহ নেওয়া হয়েছে (ডেমো — কোনো পেমেন্ট হয়নি)।' : 'Renewal interest noted (demo — no payment taken).'}
              </p>
            )}
            <div className="flex items-start gap-2 pt-2 border-t border-outline-variant/30 text-on-surface-variant relative">
              <span className="material-symbols-outlined text-[17px] text-primary shrink-0 mt-0.5">support_agent</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {bn ? 'পাস সংক্রান্ত যেকোনো পরিবর্তনের জন্য সরাসরি অপারেটরের সাথে কথা বলতে পারেন।' : 'For any pass change, talk directly to the operator.'}{' '}
                <a href={OPERATOR.phoneTel} className="text-primary font-semibold">{bn ? 'কল করুন' : 'Call now'}</a>
              </p>
            </div>
          </section>

          {/* Zero-markup promise (g5) */}
          <section className="bg-[#FFF7ED] rounded-xl p-4 border border-[#F97316]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center shrink-0 text-[#C2410C]">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <div className="flex-1">
              <h3 className="font-label-lg text-label-lg text-[#C2410C] font-bold">{bn ? 'জিরো-মার্কআপ অঙ্গীকার' : 'Zero-markup promise'}</h3>
              <p className="font-body-sm text-body-sm text-[#783200] leading-snug">
                {bn ? 'আমরা দোকানের আসল দামেই পণ্য পৌঁছে দিই—শুধু ন্যায্য ডেলিভারি চার্জ নিই।' : 'We deliver at the shop\u2019s real price — only a fair delivery charge.'}
              </p>
            </div>
          </section>

          <p className="text-label-sm text-on-surface-variant/70 text-center">
            {bn ? '* ডেমো তথ্য — পাসের আসল হিসাব পরে যুক্ত হবে' : '* Demo data — real pass accounting comes later'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-40 space-y-4">
            {/* Hero (28) */}
            <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-bold tracking-wide">
                  <span className="material-symbols-outlined text-[14px]">pedal_bike</span>
                  {bn ? 'সুপার সেভিংস ডেলিভারি' : 'Super savings delivery'}
                </div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug">
                  {bn ? 'প্রতিদিনের বাজারের সাইকেল ডেলিভারি এখন আরও সাশ্রয়ী!' : 'Everyday bazaar cycle delivery, now even cheaper!'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed pt-1">
                  {bn
                    ? 'বারবার ডেলিভারি চার্জ না দিয়ে নিন মাসিক সেভিংস পাস — লালমনিরহাট সদরের চাকুরিজীবী ও পরিবারের জন্য বিশেষ সুবিধা।'
                    : 'Skip paying per delivery — take the monthly savings pass, made for Lalmonirhat Sadar families and working people.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant font-label-md text-label-md">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                  {bn ? 'জিরো হিডেন চার্জ' : 'Zero hidden charges'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">electric_rickshaw</span>
                  {bn ? 'ইকো-ফ্রেন্ডলি রাইডার' : 'Eco-friendly riders'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">lock_clock</span>
                  {bn ? 'মাসিক চুক্তি নেই' : 'No monthly lock-in'}
                </span>
              </div>
            </section>

            {/* Current status (28) */}
            <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[24px]">card_membership</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md text-outline">{bn ? 'বর্তমান স্ট্যাটাস' : 'Current status'} / Status</span>
                  <span className="w-2 h-2 rounded-full bg-outline/40" />
                </div>
                <p className="font-body-md text-body-md font-bold text-on-surface mt-0.5">
                  {bn ? 'বর্তমানে কোনো সক্রিয় মাসিক প্ল্যান নেই' : 'No active monthly plan right now'}
                </p>
                <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
                  {bn ? 'সাশ্রয়ী হারে আনলিমিটেড ডেলিভারি পেতে নিচের প্যাকেজটি বেছে নিন' : 'Pick a package below for low-rate deliveries'}
                </p>
              </div>
            </section>

            <div className="flex items-center justify-between pt-1">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{bn ? 'উপযুক্ত প্ল্যান নির্বাচন করুন' : 'Choose the right plan'}</h3>
              <span className="font-label-sm text-label-sm text-primary font-bold">LALMONIRHAT SADAR</span>
            </div>

            {/* Family pack (28) — price/deliveries from admin settings */}
            <section
              onClick={() => setPlan('family')}
              className={clsx(
                'bg-surface-container-lowest rounded-xl p-4 shadow-sm relative overflow-hidden transition-all cursor-pointer',
                plan === 'family' ? 'border-2 border-primary shadow-md' : 'border border-outline-variant/40 opacity-90',
              )}
            >
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-on-primary font-label-sm text-label-sm font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">stars</span>
                  {bn ? 'সবচেয়ে জনপ্রিয় / Most Popular' : 'Most Popular'}
                </div>
              </div>
              <div className="flex items-start gap-3 pt-1">
                {radioDot(plan === 'family')}
                <div className="flex-1">
                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {bn ? PASS.familyNameBn : PASS.familyNameEn}{' '}
                    <span className="block font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">Sadar Family Pack</span>
                  </h4>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">{fmtTk(settings.passPrice, lang)}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">/ {bn ? 'মাস' : 'month'}</span>
                    <span className="font-label-sm text-label-sm text-error line-through ml-1">{fmtTk(strike, lang)}+</span>
                  </div>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold mt-0.5">
                    {bn
                      ? `${toBnDigits(totalDeliveries, lang)}টি অর্ডারে প্রায় ${fmtTk(familySavings, lang)}+ টাকা নিশ্চিত সাশ্রয়! (নমুনা প্ল্যান)`
                      : `Save about ${fmtTk(familySavings, lang)}+ over ${totalDeliveries} orders! (sample plan)`}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md mt-2.5 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-primary text-[15px]">calendar_month</span>
                    {bn ? '৩০ দিন মেয়াদ (30 Days Validity)' : '30 days validity'}
                  </div>
                  <ul className="mt-4 space-y-2.5 border-t border-outline-variant/20 pt-4">
                    {[
                      { bn: `${toBnDigits(totalDeliveries, lang)}টি ফ্রি সাইকেল ডেলিভারি (মাসিক বাজার ও রেস্টুরেন্ট)`, en: `${totalDeliveries} free cycle deliveries (bazaar & restaurants)` },
                      { bn: 'অগ্রাধিকার ভিত্তিতে ব্যক্তিগত শপার নিয়োগ (Priority Personal Shopper)', en: 'Priority personal shopper' },
                      { bn: 'বৃষ্টি বা খারাপ আবহাওয়াতেও কোনো অতিরিক্ত সারচার্জ নেই (Zero bad-weather surcharge)', en: 'No bad-weather surcharge' },
                      { bn: 'বাজার থেকে তাজা পছন্দের সবজি ও মাছের ভিডিও যাচাই সুবিধা', en: 'Video verification of fresh picks from the bazaar' },
                      { bn: 'যেকোনো সময় বিরতি দেওয়া যাবে', en: 'Pause anytime' },
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span className="font-body-sm text-body-sm text-on-surface leading-tight">{bn ? f.bn : f.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Weekly pack (28) */}
            <section
              onClick={() => setPlan('weekly')}
              className={clsx(
                'bg-surface-container-lowest rounded-xl p-4 shadow-sm relative transition-all cursor-pointer',
                plan === 'weekly' ? 'border-2 border-primary shadow-md' : 'border border-outline-variant/40 opacity-90',
              )}
            >
              <div className="flex items-start gap-3">
                {radioDot(plan === 'weekly')}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-body-lg text-body-lg font-bold text-on-surface">{bn ? 'সাপ্তাহিক বাজার প্যাক' : 'Weekly Bazaar Pass'}</h4>
                      <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">Weekly Bazaar Pass</span>
                    </div>
                    <div className="text-right">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{fmtTk(WEEKLY.price, lang)}</span>
                      <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant block">/ {bn ? '৭ দিন' : '7 days'}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <span className="material-symbols-outlined text-[17px]">local_mall</span>
                      {bn ? `${toBnDigits(WEEKLY.deliveries, lang)}টি ফ্রি সাইকেল ডেলিভারি` : `${WEEKLY.deliveries} free cycle deliveries`}
                    </span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{bn ? '৭ দিন মেয়াদ' : '7 days validity'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy (28) */}
            <section className="bg-[#FFF7ED] rounded-xl p-4 border border-secondary-container/30 space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-lg text-label-lg font-bold">
                <span className="material-symbols-outlined text-secondary">info</span>
                {bn ? 'সাবস্ক্রিপশন নীতি ও স্বচ্ছতা' : 'Subscription policy & transparency'}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {bn
                  ? 'কোনো অটো-রিনিউয়াল বা গোপন ফি নেই — মাস শেষে আপনার অনুমতি ছাড়া টাকা কাটা হবে না। ক্যাশ বা বিকাশে পরিশোধযোগ্য।'
                  : 'No auto-renewal or hidden fees — nothing is charged without your permission. Pay by cash or bKash.'}
              </p>
              <div className="pt-1 flex items-center gap-4 text-secondary font-label-md text-label-md">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  {bn ? 'যেকোনো সময় বাতিলযোগ্য' : 'Cancel anytime'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">support_agent</span>
                  {bn ? '২৪/৭ কাস্টমার সাপোর্ট' : '24/7 customer support'}
                </span>
              </div>
            </section>

            {/* Coverage strip (28) */}
            <section className="p-3 rounded-lg bg-surface-container-low flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
              <span className="font-bilingual-sub text-bilingual-sub">
                {bn ? 'কালীবাড়ী রোড, স্টেশন বাজার ও গোশালা মোড়ের সব শপ থেকে সরাসরি ডেলিভারি প্রযোজ্য।' : 'Applies to deliveries from all shops at Kalibari Road, Station Bazar and Goshala Mor.'}
              </span>
            </section>

            {interested && (
              <div className="bg-success/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                <p className="text-body-md text-success font-medium">
                  {bn ? 'আগ্রহ নেওয়া হয়েছে! পাস চালু হলে আমরা ফোনে জানিয়ে দেবো।' : 'Interest noted! We will call you when the pass launches.'}
                </p>
              </div>
            )}
            <p className="text-label-sm text-on-surface-variant/70 text-center">
              {bn ? 'এখন অনলাইন পেমেন্ট নেই — আগ্রহ জানালেই হবে।' : 'No online payment now — just register your interest.'}
            </p>

            {/* Demo preview of the active state (kept from earlier build) */}
            <button
              onClick={() => setPreviewActive(true)}
              className="w-full text-label-md text-primary font-medium py-1 flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              {bn ? 'ডেমো: সক্রিয় পাসের অবস্থা দেখুন' : 'Demo: preview the active-pass state'}
            </button>
          </div>

          {/* Sticky payment + activate bar (28) */}
          <div className="absolute bottom-0 left-0 right-0 z-40 bg-surface-container-lowest px-4 py-3 shadow-[0_-4px_12px_rgba(43,45,47,0.08)]">
            <div className="flex items-center justify-between pb-2">
              <span className="font-label-md text-label-md text-on-surface-variant">{bn ? 'পেমেন্ট মেথড বেছে নিন:' : 'Choose payment method:'}</span>
              <div className="flex items-center gap-2">
                <label
                  onClick={() => setPayMethod('bkash')}
                  className={clsx(
                    'flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-full border font-label-sm text-label-sm',
                    payMethod === 'bkash' ? 'bg-surface-container-low border-primary text-primary font-semibold' : 'border-outline-variant text-on-surface',
                  )}
                >
                  <span className={clsx('w-3 h-3 rounded-full border-2', payMethod === 'bkash' ? 'border-primary bg-primary' : 'border-outline')} />
                  bKash ({bn ? 'বিকাশ' : 'bKash'})
                </label>
                <label
                  onClick={() => setPayMethod('cod')}
                  className={clsx(
                    'flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-full border font-label-sm text-label-sm',
                    payMethod === 'cod' ? 'bg-surface-container-low border-primary text-primary font-semibold' : 'border-outline-variant text-on-surface',
                  )}
                >
                  <span className={clsx('w-3 h-3 rounded-full border-2', payMethod === 'cod' ? 'border-primary bg-primary' : 'border-outline')} />
                  {bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                </label>
              </div>
            </div>
            <button
              onClick={registerInterest}
              disabled={interested}
              className="w-full h-12 bg-primary active:scale-[0.98] transition-all rounded-full flex items-center justify-between px-4 text-on-primary shadow-md disabled:opacity-60"
            >
              <span className="flex flex-col text-left">
                <span className="font-label-sm text-label-sm font-normal opacity-90">{bn ? 'মোট প্রদেয়' : 'Total'} / Total</span>
                <span className="font-headline-sm text-headline-sm font-bold leading-none">{fmtTk(selectedPrice, lang)}</span>
              </span>
              <span className="flex items-center gap-1.5 font-label-lg text-label-lg font-bold">
                <span>{interested ? (bn ? 'আগ্রহ নেওয়া হয়েছে ✓' : 'Interest noted ✓') : bn ? 'প্ল্যানটি চালু করুন / Activate Plan' : 'Activate Plan'}</span>
                {!interested && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </span>
            </button>
          </div>
        </>
      )}

      {/* WhatsApp FAB (designs 28 / g5) */}
      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp Dispatcher"
        className={clsx(
          'absolute right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-95 duration-150 transition-transform',
          showActive ? 'bottom-5' : 'bottom-[150px]',
        )}
      >
        <span className="material-symbols-outlined text-[28px]">chat</span>
      </a>
    </div>
  );
}
