import React from 'react';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { OPERATOR } from '../../data/infoContent';
import { toBnDigits } from '../../services/orderUtils';

/** About Jovro — composed to Stitch f1.2 (intro card, promise
 *  card, 3-step tiles, direct-contact card, sign-off). */
export default function AboutScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';

  const introPoints = [
    {
      icon: 'shopping_basket',
      bn: 'আপনি অর্ডার করেন, আমরা গোশালা বাজার ও স্থানীয় রেস্টুরেন্ট থেকে কিনে সাইকেলে আপনার ঘরে পৌঁছে দিই।',
      en: 'You order; we buy from Goshala Bazar and local restaurants and deliver to your door by cycle.',
    },
    {
      icon: 'person_pin_circle',
      bn: 'লালমনিরহাট সদরের স্থানীয় একজন উদ্যোক্তা দ্বারা পরিচালিত ব্যক্তিগত শপিং ও ডেলিভারি সেবা।',
      en: 'A personal shopping and delivery service run by a local entrepreneur of Lalmonirhat Sadar.',
    },
    {
      icon: 'handshake',
      bn: 'আমাদের কোনো গোপন চার্জ নেই। বাজারের আসল দাম ও সততাই আমাদের শক্তি।',
      en: 'We have no hidden charges. Real bazaar prices and honesty are our strength.',
    },
  ];

  const steps = [
    { icon: 'touch_app', bn: 'অ্যাপে অর্ডার', en: 'Order in app', sub: 'Order placed' },
    { icon: 'store', bn: 'গোশালা বাজার', en: 'Goshala Bazar', sub: 'Fresh purchase' },
    { icon: 'pedal_bike', bn: 'সাইকেলে ডেলিভারি', en: 'Cycle delivery', sub: 'At doorstep' },
  ];

  return (
    <InfoPage title={bn ? 'আমাদের সম্পর্কে' : 'About Jovro'} subtitle={bn ? 'About Jovro' : 'আমাদের সম্পর্কে'}>
      {/* Intro card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-3">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
            <span className="font-label-lg text-label-lg text-primary">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5E9] text-primary border border-primary/20 text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            {bn ? 'সততা ও সেবা' : 'Honesty & service'}
          </span>
        </div>
        <article className="space-y-3 text-on-surface">
          {introPoints.map(p => (
            <div key={p.icon} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
              </span>
              <p className="font-body-lg text-body-lg leading-relaxed text-on-surface">{bn ? p.bn : p.en}</p>
            </div>
          ))}
        </article>
      </section>

      {/* Promise card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border-2 border-primary shadow-sm relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-fixed/20 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">verified_user</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">favorite</span>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                {bn ? 'আমাদের শতভাগ অঙ্গীকার' : 'Our 100% promise'}
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-semibold pt-1 leading-snug">
              {bn
                ? 'আমরা শুধু ডেলিভারি চার্জ নিই — পণ্যের দাম বাজারের রসিদ অনুযায়ী, এক টাকাও বেশি না'
                : 'We charge only the delivery fee — product prices exactly as per the bazaar receipt, not a taka more'}
            </p>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium leading-tight">
              We charge only for delivery — product prices are exactly as per the bazaar receipt, not a taka more.
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-body-sm text-on-surface-variant relative z-10">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">receipt</span>
            {bn ? 'আসল মেমো সাথে দেওয়া হয়' : 'Original memo included'}
          </span>
          <span className="font-label-md text-primary font-bold">{bn ? '৳০ লুকানো ফি' : '৳0 hidden fees'}</span>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{bn ? 'কীভাবে কাজ করে' : 'How it works'}</h3>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">How it works</span>
          </div>
          <span className="text-label-sm font-label-sm text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-full font-bold">
            {bn ? '৩টি সহজ ধাপ' : '3 easy steps'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {steps.map((s, i) => (
            <div key={s.icon} className="bg-surface-container-lowest rounded-xl p-2.5 border border-outline-variant/30 flex flex-col items-center text-center shadow-sm relative">
              <span className="absolute top-1.5 left-2 font-label-sm text-label-sm font-bold text-on-surface-variant/70">
                {toBnDigits(i + 1, state.lang)}
              </span>
              <div className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-2 mt-1">
                <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface font-bold leading-tight">{bn ? s.bn : s.en}</h4>
              <p className="font-bilingual-sub text-[10px] text-on-surface-variant mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Direct contact card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[22px]">contact_support</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-[16px] text-on-surface font-bold leading-tight">
              {bn ? 'সরাসরি যোগাযোগ করুন' : 'Contact us directly'}
            </h4>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
              {bn ? 'যেকোনো প্রশ্ন বা বিশেষ অর্ডারের জন্য' : 'For any question or special order'}
            </p>
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-3 leading-relaxed">
          {bn
            ? 'কোনো নির্দিষ্ট দোকান থেকে কিছু দরকার? বাজারে না পাওয়া যেকোনো জিনিস সংগ্রহ করতে আমাকে সরাসরি ফোন বা হোয়াটসঅ্যাপে জানাতে পারেন।'
            : 'Need something from a specific shop? Message or call us directly and we will try to source it for you.'}
        </p>
        <div className="flex flex-col min-[400px]:flex-row gap-2">
          <a href={OPERATOR.phoneTel} className="flex-1 h-12 rounded-full border border-primary text-primary bg-surface-container-lowest flex items-center justify-center gap-2 font-label-lg text-label-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">call</span>
            {bn ? 'কল করুন' : 'Call us'}
          </a>
          <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 font-label-lg text-label-lg shadow-sm active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            {bn ? 'হোয়াটসঅ্যাপে লিখুন' : 'Write on WhatsApp'}
          </a>
        </div>
      </section>

      {/* Sign-off */}
      <div className="text-center py-2 pb-4">
        <p className="font-label-md text-label-md text-on-surface-variant font-medium">
          {bn ? 'জোভরো · আপনার বিশ্বস্ত স্থানীয় শপার' : 'Jovro · Your trusted local shopper'}
        </p>
        <p className="font-label-sm text-label-sm text-outline tracking-wider">LALMONIRHAT SADAR, BANGLADESH</p>
      </div>
    </InfoPage>
  );
}
