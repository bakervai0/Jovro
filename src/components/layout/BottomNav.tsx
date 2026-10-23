import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';

interface TabDef {
  path: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  match: (pathname: string) => boolean;
  badge?: number;
  dot?: boolean;
}

/** Persistent 5-tab customer navigation (হোম · বাজার · রেস্টুরেন্ট · অর্ডার · প্রোফাইল). */
export function CustomerBottomNav() {
  const { state } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const activeOrders = state.orders.filter(o =>
    ['pending', 'confirmed', 'buying', 'on-the-way'].includes(o.status),
  ).length;

  const tabs: TabDef[] = [
    { path: '/', labelBn: 'হোম', labelEn: 'Home', icon: 'home', match: p => p === '/' },
    { path: '/bazaar', labelBn: 'বাজার', labelEn: 'Bazaar', icon: 'storefront', match: p => p.startsWith('/bazaar') || p.startsWith('/product') || p.startsWith('/category') },
    { path: '/food', labelBn: 'রেস্টুরেন্ট', labelEn: 'Restaurants', icon: 'restaurant', match: p => p.startsWith('/food') },
    { path: '/orders', labelBn: 'অর্ডার', labelEn: 'Orders', icon: 'receipt_long', match: p => p.startsWith('/orders'), dot: activeOrders > 0 },
    { path: '/profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', icon: 'person', match: p => p.startsWith('/profile') || p.startsWith('/settings') },
  ];

  return (
    <nav className="bottom-nav" aria-label={bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}>
      <div className="flex h-[4.5rem] items-stretch px-1">
        {tabs.map(tab => {
          const active = tab.match(pathname);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'relative flex flex-1 flex-col items-center justify-center gap-1 pt-1 transition-colors duration-150',
                active ? 'text-primary' : 'text-on-surface/70',
              )}
            >
              <span className="relative">
                <span className={clsx('material-symbols-outlined text-[23px]', active && 'filled-symbol')}>
                  {tab.icon}
                </span>
                {tab.dot && (
                  <span className="absolute -right-1.5 -top-0.5 h-[7px] w-[7px] rounded-full border border-white bg-secondary-bright" />
                )}
              </span>
              <span className={clsx('text-[10.5px] leading-none', active ? 'font-bold' : 'font-medium')}>
                {bn ? tab.labelBn : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Rider navigation — deliveries, history, earnings, notifications, profile. */
export function RiderBottomNav() {
  const { state, unreadCount } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const items = [
    { icon: 'directions_bike', labelBn: 'ডেলিভারি', labelEn: 'Deliveries', path: '/rider' },
    { icon: 'history', labelBn: 'ইতিহাস', labelEn: 'History', path: '/rider/history' },
    { icon: 'account_balance_wallet', labelBn: 'আয়', labelEn: 'Earnings', path: '/rider/earnings' },
    { icon: 'notifications', labelBn: 'নোটিফিকেশন', labelEn: 'Alerts', path: '/rider/notifications' },
    { icon: 'person', labelBn: 'প্রোফাইল', labelEn: 'Profile', path: '/rider/profile' },
  ];

  return (
    <nav className="bottom-nav" aria-label={bn ? 'রাইডার নেভিগেশন' : 'Rider navigation'}>
      <div className="flex h-[4.5rem] items-stretch px-1">
        {items.map(item => {
          const active = pathname === item.path || (item.path !== '/rider' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'relative flex flex-1 flex-col items-center justify-center gap-1 pt-1',
                active ? 'text-primary' : 'text-on-surface/70',
              )}
            >
              <span className="relative">
                <span className={clsx('material-symbols-outlined text-[23px]', active && 'filled-symbol')}>{item.icon}</span>
                {item.path === '/rider/notifications' && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-0.5 h-2 w-2 rounded-full bg-secondary-bright" />
                )}
              </span>
              <span className={clsx('text-[10.5px] leading-none', active ? 'font-bold' : 'font-medium')}>
                {bn ? item.labelBn : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
