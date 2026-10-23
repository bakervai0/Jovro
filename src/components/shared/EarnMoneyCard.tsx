import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BottomSheet } from '../ui/BottomSheet';

type ApplyType = 'rider' | 'affiliate';

const APPLIED_KEY: Record<ApplyType, string> = {
  rider: 'jovro_applied_rider',
  affiliate: 'jovro_applied_affiliate',
};

function readApplied(type: ApplyType): boolean {
  try { return localStorage.getItem(APPLIED_KEY[type]) === '1'; } catch { return false; }
}

/**
 * D21 — Earn Money card: "জোভ্রোর সাথে আয় করুন / Earn Money with Jovro".
 * Rider / Affiliate buttons open a simple placeholder application form
 * (name, mobile, email). After applying, the spec's pending-approval
 * state is shown. Used in Profile (above the footer) and at the
 * bottom of Home.
 */
export function EarnMoneyCard() {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [sheetType, setSheetType] = useState<ApplyType | null>(null);
  const [applied, setApplied] = useState<Record<ApplyType, boolean>>({
    rider: readApplied('rider'),
    affiliate: readApplied('affiliate'),
  });
  const [justApplied, setJustApplied] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const openForm = (type: ApplyType) => {
    setSheetType(type);
    setJustApplied(false);
    setName(''); setMobile(''); setEmail('');
  };

  const submit = () => {
    if (!sheetType || !name.trim() || !mobile.trim()) return;
    try { localStorage.setItem(APPLIED_KEY[sheetType], '1'); } catch { /* noop */ }
    setApplied(prev => ({ ...prev, [sheetType]: true }));
    setJustApplied(true);
  };

  const options: { type: ApplyType; icon: string; labelBn: string; labelEn: string; subBn: string; subEn: string }[] = [
    { type: 'rider', icon: 'directions_bike', labelBn: 'রাইডার হিসেবে যোগ দিন', labelEn: 'Join as a Rider', subBn: 'ডেলিভারি করে আয় করুন', subEn: 'Earn by delivering' },
    { type: 'affiliate', icon: 'handshake', labelBn: 'অ্যাফিলিয়েট হিসেবে যোগ দিন', labelEn: 'Join as an Affiliate', subBn: 'গ্রাহক এনে কমিশন নিন', subEn: 'Earn commission on referrals' },
  ];

  return (
    <>
      <div className="mx-4 rounded-3xl bg-gradient-to-r from-secondary-container to-secondary-container/75 p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-[24px]">payments</span>
          <p className="text-title-md font-bold text-white">
            {bn ? 'জোভ্রোর সাথে আয় করুন' : 'Earn Money with Jovro'}
          </p>
        </div>
        <p className="text-label-md text-white/85 mt-1">
          {bn ? 'সময় আছে? ডেলিভারি করুন। পরিচিত আছে? গ্রাহক আনুন।' : 'Have time? Deliver. Know people? Bring customers.'}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {options.map(o => (
            <button
              key={o.type}
              onClick={() => openForm(o.type)}
              className="bg-white rounded-2xl p-3 text-left active:scale-[0.97] transition-transform"
            >
              <span className="material-symbols-outlined text-secondary text-[26px]">{o.icon}</span>
              <p className="text-label-lg font-bold text-on-surface leading-tight mt-1">
                {bn ? o.labelBn : o.labelEn}
              </p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                {applied[o.type]
                  ? (bn ? '✓ আবেদন করা হয়েছে' : '✓ Applied')
                  : (bn ? o.subBn : o.subEn)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Application form / applied state */}
      <BottomSheet
        open={sheetType !== null}
        onClose={() => setSheetType(null)}
        title={justApplied
          ? (bn ? 'আবেদন জমা হয়েছে' : 'Application submitted')
          : sheetType === 'rider'
            ? (bn ? 'রাইডার আবেদন' : 'Rider Application')
            : (bn ? 'অ্যাফিলিয়েট আবেদন' : 'Affiliate Application')}
      >
        {justApplied ? (
          <div className="px-5 pb-8 pt-2 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-success text-[36px]">check_circle</span>
            </div>
            <p className="text-body-md text-on-surface leading-relaxed">
              {bn
                ? 'আবেদন পেয়েছি — অ্যাডমিন অনুমোদন করলেই আপনার সেকশন চালু হবে'
                : 'Application received — your section activates when the admin approves'}
            </p>
            <Button variant="primary" size="full" onClick={() => setSheetType(null)}>
              {bn ? 'ঠিক আছে' : 'Got it'}
            </Button>
          </div>
        ) : (
          <div className="px-5 pb-8 pt-1 flex flex-col gap-3">
            <Input
              label={bn ? 'আপনার নাম' : 'Your name'}
              placeholder={bn ? 'নাম লিখুন' : 'Write your name'}
              value={name}
              onChange={e => setName(e.target.value)}
              icon="person"
            />
            <Input
              label={bn ? 'মোবাইল নম্বর' : 'Mobile number'}
              placeholder="01XXXXXXXXX"
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              icon="call"
            />
            <Input
              label={bn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon="mail"
            />
            <Button
              variant="primary"
              size="full"
              icon="send"
              disabled={!name.trim() || !mobile.trim()}
              onClick={submit}
              className="mt-1"
            >
              {bn ? 'আবেদন পাঠান' : 'Submit Application'}
            </Button>
            <p className={clsx('text-label-sm text-on-surface-variant text-center')}>
              {bn ? 'আবেদনের পর অ্যাডমিন যাচাই করে অনুমোদন দেবেন।' : 'The admin reviews and approves applications.'}
            </p>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
