import React from 'react';
import { clsx } from 'clsx';

interface PageFrameProps {
  children: React.ReactNode;
  /** Add bottom padding for bottom nav */
  withNav?: boolean;
  /** Full-bleed: no padding */
  fullBleed?: boolean;
  className?: string;
  bg?: string;
}

/** Wraps page content inside the 430px app frame */
export function PageFrame({ children, withNav = true, fullBleed, className, bg }: PageFrameProps) {
  return (
    <div className={clsx(
      'flex-1 overflow-y-auto overscroll-contain no-scrollbar',
      withNav && 'pb-20',
      !fullBleed && 'px-4',
      bg,
      className,
    )}>
      {children}
    </div>
  );
}

/** Full-screen loading spinner */
export function FullScreenLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3">
      <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
      {message && <p className="text-body-md text-on-surface-variant">{message}</p>}
    </div>
  );
}

/** Empty state */
export function EmptyState({
  icon, title, body, action,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
      <span className="material-symbols-outlined text-on-surface-variant/40 text-[64px]">{icon}</span>
      <h3 className="text-headline-sm font-semibold text-on-surface-variant">{title}</h3>
      {body && <p className="text-body-md text-on-surface-variant/70">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Divider */
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('border-t border-outline-variant/40', className)} />;
}

/** Section header */
export function SectionHeader({
  title, action, className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center justify-between py-2', className)}>
      <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
      {action}
    </div>
  );
}
