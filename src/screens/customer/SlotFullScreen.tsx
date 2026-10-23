import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { toBn } from '../../lib/format';

interface SlotRow {
  id: string;
  labelBn: string;
  labelEn: string;
  window: string;
  full: boolean;
  left: number;
}

/** Slot-full state (checklist B) — today's delivery slots are full,
 *  tomorrow's pre-order slots are still open. */
export default function SlotFullScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const today: SlotRow[] = [
    { id: 'morning', labelBn: 'সকালের স্লট', labelEn: 'Morning slot', window: '7:00 – 10:00 AM', full: true, left: 0 },
    { id: 'noon', labelBn: 'দুপুরের স্লট', labelEn: 'Noon slot', window: '12:00 – 3:00 PM', full: true, left: 0 },
    { id: 'evening', labelBn: 'বিকেলের স্লট', labelEn: 'Evening slot', window: '4:00 – 7:00 PM', full: true, left: 0 },
  ];

  const tomorrow: SlotRow[] = [
    { id: 'tmr-morning', labelBn: 'সকালের স্লট', labelEn: 'Morning slot', window: '7:00 – 10:00 AM', full: false, left: 6 },
    { id: 'tmr-noon', labelBn: 'দুপুরের স্লট', labelEn: 'Noon slot', window: '12:00 – 3:00 PM', full: false, left: 9 },
    { id: 'tmr-evening', labelBn: 'বিকেলের স্লট', labelEn: 'Evening slot', window: '4:00 – 7:00 PM', full: false, left: 11 },
  ];

  return (
    <div className="screen-scroll bg-surface">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-outline-variant/50 bg-surface/95 px-4 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          aria-label={bn ? 'ফিরে যান' : 'Back'}
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-on-surface active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[23px]">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16.5px] font-bold leading-tight text-on-surface">
            {bn ? 'আজকের স্লট পূর্ণ' : 'Today’s slots are full'}
          </h1>
          <p className="truncate text-[11.5px] leading-tight text-on-surface-variant">
            {bn ? 'Slot full' : 'আজকের স্লট পূর্ণ'}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-40 pt-5">
        <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-6 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-secondary-soft">
            <span className="material-symbols-outlined text-[40px] text-secondary">event_busy</span>
          </div>
          <h2 className="text-[18.5px] font-bold leading-snug text-on-surface">
            {bn ? 'আজ আর ডেলিভারি স্লট নেই' : 'No delivery slots left today'}
          </h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-on-surface-variant">
            {bn
              ? 'আজকের তিনটি স্লটই বুক হয়ে গেছে। আপনার বাজার আগামীকালের স্লটে নিতে পারেন — কার্ট আপনার জন্য সেভ থাকবে।'
              : 'All three of today’s slots are booked. You can take tomorrow’s slot instead — your cart stays saved.'}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-2.5">
            <p className="text-[12px] font-bold text-on-surface">{bn ? 'আজ' : 'Today'}</p>
            <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[10px] font-bold text-secondary">
              {bn ? 'সব পূর্ণ' : 'All full'}
            </span>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {today.map(slot => (
              <li key={slot.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined text-[17px]">schedule</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-on-surface">{bn ? slot.labelBn : slot.labelEn}</p>
                  <p className="text-[11px] text-on-surface-variant">{slot.window}</p>
                </div>
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                  {bn ? 'পূর্ণ' : 'Full'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-primary/25 bg-surface-container-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-2.5">
            <p className="text-[12px] font-bold text-on-surface">{bn ? 'আগামীকাল' : 'Tomorrow'}</p>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
              {bn ? 'খোলা আছে' : 'Open'}
            </span>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {tomorrow.map(slot => (
              <li key={slot.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <span className="material-symbols-outlined text-[17px]">event_available</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-on-surface">{bn ? slot.labelBn : slot.labelEn}</p>
                  <p className="text-[11px] text-on-surface-variant">{slot.window}</p>
                </div>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                  {bn ? `${toBn(slot.left)}টি বাকি` : `${slot.left} left`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button
          onClick={() => navigate('/cart')}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-bold text-white shadow-fab active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[19px]">shopping_cart_checkout</span>
          {bn ? 'কালকের স্লটে অর্ডার করুন' : 'Order in tomorrow’s slot'}
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-outline-variant text-[13.5px] font-semibold text-on-surface active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          {bn ? 'স্লট খালি হলে জানান' : 'Notify me when a slot opens'}
        </button>

        <section className="flex items-start gap-2.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3.5">
          <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">info</span>
          <p className="text-[11.5px] leading-relaxed text-on-surface-variant">
            {bn
              ? 'প্রতিদিন সকাল ৬:০০ টায় নতুন স্লট খোলে। স্লট পূর্ণ হলে অর্ডার নেওয়া বন্ধ থাকে, তবে কার্টে রাখা পণ্য দামসহ সেভ থাকে।'
              : 'Fresh slots open daily at 6:00 AM. When slots fill, ordering pauses but your cart keeps its prices.'}
          </p>
        </section>
      </div>
    </div>
  );
}
