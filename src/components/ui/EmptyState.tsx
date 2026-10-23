import React from 'react';
import { clsx } from 'clsx';

export function EmptyState({
  icon, emoji, title, subtitle, action, className, tone = 'surface',
}: {
  icon?: string;
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: 'surface' | 'card';
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-8 py-10 text-center',
        tone === 'card' && 'rounded-3xl border border-outline-variant/60 bg-surface-container-lowest',
        className,
      )}
    >
      <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-primary-soft">
        {emoji ? (
          <span className="text-[38px]">{emoji}</span>
        ) : (
          <span className="material-symbols-outlined text-[38px] text-primary">{icon ?? 'inventory_2'}</span>
        )}
      </div>
      <h3 className="text-[17px] font-bold leading-snug text-on-surface bn">{title}</h3>
      {subtitle && <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-on-surface-variant bn">{subtitle}</p>}
      {action && <div className="mt-5 w-full">{action}</div>}
    </div>
  );
}

/** Thin dashed divider with optional label. */
export function DashedDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="h-px flex-1 border-t border-dashed border-outline-variant" />
      {label && <span className="text-[10.5px] font-medium text-on-surface-variant">{label}</span>}
      <span className="h-px flex-1 border-t border-dashed border-outline-variant" />
    </div>
  );
}
