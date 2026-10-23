import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { toBn } from '../../lib/format';

/** বাংলা | EN pill — one tap switches the whole app language. */
export function LangToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { state, dispatch } = useApp();
  const bn = state.lang === 'bn';

  return (
    <button
      type="button"
      aria-label={bn ? 'Switch to English' : 'বাংলায় দেখুন'}
      onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
      className={clsx(
        'flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest font-semibold shadow-card transition-colors',
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5',
        className,
      )}
    >
      <span className={clsx('text-[12px]', bn ? 'text-primary' : 'text-on-surface/45')}>বাংলা</span>
      <span className="text-[11px] text-outline-variant">|</span>
      <span className={clsx('text-[11.5px] tracking-wide', !bn ? 'text-primary' : 'text-on-surface/45')}>EN</span>
    </button>
  );
}

/** Logo mark + wordmark used in headers and splash screens. */
export function JovroMark({ size = 22, withIcon = true }: { size?: number; withIcon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {withIcon && (
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
          <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
        </span>
      )}
      <span style={{ fontSize: size }} className="font-display font-bold leading-none tracking-tight text-primary">
        Jovro
      </span>
    </span>
  );
}

/** Home header — location pill · Jovro · language toggle. */
export function HomeHeader() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const area = state.areas.find(a => a.id === state.selectedAreaId);
  const areaLabel = area ? (bn ? area.nameBn : area.nameEn) : (bn ? 'এলাকা বেছে নিন' : 'Choose area');

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-outline-variant/40 bg-surface/95 px-4 py-2.5 backdrop-blur">
      <button
        onClick={() => navigate('/area')}
        className="flex min-w-0 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pl-2 pr-3 shadow-card active:scale-[0.98]"
      >
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary-soft">
          <span className="material-symbols-outlined filled-symbol text-[16px] text-primary">location_on</span>
        </span>
        <span className="min-w-0 text-left">
          <span className="flex items-center gap-1">
            <span className="truncate text-[12.5px] font-semibold leading-tight text-on-surface">{areaLabel}</span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">arrow_drop_down</span>
          </span>
          <span className="block truncate text-[10px] leading-tight text-on-surface-variant">
            {area ? (bn ? `${area.nameEn} Sadar` : `${area.nameEn}, Lalmonirhat`) : (bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar')}
          </span>
        </span>
      </button>

      <div className="flex-1 text-center">
        <JovroMark size={22} />
      </div>

      <LangToggle />
    </header>
  );
}

/** Service hours strip beneath the home header. */
export function ServiceHoursStrip() {
  const { state, dispatch } = useApp();
  const bn = state.lang === 'bn';
  const open = state.isServiceOpen;

  return (
    <div className={clsx('flex items-center justify-between gap-2 border-b px-4 py-2.5', open ? 'border-primary/10 bg-primary-tint' : 'border-secondary/15 bg-secondary-soft')}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={clsx('material-symbols-outlined text-[18px]', open ? 'text-primary' : 'text-secondary')}>
          schedule
        </span>
        <span className={clsx('truncate text-[12.5px] font-semibold leading-tight', open ? 'text-primary-deep' : 'text-secondary')}>
          {bn ? 'আজ বিকেল ৫–৭টা' : 'Today 5–7 PM'}
          <span className="mx-1 font-normal opacity-60">/</span>
          {bn ? 'Today 5–7 PM' : 'আজ বিকেল ৫–৭টা'}
        </span>
      </div>
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SERVICE' })}
        className={clsx(
          'flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
          open ? 'bg-primary/10 text-primary-deep' : 'bg-secondary/12 text-secondary',
        )}
        title={bn ? 'সার্ভিস চালু/বন্ধ (ডেমো)' : 'Toggle service (demo)'}
      >
        <span className={clsx('h-1.5 w-1.5 rounded-full', open ? 'animate-pulse-dot bg-primary' : 'bg-secondary')} />
        {open ? (bn ? '৪টি একটিভ স্লট' : '4 active slots') : (bn ? 'সার্ভিস বন্ধ' : 'Service closed')}
      </button>
    </div>
  );
}

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  showLang?: boolean;
  className?: string;
  centered?: boolean;
  border?: boolean;
}

/** Standard inner-page header: back · title (+ subtitle) · actions · langue. */
export function PageHeader({
  title, subtitle, showBack, onBack, right, showLang, className, centered, border = true,
}: PageHeaderProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center gap-2 bg-surface/95 px-4 py-2.5 backdrop-blur',
        border && 'border-b border-outline-variant/50',
        className,
      )}
    >
      {showBack && (
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label={bn ? 'ফিরে যান' : 'Back'}
          className="-ml-1 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-on-surface active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[23px]">arrow_back</span>
        </button>
      )}

      <div className={clsx('min-w-0 flex-1', centered && 'text-center')}>
        {title && <h1 className="truncate text-[16.5px] font-bold leading-tight text-on-surface">{title}</h1>}
        {subtitle && <p className="truncate text-[11.5px] leading-tight text-on-surface-variant">{subtitle}</p>}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {right}
        {showLang && <LangToggle compact />}
      </div>
    </header>
  );
}

/** Bilingual section heading with optional "see all" action. */
export function SectionHeading({
  titleBn, titleEn, actionBn, actionEn, onAction, subtitleBn, subtitleEn, icon, className,
}: {
  titleBn: string;
  titleEn?: string;
  actionBn?: string;
  actionEn?: string;
  onAction?: () => void;
  subtitleBn?: string;
  subtitleEn?: string;
  icon?: string;
  className?: string;
}) {
  const { state } = useApp();
  const bn = state.lang === 'bn';

  return (
    <div className={clsx('flex items-start justify-between gap-3 px-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-[17px] font-bold leading-tight text-on-surface">
          {icon && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary-soft text-secondary">
              <span className="material-symbols-outlined text-[17px]">{icon}</span>
            </span>
          )}
          {bn ? titleBn : (titleEn ?? titleBn)}
        </h2>
        {(subtitleBn || subtitleEn) && (
          <p className="mt-0.5 text-[11.5px] leading-tight text-on-surface-variant">
            {bn ? subtitleBn : (subtitleEn ?? subtitleBn)}
          </p>
        )}
      </div>
      {onAction && (
        <button onClick={onAction} className="flex-shrink-0 pt-1 text-[12px] font-semibold text-primary">
          {bn ? (actionBn ?? 'সব দেখুন') : (actionEn ?? 'See all')}
        </button>
      )}
    </div>
  );
}

/** Small "৪টি স্লট" style counter used near headings. */
export function SlotCount({ count }: { count: number }) {
  const { state } = useApp();
  return (
    <span className="text-[11px] font-medium text-on-surface-variant">
      {toBn(count, state.lang)}{state.lang === 'bn' ? 'টি স্লট খোলা' : ' slots open'}
    </span>
  );
}
