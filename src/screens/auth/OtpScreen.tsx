import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { OtpInput } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { requestOtp, verifyOtp } from '../../services/auth';

export default function OtpScreen() {
  const { state, dispatch, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = state.lang;

  // phone can be passed from previous screen
  const phone = (location.state as any)?.phone ?? '';
  const mode: 'login' | 'reset' = (location.state as any)?.mode ?? 'login';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const handleVerify = async () => {
    if (otp.length < 4) { setError(lang === 'bn' ? 'OTP দিন' : 'Enter OTP'); return; }
    setLoading(true);
    setError('');
    try {
      if (mode === 'reset') {
        navigate('/set-password', { state: { phone, otp }, replace: true });
        return;
      }
      const res = await verifyOtp(phone, otp);
      if (res.success && res.user) {
        dispatch({ type: 'LOGIN', user: res.user });
        navigate('/', { replace: true });
      } else {
        setError(lang === 'bn' ? 'ভুল OTP। আবার চেষ্টা করুন' : 'Wrong OTP. Try again');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    await requestOtp(phone);
    setResendSeconds(60);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <TopAppBar showBack title={lang === 'bn' ? 'OTP যাচাই করুন' : 'Verify OTP'} />

      <div className="flex-1 flex flex-col items-center px-6 pt-10 gap-8">
        {/* Illustration */}
        <div className="w-24 h-24 rounded-full bg-primary/12 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[44px]">sms</span>
        </div>

        {/* Info */}
        <div className="text-center">
          <h2 className="text-headline-md font-bold text-on-surface">
            {lang === 'bn' ? 'OTP কোড পাঠানো হয়েছে' : 'OTP code sent'}
          </h2>
          {phone && (
            <p className="text-body-md text-on-surface-variant mt-1">
              {lang === 'bn' ? `${phone} নম্বরে` : `To ${phone}`}
            </p>
          )}
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-[11.5px] font-semibold text-primary-deep">
            <span className="material-symbols-outlined text-[14px]">info</span>
            {lang === 'bn' ? '(ডেমো কোড / Demo code: 1234)' : '(Demo code: 1234)'}
          </p>
        </div>

        {/* OTP input */}
        <div className="w-full flex flex-col gap-4">
          <OtpInput value={otp} onChange={setOtp} />
          {error && (
            <p className="text-center text-label-md text-error">{error}</p>
          )}
        </div>

        {/* Verify button */}
        <Button
          size="full"
          onClick={handleVerify}
          loading={loading}
          disabled={otp.length < 4}
        >
          {lang === 'bn' ? 'যাচাই করুন' : 'Verify'}
        </Button>

        {/* Resend */}
        <p className="text-body-md text-on-surface-variant text-center">
          {lang === 'bn' ? 'কোড পাননি? ' : "Didn't receive? "}
          {resendSeconds > 0 ? (
            <span className="text-primary font-medium">
              {lang === 'bn' ? `${resendSeconds}s পরে রিসেন্ড করুন` : `Resend in ${resendSeconds}s`}
            </span>
          ) : (
            <button onClick={handleResend} className="text-primary font-semibold">
              {lang === 'bn' ? 'পুনরায় পাঠান' : 'Resend OTP'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
