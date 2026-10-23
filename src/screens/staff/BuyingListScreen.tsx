import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame, EmptyState } from '../../components/layout/PageFrame';
import type { Order, OrderItem, TimeSlot } from '../../types';
import {
  todayOrders, isActiveOrder, latestOrderDay, areaName, fmtTk, toBnDigits,
} from '../../services/orderUtils';

interface MergedItem {
  key: string;
  nameBn: string;
  nameEn: string;
  unit?: string;
  categoryBn: string;
  categoryEn: string;
  categoryKey: string;
  totalQty: number;
  totalApprox: number;
  contributions: { orderId: string; customerName: string; areaId: string; qty: number; unit?: string }[];
}

const SLOT_CHIPS: { id: TimeSlot; labelBn: string; labelEn: string; icon: string }[] = [
  { id: 'morning', labelBn: 'সকালের রান', labelEn: 'Morning run', icon: 'wb_sunny' },
  { id: 'afternoon', labelBn: 'দুপুরের রান', labelEn: 'Afternoon run', icon: 'light_mode' },
  { id: 'evening', labelBn: 'বিকেলের রান', labelEn: 'Evening run', icon: 'nights_stay' },
];

const CATEGORY_ICONS: Record<string, string> = {
  'rice-pulses': 'grain',
  'oil-spices': 'soup_kitchen',
  vegetables: 'nutrition',
  'fish-meat': 'set_meal',
  'milk-eggs': 'egg',
  snacks: 'cookie',
};

import { CATEGORY_INFO } from '../../data/products';
import type { Product } from '../../types';

function categoryOf(item: OrderItem, products: Product[]) {
  // OrderItem carries no productId — match the catalogue by name.
  const p = products.find(pr => pr.nameEn.toLowerCase() === item.nameEn.toLowerCase());
  if (p) {
    const info = CATEGORY_INFO[p.category];
    if (info) return { bn: info.nameBn, en: info.nameEn, key: p.category };
  }
  return { bn: 'অন্যান্য', en: 'Others', key: 'others' };
}

/**
 * G4 — TODAY'S BAZAAR BUYING LIST (Stitch g1). All active orders
 * in the selected slot are merged into ONE shopping list: bazaar
 * items grouped by category with total quantities; restaurant
 * items listed separately as pickups. Checked state lives in this
 * component, keyed by slot + item.
 */
