import React from 'react';
import { clsx } from 'clsx';

/** Green outline "যোগ করুন / Add" pill used across product cards. */
export function AddButton({
  onClick,
  labelBn = 'যোগ করুন',
  labelEn = 'Add',
  size = 'sm',
  full,
  disabled,
  className,
}: {
  onClick: () => void;
  labelBn?: string;
  labelEn?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const sizes = {
    xs: 'h-7 px-2.5 text-[11px]',
    sm: 'h-8 px-3 text-[12px]',
    md: 'h-10 px-4 text-[13px]',
    lg: 'h-12 px-5 text-[14px]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-1 rounded-full border border-primary bg-white font-semibold text-primary transition-all active:scale-95 disabled:opacity-40',
        sizes[size],
        full && 'w-full',
        className,
      )}
    >
      <span className="material-symbols-outlined text-[16px]">add</span>
      <span className="bn">
        {labelBn}
        {labelEn ? <span className="ml-1 font-normal opacity-70">{labelEn}</span> : null}
      </span>
    </button>
  );
}

/** Filled − qty + control shown once an item is in the cart. */
export function QuantityStepper({
  qty,
  onIncrease,
  onDecrease,
  size = 'sm',
  className,
}: {
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const btn = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
  }[size];
  const txt = { xs: 'text-[11px]', sm: 'text-[13px]', md: 'text-[15px]' }[size];
  const icon = { xs: 'text-[13px]', sm: 'text-[16px]', md: 'text-[20px]' }[size];

  return (
    <div className={clsx('inline-flex items-center gap-1 rounded-full bg-primary-soft p-0.5', className)}>
      <button
        type="button"
        onClick={onDecrease}
        aria-label="decrease"
        className={clsx('grid place-items-center rounded-full bg-primary-deep text-white transition-transform active:scale-90', btn)}
      >
        <span className={clsx('material-symbols-outlined', icon)}>remove</span>
      </button>
      <span className={clsx('min-w-[18px] text-center font-bold text-primary-deep', txt)}>{qty}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="increase"
        className={clsx('grid place-items-center rounded-full bg-primary-deep text-white transition-transform active:scale-90', btn)}
      >
        <span className={clsx('material-symbols-outlined', icon)}>add</span>
      </button>
    </div>
  );
}

/** Large stepper used on the product detail sheet. */
export function QuantityStepperLarge({
  qty,
  onIncrease,
  onDecrease,
}: {
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest p-1 shadow-card">
      <button
        type="button"
        onClick={onDecrease}
        className="grid h-10 w-10 place-items-center rounded-full text-on-surface active:scale-90"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
      <span className="w-9 text-center text-[17px] font-bold text-on-surface">{qty}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="grid h-10 w-10 place-items-center rounded-full bg-primary-deep text-white shadow-sm active:scale-90"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
    </div>
  );
}
