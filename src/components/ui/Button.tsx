import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'full';
  loading?: boolean;
  icon?: string; // material symbol name
  iconEnd?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconEnd,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary/90',
    secondary: 'bg-secondary text-white shadow-sm hover:bg-secondary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary/8',
    ghost: 'text-primary hover:bg-primary/8',
    danger: 'bg-error text-white hover:bg-error/90',
    success: 'bg-success text-white hover:bg-success/90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-label-md h-8',
    md: 'px-4 py-2.5 text-label-lg h-11',
    lg: 'px-6 py-3 text-label-lg h-13',
    full: 'px-4 py-3 text-label-lg h-13 w-full',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      ) : null}
      {children}
      {!loading && iconEnd && (
        <span className="material-symbols-outlined text-[20px]">{iconEnd}</span>
      )}
    </button>
  );
}

/** Icon-only round button */
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}: { icon: string; size?: 'sm' | 'md' | 'lg'; variant?: 'ghost' | 'outline' | 'primary' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: 'w-8 h-8 text-[18px]', md: 'w-10 h-10 text-[22px]', lg: 'w-12 h-12 text-[24px]' };
  const variants = {
    ghost: 'text-on-surface hover:bg-surface-container-high',
    outline: 'border border-outline text-on-surface hover:bg-surface-container',
    primary: 'bg-primary text-white',
  };
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 disabled:opacity-50',
        sizes[size], variants[variant], className
      )}
      {...props}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}
