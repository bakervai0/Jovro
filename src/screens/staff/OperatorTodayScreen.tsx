import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame, EmptyState } from '../../components/layout/PageFrame';
import type { Order } from '../../types';
import {
  todayOrders, nextStatus, STATUS_META, SLOT_META, areaName, fmtTk, toBnDigits, uid,
} from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

type Filter = 'all' | 'active' | 'new' | 'done';

const ACTIVE: Order['status'][] = ['confirmed', 'buying', 'on-the-way'];

/**
 * G1 — Today's orders for the operator, aligned to Stitch 21:
 * green stats header, filter tabs, and status-styled order cards
 * with one-tap advance (UPDATE_ORDER + tracking + activity log).
 */
export default function OperatorTodayScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [filter, setFilter] = useState<Filter>('all');

  const todays = useMemo(
    () => todayOrders(state.orders).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.orders],
  );

  const counts = {
    all: todays.length,
    new: todays.filter(o => o.status === 'pending').length,
    active: todays.filter(o => ACTIVE.includes(o.status)).length,
    done: todays.filter(o => o.status === 'delivered').length,
  };
  const filtered = todays.filter(o =>
    filter === 'all' ? true
    : filter === 'new' ? o.status === 'pending'
    : filter === 'active' ? ACTIVE.includes(o.status)
    : o.status === 'delivered',
  );

  const anchorMs = todays.length ? new Date(todays[todays.length - 1].createdAt).getTime() : Date.now();
  const relLabel = (iso: string) => {
    const mins = Math.max(0, Math.round((anchorMs - new Date(iso).getTime()) / 60000));
    const time = new Date(iso).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' });
    if (mins <= 1) return bn ? `মাত্র এখনই (${time})` : `Just now (${time})`;
    if (mins < 60) return bn ? `মাত্র ${toBnDigits(mins, lang)} মিনিট আগে (${time})` : `${mins} min ago (${time})`;
    return time;
  };

  const advance = (order: Order) => {
    const next = nextStatus(order);
    if (!next) return;
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_ORDER',
      order: {
        ...order,
        status: next,
        updatedAt: now,
        trackingUpdates: [...order.trackingUpdates, {
          id: uid('trk'),
          status: next,
          messageBn: STATUS_META[next].labelBn,
          messageEn: STATUS_META[next].labelEn,
          timestamp: now,
        }],
      },
    });
    dispatch({
      type: 'LOG_ACTIVITY',
      entry: {
        id: uid('act'),
        actorName: state.user?.nameBn ?? state.user?.name ?? 'অপারেটর',
        action: `অর্ডার ${order.id}-এর স্ট্যাটাস "${STATUS_META[next].labelBn}" করেছেন`,
        at: now,
        category: 'order',
      },
    });
  };

  const tabs: { id: Filter; labelBn: string; labelEn: string; count: number }[] = [
    { id: 'all', labelBn: 'সব', labelEn: 'All', count: counts.all },
    { id: 'active', labelBn: 'চলমান', labelEn: 'Active', count: counts.active },
    { id: 'new', labelBn: 'নতুন', labelEn: 'New', count: counts.new },
    { id: 'done', labelBn: 'সম্পন্ন', labelEn: 'Done', count: counts.done },
  ];

  const stripFor = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return { cls: 'bg-secondary-fixed text-on-secondary-fixed', icon: 'notifications_active', label: bn ? 'নতুন অর্ডার আসছে (Urgent Alert)' : 'New order (Urgent Alert)', pill: null as string | null };
      case 'confirmed':
        return { cls: 'bg-amber-100 text-on-secondary-container border-b border-amber-200', icon: 'check_circle', label: bn ? 'অর্ডার নিশ্চিত হয়েছে (Confirmed)' : 'Order confirmed', pill: bn ? 'চলমান' : 'Active' };
      case 'buying':
        return { cls: 'bg-amber-100 text-on-secondary-container border-b border-amber-200', icon: 'shopping_basket', label: bn ? '🛒 ২. বাজারে কেনা হচ্ছে (Buying at Bazaar)' : 'Buying at Bazaar', pill: bn ? 'চলমান' : 'Active' };
      case 'on-the-way':
        return { cls: 'bg-emerald-50 text-primary border-b border-emerald-200', icon: 'directions_bike', label: bn ? '🚴 ৪. সাইকেলে রওনা হয়েছে (On the way)' : 'On the way', pill: bn ? 'চলমান' : 'Active' };
      case 'delivered':
        return { cls: 'bg-emerald-50 text-primary border-b border-emerald-200', icon: 'task_alt', label: bn ? 'ডেলিভারি সম্পন্ন (Delivered)' : 'Delivered', pill: bn ? 'সম্পন্ন' : 'Done' };
      case 'failed':
        return { cls: 'bg-error-container/60 text-on-error-container', icon: 'error', label: bn ? 'ডেলিভারি ব্যর্থ (Failed)' : 'Delivery failed', pill: null };
      case 'cancelled':
        return { cls: 'bg-error-container/60 text-on-error-container', icon: 'cancel', label: bn ? 'বাতিল হয়েছে (Cancelled)' : 'Cancelled', pill: null };
      default:
        return { cls: 'bg-surface-container text-on-surface-variant', icon: 'receipt', label: bn ? STATUS_META[order.status].labelBn : STATUS_META[order.status].labelEn, pill: null };
    }
  };

  return (
    <PageFrame>
      {/* Green operator header (design 21) */}
      <div className="bg-primary text-on-primary rounded-2xl mt-4 px-4 pt-3 pb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold">
              <span className="material-symbols-outlined text-[20px]">pedal_bike</span>
            </span>
            <div>
              <h1 className="text-headline-sm font-headline-sm font-bold tracking-tight text-white leading-none">
                {bn ? 'অপারেটর মোড / Operator Mode' : 'Operator Mode'}
              </h1>
              <p className="text-bilingual-sub font-bilingual-sub text-primary-fixed opacity-95 mt-0.5">
                {bn ? "আজকের অর্ডার (Today's Orders)" : "Today's Orders"} • {state.user?.nameBn ?? state.user?.name ?? ''}
              </p>
            </div>
          </div>
          <span className="bg-primary-container border border-primary-fixed/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
            <span className="text-label-sm font-label-sm font-bold text-white tracking-wide">{bn ? 'অন-ডিউটি' : 'On duty'}</span>
          </span>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center justify-between border border-white/15 text-white">
          <div className="text-center flex-1 border-r border-white/20 pr-1">
            <span className="text-label-sm font-label-sm block opacity-80">{bn ? 'মোট অর্ডার' : 'Total orders'}</span>
            <span className="text-headline-sm font-headline-sm font-bold text-primary-fixed">{toBnDigits(counts.all, lang)} {bn ? 'টি' : ''}</span>
          </div>
          <div className="text-center flex-1 border-r border-white/20 px-1">
            <span className="text-label-sm font-label-sm block opacity-80">{bn ? 'সম্পন্ন' : 'Done'}</span>
            <span className="text-headline-sm font-headline-sm font-bold text-white">{toBnDigits(counts.done, lang)} {bn ? 'টি' : ''}</span>
          </div>
          <div className="text-center flex-1 pl-1">
            <span className="text-label-sm font-label-sm block text-amber-200 font-bold">{bn ? 'চলমান' : 'Active'}</span>
            <span className="text-headline-sm font-headline-sm font-bold text-secondary-fixed">{toBnDigits(counts.active + counts.new, lang)} {bn ? 'টি' : ''}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs (design 21) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3" role="tablist">
        {tabs.map(tab => {
          const selected = filter === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                'flex-shrink-0 min-h-[48px] px-4 rounded-xl font-label-lg text-label-lg flex items-center gap-1.5 active:scale-95 transition-all',
                tab.id === 'new' && counts.new > 0
                  ? 'bg-secondary text-on-secondary font-bold shadow-sm'
                  : selected
                    ? 'bg-primary text-on-primary font-bold shadow-md ring-2 ring-primary/30'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/50 shadow-sm',
              )}
            >
              {tab.id === 'new' && counts.new > 0 && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              {bn ? tab.labelBn : tab.labelEn}
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-label-sm font-bold',
                (tab.id === 'new' && counts.new > 0) || selected ? 'bg-white/25 text-white' : 'bg-surface-container-high text-on-surface',
              )}>
                {toBnDigits(tab.count, lang)}{tab.id === 'active' ? ' [Active]' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title={bn ? 'এই তালিকায় অর্ডার নেই' : 'No orders in this list'}
          body={bn ? 'নতুন অর্ডার এলে এখানে দেখা যাবে।' : 'New orders will appear here.'}
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {filtered.map(order => {
            const strip = stripFor(order);
            const slot = SLOT_META[order.timeSlot];
            const next = nextStatus(order);
            const hasBazaar = order.items.some(i => i.source === 'bazaar');
            const restaurants = [...new Set(order.items.filter(i => i.source === 'restaurant').map(i => i.nameEn))];
            const rider = order.riderId ? state.riders.find(r => r.id === order.riderId) : undefined;
            return (
              <article
                key={order.id}
                className={clsx(
                  'bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden transition-all',
                  order.status === 'pending' ? 'border-2 border-secondary shadow-md' : 'border-2 border-outline-variant/60',
                )}
              >
                <div className={clsx('px-3.5 py-1.5 flex items-center justify-between font-label-md text-label-md', strip.cls)}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] shrink-0">{strip.icon}</span>
                    <span className="font-bold truncate">{strip.label}</span>
                  </div>
                  {order.status === 'pending' ? (
                    <span className="text-bilingual-sub font-bilingual-sub bg-white/70 px-2 py-0.5 rounded-md font-bold shrink-0">
                      {relLabel(order.createdAt)}
                    </span>
                  ) : strip.pill ? (
                    <span className={clsx(
                      'text-label-sm font-label-sm font-bold px-2 py-0.5 rounded shrink-0',
                      order.status === 'on-the-way' || order.status === 'delivered' ? 'bg-primary text-white' : 'bg-white text-secondary border border-amber-300',
                    )}>
                      {strip.pill}
                    </span>
                  ) : null}
                </div>

                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-outline-variant/30 pb-2">
                    <div>
                      {order.status === 'pending' && (
                        <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider text-secondary block">{bn ? 'অর্ডার আইডি' : 'Order ID'}</span>
                      )}
                      <button onClick={() => navigate(`/staff/orders/${order.id}`)} className="text-headline-sm font-headline-sm font-bold text-on-surface text-left">
                        #{order.id}{order.status === 'pending' ? (bn ? ' • নতুন অর্ডার (New)' : ' • New order') : ''}
                      </button>
                      {rider && (
                        <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">
                          {bn ? 'রাইডার' : 'Rider'}: {bn ? rider.nameBn : rider.name}
                        </span>
                      )}
                    </div>
                    {order.status === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 border border-secondary/30 text-secondary text-label-sm font-bold shrink-0">
                        {bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-orange-50 text-secondary font-bold text-label-sm border border-secondary/20 shrink-0">
                        {bn ? 'ফি' : 'Fee'} {fmtTk(order.deliveryFee, lang)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'গ্রাহকের নাম:' : 'Customer:'}</span>
                      <p className="text-headline-sm font-headline-sm font-bold text-on-surface leading-tight truncate">{order.customerName}</p>
                    </div>
                    <a
                      href={`tel:${order.customerMobile}`}
                      aria-label={`Call ${order.customerName}`}
                      className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-primary active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                      <span className="material-symbols-outlined text-[24px]">call</span>
                    </a>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">location_on</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-lg font-body-lg font-bold text-on-surface leading-snug">
                        📍 {order.deliveryAddress} ({areaName(state.areas, order.deliveryAreaId, lang)})
                      </p>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                        {bn ? `স্লট: ${slot.rangeBn} (Delivery Slot)` : `Slot: ${slot.rangeEn} (Delivery Slot)`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-2.5 text-body-md font-body-md">
                    <div className="flex items-center gap-1.5 text-primary font-bold text-label-md mb-1">
                      <span className="material-symbols-outlined text-[18px]">storefront</span>
                      <span>
                        {bn ? 'কিনতে হবে: ' : 'Buy from: '}
                        {[hasBazaar ? (bn ? 'গোশালা বাজার কাঁচাবাজার' : 'Goshala Bazar') : null, ...restaurants].filter(Boolean).join(' + ')}
                      </span>
                    </div>
                    <p className="text-on-surface font-medium leading-relaxed pl-6">
                      {bn ? `${toBnDigits(order.items.length, lang)}টি আইটেম` : `${order.items.length} items`} ({order.items.map(i => (bn ? i.nameBn : i.nameEn)).join(', ')})
                    </p>
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-body-md font-body-md text-on-surface-variant">
                        {order.status === 'pending' ? (bn ? 'আনুমানিক মূল্য (Collect Cash):' : 'Approx. total (Collect Cash):') : (bn ? 'আনুমানিক মোট:' : 'Approx. total:')}
                      </span>
                      <span className={clsx('font-bold', order.status === 'pending' ? 'text-headline-md font-headline-md text-primary' : 'text-headline-sm font-headline-sm text-on-surface')}>
                        {fmtTk(order.finalTotal, lang)}
                      </span>
                    </div>
                    {order.status === 'pending' && next && (
                      <button
                        onClick={() => { advance(order); navigate(`/staff/orders/${order.id}`); }}
                        className="w-full h-[54px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span>{bn ? 'অর্ডার গ্রহণ করুন ও বিস্তারিত দেখুন / Accept & View' : 'Accept & View'}</span>
                        <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                      </button>
                    )}
                    {order.status === 'buying' && (
                      <button
                        onClick={() => navigate(`/staff/orders/${order.id}`)}
                        className="w-full h-[52px] rounded-xl bg-surface-container-highest text-on-surface font-label-lg text-label-lg font-bold border-2 border-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-primary">edit_note</span>
                        <span>{bn ? 'অর্ডারের কাজ চালিয়ে যান / Continue Order ➔' : 'Continue Order ➔'}</span>
                      </button>
                    )}
                    {order.status === 'on-the-way' && next && (
                      <button
                        onClick={() => advance(order)}
                        className="w-full h-[52px] rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[22px]">verified</span>
                        <span>{bn ? 'ডেলিভারি কনফার্ম করুন / Confirm Delivery' : 'Confirm Delivery'}</span>
                      </button>
                    )}
                    {(order.status === 'confirmed') && next && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/staff/orders/${order.id}`)}
                          className="flex-1 py-2.5 rounded-xl border-2 border-outline-variant/60 text-label-md font-semibold text-on-surface"
                        >
                          {bn ? 'বিবরণ' : 'Details'}
                        </button>
                        <button
                          onClick={() => advance(order)}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-label-md font-semibold flex items-center justify-center gap-1.5"
                        >
                          {bn ? STATUS_META[next].labelBn : STATUS_META[next].labelEn}
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Control room support (design 21) */}
      <div className="bg-surface-container-lowest border border-error/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm mt-4">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </span>
          <div>
            <p className="text-label-lg font-label-lg font-bold text-on-surface leading-snug">{bn ? 'কন্ট্রোল রুম সাপোর্ট' : 'Control room support'}</p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'যেকোনো সমস্যায় সরাসরি কল দিন' : 'Call directly for any problem'}</p>
          </div>
        </div>
        <a
          href={OPERATOR.phoneTel}
          className="h-11 px-3.5 rounded-xl bg-error text-on-error font-label-md text-label-md font-bold flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
          <span>{bn ? 'কল করুন' : 'Call'}</span>
        </a>
      </div>
    </PageFrame>
  );
}
