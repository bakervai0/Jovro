import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { setNewPassword } from '../../services/auth';

// ── Stitch 6b · Set New Password ──────────────────────────────
// Verified chip + step indicator, OTP-verified pill, two
// password fields with live requirements checklist, support
// strip and the design's success state. Flow unchanged
// (setNewPassword → success → log in).

export default function SetPasswordScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const bn = state.lang === 'bn';

  const phone = (location.state as any)?.phone ?? '';
  const otp = (location.state as any)?.otp ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const reqs = [
    { ok: password.length >= 6, bn: 'কমপক্ষে ৬ অক্ষর (Min 6 chars)', en: 'Min 6 characters' },
    { ok: /\d/.test(password), bn: 'অন্তত একটি সংখ্যা (Min 1 number)', en: 'At least one number' },
    { ok: confirm.length > 0 && password === confirm, bn: 'উভয় পাসওয়ার্ড মিল (Match)', en: 'Both passwords match' },
  ];
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (password.length < 6) errs.password = bn ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters';
    if (password !== confirm) errs.confirm = bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const res = await setNewPassword(phone, otp, password);
      if (res.success) setDone(true);
      else setErrors({ password: bn ? 'ব্যর্থ হয়েছে' : 'Failed. Try again' });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  const header = (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <span className="text-headline-sm font-headline-sm font-black text-on-surface tracking-tight">Jovro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
            <span className="material-symbols-outlined text-[13px] filled-symbol">verified_user</span>
            {bn ? 'নিরাপদ ভেরিফায়েড' : 'Secure verified'}
          </span>
          <span className="text-label-sm font-label-sm text-outline font-semibold">{bn ? 'ধাপ ২/২' : 'Step 2/2'}</span>
        </div>
      </div>
    </header>
  );

  if (done) {
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-margin text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[48px] filled-symbol">check_circle</span>
          </div>
          <div>
            <h2 className="text-headline-md font-headline-md font-bold text-on-surface">
              {bn ? 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!' : 'Password saved successfully!'}
            </h2>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">Password updated successfully</p>
            <p className="text-body-md font-body-md text-on-surface-variant mt-2">
              {bn ? 'নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' : 'Log in with your new password.'}
            </p>
          </div>
          <button
            type="button" onClick={() => navigate('/login', { replace: true })}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <span>{bn ? 'লগইন করুন (Log in)' : 'Log in'}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {header}
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
          <span className="material-symbols-outlined text-[14px] filled-symbol">check_circle</span>
          {bn ? 'ওটিপি যাচাই সম্পন্ন (OTP Verified)' : 'OTP Verified'}
        </span>

        <div className="mt-3 flex items-start gap-3">
          <span className="w-11 h-11 rounded-xl bg-[#FFF7ED] border border-secondary-container/30 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">lock_reset</span>
          </span>
          <div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface leading-tight">
              {bn ? 'নতুন পাসওয়ার্ড দিন' : 'Set a new password'}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Set a new password</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              {bn ? 'আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড তৈরি করুন' : 'Create a strong new password for your account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'নতুন পাসওয়ার্ড (New Password)' : 'New Password'}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">key</span>
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={clsx(inputCls, 'pl-10 pr-11')}
              />
              <button type="button" aria-label="Toggle visibility" onClick={() => setShowPw(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <p className="mt-1 text-body-sm text-error font-medium">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">
              {bn ? 'আবার নতুন পাসওয়ার্ড দিন (Confirm Password)' : 'Confirm Password'}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">password</span>
              <input
                type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className={clsx(inputCls, 'pl-10 pr-11')}
              />
              <button type="button" aria-label="Toggle visibility" onClick={() => setShowConfirm(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[20px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {mismatch && (
              <p className="mt-1.5 flex items-center gap-1 text-error text-body-sm font-medium">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                {bn ? 'পাসওয়ার্ড দুটি মিলছে না (Passwords do not match)' : 'Passwords do not match'}
              </p>
            )}
            {errors.confirm && !mismatch && <p className="mt-1 text-body-sm text-error font-medium">{errors.confirm}</p>}
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <p className="text-label-md font-label-md font-bold text-on-surface mb-2">{bn ? 'পাসওয়ার্ড শর্তাবলী (Requirements):' : 'Password requirements:'}</p>
            <div className="space-y-1.5">
              {reqs.map(r => (
                <p key={r.bn} className={clsx('flex items-center gap-2 text-body-sm font-body-sm', r.ok ? 'text-primary font-semibold' : 'text-on-surface-variant')}>
                  <span className="material-symbols-outlined text-[18px]">{r.ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                  {bn ? r.bn : r.en}
                </p>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-snug">
              <span className="font-semibold text-on-surface">{bn ? 'লালমনিরহাট সদর কাস্টমার সাপোর্ট' : 'Lalmonirhat Sadar support'}</span>
              {' — '}{bn ? 'যেকোনো সমস্যায় সরাসরি সাহায্য পেতে কল বা মেসেজ করুন' : 'Call or message for direct help'} ({bn ? OPERATOR.phoneDisplayBn.replace(' (নমুনা)', '') : OPERATOR.phoneDisplayEn.replace(' (sample)', '')})
            </p>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{loading ? (bn ? 'সেভ হচ্ছে...' : 'Saving...') : (bn ? 'পাসওয়ার্ড সেভ করুন / Save & log in' : 'Save password')}</span>
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
          <p className="flex items-start justify-center gap-1.5 text-center text-bilingual-sub font-bilingual-sub text-outline">
            <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">info</span>
            {bn ? 'পাসওয়ার্ড সংরক্ষণ করার পর নতুন পাসওয়ার্ড দিয়ে লগইন করুন' : 'After saving, log in with your new password'}
          </p>
        </form>
      </div>
    </div>
  );
}
