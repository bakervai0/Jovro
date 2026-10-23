import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { fmtTk } from '../../services/orderUtils';

// ── Stitch 1 · Splash ─────────────────────────────────────────
// Location pill, logo + wordmark, three promise rows and the
// "Get Started" button. Routing behaviour is unchanged: signed-in
// users go to their role home, guests continue to /lang; the
// button advances immediately, the timer after ~2s.

export default function SplashScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [entering, setEntering] = useState(false);

  const go = React.useCallback(() => {
    if (state.isLoggedIn) {
      const routes: Record<string, string> = {
        customer: '/',
        rider: '/rider',
        affiliate: '/affiliate',
        staff: '/staff',
        admin: '/admin',
      };
      navigate(routes[state.role] ?? '/', { replace: true });
    } else {
      navigate('/lang', { replace: true });
    }
  }, [state.isLoggedIn, state.role, navigate]);

  useEffect(() => {
    const timer = setTimeout(go, 2200);
    return () => clearTimeout(timer);
  }, [go]);

  const enter = () => {
    setEntering(true);
    setTimeout(go, 450);
  };

  const minFee = state.areas.length ? Math.min(...state.areas.map(a => a.fee)) : 20;

  const features = [
    { icon: 'storefront', bn: 'গোশালা বাজার থেকে তাজা পণ্য', en: 'Fresh from Goshala Bazar & local vendors' },
    { icon: 'price_check', bn: 'বাজারের আসল দাম, শুধু ডেলিভারি ফি', en: `Zero product markup (fixed fee from ${fmtTk(minFee, 'en')})` },
    { icon: 'pedal_bike', bn: 'পরিবেশবান্ধব বাইসাইকেল ডেলিভারি', en: 'Eco-friendly neighborhood bicycle dispatch' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center px-margin pt-10 pb-8 w-full">
        {/* Location pill */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-md text-label-md font-semibold">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'} <span className="text-primary/50">·</span>
          <span className="font-bilingual-sub text-bilingual-sub">{bn ? 'Lalmonirhat Sadar' : 'লালমনিরহাট সদর'}</span>
        </span>

        {/* Logo + wordmark */}
        <div className="mt-8 flex flex-col items-center animate-fadeIn">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-512.png`}
            alt="Jovro"
            className="w-28 h-28 rounded-[28px] shadow-lg"
          />
          <h1 className="mt-4 text-[44px] font-black text-on-surface leading-none tracking-tight">Jovro</h1>
          <p className="text-headline-sm font-headline-sm text-secondary font-bold mt-1">{bn ? 'জভ্রো' : 'জোভ্রো'}</p>
          <p className="mt-3 text-center">
            <span className="block text-headline-sm font-headline-sm text-on-surface font-bold">{bn ? 'বাজার আর খাবার, ঘরে বসেই' : 'Groceries & food, delivered to your door'}</span>
            <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">Groceries & food, delivered to your door</span>
          </p>
        </div>

        {/* Promise rows */}
        <div className="w-full mt-8 space-y-2.5">
          {features.map(f => (
            <div key={f.icon} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-label-lg font-label-lg text-on-surface font-semibold leading-snug">{bn ? f.bn : f.en}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">{bn ? f.en : f.bn}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button" onClick={enter}
          className={clsx(
            'mt-8 w-full h-14 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all',
            entering ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary',
          )}
        >
          {entering ? (
            <>
              <span className="material-symbols-outlined text-[20px] filled-symbol">check_circle</span>
              <span>{bn ? 'স্বাগতম!' : 'Welcome!'}</span>
            </>
          ) : (
            <>
              <span>{bn ? 'অ্যাপে প্রবেশ করুন | Get Started' : 'Get Started'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>

        {/* Footer status */}
        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <span className="inline-flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {bn ? 'সার্ভার সংযুক্ত · সার্ভিসের জন্য প্রস্তুত' : 'Server connected · Ready to serve'}
          </span>
          <span className="text-bilingual-sub font-bilingual-sub text-outline">v1.2.0 · Lalmonirhat District</span>
        </div>
      </div>
    </div>
  );
}
