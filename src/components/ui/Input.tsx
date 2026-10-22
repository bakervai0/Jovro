import React, { useState } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  iconEnd?: string;
  onIconEndClick?: () => void;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconEnd,
  onIconEndClick,
  className,
  type,
  ...props
}: InputProps) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-label-md text-on-surface-variant font-medium">{label}</label>
      )}
      <div className={clsx(
        'flex items-center gap-2 rounded-2xl border-2 bg-surface-container-lowest px-3 transition-colors',
        error ? 'border-error' : 'border-outline-variant focus-within:border-primary',
        props.disabled && 'opacity-50',
      )}>
        {icon && (
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0">{icon}</span>
        )}
        <input
          type={actualType}
          className={clsx(
            'flex-1 py-3 bg-transparent text-body-lg text-on-surface placeholder:text-on-surface-variant/60 outline-none min-w-0',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPw ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        ) : iconEnd ? (
          <button
            type="button"
            onClick={onIconEndClick}
            className="text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">{iconEnd}</span>
          </button>
        ) : null}
      </div>
      {error && <p className="text-label-md text-error flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">error</span>{error}
      </p>}
      {!error && hint && <p className="text-label-md text-on-surface-variant">{hint}</p>}
    </div>
  );
}

/** OTP input: 4 digit boxes */
export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = value.split('').concat(Array(4).fill('')).slice(0, 4);
  const refs = Array.from({ length: 4 }, () => React.createRef<HTMLInputElement>());

  const handleChange = (idx: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = digits.map((d, i) => i === idx ? v.slice(-1) : d).join('');
    onChange(next);
    if (v && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={clsx(
            'w-14 h-14 text-center text-headline-md font-bold rounded-2xl border-2 bg-surface-container-lowest outline-none transition-colors',
            d ? 'border-primary text-primary' : 'border-outline-variant text-on-surface',
          )}
        />
      ))}
    </div>
  );
}
