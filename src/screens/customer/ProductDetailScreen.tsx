import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { CATEGORY_INFO } from '../../data/products';
import { PRODUCT_IMAGES } from '../../data/images';
import { fmtTk, toBnDigits } from '../../services/orderUtils';
import type { CartItem, Product } from '../../types';

// ── Stitch 11 + 11b · Product Detail ──────────────────────────
// Hero photo with origin chips, receipt-price card, pack-size
// selector (weight/volume products), quantity + shopper note,
// embedded AI suggestions card (11b), quality-transparency card,
// "goes well with" carousel and the sticky add-to-cart bar.

const HUBS: Record<string, { bn: string; en: string }> = {
  'rice-pulses': { bn: 'চালের আড়ত', en: 'Goshala Bazar Hub' },
  'oil-spices': { bn: 'তেল-মসলার দোকান', en: 'Goshala Bazar Hub' },
  vegetables: { bn: 'সবজি বাজার', en: 'Goshala Bazar Hub' },
  'fish-meat': { bn: 'মাছ-মাংসের বাজার', en: 'Goshala Bazar Hub' },
  'milk-eggs': { bn: 'দুধ-ডিমের দোকান', en: 'Goshala Bazar Hub' },
  snacks: { bn: 'নাস্তার দোকান', en: 'Goshala Bazar Hub' },
};

const DESCRIPTIONS: Record<string, { bn: string; en: string }> = {
  'rice-pulses': {
    bn: 'লালমনিরহাট সদর গোশালা বাজারের সেরা আড়ত থেকে সরাসরি যাচাই করে কেনা হয়। পরিষ্কার ও পাথরবিহীন পণ্য। সাইকেল রাইডার অর্ডার পাওয়ার পর সরাসরি আড়তে গিয়ে কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Bought directly from the best wholesale shops of Goshala Bazar, Lalmonirhat Sadar, after checking. Clean and stone-free. The bicycle rider buys it fresh after your order and delivers it to your door.',
  },
  'oil-spices': {
    bn: 'লালমনিরহাট সদর গোশালা বাজারের নির্ভরযোগ্য দোকান থেকে সরাসরি যাচাই করে কেনা হয়। খাঁটি ও ভেজালমুক্ত। সাইকেল রাইডার অর্ডার পাওয়ার পর কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Bought from trusted shops of Goshala Bazar, Lalmonirhat Sadar, after checking. Pure and unadulterated, delivered to your door by bicycle rider.',
  },
  vegetables: {
    bn: 'প্রতিদিন সকালে লালমনিরহাট সদর গোশালা বাজারে আসা টাটকা সবজি থেকে বেছে কেনা হয়। সাইকেল রাইডার অর্ডার পাওয়ার পর নিজে যাচাই করে কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Hand-picked each morning from the fresh vegetables arriving at Goshala Bazar, Lalmonirhat Sadar. The rider checks and buys after your order and delivers to your door.',
  },
  'fish-meat': {
    bn: 'লালমনিরহাট সদর গোশালা বাজারের তাজা মাছ-মাংসের দোকান থেকে যাচাই করে কেনা হয়। সাইকেল রাইডার অর্ডার পাওয়ার পর সরাসরি কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Bought fresh from the fish and meat shops of Goshala Bazar, Lalmonirhat Sadar, after checking. Delivered to your door by bicycle rider.',
  },
  'milk-eggs': {
    bn: 'লালমনিরহাট সদর গোশালা বাজারের নির্ভরযোগ্য দোকান থেকে টাটকা দুধ-ডিম যাচাই করে কেনা হয়। সাইকেল রাইডার অর্ডার পাওয়ার পর কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Fresh milk and eggs checked and bought from trusted shops of Goshala Bazar, Lalmonirhat Sadar, and delivered to your door by bicycle rider.',
  },
  snacks: {
    bn: 'লালমনিরহাট সদর গোশালা বাজারের পরিচিত দোকান থেকে যাচাই করে কেনা হয়। সাইকেল রাইডার অর্ডার পাওয়ার পর কিনে আপনার বাড়ি পৌঁছে দেবে।',
    en: 'Checked and bought from well-known shops of Goshala Bazar, Lalmonirhat Sadar, and delivered to your door by bicycle rider.',
  },
};

