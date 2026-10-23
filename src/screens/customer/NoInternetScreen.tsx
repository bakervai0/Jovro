import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * No-internet state (checklist B). The demo app runs entirely on the
 * local mock layer, so browsing still works offline — this screen
 * explains what is saved and lets the customer retry the connection.
 */
export default function NoInternetScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine !== false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const retry = () => {
    setChecking(true);
    window.setTimeout(() => {
      const next = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
      setOnline(next);
      setChecking(false);
      if (next) navigate('/');
    }, 700);
  };

  const saved = [
    {
      icon: 'shopping_basket',
      bn: 'আপনার কার্ট ও পছন্দের তালিকা সেভ আছে',
      en: 'Your cart and favourites are saved',
    },
    {
      icon: 'receipt_long',
      bn: 'আগের অর্ডার ও ট্র্যাকিং দেখা যাবে',
      en: 'Past orders and tracking stay readable',
    },
    {
      icon: 'add_location_alt',
      bn: 'সেভ করা ঠিকানাগুলো কাজ করবে',
      en: 'Saved addresses still work',
    },
  ];

  return (
    <div className="screen-scroll bg-surface">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-outline-variant/50 bg-surface/95 px-4 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          aria-label={bn ? 'ফিরে যান' : 'Back'}
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-on-surface active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[23px]">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16.5px] font-bold leading-tight text-on-surface">
            {bn ? 'ইন্টারনেট নেই' : 'No internet'}
          </h1>
          <p className="truncate text-[11.5px] leading-tight text-on-surface-variant">
            {bn ? 'No internet connection' : 'ইন্টারনেট নেই'}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-40 pt-5">
        <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-7 text-center shadow-card">
          <div className="relative mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-secondary-soft">
            <span className="material-symbols-outlined text-[46px] text-secondary">wifi_off</span>
            <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[17px] text-secondary">priority_high</span>
            </span>
          </div>
          <h2 className="text-[19px] font-bold leading-snug text-on-surface">
            {bn ? 'সংযোগ পাওয়া যাচ্ছে না' : 'We can’t reach the network'}
          </h2>
          <p className="mx-auto mt-2 max-w-[290px] text-[13px] leading-relaxed text-on-surface-variant">
            {bn
              ? 'মোবাইল ডাটা বা ওয়াই-ফাই চালু করে আবার চেষ্টা করুন। অর্ডার পাঠানো হলে ইন্টারনেট ফিরলেই আমরা তা নিয়ে কাজ শুরু করব।'
              : 'Turn on mobile data or Wi-Fi and try again. If you placed an order, we start on it as soon as you are back online.'}
          </p>

          <button
            onClick={retry}
            disabled={checking}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-bold text-white shadow-fab active:scale-[0.98] disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[19px] ${checking ? 'animate-spin' : ''}`}>
              {checking ? 'progress_activity' : 'refresh'}
            </span>
            {checking
              ? (bn ? 'চেষ্টা চলছে…' : 'Checking…')
              : (bn ? 'আবার চেষ্টা করুন' : 'Try again')}
          </button>

          <button
            onClick={() => navigate('/')}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-full border border-outline-variant text-[13.5px] font-semibold text-on-surface active:scale-[0.98]"
          >
            {bn ? 'সেভ করা তথ্য দেখুন' : 'Browse saved content'}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-on-surface-variant">
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-primary' : 'bg-secondary'}`} />
            {online ? (bn ? 'সংযোগ এখন আছে' : 'Connection is back') : (bn ? 'অফলাইন মোড' : 'Offline mode')}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
          <p className="border-b border-outline-variant/30 px-4 py-2.5 text-[12px] font-bold text-on-surface">
            {bn ? 'ইন্টারনেট ছাড়াও যা করতে পারবেন' : 'What still works offline'}
          </p>
          <ul className="divide-y divide-outline-variant/20">
            {saved.map(item => (
              <li key={item.icon} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </span>
                <p className="text-[12.5px] leading-relaxed text-on-surface">{bn ? item.bn : item.en}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary-tint p-3.5">
          <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">cloud_sync</span>
          <p className="text-[11.5px] leading-relaxed text-primary-deep">
            {bn
              ? 'ইন্টারনেট ফিরলে সেভ করা অর্ডার, ঠিকানা ও কার্ট স্বয়ংক্রিয়ভাবে সিঙ্ক হবে — আপনাকে কিছু করতে হবে না।'
              : 'When the connection returns, saved orders, addresses and your cart sync automatically — nothing to do.'}
          </p>
        </section>
      </div>
    </div>
  );
}
