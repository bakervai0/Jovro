import React from 'react';
import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <label className={clsx('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 pointer-events-none', className)}>
      {label && <span className="text-body-md text-on-surface">{label}</span>}
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-12 h-7 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-surface-container-high',
        )}
      >
        <div className={clsx(
          'absolute top-1 w-5 h-5 rounded-full shadow-sm transition-all duration-200 bg-white',
          checked ? 'left-6' : 'left-1',
        )} />
      </div>
    </label>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  className?: string;
}

export function Chip({ label, selected, onClick, icon, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-medium transition-all border',
        selected
          ? 'bg-primary text-white border-primary'
          : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary',
        className,
      )}
    >
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      {label}
    </button>
  );
}
