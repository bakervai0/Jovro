import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { Icon, useBn } from './adminShared';
import AdminHome from './AdminHome';
import { AdminOrdersList, AdminOrderDetail } from './AdminOrders';
import { AdminProductsList, AdminProductForm } from './AdminProducts';
import { AdminRestaurants, AdminRestaurantMenu } from './AdminRestaurants';
import AdminPromotions from './AdminPromotions';
import AdminAreas from './AdminAreas';
import { AdminCustomers, AdminCustomer360 } from './AdminCustomers';
import { AdminReviews, AdminNotify, AdminReports, AdminSettings } from './AdminOps';
import { AdminProblemsList, AdminProblemDetail } from './AdminProblems';
import { AdminPeopleHub, AdminRiders, AdminAffiliates, AdminPayouts, AdminApprovals } from './AdminPeople';
import { AdminStaffList, AdminStaffForm, AdminActivity, AdminTemplates } from './AdminTeam';
import AdminSearch from './AdminSearch';

// ============================================================
// Admin section shell (Section H) — /admin/*
// Header + bottom nav follow design a1.1_admin_overview_jovro
// (Jovro · অ্যাডমিন · লালমনিরহাট সদর হাব, notifications,
// বাংলা | EN toggle; bottom nav ড্যাশবোর্ড / অর্ডার / মানুষ /
// আরও). The "আরো" landing follows a1.6_business_controls_jovro
// (মাস্টার কন্ট্রোল প্যানেল list).
// ============================================================

