import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { NotifBadge } from '../ui/Badge';

interface NavItem {
  icon: string;
  activeIcon: string;
  labelKey: string;
  path: string;
  badgeCount?: number;
}

export function CustomerBottomNav() {
  const { t, cartCount, unreadCount } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items: NavItem[] = [
    { icon: 'home', activeIcon: 'home', labelKey: 'nav.home', path: '/' },
    { icon: 'store', activeIcon: 'store', labelKey: 'nav.bazaar', path: '/bazaar' },
    { icon: 'restaurant', activeIcon: 'restaurant', labelKey: 'nav.food', path: '/food' },
    { icon: 'shopping_cart', activeIcon: 'shopping_cart', labelKey: 'nav.cart', path: '/cart', badgeCount: cartCount },
    { icon: 'person', activeIcon: 'person', labelKey: 'nav.profile', path: '/profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-on-surface-variant',
              )}
            >
              <div className="relative">
                <span className={clsx(
                  'material-symbols-outlined text-[24px]',
                  isActive && 'filled-symbol',
                )}>
                  {item.activeIcon}
                </span>
                {item.badgeCount != null && item.badgeCount > 0 && (
                  <NotifBadge count={item.badgeCount} />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function RiderBottomNav() {
  const { t, unreadCount } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items = [
    { icon: 'directions_bike', labelKey: 'nav.deliveries', path: '/rider' },
    { icon: 'history', labelKey: 'nav.history', path: '/rider/history' },
    { icon: 'account_balance_wallet', labelKey: 'nav.earnings', path: '/rider/earnings' },
    { icon: 'notifications', labelKey: 'nav.notifications', path: '/notifications', badgeCount: unreadCount },
    { icon: 'person', labelKey: 'nav.profile', path: '/rider/profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const isActive = pathname === item.path || (item.path !== '/rider' && pathname.startsWith(item.path));
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={clsx('flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors', isActive ? 'text-primary' : 'text-on-surface-variant')}>
              <div className="relative">
                <span className={clsx('material-symbols-outlined text-[24px]', isActive && 'filled-symbol')}>{item.icon}</span>
                {item.badgeCount != null && item.badgeCount > 0 && <NotifBadge count={item.badgeCount} />}
              </div>
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