export default function BuyingListScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [slot, setSlot] = useState<TimeSlot>('morning');
  const [view, setView] = useState<'combined' | 'byOrder'>('combined');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allActiveToday = useMemo(
    () => todayOrders(state.orders).filter(o => isActiveOrder(o)),
    [state.orders],
  );
  const slotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of allActiveToday) counts[o.timeSlot] = (counts[o.timeSlot] ?? 0) + 1;
    return counts;
  }, [allActiveToday]);

  const slotOrders = useMemo(
    () => allActiveToday.filter(o => o.timeSlot === slot),
    [allActiveToday, slot],
  );

  const { merged, pickups, estimatedCash } = useMemo(() => {
    const bazaar = new Map<string, MergedItem>();
    const pickupMap = new Map<string, MergedItem>();
    for (const order of slotOrders) {
      for (const item of order.items) {
        const cat = categoryOf(item, state.products);
        const key = item.nameEn.toLowerCase();
        const target = item.source === 'restaurant' ? pickupMap : bazaar;
        const existing = target.get(key);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalApprox += item.approxPrice * item.quantity;
          existing.contributions.push({ orderId: order.id, customerName: order.customerName, areaId: order.deliveryAreaId, qty: item.quantity, unit: item.unit });
        } else {
          target.set(key, {
            key,
            nameBn: item.nameBn,
            nameEn: item.nameEn,
            unit: item.unit,
            categoryBn: cat.bn,
            categoryEn: cat.en,
            categoryKey: cat.key,
            totalQty: item.quantity,
            totalApprox: item.approxPrice * item.quantity,
            contributions: [{ orderId: order.id, customerName: order.customerName, areaId: order.deliveryAreaId, qty: item.quantity, unit: item.unit }],
          });
        }
      }
    }
    const mergedList = [...bazaar.values()].sort((a, b) =>
      (bn ? a.categoryBn : a.categoryEn).localeCompare(bn ? b.categoryBn : b.categoryEn),
    );
    const pickupList = [...pickupMap.values()];
    const cash = [...mergedList, ...pickupList].reduce((s, m) => s + m.totalApprox, 0);
    return { merged: mergedList, pickups: pickupList, estimatedCash: cash };
  }, [slotOrders, state.products, bn]);

  const allItems = [...merged, ...pickups];
  const totalCount = allItems.length;
  const doneCount = allItems.filter(m => checked[`${slot}:${m.key}`]).length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const firstUncheckedKey = allItems.find(m => !checked[`${slot}:${m.key}`])?.key;

  const toggle = (key: string) => {
    const ck = `${slot}:${key}`;
    setChecked(prev => ({ ...prev, [ck]: !prev[ck] }));
  };

  const renderItem = (m: MergedItem) => {
    const ck = `${slot}:${m.key}`;
    const isChecked = !!checked[ck];
    const isOpen = !!expanded[ck];
    const highlight = !isChecked && m.key === firstUncheckedKey;
    return (
      <div
        key={m.key}
        className={clsx(
          'bg-surface-container-lowest rounded-2xl p-3 shadow-sm relative overflow-hidden',
          highlight ? 'border-2 border-primary' : 'border border-outline-variant/30',
        )}
      >
        {highlight && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => toggle(m.key)}
              aria-label={`Toggle ${m.nameEn}`}
              className={clsx(
                'w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center active:scale-90 transition-transform shrink-0',
                isChecked ? 'bg-primary text-white' : 'border-2 border-outline-variant hover:border-primary bg-white shadow-inner',
              )}
            >
              {isChecked && <span className="material-symbols-outlined text-[18px]">check</span>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={clsx('font-body-md text-body-md font-bold', isChecked ? 'text-on-surface-variant line-through' : 'text-on-surface')}>
                  {bn ? m.nameBn : m.nameEn}
                </h3>
                {highlight && <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shrink-0" />}
              </div>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant/70">{bn ? m.nameEn : m.nameBn}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={clsx('font-label-md text-label-md px-2 py-0.5 rounded font-bold', isChecked ? 'bg-surface-container text-on-surface' : 'bg-surface-container text-on-surface')}>
                  {bn ? 'মোট' : 'Total'} {toBnDigits(m.totalQty, lang)}{m.unit ? ` ${m.unit}` : ''}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                  {bn ? 'আনুমানিক' : 'Approx'} {fmtTk(m.totalApprox, lang)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(prev => ({ ...prev, [ck]: !prev[ck] }))}
            aria-label="Toggle order breakdown"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low shrink-0"
          >
            <span className={clsx('material-symbols-outlined text-[20px] transition-transform', isOpen && 'rotate-180')}>expand_more</span>
          </button>
        </div>
        {isOpen && (
          <div className="bg-surface-container-low/70 rounded-xl p-2.5 space-y-1.5 border border-outline-variant/20 ml-10 mt-2.5">
            <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[13px] text-primary">shopping_basket</span>
              {bn ? 'গ্রাহক অনুযায়ী পরিমাপ (Order Breakdown):' : 'Order breakdown:'}
            </p>
            <div className="grid grid-cols-1 gap-1 pl-1">
              {m.contributions.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-body-sm font-body-sm text-on-surface gap-2">
                  <span className="font-medium truncate">• {bn ? 'অর্ডার' : 'Order'} #{c.orderId} ({areaName(state.areas, c.areaId, lang)})</span>
                  <span className="font-bold bg-white px-2 py-0.5 rounded text-primary shrink-0">
                    {toBnDigits(c.qty, lang)}{c.unit ? ` ${c.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Group bazaar items by category for display
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; items: MergedItem[] }>();
    for (const m of merged) {
      const cat = bn ? m.categoryBn : m.categoryEn;
      if (!map.has(cat)) map.set(cat, { key: m.categoryKey, items: [] });
      map.get(cat)!.items.push(m);
    }
    return [...map.entries()];
  }, [merged, bn]);

  const anchor = latestOrderDay(state.orders);
  const dateBn = new Date(`${anchor}T00:00:00`).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Design g1 header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-sm shrink-0">
        <div className="flex justify-between items-center w-full px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => navigate('/staff')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold">
                {bn ? 'আজকের বাজারের লিস্ট' : "Today's bazaar list"}
              </h1>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
                {dateBn} • {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
              </p>
            </div>
          </div>
          <span className="w-10 h-10 flex items-center justify-center rounded-full text-primary" title={bn ? 'তালিকা রিফ্রেশ করুন' : 'Refresh list'}>
            <span className="material-symbols-outlined text-[22px]">sync</span>
          </span>
        </div>
        <div className="px-4 pb-3 pt-1 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {SLOT_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => setSlot(chip.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors',
                  slot === chip.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant',
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                <span>
                  {bn ? chip.labelBn : chip.labelEn} {bn ? 'রান' : 'run'} ({bn ? `${toBnDigits(slotCounts[chip.id] ?? 0, lang)}টি অর্ডার` : `${slotCounts[chip.id] ?? 0} orders`})
                </span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl">
            <button
              onClick={() => setView('combined')}
              className={clsx(
                'py-1.5 text-center font-label-md text-label-md rounded-lg transition-all flex items-center justify-center gap-1',
                view === 'combined' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant',
              )}
            >
              <span className="material-symbols-outlined text-[16px]">layers</span>
              <span>{bn ? 'একসাথে / Combined' : 'Combined'}</span>
            </button>
            <button
              onClick={() => setView('byOrder')}
              className={clsx(
                'py-1.5 text-center font-label-md text-label-md rounded-lg transition-all flex items-center justify-center gap-1',
                view === 'byOrder' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant',
              )}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>{bn ? 'অর্ডার অনুযায়ী / By order' : 'By order'}</span>
            </button>
          </div>
        </div>
      </header>

      <PageFrame>
        {/* Estimated cash card (design g1) */}
        <section className="bg-primary text-on-primary rounded-2xl p-4 shadow-md relative overflow-hidden mt-4">
          <div className="absolute -right-4 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3 relative">
            <div>
              <span className="font-bilingual-sub text-bilingual-sub uppercase tracking-wider text-white/80 block mb-0.5">
                {bn ? 'মোট আনুমানিক লাগবে / Estimated Cash' : 'Estimated Cash Needed'}
              </span>
              <div className="font-headline-lg text-headline-lg font-bold tracking-tight text-white flex items-baseline gap-1">
                <span>{fmtTk(estimatedCash, lang)}</span>
                <span className="font-label-md text-label-md opacity-80">(Cash Ready)</span>
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 text-right">
              <span className="font-bilingual-sub text-bilingual-sub block text-white/70">{bn ? 'অর্ডার / Orders' : 'Orders'}</span>
              <span className="font-label-lg text-label-lg font-bold text-white flex items-center justify-end gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary-fixed">local_shipping</span>
                <span>{toBnDigits(slotOrders.length, lang)} {bn ? 'টি' : ''}</span>
              </span>
            </div>
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/15 relative">
            <div className="flex justify-between items-center font-label-md text-label-md text-white/95">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">task_alt</span>
                <span>{bn ? `কেনা হয়েছে ${toBnDigits(doneCount, lang)}/${toBnDigits(totalCount, lang)} আইটেম` : `Bought ${doneCount}/${totalCount} items`}</span>
              </span>
              <span className="font-bold text-primary-fixed">{toBnDigits(progress, lang)}% {bn ? 'সম্পন্ন' : 'done'}</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
              <div className="bg-primary-fixed h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>

        {slotOrders.length === 0 ? (
          <EmptyState
            icon="shopping_basket"
            title={bn ? 'এই রানে কেনার কিছু নেই' : 'Nothing to buy in this run'}
            body={bn ? 'এই স্লটে কোনো সক্রিয় অর্ডার নেই।' : 'No active orders in this slot.'}
          />
        ) : view === 'combined' ? (
          <>
            {groups.map(([cat, group]) => {
              const remaining = group.items.filter(m => !checked[`${slot}:${m.key}`]).length;
              return (
                <section key={cat} className="space-y-2 mt-4">
                  <div className="flex items-center justify-between px-1 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[16px]">{CATEGORY_ICONS[group.key] ?? 'shopping_basket'}</span>
                      </span>
                      <h2 className="font-label-lg text-label-lg text-on-surface font-bold">
                        {cat} / {bn ? group.items[0].categoryEn : group.items[0].categoryBn}
                      </h2>
                    </div>
                    {remaining === 0 ? (
                      <span className="font-label-sm text-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{bn ? 'সম্পূর্ণ' : 'Complete'}</span>
                    ) : (
                      <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold">
                        {bn ? `${toBnDigits(remaining, lang)}টি বাকি` : `${remaining} left`}
                      </span>
                    )}
                  </div>
                  {group.items.map(renderItem)}
                </section>
              );
            })}

            {pickups.length > 0 && (
              <section className="pt-2 pb-3 mt-4">
                <div className="bg-gradient-to-br from-secondary-fixed/50 to-surface-container-lowest rounded-2xl p-4 border border-secondary-container/30 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-secondary-container text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">restaurant</span>
                      </span>
                      <div>
                        <span className="font-bilingual-sub text-bilingual-sub uppercase tracking-wider text-secondary font-bold block">
                          {bn ? 'হট পিকআপ পয়েন্ট (Food Pickup)' : 'Hot Pickup Point (Food Pickup)'}
                        </span>
                        <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                          {bn ? `${toBnDigits(pickups.length, lang)}টি পিকআপ আইটেম` : `${pickups.length} pickup items`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {pickups.map(renderItem)}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {slotOrders.map((order: Order) => (
              <div key={order.id} className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
                <p className="text-label-md font-semibold text-on-surface-variant mb-2">
                  #{order.id} · {order.customerName} · {areaName(state.areas, order.deliveryAreaId, lang)}
                </p>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between py-1.5">
                    <span className="text-body-sm text-on-surface">
                      {bn ? item.nameBn : item.nameEn}
                      {item.source === 'restaurant' && (
                        <span className="ml-1.5 text-[10px] font-semibold text-secondary bg-secondary/12 px-1.5 py-0.5 rounded-full">
                          {bn ? 'পিকআপ' : 'pickup'}
                        </span>
                      )}
                    </span>
                    <span className="text-body-sm font-semibold text-on-surface">
                      {toBnDigits(item.quantity, lang)}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </PageFrame>
    </div>
  );
}
