import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { PRIVACY_SECTIONS, OPERATOR } from '../../data/infoContent';
import { useApp } from '../../context/AppContext';

export default function PrivacyScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <TextInfoScreen
      titleBn="গোপনীয়তা নীতি"
      titleEn="Privacy Policy"
      icon="privacy_tip"
      sections={PRIVACY_SECTIONS}
    >
      {/* Trust strip (Stitch f1.5) */}
      <section className="bg-[#E8F5E9] border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">shield</span>
        </span>
        <div>
          <p className="text-label-lg font-bold text-primary">
            {bn ? 'কারো কাছে বিক্রি বা শেয়ার করা হয় না' : 'Never sold or shared with anyone'}
          </p>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            Never sold or shared • {bn ? '১০০% স্থানীয় আস্থা ও নিরাপত্তা' : '100% local trust & safety'}
          </p>
        </div>
      </section>

      {/* Helpline strip (Stitch f1.5) */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
        <h2 className="text-label-lg font-label-lg text-on-surface font-bold mb-3">
          {bn ? 'সাহায্য বা তথ্যের জন্য হেল্পলাইন' : 'Helpline for help or information'}
        </h2>
        <div className="flex gap-2">
          <a
            href={OPERATOR.phoneTel}
            className="flex-1 h-11 rounded-full border border-primary text-primary flex items-center justify-center gap-2 font-label-md text-label-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            {bn ? 'কল করুন' : 'Call'} • {OPERATOR.phoneDisplayEn.replace(' (sample)', '')}
          </a>
          <a
            href={OPERATOR.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 font-label-md text-label-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            WhatsApp Support
          </a>
        </div>
      </section>
    </TextInfoScreen>
  );
}
