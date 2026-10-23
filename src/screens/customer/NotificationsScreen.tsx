import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { toBnDigits } from '../../services/orderUtils';
import type { AppNotification, NotificationType } from '../../types';

// ── Stitch 24 · Notifications Centre ──────────────────────────
// Design header with mark-all-read, location strip, filter
// chips (All / Orders / Offers), Today vs Earlier sections and
// rich action cards (track, review, referral code copy).

const TYPE_ICON: Record<NotificationType, string> = {
  'order-update': 'local_shipping',
  promo: 'featured_seasonal_and_gifts',
  system: 'info',
  refund: 'currency_exchange',
  delivery: 'pedal_bike',
};

const TYPE_COLOR: Record<NotificationType, string> = {
  'order-update': 'bg-primary/10 text-primary',
  promo: 'bg-[#FFF7ED] text-secondary',
  system: 'bg-surface-container text-on-surface-variant',
  refund: 'bg-emerald-50 text-primary',
  delivery: 'bg-primary/10 text-primary',
};

const ORDER_TYPES: NotificationType[] = ['order-update', 'delivery', 'refund'];

function timeAgo(iso: string, bn: boolean, lang: 'bn' | 'en'): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return bn ? 'এইমাত্র' : 'Just now';
  if (mins < 60) return bn ? `${toBnDigits(mins, lang)} মিনিট আগে` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return bn ? `${toBnDigits(hrs, lang)} ঘণ্টা আগে` : `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return bn ? `${toBnDigits(days, lang)} দিন আগে` : `${days} day${days > 1 ? 's' : ''} ago`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function NotificationsScreen() {
  const { state, dispatch, unreadCount } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [filter, setFilter] = useState<'all' | 'orders' | 'offers'>('all');
  const [copied, setCopied] = useState(false);

  // Each user only sees their own notifications + global ones.
  const myNotifications = state.notifications.filter(n => n.userId === state.user?.id || n.userId === 'all');

  const orderCount = myNotifications.filter(n => ORDER_TYPES.includes(n.type)).length;
  const offerCount = myNotifications.filter(n => !ORDER_TYPES.includes(n.type)).length;

  const filtered = useMemo(() => {
    if (filter === 'orders') return myNotifications.filter(n => ORDER_TYPES.includes(n.type));
    if (filter === 'offers') return myNotifications.filter(n => !ORDER_TYPES.includes(n.type));
    return myNotifications;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notifications, state.user?.id, filter]);

  const todayList = filtered.filter(n => isToday(n.createdAt));
  const earlierList = filtered.filter(n => !isToday(n.createdAt));
  const todayUnread = todayList.filter(n => !n.isRead).length;

  const handleClick = (notif: AppNotification) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', id: notif.id });
    if (notif.orderId) {
      navigate(state.role === 'rider' ? `/rider/orders/${notif.orderId}` : `/orders/${notif.orderId}`);
    }
  };

  const copyCode = async () => {
    if (!state.user?.referralCode) return;
    try { await navigator.clipboard.writeText(state.user.referralCode); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCard = (notif: AppNotification) => {
    const order = notif.orderId ? state.orders.find(o => o.id === notif.orderId) : undefined;
    const isReview = order?.status === 'delivered' && notif.type === 'order-update';
    const isPromo = notif.type === 'promo';
    return (
      <article
        key={notif.id}
        onClick={() => handleClick(notif)}
        className={clsx(
          'bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm relative cursor-pointer active:scale-[0.99] transition-transform',
          !notif.isRead ? 'border-2 border-primary/30' : 'border border-outline-variant/30',
        )}
      >
        {!notif.isRead && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-secondary" />}
        <div className="flex items-start gap-3">
          <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', TYPE_COLOR[notif.type])}>
            <span className="material-symbols-outlined text-[22px]">{isReview ? 'star' : TYPE_ICON[notif.type]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-label-lg font-label-lg font-bold text-on-surface leading-snug">
              {bn ? notif.titleBn : notif.titleEn}
              <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant font-normal">{bn ? notif.titleEn : notif.titleBn}</span>
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed mt-1">
              {bn ? notif.bodyBn : notif.bodyEn}
            </p>
            <div className="flex items-center gap-2 mt-2 text-bilingual-sub font-bilingual-sub text-outline flex-wrap">
              {notif.orderId && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-low font-mono">
                  <span className="material-symbols-outlined text-[12px]">tag</span>#{notif.orderId}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {timeAgo(notif.createdAt, bn, lang)}
              </span>
              {order && (
                <span className="inline-flex items-center gap-1">
                  • {bn ? 'মোট' : 'Total'} ৳{order.finalTotal}
                </span>
              )}
            </div>

            {isPromo && state.user?.referralCode && (
              <div
                className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/60"
                onClick={e => e.stopPropagation()}
              >
                <div>
                  <span className="block text-[10px] text-outline font-semibold uppercase tracking-wide">{bn ? 'আপনার রেফারেল কোড' : 'Your referral code'}</span>
                  <span className="font-mono font-bold text-primary tracking-wider">{state.user.referralCode}</span>
                </div>
                <button
                  type="button" onClick={copyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-label-sm font-bold active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">{copied ? 'done' : 'content_copy'}</span>
                  {copied ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি করুন' : 'Copy')}
                </button>
              </div>
            )}

            {notif.orderId && !isPromo && (
              <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                {order?.status === 'on-the-way' ? (
                  <span className="inline-flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                    {bn ? 'আনুমানিক ডেলিভারি: শীঘ্রই' : 'Arriving soon'}
                  </span>
                ) : <span />}
                {isReview ? (
                  <span className="flex items-center gap-2">
                    <span className="flex text-[#F97316]">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className="material-symbols-outlined text-[16px] filled-symbol">star</span>
                      ))}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      {bn ? '★ রিভিউ দিন / Leave review' : 'Leave review'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold">
                    {bn ? 'ট্র্যাক করুন / Track order' : 'Track order'}
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  const FILTERS = [
    { id: 'all' as const, bn: `সব (${toBnDigits(myNotifications.length, lang)})`, en: 'All', sub: '/ All' },
    { id: 'orders' as const, bn: `অর্ডার আপডেট (${toBnDigits(orderCount, lang)})`, en: 'Orders', sub: '/ Orders' },
    { id: 'offers' as const, bn: `অফার ও বার্তা (${toBnDigits(offerCount, lang)})`, en: 'Offers', sub: '/ Offers' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Header (Stitch 24) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1 min-w-0">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold leading-tight truncate">
                {bn ? 'বিজ্ঞপ্তি' : 'Notifications'} <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">/ Notifications</span>
              </h1>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{bn ? 'অর্ডার আপডেট ও বার্তা' : 'Order updates & messages'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md"
            >
              বাংলা | EN
            </button>
            {unreadCount > 0 && (
              <button
                type="button" onClick={() => dispatch({ type: 'MARK_ALL_READ' })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary font-label-md text-label-md font-bold active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                {bn ? 'সব পঠিত' : 'Mark all read'}
              </button>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-bilingual-sub font-bilingual-sub text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
          <span>{bn ? 'লালমনিরহাট সদর (মিশন মোড় জোন)' : 'Lalmonirhat Sadar (Mission Mor zone)'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-semibold">{bn ? 'ডেলিভারি চালু আছে' : 'Delivery active'}</span>
        </div>
        <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={clsx(
                'shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors active:scale-95',
                filter === f.id ? 'bg-primary text-on-primary font-bold shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant',
              )}
            >
              {bn ? f.bn : `${f.en} (${f.id === 'all' ? myNotifications.length : f.id === 'orders' ? orderCount : offerCount})`}{' '}
              <span className={clsx('text-[10px]', filter === f.id ? 'text-on-primary/80' : 'text-outline')}>{f.sub}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin py-space-md pb-10">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">notifications_off</span>
            <p className="text-body-lg font-medium text-on-surface-variant">{bn ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">notifications_off</span>
            <p className="text-body-lg font-medium text-on-surface-variant">{bn ? 'এই তালিকায় কিছু নেই' : 'Nothing in this list'}</p>
          </div>
        ) : (
          <div className="space-y-space-md">
            {todayList.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-label-lg font-label-lg font-bold text-on-surface">
                    {bn ? 'আজ' : 'Today'} <span className="text-bilingual-sub font-bilingual-sub text-outline font-normal">/ Today</span>
                  </h2>
                  {todayUnread > 0 && (
                    <span className="text-label-sm font-label-sm text-secondary font-bold">
                      {toBnDigits(todayUnread, lang)}{bn ? 'টি নতুন অপঠিত বিজ্ঞপ্তি' : ' new unread'}
                    </span>
                  )}
                </div>
                {todayList.map(renderCard)}
              </section>
            )}
            {earlierList.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-label-lg font-label-lg font-bold text-on-surface">
                    {bn ? 'আগে' : 'Earlier'} <span className="text-bilingual-sub font-bilingual-sub text-outline font-normal">/ Earlier</span>
                  </h2>
                  <span className="text-bilingual-sub font-bilingual-sub text-outline">{bn ? 'গত ৭ দিনের রেকর্ড' : 'Last 7 days'}</span>
                </div>
                {earlierList.map(renderCard)}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
