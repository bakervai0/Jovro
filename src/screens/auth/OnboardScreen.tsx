import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const FEATURES = [
  {
    icon: 'storefront',
    color: 'text-primary bg-primary/10',
    titleBn: 'গোশালা বাজার থেকে তাজা পণ্য',
    titleEn: 'Fresh from Goshala Bazar & local vendors',
  },
  {
    icon: 'payments',
    color: 'text-secondary bg-secondary/10',
    titleBn: 'বাজারের আসল দাম, শুধু ডেলিভারি ফি',
    titleEn: 'Zero product markup (Fixed fee starting ৳১৫)',
  },
  {
    icon: 'pedal_bike',
    color: 'text-tertiary bg-tertiary/10',
    titleBn: 'পরিবেশবান্ধব বাইসাইকেল ডেলিভারি',
    titleEn: 'Eco-friendly neighborhood bicycle dispatch',
  },
];

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
          <p className="text-label-md text-on-surface-variant mt-0.5">Groceries & food, delivered to your door</p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="flex-1 flex flex-col justify-center gap-3 px-5">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-white rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {f.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-body-sm font-semibold text-on-surface leading-snug">
                {lang === 'bn' ? f.titleBn : f.titleEn}
              </p>
              {lang === 'bn' && (
                <p className="text-label-sm text-on-surface-variant mt-0.5 leading-snug">{f.titleEn}</p>
              )}
            </div>
          </div>
        ))}
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
