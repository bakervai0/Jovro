import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader, SectionHeading } from '../../components/layout/Headers';
import { ProductPhoto } from '../../components/shared/ProductCard';
import { AddButton, QuantityStepperLarge } from '../../components/ui/Stepper';
import { CATEGORY_INFO } from '../../data/products';
import { addProductToCart, findCartLine } from '../../lib/cartUtils';
import { tk, toBn } from '../../lib/format';
import type { PackSize, Product } from '../../types';

function suggestionsFor(product: Product, products: Product[]): Product[] {
  const pairs: Record<string, string[]> = {
    'p-01': ['p-04', 'p-09', 'p-24'],
    'p-04': ['p-01', 'p-12', 'p-14'],
    'p-09': ['p-01', 'p-12', 'p-33'],
    'p-17': ['p-12', 'p-25', 'p-28'],
    'p-33': ['p-01', 'p-09', 'p-17'],
  };
  const ids = pairs[product.id];
  if (ids) return ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const sameCategory = products.filter(p => p.category === product.category && p.id !== product.id);
  const others = products.filter(p => p.category !== product.category && p.isAvailable);
  return [...sameCategory, ...others].slice(0, 3);
}

export default function ProductDetailScreen() {
  const { id } = useParams();
  const { state, dispatch, t } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const product = state.products.find(p => p.id === id);
  const [packId, setPackId] = useState<string>(product?.packSizes?.find(p => p.isDefault)?.id ?? '');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [showAi, setShowAi] = useState(true);
  const [fav, setFav] = useState(() => (id ? state.favouriteProductIds.includes(id) : false));

  const suggestions = useMemo(() => (product ? suggestionsFor(product, state.products) : []), [product, state.products]);

  if (!product) {
    return (
      <div className="screen-scroll bg-surface">
        <PageHeader showBack title={bn ? 'পণ্য পাওয়া যায়নি' : 'Product not found'} />
        <div className="grid place-items-center py-20 text-center">
          <span className="text-[52px]">🧺</span>
          <p className="mt-3 text-[14px] text-on-surface-variant">{bn ? 'এই পণ্যটি আর নেই।' : 'This product no longer exists.'}</p>
        </div>
      </div>
    );
  }

  const category = CATEGORY_INFO[product.category];
  const pack: PackSize | undefined = product.packSizes?.find(p => p.id === packId);
  const unitPrice = pack ? pack.price : product.approxPrice;
  const unitLabel = pack ? pack.labelBn : product.unit;
  const line = findCartLine(state.cart, product.id, pack?.id);
  const inCart = line?.quantity ?? 0;

  const addToCart = () => {
    addProductToCart(dispatch, product, pack, qty);
  };

  const toggleFav = () => {
    dispatch({ type: 'TOGGLE_FAVOURITE', productId: product.id });
    setFav(v => !v);
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={bn ? `${category.nameBn}` : category.nameEn}
        subtitle={bn ? category.nameEn : category.nameBn}
        right={
          <>
            <button onClick={toggleFav} aria-label="favourite" className="grid h-9 w-9 place-items-center rounded-full text-on-surface">
              <span className={clsx('material-symbols-outlined text-[22px]', fav && 'filled-symbol text-error')}>favorite</span>
            </button>
            <button
              onClick={() => {
                const text = `${product.nameBn} — ${tk(unitPrice, state.lang)} (${unitLabel}) · Jovro`;
                if (navigator.share) navigator.share({ title: product.nameEn, text }).catch(() => undefined);
              }}
              aria-label="share"
              className="grid h-9 w-9 place-items-center rounded-full text-on-surface"
            >
              <span className="material-symbols-outlined text-[21px]">share</span>
            </button>
          </>
        }
      />

      <div className="pb-40">
        {/* Hero */}
        <div className="relative">
          <ProductPhoto product={product} className="h-[208px] w-full" rounded="rounded-none" emojiSize="text-[74px]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-primary-deep px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              {bn ? 'আড়ত বাছাইকৃত • Fresh Stock' : 'Fresh stock from the wholesale hub'}
            </span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold text-on-surface-variant shadow-sm">
              {bn ? 'সরাসরি (গোডাউন)' : 'Direct from hub'}
            </span>
          </div>
          {!product.isAvailable && (
            <div className="absolute inset-0 grid place-items-center bg-black/35">
              <span className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-error">
                {bn ? 'আজকের বাজারে স্টক নেই' : 'Out of stock today'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 px-4 pt-3">
          {/* Title block */}
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-tertiary">
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              {bn ? product.marketBn : product.marketEn}
              <span className="font-normal text-on-surface-variant">(Goshala Bazar Hub)</span>
            </p>
            <h1 className="mt-1 text-[23px] font-bold leading-tight text-on-surface">{bn ? product.nameBn : product.nameEn}</h1>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-on-surface-variant">
              {product.nameEn} — {bn ? product.qualityBn ?? 'তাজা ও বাছাইকৃত পণ্য' : product.qualityEn ?? 'Fresh, hand-picked item'}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={clsx(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                product.isAvailable ? 'bg-primary-soft text-primary-deep' : 'bg-error-soft text-error',
              )}>
                <span className="material-symbols-outlined text-[13px]">{product.isAvailable ? 'check_circle' : 'cancel'}</span>
                {product.isAvailable ? (bn ? 'সাধারণত পাওয়া যায় (Usually available)' : 'Usually available') : (bn ? 'স্টক আউট (Unavailable)' : 'Unavailable')}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">pedal_bike</span>
                {bn ? 'সাইকেল রাইডার ডেলিভারি • ৩৫–৫০ মিনিট' : 'Cycle rider delivery • 35–50 min'}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
            <div className="flex items-end justify-between gap-2">
              <p className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-on-surface-variant">{bn ? 'আনুমানিক দাম' : 'Approx price'}</span>
                <span className="text-[27px] font-bold leading-none text-primary-deep">{tk(unitPrice, state.lang)}</span>
                <span className="text-[12.5px] text-on-surface-variant">/ {unitLabel}</span>
              </p>
              <span className="rounded-md border border-secondary-bright/35 bg-secondary-soft px-2 py-1 text-[10px] font-semibold text-secondary">
                {bn ? 'নিয়মিত বাজার দর' : 'Regular bazaar rate'}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-container px-3 py-2.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">receipt_long</span>
              <p className="text-[11.5px] leading-relaxed text-on-surface-variant">
                <b className="text-secondary">{bn ? 'রসিদ অনুযায়ী চূড়ান্ত হিসাব:' : 'Final amount per receipt:'}</b>{' '}
                {bn
                  ? 'আড়তের ক্যাশ মেমোতে যে দাম উঠবে সেটাই ফাইনাল। বাড়তি কোনো গোপন ফি বা কমিশন নেই।'
                  : 'You pay exactly what the wholesale memo says. No hidden fee or commission.'}
              </p>
            </div>
          </div>

          {/* Pack size */}
          {product.packSizes && product.packSizes.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[14.5px] font-bold text-on-surface">
                  {bn ? 'ওজন নির্বাচন করুন' : 'Select pack size'} <span className="text-[11.5px] font-normal text-on-surface-variant">/ Select Pack Size</span>
                </h2>
                <span className="text-[10.5px] text-on-surface-variant">
                  {toBn(product.packSizes.length, state.lang)} {bn ? 'টি সাইজ উপলব্ধ' : 'sizes'}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {product.packSizes.map(p => {
                  const active = packId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPackId(p.id)}
                      className={clsx(
                        'relative rounded-xl border-2 bg-surface-container-lowest px-2 py-2.5 text-center transition-all',
                        active ? 'border-primary-deep bg-primary-tint' : 'border-outline-variant/70',
                      )}
                    >
                      {active && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary-deep px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                          {bn ? 'নির্বাচিত' : 'Selected'}
                        </span>
                      )}
                      <span className="flex items-center justify-center gap-1">
                        <span className={clsx('text-[12.5px] font-bold', active ? 'text-primary-deep' : 'text-on-surface')}>
                          {bn ? p.labelBn : p.labelEn}
                        </span>
                        <span className={clsx('grid h-3.5 w-3.5 place-items-center rounded-full border', active ? 'border-primary-deep' : 'border-outline')}>
                          {active && <span className="h-2 w-2 rounded-full bg-primary-deep" />}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-on-surface-variant">
                        {tk(p.price, state.lang)} {bn ? 'আনুমানিক' : 'approx'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + shopper note */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-3">
              <div>
                <h2 className="text-[14.5px] font-bold text-on-surface">{bn ? 'পরিমাণ' : 'Quantity'} <span className="text-[11px] font-normal text-on-surface-variant">/ Quantity</span></h2>
                <p className="text-[10.5px] text-on-surface-variant">{bn ? 'প্রয়োজন মতো প্যাকেট সংখ্যা বাড়ান' : 'Increase the number of packs'}</p>
              </div>
              <QuantityStepperLarge qty={qty} onIncrease={() => setQty(q => q + 1)} onDecrease={() => setQty(q => Math.max(1, q - 1))} />
            </div>

            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[17px] text-primary">edit_note</span>
                {bn ? 'শপারের জন্য নোট' : 'Shopper note'}
                <span className="text-[10.5px] font-normal text-on-surface-variant">(Shopper Note)</span>
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder={bn ? 'যেমন: ভালো বস্তা ও ক্রেশ শুকনো চাল দেখে দিবেন' : 'e.g. Please pick a well-packed, dry sack'}
                className="mt-1.5 w-full resize-none rounded-xl border border-outline-variant/70 bg-surface-container-low px-3 py-2 text-[12px] text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
              />
              <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-snug text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {bn ? 'আপনার এলাকার রাইডার সরাসরি দোকানে কথা বলে সেরা মানের পণ্য নির্বাচন করবেন।' : 'Your area rider picks the best quality directly at the shop.'}
              </p>
            </div>
          </div>

          {/* Quality transparency */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
              {bn ? 'পণ্যের বিবরণ ও সততা' : 'Quality transparency'} <span className="text-[11px] font-normal text-on-surface-variant">/ Quality Transparency</span>
            </h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-on-surface-variant">
              {bn
                ? 'লালমনিরহাট সদর গোশালা বাজারের সেরা আড়ত থেকে সরাসরি যাচাই করে কেনা হয়। চাল চিকন, সুগন্ধি ও পরিষ্কার। সাইকেল রাইডার অর্ডার পাওয়ার পর সরাসরি আড়ত থেকে কিনে আপনার বাড়ি পৌঁছে দেবেন।'
                : 'Bought directly from the best wholesale stall at Goshala Bazar and checked by hand. Our cycle rider buys it fresh and delivers it to your door.'}
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <span className="flex items-center gap-1.5 rounded-xl bg-surface-container px-2.5 py-2 text-[10.5px] font-medium text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                {bn ? 'দ্রুত ডেলিভারি' : 'Fast delivery'}
                <span className="block text-[9px] text-on-surface-variant">{bn ? 'সদর পৌর এলাকা' : 'Sadar town'}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-surface-container px-2.5 py-2 text-[10.5px] font-medium text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
                {bn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on delivery'}
                <span className="block text-[9px] text-on-surface-variant">{bn ? 'পণ্য দেখে টাকা দিন' : 'Pay after checking'}</span>
              </span>
            </div>
          </div>

          {/* Goes well with */}
          <section>
            <SectionHeading
              titleBn="এর সাথে যা যা লাগে"
              titleEn="Goes well with"
              subtitleBn="একই চেপে আড়ত থেকে নিয়ে আসা সম্ভব"
              subtitleEn="Buy together from the same bazaar run"
              actionBn="সব দেখুন"
              actionEn="See all"
              onAction={() => navigate('/bazaar')}
            />
            <div className="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto pb-1">
              {suggestions.map(s => (
                <div key={s.id} className="w-[132px] flex-shrink-0 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-card">
                  <button onClick={() => navigate(`/product/${s.id}`)} className="block w-full text-left">
                    <div className="relative">
                      <ProductPhoto product={s} className="h-[82px] w-full" rounded="rounded-xl" emojiSize="text-[30px]" />
                      <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[8.5px] font-semibold text-on-surface">
                        {s.id === 'p-04' ? (bn ? '৫০০ গ্রাম' : '500 g') : s.unit}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-on-surface">{bn ? s.nameBn : s.nameEn}</p>
                    <p className="text-[10px] text-on-surface-variant">{s.unit}</p>
                  </button>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-[13px] font-bold text-primary-deep">{tk(s.approxPrice, state.lang)}</span>
                    <button
                      onClick={() => addProductToCart(dispatch, s)}
                      className="flex items-center gap-0.5 rounded-full border border-primary px-2 py-0.5 text-[9.5px] font-bold text-primary"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI assistant suggestions */}
          {showAi && suggestions.length > 0 && (
            <div className="rounded-2xl border border-primary/35 bg-primary-tint p-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-deep text-white">
                    <span className="material-symbols-outlined filled-symbol text-[19px]">auto_awesome</span>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-primary-deep">
                      {bn ? 'সহায়ক • AI ASSISTANT' : 'AI ASSISTANT'} <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    </p>
                    <p className="text-[13px] font-bold text-primary-deep">{bn ? 'এর সাথে এগুলোও লাগতে পারে' : 'You may need these too'}</p>
                  </div>
                </div>
                <button onClick={() => setShowAi(false)} aria-label="close" className="text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="mt-2 border-t border-primary/20 pt-2 text-[11px] leading-relaxed text-on-surface-variant">
                💡 {bn
                  ? 'চালের সাথে ডাল, তেল ও লেবু সাধারণত একসাথে লাগে — আপনার প্রয়োজনীয় অনুসঙ্গগুলো এক ডিপেই সংগ্রহ করে আনবে শপার।'
                  : 'Rice usually travels with dal, oil and lemon — your shopper can collect them in one trip.'}
              </p>

              <div className="mt-2 flex flex-col gap-2">
                {suggestions.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-2">
                    <ProductPhoto product={s} className="h-11 w-11 flex-shrink-0" rounded="rounded-lg" emojiSize="text-[20px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-on-surface">{bn ? s.nameBn : s.nameEn}</p>
                      <p className="truncate text-[10px] text-on-surface-variant">
                        {s.unit} <span className="px-0.5">•</span> {bn ? 'আনুমানিক' : 'approx'} {tk(s.approxPrice, state.lang)}
                      </p>
                    </div>
                    <AddButton
                      onClick={() => addProductToCart(dispatch, s)}
                      size="sm"
                      labelBn={bn ? 'যোগ করুন' : 'Add'}
                      labelEn=""
                    />
                  </div>
                ))}
              </div>

              <p className="mt-2 flex items-start gap-1.5 border-t border-primary/20 pt-2 text-[10px] leading-snug text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">info</span>
                {bn ? 'সকল পণ্যের দাম আনুমানিক — কোনো অতিরিক্ত চার্জ বা হিডেন ফি নেই। আসল মেমো অনুযায়ী হিসাব হবে।' : 'All prices are approximate — no extra charge or hidden fee. Final amount per the bazaar memo.'}
              </p>
            </div>
          )}

          {/* No-bargain banner */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-secondary-soft p-3">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-white text-secondary">
              <span className="material-symbols-outlined text-[19px]">price_check</span>
            </span>
            <div>
              <p className="text-[12px] font-bold text-secondary">{bn ? 'দরদামে কোনো লুকোচুরি নেই' : 'No hidden markup'}</p>
              <p className="text-[10.5px] text-secondary/85">{bn ? 'বাজারের দাম কমলে আপনার রসিদেও কম হিসাব হবে।' : 'If the bazaar rate drops, your receipt drops too.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky add bar */}
      <div
        className="fixed left-1/2 z-cartbar w-full max-w-app -translate-x-1/2 border-t border-outline-variant/60 bg-surface/95 px-4 py-2.5 backdrop-blur"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] leading-tight text-on-surface-variant">{bn ? 'মোট আনুমানিক বিল' : 'Total approx bill'}</p>
            <p className="text-[19px] font-bold leading-tight text-primary-deep">
              {tk(unitPrice * qty, state.lang)}
              <span className="ml-1 text-[11px] font-normal text-on-surface-variant">({qty} × {unitLabel})</span>
            </p>
          </div>
          <button
            onClick={() => { addToCart(); navigate('/cart'); }}
            disabled={!product.isAvailable}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-deep to-primary text-[13.5px] font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[19px]">shopping_cart_checkout</span>
            {product.isAvailable
              ? (bn ? 'কার্টে যোগ করুন / Add to cart' : 'Add to cart / কার্টে যোগ করুন')
              : (bn ? 'স্টক নেই' : 'Out of stock')}
          </button>
        </div>
        {inCart > 0 && (
          <p className="mt-1 text-center text-[10px] text-primary">
            {t('cart.inCart') ?? ''} {bn ? `${toBn(inCart, 'bn')}টি কার্টে আছে` : `${inCart} already in cart`}
          </p>
        )}
      </div>
    </div>
  );
}
