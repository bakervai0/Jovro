import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { cancelOrder } from '../../services/orders';
import { uid, SLOT_META, toBnDigits } from '../../services/orderUtils';
import type { OrderStatus } from '../../types';

// G4 journey steps (design g4._delivery_proof_confirmation):
// Received -> Buying -> Packed -> On the way -> Delivered.
// The app has no separate 'packed' status — packed is complete
// once the order is on the way, and its time is the on-the-way
// tracking update's time.
const JOURNEY_STEPS: { key: string; labelBn: string; labelEn: string; icon: string }[] = [
  { key: 'accepted', labelBn: 'অর্ডার গৃহীত', labelEn: 'Order received', icon: 'receipt' },
  { key: 'buying', labelBn: 'বাজার ক্রয়', labelEn: 'Bazaar buying', icon: 'shopping_basket' },
  { key: 'packed', labelBn: 'প্যাকড', labelEn: 'Packed', icon: 'package_2' },
  { key: 'on-the-way', labelBn: 'অন দ্য ওয়ে', labelEn: 'On the way', icon: 'directions_bike' },
  { key: 'delivered', labelBn: 'ডেলিভার্ড', labelEn: 'Delivered', icon: 'done_all' },
];

const STATUS_LABEL: Record<OrderStatus, { bn: string; en: string; icon: string }> = {
  pending: { bn: 'অপেক্ষায়', en: 'Pending', icon: 'receipt' },
  confirmed: { bn: 'নিশ্চিত', en: 'Confirmed', icon: 'check_circle' },
  buying: { bn: 'কেনাকাটা', en: 'Buying', icon: 'shopping_basket' },
  'on-the-way': { bn: 'আসছে', en: 'On the way', icon: 'directions_bike' },
  delivered: { bn: 'ডেলিভারি হয়েছে', en: 'Delivered', icon: 'task_alt' },
  failed: { bn: 'ডেলিভারি ব্যর্থ হয়েছে', en: 'Delivery failed', icon: 'error' },
  cancelled: { bn: 'বাতিল', en: 'Cancelled', icon: 'cancel' },
  'refund-in-progress': { bn: 'রিফান্ড হচ্ছে', en: 'Refunding', icon: 'currency_exchange' },
  refunded: { bn: 'রিফান্ড হয়েছে', en: 'Refunded', icon: 'paid' },
};

