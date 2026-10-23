import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { QuantityStepper } from '../../components/ui/Stepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { addProductToCart } from '../../lib/cartUtils';
import { tk, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { CartItem } from '../../types';

function LinePhoto({ line }: { line: CartItem }) {
  const { state } = useApp();
  const product = state.products.find(p => p.id === line.productId);
  const menuItem = state.restaurants.flatMap(r => r.menuItems).find(m => m.id === line.menuItemId);
  const image = product?.image ?? menuItem?.image;
  const emoji = product?.imageEmoji ?? '🍽️';
  if (image) {
    return <img src={asset(image)} alt={line.nameEn} className="h-[46px] w-[46px] flex-shrink-0 rounded-lg object-cover" loading="lazy" />;
  }
  return (
    <span className="grid h-[46px] w-[46px] flex-shrink-0 place-items-center rounded-lg bg-surface-container text-[22px]">{emoji}</span>
  );
}

export default function CartScreen() {
  const {
    state, dispatch, cartTotal, cartCount, cartDeliveryFee, cartDiscount, cartFinal, validatePromo,
  } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [note, setNote] = useState('');

  const bazaarLines = state.cart.filter(c => c.source === 'bazaar');
  const restaurantGroups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    state.cart.filter(c => c.source === 'restaurant').forEach(line => {
      const rid = line.restaurantId ?? 'rest';
      map.set(rid, [...(map.get(rid) ?? []), line]);
    });
    return Array.from(map.entries());
  }, [state.cart]);

  // AI "missing items" — pantry basics usually bought with a bazaar run.
  const missing = useMemo(() => {
    if (bazaarLines.length === 0) return [];
    const inCart = new Set(state.cart.map(c => c.productId));
    const pantry = ['p-09', 'p-12', 'p-33', 'p-24'];
    return pantry
      .filter(id => !inCart.has(id))
      .map(id => state.products.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 3) as typeof state.products;
  }, [bazaarLines.length, state.cart, state.products]);

  const applyPromo = (code: string) => {
    const promo = validatePromo(code.trim());
    if (!promo) {
      setPromoError(bn ? 'অবৈধ কোড বা সর্বনিম্ন অর্ডার পূরণ হয়নি' : 'Invalid code or minimum order not met');
      return;
    }
    dispatch({ type: 'APPLY_PROMO', promo });
    setPromoError('');
    setPromoInput('');
  };

  const updateQty = (line: CartItem, qty: number) => {
    if (qty <= 0) dispatch({ type: 'REMOVE_FROM_CART', id: line.id });
    else dispatch({ type: 'UPDATE_CART_QTY', id: line.id, qty });
  };

  if (cartCount === 0) {
    return (
      <div className="screen-scroll bg-surface">
        <PageHeader showBack title={bn ? 'কার্ট' : 'Cart'} subtitle={bn ? 'আপনার বাজার' : 'Your basket'} />
        <EmptyState
          emoji="🛒"
          title={bn ? 'কার্ট এখন খালি' : 'Your cart is empty'}
          subtitle={bn ? 'গোশালা বাজার বা রেস্টুরেন্ট থেকে পণ্য যোগ করুন — রাইডার কিনে দরজায় পৌঁছে দেবে।' : 'Add items from Goshala Bazar or a restaurant — a rider will buy and deliver them.'}
          action={
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/bazaar')} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white">
                <span className="material-symbols-outlined text-[19px]">storefront</span>
                {bn ? 'বাজার দেখুন' : 'Browse the bazaar'}
              </button>
              <button onClick={() => navigate('/food')} className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary text-[13.5px] font-bold text-primary">
                <span className="material-symbols-outlined text-[19px]">restaurant</span>
                {bn ? 'খাবার অর্ডার করুন' : 'Order restaurant food'}
              </button>
            </div>
          }
        />
        <div className="mx-4 rounded-2xl bg-primary-tint p-3">
          <p className="text-[11.5px] leading-relaxed text-on-surface-variant">
            <b className="text-primary-deep">{bn ? 'মনে রাখবেন:' : 'Remember:'}</b>{' '}
            {bn ? 'পণ্যের দামে কোনো মার্কআপ নেই — শুধু ডেলিভারি ফি। রসিদ দেখে আসল দামে হিসাব।' : 'No product markup — only the delivery fee. You pay the bazaar receipt price.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={bn ? `কার্ট (${toBn(cartCount, 'bn')})` : `Cart (${cartCount})`}
        subtitle={bn ? 'গোশালা বাজার ও রেস্টুরেন্ট' : 'Bazaar & restaurant items'}
        right={
          <button
            onClick={() => dispatch({ type: 'CLEAR_CART' })}
            className="text-[11.5px] font-medium text-error"
          >
            {bn ? 'খালি করুন' : 'Clear'}
          </button>
        }
      />

      <div className="flex flex-col gap-4 pb-52 pt-3">
        {/* Bazaar group */}
        {bazaarLines.length > 0 && (
          <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-soft text-primary-deep">
                  <span className="material-symbols-outlined text-[15px]">storefront</span>
                </span>
                {bn ? 'গোশালা বাজার' : 'Goshala Bazar'}
                <span className="rounded-full bg-secondary-soft px-1.5 py-0.5 text-[9px] font-semibold text-secondary">
                  {bn ? 'আনুমানিক দাম' : 'Approx price'}
                </span>
              </h2>
              <span className="text-[10.5px] text-on-surface-variant">{toBn(bazaarLines.length, state.lang)} {bn ? 'আইটেম' : 'items'}</span>
            </div>

            <div className="divide-y divide-outline-variant/40">
              {bazaarLines.map(line => (
                <div key={line.id} className="flex items-center gap-2.5 py-2.5">
                  <LinePhoto line={line} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-on-surface">{bn ? line.nameBn : line.nameEn}</p>
                    <p className="text-[10.5px] text-on-surface-variant">
                      {tk(line.price, state.lang)} × {toBn(line.quantity, state.lang)} {line.unit}
                    </p>
                  </div>
                  <QuantityStepper
                    qty={line.quantity}
                    onDecrease={() => updateQty(line, line.quantity - 1)}
                    onIncrease={() => updateQty(line, line.quantity + 1)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Restaurant groups */}
        {restaurantGroups.map(([rid, lines]) => {
          const restaurant = state.restaurants.find(r => r.id === rid);
          return (
            <section key={rid} className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-secondary-soft text-secondary">
                    <span className="material-symbols-outlined text-[15px]">restaurant</span>
                  </span>
                  {restaurant ? (bn ? restaurant.nameBn : restaurant.nameEn) : 'Restaurant'}
                </h2>
                <button onClick={() => navigate(`/food/${rid}`)} className="text-[10.5px] font-semibold text-primary">
                  {bn ? 'মেনু দেখুন' : 'View menu'}
                </button>
              </div>
              <div className="divide-y divide-outline-variant/40">
                {lines.map(line => (
                  <div key={line.id} className="flex items-center gap-2.5 py-2.5">
                    <LinePhoto line={line} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-on-surface">{bn ? line.nameBn : line.nameEn}</p>
                      <p className="text-[10.5px] text-on-surface-variant">{tk(line.price, state.lang)} × {toBn(line.quantity, state.lang)}</p>
                    </div>
                    <QuantityStepper
                      qty={line.quantity}
                      onDecrease={() => updateQty(line, line.quantity - 1)}
                      onIncrease={() => updateQty(line, line.quantity + 1)}
                    />
                  </div>
                ))}
              </div>
              {restaurant && cartTotal < restaurant.minOrder && (
                <p className="mt-2 rounded-lg bg-warning-soft px-2 py-1.5 text-[10.5px] text-warning">
                  {bn ? `এই রেস্টুরেন্টে মিনিমাম অর্ডার ${tk(restaurant.minOrder, 'bn')}` : `Minimum order ${tk(restaurant.minOrder, 'en')} for this restaurant`}
                </p>
              )}
            </section>
          );
        })}

        {/* AI missing items */}
        {missing.length > 0 && (
          <section className="mx-4 rounded-2xl border border-primary/30 bg-primary-tint p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-deep text-white">
                <span className="material-symbols-outlined filled-symbol text-[17px]">auto_awesome</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wide text-primary-deep">{bn ? 'সহায়ক • AI ASSISTANT' : 'AI ASSISTANT'}</p>
                <p className="text-[12.5px] font-bold text-primary-deep">{bn ? 'এগুলো ভুলে গেলেন না তো?' : 'Did you forget these?'}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {missing.map(p => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl bg-surface-container-lowest p-1.5">
                  {p.image ? (
                    <img src={asset(p.image)} alt={p.nameEn} className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container text-[18px]">{p.imageEmoji}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-on-surface">{bn ? p.nameBn : p.nameEn}</p>
                    <p className="text-[10px] text-on-surface-variant">{p.unit} · {tk(p.approxPrice, state.lang)}</p>
                  </div>
                  <button
                    onClick={() => addProductToCart(dispatch, p)}
                    className="flex items-center gap-0.5 rounded-full border border-primary px-2 py-1 text-[10px] font-bold text-primary"
                  >
                    <span className="material-symbols-outlined text-[13px]">add</span>
                    {bn ? 'যোগ' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[9.5px] text-on-surface-variant">
              {bn ? 'আপনার আগের অর্ডার দেখে সহায়ক এই পরামর্শ দিয়েছে।' : 'Suggested from your previous orders.'}
            </p>
          </section>
        )}

        {/* Promo */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
              <span className="material-symbols-outlined text-[17px] text-secondary">local_offer</span>
              {bn ? 'প্রোমো কোড' : 'Promo code'}
            </h2>
            <span className="text-[10px] text-on-surface-variant">{bn ? 'ছাড় পেতে কোড দিন' : 'Add a code to save'}</span>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={promoInput}
              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
              placeholder={bn ? 'যেমন: JOVRO50' : 'e.g. JOVRO50'}
              className={clsx(
                'h-10 min-w-0 flex-1 rounded-xl border bg-surface-container-low px-3 text-[12.5px] uppercase text-on-surface outline-none placeholder:normal-case placeholder:text-on-surface-variant/60',
                promoError ? 'border-error' : 'border-outline-variant focus:border-primary',
              )}
            />
            <button
              onClick={() => applyPromo(promoInput)}
              disabled={!promoInput.trim()}
              className="h-10 flex-shrink-0 rounded-xl bg-primary px-4 text-[12.5px] font-bold text-white disabled:opacity-40"
            >
              {bn ? 'প্রয়োগ' : 'Apply'}
            </button>
          </div>

          {promoError && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-error">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {promoError}
            </p>
          )}
          {state.appliedPromo && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-primary-soft p-2">
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-bold text-primary-deep">
                  {state.appliedPromo.code} {bn ? 'প্রয়োগ হয়েছে' : 'applied'}
                </p>
                <p className="text-[10.5px] text-on-surface-variant">
                  {bn ? state.appliedPromo.descriptionBn : state.appliedPromo.descriptionEn}
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: 'REMOVE_PROMO' })}
                className="text-[10.5px] font-semibold text-error"
              >
                {bn ? 'বাদ দিন' : 'Remove'}
              </button>
            </div>
          )}

          {!state.appliedPromo && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.promos.filter(p => p.isActive).map(p => (
                <button
                  key={p.code}
                  onClick={() => applyPromo(p.code)}
                  className="rounded-full border border-dashed border-secondary-bright/60 bg-secondary-soft px-2 py-1 text-[10px] font-bold text-secondary"
                >
                  {p.code}
                  <span className="ml-1 font-normal">· {p.minOrder > 0 ? `${bn ? '৳' : '৳'}${p.minOrder}+` : (bn ? 'সব অর্ডার' : 'all orders')}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Note */}
        <section className="mx-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[17px] text-primary">edit_note</span>
            {bn ? 'বিশেষ নির্দেশনা' : 'Special instructions'}
            <span className="text-[10px] font-normal text-on-surface-variant">({bn ? 'ঐচ্ছিক' : 'optional'})</span>
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder={bn ? 'যেমন: কলা পাকলে নিবেন না, চালের বস্তা ভালো করে দেখবেন' : 'e.g. pick dry rice sacks, no ripe bananas'}
            className="w-full resize-none rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-3 py-2 text-[12px] text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
          />
        </section>

        {/* Bill */}
        <section className="mx-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <h2 className="text-[13.5px] font-bold text-on-surface">{bn ? 'বিলের হিসাব' : 'Bill summary'}</h2>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-on-surface-variant">{bn ? 'পণ্যের দাম (আনুমানিক)' : 'Items total (approx)'}</span>
              <span className="font-semibold text-on-surface">{tk(cartTotal, state.lang)}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-on-surface-variant">
                {bn ? 'ডেলিভারি ফি' : 'Delivery fee'}
                <span className="ml-1 text-[10px] text-on-surface-variant/70">
                  ({state.areas.find(a => a.id === state.selectedAreaId)?.nameBn})
                </span>
              </span>
              <span className="font-semibold text-on-surface">{tk(cartDeliveryFee, state.lang)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-primary">{bn ? 'ছাড়' : 'Discount'} {state.appliedPromo ? `(${state.appliedPromo.code})` : ''}</span>
                <span className="font-semibold text-primary">− {tk(cartDiscount, state.lang)}</span>
              </div>
            )}
            <div className="my-1 h-px bg-dashed border-t border-dashed border-outline-variant" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-on-surface">{bn ? 'সর্বমোট' : 'Total'}</span>
              <span className="text-[19px] font-bold text-primary-deep">{tk(cartFinal, state.lang)}</span>
            </div>
            <p className="rounded-lg bg-surface-container px-2 py-1.5 text-[10px] leading-snug text-on-surface-variant">
              {bn ? 'পণ্যের দাম আনুমানিক। বাজারের রসিদ অনুযায়ী চূড়ান্ত দাম নির্ধারিত হবে — কোনো মার্কআপ নেই।' : 'Product prices are approximate and settled from the bazaar receipt. No markup.'}
            </p>
          </div>
        </section>
      </div>

      {/* Checkout bar */}
      <div
        className="fixed left-1/2 z-cartbar w-full max-w-app -translate-x-1/2 border-t border-outline-variant/60 bg-surface/95 px-4 py-2.5 backdrop-blur"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] leading-tight text-on-surface-variant">{bn ? 'সর্বমোট (ডেলিভারি সহ)' : 'Total with delivery'}</p>
            <p className="text-[19px] font-bold leading-tight text-primary-deep">{tk(cartFinal, state.lang)}</p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-deep to-primary text-[13.5px] font-bold text-white shadow-sm active:scale-[0.99]"
          >
            {bn ? 'চেকআউট করুন' : 'Proceed to checkout'}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
