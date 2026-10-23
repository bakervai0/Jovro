import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { CATEGORY_INFO } from '../../data/products';
import { PRODUCT_IMAGES } from '../../data/images';
import { fmtTk, toBnDigits, cartLineForPrice, primaryCartLine } from '../../services/orderUtils';
import type { CartItem, Product, ProductCategory } from '../../types';

// ── Stitch 10 · Bazaar Catalogue ──────────────────────────────
// Left category rail (material icons per the design), product
// rows with photo / availability badge / approx price, floating
// chat button and the persistent View Cart bar. The header's
// search icon expands the search field (seeded from Home's ?q=).

const RAIL: { id: ProductCategory; icon: string; subEn: string; bannerBn: string; bannerEn: string }[] = [
  { id: 'rice-pulses', icon: 'grain', subEn: 'Rice & Pulses', bannerBn: 'চাল ও ডাল সামগ্রী', bannerEn: 'Chaal & Daal Essentials' },
  { id: 'oil-spices', icon: 'liquor', subEn: 'Spices', bannerBn: 'তেল ও মসলা সামগ্রী', bannerEn: 'Oil & Spices Essentials' },
  { id: 'vegetables', icon: 'nutrition', subEn: 'Vegetables', bannerBn: 'তাজা সবজি', bannerEn: 'Fresh Vegetables' },
  { id: 'fish-meat', icon: 'set_meal', subEn: 'Fish & Meat', bannerBn: 'মাছ ও মাংস', bannerEn: 'Fish & Meat' },
  { id: 'milk-eggs', icon: 'egg', subEn: 'Milk & Eggs', bannerBn: 'দুধ ও ডিম', bannerEn: 'Milk & Eggs' },
  { id: 'snacks', icon: 'cookie', subEn: 'Snacks', bannerBn: 'নাস্তা সামগ্রী', bannerEn: 'Snacks & More' },
];