export default function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [rating, setRating] = useState(0);
  const [showProof, setShowProof] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);

  const order = state.orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-surface">
        <TopAppBar showBack title={lang === 'bn' ? 'অর্ডার বিবরণ' : 'Order Detail'} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-lg text-on-surface-variant">
            {lang === 'bn' ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}
          </p>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  // G4 journey card derivation — existing status + tracking only.
  const journeyVisible = ['pending', 'confirmed', 'buying', 'on-the-way', 'delivered'].includes(order.status);
  const journeyCompleted = order.status === 'delivered' ? 5 : order.status === 'on-the-way' ? 3 : 1;
  const journeyCurrent = order.status === 'delivered' || order.status === 'pending'
    ? -1
    : order.status === 'on-the-way' ? 3 : 1;
  const updateTimeFor = (status: OrderStatus) => order.trackingUpdates.find(u => u.status === status)?.timestamp;
  const packedTime = order.trackingUpdates.find(
    u => u.status === 'on-the-way' || /প্যাক|packed/i.test(`${u.messageBn} ${u.messageEn}`),
  )?.timestamp;
  const journeyTimes: (string | undefined)[] = [
    order.createdAt,
    updateTimeFor('buying'),
    packedTime,
    updateTimeFor('on-the-way'),
    updateTimeFor('delivered') ?? (order.status === 'delivered' ? order.updatedAt : undefined),
  ];
  const fmtJourneyTime = (iso?: string) => (iso
    ? new Date(iso).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' })
    : '');

  const copyOrderId = async () => {
    try { await navigator.clipboard.writeText(`#${order.id}`); } catch { /* clipboard unavailable in demo */ }
    setOrderCopied(true);
    setTimeout(() => setOrderCopied(false), 2000);
  };

  const handleCancel = () => {
    setCancelling(true);
    cancelOrder(order.id).then(result => {
      if (result.success) {
        dispatch({
          type: 'UPDATE_ORDER',
          order: {
            ...order,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          },
        });
      }
      setCancelling(false);
      setShowCancel(false);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={`#${order.id}`}
        subtitle={lang === 'bn' ? STATUS_LABEL[order.status].bn : STATUS_LABEL[order.status].en}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* QS1: prominent tracking Order ID pill with copy, as on
            the design's live-tracking header. */}
        <div className="px-4 pt-4">
          <div className="bg-primary text-on-primary rounded-xl p-3 flex items-center justify-between shadow-sm gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-label-sm font-label-sm text-primary-fixed uppercase tracking-wider font-bold">
                {bn ? 'ট্র্যাকিং অর্ডার আইডি (Order ID)' : 'Tracking Order ID'}
              </span>
              <span className="text-headline-md font-headline-md font-bold tracking-tight text-surface-container-lowest">
                #{order.id}
              </span>
            </div>
            <button
              onClick={copyOrderId}
              className="h-9 px-3 bg-surface-container-lowest text-primary rounded-full font-label-md text-label-md font-bold flex items-center gap-1 shadow active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">{orderCopied ? 'done' : 'content_copy'}</span>
              <span>{orderCopied ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি করুন' : 'Copy')}</span>
            </button>
          </div>
          <p className="text-center text-bilingual-sub font-bilingual-sub text-on-surface-variant pt-2">
            {bn
              ? <>জরুরি সহায়তায় আইডি <span className="font-bold text-primary">#{order.id}</span> উল্লেখ করে জানান</>
              : <>Mention order ID <span className="font-bold text-primary">#{order.id}</span> when asking for urgent support</>}
          </p>
        </div>

        {/* G4: order-status journey card (design g4) — replaces the
            old stepper; also shown once delivered, above the
            delivery-proof hero, exactly as in the design. */}
        {journeyVisible && (
          <div className="px-4 pt-4">
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label-md font-label-md font-bold text-on-surface">
                  {bn ? 'অর্ডার স্ট্যাটাস জার্নি' : 'Order Status Journey'}
                </span>
                <span className="text-label-sm font-label-sm text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                  {bn
                    ? `${toBnDigits(journeyCompleted, lang)}/${toBnDigits(5, lang)} ধাপ সম্পন্ন`
                    : `${journeyCompleted}/5 steps done`}
                </span>
              </div>
              <div className="relative py-2">
                <div className="absolute top-[22px] left-3 right-3 h-[3px] bg-outline-variant/50 rounded-full z-0" />
                <div
                  className="absolute top-[22px] left-3 h-[3px] bg-primary rounded-full z-0"
                  style={{ width: `calc((100% - 24px) * ${(journeyCompleted - 1) / 4})` }}
                />
                <div className="relative z-10 flex justify-between items-start">
                  {JOURNEY_STEPS.map((step, idx) => {
                    const done = idx < journeyCompleted;
                    const current = idx === journeyCurrent;
                    const isFinal = idx === JOURNEY_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex flex-col items-center w-12 text-center">
                        <div className={clsx(
                          'w-7 h-7 rounded-full flex items-center justify-center shadow-sm',
                          done
                            ? 'bg-primary text-on-primary'
                            : current
                              ? 'bg-white border-2 border-primary'
                              : 'bg-surface-container border border-outline-variant text-on-surface-variant',
                          done && isFinal && 'ring-4 ring-primary/20',
                        )}>
                          {done ? (
                            <span className="material-symbols-outlined text-sm font-bold">{isFinal ? 'done_all' : 'check'}</span>
                          ) : current ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">{step.icon}</span>
                          )}
                        </div>
                        <span className={clsx(
                          'text-label-sm font-label-sm mt-1.5 leading-tight',
                          done || current ? 'text-primary font-bold' : 'text-on-surface font-semibold',
                        )}>
                          {bn ? step.labelBn : step.labelEn}
                        </span>
                        <span className={clsx('text-[9px] font-medium', done ? 'text-primary' : 'text-on-surface-variant')}>
                          {fmtJourneyTime(journeyTimes[idx])}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {order.status === 'cancelled' && (
          <div className="mx-4 my-4 p-4 bg-error/10 border border-error/20 rounded-3xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
            <p className="text-body-sm text-error font-medium">
              {lang === 'bn' ? 'এই অর্ডারটি বাতিল হয়েছে।' : 'This order has been cancelled.'}
            </p>
          </div>
        )}

        {/* Failed banner */}
        {order.status === 'failed' && (
          <div className="mx-4 my-4 p-4 bg-error/10 border border-error/20 rounded-3xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <p className="text-body-sm text-error font-medium">
                {lang === 'bn' ? 'দুঃখিত, ডেলিভারি সম্পন্ন করা যায়নি।' : 'Sorry, the delivery could not be completed.'}
              </p>
              {order.failReason && (
                <p className="text-label-sm text-error/80 mt-0.5">
                  {lang === 'bn' ? `কারণ: ${order.failReason}` : `Reason: ${order.failReason}`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* H20: refund progress — set by admin from the problem inbox */}
        {order.refundStatus && (
          <div className={clsx(
            'mx-4 my-4 p-4 border rounded-3xl flex items-start gap-3',
            order.refundStatus === 'paid'
              ? 'bg-success/10 border-success/30'
              : 'bg-warning/10 border-warning/30',
          )}>
            <span className={clsx(
              'material-symbols-outlined text-[24px]',
              order.refundStatus === 'paid' ? 'text-success' : 'text-warning',
            )}>currency_exchange</span>
            <div>
              <p className={clsx('text-body-sm font-semibold', order.refundStatus === 'paid' ? 'text-success' : 'text-on-surface')}>
                {order.refundStatus === 'paid'
                  ? (lang === 'bn' ? 'রিফান্ড সম্পন্ন ✓' : 'Refund completed ✓')
                  : (lang === 'bn' ? 'রিফান্ড প্রক্রিয়াধীন' : 'Refund in progress')}
              </p>
              <p className="text-label-md text-on-surface-variant mt-0.5">
                {lang === 'bn'
                  ? `৳${order.refundAmount ?? order.finalTotal} · ${order.refundMethod === 'nagad' ? 'নগদ' : order.refundMethod === 'cash' ? 'ক্যাশ' : 'বিকাশ'}${order.refundDays ? ` · ${order.refundDays} কর্মদিবসের মধ্যে` : ''}`
                  : `৳${order.refundAmount ?? order.finalTotal} · ${order.refundMethod ?? 'bkash'}${order.refundDays ? ` · within ${order.refundDays} working days` : ''}`}
              </p>
              {order.refundNote && <p className="text-label-sm text-on-surface-variant mt-1">{order.refundNote}</p>}
            </div>
          </div>
        )}

        {/* F13: delivery-proof — customer confirms receipt (Stitch g4) */}
        {order.status === 'delivered' && (
          <div className="mx-4 my-4 flex flex-col gap-3">
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mx-auto">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
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
                  <span>
                    {new Date(order.updatedAt).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="text-primary font-bold">{bn ? 'সময়মতো সম্পন্ন' : 'Completed on time'}</span>
                </div>
                {(() => {
                  const rider = state.riders.find(r => r.id === order.riderId);
                  if (!rider) return null;
                  return (
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">pedal_bike</span>
                      <span>
                        {bn ? 'রাইডার' : 'Rider'}: {bn ? rider.nameBn : rider.name} ({rider.vehicleType === 'motorbike' ? (bn ? 'মোটরবাইক ডেলিভারি' : 'Motorbike delivery') : (bn ? 'সাইকেল ডেলিভারি' : 'Bicycle delivery')})
                      </span>
                    </div>
                  );
                })()}
              </div>

              {order.customerReceived ? (
                <div className="p-4 bg-success/10 border border-success/30 rounded-2xl flex items-center gap-3 text-left">
                  <span className="material-symbols-outlined text-success text-[26px]">verified</span>
                  <p className="text-body-sm text-success font-semibold">
                    {bn ? 'আপনি পণ্য পেয়েছি নিশ্চিত করেছেন ✓ ধন্যবাদ!' : 'You confirmed receipt ✓ Thank you!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="pt-1 pb-1">
                    <p className="text-label-md font-label-md text-on-surface-variant mb-2">
                      {bn ? 'রাইডারের সেবা রেট করুন' : 'Rate the rider’s service'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          aria-label={`${star} star`}
                          className={clsx(
                            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                            star <= rating ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-outline-variant',
                          )}
                        >
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        dispatch({
                          type: 'UPDATE_ORDER',
                          order: { ...order, customerReceived: true, updatedAt: new Date().toISOString() },
                        });
                        if (rating > 0) {
                          dispatch({
                            type: 'ADD_REVIEW',
                            review: {
                              id: uid('rev'),
                              orderId: order.id,
                              customerId: order.customerId,
                              customerName: order.customerName,
                              rating,
                              createdAt: new Date().toISOString(),
                              isApproved: false,
                              isHidden: false,
                            },
                          });
                        }
                      }}
                      className="w-full h-[50px] rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span>{bn ? 'পণ্য পেয়েছি ✓ / I received my order' : 'I received my order ✓'}</span>
                    </button>
                    <button
                      onClick={() => navigate(`/report?order=${order.id}`)}
                      className="w-full py-2 text-label-md font-label-md text-on-surface-variant flex items-center justify-center gap-1"
                    >
                      <span>{bn ? 'পাইনি বা কোনো সমস্যা আছে? / Not received or a problem?' : 'Not received or a problem?'}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#FFF7ED] border border-[#F97316]/30 rounded-2xl p-3.5 flex items-start gap-3">
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
              <div className="bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30 overflow-hidden shrink-0">
                      <img src={order.proofPhotoUrl} alt="delivery proof" className="w-full h-full object-cover" />
                    </span>
                    <div className="text-left">
                      <p className="text-label-md font-label-md text-on-surface font-semibold">{bn ? 'ডেলিভারি প্রমাণ ছবি দেখুন' : 'View delivery proof photo'}</p>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'রাইডার কর্তৃক আপলোডকৃত ছবি' : 'Photo uploaded by the rider'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProof(v => !v)}
                    className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-bold text-label-sm border border-outline-variant/40 flex items-center gap-1 shrink-0"
                  >
                    <span>{showProof ? (bn ? 'লুকান' : 'Hide') : (bn ? 'দেখুন' : 'View')}</span>
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                </div>
                {showProof && (
                  <img src={order.proofPhotoUrl} alt="delivery proof" className="w-full h-52 object-cover rounded-xl mt-3 border border-outline-variant/30" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Tracking updates */}
        {order.trackingUpdates.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-label-lg font-semibold text-on-surface mb-3">
              {lang === 'bn' ? 'ট্র্যাকিং' : 'Tracking'}
            </p>
            <div className="flex flex-col gap-0">
              {[...order.trackingUpdates].reverse().map((upd, i) => (
                <div key={upd.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      i === 0 ? 'bg-primary' : 'bg-outline-variant',
                    )} />
                    {i < order.trackingUpdates.length - 1 && (
                      <div className="w-px flex-1 bg-outline-variant/50 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-body-sm font-medium text-on-surface">
                      {lang === 'bn' ? upd.messageBn : upd.messageEn}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {new Date(upd.timestamp).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-BD', { hour: '2-digit', minute: '2-digit' })}
                      {upd.locationNote && ` · ${upd.locationNote}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="px-4 mb-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? `পণ্য (${order.items.length}টি)` : `Items (${order.items.length})`}
          </p>
          <div className="flex flex-col gap-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0">
                <div>
                  <p className="text-body-sm font-medium text-on-surface">
                    {lang === 'bn' ? item.nameBn : item.nameEn}
                  </p>
                  {item.unit && (
                    <p className="text-label-sm text-on-surface-variant">{item.unit}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-medium text-on-surface">
                    ×{item.quantity}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">≈৳{item.approxPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery info */}
        <div className="mx-4 mb-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Info'}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">location_on</span>
              <p className="text-body-sm text-on-surface flex-1">{order.deliveryAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
              <p className="text-body-sm text-on-surface">
                {lang === 'bn' ? SLOT_META[order.timeSlot].rangeBn : SLOT_META[order.timeSlot].rangeEn}
              </p>
            </div>
          </div>
        </div>

        {/* Bill */}
        <div className="mx-4 mb-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? 'বিল' : 'Bill'}
          </p>
          {[
            { labelBn: 'পণ্যের আনুমানিক দাম', labelEn: 'Items (approx)', value: order.productsTotal },
            { labelBn: 'ডেলিভারি ফি', labelEn: 'Delivery fee', value: order.deliveryFee },
            ...(order.discountAmount > 0 ? [{ labelBn: 'ছাড়', labelEn: 'Discount', value: -order.discountAmount }] : []),
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="text-body-sm text-on-surface-variant">{lang === 'bn' ? row.labelBn : row.labelEn}</span>
              <span className={clsx('text-body-sm font-medium', row.value < 0 ? 'text-success' : 'text-on-surface')}>
                {row.value < 0 ? `-৳${Math.abs(row.value)}` : `৳${row.value}`}
              </span>
            </div>
          ))}
          <div className="h-px bg-outline-variant/40 my-2" />
          <div className="flex justify-between">
            <span className="text-body-md font-bold text-on-surface">{lang === 'bn' ? 'মোট' : 'Total'}</span>
            <span className="text-title-sm font-bold text-primary">৳{order.finalTotal}</span>
          </div>
        </div>

        {/* Cancel button */}
        {canCancel && (
          <div className="px-4">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowCancel(true)}
              loading={cancelling}
              className="border-error text-error"
            >
              {lang === 'bn' ? 'অর্ডার বাতিল করুন' : 'Cancel Order'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmSheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title={lang === 'bn' ? 'অর্ডার বাতিল করবেন?' : 'Cancel this order?'}
        body={lang === 'bn' ? 'বাতিল করলে আর ফেরত নেওয়া যাবে না।' : 'This cannot be undone.'}
        confirmLabel={lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, cancel'}
        danger
        loading={cancelling}
      />
    </div>
  );
}
