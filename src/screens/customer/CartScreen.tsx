import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { placeOrder } from '../../services/orders';
import type { TimeSlot } from '../../types';

const TIME_SLOTS: {
  id: TimeSlot; labelBn: string; labelEn: string; icon: string;
  rangeBn: string; rangeEn: string; tagBn: string; tagEn: string;
  detailBn: string; detailEn: string;
}[] = [
  {
    id: 'morning', labelBn: 'সকাল', labelEn: 'Morning', icon: '🌅',
    rangeBn: 'সকাল ৬:০০–দুপুর ১:৩০', rangeEn: '6:00 AM–1:30 PM',
    tagBn: 'সকাল বাজার', tagEn: 'Morning bazaar',
    detailBn: 'সকালের তাজা পণ্য ডেলিভারি', detailEn: 'Fresh morning deliveries',
  },
  {
    id: 'afternoon', labelBn: 'দুপুর', labelEn: 'Afternoon', icon: '☀️',
    rangeBn: 'দুপুর ১২:০০–১:৩০', rangeEn: '12:00–1:30 PM',
    tagBn: 'দুপুরের রান', tagEn: 'Midday run',
    detailBn: 'সকালের শিফটের শেষ অংশ', detailEn: 'Final part of the morning shift',
  },
  {
    id: 'evening', labelBn: 'বিকেল', labelEn: 'Evening', icon: '🌆',
    rangeBn: 'বিকেল ৪:৩০–রাত ১০:৩০', rangeEn: '4:30–10:30 PM',
    tagBn: 'সন্ধ্যার বাজার', tagEn: 'Evening bazaar',
    detailBn: 'বিকেল ও সন্ধ্যার বাজার ও খাবার', detailEn: 'Evening groceries and food',
  },
];

