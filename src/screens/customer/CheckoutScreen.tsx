import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { addProductToCart } from '../../lib/cartUtils';
import { searchAreasIn } from '../../data/areas';
import { placeOrder } from '../../services/orders';
import { tk, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { DeliveryArea, TimeSlot } from '../../types';

const SLOTS: { id: TimeSlot; bn: string; en: string; rangeBn: string; rangeEn: string; icon: string; tagBn: string }[] = [
  { id: 'morning', bn: 'সকাল', en: 'Morning', rangeBn: 'সকাল ৬:০০–দুপুর ১:৩০', rangeEn: '6:00 AM–1:30 PM', icon: '🌅', tagBn: 'সকাল বাজার' },
  { id: 'afternoon', bn: 'দুপুর', en: 'Afternoon', rangeBn: 'দুপুর ১২:০০–১:৩০', rangeEn: '12:00–1:30 PM', icon: '☀️', tagBn: 'দুপুরের রান' },
  { id: 'evening', bn: 'বিকেল', en: 'Evening', rangeBn: 'বিকেল ৪:৩০–রাত ১০:৩০', rangeEn: '4:30–10:30 PM', icon: '🌆', tagBn: 'সন্ধ্যার বাজার' },
];

export default function CheckoutScreen() {
  const { state, dispatch, cartCount, cartTotal, cartDiscount, cartFinal } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const defaultAddress = state.addresses.find(a => a.isDefault);
  const [name, setName] = useState(state.user?.nameBn ?? state.user?.name ?? '');
  const [mobile, setMobile] = useState(state.user?.mobile ?? '');
  const [areaId, setAreaId] = useState(state.selectedAreaId);
  const [address, setAddress] = useState(defaultAddress?.fullAddress ?? '');
  const [note, setNote] = useState('');
  const [slot, setSlot] = useState<TimeSlot>('morning');
  const [payment, setPayment] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [showAreaSheet, setShowAreaSheet] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const area = state.areas.find(a => a.id === areaId) as DeliveryArea | undefined;
  const fee = area?.fee ?? 20;
  const total = cartTotal + fee - cartDiscount;

  const areaResults = useMemo(
    () => (areaQuery ? searchAreasIn(state.areas, areaQuery) : state.areas),
    [areaQuery, state.areas],
  );

  const suggestions = useMemo(() => {
    const inCart = new Set(state.cart.map(c => c.productId));
    return state.products.filter(p => p.isPopular && !inCart.has(p.id) && p.isAvailable).slice(0, 6);
  }, [state.products, state.cart]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = bn ? 'আপনার নাম লিখুন' : 'Please enter your name';
    if (!/^01\d{9}$/.test(mobile.replace(/\D/g, ''))) next.mobile = bn ? 'সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)' : 'Enter a valid 11-digit mobile';
    if (!address.trim() || address.trim().length < 8) next.address = bn ? 'বিস্তারিত ঠিকানা লিখুন (বাড়ি, রোড, ল্যান্ডমার্ক)' : 'Add a detailed address';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate() || cartCount === 0) return;
    setPlacing(true);
    const result = await placeOrder(
      state.cart,
      areaId,
      address.trim(),
      fee,
      state.appliedPromo?.code ?? null,
      cartDiscount,
      payment,
      slot,
      name.trim(),
      mobile.trim(),
      note.trim() || undefined,
    );
    if (result.success && result.order) {
      const order = {
        ...result.order,
        customerId: state.user?.id ?? 'u-001',
        deliveryAddress: `${address.trim()} (${area?.nameBn ?? ''})`,
      };
      dispatch({ type: 'PLACE_ORDER', order });
      setPlacing(false);
      navigate(`/order-success/${order.id}`, { replace: true });
    } else {
      setPlacing(false);
      setErrors({ form: bn ? 'অর্ডার নেওয়া যায়নি, আবার চেষ্টা করুন' : 'Could not place the order, please retry' });
    }
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={bn ? 'চেকআউট' : 'Checkout'}
        subtitle={bn ? 'ঠিকানা ও ডেলিভারি সময়' : 'Address & delivery slot'}
        right={<span className="rounded-full bg-primary-soft px-2 py-1 text-[10.5px] font-bold text-primary-deep">{toBn(cartCount, state.lang)} {bn ? 'আইটেম' : 'items'}</span>}
      />

      <div className="flex flex-col gap-3 pb-52 pt-3">
        {/* Contact */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">person</span>
            {bn ? 'গ্রাহকের তথ্য' : 'Customer details'}
          </h2>

          <label className="mt-2.5 block text-[11px] font-medium text-on-surface-variant">{bn ? 'নাম' : 'Name'}</label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            placeholder={bn ? 'আপনার নাম' : 'Your name'}
            className={clsx('mt-1 h-10 w-full rounded-xl border bg-surface-container-low px-3 text-[12.5px] outline-none', errors.name ? 'border-error' : 'border-outline-variant focus:border-primary')}
          />
          {errors.name && <p className="mt-1 text-[10.5px] text-error">{errors.name}</p>}

          <label className="mt-2.5 block text-[11px] font-medium text-on-surface-variant">{bn ? 'মোবাইল নম্বর' : 'Mobile number'}</label>
          <input
            value={mobile}
            onChange={e => { setMobile(e.target.value); setErrors(p => ({ ...p, mobile: '' })); }}
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            className={clsx('mt-1 h-10 w-full rounded-xl border bg-surface-container-low px-3 text-[12.5px] outline-none', errors.mobile ? 'border-error' : 'border-outline-variant focus:border-primary')}
          />
          {errors.mobile && <p className="mt-1 text-[10.5px] text-error">{errors.mobile}</p>}
        </section>

        {/* Address */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
              <span className="material-symbols-outlined text-[17px] text-primary">location_on</span>
              {bn ? 'ডেলিভারি ঠিকানা' : 'Delivery address'}
            </h2>
            <button onClick={() => setShowAreaSheet(true)} className="text-[11px] font-semibold text-primary">
              {bn ? 'এলাকা বদলান' : 'Change area'}
            </button>
          </div>

          <button
            onClick={() => setShowAreaSheet(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-2.5 text-left"
          >
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary-soft text-primary-deep">
              <span className="material-symbols-outlined text-[17px]">my_location</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-on-surface">{bn ? area?.nameBn : area?.nameEn}</span>
              <span className="block text-[10.5px] text-on-surface-variant">
                {bn ? 'ডেলিভারি চার্জ' : 'Delivery fee'} {tk(fee, state.lang)} · {bn ? 'আজ উপলব্ধ' : 'available today'}
              </span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>

          <label className="mt-2.5 block text-[11px] font-medium text-on-surface-variant">
            {bn ? 'বিস্তারিত ঠিকানা (হাতে লেখা)' : 'Detailed address'}
          </label>
          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
            rows={3}
            placeholder={bn ? 'বাড়ি নম্বর, রোড, মসজিদ/স্কুলের পাশে, ২য় তলা...' : 'House number, road, landmark...'}
            className={clsx('mt-1 w-full resize-none rounded-xl border bg-surface-container-low px-3 py-2 text-[12px] outline-none', errors.address ? 'border-error' : 'border-outline-variant focus:border-primary')}
          />
          {errors.address && <p className="mt-1 text-[10.5px] text-error">{errors.address}</p>}

          {state.addresses.length > 0 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              {state.addresses.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAddress(a.fullAddress); setAreaId(a.areaId); }}
                  className="flex-shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-[10.5px] text-on-surface-variant"
                >
                  <span className="material-symbols-outlined align-middle text-[12px]">{a.label === 'বাড়ি' ? 'home' : 'work'}</span> {bn ? a.label : a.labelEn}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Order note */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">edit_note</span>
            {bn ? 'অর্ডার নোট' : 'Order note'}
            <span className="text-[10px] font-normal text-on-surface-variant">({bn ? 'ঐচ্ছিক' : 'optional'})</span>
          </h2>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder={bn ? 'রাইডারকে নির্দেশনা — যেমন: গেটে এসে কল দিবেন' : 'Instructions for the rider'}
            className="mt-1.5 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-[12px] outline-none focus:border-primary"
          />
        </section>

        {/* Suggestions row */}
        {suggestions.length > 0 && (
          <section className="rounded-2xl border border-primary/25 bg-primary-tint p-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-primary-deep">
              <span className="material-symbols-outlined filled-symbol text-[16px]">auto_awesome</span>
              {bn ? 'সহায়কের পরামর্শ — সাথে এগুলোও নিন' : 'AI suggestions — add these too'}
            </p>
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              {suggestions.map(p => (
                <div key={p.id} className="flex w-[120px] flex-shrink-0 flex-col rounded-xl bg-surface-container-lowest p-1.5">
                  {p.image ? (
                    <img src={asset(p.image)} alt={p.nameEn} className="h-14 w-full rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-14 w-full place-items-center rounded-lg bg-surface-container text-[24px]">{p.imageEmoji}</span>
                  )}
                  <p className="mt-1 line-clamp-1 text-[10.5px] font-semibold text-on-surface">{bn ? p.nameBn : p.nameEn}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary-deep">{tk(p.approxPrice, state.lang)}</span>
                    <button onClick={() => addProductToCart(dispatch, p)} className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Time slot */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">schedule</span>
            {bn ? 'ডেলিভারি সময় বেছে নিন' : 'Choose a delivery time'}
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {SLOTS.map(s => {
              const full = state.isSlotFull && s.id === 'morning';
              const active = slot === s.id && !full;
              return (
                <button
                  key={s.id}
                  disabled={full}
                  onClick={() => setSlot(s.id)}
                  className={clsx(
                    'flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left',
                    full ? 'border-dashed border-secondary-bright/60 bg-secondary-soft/40' : active ? 'border-2 border-primary bg-surface-container-lowest' : 'border-outline-variant bg-surface-container-lowest',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[16px]">{s.icon}</span>
                    <span>
                      <span className={clsx('block text-[12px] font-semibold', full ? 'text-on-surface-variant line-through' : 'text-on-surface')}>
                        {bn ? s.rangeBn : s.rangeEn}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant">{bn ? s.tagBn : s.en}</span>
                    </span>
                  </span>
                  <span className={clsx('flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold', full ? 'bg-error-soft text-error' : active ? 'bg-primary-soft text-primary-deep' : 'bg-surface-container text-on-surface-variant')}>
                    {full ? (bn ? 'ভরে গেছে' : 'Full') : active ? (bn ? 'নির্বাচিত' : 'Selected') : (bn ? 'খালি আছে' : 'Available')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Payment */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">payments</span>
            {bn ? 'পেমেন্ট পদ্ধতি' : 'Payment method'}
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { id: 'cod' as const, bn: 'ক্যাশ', en: 'Cash', icon: '💵' },
              { id: 'bkash' as const, bn: 'বিকাশ', en: 'bKash', icon: '📱' },
              { id: 'nagad' as const, bn: 'নগদ', en: 'Nagad', icon: '💳' },
            ].map(pm => (
              <button
                key={pm.id}
                onClick={() => setPayment(pm.id)}
                className={clsx('flex flex-col items-center gap-1 rounded-xl border p-2', payment === pm.id ? 'border-primary bg-primary-tint' : 'border-outline-variant')}
              >
                <span className="text-[18px]">{pm.icon}</span>
                <span className={clsx('text-[11px] font-semibold', payment === pm.id ? 'text-primary-deep' : 'text-on-surface')}>{bn ? pm.bn : pm.en}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Bill */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">receipt_long</span>
            {bn ? 'পণ্য অনুযায়ী বিল' : 'Itemised bill'}
          </h2>
          <div className="mt-2 flex flex-col gap-1">
            {state.cart.map(line => (
              <div key={line.id} className="flex items-start justify-between gap-2 text-[11.5px]">
                <span className="min-w-0 text-on-surface-variant">
                  <span className="text-on-surface">{bn ? line.nameBn : line.nameEn}</span>
                  <span className="ml-1 text-[10px]">× {toBn(line.quantity, state.lang)}</span>
                </span>
                <span className="flex-shrink-0 font-medium text-on-surface">{tk(line.price * line.quantity, state.lang)}</span>
              </div>
            ))}
            <div className="my-1.5 h-px border-t border-dashed border-outline-variant" />
            <div className="flex justify-between text-[12px]">
              <span className="text-on-surface-variant">{bn ? 'পণ্যের দাম' : 'Items total'}</span>
              <span className="font-semibold">{tk(cartTotal, state.lang)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-on-surface-variant">{bn ? 'ডেলিভারি চার্জ' : 'Delivery fee'}</span>
              <span className="font-semibold">{tk(fee, state.lang)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[12px] text-primary">
                <span>{bn ? 'ছাড়' : 'Discount'} {state.appliedPromo?.code ? `(${state.appliedPromo.code})` : ''}</span>
                <span className="font-semibold">− {tk(cartDiscount, state.lang)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[13px] font-bold">{bn ? 'সর্বমোট' : 'Total'}</span>
              <span className="text-[19px] font-bold text-primary-deep">{tk(total, state.lang)}</span>
            </div>
            <p className="mt-1 rounded-lg bg-surface-container px-2 py-1.5 text-[10px] leading-snug text-on-surface-variant">
              {bn ? 'পণ্যের দাম আনুমানিক — রসিদ অনুযায়ী চূড়ান্ত হবে। কোনো মার্কআপ নেই, শুধু ডেলিভারি ফি।' : 'Approx product prices, settled from the bazaar receipt. No markup, only the delivery fee.'}
            </p>
          </div>
        </section>
      </div>

      {/* Place order bar */}
      <div
        className="fixed left-1/2 z-cartbar w-full max-w-app -translate-x-1/2 border-t border-outline-variant/60 bg-surface/95 px-4 py-2.5 backdrop-blur"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-on-surface-variant">{bn ? 'সর্বমোট' : 'Total'}</p>
            <p className="text-[19px] font-bold leading-tight text-primary-deep">{tk(total, state.lang)}</p>
          </div>
          <button
            onClick={submit}
            disabled={placing}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-deep to-primary text-[13.5px] font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-60"
          >
            {placing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                {bn ? 'অর্ডার হচ্ছে...' : 'Placing order...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                {bn ? 'অর্ডার নিশ্চিত করুন' : 'Place order'}
              </>
            )}
          </button>
        </div>
        {errors.form && <p className="mt-1 text-center text-[10.5px] text-error">{errors.form}</p>}
      </div>

      {/* Area picker sheet */}
      <BottomSheet open={showAreaSheet} onClose={() => setShowAreaSheet(false)} title={bn ? 'ডেলিভারি এলাকা বেছে নিন' : 'Select delivery area'}>
        <div className="px-4 pb-4">
          <input
            value={areaQuery}
            onChange={e => setAreaQuery(e.target.value)}
            placeholder={bn ? 'এলাকার নাম লিখুন...' : 'Search area...'}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[12.5px] outline-none focus:border-primary"
          />
          <div className="mt-2 max-h-[46vh] overflow-y-auto">
            {areaResults.slice(0, 60).map(a => (
              <button
                key={a.id}
                onClick={() => { setAreaId(a.id); dispatch({ type: 'SET_AREA', areaId: a.id }); setShowAreaSheet(false); }}
                className={clsx('flex w-full items-center justify-between gap-2 border-b border-outline-variant/40 py-2.5 text-left', areaId === a.id && 'bg-primary-tint')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-on-surface">{bn ? a.nameBn : a.nameEn}</span>
                  <span className="block truncate text-[10px] text-on-surface-variant">{bn ? a.nameEn : a.nameBn} · {a.zone === 'town' ? (bn ? 'শহর' : 'Town') : (bn ? 'ইউনিয়ন' : 'Union')}</span>
                </span>
                <span className="flex-shrink-0 text-[12px] font-bold text-primary-deep">{tk(a.fee, state.lang)}</span>
              </button>
            ))}
            {areaResults.length === 0 && (
              <p className="py-6 text-center text-[12px] text-on-surface-variant">
                {bn ? 'এই নামে এলাকা পাওয়া যায়নি' : 'No area found'}
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
