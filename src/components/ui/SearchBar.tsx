import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';

interface SearchBarProps {
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showMic?: boolean;
  showFilter?: boolean;
  onFilter?: () => void;
  readOnly?: boolean;
  onClick?: () => void;
  tone?: 'surface' | 'outline';
}

/** Rounded search field with clear + mic, used on home, search and catalogue. */
export function SearchBar({
  value, onChange, onSubmit, placeholder, autoFocus, className, showMic = true,
  showFilter, onFilter, readOnly, onClick, tone = 'surface',
}: SearchBarProps) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [internal, setInternal] = useState('');
  const current = value ?? internal;

  const setValue = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        onClick={onClick}
        className={clsx(
          'flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-full border px-3.5',
          tone === 'outline'
            ? 'border-primary/60 bg-surface-container-lowest shadow-card'
            : 'border-outline-variant/80 bg-surface-container-lowest',
          readOnly && 'cursor-pointer',
        )}
      >
        <span className="material-symbols-outlined flex-shrink-0 text-[21px] text-on-surface-variant">search</span>
        <input
          value={current}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSubmit?.(current); }}
          placeholder={placeholder ?? (bn ? 'কী খুঁজছেন? / Search rice, egg, biryani...' : 'Search rice, egg, biryani...')}
          readOnly={readOnly}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />
        {current.length > 0 && !readOnly && (
          <button
            type="button"
            onClick={() => { setValue(''); onSubmit?.(''); }}
            aria-label="clear"
            className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        )}
        {showMic && (
          <>
            <span className="h-5 w-px flex-shrink-0 bg-outline-variant" />
            <button type="button" onClick={() => onSubmit?.(current)} aria-label={bn ? 'ভয়েস সার্চ' : 'Voice search'} className="flex-shrink-0">
              <span className="material-symbols-outlined text-[21px] text-primary">mic</span>
            </button>
          </>
        )}
      </div>

      {showFilter && (
        <button
          onClick={onFilter}
          className="grid h-[46px] w-[46px] flex-shrink-0 place-items-center rounded-2xl border border-outline-variant/80 bg-surface-container-lowest"
          aria-label="filter"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
        </button>
      )}
    </div>
  );
}
