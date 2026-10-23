import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../../components/ui/SearchBar';
import { AddButton, QuantityStepper } from '../../components/ui/Stepper';
import { addMenuItemToCart } from '../../lib/cartUtils';
import { menuSearch } from '../../lib/search';
import { tk, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { MenuItem } from '../../types';

export default function RestaurantMenuScreen() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const restaurant = state.restaurants.find(r => r.id === id);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');

  const items = useMemo(
    () => (restaurant ? menuSearch(restaurant, query) : []),
    [restaurant, query],
  );

  if (!restaurant) {
    return (
      <div className="screen-scroll bg-surface">
        <button onClick={() => navigate(-1)} className="p-4"><span className="material-symbols-outlined">arrow_back</span></button>
        <p className="p-8 text-center text-[14px] text-on-surface-variant">{bn ? 'রেস্টুরেন্ট পাওয়া যায়নি' : 'Restaurant not found'}</p>
      </div>
    );
  }

  const sections = Array.from(new Set(restaurant.menuItems.map(m => bn ? (m.sectionBn ?? m.section ?? 'মেনু') : (m.section ?? 'Menu'))));
  const visible = section === 'all' ? items : items.filter(m => (bn ? (m.sectionBn ?? m.section) : m.section) === section);

  const grouped = visible.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = bn ? (item.sectionBn ?? item.section ?? 'মেনু') : (item.section ?? 'Menu');
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  const qtyFor = (itemId: string) => state.cart.find(c => c.id === itemId)?.quantity ?? 0;

  return (
    <div className="screen-scroll bg-surface">
      {/* Hero */}
      <div className="relative h-[190px] w-full overflow-hidden bg-surface-container">
        {(restaurant.coverImage ?? restaurant.image) && (
          <img src={asset(restaurant.coverImage ?? restaurant.image)} alt={restaurant.nameEn} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/25" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3">
          <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[21px]">arrow_back</span>
          </button>
          <div className="flex gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-on-surface shadow-sm">
              <span className="material-symbols-outlined text-[20px]">favorite_border</span>
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-on-surface shadow-sm">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="min-w-0">
            <span className={clsx(
              'mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold',
              restaurant.isOpen ? 'bg-primary text-white' : 'bg-error text-white',
            )}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {restaurant.isOpen ? (bn ? 'খোলা আছে' : 'Open now') : (bn ? 'বন্ধ' : 'Closed')}
            </span>
            <h1 className="truncate text-[21px] font-bold leading-tight text-white">{bn ? restaurant.nameBn : restaurant.nameEn}</h1>
            <p className="truncate text-[11px] text-white/85">
              {bn ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn} · {restaurant.areaBn ?? restaurant.address}
            </p>
          </div>
          <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11.5px] font-bold text-on-surface shadow-sm">
            <span className="material-symbols-outlined filled-symbol text-[13px] text-amber-500">star</span>
            {toBn(restaurant.rating.toFixed(1), state.lang)}
            <span className="font-normal text-on-surface-variant">({toBn(restaurant.ratingCount, state.lang)})</span>
          </span>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[11.5px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
          {toBn(restaurant.deliveryTimeMin, state.lang)}–{toBn(restaurant.deliveryTimeMin + 10, state.lang)} {bn ? 'মিনিট' : 'min'}
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">pedal_bike</span>
          {bn ? 'ডেলিভারি' : 'Delivery'} {tk(restaurant.deliveryFee ?? 40, state.lang)}
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">shopping_basket</span>
          {bn ? 'মিনিমাম' : 'Min'} {tk(restaurant.minOrder, state.lang)}
        </span>
      </div>

      {!restaurant.isOpen && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl border border-error/20 bg-error-soft p-3">
          <span className="material-symbols-outlined text-[19px] text-error">schedule</span>
          <div>
            <p className="text-[12.5px] font-bold text-error">{bn ? 'রেস্টুরেন্ট এখন বন্ধ' : 'Restaurant is closed'}</p>
            <p className="text-[11px] text-on-surface-variant">
              {bn ? 'আগামীকাল আবার খুলবে। এখন অর্ডার নেওয়া যাচ্ছে না।' : 'Opens again tomorrow. Orders are paused right now.'}
            </p>
          </div>
        </div>
      )}

      <div className="px-4 pb-40 pt-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={bn ? 'মেনুতে খুঁজুন...' : 'Search the menu...'}
          showMic={false}
        />

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSection('all')}
            className={clsx('flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold', section === 'all' ? 'bg-primary text-white' : 'border border-outline-variant bg-surface-container-lowest text-on-surface')}
          >
            {bn ? 'সব' : 'All'} ({toBn(items.length, state.lang)})
          </button>
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={clsx('flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold', section === s ? 'bg-primary text-white' : 'border border-outline-variant bg-surface-container-lowest text-on-surface')}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {Object.entries(grouped).map(([name, group]) => (
            <section key={name}>
              <h2 className="mb-2 flex items-center gap-2 text-[14.5px] font-bold text-on-surface">
                {name}
                <span className="text-[11px] font-normal text-on-surface-variant">({toBn(group.length, state.lang)})</span>
                <span className="h-px flex-1 bg-outline-variant/60" />
              </h2>
              <div className="flex flex-col gap-2">
                {group.map(item => {
                  const qty = qtyFor(item.id);
                  return (
                    <article key={item.id} className={clsx('flex gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2.5 shadow-card', !item.isAvailable && 'opacity-60')}>
                      <div className="relative h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-xl bg-surface-container">
                        {item.image ?? restaurant.image ? (
                          <img src={asset(item.image ?? restaurant.image)} alt={item.nameEn} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-secondary-soft text-[28px]">{restaurant.imageEmoji ?? '🍽️'}</div>
                        )}
                        {item.isPopular && (
                          <span className="absolute left-1 top-1 rounded bg-secondary px-1 py-0.5 text-[8px] font-bold text-white">
                            {bn ? 'জনপ্রিয়' : 'Popular'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13.5px] font-bold leading-snug text-on-surface">{bn ? item.nameBn : item.nameEn}</h3>
                        <p className="truncate text-[10.5px] text-on-surface-variant">{bn ? item.nameEn : item.nameBn}</p>
                        {item.servesBn && (
                          <p className="text-[10px] text-on-surface-variant">
                            <span className="material-symbols-outlined align-middle text-[12px]">group</span> {bn ? item.servesBn : item.servesEn}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[15px] font-bold text-on-surface">{tk(item.price, state.lang)}</span>
                          {!item.isAvailable ? (
                            <span className="text-[10.5px] font-semibold text-on-surface-variant">{bn ? 'শেষ হয়ে গেছে' : 'Sold out'}</span>
                          ) : qty > 0 ? (
                            <QuantityStepper
                              qty={qty}
                              onDecrease={() => dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty: qty - 1 })}
                              onIncrease={() => addMenuItemToCart(dispatch, restaurant, item)}
                            />
                          ) : (
                            <AddButton
                              onClick={() => addMenuItemToCart(dispatch, restaurant, item)}
                              size="sm"
                              labelBn={bn ? 'যোগ করুন' : 'Add'}
                              labelEn=""
                            />
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-[34px] text-on-surface-variant/50">search_off</span>
              <p className="mt-2 text-[13px] font-semibold text-on-surface">{bn ? 'এই মেনুতে কিছু পাওয়া যায়নি' : 'Nothing on this menu'}</p>
            </div>
          )}

          <div className="rounded-2xl bg-primary-tint p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-primary-deep">
              <span className="material-symbols-outlined text-[17px]">verified_user</span>
              {bn ? 'রেস্টুরেন্টের দামেই, কোনো বাড়তি নেই' : 'Restaurant price, no markup'}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">
              {bn
                ? 'খাবারের দাম রেস্টুরেন্টের নিজস্ব মেনু অনুযায়ী — Jovro শুধু ডেলিভারি চার্জ নেয়।'
                : 'Food prices follow the restaurant menu. Jovro only charges the delivery fee.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
