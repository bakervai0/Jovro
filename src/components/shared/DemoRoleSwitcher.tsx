import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

const ROLES: { role: UserRole; labelBn: string; labelEn: string; icon: string; color: string }[] = [
  { role: 'customer', labelBn: 'গ্রাহক', labelEn: 'Customer', icon: 'person', color: 'bg-primary/12 text-primary border-primary' },
  { role: 'rider', labelBn: 'রাইডার', labelEn: 'Rider', icon: 'directions_bike', color: 'bg-secondary/12 text-secondary border-secondary' },
  { role: 'affiliate', labelBn: 'অ্যাফিলিয়েট', labelEn: 'Affiliate', icon: 'share', color: 'bg-tertiary/12 text-tertiary border-tertiary' },
  { role: 'staff', labelBn: 'স্টাফ', labelEn: 'Staff', icon: 'badge', color: 'bg-warning/12 text-warning border-warning' },
  { role: 'admin', labelBn: 'অ্যাডমিন', labelEn: 'Admin', icon: 'admin_panel_settings', color: 'bg-error/12 text-error border-error' },
];

export function DemoRoleSwitcher() {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const lang = state.lang;

  const current = ROLES.find(r => r.role === state.role) ?? ROLES[0];

  const switchRole = (role: UserRole) => {
    dispatch({ type: 'SET_ROLE', role });
    setExpanded(false);
    // Navigate to home after role switch — done via router in screen
    window.location.href = '/';
  };

  return (
    <div className="rounded-3xl border-2 border-dashed border-outline-variant overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4"
      >
        <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">science</span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-label-md font-semibold text-on-surface">
            {lang === 'bn' ? 'ডেমো মোড' : 'Demo Mode'}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {lang === 'bn'
              ? `বর্তমান ভূমিকা: ${current.labelBn}`
              : `Current role: ${current.labelEn}`}
          </p>
        </div>
        <span className={clsx(
          'material-symbols-outlined text-on-surface-variant transition-transform',
          expanded && 'rotate-180',
        )}>expand_more</span>
      </button>

      {/* Role list */}
      {expanded && (
        <div className="border-t border-outline-variant/40 grid grid-cols-5 p-3 gap-2">
          {ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={clsx(
                'flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all',
                state.role === r.role ? r.color : 'border-transparent bg-surface-container',
              )}
            >
              <span className={clsx(
                'material-symbols-outlined text-[20px]',
                state.role === r.role ? '' : 'text-on-surface-variant',
              )}>{r.icon}</span>
              <span className="text-[9px] font-medium leading-tight text-center">
                {lang === 'bn' ? r.labelBn : r.labelEn}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
