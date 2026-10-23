import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { RESTAURANT_IMAGES } from '../../data/images';
import { fmtTk, toBnDigits } from '../../services/orderUtils';
import type { Restaurant } from '../../types';

// ── Stitch 12 · Restaurant List ───────────────────────────────
// Header with location strip, cuisine filter rail, no-markup
// trust banner, and photo cards with open-status + time badges.
// Prices/ratings come from state.restaurants; the delivery fee
// shown is the customer's area fee (the app charges by area —
// the design shows per-restaurant fees).

const FILTERS: { id: string; icon: string; bn: string; en: string; iconClass: string }[] = [
  { id: 'all', icon: 'restaurant', bn: 'সব রেস্টুরেন্ট (All)', en: 'All Restaurants', iconClass: '' },
  { id: 'বিরিয়ানি', icon: 'rice_bowl', bn: 'বিরিয়ানি ও পোলাও', en: 'Biryani & Polao', iconClass: 'text-secondary' },
  { id: 'ভাত-তরকারি', icon: 'dinner_dining', bn: 'দেশি ভাত-হোটেল', en: 'Deshi Rice Hotels', iconClass: 'text-outline' },
  { id: 'চা-নাস্তা', icon: 'cake', bn: 'মিষ্টি ও নাস্তা', en: 'Sweets & Snacks', iconClass: 'text-secondary' },
  { id: 'ফাস্ট ফুড', icon: 'fastfood', bn: 'ফাস্টফুড', en: 'Fast Food', iconClass: 'text-tertiary' },
];

