import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import type { Lang } from '../../types';

// ── Stitch 2 · Language Selection ─────────────────────────────
// Wordmark header, two selectable language cards (radio + badge),
// the local-promise strip and an explicit Continue button.

export default function LanguageSelectScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Lang>(state.lang ?? 'bn');
  const bn = selected === 'bn';

  const continueNext = () => {
    dispatch({ type: 'SET_LANG', lang: selected });
    navigate('/onboard', { replace: true });
  };

  const card = (lang: Lang) => {
    const active = selected === lang;
    const isBn = lang === 'bn';
    return (
      <button
        key={lang} type="button" onClick={() => setSelected(lang)}
        className={clsx(
          'relative w-full flex items-center gap-3.5 rounded-xl p-space-md text-left transition-all duration-150 active:scale-[0.98]',
          active
            ? 'border-2 border-primary bg-primary/5 shadow-sm'
            : 'border-2 border-outline-variant/60 bg-surface-container-lowest shadow-sm hover:border-outline',
        )}
      >
        <span className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          active ? 'bg-primary text-on-primary shadow-sm' : 'border-2 border-outline-variant bg-transparent',
        )}>
          {active && <span className="material-symbols-outlined text-[16px] filled-symbol">check</span>}
        </span>
        <span className="flex-1 min-w-0">
          <span className={clsx('block text-headline-sm font-headline-sm font-bold', active ? 'text-primary' : 'text-on-surface')}>
            {isBn ? 'বাংলা (Bangla)' : 'English (ইংরেজি)'}
          </span>
          <span className="block text-body-sm font-body-sm text-on-surface-variant mt-0.5">
            {isBn ? 'সহজ বাংলা ভাষায় সম্পূর্ণ অ্যাপ ব্যবহার করুন' : 'Use full application in English'}
          </span>
        </span>
        {active && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
            {isBn ? 'নির্বাচিত' : 'Selected'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-8 pb-6 flex flex-col">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <span className="text-headline-md font-headline-md font-black text-primary tracking-tight">Jovro</span>
          <span className="inline-flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            লালমনিরহাট সদর
          </span>
        </div>

        {/* Title */}
        <div className="mt-8">
          <h1 className="text-headline-md font-headline-md font-bold text-on-surface">ভাষা বেছে নিন</h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Choose your preferred language</p>
          <p className="mt-2 flex items-start gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
            যেকোনো সময় সেটিংস থেকে পরিবর্তন করতে পারবেন / You can change this anytime in settings
          </p>
        </div>

        {/* Language cards */}
        <div className="mt-6 flex flex-col gap-3">
          {card('bn')}
          {card('en')}
        </div>

        {/* Local promise strip */}
        <div className="mt-6 p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">pedal_bike</span>
          <div>
            <p className="text-label-md font-label-md font-bold text-primary">স্থানীয় প্রতিশ্রুতি · Local Promise</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed mt-0.5">
              গোশালা বাজারের পাইকারি দর ও স্থানীয় রেস্টুরেন্টের তাজা খাবার সাইকেলে দ্রুত ডেলিভারি!
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Continue */}
        <button
          type="button" onClick={continueNext}
          className="mt-8 w-full h-13 py-3.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
        >
          <span>{bn ? 'এগিয়ে যান / Continue' : 'Continue / এগিয়ে যান'}</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
        <a href={OPERATOR.phoneTel} className="mt-3 flex items-center justify-center gap-1.5 text-label-md font-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          <span>প্রয়োজনে সাহায্য নিন / Need help? {bn ? OPERATOR.phoneDisplayBn.replace(' (নমুনা)', '') : OPERATOR.phoneDisplayEn.replace(' (sample)', '')}</span>
        </a>
      </div>
    </div>
  );
}
