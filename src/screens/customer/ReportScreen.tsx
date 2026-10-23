import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import type { ProblemType } from '../../types';

const ISSUE_TYPES: { id: ProblemType; labelBn: string; labelEn: string; icon: string }[] = [
  { id: 'wrong-item', labelBn: 'ভুল জিনিস', labelEn: 'Wrong item', icon: 'swap_horiz' },
  { id: 'missing-item', labelBn: 'কম এসেছে', labelEn: 'Missing item', icon: 'remove_shopping_cart' },
  { id: 'damaged', labelBn: 'নষ্ট', labelEn: 'Damaged', icon: 'broken_image' },
  { id: 'late-delivery', labelBn: 'দেরি হয়েছে', labelEn: 'Late', icon: 'schedule' },
];

export default function ReportScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const myOrders = state.orders.filter(o => o.customerId === state.user?.id);
  const orders = myOrders.length > 0 ? myOrders : state.orders;

  const [orderId, setOrderId] = useState<string>('');
  const [issueType, setIssueType] = useState<ProblemType | null>(null);
  const [details, setDetails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = !!orderId && !!issueType;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Demo: the report is recorded locally with a reference id (D6).
    setSubmittedRef(`PR-${Date.now().toString().slice(-6)}`);
  };

  // ── D6: submitted confirmation ──────────────────────────────
  if (submittedRef) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <TopAppBar showBack title={lang === 'bn' ? 'সমস্যা জানান' : 'Report a Problem'} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-success text-[44px]">check_circle</span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {lang === 'bn' ? 'রিপোর্ট পেয়েছি' : 'Report received'}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {lang === 'bn'
              ? `আপনার রিপোর্ট (${submittedRef}) আমাদের টিমের কাছে গেছে। অর্ডার ${orderId}-এর বিষয়টি দেখে আমরা ফোনে যোগাযোগ করবো। ভুল/কম/নষ্ট জিনিসের ক্ষেত্রে রিপ্লেসমেন্ট বা রিফান্ড নীতি প্রযোজ্য হবে।`
              : `Your report (${submittedRef}) has reached our team. We will check order ${orderId} and call you. The replacement & refund policy applies for wrong, missing or damaged items.`}
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <Button variant="primary" size="full" icon="receipt_long" onClick={() => navigate('/orders')}>
              {lang === 'bn' ? 'আমার অর্ডার' : 'My Orders'}
            </Button>
            <Button variant="outline" size="full" icon="home" onClick={() => navigate('/')}>
              {lang === 'bn' ? 'হোমে যান' : 'Go Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'সমস্যা জানান' : 'Report a Problem'}
        subtitle={lang === 'bn' ? 'কোনো অর্ডারে সমস্যা হলে জানান' : 'Tell us if something went wrong'}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-5">
        {/* Step 1: choose order (D5) */}
        <div>
          <p className="text-label-lg font-semibold text-on-surface mb-2">
            {lang === 'bn' ? '১. অর্ডার বেছে নিন' : '1. Choose the order'}
          </p>
          <div className="flex flex-col gap-2">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => setOrderId(order.id)}
                className={clsx(
                  'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                  orderId === order.id
                    ? 'bg-primary/8 border-primary'
                    : 'bg-surface-container-lowest border-outline-variant/40',
                )}
              >
                <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-md font-semibold text-on-surface">{order.id}</span>
                  <span className="block text-label-sm text-on-surface-variant truncate">
                    {order.items.map(i => (lang === 'bn' ? i.nameBn : i.nameEn)).join(', ')} • ৳{order.finalTotal}
                  </span>
                </span>
                {orderId === order.id && (
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                )}
              </button>
            ))}
            {orders.length === 0 && (
              <p className="text-body-md text-on-surface-variant">
                {lang === 'bn' ? 'কোনো অর্ডার নেই।' : 'No orders yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Step 2: issue type chips */}
        <div>
          <p className="text-label-lg font-semibold text-on-surface mb-2">
            {lang === 'bn' ? '২. সমস্যার ধরন' : '2. What went wrong?'}
          </p>
          <div className="flex flex-wrap gap-2">
            {ISSUE_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setIssueType(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-label-lg font-medium transition-all',
                  issueType === t.id
                    ? 'bg-error/10 border-error text-error'
                    : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface',
                )}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                {lang === 'bn' ? t.labelBn : t.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: details + optional photo */}
        <div>
          <p className="text-label-lg font-semibold text-on-surface mb-2">
            {lang === 'bn' ? '৩. বিস্তারিত লিখুন' : '3. Describe it'}
          </p>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={4}
            placeholder={lang === 'bn' ? 'কী সমস্যা হয়েছে একটু লিখুন...' : 'Write a few words about the problem...'}
            className="w-full rounded-2xl border-2 border-outline-variant focus:border-primary bg-surface-container-lowest px-3 py-3 text-body-lg text-on-surface placeholder:text-on-surface-variant/60 outline-none resize-none"
          />

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photoUrl ? (
            <div className="mt-3 relative">
              <img src={photoUrl} alt="problem" className="w-full h-44 object-cover rounded-2xl border border-outline-variant/40" />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <p className="text-label-sm text-on-surface-variant mt-1.5">
                {lang === 'bn' ? 'ছবি যোগ হয়েছে (শুধু প্রিভিউ — ডেমো)' : 'Photo attached (preview only — demo)'}
              </p>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant text-label-lg font-medium w-full justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              {lang === 'bn' ? 'ছবি যোগ করুন (ঐচ্ছিক)' : 'Add a photo (optional)'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-surface border-t border-outline-variant/30">
        <Button
          variant="primary"
          size="full"
          icon="send"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {lang === 'bn' ? 'রিপোর্ট পাঠান' : 'Submit Report'}
        </Button>
        {!canSubmit && (
          <p className="text-label-sm text-on-surface-variant text-center mt-2">
            {lang === 'bn' ? 'আগে অর্ডার আর সমস্যার ধরন বেছে নিন' : 'Choose an order and an issue type first'}
          </p>
        )}
      </div>
    </div>
  );
}
