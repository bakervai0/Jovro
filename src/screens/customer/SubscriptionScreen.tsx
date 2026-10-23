import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

// Sample monthly pass (D8) — clearly labelled sample, no online payment.
const PASS = {
  nameBn: 'মাসিক ডেলিভারি পাস',
  nameEn: 'Monthly Delivery Pass',
  price: 1000,
  totalDeliveries: 30,
};
// Demo usage shown in the active state (D9) until real pass data exists.
const DEMO_USED = 18;

export default function SubscriptionScreen() {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';

  const hasPass = !!state.user?.hasActivePass;
  const [previewActive, setPreviewActive] = useState(false);
  const [interested, setInterested] = useState(false);
  const [paused, setPaused] = useState(false);
  const [renewed, setRenewed] = useState(false);

  const showActive = hasPass || previewActive;
  const used = DEMO_USED;
  const left = PASS.totalDeliveries - used;
  const pct = Math.round((used / PASS.totalDeliveries) * 100);

  const now = new Date();
  const validTill = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const validTillStr = validTill.toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={bn ? 'আমার সাবস্ক্রিপশন' : 'My Subscription'}
        subtitle={bn ? 'মাসিক ডেলিভারি পাস' : 'Monthly delivery pass'}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        {showActive ? (
          <>
            {/* ── D9: Active pass state ── */}
            <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px]">card_membership</span>
                  <p className="text-label-lg font-bold">{bn ? PASS.nameBn : PASS.nameEn}</p>
                </div>
                <span className={clsx(
                  'text-label-sm px-2.5 py-1 rounded-full font-semibold',
                  paused ? 'bg-white/25 text-white' : 'bg-secondary-container text-white',
                )}>
                  {paused ? (bn ? 'বিরতি দেওয়া' : 'Paused') : (bn ? 'সক্রিয়' : 'Active')}
                </span>
              </div>
              <p className="text-headline-md font-bold mt-3">
                {bn ? `এই মাসে বাকি ডেলিভারি: ${left}টি` : `Deliveries left this month: ${left}`}
              </p>
              {/* Progress: used vs total */}
              <div className="mt-3">
                <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-container rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-label-sm text-white/85 mt-1.5">
                  <span>{bn ? `ব্যবহৃত: ${used}টি` : `Used: ${used}`}</span>
                  <span>{bn ? `মোট: ${PASS.totalDeliveries}টি` : `Total: ${PASS.totalDeliveries}`}</span>
                </div>
              </div>
              <p className="text-label-md text-white/85 mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                {bn ? `মেয়াদ: ${validTillStr} পর্যন্ত` : `Valid till: ${validTillStr}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="full"
                icon={paused ? 'play_arrow' : 'pause_circle'}
                onClick={() => setPaused(v => !v)}
              >
                {paused ? (bn ? 'আবার চালু করুন' : 'Resume') : (bn ? 'বিরতি দিন' : 'Pause')}
              </Button>
              <Button
                variant="primary"
                size="full"
                icon="autorenew"
                onClick={() => setRenewed(true)}
              >
                {bn ? 'নবায়ন করুন' : 'Renew'}
              </Button>
            </div>
            {renewed && (
              <p className="text-label-md text-success flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {bn ? 'নবায়নের আগ্রহ নেওয়া হয়েছে (ডেমো — কোনো পেমেন্ট হয়নি)।' : 'Renewal interest noted (demo — no payment taken).'}
              </p>
            )}
            <p className="text-label-sm text-on-surface-variant/70">
              {bn ? '* ডেমো তথ্য — পাসের আসল হিসাব পরে যুক্ত হবে' : '* Demo data — real pass accounting comes later'}
            </p>
          </>
        ) : (
          <>
            {/* ── D8: Sample plan card ── */}
            <Card elevated padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">card_membership</span>
                  </div>
                  <div>
                    <p className="text-title-md font-bold text-on-surface">{bn ? PASS.nameBn : PASS.nameEn}</p>
                    <p className="text-label-sm text-on-surface-variant">{bn ? 'নিয়মিত ক্রেতাদের জন্য' : 'For regular shoppers'}</p>
                  </div>
                </div>
                <span className="text-label-sm bg-secondary-container/15 text-secondary px-2.5 py-1 rounded-full font-semibold">
                  {bn ? 'নমুনা প্ল্যান' : 'Sample plan'}
                </span>
              </div>

              <p className="mt-4">
                <span className="text-headline-lg font-bold text-primary">৳{PASS.price}</span>
                <span className="text-body-md text-on-surface-variant"> / {bn ? 'মাস' : 'month'}</span>
              </p>

              <div className="flex flex-col gap-2 mt-3">
                {[
                  { bn: `মাসে ${PASS.totalDeliveries}টি ডেলিভারি অন্তর্ভুক্ত`, en: `${PASS.totalDeliveries} deliveries included per month` },
                  { bn: 'অন্তর্ভুক্ত ডেলিভারিতে আলাদা ফি নেই', en: 'No separate fee on included deliveries' },
                  { bn: 'যেকোনো সময় বিরতি দেওয়া যাবে', en: 'Pause anytime' },
                ].map((f, i) => (
                  <p key={i} className="flex items-center gap-2 text-body-md text-on-surface">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    {bn ? f.bn : f.en}
                  </p>
                ))}
              </div>

              {interested ? (
                <div className="mt-4 bg-success/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                  <p className="text-body-md text-success font-medium">
                    {bn ? 'আগ্রহ নেওয়া হয়েছে! পাস চালু হলে আমরা ফোনে জানিয়ে দেবো।' : 'Interest noted! We will call you when the pass launches.'}
                  </p>
                </div>
              ) : (
                <Button variant="primary" size="full" className="mt-4" icon="favorite" onClick={() => setInterested(true)}>
                  {bn ? 'আমি আগ্রহী' : "I'm interested"}
                </Button>
              )}
              <p className="text-label-sm text-on-surface-variant/70 mt-3 text-center">
                {bn ? 'এখন অনলাইন পেমেন্ট নেই — আগ্রহ জানালেই হবে।' : 'No online payment now — just register your interest.'}
              </p>
            </Card>

            {/* Demo preview of the active state (D9) */}
            <button
              onClick={() => setPreviewActive(true)}
              className="text-label-md text-primary font-medium py-1 flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              {bn ? 'ডেমো: সক্রিয় পাসের অবস্থা দেখুন' : 'Demo: preview the active-pass state'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
