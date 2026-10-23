import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Global no-internet banner. The app is fully local (mock data), so
 * going offline never blocks browsing — the banner simply tells the
 * customer that new orders will sync once the connection returns.
 */
export function OfflineBanner() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-[60] flex items-center gap-2 bg-[#3A2C12] px-3 py-2 text-white">
      <span className="material-symbols-outlined text-[17px] text-amber-300">wifi_off</span>
      <p className="flex-1 text-[11px] leading-snug">
        {bn ? 'ইন্টারনেট নেই — দেখা যাচ্ছে সেভ করা তথ্য। নতুন অর্ডার অনলাইনে এলে পাঠানো হবে।' : 'No internet — showing saved data. New orders will sync when you are back online.'}
      </p>
    </div>
  );
}
