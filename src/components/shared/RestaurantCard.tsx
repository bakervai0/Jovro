import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { tk, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { Restaurant } from '../../types';

export function RestaurantCover({ restaurant, className, rounded = 'rounded-xl' }: { restaurant: Restaurant; className?: string; rounded?: string }) {
  const cover = restaurant.image ?? restaurant.coverImage;
  if (cover) {
    return (
      <div className={clsx('relative overflow-hidden bg-surface-container', rounded, className)}>
        <img src={asset(cover)} alt={restaurant.nameEn} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      </div>
    );
  }
  return (
    <div className={clsx('relative grid place-items-center bg-gradient-to-br from-secondary-soft to-surface-container', rounded, className)}>
      <span className="text-[42px]">{restaurant.imageEmoji ?? '🍽️'}</span>
    </div>
  );
}

/** Wide card used in the home "আশপাশের রেস্টুরেন্ট" rail. */
export function RestaurantCard({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <button
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className={clsx('w-[250px] flex-shrink-0 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest text-left shadow-card', className)}
    >
      <div className="relative">
        <RestaurantCover restaurant={restaurant} className="h-[112px] w-full" rounded="rounded-none" />

        <span className={clsx(
          'absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold shadow-sm',
          restaurant.isOpen ? 'bg-white text-primary-deep' : 'bg-white/95 text-error',
        )}>
          <span className={clsx('h-1.5 w-1.5 rounded-full', restaurant.isOpen ? 'bg-primary' : 'bg-error')} />
          {restaurant.isOpen ? (bn ? 'খোলা আছে' : 'Open now') : (bn ? 'বন্ধ' : 'Closed')}
        </span>

        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-on-surface shadow-sm">
          <span className="material-symbols-outlined filled-symbol text-[13px] text-amber-500">star</span>
          {toBn(restaurant.rating.toFixed(1), state.lang)}
        </span>
      </div>

      <div className="p-2.5">
        <h3 className="truncate text-[15.5px] font-bold leading-tight text-on-surface">
          {bn ? restaurant.nameBn : restaurant.nameEn}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
          {restaurant.nameEn} <span className="px-0.5">•</span> {restaurant.areaBn ?? restaurant.address}
        </p>
        <p className="mt-1.5 truncate text-[11px] font-medium text-secondary">
          {bn ? 'ডেলিভারি' : 'Delivery'} {tk(restaurant.deliveryFee ?? 40, state.lang)}
          <span className="mx-1 text-on-surface-variant/50">•</span>
          {bn ? 'মিনিমাম অর্ডার' : 'Min order'} {tk(restaurant.minOrder, state.lang)}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-primary-deep">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          {restaurant.isOpen
            ? (bn ? `খোলা আছে • ${restaurant.closingBn ?? 'রাত ৯টা পর্যন্ত'}` : `Open • till ${restaurant.closingTime}`)
            : (bn ? 'আজ বন্ধ আছে' : 'Closed today')}
        </p>
      </div>
    </button>
  );
}

/** Full-width list row used on the Restaurants tab. */
export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <button
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2.5 text-left shadow-card active:bg-surface-container-low"
    >
      <div className="relative flex-shrink-0">
        <RestaurantCover restaurant={restaurant} className="h-[78px] w-[78px]" />
        {!restaurant.isOpen && (
          <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/45 text-[10px] font-bold text-white">
            {bn ? 'বন্ধ' : 'Closed'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14.5px] font-bold text-on-surface">{bn ? restaurant.nameBn : restaurant.nameEn}</h3>
        <p className="truncate text-[11px] text-on-surface-variant">
          {bn ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn}
          <span className="px-1">•</span>
          {restaurant.areaBn ?? restaurant.address}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-on-surface-variant">
          <span className="flex items-center gap-0.5 font-semibold text-on-surface">
            <span className="material-symbols-outlined filled-symbol text-[12px] text-amber-500">star</span>
            {toBn(restaurant.rating.toFixed(1), state.lang)}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            {toBn(restaurant.deliveryTimeMin, state.lang)} {bn ? 'মিনিট' : 'min'}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">two_wheeler</span>
            {tk(restaurant.deliveryFee ?? 40, state.lang)}
          </span>
        </div>
        <p className="mt-0.5 text-[10.5px] text-primary-deep">
          {restaurant.isOpen ? `● ${bn ? 'খোলা আছে' : 'Open'}` : `○ ${bn ? 'বন্ধ' : 'Closed'}`}
          <span className="ml-1 text-on-surface-variant">· {bn ? 'মিনিমাম' : 'Min'} {tk(restaurant.minOrder, state.lang)}</span>
        </p>
      </div>

      <span className="material-symbols-outlined flex-shrink-0 text-[18px] text-on-surface-variant/60">chevron_right</span>
    </button>
  );
}
