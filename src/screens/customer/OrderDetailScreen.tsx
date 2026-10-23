import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { cancelOrder } from '../../services/orders';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits, SLOT_META, STATUS_META } from '../../services/orderUtils';
import { uid } from '../../services/orderUtils';
import type { OrderStatus } from '../../types';

// ── Stitch 18 + 18b · Order Tracking ──────────────────────────
// Honest-window banner, rider card, vertical 5-stage timeline,
// receipt-audit bill card, operator action bar, and the 18b
// cancel-order bottom sheet. Delivered orders keep the F13
// delivery-proof / confirm-receipt block from design g4.

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way', 'delivered'];

const STAGES: { status: OrderStatus; bn: string; en: string; icon: string; pendingDescBn: string; pendingDescEn: string }[] = [
  { status: 'pending', bn: 'অর্ডার পেয়েছি', en: 'Order received', icon: 'receipt', pendingDescBn: 'সিস্টেমে রেকর্ড সম্পন্ন ও রাইডার নিযুক্ত হবে', pendingDescEn: 'Recorded in the system, rider being assigned' },
  { status: 'confirmed', bn: 'অর্ডার নিশ্চিত হয়েছে', en: 'Order confirmed', icon: 'check_circle', pendingDescBn: 'অপারেটর অর্ডারটি নিশ্চিত করবেন', pendingDescEn: 'The operator will confirm the order' },
  { status: 'buying', bn: 'বাজারে কেনাকাটা হচ্ছে', en: 'Buying at the bazaar', icon: 'storefront', pendingDescBn: 'গোশালা বাজার থেকে টাটকা কেনা হবে', pendingDescEn: 'Fresh buying from Goshala Bazar' },
  { status: 'on-the-way', bn: 'রওনা হয়েছে', en: 'On the way', icon: 'pedal_bike', pendingDescBn: 'রাইডার আপনার ঠিকানার দিকে রওনা দেবেন', pendingDescEn: 'The rider will head to your address' },
  { status: 'delivered', bn: 'পৌঁছে গেছে', en: 'Delivered', icon: 'home_pin', pendingDescBn: 'পণ্য বুঝে নিয়ে ক্যাশ পরিশোধ করুন', pendingDescEn: 'Check the items and pay in cash' },
];

const CANCEL_REASONS = [
  { id: 'changed_mind', bn: 'মন বদলেছে', en: 'Changed my mind' },
  { id: 'ordered_mistake', bn: 'ভুল করে অর্ডার হয়েছে', en: 'Ordered by mistake' },
  { id: 'taking_long', bn: 'দেরি হয়ে যাচ্ছে', en: 'Taking too long' },
  { id: 'other', bn: 'অন্য কারণ', en: 'Other reason' },
] as const;

