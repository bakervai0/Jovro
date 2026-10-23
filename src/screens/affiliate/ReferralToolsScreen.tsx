import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { useCurrentAffiliate } from '../../components/shared/AffiliateBits';
import { REFERRALS_SEED } from '../../data/seed';
import { fmtTk, toBnDigits } from '../../services/orderUtils';

/**
 * I4 — Referral tools, aligned to Stitch af1.4: share hero,
 * dashed code card, link card, brand share tiles, ready-made
 * message card and "how it works" steps. The referred customers
 * + orders lists (I5 data) stay below. Copy/share behaviour is
 * unchanged.
 */
export default function ReferralToolsScreen() {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const affiliate = useCurrentAffiliate();
  const [copied, setCopied] = useState<'code' | 'link' | 'msg' | null>(null);

  const code = affiliate?.referralCode ?? 'JV-0000';
  const link = `https://jovro.app/?ref=${code}`;
  const shareText = bn
    ? `জোভরো দিয়ে লালমনিরহাট সদরে বাজার আর খাবার অর্ডার করুন! আমার লিংক ব্যবহার করুন: ${link}`
    : `Order groceries and food in Lalmonirhat Sadar with Jovro! Use my link: ${link}`;
  const readyMessage = bn
    ? `"লালমনিরহাট সদরের সবচেয়ে সেরা বাজার ও রেস্টুরেন্ট ডেলিভারি Jovro! কোনো পণ্যে বাড়তি দাম নেই, শুধু মাত্র অল্প ডেলিভারি চার্জ। আমার রেফারেল কোড ${code} দিয়ে সাইন আপ করুন অথবা এই লিংকে ক্লিক করুন: ${link}"`
    : `"Jovro is Lalmonirhat Sadar's best bazaar & restaurant delivery — no product markup, just a small delivery charge. Sign up with my referral code ${code} or click this link: ${link}"`;

  const referredOrders = useMemo(
    () => REFERRALS_SEED.filter(r => r.affiliateId === affiliate?.id),
    [affiliate?.id],
  );
  const referredCustomers = useMemo(() => {
    const map = new Map<string, { name: string; mobile: string; orders: number; commission: number }>();
    for (const r of referredOrders) {
      const cur = map.get(r.customerMobile) ?? { name: r.customerName, mobile: r.customerMobile, orders: 0, commission: 0 };
      cur.orders += 1;
      cur.commission += r.commission;
      map.set(r.customerMobile, cur);
    }
    return [...map.values()];
  }, [referredOrders]);

  const copy = async (kind: 'code' | 'link' | 'msg', value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard unavailable in demo */ }
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const shares = [
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      cls: 'bg-[#1877F2]',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      cls: 'bg-[#25D366]',
      path: 'M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z',
    },
    {
      name: 'Messenger',
      href: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=0&redirect_uri=${encodeURIComponent(link)}`,
      cls: 'bg-[#0084FF]',
      path: 'M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.303 2.249.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z',
    },
  ];

  const steps = [
    {
      n: '১', highlight: false,
      titleBn: 'বন্ধুকে লিংক বা কোড দিন', titleEn: 'Give your friend the link or code',
      bodyBn: 'আপনার ফেসবুক, মেসেঞ্জার বা হোয়াটসঅ্যাপে পরিচিতদের রেফারেল কোড পাঠান।',
      bodyEn: 'Send your referral code to people you know on Facebook, Messenger or WhatsApp.',
    },
    {
      n: '২', highlight: false,
      titleBn: 'বন্ধু সাইন আপ করে গোশালা বাজার বা রেস্টুরেন্ট থেকে অর্ডার করবেন', titleEn: 'Your friend signs up and orders',
      bodyBn: 'কাস্টমার প্রথমবারের মতো লালমনিরহাট শহরের যে কোনো আইটেম অর্ডার করবেন।',
      bodyEn: 'The customer orders any item in Lalmonirhat town for the first time.',
    },
    {
      n: '৩', highlight: true,
      titleBn: `অর্ডার ডেলিভারি হলেই প্রতি অর্ডারে ${fmtTk(affiliate?.commissionRate ?? 20, lang)} কমিশন আপনার একাউন্টে যোগ হবে!`,
      titleEn: `You earn ${fmtTk(affiliate?.commissionRate ?? 20, lang)} per delivered order!`,
      bodyBn: 'সরাসরি আপনার Jovro অ্যাফিলিয়েট ব্যালেন্সে যুক্ত হবে যা সহজেই বিকাশ বা নগদে ক্যাশআউট করা যায়।',
      bodyEn: 'It lands directly in your Jovro affiliate balance, cashable via bKash or Nagad.',
    },
  ];

  return (
    <PageFrame>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-fixed/20 via-surface-container-lowest to-surface-container-low rounded-xl p-4 border border-outline-variant/30 relative overflow-hidden mt-4">
        <div className="flex items-start gap-3 relative z-10">
          <span className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
          </span>
          <div>
            <h1 className="text-headline-sm font-headline-sm text-on-surface font-bold">
              {bn ? 'আপনার কোড শেয়ার করুন' : 'Share your code'}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-primary font-semibold tracking-wide mt-0.5">Share Your Referral Code</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 leading-relaxed">
              {bn ? 'নতুন কাস্টমার আপনার কোডে প্রথম অর্ডার ডেলিভারি পেলেই আপনি কমিশন পাবেন।' : 'You earn commission as soon as a new customer’s first order is delivered with your code.'}
            </p>
          </div>
        </div>
      </section>

      {/* Code card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{bn ? 'রেফারেল কোড (Referral Code)' : 'Referral Code'}</span>
          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-primary font-bold px-2 py-0.5 rounded-full bg-primary-fixed/30 border border-primary/20">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            {bn ? 'সক্রিয়' : 'Active'}
          </span>
        </div>
        <div className="border-2 border-dashed border-primary/60 bg-primary-fixed/20 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[28px] font-bold text-primary tracking-widest font-mono select-all truncate">{code}</span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'ইউনিক পার্টনার কোড' : 'Unique partner code'}</span>
          </div>
          <button
            onClick={() => copy('code', code)}
            className="h-11 px-4 bg-primary text-on-primary rounded-full flex items-center gap-1.5 text-label-lg font-label-lg active:scale-95 transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">{copied === 'code' ? 'check' : 'content_copy'}</span>
            <span>{copied === 'code' ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি করুন' : 'Copy')}</span>
          </button>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">info</span>
          <span>{bn ? 'সাইন আপের সময় এই কোড বসালেই কাস্টমার আপনার রেফারেলে যুক্ত হবেন।' : 'When a customer enters this code at sign-up, they join your referrals.'}</span>
        </p>
      </section>

      {/* Link card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm mt-3">
        <label className="block text-label-md font-label-md text-on-surface font-bold mb-1">
          {bn ? 'রেফারেল লিংক (Referral Link)' : 'Referral Link'}
        </label>
        <div className="flex items-center gap-2 p-1.5 pl-3 bg-surface-container-low border border-outline-variant/50 rounded-xl">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">link</span>
          <span className="text-body-md font-body-md font-mono text-tertiary truncate flex-1 font-semibold select-all">{link}</span>
          <button
            onClick={() => copy('link', link)}
            className="h-10 px-3 bg-surface-container-lowest border border-primary text-primary rounded-lg flex items-center gap-1 text-label-md font-label-md active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">{copied === 'link' ? 'check' : 'content_copy'}</span>
            <span>{copied === 'link' ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'লিংক কপি' : 'Copy link')}</span>
          </button>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">auto_awesome</span>
          <span>{bn ? 'এই লিংকে ক্লিক করে অ্যাপ ইন্সটল বা সাইন আপ করলে কোড অটোমেটিক বসে যাবে।' : 'Clicking this link and signing up applies the code automatically.'}</span>
        </p>
      </section>

      {/* Social share */}
      <section className="flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'সোশ্যাল মিডিয়াতে দ্রুত শেয়ার' : 'Quick share on social media'}</h2>
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Instant Share</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {shares.map(s => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className={`flex flex-col items-center justify-center p-3 rounded-xl text-white active:scale-95 transition-all shadow-sm min-h-[76px] text-center ${s.cls}`}
            >
              <svg className="w-6 h-6 fill-current mb-1" viewBox="0 0 24 24" aria-hidden="true"><path d={s.path} /></svg>
              <span className="text-label-md font-label-md font-bold leading-tight">{s.name}</span>
              <span className="text-[10px] opacity-90 leading-tight">{bn ? 'শেয়ার' : 'Share'}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Ready message */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm mt-3">
        <div className="flex items-center gap-2 mb-1 text-primary font-bold">
          <span className="material-symbols-outlined text-[20px]">sms</span>
          <h2 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'তৈরি মেসেজ কপি করুন' : 'Copy the ready-made message'}</h2>
        </div>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mb-2">Ready-made share message</p>
        <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 text-body-sm font-body-sm text-on-surface leading-relaxed select-all">
          {readyMessage}
        </div>
        <button
          onClick={() => copy('msg', readyMessage)}
          className="w-full mt-4 h-12 bg-primary text-on-primary rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">{copied === 'msg' ? 'check' : 'content_copy'}</span>
          <span>{copied === 'msg' ? (bn ? 'কপি হয়েছে ✓' : 'Copied ✓') : (bn ? 'মেসেজ কপি করুন / Copy message 📋' : 'Copy message 📋')}</span>
        </button>
      </section>

      {/* How it works */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/40 shadow-sm mt-3">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <h2 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'রেফারেল যেভাবে কাজ করে' : 'How referrals work'}</h2>
          </div>
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">How it works</span>
        </div>
        <div className="space-y-4">
          {steps.map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-label-md shrink-0 mt-0.5 ${s.highlight ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                {bn ? s.n : ['1', '2', '3'][steps.indexOf(s)]}
              </span>
              <div>
                <p className={`text-body-md font-body-md font-bold ${s.highlight ? 'text-secondary' : 'text-on-surface'}`}>{bn ? s.titleBn : s.titleEn}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">{bn ? s.bodyBn : s.bodyEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Referred customers (kept from previous build — not in af1.4) */}
      <p className="text-label-lg font-semibold text-on-surface mt-6 mb-2">
        {bn ? `আপনার গ্রাহক (${toBnDigits(referredCustomers.length, lang)} জন)` : `Your customers (${referredCustomers.length})`}
      </p>
      {referredCustomers.length === 0 ? (
        <p className="text-body-md text-on-surface-variant py-4 text-center">
          {bn ? 'এখনো কেউ আপনার লিংকে আসেনি। লিংক শেয়ার করুন!' : 'No one has come through your link yet. Share it!'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {referredCustomers.map(c => (
            <div key={c.mobile} className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3.5">
              <div className="w-10 h-10 rounded-full bg-tertiary/12 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-[19px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{c.name}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {c.mobile} · {toBnDigits(c.orders, lang)} {bn ? 'টি অর্ডার' : 'orders'}
                </p>
              </div>
              <span className="text-body-sm font-bold text-success">+{fmtTk(c.commission, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Referred orders with per-order commission */}
      <p className="text-label-lg font-semibold text-on-surface mt-6 mb-2">
        {bn ? 'রেফারেল অর্ডার ও কমিশন' : 'Referral orders & commission'}
      </p>
      <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-1">
        {referredOrders.map(r => (
          <div key={r.orderId} className="flex justify-between items-center py-2.5 border-b border-outline-variant/20 last:border-0">
            <div>
              <p className="text-body-sm font-medium text-on-surface">#{r.orderId}</p>
              <p className="text-label-sm text-on-surface-variant">
                {r.customerName} · {new Date(r.orderDate).toLocaleDateString(bn ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-body-sm font-bold text-success">+{fmtTk(r.commission, lang)}</p>
              <p className="text-label-sm text-on-surface-variant">{bn ? 'অর্ডার' : 'order'} {fmtTk(r.orderTotal, lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