export default function CartScreen() {
  const { state, dispatch, cartTotal, cartCount, cartDeliveryFee, cartDiscount, cartFinal, validatePromo, t } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const defaultAddress = state.addresses.find(a => a.isDefault);
  const selectedArea = state.areas.find(a => a.id === state.selectedAreaId);

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [note, setNote] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(state.isSlotFull ? 'afternoon' : 'morning');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showClearSheet, setShowClearSheet] = useState(false);

  const applyPromo = () => {
    const promo = validatePromo(promoInput.trim());
    if (!promo) {
      setPromoError(lang === 'bn' ? 'অবৈধ কোড বা সর্বনিম্ন অর্ডার পূরণ হয়নি' : 'Invalid code or min order not met');
      return;
    }
    dispatch({ type: 'APPLY_PROMO', promo });
    setPromoError('');
    setPromoInput('');
  };

  const handlePlace = async () => {
    if (cartCount === 0) return;
    const address = state.addresses.find(a => a.isDefault);
    const area = state.selectedAreaId;

    setIsPlacing(true);
    const result = await placeOrder(
      state.cart,
      area,
      address?.fullAddress ?? '',
      cartDeliveryFee,
      state.appliedPromo?.code ?? null,
      cartDiscount,
      paymentMethod,
      timeSlot,
      state.user?.name ?? '',
      state.user?.mobile ?? '',
      note || undefined,
    );
    setIsPlacing(false);

    if (result.success && result.order) {
      // Keep the real signed-in customer id on the order so admin
      // quick search / Customer 360° group it under this customer.
      const order = state.user ? { ...result.order, customerId: state.user.id } : result.order;
      dispatch({ type: 'PLACE_ORDER', order });
      navigate(`/orders/${order.id}`, { replace: true });
    }
  };

  if (cartCount === 0) {
    return (
      <div className="flex-1 flex flex-col bg-surface">
        <TopAppBar
          showBack
          title={lang === 'bn' ? 'কার্ট' : 'Cart'}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-[72px]">🛒</span>
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {lang === 'bn' ? 'কার্ট খালি' : 'Cart is empty'}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {lang === 'bn' ? 'বাজার থেকে পণ্য যোগ করুন' : 'Add items from Bazaar or Food'}
          </p>
          <Button variant="primary" onClick={() => navigate('/bazaar')}>
            {lang === 'bn' ? 'বাজার দেখুন' : 'Browse Bazaar'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? `কার্ট (${cartCount})` : `Cart (${cartCount})`}
        subtitle={lang === 'bn' ? `মোট ৳${cartFinal}` : `Total ৳${cartFinal}`}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cart items */}
        <div className="flex flex-col gap-2 px-4 pt-4">
          {state.cart.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-on-surface truncate">
                  {lang === 'bn' ? item.nameBn : item.nameEn}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  ৳{item.price} × {item.quantity} = <span className="font-semibold text-primary">৳{item.price * item.quantity}</span>
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-1 bg-primary/10 rounded-full">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: item.quantity - 1 })}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="text-label-md font-bold text-primary w-7 text-center">{item.quantity}</span>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: item.quantity + 1 })}
                  className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>
          ))}

          {/* Clear cart */}
          <button
            onClick={() => setShowClearSheet(true)}
            className="text-label-md text-error font-medium self-end py-1"
          >
            {lang === 'bn' ? 'কার্ট খালি করুন' : 'Clear cart'}
          </button>
        </div>

        {/* Promo code */}
        <div className="px-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder={lang === 'bn' ? 'প্রোমো কোড' : 'Promo code'}
              value={state.appliedPromo ? state.appliedPromo.code : promoInput}
              onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
              disabled={!!state.appliedPromo}
              icon="local_offer"
              className="flex-1"
              error={promoError}
            />
            {state.appliedPromo ? (
              <button
                onClick={() => dispatch({ type: 'REMOVE_PROMO' })}
                className="px-4 py-3 rounded-2xl bg-error/10 text-error text-label-md font-medium"
              >
                {lang === 'bn' ? 'বাদ দিন' : 'Remove'}
              </button>
            ) : (
              <button
                onClick={applyPromo}
                disabled={!promoInput.trim()}
                className="px-4 py-3 rounded-2xl bg-primary text-white text-label-md font-medium disabled:opacity-40"
              >
                {lang === 'bn' ? 'ব্যবহার করুন' : 'Apply'}
              </button>
            )}
          </div>
          {state.appliedPromo && (
            <p className="text-label-sm text-success mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {lang === 'bn' ? state.appliedPromo.descriptionBn : state.appliedPromo.descriptionEn}
            </p>
          )}
        </div>

        {/* Delivery slot — Stitch g3 Part 2: stacked slot cards in
            one checkout card, radio rows, and the morning slot's
            dashed Slot Full state with the design's bilingual hint. */}
        <div className="px-4 mt-5">
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 border-b border-surface-container pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-headline-sm font-headline-sm text-on-surface leading-tight font-bold">
                    {lang === 'bn' ? 'ডেলিভারি সময় বেছে নিন' : 'Choose a delivery time'}
                  </h3>
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Select Preferred Delivery Slot</span>
                </div>
              </div>
              <span className="rounded-full bg-[#FFF7ED] border border-[#F97316]/40 px-2 py-0.5 text-label-sm font-label-sm font-bold text-[#C2410C] shrink-0">
                ৳{cartDeliveryFee} {lang === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Fee'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {TIME_SLOTS.map(slot => {
                // D12: when slots are full, the morning slot is marked full
                const isFull = state.isSlotFull && slot.id === 'morning';
                const isSelected = !isFull && timeSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isFull}
                    aria-pressed={isSelected}
                    onClick={() => setTimeSlot(slot.id)}
                    className={clsx(
                      'relative flex flex-col p-3 rounded-xl text-left transition-all w-full',
                      isFull
                        ? 'border border-dashed border-[#F97316]/60 bg-[#FFF7ED]/50 cursor-not-allowed'
                        : isSelected
                          ? 'border-2 border-primary bg-surface-container-lowest shadow-sm'
                          : 'border border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 w-full">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                          isFull
                            ? 'border border-[#D1D5DB] bg-surface-container-high'
                            : isSelected
                              ? 'border-2 border-primary'
                              : 'border border-outline',
                        )}>
                          {isFull ? (
                            <span className="material-symbols-outlined text-[14px] text-error">block</span>
                          ) : isSelected ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span className={clsx('text-label-lg font-label-lg', isFull ? 'text-on-surface/70 line-through' : 'text-on-surface')}>
                              {lang === 'bn' ? slot.rangeBn : slot.rangeEn}
                            </span>
                            <span className={clsx(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded',
                              isSelected && !isFull ? 'bg-[#E8F5E9] text-primary' : 'bg-surface-container text-on-surface-variant',
                            )}>
                              {lang === 'bn' ? slot.tagBn : slot.tagEn}
                            </span>
                          </span>
                          <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                            {lang === 'bn' ? slot.detailBn : slot.detailEn}
                          </span>
                        </span>
                      </span>
                      {isFull ? (
                        <span className="flex items-center gap-1 bg-[#FEE2E2] border border-[#EF4444]/30 text-error px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" />
                          <span className="text-label-sm font-label-sm font-bold">{lang === 'bn' ? 'ভরে গেছে / Slot Full' : 'Slot Full'}</span>
                        </span>
                      ) : (
                        <span className={clsx('text-label-sm font-label-sm shrink-0', isSelected ? 'text-primary font-bold' : 'text-outline')}>
                          {isSelected ? (lang === 'bn' ? 'পছন্দ করা হয়েছে' : 'Selected') : (lang === 'bn' ? 'খালি আছে' : 'Available')}
                        </span>
                      )}
                    </span>
                    {isFull && (
                      <span className="mt-2.5 pt-2 border-t border-[#F97316]/20 flex items-start gap-1.5 w-full">
                        <span className="material-symbols-outlined text-base shrink-0 text-[#EA580C] mt-0.5">info</span>
                        <span className="flex flex-col">
                          <span className="text-body-sm font-body-sm text-[#C2410C] font-semibold">
                            এই স্লটের সব রাইডার বুকড • অনুগ্রহ করে অন্য স্লট বেছে নিন
                          </span>
                          <span className="text-bilingual-sub font-bilingual-sub text-secondary/80">
                            All delivery partners are booked for this slot. Please choose another time.
                          </span>
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Address confirmation chip — g3 Part 2 */}
            <div className="mt-1 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">pin_drop</span>
              <div className="flex flex-col min-w-0">
                <span className="text-body-sm font-body-sm font-semibold text-on-surface truncate">
                  {lang === 'bn' ? 'ডেলিভারি ঠিকানা: ' : 'Delivery address: '}
                  {defaultAddress?.fullAddress ?? (lang === 'bn' ? 'কোনো ঠিকানা সেভ করা নেই' : 'No saved address')}
                </span>
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                  {selectedArea ? (lang === 'bn' ? selectedArea.nameBn : selectedArea.nameEn) : ''}
                  {lang === 'bn' ? ' • ডেলিভারি চালু আছে (Delivery Available)' : ' • Delivery Available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-4 mt-5">
          <p className="text-label-lg font-semibold text-on-surface mb-2">
            {lang === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment method'}
          </p>
          <div className="flex flex-col gap-2">
            {([
              { id: 'cod', labelBn: 'ক্যাশ অন ডেলিভারি', labelEn: 'Cash on Delivery', icon: '💵' },
              { id: 'bkash', labelBn: 'বিকাশ', labelEn: 'bKash', icon: '📱' },
              { id: 'nagad', labelBn: 'নগদ', labelEn: 'Nagad', icon: '💳' },
            ] as const).map(pm => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={clsx(
                  'flex items-center gap-3 p-3.5 rounded-2xl border transition-all',
                  paymentMethod === pm.id
                    ? 'bg-primary/8 border-primary'
                    : 'bg-surface-container-lowest border-outline-variant/40',
                )}
              >
                <span className="text-[22px]">{pm.icon}</span>
                <span className={clsx('text-body-md font-medium flex-1 text-left', paymentMethod === pm.id ? 'text-primary' : 'text-on-surface')}>
                  {lang === 'bn' ? pm.labelBn : pm.labelEn}
                </span>
                {paymentMethod === pm.id && (
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="px-4 mt-5 mb-4">
          <Input
            placeholder={lang === 'bn' ? 'বিশেষ নির্দেশনা (ঐচ্ছিক)...' : 'Special instructions (optional)...'}
            value={note}
            onChange={e => setNote(e.target.value)}
            icon="edit_note"
          />
        </div>

        {/* Bill summary */}
        <div className="mx-4 mb-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4 flex flex-col gap-2">
          <p className="text-label-lg font-bold text-on-surface mb-1">
            {lang === 'bn' ? 'বিল সারসংক্ষেপ' : 'Bill Summary'}
          </p>
          {[
            { labelBn: 'পণ্যের দাম', labelEn: 'Items total', value: cartTotal },
            { labelBn: 'ডেলিভারি ফি', labelEn: 'Delivery fee', value: cartDeliveryFee },
            ...(cartDiscount > 0 ? [{ labelBn: 'ছাড়', labelEn: 'Discount', value: -cartDiscount }] : []),
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-body-sm text-on-surface-variant">{lang === 'bn' ? row.labelBn : row.labelEn}</span>
              <span className={clsx('text-body-sm font-medium', row.value < 0 ? 'text-success' : 'text-on-surface')}>
                {row.value < 0 ? `-৳${Math.abs(row.value)}` : `৳${row.value}`}
              </span>
            </div>
          ))}
          <div className="h-px bg-outline-variant/40 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-body-md font-bold text-on-surface">
              {lang === 'bn' ? 'মোট' : 'Total'}
            </span>
            <span className="text-title-sm font-bold text-primary">৳{cartFinal}</span>
          </div>
          {cartTotal > 0 && (
            <p className="text-label-sm text-on-surface-variant/70 mt-1">
              {lang === 'bn' ? '* বাজারমূল্য আনুমানিক, ভিন্ন হতে পারে' : '* Market prices are approximate, may vary'}
            </p>
          )}
        </div>
      </div>

      {/* Place order button */}
      <div className="px-4 py-3 bg-surface border-t border-outline-variant/30">
        <Button
          variant="primary"
          size="full"
          loading={isPlacing}
          onClick={handlePlace}
          icon="shopping_bag"
        >
          {lang === 'bn' ? `অর্ডার করুন — ৳${cartFinal}` : `Place Order — ৳${cartFinal}`}
        </Button>
      </div>

      {/* Clear cart confirm */}
      <BottomSheet
        open={showClearSheet}
        onClose={() => setShowClearSheet(false)}
        title={lang === 'bn' ? 'কার্ট খালি করবেন?' : 'Clear cart?'}
      >
        <p className="text-body-md text-on-surface-variant px-4 pb-2">
          {lang === 'bn' ? 'সব পণ্য সরিয়ে ফেলা হবে।' : 'All items will be removed.'}
        </p>
        <div className="flex gap-3 px-4 pb-4">
          <Button variant="outline" size="full" onClick={() => setShowClearSheet(false)}>
            {lang === 'bn' ? 'বাদ দিন' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            size="full"
            onClick={() => { dispatch({ type: 'CLEAR_CART' }); setShowClearSheet(false); }}
          >
            {lang === 'bn' ? 'খালি করুন' : 'Clear'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
