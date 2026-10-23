import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * Shared readable layout for the info / text pages (D10, D14–D20),
 * chrome aligned to the Stitch f1.x info designs: back button,
 * title with the other-language sub-line, and a বাংলা | EN pill
 * that switches the app language.
 */
export function InfoPage({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <header className="bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-headline-sm text-headline-sm text-on-surface leading-tight tracking-tight truncate">{title}</h1>
            {subtitle && (
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium truncate">{subtitle}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md tracking-tight shrink-0 active:scale-95 transition-all"
        >
          <span className={bn ? 'font-bold text-on-surface' : ''}>বাংলা</span>
          <span className="mx-0.5 text-outline">|</span>
          <span className={!bn ? 'font-bold text-on-surface' : ''}>EN</span>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
        {icon && (
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
            </span>
          </div>
        )}
        <div className="flex flex-col gap-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

export function InfoSection({
  heading,
  paragraphs,
  bullets,
}: {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}) {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
      {heading && (
        <h2 className="text-label-lg font-label-lg text-on-surface font-bold mb-1.5">{heading}</h2>
      )}
      {paragraphs?.map((p, i) => (
        <p key={i} className="text-body-md text-on-surface-variant leading-relaxed mb-2 last:mb-0">{p}</p>
      ))}
      {bullets && (
        <ul className="flex flex-col gap-1.5 mt-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-body-md text-on-surface-variant leading-relaxed">
              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 flex-shrink-0">check_circle</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
