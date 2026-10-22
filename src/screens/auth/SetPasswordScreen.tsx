import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { setNewPassword } from '../../services/auth';

export default function SetPasswordScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = state.lang;

  const phone = (location.state as any)?.phone ?? '';
  const otp = (location.state as any)?.otp ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (password.length < 6) errs.password = lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters';
    if (password !== confirm) errs.confirm = lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const res = await setNewPassword(phone, otp, password);
      if (res.success) setDone(true);
      else setErrors({ password: lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed. Try again' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center bg-surface">
        <div className="w-24 h-24 rounded-full bg-success/12 flex items-center justify-center">
          <span className="material-symbols-outlined text-success text-[44px]">check_circle</span>
        </div>
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">
            {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন হয়েছে!' : 'Password changed!'}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            {lang === 'bn' ? 'নতুন পাসওয়ার্ড দিয়ে লগইন করুন' : 'Log in with your new password'}
          </p>
        </div>
        <Button size="full" onClick={() => navigate('/login', { replace: true })}>
          {lang === 'bn' ? 'লগইন করুন' : 'Log in'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <TopAppBar showBack title={lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New password'} />

      <div className="flex-1 flex flex-col px-6 pt-10 gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New password'}
            type="password"
            placeholder={lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon="lock"
            error={errors.password}
          />
          <Input
            label={lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm password'}
            type="password"
            placeholder={lang === 'bn' ? 'পাসওয়ার্ড আবার দিন' : 'Re-enter password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            icon="lock_reset"
            error={errors.confirm}
          />
          <Button type="submit" size="full" loading={loading}>
            {lang === 'bn' ? 'পাসওয়ার্ড সেট করুন' : 'Set password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
