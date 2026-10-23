import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { PageFrame } from '../../components/layout/PageFrame';
import { Button } from '../../components/ui/Button';
import type { Order, OrderStatus, TrackingUpdate } from '../../types';
import {
  STATUS_META, SLOT_META, areaName, cashToCollect, fmtTk, toBnDigits, uid,
} from '../../services/orderUtils';
import { OPERATOR } from '../../data/infoContent';

const FILL = { fontVariationSettings: "'FILL' 1" } as React.CSSProperties;

const FAIL_REASONS: { bn: string; en: string; hint?: string; hintHot?: boolean; icon: string }[] = [
  { bn: 'কাস্টমারকে পাওয়া যায়নি', en: 'Customer not found', icon: 'check_circle' },
  { bn: 'কাস্টমার ফোন ধরেননি', en: "Customer didn't answer the phone", hint: '(৩ বার কল করা হয়েছে)', hintHot: true, icon: 'phone_missed' },
  { bn: 'ঠিকানা খুঁজে পাইনি', en: "Couldn't find the address", hint: '(স্থানীয়দের জিজ্ঞেস করেও পাওয়া যায়নি)', icon: 'wrong_location' },
  { bn: 'কাস্টমার নিতে চাননি', en: 'Customer refused to take it', hint: '(দেরি বা পণ্যের দর সংক্রান্ত কারণে)', icon: 'cancel' },
  { bn: 'বাজারে জিনিস পাওয়া যায়নি', en: 'Item unavailable at the bazaar', icon: 'storefront' },
];

const TRACK_STEPS: { status: OrderStatus; labelBn: string; labelEn: string; subBn: string; subEn: string; icon: string; locBn: string }[] = [
  { status: 'buying', labelBn: 'বাজার থেকে কিনলাম', labelEn: 'Bought from Goshala', subBn: 'সব টাটকা পণ্য বাজার থেকে কেনা হয়েছে', subEn: 'Bought all fresh items from the bazaar', icon: 'shopping_basket', locBn: 'গোশালা বাজার (Goshala Bazar)' },
  { status: 'buying', labelBn: 'রেস্টুরেন্ট থেকে তুললাম', labelEn: 'Picked up from restaurant', subBn: 'রেস্টুরেন্ট থেকে খাবার তোলা হয়েছে', subEn: 'Picked up the food from the restaurant', icon: 'restaurant', locBn: 'রেস্টুরেন্ট (Restaurant)' },
  { status: 'on-the-way', labelBn: 'পথে আছি', labelEn: 'On the way', subBn: 'সাইকেল নিয়ে রওনা হয়েছি, ডেলিভারি পথে আছি', subEn: 'On the way with your delivery', icon: 'directions_bike', locBn: '' },
];

const LOCATION_CHIPS = ['মিশন মোড়', 'কলেজ বাজার', 'স্টেশন রোড', 'সদর হাসপাতাল'];
const NOTE_PRESETS = ['বৃষ্টির কারণে ২ মিনিট দেরি হচ্ছে', 'গেটের সামনে দাঁড়িয়ে আছি', 'মোবাইল রিং হচ্ছে না'];

/**
 * Rider order detail — strict Stitch replica:
 * F9 order detail (r3.1) + F10 tracking panel (r3.2)
 * + delivery-proof confirmation (g4, replaces the old generic
 * confirm sheet) + F11 delivered confirmation (r3.3)
 * + F12 failed-delivery report (r3.4).
 * Every action writes through UPDATE_ORDER, so the customer's
 * tracking screen updates live.
 */
