import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { IconButton } from '../ui/Button';
import { NotifBadge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function TopAppBar({
  title, subtitle, showBack, onBack, actions, className, transparent,
}: TopAppBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className={clsx(
      'flex items-center gap-3 px-4 py-2.5 h-14 sticky top-0 z-30',
      !transparent && 'border-b border-outline-variant/50 bg-surface/95 backdrop-blur',
      className,
    )}>
      {showBack && (
        <IconButton icon="arrow_back" onClick={handleBack} size="md" />
      )}
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-headline-sm font-semibold text-on-surface truncate leading-tight">{title}</h1>}
        {subtitle && <p className="text-label-sm text-on-surface-variant truncate leading-tight">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}

/** Home-style top bar with area selector + icons */
export function HomeTopBar() {
  const { state, t, unreadCount } = useApp();
  const navigate = useNavigate();
  const area = state.selectedAreaId;

  return (
    <header className="flex items-center gap-2 px-4 py-3 h-16 bg-surface sticky top-0 z-30 shadow-elevated-bar">
      {/* Logo */}
      <div className="flex items-center gap-1.5">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[18px]">local_shipping</span>
        </div>
        <span className="text-headline-sm font-bold text-primary">Jovro</span>
      </div>

      {/* Area picker */}
      <button
        onClick={() => navigate('/area')}
        className="flex-1 mx-2 flex items-center gap-1 bg-surface-container rounded-2xl px-3 py-2 min-w-0"
      >
        <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
        <span className="text-label-md text-on-surface truncate flex-1 text-left">{t('area.select')}</span>
        <span className="material-symbols-outlined text-on-surface-variant text-[16px]">expand_more</span>
      </button>

      {/* Notification */}
      <div className="relative">
        <IconButton
          icon="notifications"
          onClick={() => navigate('/notifications')}
        />
        {unreadCount > 0 && <NotifBadge count={unreadCount} />}
      </div>
    </header>
  );
}
