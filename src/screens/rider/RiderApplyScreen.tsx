import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { Rider, User } from '../../types';
import { uid } from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

const VEHICLES: { id: 'bicycle' | 'motorbike'; icon: string; titleBn: string; subEn: string }[] = [
  { id: 'bicycle', icon: 'pedal_bike', titleBn: 'আমার নিজের সাইকেল আছে', subEn: 'I have my own bicycle' },
  { id: 'motorbike', icon: 'two_wheeler', titleBn: 'আমার মোটরসাইকেল আছে', subEn: 'I have my own motorbike' },
];

/** Design-style field label: Bangla + English + required star (r1.1). */
function FieldLabel({ bn, en }: { bn: string; en: string }) {
  return (
    <label className="block text-label-lg font-semibold text-on-surface">
      {bn} <span className="text-on-surface-variant font-normal">/ {en}</span>
      <span className="text-error"> *</span>
    </label>
  );
}

const inputCls =
  'w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-body-md text-on-surface placeholder:text-outline/70 focus:border-primary focus:outline-none transition-all';

/**
 * F1 Rider application — layout/labels/order follow the Stitch
 * design r1.1 (hero card, bilingual labels, +880 mobile prefix,
 * email warning box, password + confirm, area card, vehicle
 * checkbox-cards, in-flow submit, note box, WhatsApp FAB).
 * F2 received state follows r1.2 (summary card, next-steps
 * timeline, hub support card, OK footer). Submitting creates a
 * PENDING Rider in shared state (admin approvals, H26).
 */