export default function RiderOrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';

  const order = state.orders.find(o => o.id === id);

  const [note, setNote] = useState('');
  const [showFail, setShowFail] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [failNote, setFailNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [justDelivered, setJustDelivered] = useState(false);
  const [justFailed, setJustFailed] = useState(false);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [locChip, setLocChip] = useState<string>(LOCATION_CHIPS[0]);
  const [noteOpen, setNoteOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <TopAppBar showBack title={bn ? 'অর্ডার বিবরণ' : 'Order Detail'} />
        <PageFrame>
          <p className="py-16 text-center text-body-lg text-on-surface-variant">
            {bn ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}
          </p>
        </PageFrame>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const slot = SLOT_META[order.timeSlot];
  const area = areaName(state.areas, order.deliveryAreaId, lang);
  const isFinished = order.status === 'delivered' || order.status === 'failed' || order.status === 'cancelled';
  const cash = cashToCollect(order);

  const pushUpdate = (updated: Order, activity?: string) => {
    dispatch({ type: 'UPDATE_ORDER', order: updated });
    if (activity) {
      dispatch({
        type: 'LOG_ACTIVITY',
        entry: { id: uid('act'), actorName: state.user?.nameBn ?? state.user?.name ?? 'রাইডার', action: activity, at: new Date().toISOString(), category: 'order' },
      });
    }
  };

  const sendTracking = (status: OrderStatus, msgBn: string, msgEn: string, locationNote?: string) => {
    const upd: TrackingUpdate = {
      id: uid('trk'),
      status,
      messageBn: msgBn,
      messageEn: msgEn,
      timestamp: new Date().toISOString(),
      locationNote: locationNote || undefined,
    };
    pushUpdate({
      ...order,
      status,
      updatedAt: new Date().toISOString(),
      trackingUpdates: [...order.trackingUpdates, upd],
    });
  };

  const sendNote = () => {
    if (!note.trim()) return;
    const upd: TrackingUpdate = {
      id: uid('trk'),
      status: order.status,
      messageBn: note.trim(),
      messageEn: note.trim(),
      timestamp: new Date().toISOString(),
      locationNote: note.trim(),
    };
    pushUpdate({
      ...order,
      updatedAt: new Date().toISOString(),
      trackingUpdates: [...order.trackingUpdates, upd],
    });
    setNote('');
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
  };

  const markDelivered = () => {
    const upd: TrackingUpdate = {
      id: uid('trk'),
      status: 'delivered',
      messageBn: 'পৌঁছে দিয়েছি',
      messageEn: 'Delivered',
      timestamp: new Date().toISOString(),
    };
    pushUpdate(
      {
        ...order,
        status: 'delivered',
        proofPhotoUrl: photoUrl ?? order.proofPhotoUrl,
        updatedAt: new Date().toISOString(),
        trackingUpdates: [...order.trackingUpdates, upd],
      },
      `অর্ডার ${order.id} ডেলিভারি সম্পন্ন করেছেন`,
    );
    setShowDeliverConfirm(false);
    setJustDelivered(true);
  };

  const markFailed = () => {
    if (!failReason) return;
    const fullReason = failNote.trim() ? `${failReason} — ${failNote.trim()}` : failReason;
    const upd: TrackingUpdate = {
      id: uid('trk'),
      status: 'failed',
      messageBn: 'ডেলিভারি ব্যর্থ হয়েছে',
      messageEn: 'Delivery failed',
      timestamp: new Date().toISOString(),
      locationNote: fullReason,
    };
    pushUpdate(
      {
        ...order,
        status: 'failed',
        failReason: fullReason,
        updatedAt: new Date().toISOString(),
        trackingUpdates: [...order.trackingUpdates, upd],
      },
      `অর্ডার ${order.id} ডেলিভারি ব্যর্থ হিসেবে জানিয়েছেন`,
    );
    setShowFail(false);
    setJustFailed(true);
  };

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  // ── F11 delivered confirmation (r3.3) ─────────────────────────
  if (justDelivered) {
    const rider = state.riders.find(r => r.id === order.riderId);
    const remaining = state.orders.filter(
      o => o.riderId === order.riderId && o.id !== order.id && !['delivered', 'failed', 'cancelled'].includes(o.status),
    ).length;
    const prevBalance = rider ? rider.pendingPayout - order.deliveryFee : null;
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 shadow-sm border-b border-outline-variant/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold">
                <span className="material-symbols-outlined text-[20px]" style={FILL}>task_alt</span>
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Order #{order.id}</span>
                  <span className="text-label-sm font-label-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                    {bn ? 'পরিশোধিত' : 'Paid'}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-on-surface-variant font-bilingual-sub text-bilingual-sub">
                  <span>{bn ? 'ডেলিভারি রসিদ (Delivery Receipt)' : 'Delivery Receipt'}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <span className="material-symbols-outlined text-[13px] mr-0.5">location_on</span> {area}
                  </span>
                </p>
              </div>
            </div>
            <a
              href={OPERATOR.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Support"
              className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#1D9D57] flex items-center justify-center border border-[#1D9D57]/20 shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </a>
          </div>
        </header>
        <PageFrame>
          <section className="bg-surface-container-lowest rounded-xl p-space-lg text-center shadow-sm border border-outline-variant/30 relative overflow-hidden mt-4">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 bg-primary-fixed/30 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md ring-8 ring-primary-fixed/40 mb-3">
                <span className="material-symbols-outlined text-[36px]" style={FILL}>check_circle</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-primary tracking-tight">{bn ? 'ডেলিভারি সম্পন্ন!' : 'Delivered!'}</h1>
              <p className="font-label-lg text-label-lg text-on-surface font-semibold mt-0.5">Delivered Successfully!</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-[340px]">
                {bn ? <>গ্রাহক <span className="font-semibold text-on-surface">{order.customerName}</span> পণ্য বুঝে পেয়েছেন</> : <>Customer <span className="font-semibold text-on-surface">{order.customerName}</span> received the items</>}
                <span className="block text-bilingual-sub font-bilingual-sub text-outline mt-0.5">(Customer received the items safely)</span>
              </p>
              <div className="mt-3.5 inline-flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30 text-on-surface-variant font-label-md text-label-md gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <span className="font-medium text-on-surface">
                  {bn ? 'আজ ' : 'Today '}
                  {new Date().toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' })}
                </span>
                <span className="text-outline">•</span>
                <span className="material-symbols-outlined text-[16px] text-primary">place</span>
                <span className="font-medium text-on-surface">{area}</span>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 space-y-3.5 mt-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">{bn ? 'ক্যাশ নিষ্পত্তি ও আয়' : 'Cash settlement & earnings'}</span>
              </div>
              <span className="font-bilingual-sub text-bilingual-sub bg-surface-container text-on-surface-variant px-2 py-0.5 rounded">Settlement Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 flex flex-col justify-between">
                <div>
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'ক্যাশ আদায় হয়েছে' : 'Cash collected'}</span>
                  <span className="text-[10px] text-outline block leading-tight">Cash collected (In full)</span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-[20px] font-bold text-on-surface leading-none">{fmtTk(cash, lang)}</span>
                  <span className="ml-1 text-label-sm font-label-sm text-outline">{bn ? 'নগদ' : 'Cash'}</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 flex flex-col justify-between">
                <div>
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'অ্যাডমিনকে জমা দিতে হবে' : 'Handover to admin'}</span>
                  <span className="text-[10px] text-outline block leading-tight">Handover to Admin (Cost)</span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-[20px] font-bold text-secondary leading-none">{fmtTk(order.productsTotal, lang)}</span>
                  <span className="ml-1 text-label-sm font-label-sm text-outline">{bn ? 'বাজার মূল্য' : 'Bazaar cost'}</span>
                </div>
              </div>
            </div>
            <div className="bg-primary/10 border-2 border-primary/40 rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary shrink-0 flex items-center justify-center text-on-primary shadow-sm mt-0.5">
                <span className="material-symbols-outlined text-[22px]" style={FILL}>paid</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">+{fmtTk(order.deliveryFee, lang)}</span>
                  <span className="font-label-lg text-label-lg text-primary font-semibold">{bn ? 'আপনার আয়ে যোগ হয়েছে!' : 'added to your earnings!'}</span>
                </div>
                <p className="font-bilingual-sub text-bilingual-sub text-primary/90 mt-0.5">
                  +{fmtTk(order.deliveryFee, lang)} added to your earnings for this trip
                </p>
                {rider && (
                  <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span>{bn ? 'আপনার মোট তোলার বাকি ব্যালেন্স:' : 'Your pending payout balance:'}</span>
                    <span className="font-bold text-on-surface text-label-lg font-label-lg">{fmtTk(rider.pendingPayout, lang)}</span>
                  </div>
                )}
                {rider && prevBalance !== null && prevBalance >= 0 && (
                  <p className="text-[11px] text-outline mt-0.5 text-right">
                    ({bn ? `পূর্বে ব্যালেন্স ${fmtTk(prevBalance, lang)} ছিল` : `Previous balance was ${fmtTk(prevBalance, lang)}`})
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 space-y-3 mt-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-outline text-[20px]">person_pin</span>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">{bn ? 'গ্রাহক ও অর্ডার বিবরণী' : 'Customer & order details'}</span>
              </div>
              <span className="font-label-sm font-label-sm text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">{bn ? 'স্বাক্ষরিত / Confirmed' : 'Confirmed'}</span>
            </div>
            <div className="space-y-2.5 text-body-sm font-body-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant text-bilingual-sub font-bilingual-sub flex items-center shrink-0">
                  <span className="material-symbols-outlined text-[15px] mr-1 text-outline">badge</span>
                  {bn ? 'গ্রাহক (Customer):' : 'Customer:'}
                </span>
                <span className="font-semibold text-on-surface text-right">{order.customerName}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant text-bilingual-sub font-bilingual-sub flex items-center shrink-0">
                  <span className="material-symbols-outlined text-[15px] mr-1 text-outline">home_pin</span>
                  {bn ? 'ঠিকানা (Address):' : 'Address:'}
                </span>
                <span className="font-medium text-on-surface text-right max-w-[210px]">{order.deliveryAddress}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant text-bilingual-sub font-bilingual-sub flex items-center shrink-0">
                  <span className="material-symbols-outlined text-[15px] mr-1 text-outline">shopping_basket</span>
                  {bn ? 'ডেলিভারিকৃত পণ্য:' : 'Delivered items:'}
                </span>
                <span className="font-medium text-on-surface text-right max-w-[210px]">
                  {bn ? `${toBnDigits(order.items.length, lang)}টি পণ্য` : `${order.items.length} items`}
                  <span className="text-outline text-bilingual-sub block">({order.items.map(i => (bn ? i.nameBn : i.nameEn)).join(', ')})</span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-on-surface-variant text-bilingual-sub font-bilingual-sub flex items-center">
                  <span className="material-symbols-outlined text-[15px] mr-1 text-outline">payments</span>
                  {bn ? 'পরিশোধ পদ্ধতি:' : 'Payment method:'}
                </span>
                <span className="inline-flex items-center text-label-md font-label-md text-on-surface font-semibold bg-surface-container px-2 py-0.5 rounded">
                  {bn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate('/rider')}
              className="w-full h-14 bg-primary hover:bg-[#15803D] text-on-primary rounded-full font-label-lg text-label-lg flex items-center justify-between px-6 shadow-md shadow-primary/25 active:scale-[0.98] transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
                <span className="font-bold text-[15px]">{bn ? 'পরের ডেলিভারি' : 'Next delivery'}</span>
                <span className="text-on-primary/80 font-normal text-bilingual-sub">/ Next delivery</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                {remaining > 0 && (
                  <span className="bg-on-primary/20 text-on-primary text-[12px] px-2 py-0.5 rounded-full">
                    {bn ? `${toBnDigits(remaining, lang)}টি বাকি আছে` : `${remaining} left`}
                  </span>
                )}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </span>
            </button>
            <button
              onClick={() => navigate('/rider')}
              className="w-full h-12 bg-surface-container-lowest border border-outline-variant/60 text-on-surface rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">format_list_bulleted</span>
              <span>{bn ? 'আজকের ডেলিভারি তালিকা দেখুন' : "View today's deliveries"}</span>
              <span className="text-outline text-bilingual-sub font-normal">/ View Today&apos;s Deliveries</span>
            </button>
            <div className="text-center pt-1">
              <button
                onClick={() => navigate('/rider/earnings')}
                className="inline-flex items-center text-primary hover:underline font-label-md text-label-md gap-1 py-1"
              >
                <span className="material-symbols-outlined text-[17px]">receipt</span>
                <span>{bn ? 'আজকের আয়ের খতিয়ান দেখুন' : "Check today's earnings"}</span>
                <span className="text-bilingual-sub font-bilingual-sub text-outline">(Check Earnings)</span>
              </button>
            </div>
          </section>
        </PageFrame>
      </div>
    );
  }

  // ── Failed acknowledgement (no dedicated Stitch screen) ──────
  if (justFailed) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <TopAppBar showBack title={`#${order.id}`} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[44px] text-error">error</span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {bn ? 'ব্যর্থ হিসেবে জানানো হয়েছে' : 'Marked as failed'}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {bn ? `অর্ডার ${order.id} — ${order.failReason ?? failReason}` : `Order ${order.id} — ${order.failReason ?? failReason}`}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {bn ? 'ব্যর্থ অর্ডার সরাসরি অ্যাডমিনের কাছে ফিরে গেছে।' : 'The failed order has gone straight back to the admin.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/rider')}>
            {bn ? 'ডেলিভারি তালিকায় ফিরুন' : 'Back to deliveries'}
          </Button>
        </div>
      </div>
    );
  }

  // ── F12 failed-delivery report (r3.4) ────────────────────────
  if (showFail) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              aria-label="Go back"
              onClick={() => setShowFail(false)}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight leading-tight">
                {bn ? 'ডেলিভারি সমস্যা' : 'Delivery Issue'} <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ Delivery Issue</span>
              </h1>
              <p className="text-label-md font-label-md text-primary font-bold">অর্ডার #{order.id}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-label-sm border border-outline-variant/40">
            {area}
          </span>
        </header>
        <PageFrame>
          <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm flex flex-col gap-1 mt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">person</span>
                <span className="text-body-lg font-body-lg text-on-surface font-semibold">{order.customerName}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-label-sm font-label-sm font-bold">
                {bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm pl-6">
              <span className="material-symbols-outlined text-[16px] text-outline">pin_drop</span>
              <span>{order.deliveryAddress}, {area}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between pl-6 text-label-md font-label-md">
              <span className="text-on-surface-variant">{bn ? 'মোট বাকি টাকা:' : 'Total due:'}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-sm font-headline-sm text-primary font-bold">{fmtTk(cash, lang)}</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant">({bn ? `${toBnDigits(order.items.length, lang)}টি আইটেম` : `${order.items.length} items`})</span>
              </div>
            </div>
          </section>

          <div className="space-y-1 mt-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block" />
              <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold tracking-tight">
                {bn ? 'ডেলিভারি সম্পন্ন হয়নি' : "Delivery couldn't be completed"}
              </h2>
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant pl-4">Couldn&apos;t complete the delivery</p>
            <p className="text-body-md font-body-md text-on-surface-variant pl-4 pt-1">
              {bn ? 'কেন ডেলিভারি করা সম্ভব হয়নি তা নির্বাচন করুন' : 'Select the reason'}
              <span className="text-bilingual-sub font-bilingual-sub block text-outline">Select the reason why this couldn&apos;t be delivered</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4" role="radiogroup" aria-label="Failed delivery reasons">
            {FAIL_REASONS.map(r => {
              const selected = failReason === r.bn;
              return (
                <button
                  key={r.bn}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFailReason(r.bn)}
                  className={clsx(
                    'relative flex items-center justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm text-left transition-all active:scale-[0.99] min-h-[58px]',
                    selected ? 'border-2 border-primary' : 'border border-outline-variant/40',
                  )}
                >
                  <div className="flex items-center gap-3 pr-2">
                    <span className={clsx(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                      selected ? 'border-primary' : 'border-outline-variant',
                    )}>
                      {selected && <span className="w-3 h-3 rounded-full bg-primary" />}
                    </span>
                    <span>
                      <span className={clsx(
                        'text-body-lg font-body-lg text-on-surface block leading-snug',
                        selected ? 'font-semibold' : 'font-medium',
                      )}>
                        {r.bn}
                      </span>
                      <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{r.en}</span>
                      {r.hint && (
                        <span className={clsx(
                          'text-label-sm font-label-sm inline-block mt-0.5',
                          r.hintHot || selected ? 'text-secondary font-bold' : 'text-outline font-medium',
                        )}>
                          {r.hint}
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className={clsx('material-symbols-outlined text-[20px] shrink-0', selected ? 'text-primary' : 'text-outline-variant')}
                    style={selected ? FILL : undefined}
                  >
                    {r.icon}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-label-lg font-label-lg text-on-surface font-semibold flex items-center gap-1">
                {bn ? 'আরো কিছু লিখতে চাইলে' : 'Anything else'}
                <span className="text-bilingual-sub font-bilingual-sub font-normal text-on-surface-variant">/ Anything else (optional)</span>
              </label>
              <span className="text-label-sm font-label-sm text-outline">{bn ? 'ঐচ্ছিক' : 'Optional'}</span>
            </div>
            <textarea
              value={failNote}
              onChange={e => setFailNote(e.target.value)}
              rows={3}
              placeholder={bn ? 'যেমন: বাসার গেটে তালা লাগানো ছিল, পাশের দোকানে খবর দিয়ে এসেছি...' : 'e.g. The gate was locked...'}
              className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-body-md font-body-md text-on-surface placeholder:text-outline/70 p-space-md transition-all resize-none shadow-sm"
            />
          </div>

          <section className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/30 flex items-start gap-3 mt-4">
            <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5" style={FILL}>support_agent</span>
            <div className="space-y-1">
              <h3 className="text-body-md font-body-md font-bold text-on-surface leading-tight">
                {bn ? 'ব্যর্থ অর্ডার সরাসরি অ্যাডমিনের কাছে ফিরে যাবে' : 'A failed order goes straight back to the admin'}
              </h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium">A failed order goes straight back to the admin</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant pt-1 leading-relaxed">
                {bn ? 'হাব কন্ট্রোল রুম কাস্টমারের সাথে যোগাযোগ করবে এবং পরবর্তী সিদ্ধান্ত নেবে। রাইডারের কোনো দায় বর্তাবে না।' : 'The hub control room will contact the customer and decide next steps. The rider bears no blame.'}
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-2 pt-4 pb-6">
            <button
              onClick={markFailed}
              disabled={!failReason}
              className="w-full h-12 rounded-full bg-error text-on-error font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-[20px]">report</span>
              <span>{bn ? 'ব্যর্থ হিসেবে পাঠান / Report as failed' : 'Report as failed'}</span>
            </button>
            <button
              onClick={() => setShowFail(false)}
              className="w-full h-12 rounded-full bg-surface-container-lowest border border-outline-variant/80 text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_back</span>
              <span>{bn ? 'আবার চেষ্টা করতে ফিরে যান / Go back and try again' : 'Go back and try again'}</span>
            </button>
            <div className="flex justify-center pt-2">
              <a href={OPERATOR.phoneTel} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-tertiary text-body-sm font-body-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>{bn ? 'হাব কন্ট্রোলারকে ফোন করুন / Call Hub Controller' : 'Call Hub Controller'}</span>
              </a>
            </div>
          </div>
        </PageFrame>
      </div>
    );
  }

  // ── Delivery proof confirmation (g4, rider view) ────────────
  if (showDeliverConfirm) {
    const maskedMobile = order.customerMobile.length > 6
      ? `${order.customerMobile.slice(0, 3)}**-***${order.customerMobile.slice(-3)}`
      : order.customerMobile;
    const voucherDigits = order.id.replace(/\D/g, '') || order.id;
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <div className="bg-surface-container-lowest px-4 py-3.5 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              aria-label={bn ? 'ফিরে যান' : 'Go back'}
              onClick={() => setShowDeliverConfirm(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface leading-tight">{bn ? 'ডেলিভারি সম্পন্ন করুন' : 'Confirm Delivery'}</h1>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Confirm Delivery • Order #{order.id}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm rounded-full font-bold">
            {bn ? 'রাইডার মোড' : 'Rider Mode'}
          </span>
        </div>
        <PageFrame>
          <div className="pt-4 space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={FILL}>pin_drop</span>
              <p className="text-label-md font-label-md text-primary">
                {bn ? `আপনি কাস্টমারের লোকেশন জোন ${area} এলাকায় অবস্থান করছেন` : `You are in the customer's location zone: ${area}`}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-headline-sm border border-outline-variant/30">
                    {order.customerName.trim().charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-headline-sm font-headline-sm text-on-surface">{order.customerName}</h2>
                    <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                      {order.customerName} • {toBnDigits(maskedMobile, lang)}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${order.customerMobile}`}
                  aria-label={bn ? 'কাস্টমারকে কল করুন' : 'Call customer'}
                  className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined" style={FILL}>call</span>
                </a>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <span className="material-symbols-outlined text-secondary text-xl mt-0.5">location_pin</span>
                <div>
                  <p className="text-body-md font-body-md text-on-surface font-semibold">{order.deliveryAddress}</p>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">{area}</p>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 flex justify-between items-center text-body-sm font-body-sm gap-2">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">shopping_basket</span>
                  {bn ? `মোট পণ্য: ${toBnDigits(order.items.length, lang)}টি আইটেম (বাজার ও কাঁচামাল)` : `Total items: ${order.items.length} (bazaar & groceries)`}
                </span>
                <span className="font-bold text-on-surface shrink-0">{bn ? slot.labelBn : slot.labelEn}</span>
              </div>
            </div>

            <div className="bg-secondary-fixed/30 border-2 border-secondary-container/40 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined" style={FILL}>payments</span>
                  </div>
                  <div>
                    <p className="text-label-md font-label-md text-on-secondary-fixed-variant font-bold">{bn ? 'সংগ্রহযোগ্য ক্যাশ (COD)' : 'Cash to collect (COD)'}</p>
                    <p className="text-bilingual-sub font-bilingual-sub text-secondary font-medium">Cash to Collect from Customer</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-headline-md font-headline-md font-bold text-secondary">{fmtTk(cash, lang)}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-on-secondary-fixed-variant">
                  <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                  <span className="text-label-md font-label-md font-bold">{bn ? 'হাতে নগদ বুঝে নিন' : 'Collect the cash in hand'}</span>
                </div>
                <span className="text-bilingual-sub font-bilingual-sub bg-surface-container-lowest px-2 py-0.5 rounded text-secondary font-semibold">
                  {bn ? `ভাউচার নং #${toBnDigits(voucherDigits, lang)}` : `Voucher #${order.id}`}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">photo_camera</span>
                  <span className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'ডেলিভারির ছবি (ঐচ্ছিক)' : 'Delivery photo (optional)'}</span>
                </div>
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-semibold bg-surface-container px-2 py-0.5 rounded">Photo proof (optional)</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-outline-variant rounded-xl p-4 text-center bg-surface hover:bg-surface-container-low transition-colors group"
              >
                <span className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                </span>
                <span className="text-label-lg font-label-lg text-primary font-bold block">{bn ? 'ক্যামেরা খুলুন / Open camera' : 'Open camera'}</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant mt-1 max-w-[260px] mx-auto leading-tight block">
                  {bn ? 'দরজার সামনে বা কাস্টমারের হাতে প্যাকেট দেওয়ার ছবি তুলুন (বিতর্ক এড়াতে সাহায্য করে)' : 'Take a photo of the parcel at the door or in the customer\u2019s hand (helps avoid disputes)'}
                </span>
              </button>
              {photoUrl && (
                <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl">
                  <div className="w-14 h-14 rounded-lg bg-surface-container-highest shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant/40">
                    <img src={photoUrl} alt={bn ? 'ডেলিভারির ছবি' : 'Delivery proof'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-md font-label-md text-on-surface truncate font-semibold">{bn ? 'প্যাকেট_হস্তান্তর_রশিদ.jpg' : 'delivery_proof.jpg'}</p>
                    <p className="text-bilingual-sub font-bilingual-sub text-primary font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs" style={FILL}>check_circle</span>
                      {bn ? 'ছবি প্রস্তুত রয়েছে' : 'Photo ready'}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={bn ? 'ছবি মুছুন' : 'Remove photo'}
                    onClick={() => setPhotoUrl(null)}
                    className="text-error hover:bg-error-container/40 p-1.5 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={markDelivered}
                className="w-full h-[54px] rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
              >
                <span>{bn ? 'পৌঁছে দিয়েছি' : 'Delivered'}</span>
                <span className="material-symbols-outlined font-bold text-xl">check</span>
                {bn && <span className="text-label-md font-label-md text-on-primary/90 font-normal">/ Delivered</span>}
              </button>
              <button
                onClick={() => { setShowDeliverConfirm(false); setShowFail(true); }}
                className="w-full py-2.5 text-center text-body-md font-body-md text-error hover:bg-error-container/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">report_problem</span>
                <span>{bn ? 'ডেলিভারিতে সমস্যা? / Issue delivering' : 'Issue delivering?'}</span>
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg" style={FILL}>chat</span>
                </div>
                <div>
                  <p className="text-label-md font-label-md text-on-surface font-semibold">{bn ? 'সাপোর্ট ও কন্ট্রোল রুম' : 'Support & control room'}</p>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Lalmonirhat Hub Dispatch</p>
                </div>
              </div>
              <a
                href={OPERATOR.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#128C7E] font-bold text-label-md hover:bg-[#25D366]/20 transition-all flex items-center gap-1"
              >
                <span>{bn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                <span className="material-symbols-outlined text-sm">north_east</span>
              </a>
            </div>
          </div>
        </PageFrame>
      </div>
    );
  }

  // ── Main detail (r3.1) + tracking panel (r3.2) ───────────────
  const sentStepIdx = TRACK_STEPS.map(step =>
    order.trackingUpdates.some(u => u.messageEn === step.labelEn),
  );
  const currentStepIdx = sentStepIdx.findIndex(s => !s);
  const sentCount = sentStepIdx.filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* r3.1 header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest shadow-sm px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            aria-label={bn ? 'ফিরে যান' : 'Go back'}
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">#{order.id}</span>
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-label-sm font-label-sm border',
                order.status === 'delivered'
                  ? 'bg-primary-fixed/40 text-on-primary-fixed-variant border-primary/30'
                  : 'bg-secondary-fixed text-on-secondary-fixed border-secondary-container/40',
              )}>
                {bn ? meta.labelBn : meta.labelEn} / {meta.labelEn}
              </span>
            </div>
            <p className="flex items-center gap-1 text-on-surface-variant text-bilingual-sub font-bilingual-sub">
              <span className="material-symbols-outlined text-[14px] text-primary" style={FILL}>location_on</span>
              <span>{area} / Lalmonirhat Sadar</span>
            </p>
          </div>
        </div>
        <span className="px-2 py-1 rounded bg-primary/10 text-primary text-label-sm font-label-sm font-bold shrink-0">
          {bn ? 'রাইডার মোড' : 'Rider Mode'}
        </span>
      </header>

      <PageFrame>
        {/* Customer card (r3.1) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm space-y-space-md mt-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium">{bn ? 'গ্রাহকের নাম (Customer)' : 'Customer name'}</p>
                <h1 className="text-headline-md font-headline-md font-bold text-on-surface tracking-tight leading-tight">{order.customerName}</h1>
                <p className="text-label-md font-label-md text-on-surface-variant">{order.customerMobile}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-label-md font-label-md shrink-0 border border-outline-variant/40">
                <span className="material-symbols-outlined text-[16px] text-primary" style={FILL}>pin_drop</span>
                <span>{area}</span>
              </span>
            </div>
          </div>
          <a
            href={`tel:${order.customerMobile}`}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl py-3.5 px-4 shadow-md font-headline-sm text-headline-sm font-bold active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">call</span>
            <span>{bn ? `কাস্টমারকে কল করুন / Call (${order.customerMobile})` : `Call customer (${order.customerMobile})`}</span>
          </a>
          <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30 space-y-1">
            <p className="flex items-center gap-1.5 text-primary text-label-md font-label-md font-bold">
              <span className="material-symbols-outlined text-[18px]">home_pin</span>
              <span>{bn ? 'ডেলিভারি ঠিকানা ও ল্যান্ডমার্ক:' : 'Delivery address & landmark:'}</span>
            </p>
            <p className="text-body-lg font-body-lg text-on-surface font-semibold leading-snug">{order.deliveryAddress}</p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
              {bn ? `${slot.labelBn} • ${slot.rangeBn}` : `${slot.labelEn} • ${slot.rangeEn}`}
            </p>
          </div>
          {order.orderNote && (
            <div className="flex items-start gap-2.5 bg-amber-50 rounded-lg p-3 border border-amber-200/80">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">notifications_active</span>
              <div className="text-body-sm font-body-sm text-on-secondary-container">
                <span className="font-bold text-secondary">{bn ? 'অর্ডার নোট:' : 'Order note:'}</span>{' '}
                <span className="font-medium text-on-surface">“{order.orderNote}”</span>
              </div>
            </div>
          )}
        </section>

        {/* COD card (r3.1) */}
        <section className="bg-surface-container-lowest rounded-xl p-4 border-2 border-secondary-container/80 shadow-sm relative overflow-hidden mt-3">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-secondary">payments</span>
          </div>
          <div className="flex items-start justify-between relative">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[14px]">price_check</span>
                {bn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
              </span>
              <p className="text-body-md font-body-md font-bold text-on-surface-variant">💵 {bn ? 'ক্যাশ সংগ্রহ করতে হবে:' : 'Cash to collect:'}</p>
              <div className="text-headline-lg font-headline-lg font-black text-secondary tracking-tight">
                {fmtTk(cash, lang)} <span className="text-headline-sm font-headline-sm font-bold text-on-surface">{bn ? 'নগদ' : 'Cash'}</span>
              </div>
            </div>
            <span className="bg-secondary/10 p-2.5 rounded-full text-secondary shrink-0">
              <span className="material-symbols-outlined text-[32px]">payments</span>
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center gap-2 relative">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
            <p className="text-body-sm font-body-sm text-on-surface leading-tight font-medium">
              {bn
                ? <>পণ্য মূল্য {fmtTk(order.productsTotal, lang)} + ডেলিভারি ফি {fmtTk(order.deliveryFee, lang)}{order.discountAmount > 0 ? <> − ছাড় {fmtTk(order.discountAmount, lang)}</> : null} = মোট <strong className="text-secondary font-bold">{fmtTk(cash, lang)}</strong> সংগ্রহ করুন</>
                : <>Products {fmtTk(order.productsTotal, lang)} + fee {fmtTk(order.deliveryFee, lang)}{order.discountAmount > 0 ? <> − discount {fmtTk(order.discountAmount, lang)}</> : null} = collect <strong className="text-secondary font-bold">{fmtTk(cash, lang)}</strong></>}
            </p>
          </div>
        </section>

        {/* Pickup checklist (r3.1) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm space-y-space-md mt-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[22px]">checklist</span>
                {bn ? 'বাজার ও পিকআপ লিস্ট' : 'Bazaar & pickup list'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md font-bold">
                {toBnDigits(checkedItems.size, lang)} / {toBnDigits(order.items.length, lang)} {bn ? 'সম্পন্ন' : 'done'}
              </span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {bn ? 'গোশালা বাজার ও রেস্টুরেন্ট থেকে সংগ্রহ / Goshala Bazar pickup' : 'Collect from Goshala Bazar & restaurants'}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-label-md font-label-md border border-outline-variant/30 w-full">
            <span className="material-symbols-outlined text-[18px] text-tertiary">swap_horizontal_circle</span>
            <span className="font-medium text-on-surface">🔄 {bn ? 'পাওয়া না গেলে কাছাকাছি জিনিস / Replace with similar' : 'Replace with similar if unavailable'}</span>
          </div>
          <div className="space-y-2.5 pt-1">
            {order.items.map(item => {
              const checked = checkedItems.has(item.id);
              return (
                <label
                  key={item.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-xl cursor-pointer active:scale-[0.99] transition-transform',
                    checked ? 'bg-surface-container-low border border-outline-variant/40' : 'bg-surface-container-lowest border-2 border-outline-variant/50 hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      className="w-6 h-6 rounded text-primary focus:ring-primary border-outline-variant shrink-0"
                    />
                    <div>
                      <span className="font-body-lg text-body-lg font-bold text-on-surface block leading-tight">
                        {bn ? item.nameBn : item.nameEn} - {toBnDigits(item.quantity, lang)}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                      <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">
                        {bn ? item.nameEn : item.nameBn} • {item.source === 'restaurant' ? (bn ? 'রেস্টুরেন্ট পিকআপ' : 'Restaurant pickup') : (bn ? 'বাজার' : 'Bazaar')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-label-lg text-label-lg font-bold text-primary">{fmtTk(item.approxPrice * item.quantity, lang)}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {!isFinished && (
          <>
            {/* r3.1 action buttons */}
            <section className="space-y-2 pt-2">
              <button
                onClick={() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="w-full py-4 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
              >
                <span>{bn ? 'আপডেট প্যানেলে যান / Go to tracking updates' : 'Go to tracking updates'}</span>
                <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
              </button>
              <button
                onClick={() => setShowFail(true)}
                className="w-full py-2.5 px-4 text-error font-label-lg text-label-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-error-container/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">report_problem</span>
                <span>{bn ? 'সমস্যা হচ্ছে? রিপোর্ট করুন / Having an issue?' : 'Having an issue? Report it'}</span>
              </button>
            </section>

            {/* ── F10 tracking panel (r3.2) ── */}
            <div ref={panelRef} className="scroll-mt-20">
              {/* Order identity context bar (r3.2) */}
              <div className="-mx-4 bg-surface-container-lowest px-4 py-2.5 border-b border-outline-variant/30 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={FILL}>receipt_long</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#{order.id}</span>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{bn ? 'নগদ সংগ্রহ (COD)' : 'Cash on Delivery (COD)'}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="truncate">{order.customerName}</span>
                      <span>•</span>
                      <span className="font-bold text-on-surface truncate">{area}</span>
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${order.customerMobile}`}
                  aria-label={bn ? 'কাস্টমারকে কল করুন' : 'Call customer'}
                  className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]" style={FILL}>call</span>
                </a>
              </div>

              {/* Reassurance broadcast banner (r3.2) */}
              <div className="-mx-4 bg-[#FFF7ED] border-b border-[#F97316]/30 px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F97316]/15 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px] animate-pulse" style={FILL}>sensors</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#1D9D57]" />
                    <p className="font-label-md text-label-md font-bold text-[#9A3412]">
                      {bn ? 'সরাসরি আপডেট সিস্টেম (কোনো জিপিএস দরকার নেই)' : 'Live update system (no GPS needed)'}
                    </p>
                  </div>
                  <p className="font-bilingual-sub text-bilingual-sub text-[#C2410C] mt-0.5">
                    {bn ? 'প্রতিটা বোতামে চাপ দিলে কাস্টমারের কাছে সাথে সাথে নোটিফিকেশন পৌঁছায় / Every tap updates the customer instantly.' : 'Every tap updates the customer instantly.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{bn ? 'কাস্টমারকে আপডেট পাঠান' : 'Send the customer an update'}</h2>
                  <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">Send the customer an honest live status update</p>
                </div>
                <span className="font-label-sm text-label-sm uppercase bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-bold shrink-0">
                  {bn ? `ধাপ ${toBnDigits(Math.min(sentCount + 1, TRACK_STEPS.length), lang)} / ${toBnDigits(TRACK_STEPS.length, lang)}` : `Step ${Math.min(sentCount + 1, TRACK_STEPS.length)} / ${TRACK_STEPS.length}`}
                </span>
              </div>

              <div className="flex flex-col gap-3.5 mt-3">
                {TRACK_STEPS.map((step, i) => {
                  const sent = sentStepIdx[i];
                  const isCurrent = i === currentStepIdx;
                  const sentUpdate = order.trackingUpdates.find(u => u.messageEn === step.labelEn);
                  if (sent) {
                    return (
                      <div key={step.labelEn} className="bg-[#E8F5E9]/60 border-2 border-primary rounded-xl p-3.5 relative shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                              <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-headline-sm text-[16px] font-bold text-primary">{bn ? step.labelBn : step.labelEn}</h3>
                                <span className="font-label-sm text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded font-bold">{bn ? 'পাঠানো হয়েছে' : 'Sent'}</span>
                              </div>
                              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{step.subEn}</p>
                              {sentUpdate && (
                                <p className="flex items-center gap-2 mt-1.5 text-on-surface-variant flex-wrap">
                                  <span className="flex items-center gap-1 font-body-sm text-[11px] font-bold">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    {new Date(sentUpdate.timestamp).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-body-sm text-[11px]">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {sentUpdate.locationNote ?? step.locBn}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-primary text-[20px] shrink-0" style={FILL}>verified</span>
                        </div>
                      </div>
                    );
                  }
                  if (isCurrent) {
                    return (
                      <div key={step.labelEn} className="bg-surface-container-lowest border-2 border-primary rounded-2xl p-4 shadow-md ring-2 ring-primary/10 relative mt-2">
                        <span className="absolute -top-3 right-4 bg-primary text-on-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-on-primary animate-ping" />
                          {bn ? 'বর্তমান ধাপ (Current Active)' : 'Current step'}
                        </span>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[26px]" style={FILL}>{step.icon}</span>
                          </span>
                          <div>
                            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                              {step.status === 'on-the-way' ? '🚴 ' : ''}{bn ? step.labelBn : step.labelEn} / {step.labelEn}
                            </h3>
                            <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{bn ? step.subBn : step.subEn}</p>
                          </div>
                        </div>
                        {step.status === 'on-the-way' && (
                          <div className="mt-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                            <label className="block font-label-md text-label-md font-bold text-on-surface mb-2">
                              📍 {bn ? 'এখন কোথায় আছেন?' : 'Where are you now?'} <span className="font-bilingual-sub text-on-surface-variant font-normal">/ Where are you now?</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {LOCATION_CHIPS.map(loc => {
                                const selected = locChip === loc;
                                return (
                                  <button
                                    key={loc}
                                    type="button"
                                    onClick={() => setLocChip(loc)}
                                    className={clsx(
                                      'flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all',
                                      selected ? 'border-2 border-primary bg-[#E8F5E9] text-primary font-bold' : 'border border-outline-variant/60 bg-surface-container-lowest text-on-surface font-medium hover:border-primary',
                                    )}
                                  >
                                    <span className="truncate">{loc}</span>
                                    {selected
                                      ? <span className="material-symbols-outlined text-[16px] text-primary" style={FILL}>check_circle</span>
                                      : <span className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center gap-2 text-xs">
                              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">visibility</span>
                              <p className="font-body-sm text-[12px] text-on-surface-variant">
                                {bn ? <>গ্রাহক দেখতে পাবেন: <strong className="text-primary font-bold">“এখন {locChip} আছি”</strong></> : <>Customer will see: <strong className="text-primary font-bold">“Now at {locChip}”</strong></>}
                              </p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => sendTracking(
                            step.status,
                            step.labelBn,
                            step.labelEn,
                            step.status === 'on-the-way' ? `এখন ${locChip} আছি` : step.locBn,
                          )}
                          className="mt-3.5 w-full h-12 bg-primary hover:bg-[#15803D] active:scale-[0.98] text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                          <span>{bn ? 'এই আপডেট কাস্টমারকে পাঠান' : 'Send this update to the customer'}</span>
                          <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                      </div>
                    );
                  }
                  const isNext = i === currentStepIdx + 1;
                  return (
                    <div key={step.labelEn} className={clsx('bg-surface-container-low/60 border border-outline-variant/40 rounded-xl p-3.5', isNext ? 'opacity-75' : 'opacity-60')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                          </span>
                          <div>
                            <h4 className="font-label-lg text-label-lg font-bold text-on-surface-variant">{bn ? step.labelBn : step.labelEn} / {step.labelEn}</h4>
                            <p className="font-bilingual-sub text-[11px] text-outline">{bn ? step.subBn : step.subEn}</p>
                          </div>
                        </div>
                        {isNext ? (
                          <span className="flex items-center gap-1 text-outline font-label-sm text-[11px] shrink-0">
                            <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                            <span>{bn ? 'পরবর্তী ধাপ' : 'Next step'}</span>
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[18px] shrink-0">lock</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Custom message accordion (r3.2) */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setNoteOpen(v => !v)}
                    className="w-full px-4 py-3 bg-surface-container-low/40 flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
                      <span>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface block">{bn ? 'নিজের ভাষায় আপডেট লিখুন' : 'Write an update in your own words'}</span>
                        <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant block">Write an update in your own words</span>
                      </span>
                    </span>
                    <span className={clsx('material-symbols-outlined text-on-surface-variant text-[20px] transition-transform', noteOpen && 'rotate-180')}>expand_more</span>
                  </button>
                  {noteOpen && (
                    <div className="p-3.5 border-t border-outline-variant/30 flex flex-col gap-2.5">
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{bn ? 'দ্রুত বেছে নিন (Quick presets):' : 'Quick presets:'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {NOTE_PRESETS.map((p, i) => (
                          <button
                            key={p}
                            onClick={() => setNote(p)}
                            className="text-xs bg-surface-container-low hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface font-medium"
                          >
                            {['🌧️', '🚪', '📞'][i]} {p}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <input
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder={bn ? 'গ্রাহককে বার্তা লিখুন...' : 'Write a message to the customer...'}
                          className="flex-1 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body-sm"
                        />
                        <button
                          onClick={sendNote}
                          disabled={!note.trim()}
                          className="bg-primary hover:bg-[#15803D] text-on-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40"
                        >
                          {bn ? 'পাঠান' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary" style={FILL}>volunteer_activism</span>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    {bn ? 'জোভরো বিশ্বাস করে সত্য তথ্যে। কোনো কৃত্রিম অবস্থান বা কাল্পনিক গতিবিধি গ্রাহককে দেখানো হয় না।' : 'Jovro believes in honest information. No fake locations are ever shown to customers.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tracking timeline (rider's own sent history — app extension below the r3.2 panel) */}
        {order.trackingUpdates.length > 0 && (
          <>
            <p className="text-label-lg font-semibold text-on-surface mt-6 mb-2">
              {bn ? 'এ পর্যন্ত আপডেট' : 'Updates so far'}
            </p>
            <div className="flex flex-col">
              {[...order.trackingUpdates].reverse().map((upd, i) => (
                <div key={upd.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', i === 0 ? 'bg-primary' : 'bg-outline-variant')} />
                    {i < order.trackingUpdates.length - 1 && <div className="w-px flex-1 bg-outline-variant/50 mt-1" />}
                  </div>
                  <div className="pb-3.5">
                    <p className="text-body-sm font-medium text-on-surface">{bn ? upd.messageBn : upd.messageEn}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {new Date(upd.timestamp).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: '2-digit', minute: '2-digit' })}
                      {upd.locationNote && upd.locationNote !== upd.messageBn ? ` · ${upd.locationNote}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </PageFrame>

      {/* Sticky bottom CTA (r3.2) — in-flow footer above the app bottom nav */}
      {!isFinished && (
        <div className="shrink-0 px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/30 shadow-lg">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowDeliverConfirm(true)}
              className="w-full h-12 bg-primary hover:bg-[#15803D] active:scale-[0.98] text-on-primary rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow transition-all"
            >
              <span className="material-symbols-outlined text-[20px]" style={FILL}>check_circle</span>
              <span>{bn ? 'ডেলিভারি সম্পন্ন করতে যান / Proceed' : 'Proceed to complete delivery'}</span>
            </button>
            <div className="flex items-center justify-center">
              <button
                onClick={() => setShowFail(true)}
                className="font-label-sm text-label-sm text-error hover:underline flex items-center gap-1 py-1"
              >
                <span className="material-symbols-outlined text-[14px]">report_problem</span>
                <span>{bn ? "ডেলিভারি করতে পারছেন না? / Couldn't deliver?" : "Couldn't deliver?"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp FAB (r3.1 / r3.2) */}
      <a
        href={OPERATOR.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-32 right-4 z-50 w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[28px]" style={FILL}>chat</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
      </a>
    </div>
  );
}
