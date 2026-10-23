import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import {
  AdminCard, Icon, PageTitle, SectionHead, StatusBadge, fmtTk, toBnDigits, useBn,
} from './adminShared';
import { todayOrders, isActiveOrder, areaName } from '../../services/orderUtils';

// H1 + H2 — Admin home / overview.
// Built from designs: 1._admin_home_dashboard_jovro (greeting,
// shop-open strip, 4 stat cards, "দ্রুত ব্যবস্থাপনা" quick-action
// grid, নতুন অর্ডার list) and a1.1_admin_overview_jovro
// (approvals alert, "দৈনিক পরিসংখ্যান" metrics, 8-module grid,
// লাইভ রাইডার স্ট্যাটাস). The big quick-search box (H17) sits
// under the heading, styled after qs2._admin_quick_search_lookup.
export default function AdminHome() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const [query, setQuery] = useState('');

  const todays = todayOrders(state.orders);
  const pendingCount = todays.filter(o => o.status === 'pending').length;
  const deliveredToday = todays.filter(o => o.status === 'delivered');
  const deliveryIncome = deliveredToday.reduce((s, o) => s + o.deliveryFee, 0);
  const activeRiders = state.riders.filter(r => r.status === 'active');
  const newOrders = [...state.orders]
    .filter(o => isActiveOrder(o))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);
  const pendingRiders = state.riders.filter(r => r.status === 'pending');
  const pendingAffiliates = state.affiliates.filter(a => a.status === 'pending');
  const pendingTotal = pendingRiders.length + pendingAffiliates.length;

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    const order = state.orders.find(o => o.id.toLowerCase() === q.toLowerCase());
    if (order) navigate(`/admin/orders/${order.id}`); // H19 — straight to detail
    else navigate(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  const stats = [
    { icon: 'shopping_basket', labelBn: 'আজকের অর্ডার', labelEn: "Today's Orders", value: toBnDigits(todays.length, lang), subBn: `+${toBnDigits(pendingCount, lang)} নতুন অর্ডার`, subEn: `${pendingCount} new orders`, iconCls: 'text-primary bg-primary/10' },
    { icon: 'payments', labelBn: 'ডেলিভারি আয়', labelEn: 'Delivery Income', value: fmtTk(deliveryIncome, lang), subBn: 'পণ্য মার্জিন শূন্য', subEn: 'Zero product margin', iconCls: 'text-emerald-700 bg-emerald-100' },
    { icon: 'pending_actions', labelBn: 'অপেক্ষমাণ অর্ডার', labelEn: 'Pending Orders', value: toBnDigits(todays.filter(o => isActiveOrder(o)).length, lang), subBn: 'রাইডার অ্যাসাইন প্রয়োজন', subEn: 'Rider assignment needed', iconCls: 'text-amber-700 bg-amber-100' },
    { icon: 'two_wheeler', labelBn: 'সক্রিয় রাইডার', labelEn: 'Active Riders', value: toBnDigits(activeRiders.length, lang), subBn: 'সদর জোন ডিউটিতে উপস্থিত', subEn: 'On duty in Sadar zone', iconCls: 'text-tertiary bg-tertiary/10' },
  ];

  const quickActions = [
    { icon: 'inventory', labelBn: 'নতুন পণ্য', labelEn: 'Add Product', path: '/admin/products/new' },
    { icon: 'storefront', labelBn: 'রেস্টুরেন্ট যোগ', labelEn: 'Add Eatery', path: '/admin/restaurants?new=1' },
    { icon: 'local_offer', labelBn: 'প্রোমো কোড', labelEn: 'Promo Code', path: '/admin/promotions' },
    { icon: 'bolt', labelBn: 'ফ্ল্যাশ সেল', labelEn: 'Flash Sale', path: '/admin/promotions' },
    { icon: 'campaign', labelBn: 'নোটিফিকেশন', labelEn: 'Push Alert', path: '/admin/notifications' },
    { icon: 'analytics', labelBn: 'আজকের রিপোর্ট', labelEn: "Today's Report", path: '/admin/reports' },
  ];

  const modules = [
    { icon: 'receipt_long', labelBn: 'অর্ডার', labelEn: 'Orders', path: '/admin/orders' },
    { icon: 'delivery_dining', labelBn: 'রাইডার', labelEn: 'Riders', path: '/admin/riders' },
    { icon: 'handshake', labelBn: 'অ্যাফিলিয়েট', labelEn: 'Affiliates', path: '/admin/affiliates' },
    { icon: 'account_balance_wallet', labelBn: 'পেমেন্ট', labelEn: 'Payouts', path: '/admin/payouts' },
    { icon: 'inventory_2', labelBn: 'ক্যাটালগ', labelEn: 'Catalogue', path: '/admin/products' },
    { icon: 'local_offer', labelBn: 'অফার', labelEn: 'Offers', path: '/admin/promotions' },
    { icon: 'group', labelBn: 'কাস্টমার', labelEn: 'Customers', path: '/admin/customers' },
    { icon: 'settings', labelBn: 'সেটিংস', labelEn: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting — design 1 */}
      <div>
        <h2 className="text-headline-md font-bold text-on-surface">
          {bn ? 'আসসালামু আলাইকুম, অ্যাডমিন সাহেব' : 'Assalamu Alaikum, Admin'}
        </h2>
        <p className="text-label-md text-on-surface-variant mt-0.5">
          {bn ? 'Admin Dashboard • লালমনিরহাট জোন ১' : 'Admin Dashboard • Lalmonirhat Zone 1'}
          <span className="ml-2 inline-flex items-center gap-1 text-primary font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            {bn ? 'লাইভ হাব' : 'Live Hub'}
          </span>
        </p>
      </div>

      {/* Shop open strip — designs 1 + a1.1 */}
      <div className={clsx(
        'rounded-2xl px-4 py-3 flex items-center gap-3 border',
        state.isServiceOpen ? 'bg-primary/8 border-primary/30' : 'bg-error/8 border-error/30',
      )}>
        <Icon name="storefront" className={state.isServiceOpen ? 'text-primary' : 'text-error'} />
        <p className="text-body-md font-semibold text-on-surface flex-1">
          {state.isServiceOpen
            ? (bn ? 'দোকান খোলা আছে' : 'Shop is open')
            : (bn ? 'দোকান বন্ধ আছে' : 'Shop is closed')}
          <span className="block text-label-sm font-normal text-on-surface-variant">
            {state.isServiceOpen
              ? (bn ? 'Shop is open (অর্ডার গ্রহণ চালু)' : 'Accepting orders')
              : (bn ? 'অর্ডার গ্রহণ বন্ধ' : 'Not accepting orders')}
          </span>
        </p>
        <button
          onClick={() => navigate('/admin/settings')}
          className="text-label-md font-semibold text-primary"
        >
          {bn ? 'নিয়ন্ত্রণ' : 'Controls'}
        </button>
      </div>

      {/* H17 quick-search box (qs2 design) */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-3 shadow-card">
        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
          <Icon name="search" className="text-on-surface-variant text-[20px]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSearch()}
            placeholder={bn ? 'অর্ডার আইডি, কাস্টমার আইডি বা মোবাইল লিখুন' : 'Type an Order ID, Customer ID or mobile'}
            className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
          />
          <button onClick={submitSearch} className="text-label-md font-bold text-primary flex-shrink-0">
            {bn ? 'খুঁজুন' : 'Search'}
          </button>
        </div>
        <div className="flex gap-2 mt-2.5">
          {[
            { icon: 'receipt_long', bn: 'অর্ডার আইডি / Order ID', en: 'Order ID' },
            { icon: 'badge', bn: 'কাস্টমার আইডি / Customer ID', en: 'Customer ID' },
            { icon: 'phone_android', bn: 'মোবাইল / Mobile', en: 'Mobile' },
          ].map(c => (
            <span key={c.icon} className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant bg-surface-container rounded-full px-2 py-1">
              <Icon name={c.icon} className="text-[13px]" />{bn ? c.bn : c.en}
            </span>
          ))}
        </div>
      </div>

      {/* Approvals alert — a1.1 */}
      {pendingTotal > 0 && (
        <button
          onClick={() => navigate('/admin/approvals')}
          className="text-left rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3"
        >
          <Icon name="notification_important" className="text-amber-600 text-[26px]" />
          <span className="flex-1 min-w-0">
            <span className="block text-body-md font-bold text-on-surface">
              {bn ? 'অনুমোদনের অপেক্ষায়' : 'Awaiting approval'} · {toBnDigits(pendingTotal, lang)} {bn ? 'টি বাকি' : 'pending'}
            </span>
            <span className="block text-label-md text-on-surface-variant mt-0.5">
              {bn
                ? `${toBnDigits(pendingRiders.length, lang)} রাইডার + ${toBnDigits(pendingAffiliates.length, lang)} অ্যাফিলিয়েট আবেদন পর্যালোচনার জন্য জমা আছে`
                : `${pendingRiders.length} rider + ${pendingAffiliates.length} affiliate applications are waiting`}
            </span>
            <span className="block text-label-md text-primary font-semibold mt-1">
              {bn ? 'আবেদন দেখতে ট্যাপ করুন (Review applications)' : 'Tap to review applications'}
            </span>
          </span>
          <Icon name="chevron_right" className="text-on-surface-variant" />
        </button>
      )}

      {/* Stat cards — design 1 / a1.1 "দৈনিক পরিসংখ্যান · Today's Metrics" */}
      <SectionHead icon="analytics" titleBn="দৈনিক পরিসংখ্যান · Today's Metrics" titleEn="Daily statistics · Today's Metrics" />
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <AdminCard key={s.labelEn} className="p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-label-md font-semibold text-on-surface-variant">{bn ? s.labelBn : s.labelEn}</p>
              <span className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', s.iconCls)}>
                <Icon name={s.icon} className="text-[18px]" />
              </span>
            </div>
            <p className="text-headline-md font-bold text-on-surface mt-1.5">{s.value}</p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">{bn ? s.subBn : s.subEn}</p>
          </AdminCard>
        ))}
      </div>

      {/* H2 quick actions — design 1 "দ্রুত ব্যবস্থাপনা / Quick Actions" */}
      <SectionHead icon="bolt" titleBn="দ্রুত ব্যবস্থাপনা" titleEn="Quick Actions" />
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(a => (
          <button
            key={a.labelEn}
            onClick={() => navigate(a.path)}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-card active:scale-[0.98] transition-transform"
          >
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name={a.icon} className="text-primary text-[20px]" />
            </span>
            <span className="text-label-md font-semibold text-on-surface text-center leading-tight">{bn ? a.labelBn : a.labelEn}</span>
            <span className="text-[10px] text-on-surface-variant leading-tight">{bn ? a.labelEn : a.labelBn}</span>
          </button>
        ))}
      </div>

      {/* Management modules — a1.1 "কুইক অ্যাকশন · Management Modules" */}
      <SectionHead
        icon="grid_view"
        titleBn="কুইক অ্যাকশন · Management Modules"
        titleEn="Quick action · Management Modules"
        right={<span className="text-label-sm text-on-surface-variant">{toBnDigits(modules.length, lang)}{bn ? 'টি বিভাগ' : ' sections'}</span>}
      />
      <div className="grid grid-cols-4 gap-2.5">
        {modules.map(m => (
          <button
            key={m.labelEn}
            onClick={() => navigate(m.path)}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl py-3 px-1 flex flex-col items-center gap-1 shadow-card active:scale-[0.98] transition-transform"
          >
            <Icon name={m.icon} className="text-primary text-[22px]" />
            <span className="text-label-sm font-semibold text-on-surface leading-tight text-center">{bn ? m.labelBn : m.labelEn}</span>
            <span className="text-[9px] text-on-surface-variant leading-tight">{bn ? m.labelEn : m.labelBn}</span>
          </button>
        ))}
      </div>

      {/* New orders needing action — design 1 "নতুন অর্ডার" */}
      <SectionHead
        icon="receipt_long"
        titleBn="নতুন অর্ডার"
        titleEn="New Orders"
        right={
          <button onClick={() => navigate('/admin/orders')} className="text-label-md font-semibold text-primary inline-flex items-center">
            {bn ? 'সবগুলো দেখুন' : 'See all'}<Icon name="chevron_right" className="text-[16px]" />
          </button>
        }
      />
      <div className="flex flex-col gap-2.5">
        {newOrders.map(o => (
          <AdminCard key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
            <div className="flex items-center gap-2">
              <p className="text-body-md font-bold text-on-surface">#{o.id}</p>
              <StatusBadge status={o.status} />
              {o.hasComplaint && (
                <span className="inline-flex items-center gap-1 text-label-sm font-bold text-secondary">
                  <Icon name="report_problem" className="text-[14px]" />{bn ? 'অভিযোগ' : 'Complaint'}
                </span>
              )}
              <span className="ml-auto text-body-md font-bold text-on-surface">{fmtTk(o.finalTotal, lang)}</span>
            </div>
            <p className="text-body-sm text-on-surface mt-1.5">{o.customerName}</p>
            <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
              <Icon name="location_pin" className="text-[14px]" />
              {areaName(state.areas, o.deliveryAreaId, lang)} • {toBnDigits(o.items.length, lang)}{bn ? 'টি পণ্য' : ' items'}
            </p>
            <p className="text-label-md font-semibold text-primary mt-2 inline-flex items-center gap-1">
              <Icon name={o.riderId ? 'visibility' : 'assignment_ind'} className="text-[16px]" />
              {o.riderId ? (bn ? 'দেখুন / View' : 'View') : (bn ? 'দেখুন ও রাইডার দিন / View & Assign' : 'View & Assign')}
            </p>
          </AdminCard>
        ))}
        {newOrders.length === 0 && (
          <p className="text-body-md text-on-surface-variant text-center py-4">
            {bn ? 'নতুন কোনো অর্ডার নেই' : 'No new orders'}
          </p>
        )}
      </div>

      {/* Live rider status — a1.1 "লাইভ রাইডার স্ট্যাটাস / Active Couriers" */}
      <SectionHead
        icon="moped"
        titleBn="লাইভ রাইডার স্ট্যাটাস"
        titleEn="Live Rider Status"
        right={<span className="text-label-sm text-on-surface-variant">{toBnDigits(activeRiders.length, lang)} {bn ? 'জন অন-ডিউটি' : 'on duty'}</span>}
      />
      <AdminCard className="flex flex-col gap-3">
        {activeRiders.map(r => {
          const busy = state.orders.some(o => o.riderId === r.id && o.status === 'on-the-way');
          const doneToday = todays.filter(o => o.riderId === r.id && o.status === 'delivered').length;
          return (
            <div key={r.id} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold flex-shrink-0">
                {(bn ? r.nameBn : r.name).charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{bn ? r.nameBn : r.name}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {areaName(state.areas, r.areaId ?? '', lang)} · {toBnDigits(doneToday, lang)}{bn ? 'টি ডেলিভারি শেষ' : ' deliveries done'}
                </p>
              </div>
              <span className={clsx(
                'text-label-sm font-semibold px-2 py-1 rounded-full',
                busy ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
              )}>
                {busy ? (bn ? 'ব্যস্ত (On Delivery)' : 'Busy') : (bn ? 'ফ্রি (Available)' : 'Available')}
              </span>
            </div>
          );
        })}
        {activeRiders.length === 0 && (
          <p className="text-body-md text-on-surface-variant">{bn ? 'সক্রিয় রাইডার নেই' : 'No active riders'}</p>
        )}
      </AdminCard>

      <p className="text-center text-label-sm text-on-surface-variant/70 pb-1">
        {bn ? 'জোভ্রো পার্সোনাল শপার ডেলিভারি • লালমনিরহাট সদর হাব এডমিন প্ল্যাটফর্ম' : 'Jovro Personal Shopper Delivery • Lalmonirhat Sadar Hub Admin Platform'}
      </p>
    </div>
  );
}
