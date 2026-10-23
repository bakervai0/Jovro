import React from 'react';
import { TopAppBar } from './TopAppBar';

/** Shared readable layout for the info / text pages (D10, D14–D20). */
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
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar showBack title={title} subtitle={subtitle} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[28px]">{icon}</span>
          </div>
        )}
        <div className="flex flex-col gap-5 pb-8">{children}</div>
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
    <section>
      {heading && (
        <h2 className="text-title-md font-bold text-on-surface mb-1.5">{heading}</h2>
      )}
      {paragraphs?.map((p, i) => (
        <p key={i} className="text-body-md text-on-surface-variant leading-relaxed mb-2">{p}</p>
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
