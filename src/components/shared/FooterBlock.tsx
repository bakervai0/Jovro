import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';

/**
 * D13 — Footer block at the very bottom of the Profile screen.
 * Every row opens its own page (D14–D20); the Facebook row is external.
 */
export function FooterBlock() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const rows: { icon: string; labelBn: string; labelEn: string; path?: string; href?: string }[] = [
    { icon: 'info', labelBn: 'আমাদের সম্পর্কে', labelEn: 'About', path: '/about' },
    { icon: 'call', labelBn: 'যোগাযোগ', labelEn: 'Contact Us', path: '/contact' },
    { icon: 'help', labelBn: 'সাহায্য ও জিজ্ঞাসা', labelEn: 'Help & FAQ', path: '/faq' },
    { icon: 'privacy_tip', labelBn: 'গোপনীয়তা নীতি', labelEn: 'Privacy Policy', path: '/privacy' },
    { icon: 'description', labelBn: 'শর্তাবলী', labelEn: 'Terms & Conditions', path: '/terms' },
    { icon: 'currency_exchange', labelBn: 'রিপ্লেসমেন্ট ও রিফান্ড নীতি', labelEn: 'Replacement & Refund Policy', path: '/refund-policy' },
    { icon: 'local_shipping', labelBn: 'ডেলিভারি ফি তালিকা', labelEn: 'Delivery Fee Table', path: '/delivery-fees' },
    { icon: 'thumb_up', labelBn: 'ফেসবুক পেজ', labelEn: 'Facebook Page', href: OPERATOR.facebookUrl },
  ];

  return (
    <div className="mt-6 px-4">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
        {rows.map((row, i) => (
          <React.Fragment key={row.labelEn}>
            {i > 0 && <div className="h-px bg-outline-variant/20 mx-4" />}
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{row.icon}</span>
                <span className="flex-1 text-left text-body-md text-on-surface">{bn ? row.labelBn : row.labelEn}</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">open_in_new</span>
              </a>
            ) : (
              <button
                onClick={() => row.path && navigate(row.path)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{row.icon}</span>
                <span className="flex-1 text-left text-body-md text-on-surface">{bn ? row.labelBn : row.labelEn}</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">chevron_right</span>
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-center text-label-sm text-on-surface-variant/70 py-4">
        © Jovro • লালমনিরহাট সদর • Version 1.0
      </p>
    </div>
  );
}
