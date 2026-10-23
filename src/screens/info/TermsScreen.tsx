import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInfoScreen } from './TextInfoScreen';
import { TERMS_SECTIONS } from '../../data/infoContent';

/**
 * Terms & Conditions — Stitch f1.6 / 29: the sections render
 * through TextInfoScreen; the bottom acknowledgment & consent
 * card (design 29) closes the page.
 */
export default function TermsScreen() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(true);

  return (
    <TextInfoScreen
      titleBn="শর্তাবলী"
      titleEn="Terms & Conditions"
      icon="description"
      sections={TERMS_SECTIONS}
    >
      {/* Bottom acknowledgment & consent card — design 29 */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border-2 border-primary/20 flex flex-col gap-3.5">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded text-primary focus:ring-primary border-outline/50 transition shrink-0"
          />
          <span className="flex-1">
            <span className="text-body-md font-semibold text-on-surface block leading-tight">
              আমি শর্তাবলী পড়েছি ও সম্পূর্ণ সম্মতি দিচ্ছি
            </span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block mt-0.5">
              I have read and agree to Jovro's Terms of Service &amp; Privacy Policy
            </span>
          </span>
        </label>
        <button
          type="button"
          disabled={!agreed}
          onClick={() => navigate(-1)}
          className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>সম্মতি দিয়ে এগিয়ে যান / Understood</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </section>
    </TextInfoScreen>
  );
}