const NAV = [
  { path: '/admin', icon: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', match: 'home' },
  { path: '/admin/orders', icon: 'receipt_long', labelBn: 'অর্ডার', labelEn: 'Orders', match: 'orders' },
  { path: '/admin/people', icon: 'group', labelBn: 'মানুষ', labelEn: 'People', match: 'people' },
  { path: '/admin/more', icon: 'more_horiz', labelBn: 'আরো', labelEn: 'More', match: 'more' },
] as const;

const PEOPLE_PREFIXES = ['/admin/people', '/admin/riders', '/admin/affiliates', '/admin/payouts', '/admin/approvals', '/admin/customers', '/admin/staff'];

function activeSection(pathname: string): string {
  if (pathname === '/admin') return 'home';
  if (pathname.startsWith('/admin/orders')) return 'orders';
  if (PEOPLE_PREFIXES.some(p => pathname.startsWith(p))) return 'people';
  return 'more';
}

function AdminMore() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const settings = state.adminSettings;

  const rows = [
    { icon: 'inventory_2', bn: 'ক্যাটালগ ও প্রোডাক্ট', en: 'Catalogue and products', subBn: 'বাজারের দর, প্রাপ্যতা ও ক্যাটাগরি আপডেট', subEn: 'Prices, availability & categories', path: '/admin/products' },
    { icon: 'restaurant_menu', bn: 'রেস্টুরেন্ট ও মেনু', en: 'Restaurants and menus', subBn: 'স্থানীয় হোটেল ও রেস্টুরেন্ট তালিকা', subEn: 'Local hotels & restaurants', path: '/admin/restaurants' },
    { icon: 'view_carousel', bn: 'অফার ও ব্যানার', en: 'Offers and banners', subBn: 'হোমপেজ ব্যানার ও স্পেশাল প্রোমো', subEn: 'Home banners & special promos', path: '/admin/promotions' },
    { icon: 'confirmation_number', bn: 'প্রোমো কোড', en: 'Promo codes', subBn: 'ডিসকাউন্ট কুপন ও ক্যাম্পেইন তৈরি', subEn: 'Create discount coupons & campaigns', path: '/admin/promotions' },
    { icon: 'local_shipping', bn: 'এলাকাভিত্তিক ডেলিভারি চার্জ', en: 'Delivery fee per area', subBn: '১১৪টি এলাকার ডেলিভারি চার্জ চার্ট ও সম্পাদন', subEn: 'Fee chart for all 114 areas', path: '/admin/areas' },
    { icon: 'report_problem', bn: 'সমস্যার রিপোর্ট', en: 'Problem Reports', subBn: 'কাস্টমার অভিযোগ, বদলি ও রিফান্ড', subEn: 'Complaints, replacements & refunds', path: '/admin/problems' },
    { icon: 'manage_search', bn: 'কুইক সার্চ', en: 'Quick Search', subBn: 'অর্ডার আইডি, কাস্টমার আইডি বা মোবাইল দিয়ে খুঁজুন', subEn: 'Search by order ID, customer ID or mobile', path: '/admin/search' },
    { icon: 'schedule', bn: 'সার্ভিসের সময়', en: 'Service hours', subBn: settings.serviceHours, subEn: settings.serviceHours, path: '/admin/settings' },
    { icon: 'badge', bn: 'কাস্টমার তালিকা', en: 'Customer list', subBn: 'নিবন্ধিত গ্রাহক ও ঠিকানা তালিকা', subEn: 'Registered customers & addresses', path: '/admin/customers' },
    { icon: 'rate_review', bn: 'রিভিউ যাচাই', en: 'Reviews Moderation', subBn: 'কাস্টমার রিভিউ দেখা ও লুকানো', subEn: 'Review & hide customer reviews', path: '/admin/reviews' },
    { icon: 'campaign', bn: 'নোটিফিকেশন পাঠান', en: 'Send Notification', subBn: 'সবাইকে বা একটি এলাকায় পুশ পাঠান', subEn: 'Broadcast a push to everyone or one area', path: '/admin/notifications' },
    { icon: 'analytics', bn: 'দিনের হিসাব', en: 'Daily summary', subBn: 'দৈনিক আয়-ব্যয় ও ডেলিভারি সারসংক্ষেপ', subEn: 'Daily income & delivery summary', path: '/admin/reports' },
    { icon: 'groups', bn: 'টিম অ্যাক্টিভিটি লগ', en: 'Team Activity Log', subBn: 'কে কী করলো — অডিট ট্রেইল', subEn: 'Who did what — audit trail', path: '/admin/activity' },
    { icon: 'sms', bn: 'এসএমএস টেমপ্লেট', en: 'SMS Templates', subBn: 'ডেলিভারি নোটিফিকেশন ও এসএমএস টেমপ্লেট', subEn: 'Delivery notification & SMS templates', path: '/admin/templates' },
    { icon: 'settings', bn: 'সেটিংস ও নিয়ন্ত্রণ', en: 'Settings & Controls', subBn: 'মাস্টার সুইচ, স্লট ও অ্যাডমিন প্রোফাইল', subEn: 'Master switch, slots & admin profile', path: '/admin/settings' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* a1.6 header */}
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon name="admin_panel_settings" className="text-primary text-[24px]" />
        </span>
        <div className="flex-1">
          <p className="text-label-md text-on-surface-variant">{bn ? 'মাস্টার কন্ট্রোল প্যানেল' : 'Master Control Panel'}</p>
          <h2 className="text-headline-sm font-bold text-on-surface leading-tight">{bn ? 'ব্যবসা নিয়ন্ত্রণ ও সেটিংস' : 'Business Controls & Administration'}</h2>
          <p className="text-label-md text-on-surface-variant">Business Controls & Administration</p>
        </div>
        <span className="text-label-sm font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-1 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />{bn ? 'অনলাইন' : 'Online'}
        </span>
      </div>
      <p className="text-label-md text-on-surface-variant flex items-center gap-1.5 -mt-2">
        <Icon name="pin_drop" className="text-[15px]" />{bn ? 'লালমনিরহাট সদর হাব এডমিন কন্ট্রোল · সদর হাব #০১' : 'Sadar Hub Admin · Hub #01'}
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-card divide-y divide-outline-variant/25 px-4">
        {rows.map(r => (
          <button key={r.bn} onClick={() => navigate(r.path)} className="w-full flex items-center gap-3 py-3.5 text-left">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name={r.icon} className="text-primary text-[20px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-body-md font-semibold text-on-surface">{bn ? r.bn : r.en}</span>
              <span className="block text-label-md text-on-surface-variant truncate">{bn ? r.subBn : r.subEn}</span>
            </span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </button>
        ))}
      </div>

      {/* Supabase note — a1.6 */}
      <div className="rounded-2xl bg-surface-container px-4 py-3.5 flex gap-3">
        <Icon name="database" className="text-on-surface-variant text-[22px]" />
        <div className="flex-1">
          <p className="text-body-sm text-on-surface">{bn ? 'বড় সম্পাদনার কাজ Supabase টেবিল এডিটরেও করা যায়' : 'Heavy editing can also be done in the Supabase table editor'}</p>
          <p className="text-label-sm text-on-surface-variant">Heavy editing can also be done in the Supabase table editor</p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-label-md font-semibold text-on-surface-variant">
            {bn ? 'সুপাবেজ কনসোল খুলুন' : 'Open Supabase console'}<Icon name="open_in_new" className="text-[14px]" />
          </span>
        </div>
      </div>

      <DemoRoleSwitcher />
    </div>
  );
}