function CatalogueRow({ product }: { product: Product }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  // Stepper acts on the real cart line (pack / price-split safe).
  const line = cartLineForPrice(state.cart, product.id, product.approxPrice) ?? primaryCartLine(state.cart, product.id);
  const qty = line?.quantity ?? 0;
  const name = bn ? product.nameBn : product.nameEn;
  const subName = bn ? product.nameEn : product.nameBn;
  const unit = bn ? product.unit : product.unitEn;
  const subUnit = bn ? product.unitEn : product.unit;

  const addToCart = () => {
    const item: CartItem = {
      id: product.id,
      productId: product.id,
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      quantity: 1,
      price: product.approxPrice,
      unit: product.unit,
      source: 'bazaar',
      isApproxPrice: true,
    };
    dispatch({ type: 'ADD_TO_CART', item });
  };

  const updateQty = (delta: number) => {
    if (!line) return;
    const newQty = line.quantity + delta;
    if (newQty <= 0) dispatch({ type: 'REMOVE_FROM_CART', id: line.id });
    else dispatch({ type: 'UPDATE_CART_QTY', id: line.id, qty: newQty });
  };

  return (
    <div
      className={clsx(
        'bg-surface-container-lowest rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-shadow',
        qty > 0 ? 'border-2 border-primary' : 'border border-outline-variant/30',
        !product.isAvailable && 'opacity-60',
      )}
    >
      <div className="flex gap-2.5">
        {/* Product photo (emoji fallback) → product detail */}
        <button
          type="button"
          onClick={() => navigate(`/product/${product.id}`)}
          className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0 relative border border-outline-variant/20 flex items-center justify-center text-[36px]"
          aria-label={name}
        >
          {PRODUCT_IMAGES[product.id]
            ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            : product.imageEmoji}
        </button>

        {/* Info & actions */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <button type="button" onClick={() => navigate(`/product/${product.id}`)} className="text-left">
              <h3 className="text-body-md font-body-md font-bold text-on-surface leading-tight">{name}</h3>
            </button>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
              {subName} • {bn ? `১ ${unit}` : `1 ${unit}`} / 1 {subUnit}
            </p>
            {product.isAvailable ? (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                <span>{bn ? 'সাধারণত পাওয়া যায়' : 'Usually available'}</span>
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-error bg-error/10 px-1.5 py-0.5 rounded font-medium">
                <span className="material-symbols-outlined text-[12px]">block</span>
                <span>{bn ? 'এখন পাওয়া যাচ্ছে না' : 'Currently unavailable'}</span>
              </div>
            )}
          </div>

          {/* Price & add / stepper */}
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={clsx('text-body-lg font-body-lg font-bold', qty > 0 ? 'text-primary' : 'text-on-surface')}>
                  {fmtTk(product.approxPrice, lang)}
                </span>
                <span className="text-[10px] text-on-surface-variant font-normal">/ {unit}</span>
              </div>
              <p className="text-[9px] text-on-surface-variant/80 leading-none">
                {bn ? 'রসিদ অনুযায়ী পাকা মূল্য' : 'Final price per bazaar receipt'}
              </p>
            </div>

            {!product.isAvailable ? (
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                {bn ? 'স্টক নেই' : 'Out of stock'}
              </span>
            ) : qty > 0 ? (
              <div className="flex items-center bg-primary text-on-primary rounded-full px-1 py-0.5 shadow-sm">
                <button
                  type="button"
                  aria-label={bn ? 'পরিমাণ কমান' : 'Decrease quantity'}
                  onClick={() => updateQty(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary-container active:scale-90 transition-transform text-on-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="px-2 font-bold text-label-md font-label-md">{toBnDigits(qty, lang)}</span>
                <button
                  type="button"
                  aria-label={bn ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                  onClick={() => updateQty(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary-container active:scale-90 transition-transform text-on-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="px-3 h-8 rounded-full border border-primary text-primary hover:bg-primary hover:text-on-primary active:scale-95 duration-150 text-label-md font-label-md font-semibold flex items-center gap-1 bg-surface-container-lowest whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>{bn ? 'যোগ করুন' : 'Add'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BazaarScreen() {
  const { state, dispatch, cartCount, cartTotal, currentArea } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  // Home screen deep-links: ?q= (search bar) and ?category= (category rail)
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [searchOpen, setSearchOpen] = useState(() => (searchParams.get('q') ?? '') !== '');
  const [category, setCategory] = useState<ProductCategory>(() => {
    const c = searchParams.get('category');
    return c && RAIL.some(x => x.id === c) ? (c as ProductCategory) : 'rice-pulses';
  });

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    let items = state.products;
    if (searching) {
      const q = query.trim().toLowerCase();
      items = items.filter(p =>
        p.nameBn.includes(query.trim()) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.includes(q)),
      );
    } else {
      items = items.filter(p => p.category === category);
    }
    return items;
  }, [query, category, state.products, searching]);

  const activeRail = RAIL.find(r => r.id === category) ?? RAIL[0];
  const areaName = currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : '';
  const areaSub = currentArea ? (bn ? currentArea.nameEn : currentArea.nameBn) : '';

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Header (Stitch 10) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full px-margin h-14">
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              aria-label={bn ? 'ফিরে যান' : 'Go Back'}
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 duration-150 text-on-surface"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface tracking-tight leading-tight">
                {bn ? 'কাঁচাবাজার ক্যাটালগ' : 'Bazaar Catalogue'}
              </h1>
              <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant block -mt-0.5">
                {bn ? 'Bazaar Catalogue' : 'কাঁচাবাজার ক্যাটালগ'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              aria-label={bn ? 'পণ্য খুঁজুন' : 'Search items'}
              onClick={() => setSearchOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 duration-150 text-on-surface"
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full border border-outline-variant/40 bg-surface-container-low/60 hover:bg-surface-container-low active:scale-95 duration-150 text-bilingual-sub font-bilingual-sub text-primary font-bold"
            >
              বাংলা | EN
            </button>
          </div>
        </div>

        {/* Location badge & bazaar status */}
        <div className="px-margin pb-space-sm flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/area')}
            className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full text-label-md font-label-md text-on-surface min-w-0"
          >
            <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
            <span className="truncate">{areaName}{areaName ? ', ' : ''}{bn ? 'লালমনিরহাট' : 'Lalmonirhat'}</span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-normal whitespace-nowrap">{areaSub}</span>
          </button>
          <div className="flex items-center gap-1 text-label-sm font-label-sm text-primary bg-primary-fixed/20 px-2 py-0.5 rounded-full shrink-0">
            <span className={clsx('w-1.5 h-1.5 rounded-full bg-primary', state.isServiceOpen && 'animate-pulse')} />
            <span>{state.isServiceOpen ? (bn ? 'বাজার খোলা' : 'Bazaar open') : (bn ? 'বাজার বন্ধ' : 'Bazaar closed')}</span>
          </div>
        </div>

        {/* Reassurance banner */}
        <div className="bg-primary/5 px-margin py-2.5 border-t border-b border-primary/10 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface leading-tight">
            <strong className="font-semibold text-primary">
              {bn ? 'বাজারের রসিদের পাকা মূল্যে কেনাকাটা' : 'Shopping at the bazaar receipt price'}
            </strong>
            {bn
              ? ` • বাড়তি কোনো মূল্য নেই, শুধু মাত্র নিশ্চিত সাইকেল ডেলিভারি ফি (${fmtTk(currentArea?.fee ?? 20, lang)})।`
              : ` • No markup at all — only the fixed bicycle delivery fee (${fmtTk(currentArea?.fee ?? 20, lang)}).`}
          </p>
        </div>

        {/* Expanding search field (header search icon) */}
        {searchOpen && (
          <div className="px-margin pb-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={bn ? 'পণ্যের নাম লিখুন...' : 'Search products...'}
                className="w-full h-11 pl-10 pr-10 rounded-full bg-surface-container-low border border-outline-variant/40 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {query && (
                <button
                  type="button"
                  aria-label={bn ? 'সার্চ মুছুন' : 'Clear search'}
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Category rail + product listing */}
      <main className="flex flex-1 w-full overflow-hidden">
        {/* Left category rail */}
        <aside className="w-[98px] flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col py-space-sm gap-1 select-none overflow-y-auto no-scrollbar">
          {RAIL.map(cat => {
            const active = !searching && category === cat.id;
            const info = CATEGORY_INFO[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategory(cat.id); setQuery(''); }}
                className={clsx(
                  'flex flex-col items-center justify-center py-2.5 px-1 relative transition-all text-center group',
                  active ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-low',
                )}
              >
                {active && <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r" />}
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-105',
                  active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface',
                )}>
                  <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                </div>
                <span className="text-label-md font-label-md leading-tight">{bn ? info.nameBn : info.nameEn}</span>
                <span className={clsx(
                  'text-label-sm font-label-sm font-normal',
                  active ? 'text-primary/80' : 'text-on-surface-variant/70',
                )}>{bn ? cat.subEn : info.nameBn}</span>
              </button>
            );
          })}
        </aside>

        {/* Product listing */}
        <section className="flex-1 px-space-md py-space-sm overflow-y-auto no-scrollbar space-y-3 pb-[150px]">
          {/* Category banner & service timing */}
          <div className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/30 flex justify-between items-center gap-2">
            <div className="min-w-0">
              <h2 className="text-label-lg font-label-lg text-on-surface font-bold truncate">
                {searching ? (bn ? 'খোঁজার ফলাফল' : 'Search results') : (bn ? activeRail.bannerBn : activeRail.bannerEn)}
              </h2>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
                {searching ? (bn ? 'Search Results' : 'খোঁজার ফলাফল') : (bn ? activeRail.bannerEn : activeRail.bannerBn)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-primary font-semibold bg-surface-container-lowest px-2 py-0.5 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {bn ? 'সকাল ৬টা - রাত ১০:৩০' : '6 AM - 10:30 PM'}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">search_off</span>
              <p className="text-body-lg font-medium text-on-surface-variant">
                {bn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
              </p>
              {searching && (
                <button type="button" onClick={() => setQuery('')} className="text-primary text-body-sm font-medium">
                  {bn ? 'সার্চ মুছুন' : 'Clear search'}
                </button>
              )}
            </div>
          ) : (
            filtered.map(p => <CatalogueRow key={p.id} product={p} />)
          )}
        </section>
      </main>

      {/* Floating chat button (app pattern: in-app assistant) */}
      <div className={clsx(
        'fixed left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none',
        cartCount > 0 ? 'bottom-[136px]' : 'bottom-[76px]',
      )}>
        <div className="flex justify-end px-4">
          <button
            type="button"
            onClick={() => navigate('/ai')}
            aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
            className="pointer-events-auto relative w-[52px] h-[52px] bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-white"
          >
            <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-container border-2 border-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Persistent bottom cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-app z-40 px-margin pb-2 pointer-events-none">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="pointer-events-auto w-full bg-primary text-on-primary rounded-full px-4 py-2.5 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] filled-symbol">shopping_bag</span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-label-lg font-label-lg font-bold">{bn ? 'কার্ট দেখুন' : 'View cart'}</span>
                  <span className="text-bilingual-sub font-bilingual-sub opacity-90">• {bn ? 'View cart' : 'কার্ট দেখুন'}</span>
                </div>
                <p className="text-label-sm font-label-sm opacity-90 leading-none">
                  {bn
                    ? `${toBnDigits(cartCount, lang)} টি পণ্য (${cartCount} items) • আনুমানিক ${fmtTk(cartTotal, lang)}`
                    : `${cartCount} items • Approx ${fmtTk(cartTotal, lang)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-label-md font-label-md">
              <span>{bn ? 'এগিয়ে যান' : 'Proceed'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