export default function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('changed_mind');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [showProof, setShowProof] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);

  const order = state.orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm flex items-center gap-space-sm">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="text-headline-sm font-headline-sm text-on-surface font-bold">{bn ? 'অর্ডার ট্র্যাকিং' : 'Order Tracking'}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-lg text-on-surface-variant">{bn ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const inFlow = FLOW.includes(order.status);
  const currentIdx = FLOW.indexOf(order.status);
  const rider = state.riders.find(r => r.id === order.riderId);
  const area = state.areas.find(a => a.id === order.deliveryAreaId);
  const slot = SLOT_META[order.timeSlot];
  const statusMeta = STATUS_META[order.status];

  const updateFor = (status: OrderStatus) => order.trackingUpdates.find(u => u.status === status);
  const fmtTime = (iso?: string) => (iso
    ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '');

  // Receipt audit: actual prices (set by the rider while buying)
  // override approx prices line by line.
  const bazaarItems = order.items.filter(i => i.source === 'bazaar');
  const restaurantItems = order.items.filter(i => i.source === 'restaurant');
  const hasActuals = order.items.some(i => i.actualPrice != null);
  const actualItemsTotal = order.items.reduce((s, i) => s + (i.actualPrice ?? i.approxPrice) * i.quantity, 0);
  const savings = hasActuals ? Math.max(0, order.productsTotal - actualItemsTotal) : 0;
  const payable = hasActuals ? actualItemsTotal + order.deliveryFee - order.discountAmount : order.finalTotal;

  const copyOrderId = async () => {
    try { await navigator.clipboard.writeText(`#${order.id}`); } catch { /* clipboard unavailable in demo */ }
    setOrderCopied(true);
    setTimeout(() => setOrderCopied(false), 2000);
  };

  const handleCancel = () => {
    const reason = CANCEL_REASONS.find(r => r.id === cancelReason);
    const reasonLabel = reason ? (bn ? reason.bn : reason.en) : '';
    setCancelling(true);
    cancelOrder(order.id).then(result => {
      if (result.success) {
        dispatch({
          type: 'UPDATE_ORDER',
          order: {
            ...order,
            status: 'cancelled',
            failReason: cancelNote.trim() ? `${reasonLabel} — ${cancelNote.trim()}` : reasonLabel,
            trackingUpdates: [
              ...order.trackingUpdates,
              {
                id: uid('trk'),
                status: 'cancelled' as OrderStatus,
                messageBn: 'অর্ডার বাতিল হয়েছে',
                messageEn: 'Order cancelled',
                timestamp: new Date().toISOString(),
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        });
      }
      setCancelling(false);
      setShowCancel(false);
    });
  };

  const itemRow = (item: (typeof order.items)[number]) => {
    const unitPrice = item.actualPrice ?? item.approxPrice;
    const saved = item.actualPrice != null ? (item.approxPrice - item.actualPrice) * item.quantity : 0;
    return (
      <div key={item.id} className="flex justify-between items-start gap-2">
        <div>
          <p className="text-on-surface">
            {bn ? item.nameBn : item.nameEn}
            {item.unit ? ` (${item.quantity} ${item.unit})` : ` ×${item.quantity}`}
          </p>
          {saved > 0 && (
            <p className="text-bilingual-sub font-bilingual-sub text-primary font-medium">
              {bn ? `আনুমানিক ছিল ${fmtTk(item.approxPrice * item.quantity, lang)}, ${fmtTk(saved, lang)} সাশ্রয়!` : `Was approx ${fmtTk(item.approxPrice * item.quantity, lang)}, saved ${fmtTk(saved, lang)}!`}
            </p>
          )}
        </div>
        <span className="font-bold font-mono text-on-surface">{fmtTk(unitPrice * item.quantity, lang)}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Header (Stitch 18) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-space-sm min-w-0">
          <button
            type="button" onClick={() => navigate(-1)} aria-label={bn ? 'ফিরে যান' : 'Go Back'}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors active:scale-95 duration-150 shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-headline-sm font-headline-sm text-on-surface font-bold leading-tight">{bn ? 'অর্ডার ট্র্যাকিং' : 'Order Tracking'}</h1>
              <button
                type="button" onClick={copyOrderId} title={bn ? 'আইডি কপি করুন' : 'Copy order ID'}
                className="bg-surface-container-high px-1.5 py-0.5 rounded text-label-sm font-label-sm text-on-surface-variant font-mono flex items-center gap-1 active:scale-95"
              >
                #{order.id}
                <span className="material-symbols-outlined text-[12px]">{orderCopied ? 'done' : 'content_copy'}</span>
              </button>
            </div>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Live Order Tracking & Bazaar Audit</span>
          </div>
        </div>
        <button
          type="button" onClick={() => navigate('/contact')}
          className="flex items-center gap-1 text-primary hover:text-primary-container px-2 py-1 rounded-full text-label-md font-label-md bg-surface-container-low transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span className="font-semibold">{bn ? 'সাহায্য' : 'Help'}</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-6 space-y-space-md">
        {/* Terminal status banners */}
        {order.status === 'cancelled' && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
            <div>
              <p className="text-body-sm text-error font-medium">{bn ? 'এই অর্ডারটি বাতিল হয়েছে।' : 'This order has been cancelled.'}</p>
              {order.failReason && <p className="text-label-sm text-error/80 mt-0.5">{bn ? `কারণ: ${order.failReason}` : `Reason: ${order.failReason}`}</p>}
            </div>
          </div>
        )}
        {order.status === 'failed' && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <p className="text-body-sm text-error font-medium">{bn ? 'দুঃখিত, ডেলিভারি সম্পন্ন করা যায়নি।' : 'Sorry, the delivery could not be completed.'}</p>
              {order.failReason && <p className="text-label-sm text-error/80 mt-0.5">{bn ? `কারণ: ${order.failReason}` : `Reason: ${order.failReason}`}</p>}
            </div>
          </div>
        )}
        {order.refundStatus && (
          <div className={clsx(
            'p-4 border rounded-xl flex items-start gap-3',
            order.refundStatus === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FFF7ED] border-[#F97316]/30',
          )}>
            <span className={clsx('material-symbols-outlined text-[24px]', order.refundStatus === 'paid' ? 'text-primary' : 'text-[#C2410C]')}>currency_exchange</span>
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                {order.refundStatus === 'paid' ? (bn ? 'রিফান্ড সম্পন্ন ✓' : 'Refund completed ✓') : (bn ? 'রিফান্ড প্রক্রিয়াধীন' : 'Refund in progress')}
              </p>
              <p className="text-label-md text-on-surface-variant mt-0.5">
                {fmtTk(order.refundAmount ?? order.finalTotal, lang)} · {order.refundMethod === 'nagad' ? (bn ? 'নগদ' : 'Nagad') : order.refundMethod === 'cash' ? (bn ? 'ক্যাশ' : 'Cash') : (bn ? 'বিকাশ' : 'bKash')}
                {order.refundDays ? ` · ${toBnDigits(order.refundDays, lang)} ${bn ? 'কর্মদিবসের মধ্যে' : 'working days'}` : ''}
              </p>
              {order.refundNote && <p className="text-label-sm text-on-surface-variant mt-1">{order.refundNote}</p>}
            </div>
          </div>
        )}

        {/* Honest delivery window banner (Stitch 18) */}
        {inFlow && (
          <section className="bg-primary-container text-on-primary-container p-space-md rounded-xl shadow-sm relative overflow-hidden flex items-start gap-space-sm border border-primary-fixed/20">
            <div className="w-8 h-8 rounded-full bg-on-primary-container/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-primary-fixed text-[20px] filled-symbol">schedule</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-bilingual-sub font-bilingual-sub text-primary-fixed font-bold tracking-wide uppercase">
                  {bn ? 'সৎ ও বাস্তবসম্মত প্রতিশ্রুতি' : 'Honest, realistic promise'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed font-semibold shrink-0">
                  {bn ? 'সঠিক সময়' : 'On time'}
                </span>
              </div>
              <p className="text-label-lg font-label-lg font-bold mt-0.5 leading-snug">
                {bn ? `ডেলিভারি স্লট: আজ ${slot.rangeBn}` : `Delivery slot: Today ${slot.rangeEn}`}
              </p>
              <p className="text-body-sm font-body-sm text-on-primary-container/85 mt-0.5">
                {bn ? 'নির্ধারিত সময়ের মধ্যেই পৌঁছাবে • জিপিএস বিভ্রান্তি ছাড়া সৎ ডেলিভারি' : 'Will arrive within the slot • Honest delivery, no GPS confusion'}
              </p>
            </div>
          </section>
        )}

        {/* Rider card (Stitch 18) */}
        {inFlow && (
          <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm relative">
            {rider ? (
              <>
                <div className="flex items-center gap-space-md">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                      <span className="text-headline-md font-headline-md font-bold text-primary">{(bn ? rider.nameBn : rider.name).charAt(0)}</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-surface-container-lowest rounded-full p-0.5 shadow">
                      <span className="w-5 h-5 rounded-full bg-[#1D9D57] text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[13px] filled-symbol">pedal_bike</span>
                      </span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-headline-sm font-headline-sm text-on-surface truncate">{bn ? rider.nameBn : rider.name}</h2>
                      <div className="inline-flex items-center gap-1 bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-[#F97316]/30 text-[#9d4300] shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-[#F97316] filled-symbol">star</span>
                        <span className="text-label-md font-label-md font-bold">{toBnDigits(rider.rating.toFixed(1), lang)}</span>
                      </div>
                    </div>
                    <p className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1">
                      <span>{rider.vehicleType === 'motorbike' ? (bn ? 'মোটরবাইক ডেলিভারিম্যান' : 'Motorbike courier') : (bn ? 'সাইকেল ডেলিভারিম্যান' : 'Bicycle courier')}</span>
                      <span>•</span>
                      <span className="text-primary font-medium">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/20 border border-primary/20 text-on-primary-fixed-variant text-label-sm font-label-sm">
                      <span className={clsx('w-2 h-2 rounded-full bg-primary', order.status !== 'delivered' && 'animate-pulse')} />
                      <span>
                        {order.status === 'on-the-way'
                          ? (bn ? 'চলমান ডেলিভারি • আনুমানিক ১৫–২০ মিনিট' : 'Delivery in progress • approx 15-20 min')
                          : `${bn ? statusMeta.labelBn : statusMeta.labelEn}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm mt-space-md pt-space-sm border-t border-outline-variant/20">
                  <a
                    href={`tel:${rider.mobile}`}
                    className="h-11 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-primary font-label-md transition-colors active:scale-95 duration-150"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    <span className="truncate">{bn ? `কল করুন (${(bn ? rider.nameBn : rider.name).split(' ')[0]})` : `Call ${(rider.name).split(' ')[0]}`}</span>
                  </a>
                  <a
                    href={`https://wa.me/880${rider.mobile.replace(/\D/g, '').replace(/^880/, '').replace(/^0/, '')}`}
                    target="_blank" rel="noreferrer"
                    className="h-11 px-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center gap-2 text-[#006a37] font-label-md transition-colors active:scale-95 duration-150"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#25D366] filled-symbol">chat</span>
                    <span>{bn ? 'WhatsApp চ্যাট' : 'WhatsApp chat'}</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-surface-container-low border border-outline-variant/40 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">pedal_bike</span>
                </div>
                <div>
                  <h2 className="text-label-lg font-label-lg text-on-surface">{bn ? 'রাইডার শীঘ্রই নিযুক্ত হবে' : 'A rider will be assigned soon'}</h2>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">
                    {bn ? 'অর্ডার নিশ্চিত হলেই আপনার এলাকার রাইডারকে দায়িত্ব দেওয়া হবে।' : 'As soon as the order is confirmed, a local rider gets the job.'}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Timeline (Stitch 18) / updates list for terminal states */}
        {inFlow ? (
          <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-space-md gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">timeline</span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'ডেলিভারির বাস্তব অগ্রগতি' : 'Real delivery progress'}</h2>
              </div>
              <span className="text-label-sm font-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                {bn ? `ধাপ ${toBnDigits(currentIdx + 1, lang)} / ${toBnDigits(5, lang)}` : `Step ${currentIdx + 1} / 5`}
              </span>
            </div>
            <div className="relative pl-1">
              {STAGES.map((stage, idx) => {
                const done = idx < currentIdx || order.status === 'delivered';
                const isCurrent = idx === currentIdx && order.status !== 'delivered';
                const upd = updateFor(stage.status);
                const isBike = stage.status === 'on-the-way';
                return (
                  <div key={stage.status} className={clsx('relative flex items-start gap-3.5', idx < STAGES.length - 1 && 'pb-6')}>
                    {idx < STAGES.length - 1 && (
                      <div className={clsx('absolute left-4 top-8 -bottom-1 w-0.5', done || isCurrent ? 'bg-primary' : 'bg-surface-container-highest')} />
                    )}
                    <div className={clsx(
                      'relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm',
                      done
                        ? 'bg-primary text-on-primary'
                        : isCurrent && isBike
                          ? 'bg-[#fd761a] text-on-secondary shadow-md'
                          : isCurrent
                            ? 'bg-primary text-on-primary ring-4 ring-primary/20'
                            : 'bg-surface-container-highest text-on-surface-variant',
                    )}>
                      {isCurrent && isBike && <div className="absolute -inset-1 rounded-full bg-[#fd761a]/30 animate-ping" />}
                      <span className="material-symbols-outlined text-[18px] filled-symbol relative">
                        {done ? 'check' : stage.icon}
                      </span>
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className={clsx(
                            'text-label-lg font-label-lg truncate',
                            isCurrent && isBike ? 'text-[#9d4300] font-bold' : done || isCurrent ? 'text-on-surface font-semibold' : 'text-on-surface-variant font-medium',
                          )}>
                            {toBnDigits(idx + 1, lang)}. {bn ? stage.bn : stage.en}
                          </h3>
                          {isCurrent && isBike && (
                            <span className="bg-[#fd761a] text-on-secondary px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse shrink-0">{bn ? 'এখন সচল' : 'Active now'}</span>
                          )}
                        </div>
                        {upd ? (
                          <time className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium shrink-0">{fmtTime(upd.timestamp)}</time>
                        ) : !done && !isCurrent ? (
                          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant italic shrink-0">{bn ? 'অপেক্ষমান' : 'Waiting'}</span>
                        ) : null}
                      </div>
                      {upd ? (
                        <div className={clsx(
                          'p-2 rounded-lg mt-1 border',
                          isCurrent && isBike ? 'bg-[#FFF7ED] border-[#fd761a]/30' : 'bg-surface-container-low border-outline-variant/30',
                        )}>
                          <p className={clsx('text-body-sm font-body-sm font-medium flex items-center gap-1', isCurrent && isBike && 'text-[#9d4300] font-semibold')}>
                            {isCurrent && isBike && <span className="material-symbols-outlined text-[16px] text-[#fd761a]">navigation</span>}
                            <span>{bn ? upd.messageBn : upd.messageEn}</span>
                          </p>
                          {upd.locationNote && (
                            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">{upd.locationNote}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-body-sm font-body-sm text-on-surface-variant/80">{bn ? stage.pendingDescBn : stage.pendingDescEn}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : order.trackingUpdates.length > 0 && (
          <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm">
            <p className="text-label-lg font-semibold text-on-surface mb-3">{bn ? 'ট্র্যাকিং' : 'Tracking'}</p>
            <div className="flex flex-col">
              {[...order.trackingUpdates].reverse().map((upd, i, arr) => (
                <div key={upd.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', i === 0 ? 'bg-primary' : 'bg-outline-variant')} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-outline-variant/50 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-body-sm font-medium text-on-surface">{bn ? upd.messageBn : upd.messageEn}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {new Date(upd.timestamp).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: '2-digit', minute: '2-digit' })}
                      {upd.locationNote ? ` · ${upd.locationNote}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* F13 · Delivery-proof & confirm receipt (delivered) */}
        {order.status === 'delivered' && (
          <div className="flex flex-col gap-3">
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mx-auto">
                  <span className="material-symbols-outlined text-4xl filled-symbol">package_2</span>
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow">
                  <span className="material-symbols-outlined text-base font-bold">check</span>
                </span>
              </div>
              <div>
                <h2 className="text-headline-md font-headline-md font-bold text-on-surface">
                  {bn ? 'আপনার অর্ডার পৌঁছে গেছে!' : 'Your order has arrived!'}
                </h2>
                <p className="text-body-md font-body-md text-on-surface-variant font-medium mt-0.5">Your order was delivered successfully</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 w-full border border-outline-variant/20">
                <div className="flex items-center justify-center gap-1.5 text-on-surface font-semibold text-body-md">
                  <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                  <span>{new Date(order.updatedAt).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' })}</span>
                  <span className="text-outline-variant">•</span>
                  <span className="text-primary font-bold">{bn ? 'সময়মতো সম্পন্ন' : 'Completed on time'}</span>
                </div>
                {rider && (
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">pedal_bike</span>
                    <span>
                      {bn ? 'রাইডার' : 'Rider'}: {bn ? rider.nameBn : rider.name} ({rider.vehicleType === 'motorbike' ? (bn ? 'মোটরবাইক ডেলিভারি' : 'Motorbike delivery') : (bn ? 'সাইকেল ডেলিভারি' : 'Bicycle delivery')})
                    </span>
                  </div>
                )}
              </div>

              {order.customerReceived ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-left">
                  <span className="material-symbols-outlined text-primary text-[26px]">verified</span>
                  <p className="text-body-sm text-primary font-semibold">
                    {bn ? 'আপনি পণ্য পেয়েছি নিশ্চিত করেছেন ✓ ধন্যবাদ!' : 'You confirmed receipt ✓ Thank you!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="pt-1 pb-1">
                    <p className="text-label-md font-label-md text-on-surface-variant mb-2">{bn ? 'রাইডারের সেবা রেট করুন' : 'Rate the rider’s service'}</p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} star`}
                          className={clsx(
                            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                            star <= rating ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-outline-variant',
                          )}
                        >
                          <span className="material-symbols-outlined text-2xl filled-symbol">star</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'UPDATE_ORDER', order: { ...order, customerReceived: true, updatedAt: new Date().toISOString() } });
                        if (rating > 0) {
                          dispatch({
                            type: 'ADD_REVIEW',
                            review: {
                              id: uid('rev'), orderId: order.id, customerId: order.customerId,
                              customerName: order.customerName, rating,
                              createdAt: new Date().toISOString(), isApproved: false, isHidden: false,
                            },
                          });
                        }
                      }}
                      className="w-full h-[50px] rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl filled-symbol">verified</span>
                      <span>{bn ? 'পণ্য পেয়েছি ✓ / I received my order' : 'I received my order ✓'}</span>
                    </button>
                    <button
                      type="button" onClick={() => navigate(`/report?order=${order.id}`)}
                      className="w-full py-2 text-label-md font-label-md text-on-surface-variant flex items-center justify-center gap-1"
                    >
                      <span>{bn ? 'পাইনি বা কোনো সমস্যা আছে? / Not received or a problem?' : 'Not received or a problem?'}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#FFF7ED] border border-[#F97316]/30 rounded-xl p-3.5 flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-[#F97316]/10 text-[#C2410C] shrink-0 flex items-center justify-center mt-0.5">
                <span className="material-symbols-outlined text-lg">receipt</span>
              </span>
              <div>
                <p className="text-body-md font-body-md font-bold text-[#C2410C]">
                  {bn ? 'বাজারের মূল ক্যাশ মেমো প্যাকেটের সাথে সংযুক্ত আছে।' : 'The original bazaar cash memo is attached with the packet.'}
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                  {bn ? 'ভাউচার দেখে মূল্য যাচাই করুন। কোনো গরমিল পেলে সরাসরি অ্যাপে জানান।' : 'Check prices against the voucher. Report any mismatch in the app.'}
                </p>
              </div>
            </div>

            {order.proofPhotoUrl && (
              <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-outline-variant/30 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30 overflow-hidden shrink-0">
                      <img src={order.proofPhotoUrl} alt="delivery proof" className="w-full h-full object-cover" />
                    </span>
                    <div className="text-left min-w-0">
                      <p className="text-label-md font-label-md text-on-surface font-semibold">{bn ? 'ডেলিভারি প্রমাণ ছবি দেখুন' : 'View delivery proof photo'}</p>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'রাইডার কর্তৃক আপলোডকৃত ছবি' : 'Photo uploaded by the rider'}</p>
                    </div>
                  </div>
                  <button
                    type="button" onClick={() => setShowProof(v => !v)}
                    className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-bold text-label-sm border border-outline-variant/40 flex items-center gap-1 shrink-0"
                  >
                    <span>{showProof ? (bn ? 'লুকান' : 'Hide') : (bn ? 'দেখুন' : 'View')}</span>
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                </div>
                {showProof && <img src={order.proofPhotoUrl} alt="delivery proof" className="w-full h-52 object-cover rounded-xl mt-3 border border-outline-variant/30" />}
              </div>
            )}
          </div>
        )}

        {/* Delivery address card (Stitch 18b background) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm space-y-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
            <div className="min-w-0">
              <p className="text-label-sm font-label-sm text-outline">{bn ? 'ডেলিভারি ঠিকানা' : 'Delivery address'}</p>
              <p className="text-body-md font-body-md text-on-surface">{order.deliveryAddress || '—'}</p>
              {area && (
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                  {bn ? area.nameBn : area.nameEn} • {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
                </p>
              )}
            </div>
          </div>
          {order.orderNote && (
            <div className="flex items-start gap-2 pt-2 border-t border-outline-variant/20">
              <span className="material-symbols-outlined text-primary mt-0.5 text-[18px]">note_alt</span>
              <div className="min-w-0">
                <p className="text-label-sm font-label-sm text-outline">{bn ? 'অর্ডার নোট' : 'Order note'}</p>
                <p className="text-body-sm font-body-sm text-on-surface">{order.orderNote}</p>
              </div>
            </div>
          )}
        </section>

        {/* Receipt-audit bill card (Stitch 18) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm space-y-space-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'চূড়ান্ত বিল - রসিদ অনুযায়ী' : 'Final bill — by receipt'}</h2>
              </div>
              <span className="text-label-sm font-label-sm bg-surface-container-low px-2 py-0.5 rounded text-on-surface-variant shrink-0">Final Bazaar Audit</span>
            </div>
            {savings > 0 && (
              <div className="mt-2 bg-[#E8F5E9] border border-primary/20 rounded-lg p-2.5 flex items-center gap-2">
                <span className="text-primary text-[18px] shrink-0 font-bold">🎉</span>
                <p className="text-label-md font-label-md text-primary font-bold">
                  {bn ? `আনুমানিক চেয়ে ${fmtTk(savings, lang)} কম লেগেছে! (Bazaar Savings)` : `Cost ${fmtTk(savings, lang)} less than estimated! (Bazaar Savings)`}
                </p>
              </div>
            )}
          </div>

          {bazaarItems.length > 0 && (
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">local_mall</span>
                  <span className="text-label-md font-label-md font-bold text-on-surface">{bn ? 'গোশালা বাজার রসিদ' : 'Goshala Bazar receipt'}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-body-sm font-body-sm">{bazaarItems.map(itemRow)}</div>
            </div>
          )}

          {restaurantItems.length > 0 && (
            <div className="bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">restaurant</span>
                  <span className="text-label-md font-label-md font-bold text-on-surface">{bn ? 'রেস্টুরেন্ট রসিদ' : 'Restaurant receipt'}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-body-sm font-body-sm">{restaurantItems.map(itemRow)}</div>
            </div>
          )}

          {order.discountAmount > 0 && (
            <div className="flex items-center justify-between py-1 px-1 text-primary">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">local_activity</span>
                <span className="text-body-md font-body-md">{bn ? `প্রোমো ছাড়${order.promoCode ? ` (${order.promoCode})` : ''}` : 'Promo discount'}</span>
              </div>
              <span className="font-bold font-mono">-{fmtTk(order.discountAmount, lang)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1 px-1 border-t border-outline-variant/20">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">directions_bike</span>
              <span className="text-body-md font-body-md text-on-surface">
                {bn ? `সাইকেল ডেলিভারি চার্জ (${area ? area.nameBn : ''})` : 'Bicycle delivery charge'}
              </span>
            </div>
            <span className="font-bold font-mono text-on-surface">{fmtTk(order.deliveryFee, lang)}</span>
          </div>

          <div className="bg-primary/10 border-2 border-primary rounded-xl p-space-md flex items-center justify-between gap-2">
            <div>
              <p className="text-headline-sm font-headline-sm font-bold text-primary">{bn ? 'সর্বমোট ক্যাশ পরিশোধ' : 'Total cash payable'}</p>
              <p className="text-bilingual-sub font-bilingual-sub text-primary/80 font-medium">Total Cash to Pay on Delivery</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-headline-lg font-headline-lg font-bold text-primary font-mono tracking-tight">{fmtTk(payable, lang)}</span>
              <p className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">{bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-surface-container-low p-2.5 rounded-lg border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified_user</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              <strong className="text-on-surface font-semibold">{bn ? 'আস্থার নিশ্চয়তা:' : 'Trust guarantee:'}</strong>{' '}
              {bn ? 'বাজার ও দোকানের আসল ক্যাশ মেমোর ফটোকপি পণ্যের ব্যাগে সংযুক্ত আছে। মিলিয়ে দেখে মূল্য দিন।' : 'A copy of the original bazaar and shop cash memo is attached with the bag. Match it before you pay.'}
            </p>
          </div>
        </section>

        {/* Cancel entry (Stitch 18b background) */}
        {canCancel && (
          <div className="pt-2 text-center">
            <button
              type="button" onClick={() => setShowCancel(true)}
              className="text-error font-label-lg text-label-lg underline underline-offset-4 decoration-error/50 active:scale-95 transition-transform"
            >
              {bn ? 'অর্ডার বাতিল করুন / Cancel order' : 'Cancel order'}
            </button>
          </div>
        )}

        {/* Regional footnote */}
        <div className="text-center pb-2 text-bilingual-sub font-bilingual-sub text-on-surface-variant/70 space-y-0.5">
          <p>{bn ? 'জোভ্রো (Jovro) • লালমনিরহাট সদরের নিজস্ব ডেলিভারি নেটওয়ার্ক' : 'Jovro • Lalmonirhat Sadar’s own delivery network'}</p>
          <p>{bn ? 'সরাসরি কৃষক ও স্থানীয় বাজার থেকে সততার সাথে পণ্য পরিবহন' : 'Honest delivery straight from farmers and the local bazaar'}</p>
        </div>
      </div>

      {/* Bottom action bar (Stitch 18) */}
      <footer className="bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 shadow-lg px-margin-sm py-2.5 space-y-2">
        <div className="text-center">
          <p className="text-[11px] font-medium text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-primary filled-symbol">lock</span>
            <span>{bn ? 'পণ্য বুঝে নিয়ে ক্যাশ পরিশোধ করুন • কোনো লুকানো চার্জ নেই' : 'Pay in cash after checking • No hidden charges'}</span>
          </p>
        </div>
        <div className="space-y-1.5">
          <a
            href={OPERATOR.phoneTel}
            className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-full flex items-center justify-center gap-2 font-label-lg font-bold shadow-md active:scale-95 duration-150 transition-all px-3"
          >
            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
            <span className="truncate">{bn ? 'অপারেটরকে কল করুন (কন্ট্রোল রুম)' : 'Call the operator (control room)'}</span>
          </a>
          <a
            href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer"
            className="w-full h-10 bg-surface-container-lowest border border-primary/40 text-primary hover:bg-primary/5 rounded-full flex items-center justify-center gap-1.5 font-label-md font-semibold transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-[18px] text-[#25D366] filled-symbol">chat</span>
            <span>{bn ? 'হোয়াটসঅ্যাপে তাৎক্ষণিক সাহায্য / Support' : 'Instant help on WhatsApp'}</span>
          </a>
        </div>
      </footer>

      {/* Cancel bottom sheet (Stitch 18b) */}
      <BottomSheet open={showCancel} onClose={() => setShowCancel(false)}>
        <div className="px-margin pt-2 pb-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-lg">help_outline</span>
              </div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">{bn ? 'অর্ডার বাতিল করবেন?' : 'Cancel this order?'}</h2>
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-outline uppercase tracking-wider pl-10 -mt-1">Cancel this order?</p>
            <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 mt-2.5">
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                <span className="text-primary font-bold">
                  {order.status === 'pending'
                    ? (bn ? 'রাইডার এখনো বাজারে পণ্য কিনতে যাননি' : 'The rider has not gone to buy yet')
                    : (bn ? 'রাইডার এখনো বাজারে পণ্য কিনছেন' : 'The rider is still buying at the bazaar')}
                </span>
                {bn ? ', তাই এখনই সহজে বাতিল করা সম্ভব। কেন অর্ডারটি বাতিল করতে চান?' : ', so it can still be cancelled easily. Why do you want to cancel?'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1" role="radiogroup">
            {CANCEL_REASONS.map(r => {
              const selected = cancelReason === r.id;
              return (
                <button
                  key={r.id} type="button" role="radio" aria-checked={selected} onClick={() => setCancelReason(r.id)}
                  className={clsx(
                    'w-full flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] text-left',
                    selected ? 'border-2 border-primary bg-primary/5' : 'border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selected ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-transparent',
                    )}>
                      {selected && <span className="material-symbols-outlined text-xs filled-symbol">check</span>}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-label-lg font-label-lg text-on-surface">{bn ? r.bn : r.en}</span>
                      <span className="text-bilingual-sub font-bilingual-sub text-outline">{bn ? r.en : r.bn}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-label-sm font-label-sm text-outline" htmlFor="cancel-note">
              {bn ? 'বিস্তারিত মন্তব্য (ঐচ্ছিক) / Additional details' : 'Additional details (optional)'}
            </label>
            <input
              id="cancel-note" value={cancelNote} onChange={e => setCancelNote(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant placeholder:text-body-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={bn ? 'অন্য কোনো কারণ থাকলে লিখুন (ঐচ্ছিক)...' : 'Write any other reason (optional)...'}
              type="text"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-lg mt-0.5">verified_user</span>
            <p className="text-body-sm font-body-sm leading-snug">
              <span className="font-bold text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি অর্ডার' : 'Cash on delivery order'}</span>
              {bn ? ' — কোনো টাকা বা অগ্রিম ফি কাটা হবে না। নিঃসংকোচে বাতিল করতে পারেন।' : ' — no money or advance fee will be charged. Cancel without worry.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button" onClick={() => setShowCancel(false)}
              className="h-12 w-full px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center transition-colors active:scale-95 duration-150"
            >
              {bn ? 'না, থাক / Keep' : 'Keep order'}
            </button>
            <button
              type="button" onClick={handleCancel} disabled={cancelling}
              className="h-12 w-full px-3 rounded-full border-[1.5px] border-error text-error hover:bg-error-container/30 font-label-lg text-label-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95 duration-150 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              <span>{cancelling ? (bn ? 'বাতিল হচ্ছে...' : 'Cancelling...') : (bn ? 'হ্যাঁ, বাতিল করুন' : 'Yes, cancel')}</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