export default function AdminScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bn = state.lang === 'bn';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const pendingAlerts =
    state.riders.filter(r => r.status === 'pending').length +
    state.affiliates.filter(a => a.status === 'pending').length +
    state.paymentRequests.filter(p => p.status === 'pending').length +
    state.problemReports.filter(r => r.status !== 'resolved').length;
  const section = activeSection(pathname);

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* Header — a1.1 */}
      <header className="bg-surface shadow-elevated-bar px-4 pt-3 pb-2.5 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="storefront" className="text-white text-[19px]" />
          </span>
          <span className="text-headline-sm font-bold text-primary">Jovro</span>
          <span className="text-label-sm font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">
            {bn ? 'অ্যাডমিন' : 'Admin'}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={() => navigate('/admin/approvals')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface"
              aria-label={bn ? 'বিজ্ঞপ্তি' : 'Notifications'}
            >
              <Icon name="notifications" className="text-[22px]" />
              {pendingAlerts > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-0.5 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingAlerts}
                </span>
              )}
            </button>
            {/* Language toggle — design "বাংলা | EN" */}
            <span className="flex items-center rounded-full bg-surface-container px-1 py-1 text-label-md font-semibold">
              <button
                onClick={() => dispatch({ type: 'SET_LANG', lang: 'bn' })}
                className={clsx('px-2 py-0.5 rounded-full', bn ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant')}
              >
                বাংলা
              </button>
              <span className="text-outline">|</span>
              <button
                onClick={() => dispatch({ type: 'SET_LANG', lang: 'en' })}
                className={clsx('px-2 py-0.5 rounded-full', !bn ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant')}
              >
                EN
              </button>
            </span>
          </span>
        </div>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1.5">
          <Icon name="location_on" className="text-[13px] text-primary" />
          {bn ? 'লালমনিরহাট সদর হাব · Sadar Hub' : 'Lalmonirhat Sadar Hub · সদর হাব'}
        </p>
      </header>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="products" element={<AdminProductsList />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="restaurants/:id/menu" element={<AdminRestaurantMenu />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="areas" element={<AdminAreas />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/:id" element={<AdminCustomer360 />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="notifications" element={<AdminNotify />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="problems" element={<AdminProblemsList />} />
          <Route path="problems/:id" element={<AdminProblemDetail />} />
          <Route path="search" element={<AdminSearch />} />
          <Route path="people" element={<AdminPeopleHub />} />
          <Route path="riders" element={<AdminRiders />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="staff" element={<AdminStaffList />} />
          <Route path="staff/new" element={<AdminStaffForm />} />
          <Route path="staff/:id/edit" element={<AdminStaffForm />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="more" element={<AdminMore />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>

      {/* Bottom nav — a1.1 (dashboard/orders/people/more) */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV.map(item => {
            const active = section === item.match;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors',
                  active ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                <span className={clsx('material-symbols-outlined text-[24px]', active && 'filled-symbol')}>{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{bn ? item.labelBn : item.labelEn}</span>
                <span className="text-[8px] leading-none opacity-70">{bn ? item.labelEn : item.labelBn}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
