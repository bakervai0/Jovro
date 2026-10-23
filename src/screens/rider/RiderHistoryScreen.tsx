import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageFrame, EmptyState } from '../../components/layout/PageFrame';
import { useCurrentRider } from '../../components/shared/RiderBits';
import {
  dayKey, latestOrderDay, fmtTk, toBnDigits, STATUS_META,
} from '../../services/orderUtils';
import type { Order } from '../../types';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function fmtDayTitle(day: string, lang: 'bn' | 'en'): string {
  const d = new Date(`${day}T00:00:00`);
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${toBnDigits(d.getDate(), 'bn')} ${BN_MONTHS[d.getMonth()]}, ${toBnDigits(d.getFullYear(), 'bn')}`;
}

function fmtTime(iso: string, lang: 'bn' | 'en'): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return lang === 'bn'
    ? `${toBnDigits(h, 'bn')}:${toBnDigits(String(m).padStart(2, '0'), 'bn')} ${ampm}`
    : `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * F6 — Delivery history, aligned to Stitch r2.2: rider strip,
 * week/month summary cards, then a day-by-day expandable log of
 * every assigned order (rows open the F9 detail).
 */
export default function RiderHistoryScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const lang = state.lang;
  const rider = useCurrentRider();

  const mine = useMemo(
    () => state.orders
      .filter(o => o.riderId === rider?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.orders, rider?.id],
  );

  const anchor = latestOrderDay(state.orders);
  const anchorDate = new Date(`${anchor}T00:00:00`);
  const inLastDays = (iso: string, days: number) => {
    const d = new Date(`${dayKey(iso)}T00:00:00`);
    const diff = Math.round((anchorDate.getTime() - d.getTime()) / 86400000);
    return diff >= 0 && diff < days;
  };
  const weekList = mine.filter(o => inLastDays(o.createdAt, 7));
  const monthList = mine.filter(o => dayKey(o.createdAt).slice(0, 7) === anchor.slice(0, 7));
  const weekDone = weekList.filter(o => o.status === 'delivered');
  const weekFailed = weekList.filter(o => o.status === 'failed' || o.status === 'cancelled');
  const weekEarned = weekDone.reduce((s, o) => s + o.deliveryFee, 0);
  const monthDone = monthList.filter(o => o.status === 'delivered');
  const monthEarned = monthDone.reduce((s, o) => s + o.deliveryFee, 0);
  const finishedWeek = weekDone.length + weekFailed.length;
  const weekPct = finishedWeek > 0 ? Math.round((weekDone.length / finishedWeek) * 100) : 0;

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    mine.forEach(o => {
      const k = dayKey(o.createdAt);
      map.set(k, [...(map.get(k) ?? []), o]);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [mine]);

  const [openDay, setOpenDay] = useState<string | null>(null);
  const effectiveOpen = openDay ?? groups[0]?.[0];

  const riderInitial = (bn ? rider?.nameBn : rider?.name)?.trim().charAt(0) ?? 'র';

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* r2.2 header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
          <div>
            <h1 className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight leading-tight">
              Jovro {bn ? 'রাইডার পোর্টাল' : 'Rider Portal'}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant -mt-0.5">
              {bn ? 'ডেলিভারি হিস্ট্রি ও খতিয়ান / Delivery History' : 'Delivery History & Ledger'}
            </p>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="text-label-md font-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/40"
        >
          বাংলা | EN
        </button>
      </header>

      {/* Rider strip */}
      <div className="bg-surface-container-lowest px-4 pt-3 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-body-lg ring-2 ring-primary/20 shrink-0">
            {riderInitial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-body-md font-body-md font-bold text-on-surface truncate">
                {bn ? rider?.nameBn : rider?.name}
              </span>
              <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
              Lalmonirhat Sadar Hub • {bn ? 'আইডি' : 'ID'} #{rider?.id.replace('rider-', 'JVR-')}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 bg-surface-container-low text-primary text-label-sm font-label-sm px-2.5 py-1 rounded-full border border-primary/20 font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {bn ? 'অন-ডিউটি' : 'On duty'}
        </span>
      </div>

      <PageFrame>
        {/* Week / month summary cards */}
        <section className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-surface-container-lowest rounded-xl p-3 border-2 border-secondary-container/40 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-label-md font-label-md text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">date_range</span>
                  {bn ? 'এই সপ্তাহ' : 'This week'}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">This week</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-md font-headline-md font-bold text-on-surface">{toBnDigits(weekDone.length, lang)}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">{bn ? 'টা ডেলিভারি' : 'deliveries'}</span>
              </div>
              <p className="text-body-md font-body-md text-primary font-bold">{bn ? 'আয়' : 'Earned'} {fmtTk(weekEarned, lang)}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/30">
              <div className="flex justify-between text-bilingual-sub font-bilingual-sub text-on-surface-variant mb-1">
                <span>{bn ? 'লক্ষ্যমাত্রা' : 'Completion'}</span>
                <span className="font-bold text-on-surface">{toBnDigits(weekPct, lang)}% {bn ? 'সম্পন্ন' : 'done'}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${weekPct}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-3 border-2 border-secondary-container/40 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-label-md font-label-md text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">calendar_month</span>
                  {bn ? 'এই মাস' : 'This month'}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">This month</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-md font-headline-md font-bold text-on-surface">{toBnDigits(monthDone.length, lang)}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">{bn ? 'টা ডেলিভারি' : 'deliveries'}</span>
              </div>
              <p className="text-body-md font-body-md text-primary font-bold">{bn ? 'আয়' : 'Earned'} {fmtTk(monthEarned, lang)}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'রেটিং স্কোর' : 'Rating score'}</span>
              <span className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/40">
                <span className="material-symbols-outlined text-[14px] text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-label-md font-label-md font-bold text-on-surface">{toBnDigits((rider?.rating ?? 0).toFixed(1), lang)}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Day-by-day log */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold">{bn ? 'দৈনিক ডেলিভারি লগ' : 'Daily delivery log'}</h2>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Day-by-day delivery log list</p>
          </div>
          <span className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1 text-label-sm font-label-sm text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">tune</span>
            {bn ? 'সব ফিল্টার' : 'All filters'}
          </span>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon="history"
            title={bn ? 'কোনো ইতিহাস নেই' : 'No history yet'}
            body={bn ? 'সব ডেলিভারি এখানে দিন অনুযায়ী জমা হবে।' : 'All deliveries will collect here day by day.'}
          />
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {groups.map(([day, orders]) => {
              const done = orders.filter(o => o.status === 'delivered');
              const failed = orders.filter(o => o.status === 'failed' || o.status === 'cancelled');
              const active = orders.filter(o => !['delivered', 'failed', 'cancelled'].includes(o.status));
              const earned = done.reduce((s, o) => s + o.deliveryFee, 0);
              const isToday = day === anchor;
              const open = effectiveOpen === day;
              return (
                <article key={day} className={`bg-surface-container-lowest rounded-xl border-2 shadow-sm overflow-hidden ${isToday ? 'border-primary/40' : 'border-outline-variant/30'}`}>
                  <button
                    onClick={() => setOpenDay(open ? '' : day)}
                    className="w-full p-3 bg-surface-container-low/60 border-b border-outline-variant/30 flex items-center justify-between text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="bg-primary text-on-primary text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold">
                            {bn ? 'আজ / Today' : 'Today'}
                          </span>
                        )}
                        <span className="text-label-md font-label-md text-on-surface font-bold">{fmtDayTitle(day, lang)}</span>
                      </div>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="text-primary font-bold">{bn ? 'সম্পন্ন' : 'Done'} {toBnDigits(done.length, lang)}</span> •
                        <span className="text-error font-semibold">{bn ? 'ব্যর্থ' : 'Failed'} {toBnDigits(failed.length, lang)}</span> •
                        <span className="font-bold text-primary">{bn ? 'আয়' : 'Earned'} {fmtTk(earned, lang)}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-secondary">pending_actions</span>
                        {bn
                          ? `মোট ${toBnDigits(orders.length, lang)}টি নির্ধারিত${active.length > 0 ? ` (${toBnDigits(active.length, lang)}টি ডেলিভারি চলমান)` : ''}`
                          : `${orders.length} assigned${active.length > 0 ? ` (${active.length} in progress)` : ''}`}
                      </p>
                    </div>
                    <span className={`w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-primary text-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
                    </span>
                  </button>
                  {open && (
                    <div className="divide-y divide-outline-variant/20 px-3 py-1">
                      {orders.map(o => {
                        const meta = STATUS_META[o.status];
                        const chipClass = {
                          success: 'bg-primary-fixed/40 text-on-primary-fixed-variant border-primary/30',
                          warning: 'bg-secondary-fixed text-on-secondary-fixed border-secondary/30',
                          error: 'bg-error-container/60 text-on-error-container border-error/30',
                          primary: 'bg-primary/10 text-primary border-primary/30',
                          surface: 'bg-surface-container text-on-surface-variant border-outline-variant/40',
                        }[meta.variant];
                        const isRestaurant = o.items.some(i => i.source === 'restaurant');
                        return (
                          <button
                            key={o.id}
                            onClick={() => navigate(`/rider/orders/${o.id}`)}
                            className="w-full py-2.5 flex items-center justify-between text-left"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-on-surface text-label-md">#{o.id}</span>
                                <span className="text-bilingual-sub text-on-surface-variant">• {fmtTime(o.createdAt, lang)}</span>
                              </div>
                              <p className="flex items-center gap-1 text-on-surface-variant text-body-sm truncate">
                                <span className="material-symbols-outlined text-[14px] text-outline shrink-0">location_on</span>
                                <span className="truncate">
                                  {o.deliveryAddress} ({isRestaurant ? (bn ? 'খাবারের অর্ডার' : 'food order') : (bn ? 'মুদির অর্ডার' : 'grocery order')})
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5 text-right shrink-0">
                              <div>
                                <span className="block font-bold text-on-surface text-label-md">{bn ? 'ফি' : 'Fee'} {fmtTk(o.deliveryFee, lang)}</span>
                                <span className="text-[10px] text-on-surface-variant">{bn ? 'নগদ প্রদান' : 'Cash payment'}</span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded-full font-bold border ${chipClass}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                                {bn ? meta.labelBn : meta.labelEn}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </PageFrame>
    </div>
  );
}
