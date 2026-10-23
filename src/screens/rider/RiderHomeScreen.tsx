import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame, EmptyState } from '../../components/layout/PageFrame';
import { useCurrentRider } from '../../components/shared/RiderBits';
import type { Order } from '../../types';
import {
  todayOrders, isActiveOrder, fmtTk, toBnDigits, areaName, SLOT_META, latestOrderDay,
} from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function fmtDayBadge(isoDay: string, lang: string): string {
  const [, m, d] = isoDay.split('-').map(Number);
  if (lang !== 'bn') return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}`;
  return `${toBnDigits(d, 'bn')} ${BN_MONTHS[m - 1]}`;
}

function fmtTimeBn(iso: string, lang: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  let h = dt.getHours();
  const min = String(dt.getMinutes()).padStart(2, '0');
  const period = h < 5 ? 'রাত' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকেল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
  h = h % 12 === 0 ? 12 : h % 12;
  if (lang !== 'bn') return `${h}:${min} ${dt.getHours() >= 12 ? 'PM' : 'AM'}`;
  return `${period} ${toBnDigits(`${h}:${min}`, 'bn')}`;
}

/**
 * F4 Rider home + F5 Today's deliveries — strict replica of designs
 * r1.4 (portal header with GPS + battery telemetry, on-duty card,
 * আজকের কাজ 2×2 stats, পরবর্তী ডেলিভারি featured card, helpline
 * card) and r2.1 (grouped lists: চলতি কাজ in-progress cards,
 * পরবর্তী ডেলিভারি upcoming-assigned cards, সম্পন্ন হয়েছে compact
 * cards, বাতিল ও ব্যর্থ failed cards with reason box). r2.1's own
 * page header + summary strip are not duplicated here — r1.4's
 * header + 2×2 stats fill that role on this merged screen.
 * All data/logic unchanged.
 */
export default function RiderHomeScreen() {
  const { state, unreadCount } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const rider = useCurrentRider();
  const [onDuty, setOnDuty] = useState(true);

  const myOrders = useMemo(
    () => state.orders.filter(o => o.riderId === rider?.id),
    [state.orders, rider?.id],
  );
  const todays = useMemo(() => todayOrders(myOrders), [myOrders]);
  const active = todays.filter(isActiveOrder);
  const deliveredToday = todays.filter(o => o.status === 'delivered');
  const failedToday = todays.filter(o => o.status === 'failed' || o.status === 'cancelled');
  const earningsToday = deliveredToday.reduce((s, o) => s + o.deliveryFee, 0);
  const nextOrder = active[0];
  const restActive = active.slice(1);
  const inProgress = restActive.filter(o => o.status === 'buying' || o.status === 'on-the-way');
  const upcoming = restActive.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const todayKey = latestOrderDay(myOrders);

  const firstName = (bn ? rider?.nameBn : rider?.name)?.split(' ')[0] ?? '';
  const riderArea = rider?.areaId ? areaName(state.areas, rider.areaId, lang) : bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar';

  // Stat card tones copy design r1.4 card-by-card.
  const stats: {
    label: string; sub: string; value: string; icon: string;
    box: string; headTone: string; iconTone: string; valueTone: string; subTone: string; bold: boolean;
  }[] = [
    {
      label: 'নিয়োগ পেয়েছেন', sub: 'Assigned', value: toBnDigits(todays.length, lang), icon: 'assignment',
      box: 'border-outline-variant/40', headTone: 'text-on-surface-variant', iconTone: 'text-primary',
      valueTone: 'text-on-surface', subTone: 'text-on-surface-variant', bold: false,
    },
    {
      label: 'সম্পন্ন', sub: 'Done', value: toBnDigits(deliveredToday.length, lang), icon: 'check_circle',
      box: 'border-primary/40 bg-primary/[0.02]', headTone: 'text-primary', iconTone: 'text-primary',
      valueTone: 'text-primary', subTone: 'text-primary/80', bold: true,
    },
    {
      label: 'ব্যর্থ', sub: 'Failed', value: toBnDigits(failedToday.length, lang), icon: 'cancel',
      box: 'border-outline-variant/40', headTone: 'text-outline', iconTone: 'text-outline',
      valueTone: 'text-on-surface-variant', subTone: 'text-outline', bold: false,
    },
    {
      label: 'আজকের আয়', sub: 'Earned', value: fmtTk(earningsToday, lang), icon: 'payments',
      box: 'border-2 border-secondary-container/50 bg-secondary-fixed/10', headTone: 'text-secondary', iconTone: 'text-secondary',
      valueTone: 'text-secondary', subTone: 'text-secondary', bold: true,
    },
  ];

  const pickupLine = (o: Order): string => {
    // OrderItem carries no restaurant id in the data model, so
    // restaurant pickups use the generic label (as before).
    const restItem = o.items.find(i => i.source === 'restaurant');
    if (restItem) return bn ? 'পিকআপ: রেস্টুরেন্ট' : 'Pickup: Restaurant';
    return bn ? 'পিকআপ: গোশালা বাজার কাঁচাবাজার' : 'Pickup: Goshala Bazar';
  };

  const isRestaurantOrder = (o: Order): boolean => o.items.some(i => i.source === 'restaurant');

  /** Second grid cell of the r2.1 job cards — source-aware per design. */
  const itemsCell = (o: Order) => {
    const rest = isRestaurantOrder(o);
    return (
      <div className="bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{rest ? 'restaurant' : 'shopping_basket'}</span>
        <div>
          <span className="block text-bilingual-sub text-outline">{rest ? (bn ? 'পণ্য (Restaurant)' : 'Items (Restaurant)') : (bn ? 'আইটেম বিবরণ' : 'Item details')}</span>
          <span className="text-label-md text-on-surface">
            {toBnDigits(o.items.length, lang)}{bn ? 'টি আইটেম' : ' items'}{rest ? (bn ? ' (খাবার)' : ' (food)') : ''}
          </span>
        </div>
      </div>
    );
  };

  const windowCell = (o: Order, withWindowWord: boolean) => (
    <div className="bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>
      <div>
        <span className="block text-bilingual-sub text-outline">{bn ? `বিতরণ সময়${withWindowWord ? ' (Window)' : ''}` : 'Delivery window'}</span>
        <span className="text-label-md text-on-surface">{bn ? SLOT_META[o.timeSlot].rangeBn : SLOT_META[o.timeSlot].rangeEn}</span>
      </div>
    </div>
  );

  const cardHeader = (o: Order, badge: React.ReactNode) => (
    <div className="flex items-start justify-between gap-2 border-b border-outline-variant/30 pb-2.5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-label-lg font-bold text-on-surface">#{o.id}</span>
          <span className="text-bilingual-sub text-outline">·</span>
          <span className="text-label-md text-on-surface-variant font-medium">গ্রাহক: {o.customerName}</span>
        </div>
        <p className="text-bilingual-sub text-outline">{bn ? 'Customer' : 'গ্রাহক'}: {o.customerName}</p>
      </div>
      {badge}
    </div>
  );

  const locationBlock = (o: Order, iconTone: string) => (
    <div className="flex items-start gap-2">
      <span className={clsx('material-symbols-outlined mt-0.5 text-[20px]', iconTone)}>location_on</span>
      <div>
        <p className="text-body-md text-on-surface font-semibold">{o.deliveryAddress}</p>
        <p className="text-bilingual-sub text-outline">{areaName(state.areas, o.deliveryAreaId, bn ? 'en' : 'bn')}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header — design r1.4 */}
      <header className="bg-surface-container-lowest/95 px-4 py-2 border-b border-outline-variant/30 shrink-0">
        <div className="flex items-center justify-between text-body-sm text-on-surface-variant pb-1.5 border-b border-outline-variant/20 mb-2">
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <span className="text-headline-sm tracking-tight text-primary">Jovro</span>
            <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">রাইডার</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">gps_fixed</span>
              <span className="text-[11px] font-bold">GPS সচল</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface">
              <span className="material-symbols-outlined text-[16px]">battery_full</span>
              <span className="text-[11px] font-bold">{toBnDigits('92%', lang)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full ring-2 ring-primary ring-offset-2 bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-headline-sm font-bold text-primary">{firstName.slice(0, 1)}</span>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-surface-container-lowest" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-headline-sm text-on-surface leading-tight font-semibold">
                {bn ? `আসসালামু আলাইকুম, ${firstName}` : `Hello, ${rider?.name ?? ''}`}
              </h1>
              <span className="text-bilingual-sub text-on-surface-variant">{bn ? `Hello, ${rider?.name ?? ''}` : 'Assalamu Alaikum'}</span>
              <div className="inline-flex items-center gap-1 mt-0.5 text-primary text-[11px] font-bold">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span>{bn ? 'রাইডার' : 'Rider'}: {riderArea}</span>
              </div>
            </div>
          </div>
          <button
            aria-label="Notifications"
            onClick={() => navigate('/rider/notifications')}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface relative shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-secondary-container rounded-full ring-2 ring-surface-container-lowest" />}
          </button>
        </div>
      </header>

      <PageFrame>
        <div className="flex flex-col gap-4 py-3">
          {/* On-duty card — design r1.4 (toggle is a demo visual state) */}
          <section className="bg-surface-container-lowest rounded-xl p-3 border-2 border-primary shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  {onDuty && <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />}
                  <span className={clsx(
                    'text-label-md font-bold px-2.5 py-0.5 rounded-full',
                    onDuty ? 'text-primary bg-primary/10' : 'text-on-surface-variant bg-surface-container',
                  )}>
                    {onDuty ? '● সক্রিয় / On Duty' : '● বন্ধ / Off Duty'}
                  </span>
                </div>
                <h2 className="text-headline-sm text-on-surface font-bold">
                  {onDuty ? 'আজ কাজের জন্য উপলব্ধ আছি' : 'আজ কাজের জন্য উপলব্ধ নেই'}
                </h2>
                <p className="text-bilingual-sub text-on-surface-variant mt-0.5">
                  {onDuty ? 'Available for work today (Online)' : 'Not available for work today (Offline)'}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={onDuty}
                aria-label="On duty"
                onClick={() => setOnDuty(v => !v)}
                className={clsx(
                  'w-16 h-9 rounded-full p-1 relative flex items-center cursor-pointer transition-colors shadow-inner shrink-0',
                  onDuty ? 'bg-primary' : 'bg-surface-container-highest',
                )}
              >
                <span className={clsx(
                  'w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center transform transition-transform text-primary',
                  onDuty ? 'translate-x-7' : 'translate-x-0 text-on-surface-variant',
                )}>
                  <span className="material-symbols-outlined text-[18px] font-bold">{onDuty ? 'check' : 'close'}</span>
                </span>
              </button>
            </div>
          </section>

          {/* Today's work — design r1.4 */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-sm text-on-surface font-bold">আজকের কাজ</h3>
                <p className="text-bilingual-sub text-on-surface-variant">Today's work summary</p>
              </div>
              <span className="text-label-sm text-primary font-bold bg-primary/10 px-2 py-1 rounded">
                আজ: {fmtDayBadge(todayKey, lang)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => (
                <div key={s.label} className={clsx('bg-surface-container-lowest p-3 rounded-xl border shadow-sm flex flex-col justify-between', s.box)}>
                  <div className={clsx('flex items-center justify-between mb-2', s.headTone)}>
                    <span className={clsx('text-label-md', s.bold && 'font-bold')}>{s.label}</span>
                    <span className={clsx('material-symbols-outlined text-[22px]', s.iconTone)}>{s.icon}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={clsx('text-headline-lg font-bold', s.valueTone)}>{s.value}</span>
                    <span className={clsx('text-bilingual-sub', s.subTone)}>{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {todays.length === 0 ? (
            <EmptyState
              icon="local_shipping"
              title={bn ? 'আজ কোনো ডেলিভারি নেই' : 'No deliveries today'}
              body={bn ? 'নতুন অর্ডার অ্যাসাইন হলে এখানে দেখা যাবে।' : 'New assigned orders will appear here.'}
            />
          ) : (
            <>
              {/* Next delivery — design r1.4 featured card */}
              {nextOrder && (
                <section className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-secondary-container" />
                      <h3 className="text-headline-sm text-on-surface font-bold">পরবর্তী ডেলিভারি</h3>
                    </div>
                    <span className="text-label-sm font-bold bg-secondary-fixed text-on-secondary-fixed-variant px-2.5 py-1 rounded-full uppercase tracking-wider">
                      নতুন অ্যাসাইনমেন্ট
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl border-2 border-primary/80 shadow-md p-3 flex flex-col gap-3">
                    <div className="flex items-start justify-between border-b border-outline-variant/30 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                          <h4 className="text-headline-sm text-on-surface font-bold">{nextOrder.customerName}</h4>
                        </div>
                        <p className="text-bilingual-sub text-on-surface-variant pl-6">#{nextOrder.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-secondary-fixed text-on-secondary-fixed-variant text-label-md px-3 py-1 rounded-full font-bold">
                          ফি {fmtTk(nextOrder.deliveryFee, lang)}
                        </span>
                        <div className="text-[11px] text-on-surface-variant font-medium mt-0.5">ক্যাশ অন ডেলিভারি</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 bg-surface-container-low/60 p-3 rounded-lg border border-outline-variant/20">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">storefront</span>
                        <div className="text-body-sm text-on-surface">
                          <span className="font-bold block">{pickupLine(nextOrder)}</span>
                          <span className="text-on-surface-variant text-[12px]">
                            {toBnDigits(nextOrder.items.length, lang)}{bn ? 'টি আইটেম' : ' items'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 pt-1.5 border-t border-outline-variant/20">
                        <span className="material-symbols-outlined text-secondary-container text-[20px] shrink-0 mt-0.5">pin_drop</span>
                        <div className="text-body-sm text-on-surface">
                          <span className="font-bold block">{bn ? 'গন্তব্য' : 'Destination'}: {nextOrder.deliveryAddress}</span>
                          <span className="text-on-surface-variant text-[12px]">{areaName(state.areas, nextOrder.deliveryAreaId, lang)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                        <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                        <span>{bn ? SLOT_META[nextOrder.timeSlot].rangeBn : SLOT_META[nextOrder.timeSlot].rangeEn}</span>
                      </div>
                      <a
                        href={`tel:${nextOrder.customerMobile}`}
                        className="inline-flex items-center gap-1 text-primary bg-primary/10 px-3 py-1.5 rounded-full font-bold text-label-md"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        <span>কল করুন</span>
                      </a>
                    </div>
                    <button
                      onClick={() => navigate(`/rider/orders/${nextOrder.id}`)}
                      className="w-full h-14 bg-primary text-white rounded-full flex items-center justify-center gap-3 shadow-lg shadow-primary/25 text-headline-sm font-bold mt-1 active:scale-[0.98] transition-transform"
                    >
                      <span className="material-symbols-outlined text-[26px]">directions_bike</span>
                      <span>ডেলিভারি শুরু করুন</span>
                      <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                    </button>
                  </div>
                </section>
              )}

              {/* In hand — design r2.1 in-progress cards */}
              {inProgress.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pt-1">
                    <h2 className="text-label-md text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-secondary-container">near_me</span>
                      চলতি কাজ (In Hand)
                    </h2>
                    <span className="text-bilingual-sub text-secondary-container font-semibold">
                      {toBnDigits(inProgress.length, lang)}টি সক্রিয়
                    </span>
                  </div>
                  {inProgress.map(o => (
                    <article
                      key={o.id}
                      className="bg-surface-container-lowest rounded-2xl p-3.5 border-2 border-secondary-container shadow-md relative overflow-hidden"
                    >
                      <div className="absolute -right-8 -top-8 w-20 h-20 bg-secondary-fixed/40 rounded-full blur-xl pointer-events-none" />
                      {cardHeader(o, (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-primary text-label-sm font-semibold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          কাজ চলছে / In progress
                        </span>
                      ))}
                      <div className="py-2.5 flex flex-col gap-2">
                        {locationBlock(o, 'text-secondary-container')}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {windowCell(o, true)}
                          {itemsCell(o)}
                        </div>
                      </div>
                      <div className="mt-1 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between">
                        <div>
                          <span className="text-bilingual-sub text-outline">উপার্জন / Pay</span>
                          <div className="text-label-lg text-primary font-bold">ডেলিভারি ফি {fmtTk(o.deliveryFee, lang)}</div>
                        </div>
                        <button
                          onClick={() => navigate(`/rider/orders/${o.id}`)}
                          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-secondary-container text-white font-label-md font-bold shadow-sm active:scale-95 transition-transform"
                        >
                          <span>কাজে যান / Continue</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              {/* Upcoming assigned — design r2.1 assigned cards */}
              {upcoming.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-label-md text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">assignment</span>
                      পরবর্তী ডেলিভারি (Upcoming Assigned)
                    </h2>
                    <span className="text-bilingual-sub text-outline font-medium">
                      {toBnDigits(upcoming.length, lang)}টি বাকি
                    </span>
                  </div>
                  {upcoming.map(o => (
                    <article
                      key={o.id}
                      className="bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/50 shadow-sm"
                    >
                      {cardHeader(o, (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface border border-outline-variant/40 text-label-sm font-semibold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                          নিয়োগ পেয়েছেন / Assigned
                        </span>
                      ))}
                      <div className="py-2.5 flex flex-col gap-2">
                        {locationBlock(o, 'text-outline')}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {windowCell(o, false)}
                          {itemsCell(o)}
                        </div>
                      </div>
                      <div className="mt-1 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between">
                        <div>
                          <span className="text-bilingual-sub text-outline">ফি / Payout</span>
                          <div className="text-label-lg text-primary font-bold">ডেলিভারি ফি {fmtTk(o.deliveryFee, lang)}</div>
                        </div>
                        <button
                          onClick={() => navigate(`/rider/orders/${o.id}`)}
                          className="inline-flex items-center gap-1 px-3.5 h-9 rounded-full border border-primary text-primary font-label-md font-semibold active:scale-95 transition-transform"
                        >
                          <span>ম্যাপ দেখুন / Map</span>
                          <span className="material-symbols-outlined text-[16px]">directions</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              )}

              {/* Delivered — design r2.1 compact cards */}
              {deliveredToday.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-label-md text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                      সম্পন্ন হয়েছে (Delivered)
                    </h2>
                    <span className="text-label-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {toBnDigits(deliveredToday.length, lang)}টি সম্পন্ন · {fmtTk(earningsToday, lang)}
                    </span>
                  </div>
                  {deliveredToday.map(o => (
                    <button
                      key={o.id}
                      onClick={() => navigate(`/rider/orders/${o.id}`)}
                      className="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/30 flex flex-col gap-2 text-left w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-label-md font-bold text-on-surface">#{o.id}</span>
                          <span className="text-outline">·</span>
                          <span className="text-body-md text-on-surface">{o.customerName}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          সম্পন্ন / Delivered
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline">pin_drop</span>
                          <span>{areaName(state.areas, o.deliveryAreaId, lang)}</span>
                        </div>
                        <span className="text-bilingual-sub text-outline">{fmtTimeBn(o.updatedAt, lang)}</span>
                      </div>
                      <div className="pt-1 border-t border-outline-variant/20 flex items-center justify-between text-label-sm">
                        <span className="text-on-surface-variant">পেমেন্ট মেথড: ক্যাশ অন ডেলিভারি</span>
                        <span className="font-bold text-primary text-label-md">ফি {fmtTk(o.deliveryFee, lang)}</span>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Failed / cancelled — design r2.1 failed cards */}
              {failedToday.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-label-md text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-error">cancel</span>
                      বাতিল ও ব্যর্থ (Unsuccessful)
                    </h2>
                    <span className="text-bilingual-sub text-error font-medium">
                      {toBnDigits(failedToday.length, lang)}টি ব্যর্থ ডেলিভারি
                    </span>
                  </div>
                  {failedToday.map(o => {
                    const isFailed = o.status === 'failed';
                    return (
                      <article
                        key={o.id}
                        onClick={() => navigate(`/rider/orders/${o.id}`)}
                        className="bg-surface-container-lowest bg-error-container/10 rounded-2xl p-3.5 border border-error/20 flex flex-col gap-2 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-label-md font-bold text-on-surface">#{o.id}</span>
                              <span className="text-outline">·</span>
                              <span className="text-body-md text-on-surface">{o.customerName}</span>
                            </div>
                            <p className="text-bilingual-sub text-outline">
                              {o.customerName} · {areaName(state.areas, o.deliveryAreaId, bn ? 'en' : 'bn')}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-label-sm font-bold shrink-0">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            {isFailed ? 'ব্যর্থ / Failed' : 'বাতিল / Cancelled'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-lowest border border-error/20 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-error">
                            <span className="material-symbols-outlined text-[18px]">error_outline</span>
                            <span className="text-body-sm font-medium">
                              {o.failReason ?? (isFailed ? 'গ্রাহক অনুপস্থিত / Customer unreachable' : 'অর্ডার বাতিল হয়েছে / Order cancelled')}
                            </span>
                          </div>
                          <span className="text-label-md font-bold text-outline">ফি {fmtTk(0, lang)}</span>
                        </div>
                        <div className="flex items-center justify-between text-bilingual-sub text-outline pt-0.5">
                          <span>{isFailed ? 'রিপোর্ট দাখিল' : 'বাতিল হয়েছে'}: {fmtTimeBn(o.updatedAt, lang)}</span>
                          <span className="text-tertiary underline font-medium">বিস্তারিত রিভিউ</span>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          )}

          {/* Helpline card — design r1.4 */}
          <section className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">help_center</span>
              </div>
              <div>
                <div className="text-body-md font-bold text-on-surface">রাইডার হেল্পলাইন লালমনিরহাট</div>
                <div className="text-bilingual-sub text-on-surface-variant">যেকোনো সমস্যায় হাব কন্ট্রোলারের সাথে কথা বলুন</div>
              </div>
            </div>
            <a
              href={OPERATOR.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Dispatcher"
              className="w-10 h-10 rounded-full bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]">chat</span>
            </a>
          </section>
        </div>
      </PageFrame>
    </div>
  );
}
