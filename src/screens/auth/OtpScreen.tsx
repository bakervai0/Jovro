import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OtpInput } from '../../components/ui/Input';
import { OPERATOR } from '../../data/infoContent';
import { toBnDigits } from '../../services/orderUtils';
import { requestOtp, verifyOtp } from '../../services/auth';
import { isSupabaseConfigured } from '../../lib/supabase';

// ── Stitch 3 (phone sign-in) + Stitch 5 (OTP verification) ────
// Two steps in one screen: phone entry (name optional, +880
// mobile, COD card) → requestOtp → 4-digit code entry with the
// design-5 resend countdown, WhatsApp fallback and secure strip.
// Demo OTP stays 1234 (services/auth). Reset mode hands off to
// /set-password exactly as before.

export default function OtpScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = state.lang;
  const bn = lang === 'bn';

  const passedPhone: string = (location.state as any)?.phone ?? '';
  const mode: 'login' | 'reset' = (location.state as any)?.mode ?? 'login';

  const [step, setStep] = useState<'phone' | 'verify'>(passedPhone ? 'verify' : 'phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(passedPhone);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(42);

  useEffect(() => {
    if (step !== 'verify' || resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds, step]);

  // The OTP flow is DEMO-ONLY: with a real backend, sign-in is
  // email + password and password reset goes by email link —
  // this screen simply does not exist in configured mode.
  if (isSupabaseConfigured) return <Navigate to="/login" replace />;

  const fullPhone = phone.startsWith('0') || phone.startsWith('+') ? phone : phone ? `0${phone}` : phone;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) { setError(bn ? 'সঠিক মোবাইল নম্বর দিন' : 'Enter a valid mobile number'); return; }
    setLoading(true);
    setError('');
    try {
      await requestOtp(fullPhone);
      setResendSeconds(42);
      setStep('verify');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) { setError(bn ? 'OTP দিন' : 'Enter OTP'); return; }
    setLoading(true);
    setError('');
    try {
      if (mode === 'reset') {
        navigate('/set-password', { state: { phone: fullPhone, otp }, replace: true });
        return;
      }
      const enteredName = name.trim();
      const res = await verifyOtp(fullPhone, otp, enteredName || undefined);
      if (res.success && res.user) {
        dispatch({ type: 'LOGIN', user: res.user });
        // First-time users (who typed their name) pick their
        // delivery area instead of silently defaulting to area-01.
        navigate(enteredName ? '/area' : '/', { replace: true });
      } else {
        setError(bn ? 'ভুল OTP। আবার চেষ্টা করুন' : 'Wrong OTP. Try again');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    await requestOtp(fullPhone);
    setResendSeconds(42);
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';
  const timerText = `০০:${toBnDigits(String(resendSeconds).padStart(2, '0'), lang)}`;

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button" aria-label="Go back"
              onClick={() => (step === 'verify' && !passedPhone ? setStep('phone') : navigate(-1))}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <span className="text-headline-sm font-headline-sm font-black text-on-surface tracking-tight">Jovro</span>
          </div>
          {step === 'phone' ? (
            <button
              type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md"
            >
              বাংলা | EN
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/contact')} className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-semibold">
              <span className="material-symbols-outlined text-[17px]">help_outline</span>
              {bn ? 'সহায়তা / Help' : 'Help'}
            </button>
          )}
        </div>
      </header>

      {step === 'phone' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8">
          <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
            <span>{bn ? 'লালমনিরহাট সদর সেবা অঞ্চল / Lalmonirhat Sadar Service Area' : 'Lalmonirhat Sadar Service Area'}</span>
          </div>

          <h1 className="mt-3 text-headline-md font-headline-md font-bold text-on-surface">
            {bn ? 'মোবাইল নম্বর দিয়ে শুরু করুন' : 'Start with your mobile number'}
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Enter phone number to continue</p>

          <form onSubmit={handleSendOtp} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
                {bn ? 'আপনার নাম / Full Name' : 'Full Name'}{' '}
                <span className="text-outline font-normal">{bn ? 'ঐচ্ছিক / Optional' : '(Optional)'}</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
                <input value={name} onChange={e => setName(e.target.value)} className={clsx(inputCls, 'pl-10')} placeholder={bn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your name (optional)'} />
              </div>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
                {bn ? 'মোবাইল নম্বর / Mobile Number' : 'Mobile Number'} <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                <span className="h-12 px-3 rounded-xl bg-surface-container-low border border-outline-variant/50 flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant shrink-0">
                  <span>🇧🇩</span> +880
                </span>
                <input
                  type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="1XXXXXXXXX" className={inputCls}
                />
              </div>
              {error && <p className="mt-1.5 text-body-sm text-error font-medium">{error}</p>}
              <p className="mt-2 flex items-start gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">lock</span>
                {bn ? 'অর্ডার নিশ্চিত করতে ও ডেলিভারি আপডেট পেতে ওটিপি পাঠানো হবে / OTP will be sent to confirm order' : 'An OTP will be sent to confirm your order and delivery updates'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                <p className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on delivery'}</p>
                <span className="material-symbols-outlined text-primary text-[16px] filled-symbol">verified</span>
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Cash on delivery available</span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed mt-1">
                {bn ? 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো আগাম পেমেন্টের প্রয়োজন নেই।' : 'Check the items in hand, then pay. No advance payment needed.'}
              </p>
            </div>

            <p className="p-3 rounded-xl bg-[#FFF7ED] border border-secondary-container/30 text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              💡 {bn ? 'আমরা গোশালা বাজার থেকে আপনার জন্য তাজা কেনাকাটা করে দেই। পণ্যে কোনো বাড়তি দাম নেই, শুধু নির্ধারিত সাইকেল ডেলিভারি ফি প্রযোজ্য।' : 'We shop fresh for you from Goshala Bazar. No product markup — only the fixed bicycle delivery fee.'}
            </p>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <span>{loading ? (bn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (bn ? 'ওটিপি কোড পাঠান / Continue' : 'Send OTP / Continue')}</span>
              {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </form>

          <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-1.5 text-label-md font-label-md text-primary font-semibold">
            <span className="material-symbols-outlined text-[17px] filled-symbol">chat</span>
            {bn ? 'সাহায্য প্রয়োজন? সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন' : 'Need help? Message us on WhatsApp'}
          </a>
          <p className="mt-3 text-center text-bilingual-sub font-bilingual-sub text-outline">
            {bn ? 'চালিয়ে যাওয়ার মাধ্যমে আপনি Jovro-এর শর্তাবলী মেনে নিচ্ছেন' : 'By continuing you accept Jovro’s terms'} •{' '}
            <Link to="/terms" className="underline">Terms & Privacy</Link>
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            <p className="text-label-md font-label-md font-semibold text-on-surface">
              {bn ? 'নিরাপদ ও দ্রুত যাচাইকরণ (Secure Verification)' : 'Secure Verification'}
            </p>
          </div>

          <h1 className="mt-5 text-headline-md font-headline-md font-bold text-on-surface">
            {bn ? 'OTP যাচাই করুন / Verify OTP' : 'Verify OTP'}
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            {bn ? 'আপনার পরিচয় নিশ্চিত করতে কোডটি লিখুন' : 'Enter the code to confirm your identity'}
          </p>

          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[20px]">sms</span>
            <p className="flex-1 text-body-sm font-body-sm text-on-surface">
              {bn ? `কোড পাঠানো হয়েছে ${fullPhone} নম্বরে` : `Code sent to ${fullPhone}`}
              <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant">Code sent to your Lalmonirhat mobile number • {bn ? 'ডেমো কোড: 1234' : 'Demo code: 1234'}</span>
            </p>
            {!passedPhone && (
              <button type="button" onClick={() => setStep('phone')} aria-label="Edit number" className="w-8 h-8 rounded-full flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            )}
          </div>

          <div className="mt-5">
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-2">
              {bn ? 'যাচাইকরণ কোড (Enter Code)' : 'Verification code'}
            </label>
            <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} />
            {error && <p className="mt-2 text-center text-body-sm text-error font-medium">{error}</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[17px] text-primary">smartphone</span>
              {bn ? 'স্বয়ংক্রিয় এসএমএস রিড সক্ষম / Auto-detecting SMS OTP' : 'Auto-detecting SMS OTP'}
            </p>
          </div>

          <div className="mt-5 text-center space-y-1.5">
            {resendSeconds > 0 ? (
              <p className="flex items-center justify-center gap-1.5 text-body-md font-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                {bn ? `পুনরায় কোড পাঠান ( ${timerText} সেকেন্ড )` : `Resend code in ${resendSeconds}s`}
              </p>
            ) : (
              <p className="text-body-md font-body-md text-on-surface-variant">
                {bn ? 'কোড পাননি? ' : "Didn't get the code? "}
                <button type="button" onClick={handleResend} className="text-primary font-bold">
                  {bn ? 'আবার কোড পাঠান / Resend code' : 'Resend code'}
                </button>
              </p>
            )}
          </div>

          <button
            type="button" onClick={handleVerify} disabled={loading || otp.length < 4}
            className="mt-5 w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? (bn ? 'যাচাই হচ্ছে...' : 'Verifying...') : (bn ? 'যাচাই করুন / Verify' : 'Verify')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>

          <a
            href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer"
            className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30"
          >
            <span className="material-symbols-outlined text-[#25D366] text-[22px] filled-symbol">chat</span>
            <span className="flex-1 text-body-sm font-body-sm text-on-surface leading-snug">
              {bn ? 'এসএমএস না পেলে সরাসরি হোয়াটসঅ্যাপে কোড পেতে এখানে ট্যাপ করুন' : 'No SMS? Tap here to get the code on WhatsApp'}
              <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant">Get code via WhatsApp</span>
            </span>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </a>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-bilingual-sub font-bilingual-sub text-outline text-center">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            {bn ? 'জোভরো লালমনিরহাট সদর সার্ভিস প্ল্যাটফর্ম · ২৪/৭ সাপোর্ট' : 'Jovro Lalmonirhat Sadar service platform · 24/7 support'}
          </p>
        </div>
      )}
    </div>
  );
}
