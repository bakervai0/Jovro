import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { OrderCard } from '../../components/shared/OrderCard';
import { QuantityStepper } from '../../components/shared/ProductCard';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import { FooterBlock } from '../../components/shared/FooterBlock';
import { CATEGORY_INFO } from '../../data/products';
import { CATEGORY_IMAGES, HOME_ASSETS, PRODUCT_IMAGES, RESTAURANT_IMAGES } from '../../data/images';
import { fmtTk, toBnDigits } from '../../services/orderUtils';
import type { CartItem, CartItemSource, Product, Restaurant } from '../../types';

// ── Service windows (06:00–13:30 + 16:30–22:30) ───────────────
const SERVICE_WINDOWS = [
  { start: 6 * 60, end: 13 * 60 + 30 },
  { start: 16 * 60 + 30, end: 22 * 60 + 30 },
];

function atMinutes(base: Date, mins: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(mins);
  return d;
}

/** Flash-sale countdown target: end of the current service
 * window, or the next window's start when outside windows. */
function flashTarget(now: Date): Date {
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const w of SERVICE_WINDOWS) {
    if (mins < w.start) return atMinutes(now, w.start);
    if (mins < w.end) return atMinutes(now, w.end);
  }
  const t = atMinutes(now, SERVICE_WINDOWS[0].start);
  t.setDate(t.getDate() + 1);
  return t;
}

/** "Next delivery slot" label for the header strip. */
function nextSlotLabel(now: Date): { bn: string; en: string } {
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < SERVICE_WINDOWS[1].start) {
    return { bn: 'আজ সকাল ৬:০০–দুপুর ১:৩০', en: 'Today 6:00 AM–1:30 PM' };
  }
  if (mins < SERVICE_WINDOWS[1].end) {
    return { bn: 'আজ বিকেল ৪:৩০–রাত ১০:৩০', en: 'Today 4:30–10:30 PM' };
  }
  return { bn: 'আগামীকাল সকাল ৬:০০–দুপুর ১:৩০', en: 'Tomorrow 6:00 AM–1:30 PM' };
}

function useNow(stepMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}

// ── 1. Header (Stitch 8: location pill · wordmark · language) ──
function HomeHeader() {
  const { state, dispatch, currentArea } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const now = useNow(30000);
  const slot = nextSlotLabel(now);

  const areaName = currentArea
    ? (bn ? currentArea.nameBn : currentArea.nameEn)
    : (bn ? 'গোশালা বাজার' : 'Goshala Bazar');
  const areaSub = currentArea
    ? (bn ? `${currentArea.nameEn}, Sadar` : 'লালমনিরহাট সদর')
    : (bn ? 'Goshala Bazar, Sadar' : 'লালমনিরহাট সদর');

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-margin h-14">
        {/* Location selector chip */}
        <button
          onClick={() => navigate('/area')}
          className="flex items-center space-x-1.5 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40 active:scale-95 transition-all text-left"
          type="button"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
          <div className="flex flex-col">
            <span className="text-label-md font-label-md text-on-surface flex items-center leading-tight">
              {areaName}
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant ml-0.5">arrow_drop_down</span>
            </span>
            <span className="text-[10px] text-on-surface-variant font-bilingual-sub -mt-0.5">{areaSub}</span>
          </div>
        </button>
        {/* Brand wordmark */}
        <div className="flex items-center space-x-1">
          <span className="text-headline-md font-headline-md font-bold text-primary tracking-tight">Jovro</span>
        </div>
        {/* Language toggle */}
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/30 text-label-md font-label-md text-primary hover:bg-surface-container-high transition-colors active:scale-95"
          type="button"
        >
          <span className={bn ? 'font-bold' : 'opacity-60'}>বাংলা</span>
          {' | '}
          <span className={!bn ? 'font-bold' : 'opacity-60'}>EN</span>
        </button>
      </div>
      {/* Delivery slot sub-bar */}
      <div className="bg-primary/5 px-margin py-2 border-t border-primary/10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
          <span className="text-label-md font-label-md text-primary font-medium tracking-tight">
            {bn ? slot.bn : slot.en}
            <span className="text-on-surface-variant text-[11px] font-normal font-bilingual-sub"> / {bn ? slot.en : slot.bn}</span>
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <span className="material-symbols-outlined text-[14px]">directions_bike</span>
          <span>{bn ? 'এক্সপ্রেস সাইকেল' : 'Express Cycle'}</span>
        </div>
      </div>
    </header>
  );
}

