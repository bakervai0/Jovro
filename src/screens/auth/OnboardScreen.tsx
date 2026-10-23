import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CATEGORY_IMAGES } from '../../data/images';

export default function OnboardScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #e6f4ec 0%, #f0faf4 40%, #fafffe 100%)' }}
    >
      {/* Location pill */}
      <div className="flex justify-center pt-10 pb-2 px-6">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary/15 rounded-full px-4 py-2 shadow-sm">
          <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
          <span className="text-label-md font-semibold text-on-surface">
            লালমনিরহাট সদর
          </span>
          <span className="text-on-surface-variant text-label-sm">·</span>
          <span className="text-label-sm text-on-surface-variant">Lalmonirhat Sadar</span>
        </div>
      </div>

      {/* App icon + branding */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-4">
        {/* Icon */}
        <div className="w-[96px] h-[96px] rounded-[26px] bg-primary flex items-center justify-center shadow-lg relative"
          style={{ boxShadow: '0 8px 32px rgba(29,157,87,0.35)' }}
        >
          <span className="material-symbols-outlined text-white text-[52px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            pedal_bike
          </span>
          {/* shopping bag badge */}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              shopping_bag
            </span>
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <h1 className="text-[38px] font-black text-primary leading-none tracking-tight">Jovro</h1>
          <p className="text-[18px] font-bold text-on-surface/70 mt-1 tracking-wide">জভ্রো</p>
        </div>

        {/* Tagline */}
        <div className="text-center px-8">
          <p className="text-body-lg font-semibold text-on-surface">বাজার আর খাবার, ঘরে বসেই</p>
          <p className="text-label-md text-on-surface-variant mt-0.5">Groceries &amp; food, delivered to your door</p>
        </div>
      </div>

      {/* How-it-works slides (Stitch design 13) */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-2">
        {/* Stage subtitle & progress dots */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-secondary font-label-md text-label-md block">
              {lang === 'bn' ? 'ধাপ ১ / ৩ • How Jovro Works' : 'Step 1 / 3 • How Jovro Works'}
            </span>
            <h2 className="text-headline-md font-headline-md text-on-surface mt-0.5">
              {lang === 'bn' ? 'কীভাবে কাজ করে জেনে নিন' : 'See how it works'}
            </h2>
          </div>
          <div aria-label="Onboarding Slide Navigation" className="flex items-center gap-1.5" role="tablist">
            <button type="button" aria-label="Slide 1 active" aria-selected="true" role="tab" className="h-2 w-6 rounded-full bg-primary transition-all duration-300" />
            <button type="button" aria-label="Slide 2" aria-selected="false" role="tab" className="h-2 w-2 rounded-full bg-outline-variant/60 hover:bg-outline-variant transition-all duration-300" />
            <button type="button" aria-label="Slide 3" aria-selected="false" role="tab" className="h-2 w-2 rounded-full bg-outline-variant/60 hover:bg-outline-variant transition-all duration-300" />
          </div>
        </div>

        {/* Main spotlight card — Slide 1: Order */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 card-shadow border border-outline-variant/30 flex flex-col relative overflow-hidden mb-4">
          {/* Accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary-container" />
          {/* Step indicator & category tag */}
          <div className="flex items-center justify-between mt-1 mb-3">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-label-md font-label-md">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
              {lang === 'bn' ? '১. অর্ডার করুন / Step 1' : '1. Place your order / Step 1'}
            </div>
            <span className="text-on-surface-variant font-bilingual-sub text-bilingual-sub bg-surface-container-low px-2 py-0.5 rounded">
              ক্যাটালগ অথবা চিরকুট
            </span>
          </div>
          {/* Visual hero area */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 mb-3 flex items-center justify-center">
            {CATEGORY_IMAGES['vegetables'] && (
              <img
                className="absolute inset-0 w-full h-full object-cover"
                src={CATEGORY_IMAGES['vegetables']}
                alt="লালমনিরহাটের স্থানীয় বাজারের তাজা সবজির ঝুড়ি ও হাতে লেখা বাজারের চিরকুট"
              />
            )}
            {/* Floating handwritten memo overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/95 backdrop-blur-sm p-2 rounded-lg border border-outline-variant/40 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                </span>
                <div>
                  <p className="text-label-md font-label-md text-on-surface leading-tight">যা লাগবে লিখে দিন</p>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Custom Shopping List / Voice Note</p>
                </div>
              </div>
              <span className="text-primary font-bold text-label-sm bg-primary/10 px-2 py-0.5 rounded">সহজ সুবিধা</span>
            </div>
          </div>
          {/* Card headline & bilingual explanation */}
          <div className="space-y-1.5">
            <h3 className="text-headline-sm font-headline-sm text-on-surface leading-snug">
              {lang === 'bn' ? 'অর্ডার করুন মনের মতো' : 'Choose from catalogue or write a note'}
              <span className="block text-body-md font-body-md text-on-surface-variant font-normal">
                {lang === 'bn' ? 'Choose from catalogue or write a note' : 'অর্ডার করুন মনের মতো'}
              </span>
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
              গোশালা বাজার বা শহরের যেকোনো দোকান থেকে যা খুশি বেছে নিন। ক্যাটালগে না পেলেও সরাসরি চিরকুটে লিখে অর্ডার পাঠাতে পারেন।
            </p>
          </div>
          {/* Micro feature badges */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/20">
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <div>
                <p className="text-label-md font-label-md text-on-surface">
                  {lang === 'bn' ? 'তাজা শাক-সবজি' : 'Fresh local produce'}
                </p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                  {lang === 'bn' ? 'Fresh local produce' : 'তাজা শাক-সবজি'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
              <div>
                <p className="text-label-md font-label-md text-on-surface">
                  {lang === 'bn' ? 'আসল বাজার দর' : 'Real store prices'}
                </p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                  {lang === 'bn' ? 'Real store prices' : 'আসল বাজার দর'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preview cards — Slides 2 & 3 */}
        <div className="space-y-2 mb-2">
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant uppercase tracking-wider font-semibold pl-1">
            পরবর্তী ধাপসমূহ • UPCOMING STEPS
          </p>
          {/* Slide 2 preview */}
          <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 flex items-center justify-between hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">storefront</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-label-md font-label-md text-on-surface">২. আমরা বাজার থেকে কিনি</span>
                  <span className="text-label-sm font-label-sm bg-secondary-fixed/50 text-secondary px-1.5 py-px rounded">আসল রসিদ</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant line-clamp-1">
                  গোশালা বাজার থেকে ঠিক বাজারের দামে কিনি — মেমোই তার প্রমাণ।
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
          </div>
          {/* Slide 3 preview */}
          <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 flex items-center justify-between hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">pedal_bike</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-label-md font-label-md text-on-surface">৩. সাইকেলে পৌঁছে দিই</span>
                  <span className="text-label-sm font-label-sm bg-primary/10 text-primary px-1.5 py-px rounded">সদর ১১৪ এলাকা</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant line-clamp-1">
                  জিরো মার্কআপ, কেবল নির্দিষ্ট ডেলিভারি ফি (শুরু ৳১৫ থেকে)। সাইকেল রাইডারের দ্রুত ডেলিভারি।
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
          </div>
        </div>

        {/* Honest value reassurance banner (design 13, above the CTA) */}
        <div className="mt-3 py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
          <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-primary font-bold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span> জিরো-মার্কআপ নিশ্চয়তা
            </span>
            <span className="text-outline-variant">•</span>
            <span className="inline-flex items-center text-on-surface">
              <span className="material-symbols-outlined text-[14px] mr-0.5">receipt_long</span> ১০০% বাজারের আসল রসিদ
            </span>
            <span className="text-outline-variant">•</span>
            <span className="inline-flex items-center text-secondary font-bold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">eco</span> সাইকেল কুরিয়ার
            </span>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-5">
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full py-4 rounded-2xl bg-primary text-white flex items-center justify-center gap-3 active:scale-[0.97] transition-transform shadow-md"
          style={{ boxShadow: '0 6px 24px rgba(29,157,87,0.3)' }}
        >
          <span className="text-label-lg font-bold">অ্যাপে প্রবেশ করুন</span>
          <span className="text-white/50">|</span>
          <span className="text-label-md font-semibold text-white/90">Get Started</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>

        {/* Status */}
        <div className="flex flex-col items-center gap-1 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-label-sm text-on-surface-variant">
              {lang === 'bn' ? 'সার্ভার সংযুক্ত · সার্ভিসের জন্য প্রস্তুত' : 'Server connected · Ready for service'}
            </p>
          </div>
          <p className="text-label-sm text-on-surface-variant/50">v1.2.0 · Lalmonirhat District</p>
        </div>
      </div>
    </div>
  );
}
