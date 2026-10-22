import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Lang } from '../../types';

export default function LanguageSelectScreen() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const select = (lang: Lang) => {
    dispatch({ type: 'SET_LANG', lang });
    navigate('/onboard', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 bg-surface">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-[24px] bg-primary flex items-center justify-center shadow-card">
          <span className="material-symbols-outlined text-white text-[44px] filled-symbol">local_shipping</span>
        </div>
        <h1 className="text-[36px] font-black text-primary leading-none">Jovro</h1>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-headline-md font-bold text-on-surface">ভাষা বেছে নিন</h2>
        <p className="text-headline-sm text-on-surface-variant mt-1">Choose your language</p>
      </div>

      {/* Language options */}
      <div className="w-full flex flex-col gap-4">
        <button
          onClick={() => select('bn')}
          className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-primary bg-primary/8 active:bg-primary/16 transition-colors"
        >
          <span className="text-[36px]">🇧🇩</span>
          <div className="flex-1 text-left">
            <p className="text-headline-sm font-bold text-primary">বাংলা</p>
            <p className="text-body-md text-on-surface-variant">Bengali</p>
          </div>
          <span className="material-symbols-outlined text-primary">chevron_right</span>
        </button>

        <button
          onClick={() => select('en')}
          className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-outline-variant bg-surface-container active:bg-surface-container-high transition-colors"
        >
          <span className="text-[36px]">🇬🇧</span>
          <div className="flex-1 text-left">
            <p className="text-headline-sm font-bold text-on-surface">English</p>
            <p className="text-body-md text-on-surface-variant">ইংরেজি</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>

      <p className="text-label-sm text-on-surface-variant/60 text-center">
        আপনি পরে প্রোফাইল থেকে ভাষা পরিবর্তন করতে পারবেন
      </p>
    </div>
  );
}