// ── Service Closed / Slot Full Banner (Stitch g3, part 1) ─────
function ServiceBanner({ type }: { type: 'closed' | 'slot_full' }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const isClosed = type === 'closed';
  return (
    <div className="mx-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 relative overflow-hidden">
      <div className={clsx(
        'absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r',
        isClosed ? 'from-secondary-container via-[#F97316] to-secondary' : 'from-tertiary-container via-tertiary to-tertiary-container',
      )} />
      <div className="flex flex-col items-center text-center mt-1">
        <div className={clsx(
          'w-14 h-14 rounded-full border flex items-center justify-center mb-3',
          isClosed ? 'bg-[#FFF7ED] border-[#F97316]/20 text-secondary' : 'bg-tertiary/10 border-tertiary/20 text-tertiary',
        )}>
          <span className="material-symbols-outlined text-3xl">{isClosed ? 'schedule' : 'event_busy'}</span>
        </div>
        <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold mb-0.5">
          {isClosed
            ? (bn ? 'এখন সার্ভিস বন্ধ আছে' : 'Service is closed right now')
            : (bn ? 'আজকের সব স্লট পূর্ণ হয়ে গেছে' : 'All of today\u2019s slots are full')}
        </h2>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mb-2">
          {isClosed ? 'We are closed right now' : 'Today\u2019s slots are full'}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full mb-2.5">
          <span className="material-symbols-outlined text-primary text-base">alarm_on</span>
          <p className="text-body-sm font-body-sm text-on-surface font-semibold">
            {isClosed ? (
              <>{bn ? 'আবার খুলবে: ' : 'Opens again: '}<span className="text-primary font-bold">{bn ? 'আগামীকাল সকাল ৬:০০ টা' : 'tomorrow at 6:00 AM'}</span></>
            ) : (
              <>{bn ? 'কাল সকালের স্লটে আবার চেষ্টা করুন' : 'Try again in tomorrow morning\u2019s slot'}</>
            )}
          </p>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-3.5 py-2 rounded-xl mb-4 leading-relaxed">
          {isClosed
            ? (bn
              ? '"আমাদের রাইডার ও পার্সোনাল শপারগণ এখন বিশ্রামে আছেন। আপনার পছন্দের বাজার বা খাবারের জন্য নির্বিঘ্নে অগ্রিম অর্ডার দিয়ে রাখুন।"'
              : '"Our riders and personal shoppers are resting now. Feel free to place an advance order for your favourite bazaar items or food."')
            : (bn
              ? '"আজকের প্রতিটি স্লটের সব রাইডার বুকড হয়ে গেছেন। কালকের স্লটের জন্য এখনই আগাম অর্ডার দিয়ে রাখতে পারেন।"'
              : '"Every rider for today\u2019s slots is booked. You can place an advance order for tomorrow\u2019s slot right now."')}
        </p>
        <button
          onClick={() => navigate('/bazaar')}
          className="w-full h-12 rounded-full bg-primary active:scale-95 duration-150 text-white font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-lg">event_note</span>
          <span>{bn ? 'পরের স্লটের জন্য আগাম অর্ডার করুন' : 'Pre-order for the next slot'}</span>
        </button>
        <span className="text-bilingual-sub font-bilingual-sub text-outline mt-1.5">
          Pre-order for next slot
        </span>
      </div>
    </div>
  );
}

// ── 2. Search Bar (Stitch 8) ────────────────────────────────────
function SearchBar() {
  const navigate = useNavigate();
  return (
    <section className="px-margin">
      <div
        className="relative flex items-center w-full cursor-pointer"
        onClick={() => navigate('/bazaar')}
      >
        <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[22px] pointer-events-none">search</span>
        <input
          className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/70 placeholder:text-body-sm focus:outline-none card-shadow pointer-events-none"
          placeholder="কী খুঁজছেন? / Search rice, egg, biryani…"
          type="text"
          readOnly
          tabIndex={-1}
        />
        <span className="absolute right-2 p-1.5 text-primary rounded-lg pointer-events-none" aria-label="Voice Search">
          <span className="material-symbols-outlined text-[20px]">mic</span>
        </span>
      </div>
    </section>
  );
}

