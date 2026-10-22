import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { loginWithPhone } from '../../services/auth';

export default function LoginScreen() {
  const { state, dispatch, t } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { setError(t('auth.fillAll')); return; }
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
        setError(t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {/* Hero */}
      <div className="bg-primary px-6 pt-16 pb-10 flex flex-col gap-2">
        <div className="w-14 h-14 rounded-[18px] bg-white flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-primary text-[32px] filled-symbol">local_shipping</span>
        </div>
        <h1 className="text-headline-lg font-black text-white">
          {lang === 'bn' ? 'আবার স্বাগতম!' : 'Welcome back!'}
        </h1>
        <p className="text-body-lg text-white/80">
          {lang === 'bn' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'Log in to your account'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-5 overflow-y-auto no-scrollbar">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label={lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number'}
            type="tel"
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            icon="phone"
          />
          <Input
            label={lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            type="password"
            placeholder={lang === 'bn' ? 'পাসওয়ার্ড দিন' : 'Enter password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon="lock"
            error={error}
          />

          <div className="flex justify-end -mt-1">
            <Link to="/forgot-password" className="text-label-md text-primary font-medium">
              {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
            </Link>
          </div>

          <Button type="submit" size="full" loading={loading}>
            {lang === 'bn' ? 'লগইন করুন' : 'Log in'}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-body-md text-on-surface-variant">
          {lang === 'bn' ? 'অ্যাকাউন্ট নেই? ' : "Don't have an account? "}
          <Link to="/signup" className="text-primary font-semibold">
            {lang === 'bn' ? 'নিবন্ধন করুন' : 'Sign up'}
          </Link>
        </p>

        {/* OTP login */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-outline-variant/50" />
          <span className="text-label-sm text-on-surface-variant">{lang === 'bn' ? 'অথবা' : 'or'}</span>
          <div className="flex-1 border-t border-outline-variant/50" />
        </div>

        <Button variant="outline" size="full" icon="sms" onClick={() => navigate('/otp-login')}>
          {lang === 'bn' ? 'OTP দিয়ে লগইন করুন' : 'Login with OTP'}
        </Button>

        {/* Demo switcher */}
        <div className="mt-2">
          <DemoRoleSwitcher />
        </div>
      </div>
    </div>
  );
}
