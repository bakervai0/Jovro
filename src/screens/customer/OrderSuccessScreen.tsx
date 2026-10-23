import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { tk, toBn } from '../../lib/format';

export default function OrderSuccessScreen() {
  const { id } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const order = state.orders.find(o => o.id === id) ?? state.orders[0];

  if (!order) {
    return (
      <div className="screen-scroll grid place-items-center bg-surface">
        <div className="text-center">
          <p className="text-[14px] text-on-surface-variant">{bn ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}</p>
          <button onClick={() => navigate('/')} className="mt-3 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-white">
            {bn ? 'হোমে ফিরুন' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-scroll bg-surface">
      <div className="flex flex-col items-center px-5 pb-36 pt-10 text-center">
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-primary-soft">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          <span className="material-symbols-outlined filled-symbol text-[52px] text-primary">check_circle</span>
        </div>

        <h1 className="mt-4 text-[22px] font-bold leading-tight text-on-surface">
          {bn ? 'অর্ডার সফলভাবে দেওয়া হয়েছে!' : 'Order placed successfully!'}
        </h1>
        <p className="mt-1 max-w-[290px] text-[12.5px] leading-relaxed text-on-surface-variant">
          {bn
            ? 'আমাদের রাইডার শীঘ্রই বাজারে গিয়ে আপনার পণ্য কিনবেন। প্রতিটি ধাপে আপনাকে জানানো হবে।'
            : 'Our rider will head to the bazaar shortly. We will update you at every step.'}
        </p>

        <div className="mt-5 w-full rounded-3xl border-2 border-dashed border-primary/40 bg-primary-tint px-4 py-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-primary-deep">{bn ? 'আপনার অর্ডার নম্বর' : 'Your order number'}</p>
          <p className="mt-1 text-[26px] font-bold tracking-wide text-primary-deep">{order.id}</p>
          <p className="mt-1 text-[10.5px] text-on-surface-variant">
            {bn ? 'কাস্টমার আইডি' : 'Customer ID'}: {order.customerId}
          </p>
        </div>

        <div className="mt-4 w-full rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 text-left shadow-card">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-on-surface-variant">{bn ? 'পণ্য' : 'Items'}</span>
            <span className="font-semibold text-on-surface">{toBn(order.items.length, state.lang)} {bn ? 'টি' : 'items'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11.5px]">
            <span className="text-on-surface-variant">{bn ? 'পণ্যের দাম (আনুমানিক)' : 'Items total (approx)'}</span>
            <span className="font-semibold text-on-surface">{tk(order.productsTotal, state.lang)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11.5px]">
            <span className="text-on-surface-variant">{bn ? 'ডেলিভারি ফি' : 'Delivery fee'}</span>
            <span className="font-semibold text-on-surface">{tk(order.deliveryFee, state.lang)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="mt-1 flex items-center justify-between text-[11.5px] text-primary">
              <span>{bn ? 'ছাড়' : 'Discount'}</span>
              <span className="font-semibold">− {tk(order.discountAmount, state.lang)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-outline-variant/60 pt-2">
            <span className="text-[12.5px] font-bold">{bn ? 'সর্বমোট' : 'Total'}</span>
            <span className="text-[17px] font-bold text-primary-deep">{tk(order.finalTotal, state.lang)}</span>
          </div>
          <div className="mt-2 rounded-lg bg-surface-container p-2">
            <p className="text-[10.5px] leading-snug text-on-surface-variant">
              <b className="text-on-surface">{bn ? 'ডেলিভারি সময়:' : 'Delivery slot:'}</b>{' '}
              {order.timeSlot === 'morning' ? (bn ? 'সকাল ৬:০০–দুপুর ১:৩০' : '6:00 AM–1:30 PM') : order.timeSlot === 'afternoon' ? (bn ? 'দুপুর ১২:০০–১:৩০' : '12:00–1:30 PM') : (bn ? 'বিকেল ৪:৩০–রাত ১০:৩০' : '4:30–10:30 PM')}
              <br />
              <b className="text-on-surface">{bn ? 'ঠিকানা:' : 'Address:'}</b> {order.deliveryAddress}
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-secondary-soft p-2.5 text-left text-[10.5px] leading-relaxed text-secondary">
          <span className="material-symbols-outlined text-[15px]">receipt_long</span>
          {bn
            ? 'বাজার থেকে কেনার পর আসল রসিদ/মেমো আপনার অর্ডারে আপলোড হবে। পণ্যের দামে কোনো বাড়তি নেই।'
            : 'The real bazaar receipt will be attached to your order. No product markup.'}
        </p>

        <div className="mt-5 flex w-full flex-col gap-2">
          <button
            onClick={() => navigate(`/orders/${order.id}`, { replace: true })}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white"
          >
            <span className="material-symbols-outlined text-[19px]">local_shipping</span>
            {bn ? 'অর্ডার ট্র্যাক করুন' : 'Track this order'}
          </button>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary text-[13.5px] font-bold text-primary"
          >
            {bn ? 'আরও বাজার করুন' : 'Continue shopping'}
          </button>
        </div>
      </div>
    </div>
  );
}
