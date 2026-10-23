import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits } from '../../services/orderUtils';

// Demo data: invited friends shown until real referral tracking exists.
const INVITED_DEMO = [
  { nameBn: 'সুমাইয়া আক্তার', nameEn: 'Sumaiya Akter', statusBn: 'অর্ডার করেছে', statusEn: 'Ordered' },
  { nameBn: 'তানভীর হাসান', nameEn: 'Tanvir Hasan', statusBn: 'অর্ডার করেছে', statusEn: 'Ordered' },
  { nameBn: 'রুমানা পারভীন', nameEn: 'Rumana Parvin', statusBn: 'যোগ দিয়েছে', statusEn: 'Joined' },
];

// Demo usage split for the coupon tiles (design 27 shows
// earned / used / remaining): 1 coupon treated as used.
const COUPONS_USED_DEMO = 1;

export default function ReferScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [copied, setCopied] = useState(false);

  const code = state.user?.referralCode ?? 'JOVRO';
  const inviteLink = `https://jovro.app/?ref=${code}`;
  const shareText = bn
    ? `জোভ্রো দিয়ে লালমনিরহাট সদরের বাজার ঘরে বসেই করুন! আমার রেফারেল কোড: ${code} — ${inviteLink}`
    : `Order your Lalmonirhat Sadar bazaar from home with Jovro! My referral code: ${code} — ${inviteLink}`;

  const orderedCount = INVITED_DEMO.filter(f => f.statusEn === 'Ordered').length;
  const couponsEarned = orderedCount * 2;
  const couponsUsed = Math.min(COUPONS_USED_DEMO, couponsEarned);
  const couponsLeft = couponsEarned - couponsUsed;
  const savings = couponsEarned * 40;

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

  const steps = [
    {
      titleBn: 'কোড পাঠান', titleEn: 'Send the code',
      textBn: 'আপনার ইউনিক রেফারেল কোড বা লিংক বন্ধু বা প্রতিবেশীকে মেসেজ করুন।',
      textEn: 'Message your unique referral code or link to a friend or neighbour.',
    },
    {
      titleBn: 'বন্ধু অর্ডার করবেন', titleEn: 'Your friend orders',
      textBn: 'আপনার কোড ব্যবহার করে জোভ্রো অ্যাপে প্রথম বাজার বা খাবারে পাবেন ফ্রি ডেলিভারি।',
      textEn: 'Using your code, their first bazaar or food order gets free delivery.',
    },
    {
      titleBn: 'আপনি পুরস্কার পাবেন', titleEn: 'You get the reward',
      textBn: 'ডেলিভারি সফল হলেই আপনার অ্যাকাউন্টে যোগ হবে ২টি ফ্রি সাইকেল ডেলিভারি কুপন।',
      textEn: 'Once the delivery succeeds, 2 free cycle-delivery coupons land in your account.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
      {/* Header (Stitch 27) */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/30 shadow-sm flex items-center justify-between px-4 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-headline-sm font-headline-sm text-on-surface leading-tight">{bn ? 'রেফার ও পুরস্কার' : 'Refer & Earn'}</h1>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Refer &amp; Earn Jovro</span>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="px-2 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 text-bilingual-sub font-bilingual-sub text-primary flex items-center gap-1 active:scale-95 transition-all"
        >
          <span className={bn ? 'font-bold' : 'text-on-surface-variant'}>বাংলা</span>
          <span className="text-outline">|</span>
          <span className={!bn ? 'font-bold' : 'text-on-surface-variant'}>EN</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-24 space-y-5">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/10 via-surface-container-lowest to-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-fixed/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex flex-col items-center text-center relative">
            <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2 border border-outline-variant/20 bg-gradient-to-br from-primary-fixed/40 via-surface-container-low to-secondary-fixed/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary/40 text-[64px]">redeem</span>
              <div className="absolute top-2 left-2 bg-secondary-container text-on-secondary-container text-label-sm font-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">redeem</span>
                <span>{bn ? 'ডেলিভারি গিফট' : 'Delivery gift'}</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-surface-container-lowest/90 backdrop-blur-sm border border-primary/20 text-primary font-label-md px-2 py-0.5 rounded-full text-label-sm">
                <span>{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
              </div>
            </div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight mt-1">
              {bn ? 'বন্ধু বা প্রতিবেশীকে জোভ্রো জানান,' : 'Tell a friend or neighbour about Jovro,'}{' '}
              <span className="text-primary font-bold">{bn ? 'দুজনই পান ফ্রি ডেলিভারি!' : 'you both get free delivery!'}</span>
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 leading-relaxed">
              {bn ? (
                <>আপনার রেফারেল কোড দিয়ে বন্ধু প্রথম অর্ডার সম্পন্ন করলেই তিনি পাবেন ফ্রি ডেলিভারি, এবং আপনার অ্যাকাউন্টে যোগ হবে <span className="font-bold text-on-surface">২টি ফ্রি ডেলিভারি কুপন</span>।</>
              ) : (
                'When a friend completes their first order with your referral code, they get free delivery and 2 free delivery coupons are added to your account.'
              )}
            </p>
          </div>
        </section>

        {/* Code + quick share */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[18px]">token</span>
              {bn ? 'আপনার ইউনিক রেফারেল কোড' : 'Your unique referral code'}
            </span>
            <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {bn ? 'সক্রিয়' : 'Active'}
            </span>
          </div>
          <div className="bg-surface-container-low/70 border-2 border-dashed border-primary/50 rounded-xl p-4 flex flex-col items-center justify-between gap-3 relative">
            <div className="text-center">
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'ট্যাপ করে বন্ধুদের শেয়ার করুন' : 'Tap to share with friends'}</span>
              <span className="text-headline-md font-headline-md tracking-wider text-primary font-mono select-all">{code}</span>
            </div>
            <button
              onClick={copyCode}
              className={clsx(
                'w-full h-11 px-4 rounded-full text-label-md font-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all',
                copied ? 'bg-surface-container-lowest text-primary border border-primary' : 'bg-primary text-on-primary',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? (bn ? 'কপি হয়েছে!' : 'Copied!') : bn ? 'কোড কপি করুন' : 'Copy code'}</span>
            </button>
          </div>
          <div className="space-y-2 pt-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant block mb-1">{bn ? 'সরাসরি শেয়ার অপশন (Quick Share)' : 'Quick share options'}</span>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full h-12 rounded-full bg-[#25D366] text-white font-label-lg text-label-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>{bn ? 'হোয়াটসঅ্যাপে শেয়ার করুন' : 'Share on WhatsApp'}</span>
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(inviteLink)}&redirect_uri=${encodeURIComponent(inviteLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-colors"
                >
                  <span className="material-symbols-outlined text-tertiary text-[18px]">forum</span>
                  <span>{bn ? 'মেসেঞ্জার' : 'Messenger'}</span>
                </a>
                <a
                  href={`sms:?&body=${encodeURIComponent(shareText)}`}
                  className="h-11 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 active:scale-95 transition-colors"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">share</span>
                  <span>{bn ? 'অন্যান্য / SMS' : 'Other / SMS'}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <h3 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[22px]">route</span>
              {bn ? '৩টি সহজ ধাপে উপহার' : 'A gift in 3 easy steps'}
            </h3>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">How it works</span>
          </div>
          <div className="space-y-4 relative">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-label-md flex-shrink-0 z-10">
                  {toBnDigits(i + 1, lang)}
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="text-label-lg font-label-lg text-on-surface">{bn ? s.titleBn : s.titleEn}</h4>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">{bn ? s.textBn : s.textEn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'আপনার অর্জিত পরিসংখ্যান' : 'Your earned stats'}</h3>
            </div>
            <span className="text-label-sm font-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{bn ? 'লাইভ আপডেট' : 'Live update'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-surface-container-low rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-tight">{bn ? 'সফল রেফারেল' : 'Successful referrals'}</span>
              <div className="my-1">
                <span className="text-headline-md font-headline-md text-primary font-bold">{toBnDigits(INVITED_DEMO.length, lang)}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant ml-0.5">{bn ? 'জন' : ''}</span>
              </div>
              <span className="text-[10px] text-outline">{bn ? 'বন্ধু যুক্ত' : 'friends joined'}</span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-2.5 text-center flex flex-col justify-between border border-primary/20">
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-tight">{bn ? 'ফ্রি ডেলিভারি' : 'Free deliveries'}</span>
              <div className="my-1">
                <span className="text-headline-md font-headline-md text-primary font-bold">{toBnDigits(couponsEarned, lang)}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant ml-0.5">{bn ? 'টি' : ''}</span>
              </div>
              <div className="text-[9px] leading-none flex flex-col gap-0.5">
                <span className="text-secondary font-semibold">{bn ? `বাকি: ${toBnDigits(couponsLeft, lang)}টি` : `Left: ${couponsLeft}`}</span>
                <span className="text-outline">{bn ? `ব্যবহৃত: ${toBnDigits(couponsUsed, lang)}টি` : `Used: ${couponsUsed}`}</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-tight">{bn ? 'মোট সাশ্রয়' : 'Total saved'}</span>
              <div className="my-1">
                <span className="text-headline-md font-headline-md text-on-surface font-bold">{fmtTk(savings, lang)}</span>
              </div>
              <span className="text-[10px] text-primary font-medium">{bn ? 'কুপন সাশ্রয়' : 'coupon savings'}</span>
            </div>
          </div>
          {couponsLeft > 0 && (
            <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">local_activity</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md text-on-secondary-container">
                    {bn ? `${toBnDigits(couponsLeft, lang)}টি ফ্রি ডেলিভারি প্রস্তুত আছে` : `${couponsLeft} free deliveries ready`}
                  </span>
                  <span className="text-bilingual-sub font-bilingual-sub text-[#C2410C]">{bn ? 'পরবর্তী অর্ডারে স্বয়ংক্রিয়ভাবে ডিসকাউন্ট পাবেন' : 'Auto-applied on your next order'}</span>
                </div>
              </div>
              <button onClick={() => navigate('/bazaar')} className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm active:scale-95 shrink-0">
                {bn ? 'বাজার করুন' : 'Shop now'}
              </button>
            </div>
          )}
        </section>

        {/* Invited friends (kept from earlier build — not in design 27) */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">groups</span>
              <p className="text-body-md font-semibold text-on-surface">{bn ? 'আমন্ত্রিত বন্ধু' : 'Invited friends'}</p>
            </div>
            <span className="text-headline-sm font-bold text-primary">{toBnDigits(INVITED_DEMO.length, lang)}</span>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {INVITED_DEMO.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                </div>
                <span className="flex-1 text-body-md text-on-surface">{bn ? f.nameBn : f.nameEn}</span>
                <span className="text-label-sm bg-success/10 text-success px-2 py-0.5 rounded-full">{bn ? f.statusBn : f.statusEn}</span>
              </div>
            ))}
          </div>
          <p className="text-label-sm text-on-surface-variant/70 mt-3">
            {bn ? '* ডেমো তথ্য — আসল রেফারেল ট্র্যাকিং পরে আসবে' : '* Demo data — real referral tracking comes later'}
          </p>
        </section>

        {/* Terms note */}
        <section className="py-1 px-2 text-center">
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant/80 leading-relaxed">
            <span className="material-symbols-outlined text-[14px] align-text-bottom mr-0.5">info</span>
            {bn
              ? 'কুপনের মেয়াদ ৬০ দিন। লালমনিরহাট সদর উপজেলার (কালীবাড়ী, মিশন মোড়, তিস্তা রোড ইত্যাদি) যেকোনো এলাকার ডেলিভারি অর্ডারে প্রযোজ্য।'
              : 'Coupons are valid for 60 days, for delivery orders anywhere in Lalmonirhat Sadar Upazila.'}
          </p>
        </section>
      </div>

      {/* WhatsApp FAB (design 27) */}
      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact WhatsApp Support"
        className="absolute bottom-5 right-4 z-40 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[28px]">chat</span>
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />
      </a>
    </div>
  );
}