// ── 3. Hero Banner Slider (Stitch 8 + micro-interactions) ──────
interface Slide {
  chipBn: string; chipEn: string;
  headBn: string; headEn: string;
  subBn: string; subEn: string;
  shortBn: string; shortEn: string;
  img?: string; fallbackEmoji: string;
  grad: string; coupon?: boolean;
}

function HeroSlider() {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';

  const slides: Slide[] = [
    {
      chipBn: 'লালমনিরহাট সদর অফার', chipEn: 'Lalmonirhat Sadar Offer',
      headBn: 'প্রথম অর্ডারে ডেলিভারি ফ্রি!', headEn: 'Free Delivery on Your First Order!',
      subBn: 'আপনার প্রথম বাজার ও খাবারের অর্ডারে ডেলিভারি ফ্রি',
      subEn: 'Free delivery on your first grocery & food order',
      shortBn: 'ডেলিভারি ফ্রি', shortEn: 'Free Delivery',
      img: HOME_ASSETS.hero, fallbackEmoji: '🚲',
      grad: 'from-primary to-primary-container', coupon: true,
    },
    {
      chipBn: 'রেস্টুরেন্ট কম্বো', chipEn: 'Restaurant Combo',
      headBn: 'গরম গরম বিরিয়ানি কম্বো!', headEn: 'Hot Biryani Combos!',
      subBn: 'সদরের সেরা রেস্টুরেন্টের কম্বো অফার',
      subEn: 'Combo deals from Sadar\u2019s top restaurants',
      shortBn: 'রেস্টুরেন্ট কম্বো', shortEn: 'Restaurant Combo',
      img: HOME_ASSETS.banner2, fallbackEmoji: '🍛',
      grad: 'from-secondary-container to-secondary',
    },
    {
      chipBn: 'শুক্রবারের বাজার', chipEn: 'Friday Bazaar',
      headBn: 'তাজা বাজার, সৎ দামে!', headEn: 'Fresh Bazaar, Honest Prices!',
      subBn: 'প্রতিদিন সকালে তাজা শাকসবজি ও মাছ',
      subEn: 'Fresh vegetables & fish every morning',
      shortBn: 'শুক্রবারের বাজার', shortEn: 'Friday Bazaar',
      img: HOME_ASSETS.banner3, fallbackEmoji: '🥬',
      grad: 'from-primary-container to-surface-tint',
    },
  ];

  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const touchX = useRef<number | null>(null);

  // Auto-advance every 4s (paused while the user is touching)
  useEffect(() => {
    if (held) return;
    const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, index]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    setHeld(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    setHeld(false);
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx <= -40) setIndex(i => (i + 1) % slides.length);
    else if (dx >= 40) setIndex(i => (i - 1 + slides.length) % slides.length);
  };

  return (
    <section className="px-margin flex flex-col space-y-2">
      <div
        className="relative overflow-hidden rounded-2xl shadow-sm"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map(slide => (
            <div
              key={slide.headEn}
              className={`min-w-full relative overflow-hidden bg-gradient-to-r ${slide.grad} text-white p-4`}
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="max-w-[62%] flex flex-col space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold tracking-wide w-fit backdrop-blur-sm">
                    {bn ? slide.chipBn : slide.chipEn}
                  </span>
                  <h2 className="text-headline-sm font-headline-sm font-bold leading-tight">
                    {bn ? slide.headBn : slide.headEn}
                  </h2>
                  <p className="text-bilingual-sub font-bilingual-sub text-white/90">
                    {bn ? slide.subEn : slide.subBn}
                  </p>
                  {slide.coupon && (
                    <div className="pt-1.5 flex items-center space-x-2">
                      <span className="border border-dashed border-white/60 bg-white/10 px-2.5 py-0.5 rounded-lg text-label-sm font-mono tracking-wider font-bold">
                        JOVROFREE
                      </span>
                      <span className="text-[10px] text-white/80">{bn ? 'কুপন কোড' : 'Coupon code'}</span>
                    </div>
                  )}
                </div>
                {/* Banner visual — photo, emoji tile as fallback */}
                <div className="w-24 h-24 relative rounded-xl overflow-hidden shadow-inner border border-white/20 flex-shrink-0 bg-white/15 flex items-center justify-center">
                  {slide.img
                    ? <img src={slide.img} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[44px]">{slide.fallbackEmoji}</span>}
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
      {/* Dot indicators & mini badges for the other slides */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5">
          {slides.map((s, i) => (
            <button
              key={s.headEn}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={clsx(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant',
              )}
            />
          ))}
        </div>
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {slides.map((s, i) => i !== index && (
            <button
              key={s.headEn}
              onClick={() => setIndex(i)}
              className="text-[10px] font-medium bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant flex items-center space-x-1 whitespace-nowrap"
            >
              <span>({toBnDigits(i + 1, lang)}) {bn ? s.shortBn : s.shortEn}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Active Order (functional extra, under the hero slider) ─────
function ActiveOrderBanner() {
  const { state } = useApp();
  const active = state.orders.find(o => ['pending', 'confirmed', 'buying', 'on-the-way'].includes(o.status));
  if (!active) return null;
  return (
    <div className="px-margin">
      <OrderCard order={active} compact />
    </div>
  );
}

// ── 4. Two Main Entry Cards (Stitch 8) ─────────────────────────
function EntryCards() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const cards = [
    {
      label: 'গোশালা বাজার থেকে তাজা', labelClass: 'bg-primary/10 text-primary',
      titleBn: 'কাঁচাবাজার', titleEn: 'Bazaar Grocery', sub: 'Bazaar Grocery',
      img: HOME_ASSETS.cardBazaar, fallbackEmoji: '🥬',
      arrowClass: 'bg-primary', hoverClass: 'hover:border-primary/50',
      onClick: () => navigate('/bazaar'),
    },
    {
      label: 'স্থানীয় সেরা রেস্তোরাঁ', labelClass: 'bg-secondary-container/10 text-secondary',
      titleBn: 'রেস্টুরেন্টের খাবার', titleEn: 'Restaurant Food', sub: 'Restaurant Food',
      img: HOME_ASSETS.cardRestaurant, fallbackEmoji: '🍛',
      arrowClass: 'bg-secondary-container', hoverClass: 'hover:border-secondary-container/50',
      onClick: () => navigate('/food'),
    },
  ];

  return (
    <section className="px-margin">
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <div
            key={c.titleEn}
            onClick={c.onClick}
            className={`bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/30 card-shadow flex flex-col justify-between relative overflow-hidden group ${c.hoverClass} transition-all cursor-pointer`}
          >
            <div>
              <span className={`inline-block px-1.5 py-0.5 ${c.labelClass} text-[10px] font-semibold rounded mb-1.5`}>
                {c.label}
              </span>
              <h3 className="text-body-lg font-headline-sm font-bold text-on-surface leading-tight">
                {bn ? c.titleBn : c.titleEn}
              </h3>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant -mt-0.5">
                {bn ? c.sub : c.titleBn}
              </p>
            </div>
            <div className="mt-3 relative h-20 w-full rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center">
              {c.img
                ? <img src={c.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <span className="text-[40px]">{c.fallbackEmoji}</span>}
              <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full ${c.arrowClass} text-white flex items-center justify-center shadow-md`}>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 5. Category Rail (Stitch 8) ────────────────────────────────
function CategoryRail() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <section className="flex flex-col space-y-2 pt-1">
      <div className="px-margin flex justify-between items-center">
        <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
          {bn ? 'ক্যাটেগরি ব্রাউজ করুন' : 'Browse Categories'}
        </h3>
        <button onClick={() => navigate('/bazaar')} className="text-label-md font-label-md text-primary">
          {bn ? 'সব দেখুন' : 'See All'}
        </button>
      </div>
      <div className="flex space-x-3 overflow-x-auto no-scrollbar px-margin py-1">
        {Object.entries(CATEGORY_INFO).map(([slug, info]) => (
          <button
            key={slug}
            onClick={() => navigate(`/bazaar?category=${slug}`)}
            className="flex flex-col items-center space-y-1.5 flex-shrink-0 w-16 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center card-shadow overflow-hidden active:scale-90 transition-all">
              {CATEGORY_IMAGES[slug]
                ? <img src={CATEGORY_IMAGES[slug]} alt="" className="w-full h-full object-cover" />
                : <span className="text-[26px]">{info.emoji}</span>}
            </div>
            <div className="text-center">
              <p className="text-label-md font-label-md text-on-surface leading-tight">
                {bn ? info.nameBn : info.nameEn}
              </p>
              <p className="text-[9px] text-on-surface-variant font-bilingual-sub">
                {bn ? info.nameEn : info.nameBn}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Shared add/stepper wiring (mirrors ProductCard) ────────────
function useCartActions(product: Product, price: number) {
  const { state, dispatch } = useApp();
  const cartItem = state.cart.find(i => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const addToCart = () => {
    const item: CartItem = {
      id: product.id,
      productId: product.id,
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      quantity: 1,
      price,
      unit: product.unit,
      source: 'bazaar' as CartItemSource,
      isApproxPrice: true,
    };
    dispatch({ type: 'ADD_TO_CART', item });
  };
  const updateQty = (delta: number) => {
    const newQty = qty + delta;
    if (newQty <= 0) dispatch({ type: 'REMOVE_FROM_CART', id: product.id });
    else dispatch({ type: 'UPDATE_CART_QTY', id: product.id, qty: newQty });
  };
  return { qty, addToCart, updateQty };
}

// ── 6. Flash Sale (Stitch 8) ───────────────────────────────────
const FLASH_ITEMS: { id: string; off: number }[] = [
  { id: 'p-09', off: 14 },
  { id: 'p-07', off: 9 },
  { id: 'p-25', off: 8 },
];

function FlashCountdown() {
  const { state } = useApp();
  const lang = state.lang;
  const now = useNow(1000);
  const diff = Math.max(0, flashTarget(now).getTime() - now.getTime());
  const totalSec = Math.floor(diff / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return (
    <div className="flex items-center space-x-1 bg-secondary-container/10 border border-secondary-container/30 px-2 py-1 rounded-full text-secondary font-mono text-[11px] font-bold">
      <span className="material-symbols-outlined text-[14px]">timer</span>
      <span>{toBnDigits(`${hh}:${mm}:${ss}`, lang)}</span>
    </div>
  );
}

function FlashCard({ product, off }: { product: Product; off: number }) {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const flashPrice = Math.round(product.approxPrice * (1 - off / 100));
  const { qty, addToCart, updateQty } = useCartActions(product, flashPrice);

  const name = bn ? product.nameBn : product.nameEn;
  const unitSub = bn
    ? `১ ${product.unit}${product.unitEn.length <= 3 ? ` (1${product.unitEn})` : ''}`
    : (product.unitEn.length <= 3 ? `1${product.unitEn}` : product.unitEn);

  return (
    <div className="w-36 flex-shrink-0 bg-surface rounded-xl p-2 border border-outline-variant/30 card-shadow flex flex-col justify-between">
      <div>
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-surface-container-high mb-2 flex items-center justify-center">
          <span className="absolute top-1 left-1 z-10 bg-secondary-container text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            -{toBnDigits(off, lang)}%
          </span>
          {PRODUCT_IMAGES[product.id]
            ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="w-full h-full object-cover" loading="lazy" />
            : <span className="text-[44px]">{product.imageEmoji}</span>}
        </div>
        <h4 className="text-body-sm font-semibold text-on-surface line-clamp-1">{name}</h4>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{unitSub}</p>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-headline-sm font-bold text-secondary-container">{fmtTk(flashPrice, lang)}</span>
          <span className="text-body-sm text-outline line-through text-[11px]">{fmtTk(product.approxPrice, lang)}</span>
        </div>
      </div>
      {!product.isAvailable ? (
        <span className="mt-2 w-full h-8 flex items-center justify-center text-label-md text-on-surface-variant">
          {bn ? 'পাওয়া যাচ্ছে না' : 'Unavailable'}
        </span>
      ) : qty > 0 ? (
        <div className="mt-2 flex justify-center">
          <QuantityStepper qty={qty} onIncrease={() => updateQty(1)} onDecrease={() => updateQty(-1)} compact />
        </div>
      ) : (
        <button
          onClick={addToCart}
          className="mt-2 w-full h-8 bg-surface-container-lowest border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-label-md font-medium transition-colors flex items-center justify-center space-x-1"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{bn ? 'যোগ করুন' : 'Add'}</span>
        </button>
      )}
    </div>
  );
}

function FlashSale() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const items = FLASH_ITEMS
    .map(f => ({ product: state.products.find(p => p.id === f.id), off: f.off }))
    .filter((x): x is { product: Product; off: number } => !!x.product);
  if (!items.length) return null;

  return (
    <section className="bg-surface-container-lowest py-3.5 border-y border-outline-variant/20 flex flex-col space-y-3">
      <div className="px-margin flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-secondary-container/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">bolt</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
              {bn ? 'ফ্ল্যাশ সেল' : 'Flash Sale'}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-bilingual-sub">
              {bn ? 'Flash Sale Deals' : 'ফ্ল্যাশ সেল অফার'}
            </p>
          </div>
        </div>
        <FlashCountdown />
      </div>
      <div className="flex space-x-3 overflow-x-auto no-scrollbar px-margin">
        {items.map(({ product, off }) => (
          <FlashCard key={product.id} product={product} off={off} />
        ))}
      </div>
    </section>
  );
}

// ── 7. Nearby Restaurants Rail (Stitch 8) ──────────────────────
function RestaurantRailCard({ restaurant }: { restaurant: Restaurant }) {
  const { state, cartDeliveryFee } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const img = RESTAURANT_IMAGES[restaurant.id];

  return (
    <button
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className="w-64 flex-shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 card-shadow overflow-hidden flex flex-col text-left"
      type="button"
    >
      <div className="h-28 w-full relative bg-surface-container-high flex items-center justify-center">
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <span className="text-[52px]">{restaurant.imageEmoji}</span>}
        {restaurant.isOpen ? (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{bn ? 'খোলা আছে' : 'Open'}</span>
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-inverse-surface/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
            {bn ? 'বন্ধ আছে' : 'Closed'}
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-surface-container-lowest/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-on-surface text-[11px] font-bold flex items-center shadow">
          <span className="material-symbols-outlined text-secondary-container text-[14px] mr-0.5 filled-symbol">star</span>
          {toBnDigits(restaurant.rating.toFixed(1), lang)}
        </div>
      </div>
      <div className="p-3 w-full">
        <h4 className="text-body-lg font-bold text-on-surface leading-tight">
          {bn ? restaurant.nameBn : restaurant.nameEn}
        </h4>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
          {bn ? restaurant.nameEn : restaurant.nameBn} · {restaurant.address.split(',')[0]}
        </p>
        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex flex-col space-y-1 text-[11px] text-on-surface-variant">
          <div className="flex items-center space-x-2">
            <span className="text-secondary font-medium">
              {bn ? 'ডেলিভারি' : 'Delivery'} {fmtTk(cartDeliveryFee, lang)}
            </span>
            <span>•</span>
            <span>{bn ? 'সর্বনিম্ন অর্ডার' : 'Min order'} {fmtTk(restaurant.minOrder, lang)}</span>
          </div>
          <div className="text-primary font-medium flex items-center space-x-1">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            <span>
              {restaurant.isOpen
                ? (bn ? `খোলা আছে • ${toBnDigits(restaurant.deliveryTimeMin, lang)} মিনিটে ডেলিভারি` : `Open • ${restaurant.deliveryTimeMin} min delivery`)
                : (bn ? 'বন্ধ আছে' : 'Closed')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RestaurantsRail() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const restaurants = [...state.restaurants].sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
  if (!restaurants.length) return null;

  return (
    <section className="px-margin flex flex-col space-y-2.5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
            {bn ? 'আশেপাশের রেস্টুরেন্ট' : 'Top Restaurants'}
          </h3>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            {bn ? 'Top Restaurants Near You in Sadar' : 'আশেপাশের সেরা রেস্টুরেন্ট'}
          </p>
        </div>
        <button onClick={() => navigate('/food')} className="text-label-md font-label-md text-primary">
          {bn ? 'সবগুলো' : 'See All'}
        </button>
      </div>
      <div className="flex space-x-3 overflow-x-auto no-scrollbar py-1">
        {restaurants.map(r => (
          <RestaurantRailCard key={r.id} restaurant={r} />
        ))}
      </div>
    </section>
  );
}

// ── 8. Free-Text Request Box (Stitch 8) ────────────────────────
function FreeTextCard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <section className="px-margin">
      <div className="bg-[#FFF7ED] border-[1.5px] border-[#FDBA74] rounded-2xl p-3.5 shadow-sm flex flex-col space-y-2.5">
        <div className="flex items-start space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
          </div>
          <div>
            <h3 className="text-body-md font-bold text-[#9A3412] leading-tight">
              {bn ? 'যা খুঁজে পাচ্ছেন না, লিখে দিন — বাজার থেকে কিনে এনে দেব' : 'Can\u2019t find it? Type it — we will buy it from the local bazaar'}
            </h3>
            <p className="text-bilingual-sub font-bilingual-sub text-[#C2410C]/80 mt-0.5">
              {bn ? 'Can\u2019t find it? Type anything — we will buy it from local bazaar' : 'যা খুঁজে পাচ্ছেন না, লিখে দিন'}
            </p>
          </div>
        </div>
        <div className="relative flex items-center w-full" onClick={() => navigate('/ai')}>
          <input
            className="w-full h-11 pl-3 pr-20 bg-white rounded-xl border border-[#FDBA74] text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none pointer-events-none"
            placeholder="যেমন: ৫ কেজি মিনিকেট চাল, ১ কেজি দেশি আলু, ২টা পান..."
            type="text"
            readOnly
            tabIndex={-1}
          />
          <button
            className="absolute right-1.5 h-8 px-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-label-md font-medium rounded-lg flex items-center space-x-1 transition-colors"
            type="button"
            onClick={() => navigate('/ai')}
          >
            <span>{bn ? 'পাঠান' : 'Send'}</span>
            <span className="material-symbols-outlined text-[14px]">send</span>
          </button>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-[#9A3412]/90 pt-0.5">
          <span className="material-symbols-outlined text-[16px] text-[#EA580C]">verified</span>
          <span>{bn ? 'পণ্যের গায়ে কোনো বাড়তি দাম নেই, শুধুমাত্র ডেলিভারি ফি প্রযোজ্য।' : 'No markup on product prices — only the delivery fee applies.'}</span>
        </div>
      </div>
    </section>
  );
}

// ── 9. Buy Again Rail (Stitch 8) ───────────────────────────────
function BuyAgainCard({ product }: { product: Product }) {
  const { state } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const { qty, addToCart, updateQty } = useCartActions(product, product.approxPrice);
  const name = bn ? product.nameBn : product.nameEn;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-2 border border-outline-variant/30 card-shadow flex flex-col justify-between">
      <div>
        <div className="w-full h-16 rounded-lg overflow-hidden bg-surface-container-low mb-1.5 flex items-center justify-center">
          {PRODUCT_IMAGES[product.id]
            ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="w-full h-full object-cover" loading="lazy" />
            : <span className="text-[32px]">{product.imageEmoji}</span>}
        </div>
        <h5 className="text-body-sm font-semibold text-on-surface truncate">{name}</h5>
        <span className="text-label-md font-bold text-primary">
          {fmtTk(product.approxPrice, lang)}
          <span className="text-[10px] font-normal text-on-surface-variant">/{bn ? product.unit : product.unitEn}</span>
        </span>
      </div>
      {!product.isAvailable ? (
        <span className="mt-2 w-full h-7 flex items-center justify-center text-[11px] text-on-surface-variant">
          {bn ? 'পাওয়া যাচ্ছে না' : 'Unavailable'}
        </span>
      ) : qty > 0 ? (
        <div className="mt-2 flex justify-center">
          <QuantityStepper qty={qty} onIncrease={() => updateQty(1)} onDecrease={() => updateQty(-1)} compact />
        </div>
      ) : (
        <button
          onClick={addToCart}
          className="mt-2 w-full h-7 bg-primary/10 hover:bg-primary hover:text-white text-primary text-[11px] font-semibold rounded flex items-center justify-center space-x-0.5 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[13px]">add</span>
          <span>{bn ? 'যোগ' : 'Add'}</span>
        </button>
      )}
    </div>
  );
}

function BuyAgainRail() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  // Most recent order of the signed-in customer (orders are kept
  // newest-first); fall back to the 'popular' tagged products.
  const myOrders = state.orders.filter(o => o.customerId === state.user?.id);
  let items: Product[] = [];
  const last = myOrders[0];
  if (last) {
    const seen = new Set<string>();
    for (const it of last.items.filter(i => i.source === 'bazaar')) {
      const p = state.products.find(pr => pr.nameEn === it.nameEn || pr.nameBn === it.nameBn);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        items.push(p);
      }
    }
  }
  if (!items.length) {
    items = state.products.filter(p => p.tags?.includes('popular') && p.isAvailable);
  }
  items = items.slice(0, 6);
  if (!items.length) return null;

  return (
    <section className="px-margin flex flex-col space-y-2.5 pt-1">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
            {bn ? 'আবার অর্ডার করুন' : 'Buy Again'}
          </h3>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            {bn ? 'Buy Again From Previous Orders' : 'আবার অর্ডার করুন'}
          </p>
        </div>
        <button onClick={() => navigate('/orders')} className="text-label-md font-label-md text-primary">
          {bn ? 'ইতিহাস' : 'History'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map(p => (
          <BuyAgainCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// ── 10. Floating Cart Pill + Chat Button (Stitch 8) ────────────
function FloatingElements() {
  const { state, cartCount, cartTotal } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  return (
    <>
      {/* Floating chat button → AI assistant */}
      <div
        className={clsx(
          'fixed left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none',
          cartCount > 0 ? 'bottom-[136px]' : 'bottom-[76px]',
        )}
      >
        <div className="flex justify-end px-4">
          <button
            onClick={() => navigate('/ai')}
            aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
            className="pointer-events-auto relative w-[52px] h-[52px] bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-white"
            type="button"
          >
            <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary-container rounded-full border-2 border-white" />
          </button>
        </div>
      </div>

      {/* Persistent floating cart pill */}
      {cartCount > 0 && (
        <div className="fixed bottom-[74px] left-1/2 -translate-x-1/2 w-full max-w-app px-4 z-40 pointer-events-none">
          <button
            onClick={() => navigate('/cart')}
            className="pointer-events-auto w-full bg-primary text-white rounded-full px-4 py-2.5 shadow-lg flex items-center justify-between active:scale-[0.98] transition-transform border border-white/20"
            type="button"
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-body-md font-bold">
                  {bn ? `${toBnDigits(cartCount, lang)}টি আইটেম` : `${cartCount} items`}
                </span>
                <span className="text-white/70">•</span>
                <span className="text-headline-sm font-bold">{fmtTk(cartTotal, lang)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-label-md font-bold pl-2 border-l border-white/30">
              <span>{bn ? 'কার্ট দেখুন' : 'View Cart'}</span>
              <span className="text-[10px] font-bilingual-sub text-white/80">{bn ? 'View Cart' : 'কার্ট দেখুন'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>
        </div>
      )}
    </>
  );
}

// ── Main HomeScreen (Stitch 8 composition) ─────────────────────
export default function HomeScreen() {
  const { state } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-y-auto no-scrollbar relative">
      <HomeHeader />

      <main className="flex-1 flex flex-col space-y-4 pt-3 pb-36">
        {/* Service state (closed / slot full) — existing behaviour */}
        {!state.isServiceOpen && <ServiceBanner type="closed" />}
        {state.isServiceOpen && state.isSlotFull && <ServiceBanner type="slot_full" />}

        {/* 2 · Search */}
        <SearchBar />

        {/* 3 · Hero banner slider */}
        <HeroSlider />

        {/* Active order tracking (functional extra) */}
        <ActiveOrderBanner />

        {/* 4 · Entry cards */}
        <EntryCards />

        {/* 5 · Categories */}
        <CategoryRail />

        {/* 6 · Flash sale */}
        <FlashSale />

        {/* 7 · Restaurants */}
        <RestaurantsRail />

        {/* 8 · Free-text request */}
        <FreeTextCard />

        {/* 9 · Buy again */}
        <BuyAgainRail />

        {/* Earn Money (e1.2) + Footer (f1.1) */}
        <EarnMoneyCard />
        <FooterBlock />
      </main>

      <FloatingElements />
    </div>
  );
}
