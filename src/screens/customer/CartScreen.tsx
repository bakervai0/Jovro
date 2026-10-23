import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { placeOrder } from '../../services/orders';
import { PRODUCT_IMAGES } from '../../data/images';
import { fmtTk, toBnDigits, SLOT_META } from '../../services/orderUtils';
import type { CartItem, Order, Product, TimeSlot } from '../../types';

// ── Stitch 14 + 15 + 16 · Cart → Checkout → Success ───────────
// One route (/cart), three steps:
//  · cart     — Stitch 14 (+14b AI missing items, 14c/14d/14e
//               promo states, 14f empty cart)
//  · checkout — Stitch 15 (+15b AI suggestions, 15c promo bill)
//  · success  — Stitch 16 order-received screen

const TIME_SLOTS: {
  id: TimeSlot; icon: string; tagBn: string; tagEn: string;
}[] = [
  { id: 'morning', icon: 'wb_twilight', tagBn: 'সকাল বাজার', tagEn: 'Morning bazaar' },
  { id: 'afternoon', icon: 'wb_sunny', tagBn: 'দুপুরের রান', tagEn: 'Midday run' },
  { id: 'evening', icon: 'nightlight', tagBn: 'সন্ধ্যার বাজার', tagEn: 'Evening bazaar' },
];

const SLOT_END: Record<TimeSlot, number> = { morning: 13 * 60 + 30, afternoon: 13 * 60 + 30, evening: 22 * 60 + 30 };

const REPLACEMENT_OPTIONS = [
  { id: 'similar', emoji: '🔄', bn: 'কাছাকাছি জিনিস দিয়ে বদলে দিন', en: 'Replace with a similar item' },
  { id: 'call', emoji: '📞', bn: 'আমাকে কল করুন', en: 'Call me' },
  { id: 'skip', emoji: '✖️', bn: 'পাওয়া না গেলে বাদ দিন', en: 'Skip if not found' },
] as const;

type ReplacementId = (typeof REPLACEMENT_OPTIONS)[number]['id'];

function LangToggle() {
  const { state, dispatch } = useApp();
  const bn = state.lang === 'bn';
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
      className="px-2.5 py-1 rounded-full border border-outline-variant/40 bg-surface-container-low/60 hover:bg-surface-container-low active:scale-95 duration-150 text-bilingual-sub font-bilingual-sub text-primary font-bold shrink-0"
    >
      বাংলা | EN
    </button>
  );
}

function ChatFab({ bottomClass = 'bottom-24' }: { bottomClass?: string }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  return (
    <div className={clsx('fixed left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none', bottomClass)}>
      <div className="flex justify-end px-4">
        <button
          type="button"
          onClick={() => navigate('/ai')}
          aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
          className="pointer-events-auto relative w-[52px] h-[52px] rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-white"
          style={{ boxShadow: '0 6px 16px rgba(29, 157, 87, 0.4)' }}
        >
          <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary-container border-2 border-white" />
          </span>
        </button>
      </div>
    </div>
  );
}

/** Outline stepper — Stitch 14 cart rows. */
function OutlineStepper({ item }: { item: CartItem }) {
  const { dispatch } = useApp();
  return (
    <div className="flex items-center border border-outline-variant rounded-full bg-surface-container-lowest h-9 px-1 shrink-0">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: item.quantity - 1 })}
        className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface-container rounded-full active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <span className="w-6 text-center text-label-md font-label-md font-bold text-on-surface">{item.quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: item.quantity + 1 })}
        className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const name = bn ? item.nameBn : item.nameEn;
  const subName = bn ? item.nameEn : item.nameBn;
  const lineTotal = item.price * item.quantity;
  return (
    <div className="flex flex-col py-2 border-b border-surface-container/60 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-body-md font-semibold text-on-surface">
            {name}{item.unit ? ` (${item.unit})` : ''}
          </h3>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            {subName}{item.unit ? ` (${item.unit})` : ''}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-label-lg font-label-lg font-bold text-on-surface">{fmtTk(lineTotal, state.lang)}</span>
            {item.isApproxPrice ? (
              <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                {item.quantity > 1 && item.unit
                  ? `${bn ? 'আনুমানিক' : 'Approx'} ${fmtTk(item.price, state.lang)}/${item.unit}`
                  : (bn ? 'আনুমানিক Approx.' : 'Approx.')}
              </span>
            ) : (
              <span className="text-label-sm font-label-sm text-secondary-container bg-secondary-fixed/50 px-1.5 py-0.5 rounded">
                {bn ? 'নির্ধারিত মেনু মূল্য' : 'Fixed menu price'}
              </span>
            )}
          </div>
        </div>
        <OutlineStepper item={item} />
      </div>
      {item.note && (
        <div className="mt-2 bg-surface-container-low px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="material-symbols-outlined text-outline text-[16px]">
            {item.source === 'restaurant' ? 'restaurant_menu' : 'edit_note'}
          </span>
          <span className="text-label-sm font-label-sm text-on-surface-variant truncate">
            {bn ? 'নোট:' : 'Note:'} {item.note}
          </span>
        </div>
      )}
    </div>
  );
}

