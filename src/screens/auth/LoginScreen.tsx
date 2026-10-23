import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { OPERATOR } from '../../data/infoContent';
import { loginWithPhone } from '../../services/auth';

// ── Stitch 4 · Login ──────────────────────────────────────────
// Brand header, mobile + password (with visibility toggle),
// forgot link, OTP + Google alternatives, zero-markup trust
// card and the create-account link. Auth flow unchanged
// (loginWithPhone → role-based redirect).

export default function LoginScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleNote, setGoogleNote] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { setError(bn ? 'সব ঘর পূরণ করুন' : 'Fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await loginWithPhone(phone, password);
      if (res.success && res.user) {
        dispatch({ type: 'LOGIN', user: res.user });
        const routes: Record<string, string> = {
          customer: '/', rider: '/rider', affiliate: '/affiliate', staff: '/staff', admin: '/admin',
        };
        navigate(routes[res.user.role] ?? '/', { replace: true });
      } else {
        setError(bn ? 'নম্বর বা পাসওয়ার্ড ভুল হয়েছে' : 'Invalid number or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header (Stitch 4) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px] filled-symbol">pedal_bike</span>
            </span>
            <span className="text-headline-sm font-headline-sm font-black text-on-surface tracking-tight">Jovro</span>
          </div>
          <button
            type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[15px]">language</span>
            বাংলা | EN
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8">
        <span className="inline-flex px-2.5 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
          {bn ? 'লালমনিরহাট সদর সার্ভিস' : 'Lalmonirhat Sadar Service'}
        </span>
        <h1 className="mt-3 text-headline-md font-headline-md font-bold text-on-surface">
          {bn ? 'লগইন করুন / Welcome back' : 'Welcome back / লগইন করুন'}
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          {bn ? 'আপনার ফোন নম্বর এবং পাসওয়ার্ড দিয়ে লগইন করুন' : 'Log in with your phone number and password'}
        </p>

        <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'মোবাইল নম্বর (Mobile number)' : 'Mobile number'}
            </label>
            <div className="flex gap-2">
              <span className="h-12 px-3 rounded-xl bg-surface-container-low border border-outline-variant/50 flex items-center font-label-lg text-label-lg text-on-surface-variant shrink-0">+880</span>
              <input
                type="tel" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="1XXXXXXXXX" className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'পাসওয়ার্ড (Password)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={clsx(inputCls, 'pr-11')}
              />
              <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {error && <p className="mt-1.5 text-body-sm text-error font-medium">{error}</p>}
          </div>

          <div className="flex justify-end -mt-1">
            <Link to="/forgot-password" className="text-label-md text-primary font-semibold">
              {bn ? 'পাসওয়ার্ড ভুলে গেছেন? / Forgot password?' : 'Forgot password?'}
            </Link>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? (bn ? 'লগইন হচ্ছে...' : 'Logging in...') : (bn ? 'লগইন / Log in' : 'Log in')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-outline-variant/50" />
          <span className="text-label-sm text-on-surface-variant font-semibold">{bn ? 'অথবা / OR' : 'OR'}</span>
          <div className="flex-1 border-t border-outline-variant/50" />
        </div>

        <div className="space-y-2.5">
          <button
            type="button" onClick={() => navigate('/otp-login')}
            className="w-full h-12 rounded-full border-[1.5px] border-primary text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">sms</span>
            <span>{bn ? 'OTP দিয়ে লগইন Login with OTP' : 'Login with OTP'}</span>
          </button>
          <button
            type="button" onClick={() => setGoogleNote(true)}
            className="w-full h-12 rounded-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <span className="font-black text-[18px] text-[#4285F4]">G</span>
            <span>{bn ? 'Google লগইন With Google' : 'Continue with Google'}</span>
          </button>
          {googleNote && (
            <p className="text-center text-body-sm text-on-surface-variant">
              {bn ? 'Google লগইন শীঘ্রই আসছে — আপাতত মোবাইল নম্বর বা OTP ব্যবহার করুন।' : 'Google login is coming soon — please use your mobile number or OTP for now.'}
            </p>
          )}
        </div>

        {/* Trust card */}
        <div className="mt-5 p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">verified_user</span>
          <div>
            <p className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? '১০০% নিরাপদ ও অতিরিক্ত চার্জমুক্ত (Zero Markup)' : '100% safe, zero markup'}</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed mt-0.5">
              {bn ? 'বাজারের আসল দামে সরাসরি ডেলিভারি। কোন গোপন বা অতিরিক্ত ফি নেই।' : 'Direct delivery at real bazaar prices. No hidden or extra fees.'}
            </p>
          </div>
        </div>

        {/* Create account */}
        <div className="mt-4 text-center">
          <p className="text-body-md font-body-md text-on-surface-variant">{bn ? 'নতুন এখানে?' : 'New here?'}</p>
          <Link to="/signup" className="mt-1 inline-block text-label-lg font-label-lg text-primary font-bold">
            {bn ? 'অ্যাকাউন্ট খুলুন / New here? Create an account' : 'Create an account'}
          </Link>
        </div>

        <a href={OPERATOR.phoneTel} className="mt-5 flex items-center justify-center gap-1.5 text-label-md font-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          <span>{bn ? 'লগইনে সমস্যা হচ্ছে? কল বা WhatsApp করুন' : 'Trouble logging in? Call or WhatsApp'} {bn ? OPERATOR.phoneDisplayBn : OPERATOR.phoneDisplayEn}</span>
        </a>

        {/* Demo role switcher (demo build control) */}
        <div className="mt-6">
          <DemoRoleSwitcher />
        </div>
      </div>
    </div>
  );
}
