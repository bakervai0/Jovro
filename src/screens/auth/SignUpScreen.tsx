import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { signUp } from '../../services/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  signUp as supabaseSignUp, profileToUser,
} from '../../lib/auth';

// ── Stitch 3 (sign up) · Create Account ───────────────────────
// Brand header, name / mobile (+880) / password / confirm with
// visibility toggles and match state, OTP note, Google option
// and the COD footer strip. Sign-up flow unchanged.

export default function SignUpScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // backend mode only
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleNote, setGoogleNote] = useState(false);

  const matched = confirm.length > 0 && password === confirm;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = bn ? 'নাম দিন' : 'Name required';
    if (phone.replace(/\D/g, '').length < 10) e.phone = bn ? 'সঠিক নম্বর দিন' : 'Enter valid phone';
    if (isSupabaseConfigured && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = bn ? 'সঠিক ইমেইল দিন' : 'Enter a valid email';
    }
    if (password.length < 6) e.password = bn ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters';
    if (password !== confirm) e.confirm = bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fullPhone = phone.startsWith('0') || phone.startsWith('+') ? phone : `0${phone}`;
      if (isSupabaseConfigured) {
        // Backend mode: Supabase Auth sign-up (email + password).
        // The DB trigger creates the profile as 'customer'; the
        // rider/staff/admin roles are granted afterwards (see
        // supabase/SETUP.md — Phase 3).
        const res = await supabaseSignUp({
          email: email.trim(), password,
          name: name.trim(), nameBn: name.trim(), mobile: fullPhone,
        });
        if (res.data?.profile) {
          dispatch({ type: 'LOGIN', user: profileToUser(res.data.profile) });
          navigate('/area', { replace: true });
        } else if (res.data) {
          // Account created but no session yet (email
          // confirmation pending) — send them to log in.
          setErrors({ phone: bn ? 'অ্যাকাউন্ট তৈরি হয়েছে — ইমেইল যাচাই করে লগইন করুন' : 'Account created — verify your email, then log in' });
          navigate('/login', { replace: true });
        } else {
          setErrors({ email: res.error?.message ?? (bn ? 'নিবন্ধন ব্যর্থ হয়েছে, আবার চেষ্টা করুন' : 'Sign up failed, try again') });
        }
        return;
      }
      const res = await signUp(name.trim(), fullPhone, password);
      if (res.success && res.user) {
        dispatch({ type: 'LOGIN', user: res.user });
        navigate('/area', { replace: true });
      } else {
        setErrors({ phone: bn ? 'নিবন্ধন ব্যর্থ হয়েছে, আবার চেষ্টা করুন' : 'Sign up failed, try again' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';
  const errText = (k: string) => errors[k] ? <p className="mt-1 text-body-sm text-error font-medium">{errors[k]}</p> : null;

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header (Stitch 3 sign-up) */}
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
        <h1 className="text-headline-md font-headline-md font-bold text-on-surface">
          {bn ? 'অ্যাকাউন্ট খুলুন / Create your account' : 'Create your account'}
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          {bn ? 'লালমনিরহাট সদরে দ্রুততম হোম ডেলিভারি পেতে তথ্য দিন' : 'Enter your details for the fastest home delivery in Lalmonirhat Sadar'}
        </p>

        <form onSubmit={handleSignUp} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'আপনার নাম / Full Name' : 'Full Name'} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
              <input value={name} onChange={e => setName(e.target.value)} className={clsx(inputCls, 'pl-10')} placeholder={bn ? 'আপনার নাম লিখুন' : 'Enter your name'} />
            </div>
            {errText('name')}
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
            {errText('phone')}
          </div>

          {/* Email — backend mode only (Supabase Auth identity).
              Same field styling as the rest of the form. */}
          {isSupabaseConfigured && (
            <div>
              <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
                {bn ? 'ইমেইল / Email' : 'Email'} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                <input
                  type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className={clsx(inputCls, 'pl-10')}
                />
              </div>
              {errText('email')}
            </div>
          )}

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'পাসওয়ার্ড / Password' : 'Password'} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={clsx(inputCls, 'pl-10 pr-11')}
              />
              <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errText('password')}
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'আবার পাসওয়ার্ড দিন / Confirm Password' : 'Confirm Password'} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className={clsx('material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]', matched ? 'text-primary' : 'text-outline')}>
                {matched ? 'check_circle' : 'lock'}
              </span>
              <input
                type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className={clsx(inputCls, 'pl-10 pr-11')}
              />
              <button type="button" aria-label="Toggle confirm visibility" onClick={() => setShowConfirm(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {matched && (
              <p className="mt-1 flex items-center gap-1 text-primary text-label-md font-label-md font-semibold">
                <span className="material-symbols-outlined text-[15px] filled-symbol">check_circle</span>
                {bn ? 'পাসওয়ার্ড মিলেছে' : 'Passwords match'}
              </p>
            )}
            {errText('confirm')}
          </div>

          <p className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-body-sm font-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">sms</span>
            {bn ? 'অ্যাকাউন্ট খুললে আপনার মোবাইল নম্বরে একটি OTP কোড পাঠানো হবে' : 'An OTP code will be sent to your mobile when you create the account'}
          </p>

          <p className="text-label-sm text-on-surface-variant">
            {bn ? 'নিবন্ধন করলে আপনি আমাদের ' : 'By signing up you agree to our '}
            <Link to="/terms" className="text-primary font-medium">{bn ? 'শর্তাবলী' : 'Terms of Service'}</Link>
            {bn ? ' এবং ' : ' and '}
            <Link to="/privacy" className="text-primary font-medium">{bn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Link>
            {bn ? '-তে সম্মতি দিচ্ছেন।' : '.'}
          </p>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? (bn ? 'তৈরি হচ্ছে...' : 'Creating...') : (bn ? 'অ্যাকাউন্ট খুলুন / Sign up' : 'Sign up')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-outline-variant/50" />
          <span className="text-label-sm text-on-surface-variant font-semibold">{bn ? 'অথবা / or' : 'or'}</span>
          <div className="flex-1 border-t border-outline-variant/50" />
        </div>

        <button
          type="button" onClick={() => setGoogleNote(true)}
          className="w-full h-12 rounded-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
        >
          <span className="font-black text-[18px] text-[#4285F4]">G</span>
          <span>{bn ? 'Google দিয়ে চালিয়ে যান / Continue with Google' : 'Continue with Google'}</span>
        </button>
        {googleNote && (
          <p className="mt-2 text-center text-body-sm text-on-surface-variant">
            {bn ? 'Google সাইন-আপ শীঘ্রই আসছে — আপাতত মোবাইল নম্বর দিয়ে খুলুন।' : 'Google sign-up is coming soon — please use your mobile number for now.'}
          </p>
        )}

        <p className="mt-5 text-center text-body-md text-on-surface-variant">
          {bn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already have an account? '}
          <Link to="/login" className="text-primary font-bold">{bn ? 'লগইন করুন / Log in' : 'Log in'}</Link>
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 text-label-md font-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
          <span className="font-semibold text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on delivery available'}</span>
          <span className="text-bilingual-sub font-bilingual-sub">Cash on delivery available in Lalmonirhat Sadar</span>
        </div>
      </div>
    </div>
  );
}