/** Bill rows shared by cart (Stitch 14) — checkout has its own variant. */
function BillRows({ showPromoLine = true }: { showPromoLine?: boolean }) {
  const { state, cartTotal, cartDeliveryFee, cartDiscount, cartFinal, currentArea } = useApp();
  const bn = state.lang === 'bn';
  const promo = state.appliedPromo;
  const freeDelivery = promo?.discountType === 'free-delivery' && cartDiscount > 0;
  return (
    <>
      <div className="flex justify-between items-center text-body-md font-body-md text-on-surface">
        <span>{bn ? 'পণ্যের দাম (আনুমানিক)' : 'Items total (approx.)'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">/ Items</span></span>
        <span className="font-semibold">{fmtTk(cartTotal, state.lang)}</span>
      </div>
      <div className="flex justify-between items-center text-body-md font-body-md text-on-surface">
        <div className="flex items-center gap-1.5">
          <span>{bn ? 'ডেলিভারি চার্জ' : 'Delivery charge'}</span>
          {currentArea && (
            <span className="text-label-sm font-label-sm text-secondary-container bg-secondary-fixed/50 px-1.5 py-0.5 rounded">
              {bn ? currentArea.nameBn : currentArea.nameEn}
            </span>
          )}
        </div>
        {freeDelivery ? (
          <span className="flex items-center gap-1.5">
            <span className="line-through text-outline text-body-sm">{fmtTk(cartDeliveryFee, state.lang)}</span>
            <span className="text-[#1D9D57] font-bold">{fmtTk(0, state.lang)} ({bn ? 'ফ্রি' : 'Free'})</span>
          </span>
        ) : (
          <span className="font-semibold">{fmtTk(cartDeliveryFee, state.lang)}</span>
        )}
      </div>
      {showPromoLine && promo && cartDiscount > 0 && !freeDelivery && (
        <div className="flex justify-between items-center bg-[#E8F5E9] px-2.5 py-1.5 rounded-lg text-primary text-body-sm font-label-lg border border-primary/20">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">redeem</span>
            <span>🎁 {bn ? 'প্রোমো:' : 'Promo:'} {bn ? promo.descriptionBn : promo.descriptionEn}</span>
          </div>
          <span className="font-bold">-{fmtTk(cartDiscount, state.lang)}</span>
        </div>
      )}
      <div className="h-px bg-surface-container my-1" />
      <div className="flex justify-between items-center">
        <div>
          <span className="text-headline-md font-headline-md font-bold text-on-surface">{bn ? 'মোট বিল' : 'Total bill'}</span>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Total Payable (Cash/bKash)</p>
        </div>
        <span className="text-headline-md font-headline-md font-bold text-primary">{fmtTk(cartFinal, state.lang)}</span>
      </div>
    </>
  );
}

export default function CartScreen() {
  const { state, dispatch, cartTotal, cartCount, cartDeliveryFee, cartDiscount, cartFinal, validatePromo, currentArea } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [paidMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');

  // Cart-step state (Stitch 14)
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [customRequest, setCustomRequest] = useState('');
  const [replacement, setReplacement] = useState<ReplacementId>('similar');
  const [replacementTouched, setReplacementTouched] = useState(false);
  const [showAiCart, setShowAiCart] = useState(true);
  const [showClearSheet, setShowClearSheet] = useState(false);

  // Checkout-step state (Stitch 15)
  const defaultAddress = state.addresses.find(a => a.isDefault);
  const [custName, setCustName] = useState(state.user?.name ?? '');
  const [editingName, setEditingName] = useState(false);
  const [addressText, setAddressText] = useState(defaultAddress?.fullAddress ?? '');
  const [orderNote, setOrderNote] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [showAiCheckout, setShowAiCheckout] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);

  const bazaarItems = state.cart.filter(i => i.source === 'bazaar');
  const restaurantGroups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of state.cart.filter(i => i.source === 'restaurant')) {
      const key = item.restaurantId ?? 'restaurant';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].map(([restaurantId, items]) => ({
      restaurant: state.restaurants.find(r => r.id === restaurantId),
      items,
    }));
  }, [state.cart, state.restaurants]);

  const suggestions = useMemo(() => {
    const inCart = new Set(state.cart.map(i => i.productId).filter(Boolean));
    const others = state.products.filter(p => p.isAvailable && !inCart.has(p.id));
    return [
      ...others.filter(p => p.tags?.includes('popular')),
      ...others.filter(p => !p.tags?.includes('popular')),
    ];
  }, [state.cart, state.products]);

  const addSuggestion = (p: Product) => {
    dispatch({
      type: 'ADD_TO_CART',
      item: {
        id: p.id, productId: p.id, nameBn: p.nameBn, nameEn: p.nameEn,
        quantity: 1, price: p.approxPrice, unit: p.unit, source: 'bazaar', isApproxPrice: true,
      },
    });
  };

  const applyPromo = () => {
    const promo = validatePromo(promoInput.trim());
    if (!promo) { setPromoError(true); return; }
    dispatch({ type: 'APPLY_PROMO', promo });
    setPromoError(false);
    setPromoInput('');
  };

  const fastestSlot = useMemo<TimeSlot>(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    for (const s of TIME_SLOTS) {
      if (mins < SLOT_END[s.id] && !(state.isSlotFull && s.id === 'morning')) return s.id;
    }
    return 'evening';
  }, [state.isSlotFull]);

  const handlePlace = async () => {
    if (cartCount === 0) return;
    const noteParts = [
      customRequest.trim(),
      orderNote.trim(),
      replacementTouched
        ? `${bn ? 'পণ্য না পেলে' : 'If item unavailable'}: ${bn ? REPLACEMENT_OPTIONS.find(r => r.id === replacement)?.bn : REPLACEMENT_OPTIONS.find(r => r.id === replacement)?.en}`
        : '',
    ].filter(Boolean);

    setIsPlacing(true);
    const result = await placeOrder(
      state.cart,
      state.selectedAreaId,
      addressText.trim() || defaultAddress?.fullAddress || '',
      cartDeliveryFee,
      state.appliedPromo?.code ?? null,
      cartDiscount,
      paidMethod,
      timeSlot,
      custName.trim() || state.user?.name || '',
      state.user?.mobile ?? '',
      noteParts.length ? noteParts.join(' • ') : undefined,
    );
    setIsPlacing(false);

    if (result.success && result.order) {
      const order = state.user ? { ...result.order, customerId: state.user.id } : result.order;
      dispatch({ type: 'PLACE_ORDER', order });
      setPlacedOrder(order);
      setStep('success');
      window.scrollTo({ top: 0 });
    }
  };

  // ── STEP: SUCCESS (Stitch 16) ───────────────────────────────
  if (step === 'success' && placedOrder) {
    return <SuccessView order={placedOrder} paymentMethod={paidMethod} />;
  }

  // ── EMPTY CART (Stitch 14f) ─────────────────────────────────
  if (cartCount === 0) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center w-full px-margin h-14">
            <div className="flex items-center space-x-2">
              <button
                type="button" aria-label={bn ? 'ফিরে যান' : 'Go back'} onClick={() => navigate(-1)}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <div className="flex flex-col">
                <span className="text-headline-sm font-headline-sm text-on-surface font-bold leading-tight">{bn ? 'আপনার কার্ট' : 'Your Cart'}</span>
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'Your Cart' : 'আপনার কার্ট'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 duration-150 text-label-md font-label-md flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">translate</span>
              <span>বাংলা | EN</span>
            </button>
          </div>
          <div className="bg-primary/5 px-margin py-2 border-t border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 filled-symbol">location_on</span>
              <p className="text-body-sm font-body-sm text-on-surface truncate">
                <span className="font-semibold text-primary">{bn ? 'ডেলিভারি এলাকা:' : 'Delivery area:'}</span>{' '}
                {currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : ''}, {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
              </p>
            </div>
            <button type="button" onClick={() => navigate('/area')} className="text-primary hover:text-primary-container text-label-md font-label-md font-semibold shrink-0 ml-2 hover:underline active:scale-95 duration-150">
              {bn ? 'পরিবর্তন' : 'Change'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-4 pb-8 flex flex-col">
          {/* Hero empty card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-sm text-center flex flex-col items-center mt-2 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative w-28 h-28 my-3 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-surface-container-low border border-primary/20 flex items-center justify-center shadow-inner relative z-10">
                <span className="material-symbols-outlined text-[54px] text-primary">shopping_basket</span>
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[18px]">pedal_bike</span>
                </div>
              </div>
            </div>
            <h1 className="text-headline-md font-headline-md text-on-surface font-bold mt-2">{bn ? 'কার্ট খালি' : 'Cart is empty'}</h1>
            <p className="text-body-md font-body-md text-on-surface-variant font-medium mt-0.5">
              {bn ? 'Your cart is currently empty' : 'কার্ট খালি'}
            </p>
            <p className="text-body-sm font-body-sm text-outline mt-2 max-w-[280px]">
              {bn ? 'স্থানীয় বাজার বা আপনার পছন্দের রেস্টুরেন্ট থেকে তাজা খাবার ও নিত্যপণ্য যোগ করুন।' : 'Add fresh food and daily essentials from the local bazaar or your favourite restaurant.'}
            </p>
            <span className="text-bilingual-sub font-bilingual-sub text-outline/80 mt-0.5">
              {bn ? '(Add something fresh from the local bazaar or restaurant)' : '(স্থানীয় বাজার বা রেস্টুরেন্ট থেকে তাজা কিছু যোগ করুন)'}
            </span>
            <div className="w-full mt-6 space-y-2.5 relative z-10">
              <button
                type="button" onClick={() => navigate('/bazaar')}
                className="w-full h-12 rounded-full bg-primary hover:bg-[#15803D] text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span>{bn ? 'বাজার শুরু করুন / Start shopping' : 'Start shopping'}</span>
              </button>
              <button
                type="button" onClick={() => navigate('/orders')}
                className="w-full h-11 rounded-full bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">history</span>
                <span>{bn ? 'আগের অর্ডার দেখুন / View past orders' : 'View past orders'}</span>
              </button>
            </div>
          </div>

          {/* Quick delivery assurance badge */}
          <div className="mt-4 flex items-center justify-between px-3.5 py-2.5 bg-[#FFF7ED] border border-[#F97316]/40 rounded-lg shadow-sm gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C2410C] text-[20px]">electric_bolt</span>
              <div>
                <p className="text-label-md font-label-md text-[#C2410C]">{bn ? '১৫-৩০ মিনিটে সাইকেল ডেলিভারি' : 'Bicycle delivery in 15-30 min'}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-[#C2410C]/80">Personal shopper on pedal bicycle</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#FD761A]/10 text-[#C2410C] font-label-sm text-label-sm rounded-full font-bold border border-[#F97316]/30 shrink-0">
              {fmtTk(cartDeliveryFee, lang)} {bn ? 'চার্জ' : 'charge'}
            </span>
          </div>

          {/* Popular categories */}
          <section className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold text-[16px]">
                {bn ? 'জনপ্রিয় ক্যাটেগরি' : 'Popular Categories'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-normal">/ {bn ? 'Popular Categories' : 'জনপ্রিয় ক্যাটেগরি'}</span>
              </h2>
              <button type="button" onClick={() => navigate('/bazaar')} className="text-label-sm font-label-sm text-primary flex items-center">
                {bn ? 'সব দেখুন' : 'See all'} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { icon: 'nutrition', tile: 'bg-primary-fixed/30 text-primary', titleBn: 'কাঁচাবাজার ও চাল-ডাল', titleEn: 'Groceries & Rice-Pulses', subBn: 'Fresh Groceries, Local Vegetables & Rice', subEn: 'তাজা বাজার, সবজি ও চাল-ডাল', to: '/bazaar' },
                { icon: 'restaurant', tile: 'bg-secondary-fixed/40 text-secondary', titleBn: 'রেস্টুরেন্টের খাবার ও বিরিয়ানি', titleEn: 'Restaurant Food & Biryani', subBn: 'Hot Restaurant Meals, Biryani & Snacks', subEn: 'গরম খাবার, বিরিয়ানি ও নাস্তা', to: '/food' },
                { icon: 'soup_kitchen', tile: 'bg-tertiary-fixed/40 text-tertiary', titleBn: 'তেল ও মসলা', titleEn: 'Oil & Spices', subBn: 'Oil, Spices & Daily Cooking Essentials', subEn: 'তেল, মসলা ও রান্নার উপকরণ', to: '/bazaar?category=oil-spices' },
              ].map(row => (
                <button
                  key={row.titleEn} type="button" onClick={() => navigate(row.to)}
                  className="flex items-center p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-all active:scale-[0.99] group shadow-sm text-left"
                >
                  <div className={clsx('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', row.tile)}>
                    <span className="material-symbols-outlined text-[24px]">{row.icon}</span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-label-lg font-label-lg text-on-surface group-hover:text-primary transition-colors truncate">{bn ? row.titleBn : row.titleEn}</h3>
                      <span className="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform shrink-0">arrow_forward</span>
                    </div>
                    <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? row.subBn : row.subEn}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── STEP: CHECKOUT (Stitch 15 + 15b + 15c) ──────────────────
  if (step === 'checkout') {
    const promo = state.appliedPromo;
    const freeDelivery = promo?.discountType === 'free-delivery' && cartDiscount > 0;
    return (
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 border-b border-outline-variant/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              type="button" aria-label={bn ? 'কার্টে ফিরে যান' : 'Go back'} onClick={() => setStep('cart')}
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-transform text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-1.5 leading-tight">
                {bn ? 'অর্ডার কনফার্ম করুন' : 'Confirm your order'}
              </h1>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium">{bn ? 'Checkout Details' : 'চেকআউট বিবরণ'}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#E8F5E9] text-primary px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
            <span className="material-symbols-outlined filled-symbol text-[16px] text-primary">verified_user</span>
            <span className="text-label-sm font-label-sm text-primary tracking-wide">{bn ? 'নিরাপদ অর্ডার' : 'Safe order'}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-4 pb-6 flex flex-col gap-4">
          {/* STEP 1 · Name */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="min-w-0">
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'নাম / Your name' : 'Your name / নাম'}</span>
                {editingName ? (
                  <input
                    autoFocus value={custName} onChange={e => setCustName(e.target.value)}
                    className="w-full text-body-md font-body-md font-semibold text-on-surface bg-surface-container-low rounded-lg px-2 py-1 border border-outline-variant/50 focus:outline-none focus:border-primary"
                  />
                ) : (
                  <p className="text-body-md font-body-md font-semibold text-on-surface truncate">{custName || '—'}</p>
                )}
              </div>
            </div>
            <button
              type="button" aria-label={bn ? 'নাম বদলান' : 'Edit name'}
              onClick={() => setEditingName(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant active:scale-95 transition-transform shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">{editingName ? 'check' : 'edit'}</span>
            </button>
          </section>

          {/* STEP 2 · Mobile */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </div>
              <div className="min-w-0">
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'মোবাইল নম্বর / Mobile number' : 'Mobile number / মোবাইল নম্বর'}</span>
                <p className="text-body-md font-body-md font-semibold text-on-surface tracking-wide truncate">{state.user?.mobile ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#E8F5E9] text-primary px-2.5 py-1 rounded-full border border-primary/25 shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary filled-symbol">check_circle</span>
              <span className="text-label-sm font-label-sm">{bn ? 'যাচাইকৃত' : 'Verified'}</span>
            </div>
          </section>

          {/* STEP 3 · Delivery area */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border-2 border-primary/30 bg-primary/[0.02] shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[22px] text-primary filled-symbol">location_on</span>
                </div>
                <div className="min-w-0">
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">{bn ? 'ডেলিভারি এলাকা / Delivery area' : 'Delivery area / ডেলিভারি এলাকা'}</span>
                  <p className="text-body-md font-body-md font-bold text-on-surface mt-0.5 truncate">
                    {currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : '—'}{' '}
                    <span className="font-normal text-on-surface-variant">{currentArea ? (bn ? currentArea.nameEn : currentArea.nameBn) : ''}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-[#FFF7ED] text-[#C2410C] border border-[#F97316]/30">
                      <span className="material-symbols-outlined text-[12px] mr-1">moped</span>
                      {bn ? 'ডেলিভারি চার্জ' : 'Delivery charge'} {fmtTk(cartDeliveryFee, lang)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-[#E8F5E9] text-primary font-semibold">
                      <span className={clsx('w-1.5 h-1.5 rounded-full bg-primary mr-1', state.isServiceOpen && 'animate-pulse')} />
                      {state.isServiceOpen ? (bn ? 'চালু আছে' : 'Active now') : (bn ? 'এখন বন্ধ' : 'Closed now')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button" onClick={() => navigate('/area')}
                className="text-label-md font-label-md text-primary hover:text-primary-container px-2.5 py-1 rounded-md border border-primary/30 hover:bg-primary-fixed/20 active:scale-95 transition-all shrink-0"
              >
                {bn ? 'পরিবর্তন' : 'Change'}
              </button>
            </div>
          </section>

          {/* STEP 4 · Detailed address */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] text-primary filled-symbol">home_pin</span>
              <label className="text-bilingual-sub font-bilingual-sub font-semibold text-on-surface" htmlFor="checkout-address">
                {bn ? 'বিস্তারিত ঠিকানা / Detailed address' : 'Detailed address / বিস্তারিত ঠিকানা'}
              </label>
            </div>
            <p className="text-label-sm font-label-sm text-outline">{bn ? 'বাসা, রাস্তা বা পরিচিত জায়গা লিখুন' : 'Write house, road or a known landmark'}</p>
            <div className="relative mt-0.5">
              <textarea
                id="checkout-address" rows={2} value={addressText} onChange={e => setAddressText(e.target.value)}
                placeholder={bn ? 'বাসা নং, রোড বা পরিচিত স্থান লিখুন' : 'House no, road or landmark'}
                className="w-full text-body-md font-body-md text-on-surface bg-surface-container-low/50 rounded-lg border border-outline-variant/50 p-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
              <span className="absolute bottom-2 right-2 material-symbols-outlined text-outline-variant text-[18px]">domain</span>
            </div>
          </section>

          {/* STEP 5 · Order note */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">note_alt</span>
              <label className="text-bilingual-sub font-bilingual-sub text-on-surface-variant" htmlFor="checkout-note">
                {bn ? 'অর্ডার নোট / Order note' : 'Order note'} <span className="text-outline font-normal">(optional)</span>
              </label>
            </div>
            <input
              id="checkout-note" type="text" value={orderNote} onChange={e => setOrderNote(e.target.value)}
              placeholder={bn ? 'কোনো বিশেষ নির্দেশ থাকলে লিখুন' : 'Any special instruction'}
              className="w-full text-body-md font-body-md text-on-surface bg-surface-container-low/50 rounded-lg border border-outline-variant/50 px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline"
            />
          </section>

          {/* STEP 6 · AI suggestions (Stitch 15b) */}
          {showAiCheckout && suggestions.length > 0 && (
            <section className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl p-3.5 border border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-1 relative">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px] animate-pulse filled-symbol">auto_awesome</span>
                  <h2 className="text-body-lg font-body-lg font-bold text-primary">{bn ? 'সহায়কের সাজেশন' : "Assistant's suggestions"}</h2>
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">/ {bn ? "Assistant's suggestions" : 'সহায়কের সাজেশন'}</span>
                </div>
                <button
                  type="button" aria-label={bn ? 'সাজেশন বন্ধ করুন' : 'Dismiss suggestions'} onClick={() => setShowAiCheckout(false)}
                  className="text-on-surface-variant hover:text-on-surface w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5 mb-3 leading-snug relative">
                {bn ? 'আপনার কার্টের সাথে মানানসই সেরা সংযোজন:' : 'Best additions matching your cart:'}
              </p>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 relative">
                {suggestions.slice(0, 4).map(p => (
                  <div key={p.id} className="min-w-[150px] max-w-[150px] bg-surface-container-lowest rounded-xl p-2.5 border border-primary/15 shadow-sm flex flex-col justify-between flex-shrink-0">
                    <div>
                      <div className="w-full h-20 rounded-lg overflow-hidden bg-surface-container mb-2 relative flex items-center justify-center text-[36px]">
                        {PRODUCT_IMAGES[p.id]
                          ? <img src={PRODUCT_IMAGES[p.id]} alt={bn ? p.nameBn : p.nameEn} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                          : p.imageEmoji}
                        <span className="absolute top-1 left-1 bg-surface-container-lowest/90 text-[9px] font-bold text-primary px-1.5 py-0.5 rounded shadow-sm">
                          {bn ? p.unit : p.unitEn}
                        </span>
                      </div>
                      <h3 className="text-label-md font-label-md text-on-surface line-clamp-1">{bn ? p.nameBn : p.nameEn}</h3>
                      <p className="text-bilingual-sub font-bilingual-sub text-outline font-normal">{bn ? 'আনুমানিক' : 'Approx'} {fmtTk(p.approxPrice, lang)}</p>
                    </div>
                    <button
                      type="button" onClick={() => addSuggestion(p)}
                      className="mt-2 w-full py-1.5 bg-primary/10 hover:bg-primary hover:text-on-primary text-primary rounded-full text-label-sm font-label-sm font-bold flex items-center justify-center gap-1 active:scale-95 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span> {bn ? 'যোগ করুন' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-primary/10 flex items-start gap-1.5 text-on-surface-variant relative">
                <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">receipt_long</span>
                <p className="text-[11px] leading-tight font-bilingual-sub text-outline">
                  {bn ? 'দাম আনুমানিক — রসিদ দেখে আসল দাম নির্ধারণ হবে (কোনো লুকানো চার্জ নেই)।' : 'Prices are approximate — final price follows the receipt (no hidden charges).'}
                </p>
              </div>
            </section>
          )}

          {/* STEP 7 · Delivery time-slot */}
          <section className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <h2 className="text-label-lg font-label-lg text-on-surface">{bn ? 'ডেলিভারি সময় / Delivery time-slot' : 'Delivery time-slot'}</h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {TIME_SLOTS.map(slot => {
                const isFull = state.isSlotFull && slot.id === 'morning';
                const selected = !isFull && timeSlot === slot.id;
                const isFastest = fastestSlot === slot.id && !isFull;
                const meta = SLOT_META[slot.id];
                return (
                  <button
                    key={slot.id} type="button" disabled={isFull} aria-pressed={selected}
                    onClick={() => setTimeSlot(slot.id)}
                    className={clsx(
                      'relative flex items-center justify-between p-3.5 rounded-xl text-left transition-all w-full',
                      isFull
                        ? 'border border-dashed border-[#F97316]/60 bg-[#FFF7ED]/50 cursor-not-allowed'
                        : selected
                          ? 'border-2 border-primary bg-primary/[0.04] shadow-sm'
                          : 'border border-outline-variant/50 bg-surface-container-lowest hover:border-primary/50',
                    )}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={clsx(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        isFull ? 'border-2 border-outline-variant' : selected ? 'border-2 border-primary bg-primary text-white' : 'border-2 border-outline-variant',
                      )}>
                        {selected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className={clsx('text-body-md font-body-md', selected ? 'font-bold text-on-surface' : 'font-medium text-on-surface', isFull && 'line-through text-on-surface/60')}>
                            {bn ? `আজ ${meta.rangeBn}` : `Today ${meta.rangeEn}`}
                          </span>
                          {isFastest && (
                            <span className="text-label-sm font-label-sm bg-[#E8F5E9] text-primary px-2 py-0.5 rounded-full font-bold">
                              {bn ? 'সবচেয়ে দ্রুত / Fastest' : 'Fastest'}
                            </span>
                          )}
                          {isFull && (
                            <span className="text-label-sm font-label-sm bg-[#FEE2E2] text-error px-2 py-0.5 rounded-full font-bold">
                              {bn ? 'ভরে গেছে / Slot Full' : 'Slot Full'}
                            </span>
                          )}
                        </span>
                        <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block">
                          {bn ? meta.rangeEn : meta.rangeBn} • {bn ? slot.tagBn : slot.tagEn}
                        </span>
                      </span>
                    </span>
                    <span className={clsx('material-symbols-outlined text-[22px] shrink-0', selected ? 'text-primary' : 'text-outline-variant')}>
                      {isFastest ? 'local_shipping' : slot.icon}
                    </span>
                  </button>
                );
              })}
            </div>
            {state.isSlotFull && (
              <p className="text-body-sm font-body-sm text-[#C2410C] flex items-start gap-1.5">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
                {bn ? 'সকালের স্লটের সব রাইডার বুকড — অনুগ্রহ করে অন্য স্লট বেছে নিন।' : 'All riders are booked for the morning slot — please choose another slot.'}
              </p>
            )}
          </section>

          {/* STEP 8 · Bill summary (Stitch 15 + 15c promo) */}
          <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <h2 className="text-label-lg font-label-lg text-on-surface">{bn ? 'বিল বিবরণী / Bill summary' : 'Bill summary'}</h2>
              </div>
              <span className="text-bilingual-sub font-bilingual-sub text-outline">{bn ? 'বাজার যাচাইকৃত' : 'Bazaar verified'}</span>
            </div>

            {promo && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">🎉</span>
                  <div className="min-w-0">
                    <div className="text-label-md font-label-md text-primary font-bold truncate">
                      {bn ? 'কোড প্রয়োগ করা আছে:' : 'Code applied:'} <span className="tracking-wide">{promo.code}</span>
                    </div>
                    <p className="text-bilingual-sub font-bilingual-sub text-[#1D9D57] font-semibold truncate">
                      ({bn ? promo.descriptionBn : promo.descriptionEn})
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setStep('cart')} className="text-label-sm font-label-sm text-primary font-bold underline hover:text-[#15803D] active:scale-95 transition-transform flex items-center gap-0.5 whitespace-nowrap pl-2">
                  <span>{bn ? 'বদলাতে কার্টে যান' : 'Change in cart'}</span>
                  <span className="text-[12px] leading-none">➔</span>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 text-body-md font-body-md">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>{bn ? 'পণ্যের দাম (আনুমানিক)' : 'Items (approx.)'} <span className="text-bilingual-sub font-bilingual-sub block text-outline">{bn ? 'Items (approx.)' : 'পণ্যের দাম (আনুমানিক)'}</span></span>
                <span className="font-semibold text-on-surface">{fmtTk(cartTotal, lang)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>{bn ? `ডেলিভারি চার্জ (${currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : ''})` : 'Delivery charge'} <span className="text-bilingual-sub font-bilingual-sub block text-outline">Delivery charge</span></span>
                {freeDelivery ? (
                  <span className="flex items-center gap-1.5">
                    <span className="line-through text-outline font-medium text-body-sm">{fmtTk(cartDeliveryFee, lang)}</span>
                    <span className="text-[#1D9D57] font-bold">{fmtTk(0, lang)}</span>
                  </span>
                ) : (
                  <span className="font-semibold text-on-surface">{fmtTk(cartDeliveryFee, lang)}</span>
                )}
              </div>
              {promo && cartDiscount > 0 && !freeDelivery && (
                <div className="flex justify-between items-center text-[#1D9D57]">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">local_activity</span>
                    <span className="font-bold">{bn ? `প্রোমো ডিসকাউন্ট (${promo.code})` : `Promo discount (${promo.code})`}</span>
                  </div>
                  <span className="font-bold">-{fmtTk(cartDiscount, lang)}</span>
                </div>
              )}
              <div className="h-px bg-outline-variant/40 my-1" />
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-body-lg font-body-lg font-bold text-on-surface">{bn ? 'সর্বমোট' : 'Total'}</span>
                  <span className="text-bilingual-sub font-bilingual-sub block text-on-surface-variant">Total payable</span>
                </div>
                <div className="text-right">
                  {cartDiscount > 0 && (
                    <span className="text-body-sm font-medium line-through text-outline block -mb-0.5">{fmtTk(cartTotal + cartDeliveryFee, lang)}</span>
                  )}
                  <span className="text-headline-sm font-headline-sm font-bold text-primary">{fmtTk(cartFinal, lang)}</span>
                  {cartDiscount > 0 && (
                    <span className="text-label-sm font-label-sm text-[#1D9D57] font-bold block">{bn ? 'মোট সাশ্রয়' : 'You save'} {fmtTk(cartDiscount, lang)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#E8F5E9]/80 border border-primary/25 rounded-lg p-3 flex items-start gap-2.5 mt-1">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5 filled-symbol">info</span>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                <strong className="text-primary font-semibold">{bn ? 'আমাদের আয় শুধু ডেলিভারি চার্জ থেকে' : 'We earn only from the delivery charge'}</strong>
                {bn ? ' — পণ্যের দামে কোনো বাড়তি নেই। বাজারের আসল মেমো রসিদের ভিত্তিতেই চূড়ান্ত মূল্য পরিশোধ করবেন।' : ' — no markup on product prices. You pay the final price from the actual bazaar memo receipt.'}
              </p>
            </div>
          </section>

          {/* STEP 9 · Payment (COD — Stitch 15) */}
          <section className="bg-surface-container-lowest p-3.5 rounded-xl border-2 border-primary bg-primary/[0.02] shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center p-0.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-md font-body-md font-bold text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
                  <span className="text-label-sm font-label-sm bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded font-semibold">Cash on delivery</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">payments</span>
                  {bn ? 'পণ্য হাতে পেয়ে মূল্য পরিশোধ' : 'Pay when you receive the items'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px] text-primary filled-symbol shrink-0">price_check</span>
          </section>

          {/* Local courier assurance (Stitch 15c) */}
          <section className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[22px]">pedal_bike</span>
              <div className="min-w-0">
                <p className="text-label-md font-label-md font-bold text-on-surface truncate">{bn ? 'লালমনিরহাট সদর নিজস্ব রাইডার' : 'Lalmonirhat Sadar own rider'}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'পরিবেশবান্ধব বাইসাইকেল ডেলিভারি সার্ভিস' : 'Eco-friendly bicycle delivery service'}</p>
              </div>
            </div>
            <span className="text-label-sm font-label-sm text-primary font-bold bg-[#E8F5E9] px-2 py-1 rounded-md shrink-0">{bn ? 'স্থানীয়' : 'Local'}</span>
          </section>
        </div>

        <ChatFab bottomClass="bottom-[104px]" />

        {/* STEP 10 · Sticky CTA */}
        <div className="px-margin py-3 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 shadow-[0_-4px_16px_rgba(43,45,47,0.08)]">
          <button
            type="button" onClick={handlePlace} disabled={isPlacing}
            className="w-full h-12 bg-primary hover:bg-[#15803D] active:scale-[0.98] transition-all rounded-full flex items-center justify-between px-6 text-white shadow-md disabled:opacity-60"
          >
            <span className="flex flex-col text-left">
              <span className="text-label-lg font-label-lg font-bold leading-tight">{bn ? 'অর্ডার করুন / Place order' : 'Place order'}</span>
              <span className="text-[10px] text-white/80 font-medium">{bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'}</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-headline-sm">
              <span>• {fmtTk(cartFinal, lang)}</span>
              {isPlacing
                ? <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[22px]">arrow_forward</span>}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: CART (Stitch 14 + 14b + 14c/14d/14e) ──────────────
  const promo = state.appliedPromo;
  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 border-b border-outline-variant/30 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button" aria-label={bn ? 'ফিরে যান / Go Back' : 'Go back'} onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-headline-sm font-headline-sm text-on-surface">{bn ? 'আপনার কার্ট' : 'Your Cart'}</h1>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-label-sm font-label-sm whitespace-nowrap">
                  {bn ? `${toBnDigits(cartCount, lang)}টি আইটেম (${cartCount} items)` : `${cartCount} items`}
                </span>
              </div>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'Your Cart · Unified Order' : 'আপনার কার্ট · Unified Order'}</p>
            </div>
          </div>
          <LangToggle />
        </div>
        <button
          type="button" onClick={() => navigate('/area')}
          className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40 w-full"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
            <span className="text-label-md font-label-md text-on-surface truncate">
              {currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : ''} {currentArea ? (bn ? currentArea.nameEn : currentArea.nameBn) : ''}, {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
            </span>
          </span>
          <span className="text-label-sm font-label-sm bg-surface-container-lowest text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
            {fmtTk(cartDeliveryFee, lang)} {bn ? 'চার্জ' : 'charge'}
          </span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-3 pb-6 flex flex-col gap-space-md">
        {/* Reassurance banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3.5 flex items-start gap-3">
          <span className="text-xl shrink-0 leading-none">🌿</span>
          <div className="flex flex-col">
            <p className="text-body-md font-body-md font-bold text-primary leading-tight">
              {bn ? 'আমাদের আয় শুধু ডেলিভারি চার্জ থেকে — পণ্যের দামে কোনো বাড়তি নেই' : 'We earn only from the delivery charge — no markup on product prices'}
            </p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-1 leading-snug">
              {bn ? 'We earn only from the delivery charge — no markup on bazaar or restaurant prices.' : 'আমাদের আয় শুধু ডেলিভারি চার্জ থেকে — বাজার বা রেস্টুরেন্টের দামে কোনো বাড়তি নেই।'}
            </p>
          </div>
        </div>

        {/* Bazaar group */}
        {bazaarItems.length > 0 && (
          <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
                <div>
                  <h2 className="text-body-lg font-body-lg font-bold text-on-surface leading-tight">{bn ? 'গোশালা বাজার থেকে' : 'From Goshala Bazar'}</h2>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'From Goshala Bazar' : 'গোশালা বাজার থেকে'}</p>
                </div>
              </div>
              <span className="text-label-sm font-label-sm bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full whitespace-nowrap">
                {bn ? `${toBnDigits(bazaarItems.length, lang)}টি পণ্য (${bazaarItems.length} items)` : `${bazaarItems.length} items`}
              </span>
            </div>
            {bazaarItems.map(item => <CartRow key={item.id} item={item} />)}
          </section>
        )}

        {/* Restaurant groups */}
        {restaurantGroups.map(({ restaurant, items }) => (
          <section key={restaurant?.id ?? 'restaurant'} className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">restaurant</span>
                <div className="min-w-0">
                  <h2 className="text-body-lg font-body-lg font-bold text-on-surface leading-tight truncate">
                    {restaurant ? (bn ? restaurant.nameBn : restaurant.nameEn) : (bn ? 'রেস্টুরেন্ট' : 'Restaurant')}
                  </h2>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">
                    {restaurant ? `${bn ? restaurant.nameEn : restaurant.nameBn} · ${restaurant.address}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-label-sm font-label-sm bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                {bn ? `${toBnDigits(items.length, lang)}টি পণ্য (${items.length} item${items.length > 1 ? 's' : ''})` : `${items.length} item${items.length > 1 ? 's' : ''}`}
              </span>
            </div>
            {items.map(item => <CartRow key={item.id} item={item} />)}
          </section>
        ))}

        {/* Clear cart (existing behaviour) */}
        <button type="button" onClick={() => setShowClearSheet(true)} className="text-label-md text-error font-medium self-end py-0.5">
          {bn ? 'কার্ট খালি করুন' : 'Clear cart'}
        </button>

        {/* AI missing-items card (Stitch 14b) */}
        {showAiCart && suggestions.length > 0 && (
          <section className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-space-md relative overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[16px] filled-symbol text-primary">auto_awesome</span>
                <span className="text-label-sm font-label-sm font-bold tracking-wide">{bn ? 'সহায়ক / Assistant' : 'Assistant / সহায়ক'}</span>
              </div>
              <button
                type="button" aria-label={bn ? 'সাজেশন বন্ধ করুন' : 'Dismiss AI recommendations'} onClick={() => setShowAiCart(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-[#DCFCE7] active:scale-90 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold flex items-center gap-1 flex-wrap">
              {bn ? 'কিছু বাদ পড়েনি তো?' : 'Anything missing?'}
              <span className="text-body-sm font-body-sm font-normal text-outline">/ {bn ? 'Anything missing?' : 'কিছু বাদ পড়েনি তো?'}</span>
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 leading-snug">
              {bn ? 'আপনার কার্টের পণ্যগুলোর সাথে নিচের জিনিসগুলো মিলিয়ে নিতে পারেন:' : 'You can match the items below with what is already in your cart:'}
            </p>
            <div className="mt-3 space-y-2">
              {suggestions.slice(0, 3).map(p => (
                <div key={p.id} className="bg-surface-container-lowest rounded-xl p-2.5 flex items-center justify-between border border-[#DCFCE7] shadow-sm hover:border-primary/40 transition-colors gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0 overflow-hidden text-[20px]">
                      {PRODUCT_IMAGES[p.id]
                        ? <img src={PRODUCT_IMAGES[p.id]} alt={bn ? p.nameBn : p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                        : p.imageEmoji}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-body-md font-body-md font-semibold text-on-surface leading-tight truncate">{bn ? p.nameBn : p.nameEn}</h4>
                      <p className="text-bilingual-sub font-bilingual-sub text-outline">{bn ? p.unit : p.unitEn} · {bn ? 'আনুমানিক' : 'Approx'} {fmtTk(p.approxPrice, lang)}</p>
                    </div>
                  </div>
                  <button
                    type="button" onClick={() => addSuggestion(p)}
                    className="px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-on-primary text-label-md font-label-md font-semibold flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{bn ? 'যোগ করুন' : 'Add'}</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-bilingual-sub font-bilingual-sub text-outline">
              <span className="material-symbols-outlined text-[15px] text-primary">receipt</span>
              <span>{bn ? 'বাজারে আসল মেমোর মূল্যেই কেনা হবে।' : 'Everything is bought at the actual bazaar memo price.'}</span>
            </div>
          </section>
        )}

        {/* Free-text custom request (Stitch 14) */}
        <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h2 className="text-body-lg font-body-lg font-bold text-on-surface">{bn ? 'আরো কিছু লিখতে চাইলে' : 'Anything else in words'}</h2>
          </div>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-relaxed">
            {bn
              ? 'Add anything else in words · তালিকায় নেই এমন যেকোনো জিনিস আমাদের সাইকেল রাইডার বাজার থেকে কিনে নিয়ে আসবে।'
              : 'তালিকায় নেই এমন যেকোনো জিনিস আমাদের সাইকেল রাইডার বাজার থেকে কিনে নিয়ে আসবে।'}
          </p>
          <div className="relative mt-1">
            <textarea
              rows={2} maxLength={150} value={customRequest} onChange={e => setCustomRequest(e.target.value)}
              placeholder={bn ? 'যেমন: ২টি পান বা কাঁচা সুপারি লাগবে, কিংবা কোনো বিশেষ মসলা...' : 'e.g. 2 betel leaves or a special spice...'}
              className="w-full text-body-md font-body-md bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-label-sm font-label-sm text-outline">
                {bn ? `সর্বোচ্চ ১৫০ অক্ষর (${toBnDigits(customRequest.length, lang)}/১৫০)` : `Max 150 characters (${customRequest.length}/150)`}
              </span>
            </div>
          </div>
        </section>

        {/* Replacement preference (Stitch 14) */}
        <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col gap-3">
          <div>
            <h2 className="text-body-lg font-body-lg font-bold text-on-surface">{bn ? 'পণ্য না পাওয়া গেলে কী করবেন?' : 'If an item is not found?'}</h2>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Item replacement preference if out of stock</p>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup">
            {REPLACEMENT_OPTIONS.map(opt => {
              const selected = replacement === opt.id;
              return (
                <button
                  key={opt.id} type="button" role="radio" aria-checked={selected}
                  onClick={() => { setReplacement(opt.id); setReplacementTouched(true); }}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-left',
                    selected ? 'border-2 border-primary bg-primary/5' : 'border border-outline-variant/50 hover:bg-surface-container-low',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">{opt.emoji}</span>
                    <span className={clsx('text-body-md font-body-md', selected ? 'font-semibold text-on-surface' : 'text-on-surface')}>
                      {bn ? opt.bn : opt.en}
                    </span>
                  </span>
                  <span className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                    selected ? 'border-2 border-primary bg-primary' : 'border-2 border-outline-variant',
                  )}>
                    {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Promo (Stitch 14c entry / 14e invalid / 14d applied) */}
        {promo ? (
          <section className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-2.5 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#1D9D57] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">check</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-body-md font-label-lg text-primary font-bold">
                    {bn ? `কোড প্রয়োগ হয়েছে: ${promo.code} ✓` : `Code applied: ${promo.code} ✓`}
                  </span>
                </div>
                <div className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                  {bn ? promo.descriptionEn : promo.descriptionBn}
                </div>
                {cartDiscount > 0 && (
                  <div className="mt-1 inline-flex items-center gap-1 bg-[#1D9D57]/15 text-[#006a37] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">pedal_bike</span>
                    <span>{bn ? promo.descriptionBn : promo.descriptionEn} ({fmtTk(cartDiscount, lang)} {bn ? 'সাশ্রয়' : 'saved'})</span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button" aria-label={bn ? 'প্রোমো কোড সরান' : 'Remove promo code'} title={bn ? 'মুছুন' : 'Remove'}
              onClick={() => dispatch({ type: 'REMOVE_PROMO' })}
              className="shrink-0 w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-error flex items-center justify-center active:scale-90 transition-all border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </section>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F97316] to-secondary-container" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] filled-symbol">{promoError ? 'loyalty' : 'sell'}</span>
              </div>
              <div>
                <h3 className="text-label-lg font-label-lg font-bold text-on-surface">{bn ? 'প্রোমো কোড আছে?' : 'Have a promo code?'}</h3>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-none">{bn ? 'Have a promo code?' : 'প্রোমো কোড আছে?'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {!promoError && (
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">local_offer</span>
                )}
                <input
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value); setPromoError(false); }}
                  placeholder={bn ? 'কোড লিখুন (যেমন: JOVRO50)' : 'Enter code (e.g. JOVRO50)'}
                  className={clsx(
                    'w-full h-11 pr-9 rounded-xl text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none transition-all uppercase tracking-wide text-[13px]',
                    promoError
                      ? 'pl-3.5 border border-error-container bg-error-container/20 focus:border-error focus:ring-1 focus:ring-error/20 font-label-lg'
                      : 'pl-10 border border-outline-variant/60 bg-surface-container-low/50 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20',
                  )}
                  type="text"
                />
                {promoError && promoInput && (
                  <button
                    type="button" aria-label={bn ? 'কোড মুছুন' : 'Clear code'} onClick={() => { setPromoInput(''); setPromoError(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </button>
                )}
              </div>
              <button
                type="button" onClick={applyPromo} disabled={!promoInput.trim()}
                className={clsx(
                  'h-11 px-4 font-label-lg font-bold rounded-xl transition-all flex items-center justify-center shrink-0 whitespace-nowrap disabled:opacity-40',
                  promoError
                    ? 'bg-surface-container-high text-on-surface border border-outline-variant/30 shadow-sm active:scale-95'
                    : 'bg-[#F97316] hover:bg-[#ea580c] active:scale-95 text-white shadow-sm',
                )}
              >
                {promoError ? (bn ? 'পুনরায় চেষ্টা' : 'Try again') : (bn ? 'প্রয়োগ করুন' : 'Apply')}
              </button>
            </div>
            {promoError ? (
              <>
                <div className="mt-2.5 flex items-start space-x-2">
                  <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5 flex-shrink-0">info</span>
                  <p className="font-body-sm text-body-sm text-secondary font-medium leading-tight">
                    {bn ? 'এই কোডটা এখন চলছে না' : 'This code is not valid right now'}
                    <span className="font-bilingual-sub text-bilingual-sub opacity-85"> / {bn ? 'This code is not valid right now' : 'এই কোডটা এখন চলছে না'}</span>
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-outline-variant/15 flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                  <p className="leading-relaxed">
                    {bn ? 'বর্তমান চালুকৃত কোড দেখতে' : 'To see active codes,'}{' '}
                    <button type="button" onClick={() => navigate('/notifications')} className="text-primary font-label-md hover:underline">
                      {bn ? 'নোটিফিকেশন চেক করুন' : 'check notifications'}
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[11px] font-medium text-on-surface-variant/80 mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-outline">info</span>
                {bn ? 'শুধুমাত্র অপারেটর প্রকাশিত বৈধ অফার কোড প্রযোজ্য।' : 'Only valid offer codes published by the operator apply.'}
              </p>
            )}
          </section>
        )}

        {/* Bill summary (Stitch 14) */}
        <section className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col gap-2.5">
          <h2 className="text-body-lg font-body-lg font-bold text-on-surface border-b border-surface-container pb-2">
            {bn ? 'হিসাবের বিবরণী' : 'Bill Summary'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-normal">/ Bill Summary</span>
          </h2>
          <BillRows />
          <div className="mt-2 bg-surface-container-low p-2.5 rounded-xl flex items-start gap-2">
            <span className="text-base shrink-0">🛡️</span>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-relaxed">
              {bn
                ? 'বাজারে ওজনে কম-বেশি হলে ডেলিভারির সময় রসিদ দেখে বিল সমন্বয় করা হবে। আপনি চালানের মূল দামই পরিশোধ করবেন।'
                : 'If bazaar weights vary, the bill is adjusted by the receipt at delivery. You only pay the actual memo price.'}
            </p>
          </div>
        </section>

        {/* Courier transparency tag */}
        <div className="py-1 flex items-center justify-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[16px]">local_shipping</span>
          <span className="text-bilingual-sub font-bilingual-sub font-medium">Lalmonirhat Sadar • {bn ? 'দ্রুত সাইকেল ডেলিভারি' : 'Fast bicycle delivery'}</span>
        </div>
      </div>

      <ChatFab bottomClass="bottom-[190px]" />

      {/* Sticky bottom checkout bar (Stitch 14) */}
      <div className="bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-margin py-3 flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-body-md font-body-md font-bold text-on-surface">{bn ? 'সর্বমোট বিল:' : 'Grand total:'}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {bn ? `${toBnDigits(cartCount, lang)}টি আইটেম` : `${cartCount} items`}
            </span>
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary">{fmtTk(cartFinal, lang)}</span>
        </div>
        <button
          type="button" onClick={() => { setTimeSlot(fastestSlot); setStep('checkout'); window.scrollTo({ top: 0 }); }}
          className="w-full h-12 bg-primary hover:bg-[#15803D] active:scale-[0.98] text-on-primary rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <span>{bn ? 'চেকআউটে যান / Proceed to Checkout' : 'Proceed to Checkout'}</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>

      {/* Clear cart confirm */}
      <BottomSheet open={showClearSheet} onClose={() => setShowClearSheet(false)} title={bn ? 'কার্ট খালি করবেন?' : 'Clear cart?'}>
        <p className="text-body-md text-on-surface-variant px-5 pb-2">
          {bn ? 'সব পণ্য সরিয়ে ফেলা হবে।' : 'All items will be removed.'}
        </p>
        <div className="flex gap-3 px-5 pb-6">
          <button
            type="button" onClick={() => setShowClearSheet(false)}
            className="flex-1 h-12 rounded-full border border-outline-variant/60 text-on-surface font-label-lg"
          >
            {bn ? 'বাদ দিন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => { dispatch({ type: 'CLEAR_CART' }); setShowClearSheet(false); }}
            className="flex-1 h-12 rounded-full bg-error text-on-error font-label-lg"
          >
            {bn ? 'খালি করুন' : 'Clear'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

// ── Stitch 16 · Order success ─────────────────────────────────
function SuccessView({ order, paymentMethod }: { order: Order; paymentMethod: 'cod' | 'bkash' | 'nagad' }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const area = state.areas.find(a => a.id === order.deliveryAreaId);
  const rider = state.riders.find(r => r.id === order.riderId) ?? state.riders.find(r => r.status === 'active');
  const slot = SLOT_META[order.timeSlot];
  const payLabel = paymentMethod === 'bkash'
    ? (bn ? 'বিকাশ (bKash)' : 'bKash')
    : paymentMethod === 'nagad'
      ? (bn ? 'নগদ (Nagad)' : 'Nagad')
      : (bn ? 'ক্যাশ অন ডেলিভারি (Cash on Delivery)' : 'Cash on Delivery');

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm px-margin h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">pedal_bike</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight leading-none">Jovro</span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant leading-none mt-0.5">{bn ? 'লালমনিরহাট এক্সপ্রেস' : 'Lalmonirhat Express'}</span>
          </div>
        </div>
        <button
          type="button" onClick={() => navigate('/contact')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface active:scale-95 duration-150"
        >
          <span className="material-symbols-outlined text-[18px] text-tertiary">support_agent</span>
          <span className="text-label-md font-label-md font-semibold text-tertiary">{bn ? 'সহায়তা' : 'Help'}</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-lg pb-24 flex flex-col gap-space-lg">
        {/* Celebration card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-fixed/30 rounded-full blur-2xl pointer-events-none" />
          <div className="relative mb-space-md mt-space-xs">
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-125 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-md">
              <span className="material-symbols-outlined text-[36px] filled-symbol">check_circle</span>
            </div>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            {bn ? 'অর্ডার পেয়েছি!' : 'Order Received!'}
            <span className="block text-body-md font-body-md text-on-surface-variant font-normal mt-0.5">{bn ? 'Order Received!' : 'অর্ডার পেয়েছি!'}</span>
          </h1>
          <p className="mt-space-sm text-body-sm font-body-sm text-on-surface-variant leading-relaxed max-w-sm">
            {bn
              ? 'আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। গোশালা বাজার থেকে তাজা পণ্য ও রেস্টুরেন্ট থেকে খাবার সংগ্রহ করে দ্রুত পৌঁছে দেব।'
              : 'Your order has been received successfully. Fresh bazaar items and restaurant food will be collected and delivered quickly.'}
          </p>

          <div className="w-full mt-space-lg pt-space-md border-t border-surface-container-high flex flex-col gap-space-sm text-left">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">receipt</span>
                <span className="text-body-sm font-body-sm">{bn ? 'অর্ডার নম্বর' : 'Order ID'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant/70">/ Order ID</span></span>
              </div>
              <span className="text-label-md font-label-md font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">#{order.id}</span>
            </div>
            <div className="flex items-start justify-between py-1 border-t border-surface-container-low gap-2">
              <div className="flex items-center gap-1.5 text-on-surface-variant pt-0.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
                <span className="text-body-sm font-body-sm">{bn ? 'ডেলিভারি স্লট' : 'Delivery Slot'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant/70">/ Slot</span></span>
              </div>
              <div className="text-right">
                <div className="text-label-md font-label-md text-on-surface font-semibold">{bn ? `আজ ${slot.rangeBn}` : `Today ${slot.rangeEn}`}</div>
                <div className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? `Today ${slot.rangeEn}` : `আজ ${slot.rangeBn}`}</div>
              </div>
            </div>
            <div className="flex items-start justify-between py-1 border-t border-surface-container-low gap-2">
              <div className="flex items-center gap-1.5 text-on-surface-variant pt-0.5">
                <span className="material-symbols-outlined text-[18px] text-primary">pin_drop</span>
                <span className="text-body-sm font-body-sm">{bn ? 'ডেলিভারি এলাকা' : 'Delivery Area'} <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant/70">/ Area</span></span>
              </div>
              <div className="text-right">
                <div className="text-label-md font-label-md text-on-surface font-semibold">{area ? (bn ? area.nameBn : area.nameEn) : '—'}</div>
                <div className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-dashed border-outline-variant/60 mt-1 bg-surface-container-low/50 px-2.5 rounded-lg gap-2">
              <div>
                <div className="text-body-sm font-body-sm font-semibold text-on-surface">{bn ? 'আনুমানিক বিল' : 'Est. Total'} <span className="text-bilingual-sub font-bilingual-sub font-normal text-on-surface-variant">/ Est. Total</span></div>
                <div className="text-bilingual-sub font-bilingual-sub text-secondary font-medium">{payLabel}</div>
              </div>
              <span className="text-headline-sm font-headline-sm font-bold text-primary">{fmtTk(order.finalTotal, lang)}</span>
            </div>
          </div>
        </section>

        {/* Trust reminder pill */}
        <section className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/20 flex items-start gap-space-sm">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed/50 flex-shrink-0 flex items-center justify-center text-secondary mt-0.5">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface leading-snug">
            {bn
              ? 'সাইকেল ডেলিভারিম্যান নির্ধারিত স্লটের মধ্যে আপনার দরজায় পৌঁছে যাবে। বাজারের আসল রসিদ পণ্যের সাথে দেখতে পাবেন।'
              : 'The bicycle courier will reach your door within the chosen slot. You will see the original bazaar receipt with the items.'}
          </p>
        </section>

        {/* Courier assigned card */}
        {rider && (
          <section className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/30 shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{bn ? 'ব্যক্তিগত কুরিয়ার নিয়োজিত' : 'Personal courier assigned'}</span>
              <span className="inline-flex items-center gap-1 text-bilingual-sub font-bilingual-sub text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> {bn ? 'লাইভ আপডেট' : 'Live updates'}
              </span>
            </div>
            <div className="flex items-center gap-space-md pt-1">
              <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                <span className="text-headline-md font-headline-md font-bold text-primary">{(bn ? rider.nameBn : rider.name).charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-label-lg font-label-lg text-on-surface truncate">
                  {bn ? rider.nameBn : rider.name}
                  <span className="text-body-sm font-body-sm text-on-surface-variant font-normal block">
                    ({rider.vehicleType === 'motorbike' ? (bn ? 'মোটরবাইক কুরিয়ার' : 'Motorbike courier') : (bn ? 'সাইকেল কুরিয়ার' : 'Bicycle courier')})
                  </span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center text-bilingual-sub font-bilingual-sub font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-[#F97316] mr-0.5 filled-symbol">star</span>
                    {toBnDigits(rider.rating.toFixed(1), lang)}
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">directions_bike</span>
              <span className="text-body-sm font-body-sm">{bn ? 'অর্ডার প্রস্তুত হলে সাইকেল নিয়ে রওনা দেবেন' : 'Will set off once the order is ready'}</span>
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-col gap-space-sm pt-space-xs">
          <button
            type="button" onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full h-12 rounded-full bg-primary hover:bg-[#15803D] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-on-primary font-label-lg text-label-lg shadow-sm"
          >
            <span>{bn ? 'অর্ডার ট্র্যাক করুন / Track my order' : 'Track my order'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button
            type="button" onClick={() => navigate('/')}
            className="w-full h-12 rounded-full border-[1.5px] border-primary text-primary hover:bg-primary-fixed/20 active:scale-95 transition-all duration-150 flex items-center justify-center font-label-lg text-label-lg bg-surface-container-lowest"
          >
            <span>{bn ? 'হোম পেজে ফিরে যান / Back to Home' : 'Back to Home'}</span>
          </button>
        </section>
      </div>

      <ChatFab bottomClass="bottom-6" />
    </div>
  );
}
