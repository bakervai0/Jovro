import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';

export default function ChangePasswordScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    if (current.length < 4) return setError(bn ? 'বর্তমান পাসওয়ার্ড দিন' : 'Enter your current password');
    if (next.length < 6) return setError(bn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'New password must be 6+ characters');
    if (next !== confirm) return setError(bn ? 'দুটি পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
    setError('');
    setDone(true);
    setTimeout(() => navigate(-1), 900);
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <div>
      <label className="text-[11px] font-medium text-on-surface-variant">{label}</label>
      <div className="mt-1 flex items-center rounded-xl border border-outline-variant bg-surface-container-low px-3">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">lock</span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => { onChange(e.target.value); setError(''); }}
          placeholder={placeholder}
          className="h-10 flex-1 bg-transparent px-2 text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
        <button onClick={() => setShow(v => !v)} className="text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">{show ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader showBack title={bn ? 'পাসওয়ার্ড বদলান' : 'Change password'} subtitle={bn ? 'নিরাপত্তার জন্য শক্ত পাসওয়ার্ড দিন' : 'Use a strong password'} />

      <div className="flex flex-col gap-3 px-4 pb-32 pt-4">
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <div className="flex flex-col gap-3">
            {field(bn ? 'বর্তমান পাসওয়ার্ড' : 'Current password', current, setCurrent, '••••••')}
            {field(bn ? 'নতুন পাসওয়ার্ড' : 'New password', next, setNext, bn ? 'নতুন পাসওয়ার্ড' : 'New password')}
            {field(bn ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm new password', confirm, setConfirm, bn ? 'আবার লিখুন' : 'Repeat password')}

            {error && (
              <p className={clsx('flex items-center gap-1 text-[11px] font-medium text-error')}>
                <span className="material-symbols-outlined text-[14px]">error</span>{error}
              </p>
            )}
            {done && (
              <p className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {bn ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container p-3">
          <p className="text-[11px] font-semibold text-on-surface">{bn ? 'পাসওয়ার্ড টিপস' : 'Password tips'}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10.5px] leading-relaxed text-on-surface-variant">
            <li>{bn ? 'কমপক্ষে ৬ অক্ষর, সংখ্যা ও অক্ষর মিশিয়ে দিন।' : 'At least 6 characters, mix letters and numbers.'}</li>
            <li>{bn ? 'অন্য কোথাও ব্যবহৃত পাসওয়ার্ড দেবেন না।' : 'Do not reuse a password from another site.'}</li>
            <li>{bn ? 'পাসওয়ার্ড কাউকে জানাবেন না — Jovro কখনো ফোনে পাসওয়ার্ড চায় না।' : 'Never share it — Jovro will never ask over the phone.'}</li>
          </ul>
        </div>

        <button onClick={submit} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white">
          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
          {bn ? 'পাসওয়ার্ড আপডেট করুন' : 'Update password'}
        </button>
      </div>
    </div>
  );
}
