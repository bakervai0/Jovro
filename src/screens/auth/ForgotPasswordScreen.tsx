import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { resetPassword } from '../../services/auth';

export default function ForgotPasswordScreen() {
  const { state, t } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) { setError(lang === 'bn' ? 'সঠিক নম্বর দিন' : 'Enter valid phone'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(phone);
      navigate('/otp', { state: { phone, mode: 'reset' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <TopAppBar showBack title={lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset password'} />

      <div className="flex-1 flex flex-col items-center px-6 pt-10 gap-8">
        <div className="w-24 h-24 rounded-full bg-warning/12 flex items-center justify-center">
          <span className="material-symbols-outlined text-warning text-[44px]">lock_reset</span>
        </div>

        <div className="text-center">
          <h2 className="text-headline-md font-bold text-on-surface">
            {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            {lang === 'bn'
              ? 'আপনার মোবাইল নম্বর দিন, আমরা OTP পাঠাবো'
              : 'Enter your phone number to receive an OTP'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input
            label={lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile number'}
            type="tel"
            inputMode="numeric"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            icon="phone"
            error={error}
          />
          <Button type="submit" size="full" loading={loading}>
            {lang === 'bn' ? 'OTP পাঠান' : 'Send OTP'}
          </Button>
        </form>
      </div>
    </div>
  );
}
