import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { HomeTopBar } from '../../components/layout/TopAppBar';
import { OrderCard } from '../../components/shared/OrderCard';
import { ProductCard } from '../../components/shared/ProductCard';
import { PRODUCTS } from '../../data/products';
import { RESTAURANTS } from '../../data/restaurants';
import { PROMO_CODES } from '../../data/seed';
import type { Restaurant } from '../../types';

// ── Promo Banner ────────────────────────────────────────────────
function PromoBanner() {
  const { state, t } = useApp();
  const lang = state.lang;
  const promo = PROMO_CODES.find(p => p.isActive);
  if (!promo) return null;
  return (
    <div className="mx-4 rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-white text-[22px]">local_offer</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg font-bold text-white">
          {lang === 'bn' ? promo.descriptionBn : promo.descriptionEn}
        </p>
        <p className="text-label-sm text-white/80 mt-0.5">
          {lang === 'bn' ? `কোড: ${promo.code}` : `Code: ${promo.code}`}
        </p>
      </div>
      <span className="material-symbols-outlined text-white/80 text-[18px]">chevron_right</span>
    </div>
  );
}

// ── Service Closed Banner ───────────────────────────────────────
function ServiceBanner({ type }: { type: 'closed' | 'slot_full' }) {
  const { state } = useApp();
  const lang = state.lang;
  const isClosed = type === 'closed';
  return (
    <div className={clsx(
      'mx-4 rounded-3xl p-3.5 flex items-center gap-3',
      isClosed ? 'bg-error/10 border border-error/20' : 'bg-tertiary/10 border border-tertiary/20',
    )}>
      <span className={clsx(
        'material-symbols-outlined text-[20px]',
        isClosed ? 'text-error' : 'text-tertiary',
      )}>
        {isClosed ? 'store_off' : 'event_busy'}
      </span>
      <p className={clsx('text-body-sm font-medium', isClosed ? 'text-error' : 'text-tertiary')}>
        {isClosed
          ? (lang === 'bn' ? 'এখন সার্ভিস বন্ধ। আগামীকাল সকাল ৮টায় খুলবে।' : 'Service closed. Opens tomorrow at 8 AM.')
          : (lang === 'bn' ? 'আজকের স্লট পূর্ণ হয়েছে। কাল আবার চেষ্টা করুন।' : 'Today\'s slots are full. Try again tomorrow.')}
      </p>
    </div>
  );
}

// ── Quick Actions ───────────────────────────────────────────────
function QuickActions() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const actions = [
    { icon: 'storefront', labelBn: 'বাজার', labelEn: 'Bazaar', path: '/bazaar', color: 'bg-primary/10 text-primary' },
    { icon: 'restaurant', labelBn: 'খাবার', labelEn: 'Food', path: '/food', color: 'bg-secondary/10 text-secondary' },
    { icon: 'smart_toy', labelBn: 'AI সহকারী', labelEn: 'AI Help', path: '/ai', color: 'bg-tertiary/10 text-tertiary' },
    { icon: 'loyalty', labelBn: 'অফার', labelEn: 'Offers', path: '/offers', color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {actions.map(a => (
        <button
          key={a.path}
          onClick={() => navigate(a.path)}
          className="flex flex-col items-center gap-1.5 py-3"
        >
          <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center', a.color)}>
            <span className="material-symbols-outlined text-[26px]">{a.icon}</span>
          </div>
          <span className="text-label-sm text-on-surface-variant font-medium text-center leading-tight">
            {lang === 'bn' ? a.labelBn : a.labelEn}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────
function SectionHeader({ titleBn, titleEn, onSeeAll }: { titleBn: string; titleEn: string; onSeeAll?: () => void }) {
  const { state } = useApp();
  const lang = state.lang;
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-title-sm font-bold text-on-surface">
        {lang === 'bn' ? titleBn : titleEn}
      </h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-label-md text-primary font-medium">
          {lang === 'bn' ? 'সব দেখুন' : 'See all'}
        </button>
      )}
    </div>
  );
}

// ── Active Order Banner ─────────────────────────────────────────
function ActiveOrderBanner() {
  const { state } = useApp();
  const lang = state.lang;
  const active = state.orders.find(o => ['pending', 'confirmed', 'buying', 'on-the-way'].includes(o.status));
  if (!active) return null;

  return (
    <div className="px-4">
      <OrderCard order={active} compact />
    </div>
  );
}

// ── Restaurant Card ─────────────────────────────────────────────
function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { state } = useApp();
  const lang = state.lang;
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-3 w-full text-left active:bg-surface-container transition-colors"
    >
      {/* Emoji */}
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-[36px] flex-shrink-0">
        {restaurant.imageEmoji}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-body-md font-semibold text-on-surface truncate">
            {lang === 'bn' ? restaurant.nameBn : restaurant.nameEn}
          </p>
          {!restaurant.isOpen && (
            <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full flex-shrink-0">
              {lang === 'bn' ? 'বন্ধ' : 'Closed'}
            </span>
          )}
        </div>
        <p className="text-label-sm text-on-surface-variant">
          {lang === 'bn' ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-warning filled-symbol">star</span>
            <span className="text-label-sm font-medium text-on-surface">{restaurant.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            <span className="text-label-sm">{restaurant.deliveryTimeMin} {lang === 'bn' ? 'মি' : 'min'}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">payments</span>
            <span className="text-label-sm">min ৳{restaurant.minOrder}</span>
          </div>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant/50 text-[18px] flex-shrink-0">chevron_right</span>
    </button>
  );
}

// ── Main HomeScreen ─────────────────────────────────────────────
export default function HomeScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [langBannerDismissed] = useState(false);

  const popularProducts = PRODUCTS.filter(p => p.tags?.includes('popular') && p.isAvailable).slice(0, 8);
  const openRestaurants = RESTAURANTS.filter(r => r.isOpen).slice(0, 4);

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-y-auto no-scrollbar">
      <HomeTopBar />

      <div className="flex flex-col gap-4 pb-6">
        {/* Service banners */}
        {!state.isServiceOpen && <ServiceBanner type="closed" />}
        {state.isServiceOpen && state.isSlotFull && <ServiceBanner type="slot_full" />}

        {/* Active order */}
        <ActiveOrderBanner />

        {/* Promo banner */}
        {!langBannerDismissed && <PromoBanner />}

        {/* Quick actions */}
        <QuickActions />

        {/* Divider */}
        <div className="h-px bg-outline-variant/30 mx-4" />

        {/* Popular products */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            titleBn="জনপ্রিয় পণ্য"
            titleEn="Popular Products"
            onSeeAll={() => navigate('/bazaar')}
          />
          <div className="grid grid-cols-2 gap-3 px-4">
            {popularProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-outline-variant/30 mx-4" />

        {/* Restaurants */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            titleBn="রেস্টুরেন্ট"
            titleEn="Restaurants"
            onSeeAll={() => navigate('/food')}
          />
          <div className="flex flex-col gap-2 px-4">
            {openRestaurants.map(r => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
