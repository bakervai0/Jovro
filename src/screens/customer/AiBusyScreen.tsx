import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';

/** D4 — AI busy fallback: calm state with keep-browsing actions. */
export function AiBusyView() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-tertiary text-[40px]">smart_toy</span>
      </div>
      <h2 className="text-headline-sm font-semibold text-on-surface">
        {lang === 'bn'
          ? 'সহায়ক একটু ব্যস্ত আছে — কিছুক্ষণ পর আবার চেষ্টা করুন'
          : 'The assistant is a bit busy — please try again in a little while'}
      </h2>
      <p className="text-body-md text-on-surface-variant">
        {lang === 'bn'
          ? 'ততক্ষণে বাজার আর রেস্টুরেন্ট ঘুরে দেখুন — অর্ডার করা যাবে ঠিকঠাক।'
          : 'Meanwhile, keep browsing the bazaar and restaurants — ordering works as usual.'}
      </p>
      <div className="flex flex-col gap-2 w-full mt-2">
        <Button variant="primary" size="full" icon="storefront" onClick={() => navigate('/bazaar')}>
          {lang === 'bn' ? 'বাজার দেখুন' : 'Browse Bazaar'}
        </Button>
        <Button variant="outline" size="full" icon="restaurant" onClick={() => navigate('/food')}>
          {lang === 'bn' ? 'রেস্টুরেন্ট দেখুন' : 'Browse Restaurants'}
        </Button>
        <Button variant="ghost" size="full" onClick={() => navigate('/ai')}>
          {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
        </Button>
      </div>
    </div>
  );
}

export default function AiBusyScreen() {
  const { state } = useApp();
  const lang = state.lang;
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar showBack title={lang === 'bn' ? 'সহায়ক' : 'Assistant'} />
      <AiBusyView />
    </div>
  );
}
