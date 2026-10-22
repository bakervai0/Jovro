import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'surface';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'primary', size = 'md', dot, children, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary/12 text-primary',
    secondary: 'bg-secondary/12 text-secondary',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/12 text-warning',
    error: 'bg-error/12 text-error',
    info: 'bg-tertiary/12 text-tertiary',
    surface: 'bg-surface-container text-on-surface-variant',
  };

  if (dot) {
    return (
      <span className={clsx(
        'inline-block rounded-full',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        variant === 'error' ? 'bg-error' : variant === 'success' ? 'bg-success' : 'bg-primary',
        className,
      )} />
    );
  }

  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-label-sm',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  );
}

/** Notification count bubble */
export function NotifBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}
