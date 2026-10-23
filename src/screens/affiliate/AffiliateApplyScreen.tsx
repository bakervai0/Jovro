import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import type { Affiliate, User } from '../../types';
import { uid } from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

const PROMOTE_CHANNELS = ['Facebook পেজ', 'Facebook প্রোফাইল', 'এলাকার গ্রুপ', 'দোকান / Shop'];

/**
 * I1 Affiliate application (Stitch af1.1) — name, mobile, email,
 * password and "কোথায় প্রচার করবেন?" promotion channels.
 * Submitting creates a PENDING Affiliate in shared state for the
 * admin approvals queue (Part 2). I2 received state (af1.2)
 * follows here; its preview button demonstrates the pending
 * notice (I2 guard in the /affiliate shell). Password fields are
 * design-faithful form state only — nothing is stored.
 */
export default function AffiliateApplyScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [name, setName] = useState(state.user?.name ?? '');
  const [mobile, setMobile] = useState(state.user?.mobile ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [channels, setChannels] = useState<string[]>(['Facebook পেজ']);
  const [promoteText, setPromoteText] = useState('');
  const [submitted, setSubmitted] = useState<Affiliate | null>(null);
  const [copied, setCopied] = useState(false);

  const promoteNote = [...channels, promoteText.trim()].filter(Boolean).join(' — ');
  const canSubmit =
    name.trim().length >= 3 && mobile.trim().length >= 11 && email.includes('@')
    && password.length >= 6 && confirmPassword === password
    && promoteNote.trim().length >= 3;

  const toggleChannel = (c: string) =>
    setChannels(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));

  const submit = () => {
    if (!canSubmit) return;
    const cleanMobile = mobile.trim();
    const affiliate: Affiliate = {
      id: uid('aff-app'),
      userId: `u-aff-${cleanMobile}`,
      name: name.trim(),
      nameBn: name.trim(),
      mobile: cleanMobile,
      email: email.trim(),
      promoteNote: promoteNote.trim(),
      referralCode: `JV-${cleanMobile.slice(-4)}`,
      status: 'pending',
      totalReferrals: 0,
      totalEarnings: 0,
      pendingPayout: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
      commissionRate: 20,
    };
    dispatch({ type: 'ADD_APPLICATION', affiliate });
    dispatch({
      type: 'LOG_ACTIVITY',
      entry: {
        id: uid('act'),
        actorName: name.trim(),
        action: `নতুন অ্যাফিলিয়েট আবেদন করেছেন (${cleanMobile})`,
        at: new Date().toISOString(),
        category: 'general',
      },
    });
    setSubmitted(affiliate);
  };

  const enterAsPendingAffiliate = () => {
    if (!submitted) return;
    const user: User = {
      id: submitted.userId,
      name: submitted.name,
      nameBn: submitted.nameBn,
      mobile: submitted.mobile,
      email: submitted.email,
      role: 'affiliate',
      deliveryAreaId: state.selectedAreaId,
      isVerified: false,
      createdAt: new Date().toISOString().slice(0, 10),
      referralCode: submitted.referralCode,
    };
    dispatch({ type: 'LOGIN', user });
    navigate('/affiliate', { replace: true });
  };

  const inputCls = 'w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant/40 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none';
  const labelCls = 'block mb-1.5';

  // ── I2: application received (af1.2) ──────────────────────────
  if (submitted) {
    const trackingId = `#AF-${submitted.mobile.slice(-4)}`;
    const steps = [
      {
        title: bn ? 'আবেদন যাচাই হবে' : 'We review your application',
        sub: 'We review your application',
        body: bn ? 'অ্যাডমিন আপনার পেজ বা প্রচার মাধ্যম যাচাই করবেন।' : 'The admin will verify your page or promotion channel.',
      },
      {
        title: bn ? 'আপনার ইমেইল অনুমোদন হবে' : 'Your email gets approved',
        sub: 'Your email gets approved',
        body: bn ? 'অ্যাডমিন ডাটাবেসে আপনার ইমেইলটি অ্যাফিলিয়েট হিসেবে সক্রিয় করবেন ও একটি নির্দিষ্ট কমিশন রেট ঠিক করবেন।' : 'The admin will activate your email as an affiliate and set a commission rate.',
      },
      {
        title: bn ? 'এই ইমেইল দিয়ে লগইন করলেই অ্যাফিলিয়েট ড্যাশবোর্ড' : 'Log in with this email to open the affiliate dashboard',
        sub: 'Log in with this email to open the affiliate dashboard',
        body: bn ? 'লগইন করার সাথে সাথে সরাসরি রেফারেল কোড ও কমিশন ড্যাশবোর্ড চালু হবে।' : 'Your referral code and commission dashboard activate as soon as you log in.',
      },
    ];
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Jovro</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">
              {bn ? 'অ্যাফিলিয়েট পোর্টাল' : 'Affiliate Portal'}
            </span>
          </div>
          <a href={OPERATOR.phoneTel} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-container-low text-on-surface" title={bn ? 'হেল্পলাইন কল করুন' : 'Call helpline'}>
            <span className="material-symbols-outlined text-primary text-[18px]">call</span>
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">{OPERATOR.phoneDisplayEn}</span>
          </a>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-40 flex flex-col gap-5">
          <section className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-secondary-fixed/50 flex items-center justify-center border-2 border-secondary-fixed">
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
              {bn ? 'আবেদন পেয়েছি!' : 'Application received!'}
            </h1>
            <p className="font-bilingual-sub text-bilingual-sub text-primary font-semibold tracking-wide uppercase mt-0.5">
              Application received! • Application under review
            </p>
            <div className="mt-4 w-full bg-primary-fixed/30 border border-primary-fixed-dim/70 rounded-xl p-3.5 flex items-start gap-3 text-left shadow-sm">
              <span className="material-symbols-outlined text-primary text-[22px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <p className="font-body-md text-body-md text-on-surface leading-snug">
                {bn ? 'অ্যাডমিন অনুমোদন করলেই আপনার অ্যাফিলিয়েট সেকশন চালু হবে' : 'Your affiliate section activates once the admin approves'}
                <span className="block font-bilingual-sub text-bilingual-sub text-on-surface-variant mt-1">
                  Your affiliate section will activate as soon as the admin approves your email
                </span>
              </p>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{bn ? 'আবেদন বিবরণী' : 'Application summary'}</span>
              </div>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">Application Summary</span>
            </div>
            <div className="pt-3.5 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'দাখিলকৃত ইমেইল (Submitted Email)' : 'Submitted Email'}</span>
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">{submitted.email}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed text-label-sm font-label-sm shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  {bn ? 'অপেক্ষমাণ' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'ট্র্যাকিং আইডি (Tracking ID)' : 'Tracking ID'}</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary tracking-wide">{trackingId}</span>
                </div>
                <button
                  onClick={() => {
                    try { navigator.clipboard?.writeText(trackingId); } catch { /* clipboard unavailable */ }
                    setCopied(true);
                  }}
                  className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm py-1 px-2 rounded"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copied ? (bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : (bn ? 'কপি করুন' : 'Copy')}</span>
                </button>
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'প্রচার মাধ্যম (Promotion Channel)' : 'Promotion Channel'}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">public</span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">{submitted.promoteNote}</span>
                </div>
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'নির্ধারিত হাব (Service Hub)' : 'Service Hub'}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">{bn ? 'লালমনিরহাট সদর হাব' : 'Lalmonirhat Sadar Hub'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 mb-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {bn ? 'পরবর্তী ধাপসমূহ (Next Steps)' : 'Next Steps'}
              </h2>
              <span className="font-label-sm text-label-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{bn ? 'স্বচ্ছ প্রক্রিয়া' : 'Transparent process'}</span>
            </div>
            <div className="relative pl-1 flex flex-col gap-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div className="relative flex flex-col items-center">
                    <div className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center font-label-md font-bold shrink-0 shadow-sm',
                      i === 0 ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-on-surface-variant',
                    )}>
                      {bn ? ['১', '২', '৩'][i] : i + 1}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 h-16 bg-outline-variant/40 mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-label-lg text-label-lg text-on-surface font-bold">{step.title}</h3>
                      {i === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold shrink-0">
                          {bn ? 'চলমান / In Review' : 'In Review'}
                        </span>
                      )}
                    </div>
                    <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant mb-1">{step.sub}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[22px]">support_agent</span>
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{bn ? 'লালমনিরহাট সদর হাব কন্ট্রোল রুম' : 'Lalmonirhat Sadar Hub Control Room'}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{bn ? 'কোনো প্রশ্ন থাকলে সরাসরি কল করুন' : 'Call directly if you have questions'}</span>
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">call</span>
                <span className="font-label-lg text-label-lg font-bold">{OPERATOR.phoneDisplayEn}</span>
              </span>
              <a href={OPERATOR.phoneTel} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm">
                <span>{bn ? 'কল করুন' : 'Call now'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </section>
        </div>

        {/* Footer (af1.2) — preview sign-in kept above OK (functional extra) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-[480px] bg-surface-container-lowest border-t border-outline-variant/30 px-4 py-3.5 shadow-lg flex flex-col items-center gap-2 pointer-events-auto">
            <Button variant="secondary" size="full" icon="campaign" onClick={enterAsPendingAffiliate}>
              {bn ? 'অ্যাফিলিয়েট হিসেবে ঢুকে দেখুন (প্রিভিউ)' : 'Preview affiliate sign-in'}
            </Button>
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 duration-150 transition-all"
            >
              <span>{bn ? 'ঠিক আছে / OK' : 'OK'}</span>
            </button>
            <button onClick={() => navigate('/')} className="font-label-md text-label-md text-on-surface-variant py-1 flex items-center gap-1">
              <span>{bn ? 'কাস্টমার হিসেবে ব্রাউজ করুন / Browse as Customer' : 'Browse as Customer'}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        </div>

        <a
          href={OPERATOR.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-44 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </a>
      </div>
    );
  }

  // ── I1: the form (af1.1) ──────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <header className="sticky top-0 z-40 bg-surface-container-lowest shadow-sm shrink-0">
        <div className="flex justify-between items-center w-full px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150 flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-baseline gap-1.5">
              <span className="text-headline-md font-headline-md font-bold text-primary tracking-tight">Jovro</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{bn ? 'অ্যাফিলিয়েট' : 'Affiliate'}</span>
            </div>
          </div>
          <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/30 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <span className="font-bilingual-sub text-bilingual-sub font-semibold">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-10 flex flex-col">
        <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20 relative overflow-hidden mb-6">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-fixed-dim/20 rounded-full pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
            </span>
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface font-bold leading-tight">
                {bn ? 'অ্যাফিলিয়েট হিসেবে আবেদন করুন' : 'Apply as an affiliate'}
              </h1>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant uppercase tracking-wide mt-0.5">Apply as an affiliate</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                {bn ? 'বন্ধুদের Jovro-তে আনুন, প্রতি অর্ডারে কমিশন পান / Bring friends to Jovro and earn commission on every order.' : 'Bring friends to Jovro and earn commission on every order.'}
              </p>
            </div>
          </div>
        </section>

        <form className="space-y-6" onSubmit={e => { e.preventDefault(); submit(); }}>
          <div>
            <label className={labelCls} htmlFor="aff-name">
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'আপনার নাম' : 'Your name'} <span className="text-error">*</span></span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Full name</span>
            </label>
            <div className="relative">
              <input id="aff-name" value={name} onChange={e => setName(e.target.value)} placeholder={bn ? 'করিমুল ইসলাম' : 'Your full name'} className={inputCls} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="aff-mobile">
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'মোবাইল নম্বর' : 'Mobile number'} <span className="text-error">*</span></span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Mobile number</span>
            </label>
            <div className="flex items-center h-12 bg-surface-container-lowest border border-outline-variant/40 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
              <span className="px-3 bg-surface-container-low h-full flex items-center border-r border-outline-variant/30 text-on-surface font-label-md text-label-md shrink-0">
                <span className="mr-1">🇧🇩</span> +880
              </span>
              <input id="aff-mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="01XXXXXXXXX" className="w-full h-full px-4 bg-transparent border-0 font-body-md text-body-md text-on-surface placeholder:text-outline/60 focus:ring-0 outline-none" />
              <span className="pr-3 text-outline-variant shrink-0">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </span>
            </div>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant mt-1 px-1">
              {bn ? 'পেমেন্ট এই নম্বরের বিকাশ/নগদে যাবে' : 'Payouts go to this number’s bKash/Nagad'}
            </p>
          </div>

          <div>
            <label className={labelCls} htmlFor="aff-email">
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'ইমেইল' : 'Email'} <span className="text-error">*</span></span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Email address</span>
            </label>
            <div className="relative">
              <input id="aff-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yourname@gmail.com" className={inputCls} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </span>
            </div>
            <div className="mt-2 p-2.5 rounded-lg bg-secondary-fixed/30 border border-secondary/20 flex items-start gap-2">
              <span className="text-[16px] leading-tight select-none">⚠️</span>
              <div className="flex-1">
                <p className="font-label-md text-label-md text-secondary font-semibold leading-snug">
                  {bn ? 'এই ইমেইলটাই অ্যাডমিন অনুমোদন করবেন — ঠিকঠাক লিখুন' : 'The admin will approve THIS email — type it carefully'}
                </p>
                <p className="font-bilingual-sub text-bilingual-sub text-on-secondary-fixed-variant mt-0.5">
                  The admin will approve THIS email — type it carefully
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="aff-password">
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'পাসওয়ার্ড' : 'Password'} <span className="text-error">*</span></span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Password (minimum 6 characters)</span>
            </label>
            <div className="relative">
              <input id="aff-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-11`} />
              <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="aff-confirm">
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'আবার পাসওয়ার্ড দিন' : 'Confirm password'} <span className="text-error">*</span></span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Confirm password</span>
            </label>
            <div className="relative">
              <input id="aff-confirm" type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pr-11`} />
              <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">{showConfirmPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-label-sm text-error mt-1 px-1">{bn ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match'}</p>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <span className="font-label-lg text-label-lg text-on-surface block">{bn ? 'কোথায় প্রচার করবেন?' : 'Where will you promote?'}</span>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Where will you promote Jovro?</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PROMOTE_CHANNELS.map(c => {
                const selected = channels.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChannel(c)}
                    className={clsx(
                      'h-11 px-3 rounded-lg font-label-md text-label-md flex items-center justify-between transition-all active:scale-95',
                      selected ? 'border-2 border-primary bg-primary text-white shadow-sm' : 'border border-outline-variant/50 bg-surface-container-lowest text-on-surface',
                    )}
                  >
                    <span className="truncate">{c}</span>
                    <span className={clsx('material-symbols-outlined text-[18px] ml-1', !selected && 'opacity-40')} style={selected ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {selected ? 'check' : 'add'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-1.5">
              <input
                value={promoteText}
                onChange={e => setPromoteText(e.target.value)}
                placeholder={bn ? 'আপনার Facebook পেজের নাম বা এলাকার নাম লিখুন' : 'Your Facebook page name or area name'}
                className={inputCls}
              />
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant mt-1 px-1">
                e.g. Lalmonirhat Bazar Updates (ফেসবুক পেজ)
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {bn ? 'শুধু আবেদন করলেই অ্যাক্সেস মিলবে না — অ্যাডমিন আপনার ইমেইল অনুমোদন করলেই অ্যাফিলিয়েট ড্যাশবোর্ড চালু হবে।' : 'Applying alone does not grant access — the dashboard activates after admin approval.'}
              <span className="block text-bilingual-sub font-bilingual-sub opacity-80 mt-1">
                Applying alone does not grant access — the affiliate section activates only after admin approval.
              </span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-14 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>{bn ? 'আবেদন পাঠান / Submit application' : 'Submit application'}</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
            {!canSubmit && (
              <p className="text-label-sm text-on-surface-variant text-center mt-2">
                {bn ? 'নাম, সঠিক মোবাইল, ইমেইল, পাসওয়ার্ড আর প্রচারের জায়গা ঠিকঠাক দিন' : 'Complete name, mobile, email, password and promotion channel'}
              </p>
            )}
          </div>
        </form>

        <footer className="mt-8 mb-4 text-center">
          <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-tertiary font-label-md text-label-md py-2 px-3 rounded-lg">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>{bn ? 'কোনো প্রশ্ন আছে? হাব কন্ট্রোল রুমে যোগাযোগ করুন' : 'Questions? Contact the hub control room'}</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
