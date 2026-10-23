import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

// Demo data: invited friends shown until real referral tracking exists.
const INVITED_DEMO = [
  { nameBn: 'সুমাইয়া আক্তার', nameEn: 'Sumaiya Akter', statusBn: 'অর্ডার করেছে', statusEn: 'Ordered' },
  { nameBn: 'তানভীর হাসান', nameEn: 'Tanvir Hasan', statusBn: 'অর্ডার করেছে', statusEn: 'Ordered' },
  { nameBn: 'রুমানা পারভীন', nameEn: 'Rumana Parvin', statusBn: 'যোগ দিয়েছে', statusEn: 'Joined' },
];

export default function ReferScreen() {
  const { state } = useApp();
  const lang = state.lang;
  const [copied, setCopied] = useState(false);

  const code = state.user?.referralCode ?? 'JOVRO';
  const inviteLink = `https://jovro.app/?ref=${code}`;
  const shareText = lang === 'bn'
    ? `জোভ্রো দিয়ে লালমনিরহাট সদরের বাজার ঘরে বসেই করুন! আমার রেফারেল কোড: ${code} — ${inviteLink}`
    : `Order your Lalmonirhat Sadar bazaar from home with Jovro! My referral code: ${code} — ${inviteLink}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for browsers without clipboard permission
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'Facebook', icon: 'share', color: 'bg-[#1877F2]/10 text-[#1877F2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'WhatsApp', icon: 'chat', color: 'bg-[#25D366]/10 text-[#128C4B]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Messenger', icon: 'forum', color: 'bg-[#0084FF]/10 text-[#0084FF]',
      url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(inviteLink)}&redirect_uri=${encodeURIComponent(inviteLink)}`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'রেফার করে আয় করুন' : 'Refer & Earn'}
        subtitle={lang === 'bn' ? 'বন্ধুদের জোভ্রোতে ডাকুন' : 'Invite friends to Jovro'}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        {/* Referral code card (D7) */}
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">group_add</span>
            <p className="text-label-lg font-bold">
              {lang === 'bn' ? 'আপনার রেফারেল কোড' : 'Your referral code'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3 text-headline-sm font-bold tracking-widest text-center">
              {code}
            </div>
            <button
              onClick={copyCode}
              className={clsx(
                'px-4 py-3 rounded-2xl font-medium text-label-lg flex items-center gap-1.5 active:scale-95 transition-transform',
                copied ? 'bg-white text-primary' : 'bg-secondary-container text-white',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}
            </button>
          </div>
          <p className="text-label-sm text-white/80 mt-3">
            {lang === 'bn'
              ? 'বন্ধু এই কোড দিয়ে প্রথম অর্ডার করলেই দুজনেই সুবিধা পাবেন (ডেমো)।'
              : 'When a friend places their first order with this code, you both benefit (demo).'}
          </p>
        </div>

        {/* Share buttons */}
        <div>
          <p className="text-label-lg font-semibold text-on-surface mb-2">
            {lang === 'bn' ? 'শেয়ার করুন' : 'Share via'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {shareLinks.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className={clsx('flex flex-col items-center gap-1.5 py-3.5 rounded-2xl', s.color)}
              >
                <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                <span className="text-label-md font-medium">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Invited friends count */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">groups</span>
              <p className="text-body-md font-semibold text-on-surface">
                {lang === 'bn' ? 'আমন্ত্রিত বন্ধু' : 'Invited friends'}
              </p>
            </div>
            <span className="text-headline-sm font-bold text-primary">{INVITED_DEMO.length}</span>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {INVITED_DEMO.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                </div>
                <span className="flex-1 text-body-md text-on-surface">{lang === 'bn' ? f.nameBn : f.nameEn}</span>
                <span className="text-label-sm bg-success/10 text-success px-2 py-0.5 rounded-full">
                  {lang === 'bn' ? f.statusBn : f.statusEn}
                </span>
              </div>
            ))}
          </div>
          <p className="text-label-sm text-on-surface-variant/70 mt-3">
            {lang === 'bn' ? '* ডেমো তথ্য — আসল রেফারেল ট্র্যাকিং পরে আসবে' : '* Demo data — real referral tracking comes later'}
          </p>
        </Card>

        <Button variant="outline" size="full" icon="content_copy" onClick={copyCode}>
          {lang === 'bn' ? 'লিংকসহ কোড কপি করুন' : 'Copy code again'}
        </Button>
      </div>
    </div>
  );
}
