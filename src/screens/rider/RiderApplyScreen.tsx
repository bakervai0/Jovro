import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { Rider, User } from '../../types';
import { uid } from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

// Bicycle ONLY (owner, Oct 23): no motorbike riders — fuel cost.
// The form carries a single required confirmation row instead of
// a vehicle picker; every application records vehicleType
// 'bicycle'. (Existing demo riders keep whatever they have.)

/** Design-style field label: Bangla + English + required star (r1.1). */
function FieldLabel({ bn, en }: { bn: string; en: string }) {
  return (
    <label className="block text-label-lg text-on-surface">
      {bn} <span className="text-on-surface-variant font-normal">/ {en}</span>
      <span className="text-error">*</span>
    </label>
  );
}

const inputCls =
  'w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-body-md text-on-surface placeholder:text-outline/70 focus:border-primary focus:outline-none transition-all duration-150';

const pwInputCls =
  'w-full h-12 pl-11 pr-11 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-body-md text-on-surface placeholder:text-outline/70 focus:border-primary focus:outline-none transition-all duration-150';

/**
 * F1 Rider application — strict replica of Stitch design r1.1:
 * task header, hero card, then a <form> (space-y) with bilingual
 * labels, +880 mobile prefix, email warning box, password +
 * confirm, static hub area card with Change button + picker,
 * checkbox vehicle row(s), in-flow submit, note box, WhatsApp FAB.
 * F2 received state strictly follows r1.2 (halo clock hero,
 * summary card, next-steps timeline, hub support card, WhatsApp
 * FAB with dot badge, OK footer). Submitting creates a PENDING
 * Rider in shared state (admin approvals, H26).
 * Deviations (wiring preserved): a password-mismatch hint and
 * the received footer's rider-preview button. Owner's rules
 * (Oct 23): bicycle-only confirmation replaces the vehicle
 * rows, and the rider-intake gate (adminSettings.riderIntakeOpen
 * / riderCap) swaps this form for a closed notice when intake
 * is paused or the cap is reached — checked again at submit.
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
  const [hasBicycle, setHasBicycle] = useState(false);
  const [submitted, setSubmitted] = useState<Rider | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [gateBlocked, setGateBlocked] = useState(false);

  // Rider intake gate (Part B): closed when the admin switch is
  // off OR active+pending riders already fill the cap. Users who
  // already hold a rider record are exempt (they may be checking
  // their application status via the profile link).
  const intakeCount = state.riders.filter(r => r.status === 'active' || r.status === 'pending').length;
  const intakeClosed =
    state.adminSettings.riderIntakeOpen === false ||
    intakeCount >= (state.adminSettings.riderCap ?? 5);
  const myRecord = state.riders.find(r => r.userId === state.user?.id);

  const canSubmit =
    name.trim().length >= 3 &&
    mobile.trim().length >= 11 &&
    email.includes('@') &&
    password.length >= 6 &&
    confirm === password &&
    hasBicycle;

  const submit = () => {
    if (!canSubmit) return;
    // Re-check the gate at submit time — intake may have closed
    // while this form was sitting open.
    if (intakeClosed) { setGateBlocked(true); return; }
    const cleanMobile = mobile.trim();
    const rider: Rider = {
      id: uid('rider-app'),
      userId: `u-app-${cleanMobile}`,
      name: name.trim(),
      nameBn: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      areaId,
      vehicleType: 'bicycle',
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
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-outline-variant/30 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-headline-md font-bold text-primary tracking-tight">Jovro</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-secondary-container/40 text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block" />
              রাইডার পোর্টাল / Rider Portal
            </span>
          </div>
          <a href={OPERATOR.phoneTel} className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors active:scale-95 duration-150 py-1 px-2 rounded-lg bg-surface-container-low hover:bg-surface-container">
            <span className="material-symbols-outlined text-[18px] text-primary">phone_in_talk</span>
            <span className="text-label-sm text-on-surface">{bn ? OPERATOR.phoneDisplayBn.replace(' (নমুনা)', '') : OPERATOR.phoneDisplayEn.replace(' (sample)', '')}</span>
          </a>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-40 flex flex-col gap-5">
          <section className="text-center pt-2 flex flex-col items-center">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-secondary-container/15 blur-xl scale-150 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-secondary-fixed/50 border-2 border-secondary-container/30 flex items-center justify-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined filled-symbol text-[36px] text-secondary-container font-light">schedule</span>
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-2 border-surface-container-lowest flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-on-primary font-bold">check</span>
                </div>
              </div>
            </div>
            <h1 className="text-headline-md font-bold text-on-surface mb-0.5">আবেদন পেয়েছি!</h1>
            <p className="text-headline-sm text-primary tracking-tight font-semibold mb-3">Application received!</p>
            <div className="w-full bg-[#E8F5E9] border border-[#1D9D57]/30 rounded-xl p-3 flex items-start gap-2.5 text-left shadow-sm">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified_user</span>
              <p className="text-body-sm text-on-surface leading-snug">
                <span className="font-bold text-primary">অ্যাডমিন অনুমোদন করলেই</span> আপনার রাইডার সেকশন চালু হবে
                <span className="block text-bilingual-sub text-on-surface-variant mt-0.5">Your rider section will activate as soon as the admin approves your email</span>
              </p>
            </div>
          </section>

          {/* Application summary */}
          <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">assignment</span>
                <h2 className="text-label-lg text-on-surface">
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
                <span className="text-body-sm font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/20 font-mono">
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
          <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">alt_route</span>
              <div>
                <h2 className="text-label-lg text-on-surface">পরবর্তী ধাপসমূহ</h2>
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
                    'w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold shrink-0 z-10',
                    step.active
                      ? 'bg-secondary-container text-on-primary shadow-sm'
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
                <h4 className="text-label-md text-on-surface">লালমনিরহাট সদর হাব কন্ট্রোল রুম</h4>
                <p className="text-bilingual-sub text-on-surface-variant">জরুরী প্রয়োজনে সরাসরি কথা বলুন</p>
              </div>
            </div>
            <a href={OPERATOR.phoneTel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-primary border border-primary/30 text-label-sm font-bold shadow-sm hover:bg-primary hover:text-on-primary transition-colors active:scale-95 duration-150 shrink-0">
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
          className="fixed bottom-40 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(37,211,102,0.35)] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined filled-symbol text-[28px]">chat</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-container rounded-full border-2 border-white" />
        </a>

        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/30 py-3 px-4 shadow-[0_-4px_12px_rgba(43,45,47,0.08)]">
          <div className="max-w-[480px] mx-auto flex flex-col items-center gap-2">
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
              className="w-full h-12 rounded-full bg-primary hover:bg-[#15803D] active:scale-95 duration-150 text-on-primary text-label-lg flex items-center justify-center gap-2 shadow-sm font-bold"
            >
              <span>ঠিক আছে / OK</span>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
            <a onClick={() => navigate('/')} className="py-1 text-center text-body-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <span>কাস্টমার হিসেবে ব্রাউজ করুন</span>
              <span className="text-bilingual-sub text-outline">/ Browse as Customer</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </footer>
      </div>
    );
  }

  // ── Intake closed (Part B, owner Oct 23) ─────────────────────
  // Switch off or cap reached → notice instead of the form, in
  // the affiliate-closed pattern. Friends can still reach the
  // owner directly via the OPERATOR call/WhatsApp buttons.
  if ((intakeClosed || gateBlocked) && !myRecord) {
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <button
              aria-label="ফিরে যান"
              onClick={() => navigate('/')}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-headline-sm text-on-surface leading-tight">রাইডার আবেদন</h1>
              <span className="text-bilingual-sub text-on-surface-variant font-medium">Rider Application</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-headline-sm font-bold text-primary tracking-tight">Jovro</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed uppercase tracking-wider">Lalmonirhat</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-8 flex flex-col">
          <section
            aria-live="polite"
            className="mb-6 rounded-xl border border-secondary/30 bg-secondary/5 p-4 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary" />
            <div className="flex items-start gap-3 pl-1">
              <div className="w-9 h-9 rounded-full bg-secondary/12 flex items-center justify-center shrink-0 text-secondary">
                <span className="material-symbols-outlined filled-symbol text-[22px]">group_off</span>
              </div>
              <div className="flex-1">
                <h2 className="text-label-lg font-bold text-on-surface leading-tight">
                  {bn ? 'আপাতত নতুন রাইডার নেওয়া বন্ধ আছে' : 'Rider intake is paused for now'}
                </h2>
                <p className="text-bilingual-sub text-on-surface-variant font-medium mt-0.5 mb-2.5 leading-snug">
                  {bn ? 'Rider intake is paused for now' : 'আপাতত নতুন রাইডার নেওয়া বন্ধ আছে'}
                </p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {bn
                    ? 'এই মুহূর্তে সীমিত সংখ্যক রাইডার নেওয়া হয়েছে — আসন পূরণ হয়ে গেছে। পরে আবার রাইডার নেওয়া খুললে জানানো হবে। জরুরি দরকার হলে নিচের নম্বরে সরাসরি যোগাযোগ করুন।'
                    : 'A limited number of riders have been taken on and the seats are full. When rider intake opens again, it will be announced. If it is urgent, contact us directly below.'}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href={OPERATOR.phoneTel}
              className="h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 text-label-lg shadow-sm active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              <span>{bn ? 'কল করুন' : 'Call'}</span>
            </a>
            <a
              href={OPERATOR.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="h-12 rounded-full border-2 border-[#1D9D57]/50 text-[#128C7E] flex items-center justify-center gap-2 text-label-lg font-bold active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              <span>{bn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
            </a>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-full border-2 border-outline-variant text-label-lg font-bold text-on-surface flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            <span>{bn ? 'হোমে ফিরুন' : 'Back to home'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── F1: the form (design r1.1) ────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button
            aria-label="ফিরে যান"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-headline-sm text-on-surface leading-tight">রাইডার আবেদন</h1>
            <span className="text-bilingual-sub text-on-surface-variant font-medium">Rider Application</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-headline-sm font-bold text-primary tracking-tight">Jovro</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed uppercase tracking-wider">Lalmonirhat</span>
        </div>
      </header>

      <div className="px-4 pt-4 pb-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
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
                <span className="material-symbols-outlined filled-symbol text-[16px] text-primary">eco</span>
                <p className="text-body-sm font-medium">নিজের সাইকেলে ডেলিভারি করে আয় করুন / Earn on your bicycle</p>
              </div>
            </div>
          </div>
        </section>

        {/* Application form */}
        <form
          className="space-y-4"
          onSubmit={e => { e.preventDefault(); submit(); }}
        >
          {/* Name */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
          <div className="space-y-2">
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
          <div className="space-y-1.5">
            <FieldLabel bn="পাসওয়ার্ড" en="Password" />
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock</span>
              <input
                className={pwInputCls}
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
                className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant pl-1">কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন (Minimum 6 characters)</p>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <FieldLabel bn="আবার পাসওয়ার্ড দিন" en="Confirm Password" />
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock_reset</span>
              <input
                className={pwInputCls}
                placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                type={showConfirm ? 'text' : 'password'}
              />
              <button
                type="button"
                aria-label="পাসওয়ার্ড পুনরায় দেখুন"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-body-sm text-error pl-1">{bn ? 'দুটি পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}</p>
            )}
          </div>

          {/* Preferred area card (design r1.1: static hub card + Change) */}
          <div className="space-y-1.5">
            <FieldLabel bn="আপনার পছন্দের এলাকা" en="Preferred Delivery Area" />
            <div className="p-3.5 bg-surface-container-lowest border-2 border-primary/25 rounded-2xl flex items-start justify-between gap-3 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface font-bold leading-tight">
                    লালমনিরহাট সদর
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5 leading-normal">
                    মিশন মোড়, বিডিআর গেট, কালীবাড়ি রোড
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-1">
                    <span className="material-symbols-outlined filled-symbol text-[13px]">check_circle</span>
                    ডেলিভারি জোন সক্রিয়
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAreaOpen(v => !v)}
                className="text-primary hover:text-primary-container text-label-md underline underline-offset-2 shrink-0 pt-0.5 active:scale-95 duration-150"
              >
                পরিবর্তন করুন <span className="font-normal block text-right text-[10px]">Change</span>
              </button>
            </div>
            {areaOpen && (
              <div className="max-h-56 overflow-y-auto no-scrollbar rounded-2xl border border-outline-variant/50 divide-y divide-outline-variant/20 bg-surface-container-lowest">
                {state.areas.map(a => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => { setAreaId(a.id); setAreaOpen(false); }}
                    className={clsx(
                      'w-full flex items-center justify-between px-3.5 py-2.5 text-left text-body-md',
                      a.id === areaId ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface',
                    )}
                  >
                    {bn ? a.nameBn : a.nameEn}
                    {a.id === areaId && <span className="material-symbols-outlined text-[18px]">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bicycle confirmation (design r1.1 row style) —
              bicycle is the ONLY accepted vehicle (owner rule);
              the application cannot submit without this tick. */}
          <label
            className={clsx(
              'flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border-2 shadow-sm cursor-pointer transition-colors select-none',
              hasBicycle ? 'border-primary/40 hover:border-primary' : 'border-outline-variant/40 hover:border-primary/60',
            )}
          >
            <input
              type="checkbox"
              checked={hasBicycle}
              onChange={e => setHasBicycle(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary border-outline rounded focus:ring-primary focus:ring-offset-0 focus:ring-1 shrink-0"
            />
            <span className="flex-1 flex items-center justify-between">
              <span>
                <span className="flex items-center gap-1.5 text-label-lg text-on-surface font-bold">
                  <span className="material-symbols-outlined text-[20px] text-primary">pedal_bike</span>
                  <span>আমার নিজের সাইকেল আছে</span>
                </span>
                <span className="block text-bilingual-sub text-on-surface-variant mt-0.5 pl-[26px]">I have my own bicycle</span>
                <span className="block text-bilingual-sub text-on-surface-variant mt-0.5 pl-[26px]">
                  {bn ? 'শুধু সাইকেল রাইডার নেওয়া হয় — মোটরসাইকেল নয়' : 'Bicycle riders only — no motorbikes'}
                </span>
              </span>
              {hasBicycle && <span className="material-symbols-outlined filled-symbol text-[20px] text-primary ml-2 shrink-0">verified</span>}
            </span>
          </label>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={clsx(
                'w-full h-12 rounded-full text-label-lg flex items-center justify-center gap-2 transition-all duration-150',
                canSubmit
                  ? 'bg-primary hover:bg-primary-container active:bg-[#15803D] text-on-primary shadow-md hover:shadow-lg active:scale-[0.98]'
                  : 'bg-surface-container-high text-on-surface-variant shadow-none cursor-not-allowed',
              )}
            >
              <span>আবেদন পাঠান / Submit Application</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
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
        </form>
      </div>

      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="হোয়াটসঅ্যাপে সাহায্য নিন"
        className="fixed bottom-4 right-4 z-30 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(37,211,102,0.35)] hover:bg-[#20ba59] active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined filled-symbol text-[28px]">chat</span>
      </a>
    </div>
  );
}
