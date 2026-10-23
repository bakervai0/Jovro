import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits, areaName } from '../../services/orderUtils';
import type { ProblemType } from '../../types';

const ISSUE_TYPES: { id: ProblemType; labelBn: string; labelEn: string }[] = [
  { id: 'wrong-item', labelBn: 'ভুল জিনিস এসেছে', labelEn: 'Wrong item' },
  { id: 'missing-item', labelBn: 'জিনিস কম এসেছে', labelEn: 'Missing items' },
  { id: 'damaged', labelBn: 'নষ্ট বা খারাপ মানের', labelEn: 'Damaged or poor quality' },
  { id: 'late-delivery', labelBn: 'ডেলিভারি দেরি হয়েছে', labelEn: 'Late delivery' },
  { id: 'other', labelBn: 'অন্য সমস্যা', labelEn: 'Something else' },
];

export default function ReportScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = state.lang;
  const bn = lang === 'bn';

  // Only the customer's own orders can be reported on — no fallback.
  const orders = state.orders.filter(o => o.customerId === state.user?.id);

  const [orderId, setOrderId] = useState<string>(searchParams.get('order') ?? '');
  const [issueType, setIssueType] = useState<ProblemType | null>(null);
  const [details, setDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const canSubmit = !!orderId && !!issueType;
  const selectedOrder = orders.find(o => o.id === orderId);
  const selectedRider = selectedOrder?.riderId
    ? state.riders.find(r => r.id === selectedOrder.riderId)
    : undefined;
  const issueLabel = ISSUE_TYPES.find(t => t.id === issueType);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(bn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long' }).format(new Date(iso));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!canSubmit || !issueType) return;
    // Record the report in shared state → it lands in the admin
    // problem-reports inbox (flow 5), and flag the order (H19).
    const ref = `PR-${Date.now().toString().slice(-6)}`;
    const order = orders.find(o => o.id === orderId);
    dispatch({
      type: 'ADD_PROBLEM_REPORT',
      report: {
        id: ref,
        orderId,
        customerId: state.user?.id ?? order?.customerId ?? 'user-demo',
        customerName: state.user?.nameBn ?? state.user?.name ?? order?.customerName ?? '',
        problemType: issueType,
        descriptionBn: details || undefined,
        descriptionEn: details || undefined,
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    });
    if (order && !order.hasComplaint) {
      dispatch({ type: 'UPDATE_ORDER', order: { ...order, hasComplaint: true, updatedAt: new Date().toISOString() } });
    }
    setSubmittedRef(ref);
  };

  const langChip = (
    <button
      onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
      className="px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1 shrink-0"
    >
      <span className={bn ? 'font-semibold text-on-surface' : ''}>বাংলা</span>
      <span className="text-outline-variant">|</span>
      <span className={!bn ? 'font-semibold text-on-surface' : ''}>EN</span>
    </button>
  );

  // ── Submitted confirmation (Stitch 26b) ─────────────────────
  if (submittedRef) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <header className="bg-surface-container-lowest/95 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-outline-variant/30 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="text-label-lg font-label-lg text-on-surface leading-tight">{bn ? 'অর্ডার সমস্যা রিপোর্ট' : 'Order problem report'}</span>
              <span className="text-bilingual-sub font-bilingual-sub text-outline">Issue Confirmation</span>
            </div>
          </div>
          {langChip}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-6 flex flex-col gap-5">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-on-primary-container flex items-center justify-center border-4 border-surface-container-lowest shadow-sm">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-inner">
                  <span className="material-symbols-outlined text-[32px]">check</span>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-on-primary-container text-primary text-label-sm font-label-sm mb-1.5 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>{bn ? 'রিপোর্ট আইডি' : 'Report ID'}: {submittedRef}</span>
            </div>
            <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mb-1">
              {bn ? 'খবরটা পেয়েছি' : 'We received your report'} <span className="text-outline font-normal">/</span>{' '}
              <span className="text-headline-sm font-headline-sm">{bn ? 'We received your report' : 'খবরটা পেয়েছি'}</span>
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-[340px]">
              {bn ? 'আপনার সমস্যাটি গুরুত্বের সাথে নেওয়া হয়েছে।' : 'Your issue has been taken seriously.'}
              <span className="font-bold text-on-surface block mt-0.5">
                {bn ? 'অর্ডার নম্বর' : 'Order number'}: #{orderId}
              </span>
            </p>
          </div>

          {/* We will call you card */}
          <section className="rounded-xl bg-surface-container-lowest p-4 relative overflow-hidden shadow-sm border border-outline-variant/20">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/5 rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h2 className="text-label-lg font-label-lg text-primary tracking-tight">
                  {bn ? 'আমরা নিজে কল করে সমস্যাটা ঠিক করে দেব' : 'We will call you and fix it ourselves'}
                </h2>
                <p className="text-bilingual-sub font-bilingual-sub text-outline">We will call you and make it right</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30 mb-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">timer</span>
                <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">
                  {bn ? (
                    <>
                      লালমনিরহাট সদর হাবের কন্ট্রোল রুম
                      {selectedRider && <> বা সাইকেল রাইডার <strong className="font-semibold text-primary">{selectedRider.nameBn}</strong></>}{' '}
                      আগামী <strong className="text-on-surface font-semibold underline decoration-primary/40 underline-offset-2">১৫ মিনিটের মধ্যে</strong>{' '}
                      আপনার নম্বরে (<span className="font-medium">{toBnDigits(state.user?.mobile ?? selectedOrder?.customerMobile ?? '', lang)}</span>) কল করবেন।
                    </>
                  ) : (
                    <>
                      The Lalmonirhat Sadar hub control room
                      {selectedRider && <> or cycle rider <strong className="font-semibold text-primary">{selectedRider.name}</strong></>}{' '}
                      will call your number (<span className="font-medium">{state.user?.mobile ?? selectedOrder?.customerMobile ?? ''}</span>) within{' '}
                      <strong className="text-on-surface font-semibold underline decoration-primary/40 underline-offset-2">15 minutes</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-body-sm font-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">swap_horizontal_circle</span>
              <p className="leading-snug">
                {bn
                  ? 'ভুল পণ্য ফেরত নেওয়া হবে এবং সঠিক পণ্য ফ্রিতে দ্রুত পৌঁছে দেওয়া হবে, অথবা আপনি তৎক্ষণাৎ সম্পূর্ণ নগদ টাকা রিফান্ড পাবেন।'
                  : 'The wrong item will be taken back and the right one delivered free and fast — or you will get a full cash refund right away.'}
              </p>
            </div>
          </section>

          {/* Report summary */}
          <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">receipt_long</span>
                <span className="text-label-md font-label-md text-on-surface">{bn ? 'জমা দেওয়া বিবরণের সারসংক্ষেপ' : 'Submitted report summary'}</span>
              </div>
              <span className="text-bilingual-sub font-bilingual-sub text-outline">Report Summary</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-error mt-0.5">report_problem</span>
                  <div>
                    <span className="text-body-sm font-body-sm text-outline block">{bn ? 'সমস্যার ধরন' : 'Issue'} / Issue</span>
                    <span className="text-label-md font-label-md text-on-surface font-semibold">
                      {issueLabel ? (bn ? `${issueLabel.labelBn} (${issueLabel.labelEn})` : issueLabel.labelEn) : '—'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-label-sm font-label-sm rounded bg-error-container text-on-error-container shrink-0">
                  {bn ? 'তদন্তাধীন' : 'Under review'}
                </span>
              </div>
              {details.trim() && (
                <div className="bg-surface rounded-lg p-2 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-bilingual-sub font-bilingual-sub text-outline uppercase tracking-wider">{bn ? 'আপনার মন্তব্য' : 'Your note'} / Customer Note</span>
                  <p className="text-body-sm font-body-sm text-on-surface italic bg-surface-container-lowest p-2 rounded border border-outline-variant/10">“{details}”</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1.5 rounded-lg border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[18px] text-primary">image</span>
                  <div className="truncate">
                    <span className="text-bilingual-sub font-bilingual-sub text-outline block">{bn ? 'সংযুক্তি' : 'Attachment'}</span>
                    <span className="text-body-sm font-body-sm font-medium text-on-surface truncate">
                      {photoUrl ? (bn ? '১টি ছবি সংযুক্ত' : '1 photo attached') : bn ? 'ছবি নেই' : 'No photo'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1.5 rounded-lg border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[18px] text-outline">schedule</span>
                  <div className="truncate">
                    <span className="text-bilingual-sub font-bilingual-sub text-outline block">{bn ? 'সময়' : 'Time'}</span>
                    <span className="text-body-sm font-body-sm font-medium text-on-surface truncate">{fmtDate(new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hub strip */}
          <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 flex items-center justify-between text-on-surface-variant">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary">store</span>
              <div>
                <span className="text-body-sm font-body-sm font-medium text-on-surface block">{OPERATOR.addressBn}</span>
                <span className="text-bilingual-sub font-bilingual-sub text-outline">{bn ? 'সরাসরি সমাধান নিশ্চিত করা হবে' : 'Resolution will be confirmed directly'}</span>
              </div>
            </div>
            {selectedOrder && (
              <span className="text-bilingual-sub font-bilingual-sub px-2 py-1 bg-surface-container-low rounded-full text-primary font-semibold shrink-0">
                {areaName(state.areas, selectedOrder.deliveryAreaId, lang)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <a
              href={OPERATOR.phoneTel}
              className="w-full h-12 rounded-full border-[1.5px] border-primary bg-surface-container-lowest text-primary flex items-center justify-center gap-2 text-label-lg font-label-lg active:scale-95 duration-150 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              <span>{bn ? 'জরুরি প্রয়োজনে সরাসরি কল করুন' : 'Call directly if urgent'}</span>
              <span className="text-bilingual-sub font-bilingual-sub font-normal opacity-75">/ Control Room</span>
            </a>
            <button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 text-label-lg font-label-lg active:scale-95 duration-150 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>{bn ? 'হোমে ফিরে যান' : 'Back to home'}</span>
              <span className="text-bilingual-sub font-bilingual-sub font-normal text-on-primary-container">/ Back to Home</span>
            </button>
            {/* Kept from earlier build (not in 26b): quick link to orders */}
            <button
              onClick={() => navigate('/orders')}
              className="w-full h-11 rounded-full text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              {bn ? 'আমার অর্ডার দেখুন' : 'View my orders'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Report form (Stitch 26) ─────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-[#FAFAF7] overflow-hidden">
      <header className="bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all duration-150">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-sm font-headline-sm text-on-surface leading-tight">
              {bn ? 'সমস্যা জানান' : 'Report a Problem'} <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ Report</span>
            </h1>
            <p className="text-bilingual-sub font-bilingual-sub text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              {bn ? 'আমরা নিজে সমাধান করে দেব' : 'We will fix it ourselves'}
            </p>
          </div>
        </div>
        {langChip}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-4 space-y-4">
        {/* Order picker — rich cards per design 26 */}
        <div className="space-y-2">
          <p className="text-label-lg font-semibold text-on-surface px-1">
            {bn ? 'অর্ডার বেছে নিন' : 'Choose the order'} <span className="text-secondary font-semibold text-label-md">*</span>
          </p>
          {orders.map(order => {
            const rider = order.riderId ? state.riders.find(r => r.id === order.riderId) : undefined;
            const selected = orderId === order.id;
            return (
              <button
                key={order.id}
                onClick={() => setOrderId(order.id)}
                className={clsx(
                  'w-full text-left bg-surface-container-lowest rounded-2xl p-4 border shadow-sm transition-all',
                  selected ? 'border-primary ring-1 ring-primary/40' : 'border-outline-variant/30',
                )}
              >
                <div className="flex items-start justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-label-lg font-label-lg text-on-surface">Order #{order.id}</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
                        <span className="text-body-sm font-body-sm text-on-surface-variant">{fmtDate(order.createdAt)}</span>
                      </div>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">ক্যাশ অন ডেলিভারি (Cash On Delivery)</p>
                    </div>
                  </div>
                  <span className="text-headline-sm font-headline-sm text-primary tracking-tight">{fmtTk(order.finalTotal, lang)}</span>
                </div>
                <div className="py-3 space-y-1.5">
                  <div className="flex items-center text-body-sm font-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-outline text-[16px] mr-2 shrink-0">shopping_bag</span>
                    <span className="font-medium truncate">{order.items.map(i => (bn ? i.nameBn : i.nameEn)).join(', ')}</span>
                  </div>
                  <div className="flex items-center text-body-sm font-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline text-[16px] mr-2 shrink-0">storefront</span>
                    <span>
                      {bn ? 'সংগৃহীত: ' : 'Collected from: '}
                      <span className="text-on-surface font-medium">
                        {order.items.some(i => i.source === 'bazaar') ? (bn ? 'গোশালা বাজার (Goshala Bazar)' : 'Goshala Bazar') : bn ? 'রেস্টুরেন্ট' : 'Restaurant'}
                      </span>
                    </span>
                  </div>
                </div>
                {rider && (
                  <div className="bg-surface-container-low rounded-xl px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">pedal_bike</span>
                      <span className="text-label-md font-label-md text-on-surface">
                        {bn ? 'কুরিয়ার' : 'Courier'}: {bn ? rider.nameBn : rider.name}
                      </span>
                      <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30">
                        {rider.vehicleType === 'bicycle' ? (bn ? 'সাইকেল' : 'Bicycle') : bn ? 'মোটরবাইক' : 'Motorbike'}
                      </span>
                    </div>
                    {selected && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                  </div>
                )}
              </button>
            );
          })}
          {orders.length === 0 && (
            <p className="text-body-md text-on-surface-variant px-1">{bn ? 'কোনো অর্ডার নেই।' : 'No orders yet.'}</p>
          )}
        </div>

        {/* Issue reasons */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-label-lg font-label-lg text-on-surface">
              {bn ? 'সমস্যার কারণ বেছে নিন' : 'Select the issue'} <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ Select issue</span>
            </h2>
            <span className="text-bilingual-sub font-bilingual-sub text-secondary font-semibold">*{bn ? 'আবশ্যক' : 'Required'}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {ISSUE_TYPES.map(t => {
              const selected = issueType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setIssueType(t.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-label-md font-label-md active:scale-95 transition-all duration-150',
                    selected
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'border border-outline-variant/60 bg-surface-container-lowest text-on-surface',
                  )}
                >
                  <span className={clsx('material-symbols-outlined text-[18px]', selected ? 'text-primary' : 'text-outline')}>
                    {selected ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{bn ? `${t.labelBn} / ${t.labelEn}` : t.labelEn}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Details */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-2">
          <label className="text-label-lg font-label-lg text-on-surface block" htmlFor="problem-detail">
            {bn ? 'বিস্তারিত লিখুন' : 'Tell us what happened'} <span className="text-body-sm font-body-sm text-on-surface-variant font-normal">/ Tell us what happened</span>
          </label>
          <textarea
            id="problem-detail"
            value={details}
            onChange={e => setDetails(e.target.value)}
            maxLength={250}
            rows={3}
            placeholder={bn ? 'যেমন: চালের বস্তা ঠিক ছিল কিন্তু ২ কেজি আলুর জায়গায় ১ কেজি দেওয়া হয়েছে...' : 'Tell us what happened...'}
            className="w-full rounded-xl border border-outline-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md font-body-md text-on-surface placeholder:text-outline/70 p-3 outline-none transition-all resize-none bg-surface-container-lowest"
          />
          <div className="flex justify-between items-center pt-1 text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">translate</span>
              {bn ? 'বাংলা বা বাংলিশে লিখুন' : 'Write in Bangla or Banglish'}
            </span>
            <span className="text-outline">{toBnDigits(details.length, lang)} / {toBnDigits(250, lang)} {bn ? 'অক্ষর' : 'chars'}</span>
          </div>
        </section>

        {/* Photo */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-label-lg font-label-lg text-on-surface">{bn ? 'পণ্যের বা রসিদের ছবি যোগ করুন' : 'Add a photo of the item or receipt'}</h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Add photo of item or receipt (optional)</p>
            </div>
            <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant">{bn ? 'ঐচ্ছিক' : 'Optional'}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="problem" className="w-full h-44 object-cover rounded-xl border border-outline-variant/40" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                aria-label="Remove photo"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <p className="text-label-sm text-on-surface-variant mt-1.5">{bn ? 'ছবি যোগ হয়েছে (শুধু প্রিভিউ — ডেমো)' : 'Photo attached (preview only — demo)'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 active:scale-95 transition-all text-center h-28"
              >
                <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                </span>
                <span className="text-label-sm font-label-sm text-primary">{bn ? 'ছবি তুলুন' : 'Take photo'}</span>
                <span className="text-[9px] text-on-surface-variant leading-none mt-0.5">{bn ? 'ক্যামেরা খুলবে' : 'Opens camera'}</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/50 active:scale-95 transition-all text-center h-28"
              >
                <span className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                </span>
                <span className="text-label-sm font-label-sm text-on-surface">{bn ? 'গ্যালারি' : 'Gallery'}</span>
                <span className="text-[9px] text-on-surface-variant leading-none mt-0.5">{bn ? 'ফাইল পছন্দ করুন' : 'Choose a file'}</span>
              </button>
              <div className="rounded-xl border border-outline-variant/30 overflow-hidden relative h-28 bg-gradient-to-br from-surface-container to-surface-container-high flex flex-col justify-end p-2">
                <span className="material-symbols-outlined text-outline/50 text-[28px] absolute top-3 left-1/2 -translate-x-1/2">receipt_long</span>
                <div className="relative z-10 bg-inverse-surface/80 rounded px-1.5 py-0.5 text-center">
                  <span className="text-[9px] text-inverse-on-surface font-medium leading-none">{bn ? 'নমুনা রসিদ' : 'Sample receipt'}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-bilingual-sub font-bilingual-sub text-primary pt-1">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{bn ? 'ছবি দিলে সমাধান দ্রুত ও নিখুঁত হয়' : 'A photo makes the fix faster and more accurate'}</span>
          </div>
        </section>

        {/* Honesty policy */}
        <section className="bg-[#E8F5E9] border border-primary/20 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-label-lg font-label-lg text-primary flex items-center gap-1.5">
                <span>{bn ? 'জোভ্রো সততা নীতি' : 'Jovro honesty policy'}</span>
                <span className="text-label-sm font-label-sm bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{bn ? '১০০% নিশ্চয়তা' : '100% assured'}</span>
              </h4>
              <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">
                {bn ? (
                  <>কোনো পণ্য ভুল হলে বা ঘাটতি থাকলে আমরা পুনরায় <strong className="text-primary font-bold">ফ্রিতে পৌঁছে দেব</strong> অথবা টাকা ফেরত দেব। লালমনিরহাট কন্ট্রোল রুম অপারেটর সরাসরি আপনাকে কল করবেন।</>
                ) : (
                  'If anything is wrong or missing, we will re-deliver it free or refund you. The Lalmonirhat control-room operator will call you directly.'
                )}
              </p>
            </div>
          </div>
        </section>

        <div className="text-center py-1">
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
            {bn ? 'লালমনিরহাট সদর ও গোশালা বাজার কভারেজ জোন' : 'Lalmonirhat Sadar & Goshala Bazar coverage zone'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 shrink-0">
        <div className="px-4 py-3 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 bg-primary text-on-primary rounded-full flex items-center justify-center gap-2 text-label-lg font-label-lg shadow-md transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>{bn ? 'রিপোর্ট পাঠান / Send Report' : 'Send Report'}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          {!canSubmit && (
            <p className="text-label-sm text-on-surface-variant text-center">
              {bn ? 'আগে অর্ডার আর সমস্যার ধরন বেছে নিন' : 'Choose an order and an issue type first'}
            </p>
          )}
          <a
            href={OPERATOR.phoneTel}
            className="w-full py-2 rounded-full flex items-center justify-center gap-1.5 text-secondary text-label-md font-label-md active:scale-95 transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>{bn ? 'জরুরি প্রয়োজনে সরাসরি কন্ট্রোল রুমে কল দিন' : 'Call the control room directly if urgent'}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
