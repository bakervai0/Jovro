import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { resetPassword } from '../../services/auth';

// ── Stitch 6a · Reset Password ────────────────────────────────
// Brand header, lock-reset hero, SMS explainer, mobile field
// with the Sadar chip, secure-code line, operator contact card
// and back-to-login link. Flow unchanged (→ /otp, mode reset).

export default function ForgotPasswordScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const full = phone.startsWith('0') || phone.startsWith('+') ? phone : `0${phone}`;
    if (full.replace(/\D/g, '').length < 11) { setError(bn ? 'সঠিক নম্বর দিন' : 'Enter valid phone'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(full);
      navigate('/otp', { state: { phone: full, mode: 'reset' } });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-primary text-[24px]">pedal_bike</span>
            <span className="text-headline-sm font-headline-sm font-black text-on-surface tracking-tight">Jovro</span>
          </div>
          <button
            type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
            className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md"
          >
            বাংলা | EN
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-[#FFF7ED] border border-secondary-container/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[38px]">lock_reset</span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary border-2 border-surface-container-lowest flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">local_shipping</span>
            </span>
          </div>
          <h1 className="mt-4 text-headline-md font-headline-md font-bold text-on-surface">
            {bn ? 'পাসওয়ার্ড রিসেট' : 'Reset password'}
          </h1>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Reset password</p>
        </div>

        <div className="mt-5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">sms</span>
          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            {bn
              ? 'আপনার অ্যাকাউন্টে নিবন্ধিত মোবাইল নম্বর দিন। আমরা পাসওয়ার্ড রিসেট করার জন্য একটি ওটিপি (OTP) পাঠাব।'
              : 'Enter your registered mobile number to receive a verification OTP'}
            <span className="block text-bilingual-sub font-bilingual-sub mt-0.5">Enter your registered mobile number to receive a verification OTP</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'মোবাইল নম্বর (Mobile number)' : 'Mobile number'}
            </label>
            <div className="flex gap-2">
              <span className="h-12 px-3 rounded-xl bg-surface-container-low border border-outline-variant/50 flex items-center font-label-lg text-label-lg text-on-surface-variant shrink-0">+880</span>
              <div className="relative flex-1">
                <input
                  type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="1XXXXXXXXX" className={inputCls}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  {bn ? 'লালমনিরহাট সদর' : 'Sadar'}
                  <span className="material-symbols-outlined text-[12px]">expand_more</span>
                </span>
              </div>
            </div>
            {error && <p className="mt-1.5 text-body-sm text-error font-medium">{error}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-body-sm font-body-sm text-primary font-medium">
              <span className="material-symbols-outlined text-[16px] filled-symbol">check_circle</span>
              <span className="material-symbols-outlined text-[16px]">security</span>
              {bn ? 'এসএমএসের মাধ্যমে নিরাপদ কোড পাঠানো হবে' : 'A secure code will be sent by SMS'}
            </p>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? (bn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (bn ? 'OTP পাঠান / Send OTP' : 'Send OTP')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-5 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">contact_support</span>
            <div className="flex-1">
              <p className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'নম্বর মনে নেই?' : 'Forgot your number?'}</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                {bn ? 'সরাসরি আমাদের স্থানীয় অপারেটরের সাথে যোগাযোগ করুন' : 'Contact our local operator directly'}
                <span className="block text-bilingual-sub font-bilingual-sub">Forgot number? Contact Jovro operator</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a href={OPERATOR.phoneTel} className={clsx('flex items-center justify-center gap-1.5 h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold active:scale-95 transition-transform')}>
              <span className="material-symbols-outlined text-[17px]">call</span>
              {bn ? 'কল করুন' : 'Call'}
            </a>
            <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 h-10 rounded-full bg-[#E8F5E9] text-primary border border-primary/30 font-label-md text-label-md font-bold active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[17px] filled-symbol">chat</span>
              {bn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}
            </a>
          </div>
        </div>

        <Link to="/login" className="mt-5 flex items-center justify-center gap-1.5 text-label-lg font-label-lg text-primary font-bold">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {bn ? 'লগইনে ফিরে যান / Back to Login' : 'Back to Login'}
        </Link>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-bilingual-sub font-bilingual-sub text-outline text-center">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          {bn ? 'জোভ্রো লোকাল ডেলিভারি সার্ভিস · লালমনিরহাট' : 'Jovro local delivery service · Lalmonirhat'}
        </p>
      </div>
    </div>
  );
}