interface Pack { id: string; labelBn: string; labelEn: string; price: number }

function packsFor(product: Product): Pack[] | null {
  if (product.unit === 'কেজি') {
    return [
      { id: 'half', labelBn: '৫০০ গ্রাম', labelEn: '500 g', price: Math.round(product.approxPrice / 2) },
      { id: 'one', labelBn: '১ কেজি', labelEn: '1 kg', price: product.approxPrice },
      { id: 'five', labelBn: '৫ কেজি বস্তা', labelEn: '5 kg bag', price: product.approxPrice * 5 },
    ];
  }
  if (product.unit === 'লিটার') {
    return [
      { id: 'half', labelBn: '৫০০ মিলি', labelEn: '500 ml', price: Math.round(product.approxPrice / 2) },
      { id: 'one', labelBn: '১ লিটার', labelEn: '1 ltr', price: product.approxPrice },
      { id: 'five', labelBn: '৫ লিটার', labelEn: '5 ltr', price: product.approxPrice * 5 },
    ];
  }
  return null;
}

function addDefault(dispatch: ReturnType<typeof useApp>['dispatch'], p: Product) {
  const item: CartItem = {
    id: p.id,
    productId: p.id,
    nameBn: p.nameBn,
    nameEn: p.nameEn,
    quantity: 1,
    price: p.approxPrice,
    unit: p.unit,
    source: 'bazaar',
    isApproxPrice: true,
  };
  dispatch({ type: 'ADD_TO_CART', item });
}

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const product = state.products.find(p => p.id === id);
  const [packId, setPackId] = useState('one');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [showAi, setShowAi] = useState(true);
  const [toast, setToast] = useState('');

  const complements = useMemo(() => {
    if (!product) return [];
    const others = state.products.filter(p => p.id !== product.id && p.isAvailable);
    return [
      ...others.filter(p => p.tags?.includes('popular')),
      ...others.filter(p => !p.tags?.includes('popular')),
    ];
  }, [product, state.products]);

  if (!product) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin h-14 flex items-center shadow-sm">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-on-surface active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-lg text-on-surface-variant">{bn ? 'পণ্য পাওয়া যায়নি' : 'Product not found'}</p>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_INFO[product.category];
  const hub = HUBS[product.category];
  const name = bn ? product.nameBn : product.nameEn;
  const subName = bn ? product.nameEn : product.nameBn;
  const isFav = state.favouriteProductIds.includes(product.id);
  const packs = packsFor(product);
  const pack = packs?.find(p => p.id === packId) ?? packs?.[1];
  const unitPrice = pack ? pack.price : product.approxPrice;
  const unitLabel = pack ? (bn ? pack.labelBn : pack.labelEn) : (bn ? `১ ${product.unit}` : `1 ${product.unitEn}`);
  const total = unitPrice * qty;
  const cartId = pack ? `${product.id}:${pack.id}` : product.id;
  const desc = product.description
    ? { bn: product.description, en: product.description }
    : DESCRIPTIONS[product.category];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const handleAddToCart = () => {
    const existing = state.cart.find(i => i.id === cartId);
    const item: CartItem = {
      id: cartId,
      productId: product.id,
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      quantity: qty,
      price: unitPrice,
      unit: pack ? pack.labelBn : product.unit,
      source: 'bazaar',
      isApproxPrice: true,
      note: note.trim() || undefined,
    };
    if (existing) {
      dispatch({ type: 'UPDATE_CART_QTY', id: cartId, qty: existing.quantity + qty });
    } else {
      dispatch({ type: 'ADD_TO_CART', item });
    }
    showToast(bn ? 'কার্টে যোগ করা হয়েছে!' : 'Added to cart!');
  };

  const handleShare = async () => {
    const shareData = { title: `Jovro — ${name}`, text: `${name} — ${fmtTk(unitPrice, lang)}`, url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(shareData); return; }
      throw new Error('no-share');
    } catch {
      try { await navigator.clipboard.writeText(window.location.href); showToast(bn ? 'লিংক কপি হয়েছে' : 'Link copied'); } catch { /* noop */ }
    }
  };

  const aiItems = complements.slice(0, 3);
  const railItems = complements.slice(3, 7);

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-36">
        {/* Header (Stitch 11) */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <button
              type="button"
              aria-label={bn ? 'ক্যাটালগে ফিরে যান' : 'Go back to catalogue'}
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="text-label-md font-label-md text-on-surface-variant truncate max-w-[200px]">
              {bn ? `${cat.nameBn} / ${cat.nameEn}` : `${cat.nameEn} / ${cat.nameBn}`}
            </span>
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <button
              type="button"
              aria-label={bn ? 'পছন্দে যোগ করুন' : 'Add to favorites'}
              onClick={() => dispatch({ type: 'TOGGLE_FAVOURITE', productId: product.id })}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all"
            >
              <span className={clsx('material-symbols-outlined', isFav ? 'text-error filled-symbol' : 'text-outline')}>favorite</span>
            </button>
            <button
              type="button"
              aria-label={bn ? 'শেয়ার করুন' : 'Share product'}
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </header>

        {/* Hero media */}
        <div className="relative w-full bg-surface-container-low aspect-[4/3] overflow-hidden flex items-center justify-center">
          {PRODUCT_IMAGES[product.id]
            ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            : <span className="text-[110px]">{product.imageEmoji}</span>}
          <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-label-sm font-label-sm text-on-surface">{bn ? 'আড়ত বাছাইকৃত • Fresh Stock' : 'Fresh Stock • আড়ত বাছাইকৃত'}</span>
          </div>
          <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
            <span className="text-label-sm font-label-sm text-primary">{bn ? 'সরাসরি গোডাউন' : 'Direct from hub'}</span>
          </div>
        </div>

        {/* Core details */}
        <section className="px-margin pt-space-lg flex flex-col gap-space-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
              <p className="text-bilingual-sub font-bilingual-sub text-primary font-semibold">
                {bn ? `গোশালা বাজার • ${hub.bn} (Goshala Bazar Hub)` : `Goshala Bazar • ${hub.en}`}
              </p>
            </div>
            <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">{name}</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">{subName}</p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-2">
            {product.isAvailable ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 border border-primary/20 text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span className="text-label-md font-label-md">{bn ? 'সাধারণত পাওয়া যায় (Usually available)' : 'Usually available'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/40 border border-error/20 text-error">
                <span className="material-symbols-outlined text-[16px]">block</span>
                <span className="text-label-md font-label-md">{bn ? 'এখন পাওয়া যাচ্ছে না' : 'Currently unavailable'}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">pedal_bike</span>
              <span className="text-label-sm font-label-sm">{bn ? 'সাইকেল রাইডার ডেলিভারি • ৩৫-৫০ মিনিট' : 'Bicycle rider delivery • 35-50 min'}</span>
            </div>
          </div>

          {/* Price card */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
            <div className="flex items-baseline justify-between mb-1.5 gap-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'আনুমানিক দাম' : 'Estimated price'}</span>
                <span className="text-headline-lg font-headline-lg text-primary tracking-tight">{fmtTk(unitPrice, lang)}</span>
                <span className="text-label-lg font-label-lg text-on-surface-variant">/ {unitLabel}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant border border-secondary/20 shrink-0">
                {bn ? 'নিয়মিত বাজার দর' : 'Regular bazaar rate'}
              </span>
            </div>
            <div className="mt-2.5 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">receipt_long</span>
              <p className="text-body-sm font-body-sm text-on-surface leading-tight">
                <strong className="font-semibold text-secondary">{bn ? 'রসিদ অনুযায়ী চূড়ান্ত হিসাব:' : 'Final bill by receipt:'}</strong>{' '}
                {bn
                  ? 'আড়তের ক্যাশ মেমোতে যে দাম উঠবে সেটাই ফাইনাল। বাড়তি কোনো গোপন ফি বা কমিশন নেই।'
                  : 'Whatever price is on the shop cash memo is final. No hidden fee or commission.'}
              </p>
            </div>
          </div>

          {/* Pack size selector (weight / volume products) */}
          {packs && (
            <div className="flex flex-col gap-2">
              <label className="text-label-lg font-label-lg text-on-surface flex items-center justify-between">
                <span>{bn ? 'ওজন নির্বাচন করুন / Select Pack Size' : 'Select Pack Size / ওজন নির্বাচন করুন'}</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant font-normal">{bn ? '৩টি সাইজ সুলভ' : '3 sizes available'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {packs.map(p => {
                  const selected = pack?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPackId(p.id)}
                      className={clsx(
                        'text-left p-2.5 rounded-2xl transition-all flex flex-col justify-between min-h-[72px]',
                        selected
                          ? 'bg-surface-container-lowest border-2 border-primary shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/50',
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={clsx('text-label-md font-label-md', selected ? 'text-primary font-bold' : 'text-on-surface font-semibold')}>
                          {bn ? p.labelBn : p.labelEn}
                        </span>
                        <span className={clsx(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center',
                          selected ? 'border-2 border-primary bg-primary' : 'border border-outline',
                        )}>
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <span className={clsx('text-body-sm font-body-sm', selected ? 'text-primary font-medium' : 'text-on-surface-variant')}>
                        {fmtTk(p.price, lang)} {bn ? 'আনুমানিক' : 'approx'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI suggestions card (Stitch 11b) */}
          {showAi && aiItems.length > 0 && (
            <div className="rounded-2xl bg-[#f0f9f3] border-2 border-primary/30 p-4 shadow-sm relative transition-all">
              <div className="flex items-start justify-between pb-2 border-b border-primary/15">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-label-sm font-label-sm uppercase tracking-wider text-primary font-bold">
                        {bn ? 'সহায়ক • AI Assistant' : 'Assistant • AI'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <h3 className="text-label-lg font-label-lg text-on-surface font-bold">
                      {bn ? 'এর সাথে এগুলোও লাগতে পারে' : 'You may also need these'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={bn ? 'পরামর্শ বন্ধ করুন' : 'Dismiss suggestions'}
                  onClick={() => setShowAi(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-black/5 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <div className="py-2.5 flex items-start gap-1.5 text-on-surface-variant">
                <span className="text-[14px] leading-tight">💡</span>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-snug">
                  <span className="text-primary font-medium">
                    {bn ? `${name}-এর সাথে এগুলো সাধারণত একসাথে লাগে` : `These usually go with ${name}`}
                  </span>
                  {bn
                    ? ' — আপনার প্রয়োজনীয় অনুষঙ্গগুলো এক ট্রিপেই সংগ্রহ করে আনবে শপার।'
                    : ' — the shopper will collect everything in a single trip.'}
                </p>
              </div>
              <div className="space-y-2 pt-1">
                {aiItems.map(p => {
                  const inCart = state.cart.some(i => i.productId === p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30 shadow-sm gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center text-[20px]">
                          {PRODUCT_IMAGES[p.id]
                            ? <img src={PRODUCT_IMAGES[p.id]} alt={bn ? p.nameBn : p.nameEn} className="w-full h-full object-cover" loading="lazy" />
                            : p.imageEmoji}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-body-md font-body-md text-on-surface font-semibold leading-tight truncate">{bn ? p.nameBn : p.nameEn}</h4>
                          <div className="flex items-center gap-1.5 text-body-sm font-body-sm text-on-surface-variant">
                            <span>{bn ? p.unit : p.unitEn}</span>
                            <span>•</span>
                            <span className="text-primary font-medium">{bn ? 'আনুমানিক' : 'Approx'} {fmtTk(p.approxPrice, lang)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { addDefault(dispatch, p); showToast(bn ? 'কার্টে যোগ করা হয়েছে!' : 'Added to cart!'); }}
                        className={clsx(
                          'h-9 px-3 rounded-full text-label-md font-label-md active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap',
                          inCart ? 'bg-primary text-on-primary' : 'border border-primary text-primary hover:bg-primary hover:text-on-primary',
                        )}
                      >
                        <span className="material-symbols-outlined text-[16px]">{inCart ? 'check' : 'add'}</span>
                        {bn ? 'যোগ করুন' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2.5 border-t border-primary/10 flex items-center gap-1.5 text-on-surface-variant text-[11px] font-medium">
                <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                <span>{bn ? 'সকল পণ্যের দাম আনুমানিক — কোনো অতিরিক্ত চার্জ বা হিডেন ফি নেই। আসল মেমো অনুযায়ী হিসাব হবে।' : 'All prices are approximate — no extra or hidden charges. Final bill follows the actual memo.'}</span>
              </div>
            </div>
          )}

          {/* Quantity & shopper note */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-label-lg font-label-lg text-on-surface">{bn ? 'পরিমাণ / Quantity' : 'Quantity / পরিমাণ'}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'প্রয়োজন মতো প্যাকেট সংখ্যা বাড়ান' : 'Increase the number of packs as needed'}</p>
              </div>
              <div className="flex items-center bg-surface-container-low rounded-full p-1 border border-outline-variant/30">
                <button
                  type="button"
                  aria-label={bn ? 'পরিমাণ কমান' : 'Decrease quantity'}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm active:scale-90 hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="w-10 text-center font-headline-sm text-headline-sm text-on-surface select-none">{toBnDigits(qty, lang)}</span>
                <button
                  type="button"
                  aria-label={bn ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                  onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-90 hover:bg-primary-container transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/20">
              <label className="text-label-md font-label-md text-on-surface flex items-center gap-1.5" htmlFor="shopper-instruction">
                <span className="material-symbols-outlined text-primary text-[18px]">assignment_ind</span>
                <span>{bn ? 'শপারের জন্য নোট (Shopper Note)' : 'Note for the shopper'}</span>
              </label>
              <input
                id="shopper-instruction"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-outline-variant/60 bg-surface text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder={bn ? 'যেমন: ভালো বস্তা ও ফ্রেশ দেখে দিবেন' : 'e.g. Please pick the fresh one'}
                type="text"
              />
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {bn ? 'আপনার এলাকার রাইডার সরাসরি দোকানে কথা বলে সেরা মানের পণ্য নির্বাচন করবেন।' : 'Your local rider will talk to the shop and pick the best quality item.'}
              </p>
            </div>
          </div>

          {/* Quality transparency */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 shadow-sm">
            <h2 className="text-label-lg font-label-lg text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">nature_people</span>
              <span>{bn ? 'পণ্যের বিবরণ ও সত্যতা / Quality Transparency' : 'Quality Transparency'}</span>
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">{bn ? desc.bn : desc.en}</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                <div className="leading-tight">
                  <p className="text-label-sm font-label-sm text-on-surface">{bn ? 'দ্রুত ডেলিভারি' : 'Fast delivery'}</p>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'সদর পৌর এলাকা' : 'Sadar town area'}</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">currency_exchange</span>
                <div className="leading-tight">
                  <p className="text-label-sm font-label-sm text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'}</p>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'পণ্য দেখে টাকা দিন' : 'Pay after checking'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Goes well with carousel (Stitch 11) */}
          {railItems.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-label-lg font-label-lg text-on-surface">{bn ? 'এর সাথে যা যা লাগে / Goes well with' : 'Goes well with'}</h2>
                  <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'একই ট্রিপে আড়ত থেকে নিয়ে আসা সম্ভব' : 'Can be collected in the same trip'}</p>
                </div>
                <button type="button" onClick={() => navigate('/bazaar')} className="text-label-sm font-label-sm text-primary font-bold">
                  {bn ? 'সব দেখুন' : 'See all'}
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-margin px-margin">
                {railItems.map(p => (
                  <div key={p.id} className="flex-shrink-0 w-36 bg-surface-container-lowest p-2.5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                    <button type="button" onClick={() => navigate(`/product/${p.id}`)} className="text-left">
                      <div className="w-full h-24 rounded-xl bg-surface-container overflow-hidden mb-2 relative flex items-center justify-center text-[44px]">
                        {PRODUCT_IMAGES[p.id]
                          ? <img src={PRODUCT_IMAGES[p.id]} alt={bn ? p.nameBn : p.nameEn} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                          : p.imageEmoji}
                      </div>
                      <h3 className="text-label-md font-label-md text-on-surface line-clamp-1">{bn ? p.nameBn : p.nameEn}</h3>
                      <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mb-1.5">{bn ? p.unit : p.unitEn}</p>
                    </button>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-label-lg font-label-lg text-primary font-bold">{fmtTk(p.approxPrice, lang)}</span>
                      <button
                        type="button"
                        onClick={() => { addDefault(dispatch, p); showToast(bn ? 'কার্টে যোগ করা হয়েছে!' : 'Added to cart!'); }}
                        className="px-2.5 py-1 rounded-full border border-primary text-primary hover:bg-primary hover:text-on-primary text-label-sm font-label-sm transition-all active:scale-95"
                      >
                        + ADD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust assurance box */}
          <div className="p-3.5 rounded-2xl bg-secondary-fixed/30 border border-secondary/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center flex-shrink-0 text-secondary">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <p className="text-label-md font-label-md text-on-secondary-fixed font-bold">{bn ? 'দরদামে কোনো লুকোচুরি নেই' : 'No hidden charges'}</p>
              <p className="text-body-sm font-body-sm text-on-secondary-fixed-variant leading-tight">
                {bn ? 'বাজারে দাম কমলে আপনার রসিদেও কম হিসাব হবে।' : 'If the bazaar price drops, your receipt drops too.'}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Floating chat button (app pattern) */}
      <div className="fixed bottom-[148px] left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none">
        <div className="flex justify-end px-4">
          <button
            type="button"
            onClick={() => navigate('/ai')}
            aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
            className="pointer-events-auto relative w-[52px] h-[52px] rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:brightness-105 active:scale-90 transition-all border-2 border-white"
          >
            <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
            <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping -z-10" />
          </button>
        </div>
      </div>

      {/* Sticky bottom purchase bar */}
      <footer className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-app z-50 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 py-2.5 px-margin shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col flex-shrink-0 min-w-[110px]">
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'মোট আনুমানিক' : 'Total estimate'}</span>
            <span className="text-headline-sm font-headline-sm text-primary tracking-tight">{fmtTk(total, lang)}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant truncate">({unitLabel})</span>
          </div>
          <button
            type="button"
            disabled={!product.isAvailable}
            onClick={handleAddToCart}
            className="flex-1 h-12 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            <span>{product.isAvailable ? (bn ? 'কার্টে যোগ করুন / Add to cart' : 'Add to cart') : (bn ? 'পাওয়া যাচ্ছে না' : 'Unavailable')}</span>
          </button>
        </div>
      </footer>

      {/* Toast */}
      <div className={clsx(
        'fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg text-body-sm font-body-sm flex items-center gap-2 transition-opacity duration-300',
        toast ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}>
        <span className="material-symbols-outlined text-inverse-primary text-[18px]">check</span>
        <span>{toast}</span>
      </div>
    </div>
  );
}
