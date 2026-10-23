import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { REFUND_SECTIONS, OPERATOR } from '../../data/infoContent';
import { useApp } from '../../context/AppContext';

export default function RefundPolicyScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <TextInfoScreen
      titleBn="রিপ্লেসমেন্ট ও রিফান্ড নীতি"
      titleEn="Replacement & Refund Policy"
      icon="currency_exchange"
      sections={REFUND_SECTIONS}
    >
      {/* Refund methods (Stitch f1.7) */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
          <h2 className="text-label-lg font-label-lg text-on-surface font-bold">
            {bn ? 'রিফান্ড যেভাবে পাবেন' : 'How refunds are paid'}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {['বিকাশ (bKash)', 'নগদ (Nagad)', bn ? 'ক্যাশ অন হ্যান্ড' : 'Cash in hand'].map(m => (
            <span key={m} className="px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 text-label-md font-label-md text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
              {m}
            </span>
          ))}
        </div>
        <p className="text-body-sm text-on-surface-variant mt-2.5 leading-relaxed">
          {bn
            ? 'আপনি যে মাধ্যমে টাকা দিয়েছিলেন, রিফান্ড সাধারণত সেই মাধ্যমেই ফেরত যায়।'
            : 'Refunds usually go back through the same method you paid with.'}
        </p>
      </section>

      {/* Support strip (Stitch f1.7) */}
      <section className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[22px]">support_agent</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-label-lg font-semibold text-on-surface">
            {bn ? 'সহায়তা কেন্দ্র' : 'Support centre'}: {bn ? OPERATOR.hoursBn : OPERATOR.hoursEn}
          </p>
          <p className="text-body-sm text-on-surface-variant">{bn ? OPERATOR.phoneDisplayBn : OPERATOR.phoneDisplayEn}</p>
        </div>
        <a
          href={OPERATOR.phoneTel}
          className="px-4 h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          {bn ? 'কল করুন' : 'Call'}
        </a>
      </section>
    </TextInfoScreen>
  );
}