export default function RiderApplyScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [name, setName] = useState(state.user?.name ?? '');
  const [mobile, setMobile] = useState(state.user?.mobile ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [areaId, setAreaId] = useState(state.selectedAreaId);
  const [vehicle, setVehicle] = useState<'bicycle' | 'motorbike'>('bicycle');
  const [submitted, setSubmitted] = useState<Rider | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);

  const area = useMemo(() => state.areas.find(a => a.id === areaId), [state.areas, areaId]);
  const canSubmit =
    name.trim().length >= 3 &&
    mobile.trim().length >= 11 &&
    email.includes('@') &&
    password.length >= 6 &&
    confirm === password;

  const submit = () => {
    if (!canSubmit) return;
    const cleanMobile = mobile.trim();
    const rider: Rider = {
      id: uid('rider-app'),
      userId: `u-app-${cleanMobile}`,
      name: name.trim(),
      nameBn: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      areaId,
      vehicleType: vehicle,
      status: 'pending',
      totalDeliveries: 0,
      totalEarnings: 0,
      rating: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
      pendingPayout: 0,
    };
    dispatch({ type: 'ADD_APPLICATION', rider });
    dispatch({
      type: 'LOG_ACTIVITY',
      entry: {
        id: uid('act'),
        actorName: name.trim(),
        action: `নতুন রাইডার আবেদন করেছেন (${cleanMobile})`,
        at: new Date().toISOString(),
        category: 'general',
      },
    });
    setSubmitted(rider);
  };

  const enterAsPendingRider = () => {
    if (!submitted) return;
    const user: User = {
      id: submitted.userId,
      name: submitted.name,
      nameBn: submitted.nameBn,
      mobile: submitted.mobile,
      email: submitted.email,
      role: 'rider',
      deliveryAreaId: submitted.areaId,
      isVerified: false,
      createdAt: new Date().toISOString().slice(0, 10),
      referralCode: '',
    };
    dispatch({ type: 'LOGIN', user });
    navigate('/rider', { replace: true });
  };

  // ── F2: application received (design r1.2) ────────────────────
  if (submitted) {
    const trackingId = `#JVR-${submitted.mobile.slice(-4)}`;
    return (
      <div className="flex-1 flex flex-col bg-[#FAFAF7] overflow-hidden">
        <header className="flex items-center justify-between px-4 h-14 bg-surface-container-lowest/95 border-b border-outline-variant/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-headline-md font-bold text-primary tracking-tight">Jovro</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-secondary-container/40 text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block" />
              রাইডার পোর্টাল / Rider Portal
            </span>
          </div>
          <a href={OPERATOR.phoneTel} className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-surface-container-low text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">phone_in_talk</span>
            <span className="text-label-sm font-semibold">{bn ? OPERATOR.phoneDisplayBn.replace(' (নমুনা)', '') : OPERATOR.phoneDisplayEn.replace(' (sample)', '')}</span>
          </a>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-40 flex flex-col gap-5">
          <section className="text-center pt-2 flex flex-col items-center">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-secondary-fixed/50 border-2 border-secondary-container/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[36px] text-secondary-container">schedule</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-2 border-surface-container-lowest flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-on-primary font-bold">check</span>
              </div>
            </div>
            <h1 className="text-headline-md font-bold text-on-surface mb-0.5">আবেদন পেয়েছি!</h1>
            <p className="text-headline-sm text-primary tracking-tight font-semibold mb-3">Application received!</p>
            <div className="w-full bg-[#E8F5E9] border border-[#1D9D57]/30 rounded-xl p-3 flex items-start gap-2.5 text-left">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified_user</span>
              <p className="text-body-sm text-on-surface leading-snug">
                <span className="font-bold text-primary">অ্যাডমিন অনুমোদন করলেই</span> আপনার রাইডার সেকশন চালু হবে
                <span className="block text-bilingual-sub text-on-surface-variant mt-0.5">Your rider section will activate as soon as the admin approves your email</span>
              </p>
            </div>
          </section>

          {/* Application summary */}
          <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">assignment</span>
                <h2 className="text-label-lg font-semibold text-on-surface">
                  আবেদন বিবরণী <span className="text-on-surface-variant text-label-md font-normal">(Application Summary)</span>
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-label-sm font-bold border border-secondary/20">
                যাচাই প্রক্রিয়াধীন
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1">
                <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  জমাকৃত ইমেইল:
                </span>
                <span className="text-body-sm font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/20">
                  {submitted.email}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">tag</span>
                  ট্র্যাকিং আইডি:
                </span>
                <span className="text-body-sm font-bold text-primary bg-primary-fixed/40 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {trackingId}
                </span>
              </div>
              <div className="flex justify-between items-start py-1">
                <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">store</span>
                  সার্ভিস হাব:
                </span>
                <span className="text-body-sm font-semibold text-on-surface text-right">
                  লালমনিরহাট সদর হাব
                  <span className="block text-bilingual-sub text-on-surface-variant font-normal">Lalmonirhat Sadar Hub</span>
                </span>
              </div>
            </div>
          </section>

          {/* What happens next */}
          <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">alt_route</span>
              <div>
                <h2 className="text-label-lg font-semibold text-on-surface">পরবর্তী ধাপসমূহ</h2>
                <p className="text-bilingual-sub text-on-surface-variant">What happens next</p>
              </div>
            </div>
            <div className="space-y-4 relative">
              <div className="absolute left-3.5 top-3.5 bottom-6 w-0.5 bg-outline-variant/30" />
              {[
                {
                  n: '১', active: true, title: 'আবেদন যাচাই হবে', sub: 'We review your application',
                  body: 'যাচাই প্রক্রিয়া চলছে - সাধারণতঃ কয়েক ঘণ্টার মধ্যে সম্পন্ন হয়।',
                },
                {
                  n: '২', active: false, title: 'আপনার ইমেইল অনুমোদন হবে', sub: 'Your email gets approved',
                  body: 'অ্যাডমিন ডাটাবেসে আপনার ইমেইলটি রাইডার রোল হিসেবে সক্রিয় করবেন।',
                },
                {
                  n: '৩', active: false, title: 'এই ইমেইল দিয়ে লগইন করলেই রাইডার সেকশন', sub: 'Log in with this email to open the rider section',
                  body: 'লগইন করার সাথে সাথে সরাসরি রাইডার ড্যাশবোর্ড খুলে যাবে। কোনো অতিরিক্ত কোড লাগবে না।',
                },
              ].map(step => (
                <div key={step.n} className="relative flex items-start gap-3 pl-1">
                  <div className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold shadow-sm shrink-0 z-10',
                    step.active
                      ? 'bg-secondary-container text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40',
                  )}>
                    {step.n}
                  </div>
                  <div className="flex-1 bg-[#FAFAF7] rounded-lg p-2.5 border border-outline-variant/20">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-label-md text-on-surface font-semibold">{step.title}</h3>
                      {step.active && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-label-sm border border-secondary-container/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
                          চলমান / In Review
                        </span>
                      )}
                    </div>
                    <p className={clsx('text-bilingual-sub mb-1', step.active ? 'text-primary' : 'text-on-surface-variant')}>{step.sub}</p>
                    <p className="text-body-sm text-on-surface-variant">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Hub support */}
          <section className="bg-gradient-to-r from-surface-container-low to-surface-container rounded-xl p-3.5 border border-outline-variant/30 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div>
                <h4 className="text-label-md font-semibold text-on-surface">লালমনিরহাট সদর হাব কন্ট্রোল রুম</h4>
                <p className="text-bilingual-sub text-on-surface-variant">জরুরী প্রয়োজনে সরাসরি কথা বলুন</p>
              </div>
            </div>
            <a href={OPERATOR.phoneTel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-primary border border-primary/30 text-label-sm font-bold shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[16px]">call</span>
              কল করুন
            </a>
          </section>
        </div>

        <a
          href={OPERATOR.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Support"
          className="fixed bottom-40 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg"
        >
          <span className="material-symbols-outlined text-[28px]">chat</span>
        </a>

        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/30 py-3 px-4 shadow-md">
          <div className="max-w-[430px] mx-auto flex flex-col items-center gap-2">
            {/* Functional extra (not in design): demo preview of the F3 pending notice */}
            <button
              onClick={enterAsPendingRider}
              className="w-full h-11 rounded-full border-2 border-primary text-primary text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">directions_bike</span>
              {bn ? 'রাইডার হিসেবে ঢুকে দেখুন' : 'Preview rider sign-in'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-full bg-primary text-on-primary text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
            >
              <span>ঠিক আছে / OK</span>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
            <button onClick={() => navigate('/')} className="py-1 text-body-sm text-on-surface-variant flex items-center justify-center gap-1">
              <span>কাস্টমার হিসেবে ব্রাউজ করুন</span>
              <span className="text-bilingual-sub text-outline">/ Browse as Customer</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ── F1: the form (design r1.1) ────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 h-14 bg-surface-container-lowest border-b border-outline-variant/30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            aria-label="ফিরে যান"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-headline-sm font-semibold text-on-surface leading-tight">রাইডার আবেদন</h1>
            <span className="text-bilingual-sub text-on-surface-variant font-medium">Rider Application</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-headline-sm font-bold text-primary tracking-tight">Jovro</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed uppercase tracking-wider">Lalmonirhat</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-8 flex flex-col gap-5">
        {/* Hero card */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[28px]">pedal_bike</span>
            </div>
            <div className="flex-1">
              <h2 className="text-headline-md text-primary leading-tight font-bold">রাইডার হিসেবে আবেদন করুন</h2>
              <p className="text-label-md text-on-surface-variant mt-0.5">Apply to become a rider</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
                <p className="text-body-sm font-medium">নিজের সাইকেলে ডেলিভারি করে আয় করুন / Earn on your bicycle</p>
              </div>
            </div>
          </div>
        </section>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel bn="আপনার নাম" en="Full Name" />
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">person</span>
            <input
              className={inputCls}
              placeholder="যেমন: রফিকুল ইসলাম (e.g. Rafiqul Islam)"
              value={name}
              onChange={e => setName(e.target.value)}
              type="text"
            />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel bn="মোবাইল নম্বর" en="Mobile Number" />
          <div className="relative flex items-center">
            <div className="absolute left-0 top-0 bottom-0 px-3 bg-surface-container rounded-l-xl border-r border-outline-variant/40 flex items-center justify-center text-label-md text-on-surface font-semibold select-none">
              +880
            </div>
            <input
              className={clsx(inputCls, 'pl-[68px]')}
              placeholder="01XXXXXXXXX"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              type="tel"
            />
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm pl-1">
            <span className="material-symbols-outlined text-[16px] text-primary">sms</span>
            <span>যাচাইকরণ এসএমএস পাঠানো হবে (Verification SMS will be sent)</span>
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <FieldLabel bn="ইমেইল" en="Email address" />
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">mail</span>
            <input
              className={inputCls}
              placeholder="rafiq.bike@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
            />
          </div>
          <div className="p-3 bg-secondary-fixed/30 border border-secondary/20 rounded-xl flex items-start gap-2.5">
            <span className="text-base select-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-label-md text-on-secondary-fixed-variant font-semibold leading-snug">
                এই ইমেইলটাই অ্যাডমিন অনুমোদন করবেন — ঠিকঠাক লিখুন
              </p>
              <p className="text-bilingual-sub text-secondary mt-0.5 font-normal">
                The admin will approve THIS email — type it carefully
              </p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel bn="পাসওয়ার্ড" en="Password" />
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock</span>
            <input
              className={clsx(inputCls, 'pr-11')}
              placeholder="কমপক্ষে ৬ অক্ষর লিখুন"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'}
              minLength={6}
            />
            <button
              type="button"
              aria-label="পাসওয়ার্ড দেখুন"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 text-on-surface-variant p-1"
            >
              <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant pl-1">কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন (Minimum 6 characters)</p>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel bn="আবার পাসওয়ার্ড দিন" en="Confirm Password" />
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock_reset</span>
            <input
              className={clsx(inputCls, 'pr-11')}
              placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              type={showConfirm ? 'text' : 'password'}
            />
            <button
              type="button"
              aria-label="পাসওয়ার্ড পুনরায় দেখুন"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 text-on-surface-variant p-1"
            >
              <span className="material-symbols-outlined text-[20px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {confirm.length > 0 && confirm !== password && (
            <p className="text-body-sm text-error pl-1">{bn ? 'দুটি পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}</p>
          )}
        </div>

        {/* Preferred area card */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel bn="আপনার পছন্দের এলাকা" en="Preferred Delivery Area" />
          <button
            type="button"
            onClick={() => setAreaOpen(v => !v)}
            className="p-3.5 bg-surface-container-lowest border-2 border-primary/25 rounded-2xl flex items-start justify-between gap-3 shadow-sm text-left"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
              </div>
              <div>
                <p className="text-label-lg text-on-surface font-bold leading-tight">
                  {area ? (bn ? area.nameBn : area.nameEn) : bn ? 'এলাকা বেছে নিন' : 'Choose area'}
                </p>
                <p className="text-body-sm text-on-surface-variant mt-0.5 leading-normal">
                  লালমনিরহাট সদর
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-1">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  ডেলিভারি জোন সক্রিয়
                </span>
              </div>
            </div>
            <span className="text-primary font-label-md underline underline-offset-2 shrink-0 pt-0.5">
              পরিবর্তন করুন <span className="font-normal block text-right text-[10px]">Change</span>
            </span>
          </button>
          {areaOpen && (
            <div className="max-h-56 overflow-y-auto no-scrollbar rounded-2xl border border-outline-variant/50 divide-y divide-outline-variant/20 bg-surface-container-lowest">
              {state.areas.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAreaId(a.id); setAreaOpen(false); }}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 text-left text-body-md',
                    a.id === areaId ? 'bg-primary/8 text-primary font-semibold' : 'text-on-surface',
                  )}
                >
                  {bn ? a.nameBn : a.nameEn}
                  {a.id === areaId && <span className="material-symbols-outlined text-[18px]">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle checkbox-cards (design style; motorbike kept from F1 spec) */}
        <div className="flex flex-col gap-2">
          {VEHICLES.map(v => {
            const selected = vehicle === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVehicle(v.id)}
                className={clsx(
                  'flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border-2 shadow-sm text-left transition-colors',
                  selected ? 'border-primary/60' : 'border-outline-variant/40',
                )}
              >
                <span className={clsx(
                  'w-5 h-5 rounded flex items-center justify-center border shrink-0',
                  selected ? 'bg-primary border-primary text-on-primary' : 'border-outline bg-surface-container-lowest',
                )}>
                  {selected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-label-lg text-on-surface font-bold">
                    <span className="material-symbols-outlined text-[20px] text-primary">{v.icon}</span>
                    {v.titleBn}
                  </span>
                  <span className="block text-bilingual-sub text-on-surface-variant mt-0.5 pl-[26px]">{v.subEn}</span>
                </span>
                {selected && <span className="material-symbols-outlined text-[20px] text-primary shrink-0">verified</span>}
              </button>
            );
          })}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className={clsx(
              'w-full h-12 rounded-full text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md transition-all',
              canSubmit ? 'bg-primary text-on-primary active:scale-[0.98]' : 'bg-surface-container-high text-on-surface-variant shadow-none',
            )}
          >
            <span>আবেদন পাঠান / Submit Application</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          {!canSubmit && (
            <p className="text-label-sm text-on-surface-variant text-center mt-2">
              {bn ? 'নাম, সঠিক মোবাইল, ইমেইল, ৬+ অক্ষরের পাসওয়ার্ড আর মিলিয়ে আবার পাসওয়ার্ড দিন' : 'Add name, valid mobile, email, a 6+ character password and its confirmation'}
            </p>
          )}
        </div>

        {/* Bottom note */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            শুধু আবেদন করলেই অ্যাক্সেস মিলবে না — অ্যাডমিন আপনার ইমেইল অনুমোদন করলেই রাইডার সেকশন চালু হবে।
          </p>
          <p className="text-bilingual-sub text-outline mt-1 leading-normal">
            Applying alone does not give access — the rider section activates only after the admin approves your email.
          </p>
        </div>
      </div>

      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="হোয়াটসঅ্যাপে সাহায্য নিন"
        className="fixed bottom-4 right-4 z-30 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg"
      >
        <span className="material-symbols-outlined text-[28px]">chat</span>
      </a>
    </div>
  );
}
