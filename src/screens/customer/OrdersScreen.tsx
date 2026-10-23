import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits, SLOT_META, STATUS_META, isTodayOrder } from '../../services/orderUtils';
import type { CartItem, Order, OrderStatus } from '../../types';

// ── Stitch 17 + 17b + 17c · My Orders ─────────────────────────
// Brand header, filter chip rail (All / Active / Completed /
// Cancelled), design-17 active & delivered cards, design-17b
// cancelled cards, design-17c zero-orders state.

type Filter = 'all' | 'active' | 'completed' | 'cancelled';
const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way'];
const COMPLETED: OrderStatus[] = ['delivered', 'refund-in-progress', 'refunded'];
const CANCELLED: OrderStatus[] = ['cancelled', 'failed'];

function dateLabel(order: Order, lang: 'bn' | 'en', orders: Order[]): string {
  const bn = lang === 'bn';
  const d = new Date(order.createdAt);
  const time = d.toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' });
  if (isTodayOrder(order, orders)) return `${bn ? 'আজ' : 'Today'}, ${time}`;
  const date = d.toLocaleDateString(bn ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${date} • ${time}`;
}

function itemsLine(order: Order, bn: boolean): string {
  return order.items
    .map(i => `${bn ? i.nameBn : i.nameEn}${i.unit ? ` (${i.quantity} ${i.unit})` : ` ×${i.quantity}`}`)
    .join(', ');
}

function itemCount(order: Order): number {
  return order.items.reduce((s, i) => s + i.quantity, 0);
}

function FavButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" aria-label="Save order"
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90 shrink-0',
        active ? 'text-error bg-error-container/20' : 'text-outline hover:text-error hover:bg-error-container/20',
      )}
    >
      <span className={clsx('material-symbols-outlined text-[20px]', active && 'filled-symbol')}>favorite</span>
    </button>
  );
}

export default function OrdersScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [filter, setFilter] = useState<Filter>('all');
  const [favOrders, setFavOrders] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Customers only ever see their own orders.
  const orders = state.orders.filter(o => o.customerId === state.user?.id);
  const activeOrders = useMemo(() => orders.filter(o => ACTIVE.includes(o.status)), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => COMPLETED.includes(o.status)), [orders]);
  const cancelledOrders = useMemo(() => orders.filter(o => CANCELLED.includes(o.status)), [orders]);

  const toggleFav = (id: string) =>
    setFavOrders(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const reorder = (order: Order) => {
    for (const item of order.items) {
      if (item.source === 'bazaar') {
        const product = state.products.find(p => p.nameBn === item.nameBn);
        const ci: CartItem = product
          ? { id: product.id, productId: product.id, nameBn: item.nameBn, nameEn: item.nameEn, quantity: item.quantity, price: item.approxPrice, unit: item.unit ?? product.unit, source: 'bazaar', isApproxPrice: true }
          : { id: `re-${order.id}-${item.id}`, nameBn: item.nameBn, nameEn: item.nameEn, quantity: item.quantity, price: item.approxPrice, unit: item.unit, source: 'bazaar', isApproxPrice: true };
        dispatch({ type: 'ADD_TO_CART', item: ci });
      } else {
        let menuMatch: { restaurantId: string; menuItemId: string } | null = null;
        for (const r of state.restaurants) {
          const mi = r.menuItems.find(m => m.nameBn === item.nameBn);
          if (mi) { menuMatch = { restaurantId: r.id, menuItemId: mi.id }; break; }
        }
        dispatch({
          type: 'ADD_TO_CART',
          item: {
            id: menuMatch ? menuMatch.menuItemId : `re-${order.id}-${item.id}`,
            menuItemId: menuMatch?.menuItemId,
            restaurantId: menuMatch?.restaurantId,
            nameBn: item.nameBn, nameEn: item.nameEn, quantity: item.quantity,
            price: item.approxPrice, unit: item.unit, source: 'restaurant', isApproxPrice: false,
          },
        });
      }
    }
    navigate('/cart');
  };

  const FILTERS: { id: Filter; bn: string; en: string; count: number }[] = [
    { id: 'all', bn: 'সব', en: 'All', count: orders.length },
    { id: 'active', bn: 'চলমান', en: 'Active', count: activeOrders.length },
    { id: 'completed', bn: 'সম্পন্ন', en: 'Completed', count: completedOrders.length },
    { id: 'cancelled', bn: 'বাতিল', en: 'Cancelled', count: cancelledOrders.length },
  ];

  const offerPromo = state.promos.find(p => p.isActive && p.discountType === 'free-delivery')
    ?? state.promos.find(p => p.isActive);

  const copyCode = async () => {
    if (!offerPromo) return;
    try { await navigator.clipboard.writeText(offerPromo.code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Card renderers ──────────────────────────────────────────
  const renderActive = (order: Order) => {
    const meta = STATUS_META[order.status];
    const latest = [...order.trackingUpdates].reverse()[0];
    const rider = state.riders.find(r => r.id === order.riderId);
    const onTheWay = order.status === 'on-the-way';
    const hasBazaar = order.items.some(i => i.source === 'bazaar');
    const hasRestaurant = order.items.some(i => i.source === 'restaurant');
    return (
      <article
        key={order.id}
        onClick={() => navigate(`/orders/${order.id}`)}
        className="relative bg-surface-container-lowest rounded-2xl p-space-md border-2 border-primary shadow-[0_4px_16px_rgba(29,157,87,0.15)] overflow-hidden transition-all duration-200 cursor-pointer"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#25D366] to-[#F97316]" />
        <div className="flex items-start justify-between pb-2.5 border-b border-surface-container-high/60">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
              <span className="text-label-lg font-label-lg text-on-surface">{bn ? 'অর্ডার' : 'Order'} #{order.id}</span>
            </div>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
              {dateLabel(order, lang, orders)} • {bn ? SLOT_META[order.timeSlot].labelBn : SLOT_META[order.timeSlot].labelEn}
            </span>
          </div>
          <FavButton active={favOrders.includes(order.id)} onToggle={() => toggleFav(order.id)} />
        </div>

        {/* Live status banner */}
        <div className={clsx(
          'mt-3 rounded-xl p-2.5 flex items-center justify-between gap-2 border',
          onTheWay ? 'bg-[#FFF7ED] border-[#F97316]/30' : 'bg-primary/5 border-primary/20',
        )}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className={clsx(
              'relative flex items-center justify-center w-8 h-8 rounded-full shrink-0',
              onTheWay ? 'bg-[#fd761a]/15 text-[#C2410C]' : 'bg-primary/10 text-primary',
            )}>
              <span className="material-symbols-outlined text-[19px]">{meta.icon}</span>
              {onTheWay && <span className="animate-ping absolute inset-0 rounded-full bg-[#F97316]/20" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={clsx('text-label-md font-label-md', onTheWay ? 'text-[#9d4300]' : 'text-primary')}>
                  {onTheWay ? '🚴‍♂️ ' : ''}{bn ? meta.labelBn : meta.labelEn} / {bn ? meta.labelEn : meta.labelBn}
                </span>
              </div>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">
                {latest ? (bn ? latest.messageBn : latest.messageEn) : (bn ? 'আপডেটের অপেক্ষায়' : 'Awaiting update')}
                {latest?.locationNote ? ` • ${latest.locationNote}` : ''}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-[#1D9D57] text-white shrink-0">
            {bn ? 'লাইভ' : 'Live'}
          </span>
        </div>

        {/* ETA */}
        <div className="mt-2.5 flex items-center space-x-2 bg-surface-container-low px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
          <span className="text-body-sm font-body-sm text-on-surface font-medium">
            {bn ? 'সম্ভাব্য পৌঁছানোর সময়:' : 'Estimated arrival:'}{' '}
            <span className="font-bold text-primary">
              {isTodayOrder(order, orders) ? (bn ? 'আজ' : 'Today') : ''} {bn ? SLOT_META[order.timeSlot].rangeBn : SLOT_META[order.timeSlot].rangeEn}
            </span>
          </span>
        </div>

        {/* Sources */}
        <div className="mt-3 flex items-center gap-1.5 text-bilingual-sub font-bilingual-sub text-on-surface-variant flex-wrap">
          <span className="material-symbols-outlined text-[16px] text-tertiary">store</span>
          <span>{bn ? 'সংগৃহীত উৎস:' : 'Collected from:'}</span>
          {hasBazaar && <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-medium">{bn ? 'গোশালা বাজার' : 'Goshala Bazar'}</span>}
          {hasBazaar && hasRestaurant && <span>+</span>}
          {hasRestaurant && <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-medium">{bn ? 'রেস্টুরেন্ট' : 'Restaurant'}</span>}
        </div>

        {/* Items summary */}
        <div className="mt-2.5 py-2 px-3 bg-surface-bright rounded-xl border border-surface-container-highest/60 text-body-sm font-body-sm text-on-surface space-y-1">
          <div className="flex items-center justify-between text-label-md font-label-md text-on-surface">
            <span>{bn ? `পণ্য তালিকা (মোট ${toBnDigits(itemCount(order), lang)}টি আইটেম):` : `Items (total ${itemCount(order)}):`}</span>
            <span className="text-bilingual-sub text-on-surface-variant font-normal">{bn ? 'রসিদ যাচাইকৃত' : 'Receipt verified'}</span>
          </div>
          <p className="text-on-surface-variant leading-relaxed text-body-sm font-body-sm">{itemsLine(order, bn)}</p>
        </div>

        {/* Price breakdown */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-surface-container-high/60 gap-2">
          <span className="text-body-sm font-body-sm text-on-surface-variant">
            {bn ? 'পণ্য' : 'Items'} {fmtTk(order.productsTotal, lang)} + {bn ? 'সাইকেল ডেলিভারি' : 'delivery'} {fmtTk(order.deliveryFee, lang)}
            {order.discountAmount > 0 ? ` − ${bn ? 'ছাড়' : 'discount'} ${fmtTk(order.discountAmount, lang)}` : ''}
          </span>
          <div className="text-right shrink-0">
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'মোট পরিশোধযোগ্য' : 'Total payable'}</span>
            <span className="text-headline-sm font-headline-sm font-bold text-primary">{fmtTk(order.finalTotal, lang)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 pt-1 grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
            className="col-span-3 h-12 rounded-full bg-primary hover:bg-[#15803D] active:scale-95 duration-150 text-white font-label-lg text-label-lg flex items-center justify-center space-x-1.5 shadow-md shadow-primary/20 px-2"
          >
            <span className="truncate">{bn ? 'লাইভ অগ্রগতি ট্র্যাক করুন' : 'Track live progress'}</span>
            <span className="material-symbols-outlined text-[18px] shrink-0">arrow_forward</span>
          </button>
          <a
            href={rider ? `tel:${rider.mobile}` : OPERATOR.phoneTel}
            onClick={e => e.stopPropagation()}
            className="col-span-2 h-12 rounded-full border-[1.5px] border-primary bg-surface-container-lowest text-primary hover:bg-surface-container-low active:scale-95 duration-150 font-label-lg text-label-lg flex items-center justify-center space-x-1"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>{bn ? 'কল দিন' : 'Call'}</span>
          </a>
        </div>
      </article>
    );
  };

  const renderCompleted = (order: Order) => {
    const meta = STATUS_META[order.status];
    const hasRestaurant = order.items.some(i => i.source === 'restaurant');
    const hasBazaar = order.items.some(i => i.source === 'bazaar');
    return (
      <article
        key={order.id}
        onClick={() => navigate(`/orders/${order.id}`)}
        className="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer"
      >
        <div className="flex items-start justify-between pb-2 border-b border-surface-container-high/50">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="material-symbols-outlined text-outline text-[18px]">{hasRestaurant && !hasBazaar ? 'restaurant' : 'inventory_2'}</span>
              <span className="text-label-lg font-label-lg text-on-surface">{bn ? 'অর্ডার' : 'Order'} #{order.id}</span>
            </div>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{dateLabel(order, lang, orders)}</span>
          </div>
          <FavButton active={favOrders.includes(order.id)} onToggle={() => toggleFav(order.id)} />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className={clsx(
            'inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm border',
            order.status === 'delivered'
              ? 'bg-[#E8F5E9] text-[#006a37] border-[#006a37]/20'
              : 'bg-surface-container text-on-surface-variant border-outline-variant/30',
          )}>
            <span className="material-symbols-outlined text-[15px] filled-symbol">{meta.icon}</span>
            <span>{bn ? meta.labelBn : meta.labelEn} / {bn ? meta.labelEn : meta.labelBn}</span>
          </span>
          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            {order.promoCode ? `${bn ? 'কুপন' : 'Coupon'}: ${order.promoCode}` : (bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery')}
          </span>
        </div>

        <div className="mt-2.5 text-body-sm font-body-sm text-on-surface">
          <p className="font-medium text-on-surface leading-relaxed">{itemsLine(order, bn)}</p>
          <div className="mt-1 flex items-center text-bilingual-sub font-bilingual-sub text-on-surface-variant space-x-1">
            <span className="material-symbols-outlined text-[15px]">store</span>
            <span>{bn ? 'উৎস:' : 'Source:'} {[hasBazaar ? (bn ? 'গোশালা বাজার' : 'Goshala Bazar') : null, hasRestaurant ? (bn ? 'রেস্টুরেন্ট' : 'Restaurant') : null].filter(Boolean).join(' + ')}</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-surface-container-high/60 flex items-center justify-between gap-2">
          <div>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'পরিশোধিত মূল্য' : 'Paid amount'}</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-headline-sm font-headline-sm font-bold text-on-surface">{fmtTk(order.finalTotal, lang)}</span>
              {order.discountAmount > 0 && (
                <>
                  <span className="text-body-sm font-body-sm line-through text-outline">{fmtTk(order.finalTotal + order.discountAmount, lang)}</span>
                  <span className="text-label-sm font-label-sm text-[#006a37] font-semibold">(-{fmtTk(order.discountAmount, lang)} {bn ? 'ছাড়' : 'off'})</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); reorder(order); }}
            className="h-10 px-4 rounded-full border-[1.5px] border-primary bg-surface-container-lowest text-primary hover:bg-surface-container-low active:scale-95 duration-150 font-label-md text-label-md flex items-center space-x-1.5 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            <span>{bn ? 'আগের অর্ডার আবার দিন' : 'Reorder'}</span>
          </button>
        </div>
      </article>
    );
  };

  const renderCancelled = (order: Order) => {
    const isFailed = order.status === 'failed';
    const hasRestaurant = order.items.some(i => i.source === 'restaurant');
    const hasBazaar = order.items.some(i => i.source === 'bazaar');
    const area = state.areas.find(a => a.id === order.deliveryAreaId);
    const sourceTag = hasBazaar && hasRestaurant ? (bn ? 'মিশ্র অর্ডার' : 'Mixed order') : hasRestaurant ? (bn ? 'রেস্তোরাঁ' : 'Restaurant') : (bn ? 'লোকাল গ্রোসারি' : 'Local grocery');
    return (
      <article key={order.id} className="bg-surface-container-lowest rounded-xl p-3.5 border border-outline-variant/40 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[15px] font-bold text-on-surface tracking-tight">{bn ? 'অর্ডার' : 'Order'} #{order.id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-medium">{sourceTag}</span>
            </div>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">{dateLabel(order, lang, orders)}</p>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/30 shrink-0">
            <span className="material-symbols-outlined text-[15px] text-error">{isFailed ? 'error' : 'cancel'}</span>
            <span className="text-label-sm font-label-sm font-bold">
              {isFailed ? (bn ? 'ডেলিভারি ব্যর্থ / Failed' : 'Delivery Failed') : (bn ? 'বাতিল হয়েছে / Cancelled' : 'Cancelled')}
            </span>
          </div>
        </div>

        <div className="mt-3 p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
          <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">info</span>
          <div>
            <p className="text-label-md font-label-md text-on-surface">
              {bn ? 'বাতিলের কারণ:' : 'Reason:'}{' '}
              <span className="font-normal text-on-surface-variant">
                {order.failReason ?? (bn ? 'মন বদলেছে (অর্ডার বাতিলের অনুরোধ গৃহীত)' : 'Changed my mind (cancellation request accepted)')}
              </span>
            </p>
            <p className="text-[11px] text-outline mt-0.5">{bn ? 'গ্রাহক সেবা দল নিশ্চিত করেছে • কোনো জরিমানা নেই' : 'Confirmed by the support team • No penalty'}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 border border-outline-variant/20">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-body-md text-on-surface font-medium leading-snug line-clamp-2">{itemsLine(order, bn)}</p>
              <div className="flex items-center gap-2 mt-0.5 text-bilingual-sub font-bilingual-sub text-outline">
                <span>{bn ? `মোট ${toBnDigits(itemCount(order), lang)}টি পণ্য (${itemCount(order)} items)` : `Total ${itemCount(order)} items`}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-body-sm font-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">pin_drop</span>
            <span className="truncate">
              {bn ? 'গন্তব্য:' : 'Destination:'} <strong>{area ? (bn ? area.nameBn : area.nameEn) : ''}, {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</strong>
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-surface-container-high flex items-center justify-between gap-2">
          <div>
            <span className="text-bilingual-sub font-bilingual-sub text-outline block">{bn ? 'বিল সারাংশ / Bill Summary' : 'Bill Summary'}</span>
            <span className="text-headline-sm text-[16px] font-bold text-on-surface">{bn ? 'মোট বিল:' : 'Total:'} {fmtTk(order.finalTotal, lang)}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary-container/10 border border-primary/20 inline-block">
              {bn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
            </span>
            <span className="block text-[10px] text-outline mt-0.5">{bn ? 'পরিশোধের প্রয়োজন নেই' : 'No payment needed'}</span>
          </div>
        </div>

        <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 filled-symbol">verified</span>
          <p className="text-body-sm font-body-sm text-on-primary-fixed-variant leading-tight">
            {isFailed
              ? (bn ? 'ডেলিভারি সম্পন্ন করা যায়নি। কোনো অতিরিক্ত চার্জ বা ফি প্রযোজ্য নয়।' : 'The delivery could not be completed. No extra charge or fee applies.')
              : (bn ? 'অর্ডারটি সফলভাবে বাতিল করা হয়েছে। কোনো অতিরিক্ত চার্জ বা ফি প্রযোজ্য নয়।' : 'This order was cancelled successfully. No extra charge or fee applies.')}
          </p>
        </div>

        <div className="mt-3.5 pt-1 flex items-center gap-2">
          <button
            type="button" onClick={() => reorder(order)}
            className="flex-1 h-11 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-label-lg font-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            <span>{bn ? 'আবার অর্ডার করুন / Reorder' : 'Reorder'}</span>
          </button>
          <button
            type="button" onClick={() => navigate(`/orders/${order.id}`)}
            aria-label={bn ? 'রসিদ দেখুন' : 'View receipt'}
            className="h-11 px-3.5 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low font-semibold text-label-md font-label-md flex items-center justify-center gap-1 active:scale-95 transition-all duration-150 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>{bn ? 'রসিদ' : 'Receipt'}</span>
          </button>
          <button
            type="button" onClick={() => navigate(`/report?order=${order.id}`)}
            aria-label={bn ? 'সাহায্য দরকার?' : 'Need help?'}
            className="h-11 w-11 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center active:scale-95 transition-all duration-150 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
          </button>
        </div>
      </article>
    );
  };

  const renderCard = (order: Order) => {
    if (ACTIVE.includes(order.status)) return renderActive(order);
    if (CANCELLED.includes(order.status)) return renderCancelled(order);
    return renderCompleted(order);
  };

  const shownActive = filter === 'all' || filter === 'active' ? activeOrders : [];
  const shownCancelled = filter === 'all' || filter === 'cancelled' ? cancelledOrders : [];
  const shownCompleted = filter === 'all' || filter === 'completed' ? completedOrders : [];
  const totalShown = shownActive.length + shownCancelled.length + shownCompleted.length;

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAF7] relative overflow-hidden">
      {/* Header (Stitch 17) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin h-14">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Jovro</span>
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant -mt-1">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 active:scale-95 duration-150 transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">translate</span>
            <span className="text-label-md font-label-md text-on-surface">বাংলা | EN</span>
          </button>
        </div>
        <div className="px-margin pt-2 pb-3 bg-surface-container-lowest">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">
                {bn ? 'আমার অর্ডারসমূহ' : 'My Orders'} <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ {bn ? 'My Orders' : 'আমার অর্ডারসমূহ'}</span>
              </h1>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">
                {bn ? 'পূর্বের ও চলমান অর্ডারের তালিকা (Order History & Tracking)' : 'Order history & live tracking'}
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary shrink-0">
              {bn ? 'সদর এক্সপ্রেস' : 'Sadar Express'}
            </span>
          </div>
        </div>
        {/* Filter chips (Stitch 17b) */}
        <div className="px-margin pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-label-md font-label-md">
            {FILTERS.map(f => {
              const selected = filter === f.id;
              return (
                <button
                  key={f.id} type="button" onClick={() => setFilter(f.id)}
                  className={clsx(
                    'whitespace-nowrap px-3.5 py-1.5 rounded-full active:scale-95 duration-150 transition-all flex items-center gap-1',
                    selected
                      ? 'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/20'
                      : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low',
                  )}
                >
                  {selected && <span className="w-1.5 h-1.5 rounded-full bg-on-primary" />}
                  {f.id === 'active' && !selected && f.count > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9D57] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9D57]" />
                    </span>
                  )}
                  <span>{bn ? f.bn : f.en}</span>
                  <span className={clsx('text-[11px]', selected ? 'font-semibold text-on-primary-container' : 'font-normal opacity-80')}>
                    ({toBnDigits(f.count, lang)}) / {bn ? f.en : f.bn}
                  </span>
                </button>
              );
            })}
          </div>
          {filter === 'cancelled' && (
            <div className="flex items-center justify-between px-1 text-body-sm font-body-sm text-outline">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-outline">history</span>
                {bn ? 'সাম্প্রতিক বাতিলের তালিকা ফিল্টার করা হয়েছে' : 'Showing recent cancellations'}
              </span>
              <button type="button" onClick={() => navigate('/contact')} className="text-[11px] text-primary font-medium">
                {bn ? 'সহায়তা কেন্দ্র' : 'Help centre'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin py-space-md pb-28">
        {orders.length === 0 ? (
          <EmptyOrders bn={bn} offerCode={offerPromo?.code} copied={copied} onCopy={copyCode} />
        ) : totalShown === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">receipt_long</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {bn ? 'এই তালিকায় কোনো অর্ডার নেই' : 'No orders in this list'}
            </p>
            <button type="button" onClick={() => setFilter('all')} className="text-primary text-body-sm font-medium">
              {bn ? 'সব অর্ডার দেখুন' : 'View all orders'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {shownActive.map(renderCard)}
            {shownCancelled.map(renderCard)}
            {shownCompleted.length > 0 && filter === 'all' && (shownActive.length > 0 || shownCancelled.length > 0) && (
              <div className="pt-1 flex items-center justify-between">
                <h2 className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'আগের সম্পন্ন অর্ডারসমূহ' : 'Past completed orders'}</h2>
                <span className="text-bilingual-sub font-bilingual-sub text-outline">Past Orders</span>
              </div>
            )}
            {shownCompleted.map(renderCard)}

            {/* Trust footer note (Stitch 17) */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center space-x-3">
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0">verified_user</span>
              <div className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                <span className="font-semibold text-on-surface">{bn ? 'বাজারদর স্বচ্ছতা নীতি:' : 'Price transparency policy:'}</span>{' '}
                {bn ? 'কাঁচাবাজারের আসল মেমোর ছবি দেখে পণ্য বুঝে নিন। কোনো গরমিল থাকলে তাৎক্ষণিক সমাধান।' : 'Check items against the original bazaar memo. Any mismatch is resolved instantly.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating chat button (app pattern) */}
      <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none">
        <div className="flex justify-end px-4">
          <button
            type="button" onClick={() => navigate('/ai')} aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
            className="pointer-events-auto relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-primary text-white shadow-lg active:scale-95 duration-150 hover:scale-105 transition-transform border-2 border-white"
          >
            <span className="animate-ping absolute inset-0 rounded-full bg-primary opacity-30" />
            <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stitch 17c · Zero orders ──────────────────────────────────
function EmptyOrders({ bn, offerCode, copied, onCopy }: { bn: boolean; offerCode?: string; copied: boolean; onCopy: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center text-center mt-2 mb-space-lg">
        <div className="relative w-28 h-28 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-space-md ring-8 ring-[#E8F5E9]/50">
          <div className="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[42px] text-primary filled-symbol">pedal_bike</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center border-2 border-surface-container-lowest shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-secondary">receipt_long</span>
          </div>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          {bn ? 'এখনো কোনো অর্ডার নেই' : 'No orders yet'}
          <span className="block font-label-md text-label-md text-on-surface-variant font-normal mt-0.5">{bn ? 'No orders yet' : 'এখনো কোনো অর্ডার নেই'}</span>
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-[280px]">
          {bn ? 'প্রথম অর্ডারটা করেই দেখুন, তাজা বাজার কিংবা রেস্টুরেন্টের খাবার পৌঁছাবে দ্রুত!' : 'Place your first order — fresh bazaar items or restaurant food will arrive fast!'}
        </p>
        <span className="font-bilingual-sub text-bilingual-sub text-outline mt-0.5">Place your first order and track it live right here</span>
      </div>

      {/* Welcome offer */}
      <div className="mb-space-lg p-space-md rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 flex items-start gap-space-sm">
        <div className="w-8 h-8 rounded-full bg-[#FFEDD5] flex-shrink-0 flex items-center justify-center text-[#C2410C]">
          <span className="material-symbols-outlined text-[20px]">redeem</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-md text-label-md text-[#9A3412] font-bold">{bn ? 'প্রথম অর্ডারে ফ্রি ডেলিভারি!' : 'Free delivery on first order!'}</span>
            <span className="font-label-sm text-label-sm bg-[#FFDBCA] text-secondary font-bold px-1.5 py-0.5 rounded shrink-0">{bn ? 'অফার' : 'Offer'}</span>
          </div>
          <p className="font-body-sm text-body-sm text-[#783200] mt-0.5">
            {bn ? 'সাইকেল ডেলিভারি চার্জ সম্পূর্ণ ফ্রি পেতে কুপন কোড ব্যবহার করুন:' : 'Use this coupon code for completely free bicycle delivery:'}
          </p>
          <button
            type="button" onClick={onCopy}
            className="mt-2 inline-flex items-center gap-2 bg-surface-container-lowest px-2.5 py-1 rounded border border-dashed border-[#F97316] active:scale-95 transition-transform"
          >
            <span className="font-label-md text-label-md font-bold tracking-wider text-[#C2410C]">{offerCode}</span>
            <span className="material-symbols-outlined text-[14px] text-outline">{copied ? 'done' : 'content_copy'}</span>
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 mb-space-lg shadow-sm">
        <div className="flex items-center gap-space-sm mb-space-md pb-2 border-b border-outline-variant/20">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div>
            <h3 className="font-label-lg text-label-lg text-on-surface font-bold">{bn ? 'জোভ্রো কীভাবে কাজ করে?' : 'How does Jovro work?'}</h3>
            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">How our personal shoppers serve Lalmonirhat</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { n: '১', tBn: 'পছন্দের পণ্য বেছে নিন', tEn: 'Pick your items', dBn: 'অ্যাপে কাঁচাবাজার, মিষ্টি বা প্রয়োজনীয় দ্রব্যের তালিকা করুন।', dEn: 'Make your list of bazaar items, sweets or essentials in the app.' },
            { n: '২', tBn: 'নিজ চোখে বাছাই করে কেনাকাটা', tEn: 'Hand-picked shopping', dBn: 'আমাদের রাইডার গোশালা বাজারে গিয়ে সেরা তাজা পণ্য যাচাই করবেন।', dEn: 'Our rider goes to Goshala Bazar and checks for the freshest items.' },
            { n: '৩', tBn: 'আসল রসিদসহ সাইকেলে ডেলিভারি', tEn: 'Bicycle delivery with receipt', dBn: 'দোকানের পাকা মেমো সহ ২৫-৩৫ মিনিটের ভেতর আপনার ঠিকানায় পৌঁছাবে।', dEn: 'Arrives at your address within 25-35 minutes with the shop memo.' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-start gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-label-sm font-bold flex-shrink-0 mt-0.5">
                {bn ? s.n : String(i + 1)}
              </span>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{bn ? s.tBn : s.tEn}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{bn ? s.dBn : s.dEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-space-lg">
        <button
          type="button" onClick={() => navigate('/bazaar')}
          className="w-full h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-lg text-label-lg font-bold gap-2 shadow-sm hover:bg-primary-container active:scale-95 transition-all duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">storefront</span>
          <span>{bn ? 'প্রথম অর্ডার শুরু করুন / Explore Bazaar' : 'Explore Bazaar'}</span>
        </button>
        <button
          type="button" onClick={() => navigate('/contact')}
          className="w-full py-2.5 rounded-full flex items-center justify-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span>{bn ? 'সহায়তা কেন্দ্র বা সরাসরি কল / Help & Support' : 'Help & Support'}</span>
        </button>
      </div>
    </div>
  );
}
