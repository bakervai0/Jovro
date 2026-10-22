import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { signUp } from '../../services/auth';

export default function SignUpScreen() {
  const { state, dispatch, t } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = lang === 'bn' ? 'নাম দিন' : 'Name required';
    if (phone.length < 11) e.phone = lang === 'bn' ? 'সঠিক নম্বর দিন' : 'Enter valid phone';
    if (password.length < 6) e.password = lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters';
    if (password !== confirm) e.confirm = lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signUp(name.trim(), phone, password);
      if (res.success && res.user) {
        dispatch({ type: 'LOGIN', user: res.user });
        navigate('/area', { replace: true });
      } else {
        setErrors({ phone: t('auth.signupFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'নিবন্ধন করুন' : 'Create account'}
      />

      <div className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto no-scrollbar">
        {/* Welcome */}
        <div className="flex items-center gap-3 p-4 rounded-3xl bg-primary/8">
          <span className="material-symbols-outlined text-primary text-[32px]">waving_hand</span>
          <div>
            <p className="text-label-lg font-semibold text-on-surface">
              {lang === 'bn' ? 'Jovro-তে স্বাগতম!' : 'Welcome to Jovro!'}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {lang === 'bn' ? 'একটি অ্যাকাউন্ট তৈরি করুন' : 'Create your account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <Input
            label={lang === 'bn' ? 'পুরো নাম' : 'Full name'}
            type="text"
            placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your name'}
            value={name}
            onChange={e => setName(e.target.value)}
            icon="person"
            error={errors.name}
          />
          <Input
            label={lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number'}
            type="tel"
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            icon="phone"
            error={errors.phone}
          />
          <Input
            label={lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
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

          <p className="text-label-sm text-on-surface-variant">
            {lang === 'bn'
              ? 'নিবন্ধন করলে আপনি আমাদের '
              : 'By signing up you agree to our '}
            <Link to="/terms" className="text-primary font-medium">
              {lang === 'bn' ? 'শর্তাবলী' : 'Terms of Service'}
            </Link>
            {lang === 'bn' ? ' এবং ' : ' and '}
            <Link to="/privacy" className="text-primary font-medium">
              {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </Link>
            {lang === 'bn' ? '-তে সম্মতি দিচ্ছেন।' : '.'}
          </p>

          <Button type="submit" size="full" loading={loading}>
            {lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-body-md text-on-surface-variant">
          {lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already have an account? '}
          <Link to="/login" className="text-primary font-semibold">
            {lang === 'bn' ? 'লগইন করুন' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
