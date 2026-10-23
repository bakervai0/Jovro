import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { LangToggle, SectionHeading } from '../../components/layout/Headers';
import { SearchBar } from '../../components/ui/SearchBar';
import { ProductCard } from '../../components/shared/ProductCard';
import { AddButton, QuantityStepper } from '../../components/ui/Stepper';
import { addMenuItemToCart } from '../../lib/cartUtils';
import { searchCatalog, type SearchHit } from '../../lib/search';
import { tk, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import { POPULAR_SEARCHES } from '../../data/products';

const RECENT_KEY = 'jovro_recent_searches';

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ['মিনিকেট চাল', 'নান্না বিরিয়ানি', 'ডিম'];
  } catch {
    return ['মিনিকেট চাল', 'নান্না বিরিয়ানি', 'ডিম'];
  }
}

function saveRecent(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export default function SearchScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bn = state.lang === 'bn';

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [tab, setTab] = useState<'all' | 'bazaar' | 'restaurant'>('all');
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [bundleOpen, setBundleOpen] = useState(false);

  useEffect(() => {
    const q = params.get('q');
    if (q && q !== query) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const hits = useMemo(
    () => searchCatalog(state.products, state.restaurants, query),
    [state.products, state.restaurants, query],
  );

  const productHits = hits.filter(h => h.kind === 'product');
  const menuHits = hits.filter(h => h.kind === 'menu');
  const visible = tab === 'bazaar' ? productHits : tab === 'restaurant' ? menuHits : hits;

  const remember = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...recent.filter(r => r !== v)].slice(0, 5);
    setRecent(next);
    saveRecent(next);
  };

  const runSearch = (value: string) => {
    setQuery(value);
    remember(value);
    setParams(value ? { q: value } : {});
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const cartQtyFor = (itemId: string) => state.cart.find(c => c.id === itemId)?.quantity ?? 0;

  const showEmpty = query.trim().length > 0 && hits.length === 0;

  return (
    <div className="screen-scroll bg-surface">
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-outline-variant/40 bg-surface/95 px-3 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          aria-label={bn ? 'ফিরে যান' : 'Back'}
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-on-surface active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[23px]">arrow_back</span>
        </button>
        <SearchBar
          value={query}
          onChange={v => { setQuery(v); setParams(v ? { q: v } : {}); }}
          onSubmit={runSearch}
          autoFocus={!query}
          tone="outline"
          className="min-w-0 flex-1"
        />
        <LangToggle compact />
      </div>

      {/* Search hint */}
      {!showEmpty && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-2xl bg-surface-container px-3 py-2">
          <span className="text-[14px] leading-none">💡</span>
          <p className="text-[11.5px] leading-relaxed text-on-surface-variant">
            {bn ? (
              <>
                বাংলা, English ও রোমান অক্ষরে মিলিয়ে খোঁজা হচ্ছে — <b className="text-primary-deep">চাল / chaal / rice</b> একই ফলাফল দেখাবে
              </>
            ) : (
              <>Searching Bangla, English and romanised spellings — <b className="text-primary-deep">চাল / chaal / rice</b> all match the same results</>
            )}
          </p>
        </div>
      )}

      {!query.trim() && (
        <div className="flex flex-col gap-4 pb-6">
          <section className="px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                {bn ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent searches'} <span className="font-normal normal-case opacity-80">(RECENT SEARCHES)</span>
              </h2>
              {recent.length > 0 && (
                <button onClick={clearRecent} className="text-[11.5px] font-medium text-on-surface-variant underline decoration-dotted">
                  {bn ? 'মুছে ফেলুন' : 'Clear'}
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map(r => (
                <span key={r} className="flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest py-1 pl-3 pr-2 text-[12.5px] font-medium text-on-surface shadow-card">
                  <button onClick={() => runSearch(r)}>{r}</button>
                  <button
                    onClick={() => { const next = recent.filter(x => x !== r); setRecent(next); saveRecent(next); }}
                    aria-label="remove"
                    className="text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
              {recent.length === 0 && (
                <p className="text-[12px] text-on-surface-variant">{bn ? 'এখনো কিছু খোঁজা হয়নি' : 'No searches yet'}</p>
              )}
            </div>
          </section>

          <section className="px-4">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary">
              <span className="material-symbols-outlined filled-symbol text-[15px]">local_fire_department</span>
              {bn ? 'আজকের জনপ্রিয়' : 'Popular today'} <span className="font-normal normal-case opacity-80">(POPULAR TODAY)</span>
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(p => (
                <button
                  key={p}
                  onClick={() => runSearch(p)}
                  className="rounded-full border border-secondary-bright/50 bg-surface-container-lowest px-3 py-1.5 text-[12.5px] font-medium text-secondary"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section className="px-4">
            <SectionHeading titleBn="বাজার ও রেস্টুরেন্ট একসাথে" titleEn="Browse everything" />
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {[
                { icon: 'storefront', bn: 'কাঁচাবাজার', en: 'Grocery', path: '/bazaar', tint: 'bg-primary-soft text-primary-deep' },
                { icon: 'restaurant', bn: 'রেস্টুরেন্ট', en: 'Restaurants', path: '/food', tint: 'bg-secondary-soft text-secondary' },
                { icon: 'bolt', bn: 'ফ্ল্যাশ মেল', en: 'Flash sale', path: '/bazaar', tint: 'bg-secondary-soft text-secondary' },
                { icon: 'smart_toy', bn: 'সহায়ক', en: 'AI helper', path: '/ai', tint: 'bg-tertiary-soft text-tertiary' },
              ].map(card => (
                <button
                  key={card.en}
                  onClick={() => navigate(card.path)}
                  className="flex items-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-left shadow-card"
                >
                  <span className={clsx('grid h-9 w-9 place-items-center rounded-xl', card.tint)}>
                    <span className="material-symbols-outlined text-[19px]">{card.icon}</span>
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-semibold text-on-surface">{bn ? card.bn : card.en}</span>
                    <span className="block text-[10px] text-on-surface-variant">{card.en}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showEmpty && (
        <div className="pb-40">
          {/* design 2.5 — not found in catalogue */}
          <div className="mx-4 mt-2 rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 text-center shadow-card">
            <div className="relative mx-auto h-24 w-24">
              <span className="absolute inset-0 grid place-items-center rounded-full bg-primary-soft">
                <span className="material-symbols-outlined text-[44px] text-primary">search</span>
              </span>
              <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-secondary-bright text-white shadow-sm ring-2 ring-white">
                <span className="material-symbols-outlined text-[19px]">two_wheeler</span>
              </span>
            </div>
            <h2 className="mt-3 text-[19px] font-bold leading-snug text-on-surface">
              {bn ? 'পাওয়া যায়নি — লিখে দিন, কিনে এনে দেব!' : 'Not found — tell us and we’ll buy it!'}
            </h2>
            <p className="mx-auto mt-1 max-w-[300px] text-[12.5px] leading-relaxed text-on-surface-variant">
              {bn
                ? 'Not found in catalogue? Type it and your personal shopper will buy it from the bazaar for you.'
                : 'Not found in catalogue? Type it and your personal shopper will buy it from the bazaar for you.'}
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-container px-3 py-2.5 text-left">
              <span className="material-symbols-outlined text-[18px] text-primary">storefront</span>
              <p className="text-[11.5px] leading-relaxed text-on-surface-variant">
                {bn ? 'আপের তালিকায় হয়তো ফলটি এখনো ওঠেনি, কিন্তু ' : 'It may not be in our catalogue yet, but '}
                <b className="text-primary-deep">{bn ? 'গোশালা বাজার' : 'Goshala Bazar'}</b>
                {bn ? ' বা শহরের যেকোনো দোকান থেকে আমাদের সাইকেল রাইডার আপনার জন্য খুঁজে কিনে নিয়ে আসবে।' : ' or any shop in town — our rider will find and buy it for you.'}
              </p>
            </div>
          </div>

          {/* custom request form */}
          <div className="mx-4 mt-4 rounded-3xl border-2 border-secondary-bright/50 bg-secondary-soft p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-secondary-bright shadow-card">
                  <span className="material-symbols-outlined text-[19px]">edit_note</span>
                </span>
                <div>
                  <h3 className="text-[15px] font-bold leading-tight text-secondary">{bn ? 'বাজারের ফর্দ লিখুন' : 'Write your bazaar list'}</h3>
                  <p className="text-[10.5px] text-secondary/80">Custom Bazaar Request</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[9.5px] font-semibold text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-bright" />
                {bn ? 'সরাসরি বাজার সেবা' : 'Direct bazaar'}
              </span>
            </div>

            <p className="mt-3 text-[11.5px] font-semibold text-on-surface">{bn ? 'পণ্যের বিবরণ ও আনুমানিক পরিমাণ:' : 'Item details and approximate quantity:'}</p>
            <div className="relative mt-1.5 rounded-xl border border-secondary-bright/60 bg-white">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={3}
                placeholder={bn ? 'যেমন: ড্রাগন ফল ২টা (লাল বা সাদা), ভালো দেখে মিষ্টি সাইজ লাগবে। দাম আনুমানিক ২০০-৩০০ টাকার মধ্যে হলে নিব।' : 'e.g. 2 dragon fruits, sweet and ripe, budget around 200–300 taka.'}
                className="w-full resize-none rounded-xl bg-transparent px-3 py-2.5 text-[12.5px] leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/60"
              />
              <span className="absolute bottom-1.5 right-2 rounded bg-surface-container px-1.5 py-0.5 text-[9px] text-on-surface-variant">
                {bn ? 'হাতে লেখা ফর্দ' : 'Handwritten list'}
              </span>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-snug text-secondary">
              <span className="material-symbols-outlined text-[14px]">info</span>
              {bn ? 'আনুমানিক বাজেট বা পরিমাণ উল্লেখ করলে সুবিধা হয় (Helpful for shopper)' : 'Mentioning a budget or quantity helps your shopper'}
            </p>

            <button
              onClick={() => { remember(query); navigate(`/ai?q=${encodeURIComponent(query)}`); }}
              disabled={!query.trim()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-deep text-[13.5px] font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {bn ? 'অর্ডারে যোগ করুন / Add to Order' : 'Add to Order / অর্ডারে যোগ করুন'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <div className="mt-3 flex items-start gap-2 border-t border-secondary-bright/25 pt-2.5">
              <span className="material-symbols-outlined text-[17px] text-primary">verified_user</span>
              <p className="text-[10.5px] leading-relaxed text-secondary/90">
                <b>{bn ? 'স্বচ্ছ রসিদ নিশ্চয়তা:' : 'Receipt guarantee:'}</b>{' '}
                {bn
                  ? 'বাজার থেকে কেনার পর আসল মেমো/রসিদ আপনাকে দেওয়া হবে। পণ্যের কোনো বাড়তি দাম নেওয়া হয় না, শুধু সাইকেলে ডেলিভারি ফি।'
                  : 'You get the real bazaar memo. No product markup — only the cycle delivery fee.'}
              </p>
            </div>
          </div>

          {/* popular categories */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between px-4">
              <h2 className="text-[17px] font-bold text-on-surface">{bn ? 'অথবা এগুলো দেখতে পারেন' : 'Or browse these'}</h2>
              <span className="text-[11px] text-on-surface-variant">Popular categories</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2.5 px-4">
              {[
                { icon: 'nutrition', bn: 'তাজা মৌসুমি ফল', en: 'Seasonal Fruits', path: '/bazaar?category=vegetables', tint: 'bg-primary-soft text-primary' },
                { icon: 'eco', bn: 'গোশালা কাঁচাবাজার', en: 'Fresh Vegetables', path: '/bazaar?category=vegetables', tint: 'bg-primary-soft text-primary' },
                { icon: 'restaurant', bn: 'নান্না বিরিয়ানি', en: 'Local Restaurants', path: '/food', tint: 'bg-secondary-soft text-secondary' },
                { icon: 'shopping_basket', bn: 'চাল ও ডাল সামগ্রী', en: 'Grocery Essentials', path: '/bazaar?category=rice-pulses', tint: 'bg-[#FDF6E3] text-[#B45309]' },
              ].map(item => (
                <button
                  key={item.en}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-left shadow-card"
                >
                  <span className={clsx('grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl', item.tint)}>
                    <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-bold text-on-surface">{bn ? item.bn : item.en}</span>
                    <span className="block truncate text-[10.5px] text-on-surface-variant">{item.en}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* help */}
          <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-card">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[19px] text-primary">support_agent</span>
              {bn ? 'খুঁজে পেতে সমস্যা হচ্ছে?' : 'Need help finding it?'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigate('/contact')} className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1.5 text-[11px] font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[14px]">call</span>
                {bn ? 'কল দিন' : 'Call'}
              </button>
              <button onClick={() => { remember(query); navigate(`/ai?q=${encodeURIComponent(query)}`); }} className="flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1.5 text-[11px] font-semibold text-primary-deep">
                <span className="material-symbols-outlined text-[14px]">chat</span>
                {bn ? 'ফর্দ পাঠান' : 'Send list'}
              </button>
            </div>
          </div>
        </div>
      )}

      {query.trim() && !showEmpty && (
        <div className="pb-44">
          {/* Tabs */}
          <div className="sticky top-0 z-20 flex border-b border-outline-variant/50 bg-surface/95 backdrop-blur">
            {[
              { id: 'all' as const, bn: 'সব', en: 'All', count: hits.length },
              { id: 'bazaar' as const, bn: 'কাঁচাবাজার', en: 'Bazaar', count: productHits.length },
              { id: 'restaurant' as const, bn: 'রেস্টুরেন্ট', en: 'Restaurant', count: menuHits.length },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'relative flex-1 px-2 py-2.5 text-[13.5px] font-semibold transition-colors',
                  tab === t.id ? 'text-primary-deep' : 'text-on-surface-variant',
                )}
              >
                {bn ? t.bn : t.en} ({toBn(t.count, state.lang)})
                {tab === t.id && <span className="absolute inset-x-6 bottom-0 h-[2.5px] rounded-t-full bg-primary" />}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 px-4 pt-3">
            {visible.map((hit, idx) => {
              if (hit.kind === 'product' && hit.product) {
                return <ProductCard key={`p-${hit.product.id}`} product={hit.product} variant="search" highlighted={idx === 0 && tab !== 'restaurant'} />;
              }
              const restaurant = hit.restaurant!;
              const item = hit.item!;
              const qty = cartQtyFor(item.id);
              return (
                <article key={`m-${item.id}`} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-card">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="h-[88px] w-[88px] overflow-hidden rounded-xl bg-surface-container">
                        {item.image || restaurant.image ? (
                          <img src={asset(item.image ?? restaurant.image)} alt={item.nameEn} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-secondary-soft text-[32px]">{restaurant.imageEmoji ?? '🍽️'}</div>
                        )}
                      </div>
                      <span className="absolute left-1 top-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {bn ? 'রেস্টুরেন্ট' : 'Restaurant'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14.5px] font-bold leading-snug text-on-surface">{bn ? item.nameBn : item.nameEn}</h3>
                      <p className="truncate text-[11px] text-on-surface-variant">{bn ? item.nameEn : item.nameBn}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-secondary">
                        <span className="material-symbols-outlined text-[13px]">restaurant</span>
                        {bn ? restaurant.nameBn : restaurant.nameEn}
                        <span className="text-on-surface-variant">• {restaurant.areaBn}</span>
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-on-surface-variant">
                        {bn ? 'ডেলিভারি' : 'Delivery'} {tk(restaurant.deliveryFee ?? 40, state.lang)}
                        <span className="px-1">•</span>
                        {toBn(restaurant.deliveryTimeMin, state.lang)}-{toBn(restaurant.deliveryTimeMin + 10, state.lang)} {bn ? 'মিনিট' : 'min'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[17px] font-bold text-on-surface">{tk(item.price, state.lang)}</p>
                    {qty > 0 ? (
                      <QuantityStepper
                        qty={qty}
                        size="md"
                        onDecrease={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: qty - 1 })}
                        onIncrease={() => addMenuItemToCart(dispatch, restaurant, item)}
                      />
                    ) : (
                      <AddButton
                        onClick={() => addMenuItemToCart(dispatch, restaurant, item)}
                        size="md"
                        labelBn={bn ? 'যোগ করুন' : 'Add'}
                        labelEn=""
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl bg-primary-tint p-3">
            <span className="material-symbols-outlined text-[19px] text-primary">verified_user</span>
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              <b className="block text-primary-deep">{bn ? 'স্বচ্ছতা ও আসল দামের নিশ্চয়তা' : 'Transparency & real prices'}</b>
              {bn
                ? 'আমাদের কোনো পণ্যে অতিরিক্ত চার্জ নেই। রসিদ দেখে আসল বাজার মূল্যে পণ্য বুঝিয়ে দেব, শুধু সাইকেলে ডেলিভারি চার্জ নেওয়া হয়।'
                : 'No extra charge on any product. You pay the receipt price plus only the cycle delivery fee.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
