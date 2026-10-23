import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame } from '../../components/layout/PageFrame';
import { Button } from '../../components/ui/Button';
import {
  STATUS_META, SLOT_META, nextStatus, areaName, fmtTk, toBnDigits, uid,
} from '../../services/orderUtils';
import type { OrderStatus } from '../../types';

const STEP_LABELS: { bn: string; en: string }[] = [
  { bn: 'প্রাপ্ত', en: 'Received' },
  { bn: 'নিশ্চিত', en: 'Confirmed' },
  { bn: 'বাজারে কেনা', en: 'Buying' },
  { bn: 'রওনা', en: 'On the way' },
  { bn: 'শেষ', en: 'Done' },
];
const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way', 'delivered'];

/**
 * G2 — Operator order detail, aligned to Stitch 22: customer
 * card, grouped buying checklist, cash-memo audit card and the
 * 5-step "move to next status" action bar. Assign-to-me and the
 * status advance keep their existing UPDATE_ORDER behaviour.
 * The audit card (actual memo total + receipt photo) is local
 * demo state, as in the design — it is not persisted.
 */
export default function OperatorOrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [actualTotal, setActualTotal] = useState('');
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const order = state.orders.find(o => o.id === id);
  if (!order) {
    return (
      <PageFrame>
        <p className="py-16 text-center text-body-lg text-on-surface-variant">
          {bn ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}
        </p>
      </PageFrame>
    );
  }

  const meta = STATUS_META[order.status];
  const slot = SLOT_META[order.timeSlot];
  const next = nextStatus(order);
  const assignee = order.riderId ? state.riders.find(r => r.id === order.riderId) : undefined;
  // The operator delivers himself through the primary demo rider record.
  const operatorRider = state.riders.find(r => r.id === 'rider-01') ?? state.riders.find(r => r.status === 'active');
  const isMine = operatorRider ? order.riderId === operatorRider.id : false;
  const stepIdx = STATUS_ORDER.indexOf(order.status);
  const actualNum = parseInt(actualTotal, 10) || 0;

  const bazaarItems = order.items.filter(i => i.source === 'bazaar');
  const restaurantItems = order.items.filter(i => i.source === 'restaurant');

  const assignToMe = () => {
    if (!operatorRider) return;
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, riderId: operatorRider.id, updatedAt: new Date().toISOString() } });
    dispatch({
      type: 'LOG_ACTIVITY',
      entry: {
        id: uid('act'),
        actorName: state.user?.nameBn ?? state.user?.name ?? 'অপারেটর',
        action: `অর্ডার ${order.id} নিজের (রাইডার) কাছে দিয়েছেন`,
        at: new Date().toISOString(),
        category: 'order',
      },
    });
  };

  const advance = () => {
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
  };

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const s = new Set(prev);
      if (s.has(itemId)) s.delete(itemId); else s.add(itemId);
      return s;
    });
  };

  const itemRow = (item: (typeof order.items)[number], index: number, fixed: boolean) => {
    const checked = checkedItems.has(item.id);
    return (
      <label
        key={item.id}
        className={clsx(
          'flex items-start gap-3 p-2.5 rounded-xl bg-surface cursor-pointer border transition-colors',
          checked ? 'border-primary/20 bg-primary-container/5' : 'border-transparent',
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleItem(item.id)}
          className="mt-1 w-6 h-6 rounded accent-[#1D9D57] cursor-pointer shrink-0"
        />
        <span className="flex-1 min-w-0">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-body-md font-body-md font-bold text-on-surface">
              {toBnDigits(index + 1, lang)}. {bn ? item.nameBn : item.nameEn}
            </span>
            <span className={clsx('text-label-md font-label-md font-bold shrink-0', fixed ? 'text-secondary' : 'text-on-surface')}>
              {fixed ? (bn ? 'নির্ধারিত' : 'Fixed') : (bn ? 'আনুমানিক' : 'Approx')} {fmtTk(item.approxPrice * item.quantity, lang)}
            </span>
          </span>
          <span className="flex items-center gap-2 mt-0.5">
            <span className="text-bilingual-sub font-bilingual-sub text-outline font-semibold">
              {bn ? 'পরিমাণ' : 'Qty'}: {toBnDigits(item.quantity, lang)}{item.unit ? ` ${item.unit}` : ''}
            </span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? item.nameEn : item.nameBn}</span>
          </span>
        </span>
      </label>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Design 22 header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            aria-label="Go back to operator orders"
            onClick={() => navigate('/staff')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-primary text-[26px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight leading-none truncate">
              {bn ? `অর্ডার #${order.id} বিস্তারিত` : `Order #${order.id} details`}
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">Lalmonirhat Sadar Express Courier</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/15 text-primary border border-primary/30 shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-label-sm font-label-sm uppercase tracking-wide">{bn ? meta.labelBn : meta.labelEn} / {meta.labelEn}</span>
        </span>
      </header>

      <PageFrame>
        {/* Customer card */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-3.5 mt-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">{bn ? 'গ্রাহকের নাম (Customer)' : 'Customer name'}</span>
              <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-0.5">{order.customerName}</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">
                {order.customerName} • <span className="text-on-surface font-semibold">{order.customerMobile}</span>
              </p>
            </div>
            <span className="w-11 h-11 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </span>
          </div>
          <a
            href={`tel:${order.customerMobile}`}
            className="w-full min-h-[52px] rounded-full border-2 border-primary bg-primary-container/10 text-primary flex items-center justify-center gap-2.5 px-4 font-label-lg text-label-lg active:scale-[0.98] transition-transform shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            <span className="font-bold text-base tracking-wide">{bn ? 'কাস্টমারকে কল করুন / Call Customer' : 'Call Customer'}</span>
          </a>
          <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2 text-on-surface-variant gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <span className="text-body-md font-body-md font-bold text-on-surface truncate">{areaName(state.areas, order.deliveryAreaId, lang)}</span>
            </span>
            <span className="text-label-md font-label-md px-2 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-bold border border-secondary-fixed shrink-0">
              {bn ? 'ডেলিভারি চার্জ' : 'Delivery charge'} {fmtTk(order.deliveryFee, lang)}
            </span>
          </div>
          <div className="bg-secondary-fixed/30 border border-secondary/20 rounded-xl p-3.5 space-y-1">
            <p className="flex items-center gap-1 text-secondary font-bold text-label-md font-label-md">
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>{bn ? 'বিস্তারিত ঠিকানা (Landmark):' : 'Detailed address (Landmark):'}</span>
            </p>
            <p className="text-body-md font-body-md text-on-surface font-semibold leading-snug">“{order.deliveryAddress}”</p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {bn ? `${slot.labelBn} • ${slot.rangeBn}` : `${slot.labelEn} • ${slot.rangeEn}`}
            </p>
          </div>
          {order.orderNote && (
            <div className="bg-surface-container-low rounded-xl p-3 border-l-4 border-primary flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">sticky_note_2</span>
              <div>
                <span className="text-label-sm font-label-sm text-outline block uppercase font-bold">{bn ? 'অর্ডার নোট / Special Instructions' : 'Order note / Special Instructions'}</span>
                <p className="text-body-sm font-body-sm text-on-surface font-medium leading-relaxed mt-0.5">{order.orderNote}</p>
              </div>
            </div>
          )}
        </section>

        {/* Checklist */}
        <section className="space-y-4 mt-5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">
                {bn ? 'বাজার তালিকা ও পণ্যসমূহ (Checklist)' : 'Buying list & items (Checklist)'}
              </h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                {bn ? 'কেনার পর বক্সে টিক দিন / Tap checkbox once purchased' : 'Tap checkbox once purchased'}
              </p>
            </div>
            <span className="text-label-sm font-label-sm bg-primary-container text-on-primary-container px-2.5 py-1 rounded-full font-bold shrink-0">
              {bn ? `${toBnDigits(order.items.length, lang)}টি পণ্য` : `${order.items.length} items`}
            </span>
          </div>

          {bazaarItems.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                  </span>
                  <div>
                    <h4 className="text-body-lg font-body-lg font-bold text-on-surface leading-none">{bn ? 'গোশালা বাজার (কাঁচাবাজার)' : 'Goshala Bazar'}</h4>
                    <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Goshala Bazaar</span>
                  </div>
                </div>
                <span className="text-label-sm font-label-sm text-primary font-bold bg-primary-container/10 px-2 py-0.5 rounded">
                  {bn ? `${toBnDigits(bazaarItems.length, lang)} টি আইটেম` : `${bazaarItems.length} items`}
                </span>
              </div>
              {bazaarItems.map((item, i) => itemRow(item, i, false))}
            </div>
          )}

          {restaurantItems.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[18px]">restaurant</span>
                  </span>
                  <div>
                    <h4 className="text-body-lg font-body-lg font-bold text-on-surface leading-none">{bn ? 'রেস্টুরেন্ট পিকআপ' : 'Restaurant pickup'}</h4>
                    <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Restaurant</span>
                  </div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary font-bold bg-secondary-fixed/30 px-2 py-0.5 rounded">
                  {bn ? `${toBnDigits(restaurantItems.length, lang)} টি আইটেম` : `${restaurantItems.length} items`}
                </span>
              </div>
              {restaurantItems.map((item, i) => itemRow(item, bazaarItems.length + i, true))}
            </div>
          )}
        </section>

        {/* Rider assignment (functional — not in design 22) */}
        <div className="mt-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 flex flex-col gap-3">
          <p className="text-label-lg font-semibold text-on-surface">{bn ? 'রাইডার' : 'Rider'}</p>
          <p className="text-body-md text-on-surface-variant">
            {assignee
              ? (bn ? `${assignee.nameBn} (${assignee.mobile})` : `${assignee.name} (${assignee.mobile})`)
              : (bn ? 'এখনো কাউকে দেওয়া হয়নি' : 'Not assigned yet')}
          </p>
          {!isMine && (
            <Button variant="secondary" size="full" icon="moped" onClick={assignToMe}>
              {bn ? 'আমাকেই দিন (আমি ডেলিভারি করব)' : 'Assign to me (I will deliver)'}
            </Button>
          )}
        </div>

        {/* Cash memo audit (design 22 — local demo state) */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 border-2 border-primary/20 shadow-md space-y-4 mt-5">
          <div className="border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              <h3 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">
                {bn ? 'রসিদ অনুযায়ী চূড়ান্ত বিল হিসাব' : 'Final bill by receipt'}
              </h3>
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">
              Actual Cash Memo Audit • {bn ? 'বাজারে আসল ক্যাশ মেমোতে যা উঠেছে তা লিখুন:' : 'Enter what the actual bazaar cash memo says:'}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-label-md font-label-md font-bold text-on-surface block">
              {bn ? 'আসল পণ্যের মোট দাম (Bazaar Actual Item Total):' : 'Actual item total (Bazaar Actual Item Total):'}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-headline-sm font-bold text-on-surface">৳</span>
              <input
                type="number"
                inputMode="numeric"
                value={actualTotal}
                onChange={e => setActualTotal(e.target.value)}
                placeholder="0"
                className="w-full h-14 pl-10 pr-20 text-headline-md font-headline-md font-bold bg-surface rounded-xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-surface transition-all"
              />
              <span className="absolute right-4 text-label-md font-label-md text-outline font-bold">টাকা (BDT)</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-body-md font-body-md text-on-surface-variant">
              <span>{bn ? 'পণ্যগুলোর মেমো মূল্য:' : 'Memo item total:'}</span>
              <span className="font-bold text-on-surface">৳ {toBnDigits(actualNum.toLocaleString('en-IN'), lang)}</span>
            </div>
            <div className="flex items-center justify-between text-body-md font-body-md text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-primary">pedal_bike</span>
                {bn ? '+ সাইকেল ডেলিভারি চার্জ:' : '+ Delivery charge:'}
              </span>
              <span className="font-bold text-on-surface">{fmtTk(order.deliveryFee, lang)}</span>
            </div>
            <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-headline-sm font-headline-sm font-bold text-on-surface">{bn ? 'চূড়ান্ত প্রদেয় মোট বিল:' : 'Final payable total:'}</span>
              <span className="text-headline-md font-headline-md font-extrabold text-primary">{fmtTk(actualNum + order.deliveryFee, lang)}</span>
            </div>
            <p className="text-[11px] text-outline">
              {bn ? `আনুমানিক বিল ছিল ${fmtTk(order.finalTotal, lang)} (পণ্য ${fmtTk(order.productsTotal, lang)} + ফি ${fmtTk(order.deliveryFee, lang)})` : `Estimated bill was ${fmtTk(order.finalTotal, lang)}`}
            </p>
          </div>
          <div className="space-y-2 pt-1">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setReceiptName(e.target.files?.[0]?.name ?? null)} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full min-h-[50px] rounded-xl border border-dashed border-primary bg-primary-container/10 text-primary flex items-center justify-center gap-2 px-3 font-label-lg text-label-lg active:scale-[0.99] transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">photo_camera</span>
              <span className="font-bold">{bn ? '📷 আসল ক্যাশ মেমোর ছবি তুলুন / Attach Receipt Photo' : 'Attach Receipt Photo'}</span>
            </button>
            {receiptName && (
              <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                  <span className="text-body-sm font-body-sm font-semibold text-on-surface truncate">{receiptName}</span>
                </span>
                <span className="text-label-sm font-label-sm text-primary font-bold bg-surface-container-lowest px-2 py-0.5 rounded border border-primary/20 shrink-0">
                  {bn ? '১টি রসিদ সংযুক্ত ✓' : '1 receipt attached ✓'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Step progress + advance (design 22 footer, in-flow) */}
        {next ? (
          <div className="mt-5 pb-2">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-outline px-0.5">
              {STEP_LABELS.map((s, i) => (
                <span
                  key={s.en}
                  className={clsx(
                    'flex items-center gap-0.5',
                    i < stepIdx ? 'text-primary' : i === stepIdx ? 'text-primary font-extrabold bg-primary-container/15 px-1.5 py-0.2 rounded' : 'text-outline',
                  )}
                >
                  {i < stepIdx && <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                  {toBnDigits(i + 1, lang)}. {bn ? s.bn : s.en}{i === stepIdx ? ' [Active]' : ''}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5 w-full h-2 mb-3">
              {STEP_LABELS.map((s, i) => (
                <div key={s.en} className={clsx('h-full rounded-full relative overflow-hidden', i < stepIdx ? 'bg-primary' : i === stepIdx ? 'bg-primary' : 'bg-surface-container-high')}>
                  {i === stepIdx && <div className="absolute inset-0 bg-primary-fixed-dim/40 animate-pulse" />}
                </div>
              ))}
            </div>
            <button
              onClick={advance}
              className="w-full h-[58px] rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 px-4 shadow-md transition-all active:scale-[0.98] select-none"
            >
              <span className="text-headline-sm font-headline-sm font-bold tracking-tight text-white flex items-center gap-1.5 text-center">
                {bn ? `পরের ধাপে নিন / Move to next status: '${STATUS_META[next].labelBn}'` : `Move to next status: '${STATUS_META[next].labelEn}'`}
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </span>
            </button>
            <p className="text-center text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-1 font-medium">
              {bn ? 'ট্যাপ করলে কাস্টমারের কাছে স্ট্যাটাস আপডেট যাবে' : 'Tapping sends a status update to the customer'}
            </p>
          </div>
        ) : (
          <p className="text-center text-body-md text-on-surface-variant py-5">
            {bn ? 'এই অর্ডারের কাজ শেষ।' : 'This order is complete.'}
          </p>
        )}
      </PageFrame>
    </div>
  );
}
