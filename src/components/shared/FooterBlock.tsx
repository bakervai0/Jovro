import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits } from '../../services/orderUtils';

/**
 * D13 — Footer block at the very bottom of the Profile screen,
 * composed to Stitch f1.1: brand header row, bilingual link rows
 * (Bangla label + English sub-label on the right), Facebook row,
 * and the version line. The delivery-fee row carries the f1.8
 * link-state sub-line (area count + fee range, live from state).
 * Every row opens its own page (D14–D20); Facebook is external.
 */
export function FooterBlock() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const feeMin = state.areas.length ? Math.min(...state.areas.map(a => a.fee)) : 0;
  const feeMax = state.areas.length ? Math.max(...state.areas.map(a => a.fee)) : 0;

  const rows: { icon: string; labelBn: string; labelEn: string; subBn?: string; subEn?: string; path?: string; href?: string }[] = [
    { icon: 'info', labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Jovro', path: '/about' },
    { icon: 'call', labelBn: 'যোগাযোগ', labelEn: 'Contact Us', path: '/contact' },
    { icon: 'help', labelBn: 'সাহায্য ও প্রশ্ন', labelEn: 'Help and FAQ', path: '/faq' },
    { icon: 'privacy_tip', labelBn: 'গোপনীয়তা নীতি', labelEn: 'Privacy Policy', path: '/privacy' },
    { icon: 'description', labelBn: 'শর্তাবলী', labelEn: 'Terms & Conditions', path: '/terms' },
    { icon: 'currency_exchange', labelBn: 'বদলি ও রিফান্ড', labelEn: 'Refund Policy', path: '/refund-policy' },
    {
      icon: 'table_chart',
      labelBn: 'ডেলিভারি চার্জের তালিকা',
      labelEn: 'Delivery Fee Table (Lalmonirhat Sadar)',
      subBn: `${toBnDigits(state.areas.length, state.lang)}টি নির্ধারিত এলাকা • ${fmtTk(feeMin, state.lang)}–${fmtTk(feeMax, state.lang)}`,
      subEn: 'Delivery Fee Table (Lalmonirhat Sadar)',
      path: '/delivery-fees',
    },
    {
      icon: 'thumb_up',
      labelBn: 'আমাদের Facebook পেজ',
      labelEn: 'Our Facebook page & community',
      subEn: 'Our Facebook page & community',
      href: OPERATOR.facebookUrl,
    },
  ];

  return (
    <div className="mt-6 px-4">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
        {/* Brand header (f1.1) */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-surface-container-low/60 border-b border-outline-variant/20">
          <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[22px]">pedal_bike</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-label-lg font-bold text-on-surface leading-tight">Jovro</p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
              {bn ? 'বাজার আর খাবার, ঘরে বসেই' : 'Groceries and food, delivered to your door'}
            </p>
          </div>
          <span className="text-bilingual-sub font-bilingual-sub text-outline shrink-0">Groceries and food, delivered to your door</span>
        </div>

        {rows.map((row) => {
          const inner = (
            <>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">{row.icon}</span>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-body-md text-on-surface truncate">{bn ? row.labelBn : row.labelEn}</span>
                {row.subBn && bn && (
                  <span className="block text-bilingual-sub font-bilingual-sub text-primary font-medium truncate">{row.subBn}</span>
                )}
              </span>
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant/70 truncate max-w-[38%] shrink-0">
                {bn ? (row.subEn ?? row.labelEn) : row.labelBn}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] shrink-0">
                {row.href ? 'open_in_new' : 'chevron_right'}
              </span>
            </>
          );
          const cls = 'w-full flex items-center gap-3 px-4 py-3 active:bg-surface-container transition-colors border-t border-outline-variant/15 first:border-t-0';
          return row.href ? (
            <a key={row.labelEn} href={row.href} target="_blank" rel="noreferrer" className={cls}>
              {inner}
            </a>
          ) : (
            <button key={row.labelEn} onClick={() => row.path && navigate(row.path)} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
      <p className="text-center text-label-sm text-on-surface-variant/70 py-4 flex items-center justify-center gap-1.5">
        <span>{bn ? 'সংস্করণ' : 'Version'} / Version 1.0.0</span>
        <span className="w-1 h-1 rounded-full bg-primary inline-block" />
        <span>Active Server</span>
        <span className="text-outline">• © Jovro • লালমনিরহাট সদর</span>
      </p>
    </div>
  );
}