function RestaurantCard({ restaurant, fee }: { restaurant: Restaurant; fee: number }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const photo = RESTAURANT_IMAGES[restaurant.id];
  const timeRange = `${toBnDigits(restaurant.deliveryTimeMin, lang)}-${toBnDigits(restaurant.deliveryTimeMin + 10, lang)} ${bn ? 'মিনিট' : 'min'}`;

  return (
    <article
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="relative h-40 w-full bg-surface-container overflow-hidden">
        {photo ? (
          <img
            src={photo} alt={bn ? restaurant.nameBn : restaurant.nameEn}
            className={clsx('absolute inset-0 w-full h-full object-cover', !restaurant.isOpen && 'grayscale opacity-70')}
            loading="lazy"
          />
        ) : (
          <div className={clsx('absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high', !restaurant.isOpen && 'grayscale opacity-70')}>
            <span className="text-[64px]">{restaurant.imageEmoji ?? '🍽️'}</span>
          </div>
        )}
        <div className={clsx(
          'absolute top-2.5 left-2.5 flex items-center space-x-1.5 backdrop-blur px-2.5 py-1 rounded-full shadow-sm',
          restaurant.isOpen ? 'bg-surface-container-lowest/95' : 'bg-surface-container-lowest/90',
        )}>
          <span className={clsx('w-2 h-2 rounded-full', restaurant.isOpen ? 'bg-primary animate-pulse' : 'bg-error')} />
          <span className={clsx('text-label-sm font-label-sm font-semibold', restaurant.isOpen ? 'text-primary' : 'text-error')}>
            {restaurant.isOpen
              ? `${bn ? 'খোলা আছে' : 'Open'}${restaurant.closingTime ? ` • ${bn ? 'রাত' : 'till'} ${restaurant.closingTime}${bn ? ' পর্যন্ত' : ''} / Open now` : ''}`
              : `${bn ? 'বন্ধ আছে / Closed' : 'Closed'}`}
          </span>
        </div>
        <div className="absolute bottom-2.5 right-2.5 bg-surface-container-lowest/95 backdrop-blur px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1">
          <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
          <span className="text-label-sm font-label-sm font-bold text-on-surface">{timeRange}{bn ? ' / ' : ' '}{restaurant.deliveryTimeMin}-{restaurant.deliveryTimeMin + 10} mins</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-headline-sm font-headline-sm text-on-surface leading-tight">
            {bn ? restaurant.nameBn : restaurant.nameEn}{' '}
            <span className="text-body-md font-body-md text-on-surface-variant font-normal">/ {bn ? restaurant.nameEn : restaurant.nameBn}</span>
          </h3>
          <div className="flex items-center space-x-1 bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-secondary-container/30 shrink-0">
            <span className="material-symbols-outlined text-[14px] text-secondary filled-symbol">star</span>
            <span className="text-label-md font-label-md font-bold text-on-surface">{restaurant.rating}</span>
            <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">({restaurant.ratingCount}+)</span>
          </div>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
          {bn ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn} • {restaurant.address}
        </p>
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-dashed border-outline-variant/60 text-on-surface-variant">
          <div className="flex items-center space-x-1">
            <span className="material-symbols-outlined text-[16px] text-primary">pedal_bike</span>
            <span className="text-label-md font-label-md">
              {bn ? 'সাইকেল ডেলিভারি' : 'Bicycle delivery'} <strong className="text-on-surface font-bold">{fmtTk(fee, lang)}</strong>
            </span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant" />
          <div className="flex items-center space-x-1">
            <span className="material-symbols-outlined text-[16px] text-outline">shopping_bag</span>
            <span className="text-label-md font-label-md">
              {bn ? 'সর্বনিম্ন অর্ডার' : 'Min order'} <strong className="text-on-surface font-bold">{fmtTk(restaurant.minOrder, lang)}</strong>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FoodScreen() {
  const { state, dispatch, cartCount, cartFinal, cartDeliveryFee } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cuisine, setCuisine] = useState('all');

  const filtered = useMemo(() => {
    let items = state.restaurants;
    if (cuisine !== 'all') items = items.filter(r => r.cuisineTypeBn === cuisine);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(r => r.nameBn.includes(query) || r.nameEn.toLowerCase().includes(q));
    }
    return [...items].sort((a, b) => (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0));
  }, [state.restaurants, query, cuisine]);

  return (
    <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
      {/* Header (Stitch 12) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-margin h-14">
          <div className="flex items-center space-x-2">
            <button
              type="button" onClick={() => navigate(-1)} aria-label={bn ? 'ফিরে যান' : 'Go Back'}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                {bn ? 'আশেপাশের রেস্টুরেন্ট' : 'Restaurants Nearby'}
              </h1>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">Restaurants in Sadar</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button" aria-label={bn ? 'রেস্টুরেন্ট খুঁজুন' : 'Search Restaurants'}
              onClick={() => setSearchOpen(v => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-md text-label-md font-bold tracking-tight hover:bg-surface-container-high transition-colors"
            >
              বাংলা | EN
            </button>
          </div>
        </div>
        <div className="px-margin pb-2.5">
          <div className="flex items-center space-x-2 py-1.5 px-3 bg-surface-container-low rounded-xl text-on-surface">
            <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
            <p className="font-label-md text-label-md truncate text-on-surface font-medium">
              {bn ? 'মিশন মোড় ও লালমনিরহাট সদর এলাকা' : 'Mission Mor & Lalmonirhat Sadar area'} •{' '}
              <span className="text-primary font-bold">{bn ? 'সাইকেল ডেলিভারি' : 'Bicycle delivery'}</span>
            </p>
          </div>
          {searchOpen && (
            <div className="mt-2 flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-full pl-4 pr-1.5 h-11 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder={bn ? 'রেস্টুরেন্টের নাম লিখুন...' : 'Type a restaurant name...'}
                className="flex-1 bg-transparent outline-none text-body-md font-body-md text-on-surface placeholder:text-outline min-w-0"
              />
              {query && (
                <button type="button" aria-label="Clear" onClick={() => setQuery('')} className="w-8 h-8 rounded-full flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <main className="space-y-4 pt-2 pb-32">
          {/* Cuisine filter rail */}
          <section className="overflow-x-auto no-scrollbar pl-margin pr-margin flex items-center space-x-2 py-1">
            {FILTERS.map(f => {
              const selected = cuisine === f.id;
              return (
                <button
                  key={f.id} type="button" onClick={() => setCuisine(f.id)}
                  className={clsx(
                    'shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-full font-label-md text-label-md active:scale-95 transition-transform',
                    selected
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-sm',
                  )}
                >
                  <span className={clsx('material-symbols-outlined text-[16px]', !selected && f.iconClass)}>{f.icon}</span>
                  <span>{bn ? f.bn : f.en}</span>
                </button>
              );
            })}
          </section>

          {/* Trust banner */}
          <section className="px-margin">
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 flex items-start space-x-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              </div>
              <div className="flex-1">
                <p className="font-label-md text-label-md text-primary font-bold">{bn ? 'কোনো বাড়তি মেনু দাম নেই' : 'No menu price markup'}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug mt-0.5">
                  {bn ? 'রেস্টুরেন্টের নিজস্ব মেনু দামেই কেনা হয়, শুধু মাত্র নির্দিষ্ট সাইকেল ডেলিভারি ফি প্রযোজ্য।' : 'Food is bought at the restaurant’s own menu price — only the fixed bicycle delivery fee applies.'}
                </p>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="px-margin space-y-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">restaurant_menu</span>
                <p className="text-body-lg font-medium text-on-surface-variant">
                  {bn ? 'কোনো রেস্টুরেন্ট পাওয়া যায়নি' : 'No restaurants found'}
                </p>
              </div>
            ) : (
              filtered.map(r => <RestaurantCard key={r.id} restaurant={r} fee={cartDeliveryFee} />)
            )}
          </section>
        </main>
      </div>

      {/* Floating chat button + cart bar */}
      <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none">
        <div className="flex flex-col items-end gap-3 px-4">
          <button
            type="button" onClick={() => navigate('/ai')} aria-label={bn ? 'সহায়কের সাথে চ্যাট' : 'Chat with the assistant'}
            className="pointer-events-auto relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-primary text-white shadow-lg active:scale-95 duration-150 hover:scale-105 transition-transform border-2 border-white"
          >
            <span className="animate-ping absolute inset-0 rounded-full bg-primary opacity-30" />
            <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
          </button>
        </div>
        {cartCount > 0 && (
          <div className="px-4 mt-2 pointer-events-auto">
            <button
              type="button" onClick={() => navigate('/cart')}
              className="w-full h-14 bg-primary hover:bg-primary-container text-on-primary rounded-full shadow-lg flex items-center justify-between px-5 active:scale-[0.98] transition-transform font-label-lg text-label-lg font-bold"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined filled-symbol">shopping_cart</span>
                {toBnDigits(cartCount, lang)} {bn ? 'আইটেম' : 'items'}
              </span>
              <span>{bn ? 'কার্ট দেখুন • ' : 'View cart • '}{fmtTk(cartFinal, lang)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
