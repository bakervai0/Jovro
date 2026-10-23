import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { QuantityStepper } from '../../components/shared/ProductCard';
import type { CartItem, MenuItem } from '../../types';

/**
 * Restaurant menu — Stitch 13._restaurant_menu_jovro.
 * Reached from the restaurant cards on Home and Food
 * (/food/:id). Menu items are exact-price and add to the cart
 * as restaurant items, which checkout already supports.
 */
export default function RestaurantMenuScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, cartCount, cartTotal, cartDeliveryFee } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const restaurant = state.restaurants.find(r => r.id === id);

  const sections = useMemo(() => {
    if (!restaurant) return [];
    const groups = new Map<string, { labelBn: string; labelEn: string; items: MenuItem[] }>();
    for (const item of restaurant.menuItems) {
      const custom = item.section ?? item.category;
      const key = custom ?? (item.isPopular ? '__popular' : '__single');
      const group = groups.get(key) ?? {
        labelBn: custom ?? (key === '__popular' ? 'সবচেয়ে বেশি অর্ডার হয়' : 'একক আইটেম'),
        labelEn: custom ?? (key === '__popular' ? 'Most Ordered' : 'Single Items'),
        items: [],
      };
      group.items.push(item);
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [restaurant]);

  if (!restaurant) {
    return (
      <div className="flex-1 flex flex-col bg-surface">
        <TopAppBar showBack title={bn ? 'রেস্টুরেন্ট' : 'Restaurant'} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">restaurant_menu</span>
          <p className="text-body-lg font-medium text-on-surface-variant">
            {bn ? 'রেস্টুরেন্ট পাওয়া যায়নি' : 'Restaurant not found'}
          </p>
        </div>
      </div>
    );
  }

  const name = bn ? restaurant.nameBn : restaurant.nameEn;
  const heroImage = restaurant.imageUrl ?? restaurant.imageEmoji;
  const heroIsUrl = !!heroImage && /^https?:\/\//.test(heroImage);

  const addToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      id: item.id,
      menuItemId: item.id,
      restaurantId: restaurant.id,
      nameBn: item.nameBn,
      nameEn: item.nameEn,
      price: item.price,
      quantity: 1,
      source: 'restaurant',
      isApproxPrice: false,
    };
    dispatch({ type: 'ADD_TO_CART', item: cartItem });
  };

  const updateQty = (item: MenuItem, qty: number) => {
    if (qty <= 0) dispatch({ type: 'REMOVE_FROM_CART', id: item.id });
    else dispatch({ type: 'UPDATE_CART_QTY', id: item.id, qty });
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={name}
        subtitle={bn ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* Hero — design 13 */}
        <div className="mx-4 mt-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center relative">
            {heroIsUrl ? (
              <img src={heroImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[72px]">{heroImage}</span>
            )}
            {!restaurant.isOpen && (
              <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
                <span className="text-label-lg font-bold text-on-surface-variant bg-surface/85 px-3 py-1 rounded-full">
                  {bn ? 'বন্ধ আছে' : 'Closed'}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-headline-sm font-bold text-on-surface leading-tight">{name}</p>
                <p className="text-label-sm text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">storefront</span>
                  {bn ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn} • {restaurant.address}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-success/10 rounded-full px-2 py-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-[13px] text-success filled-symbol">star</span>
                <span className="text-label-sm font-bold text-success">{restaurant.rating}</span>
                <span className="text-label-sm text-on-surface-variant">({restaurant.ratingCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx(
                'inline-flex items-center gap-1 text-label-sm font-semibold px-2 py-1 rounded-full',
                restaurant.isOpen ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error',
              )}>
                <span className="material-symbols-outlined text-[13px]">verified</span>
                {restaurant.isOpen ? (bn ? 'খোলা আছে' : 'Open now') : (bn ? 'বন্ধ আছে' : 'Closed')}
              </span>
              <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {restaurant.deliveryTimeMin} {bn ? 'মিনিট ডেলিভারি' : 'min delivery'}
              </span>
              <span className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                <span className="material-symbols-outlined text-[13px]">pedal_bike</span>
                {bn ? `ডেলিভারি ৳${cartDeliveryFee} • সর্বনিম্ন অর্ডার ৳${restaurant.minOrder}` : `Delivery ৳${cartDeliveryFee} • Min order ৳${restaurant.minOrder}`}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {bn
                ? 'কোনো বাড়তি মেনু দাম নেই — রেস্টুরেন্টের নিজস্ব মেনু দামেই কেনা হয়, শুধু নির্দিষ্ট ডেলিভারি ফি প্রযোজ্য।'
                : 'No menu markup — items are bought at the restaurant’s own menu prices; only the standard delivery fee applies.'}
            </p>
          </div>
        </div>

        {/* Menu sections — design 13 */}
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">restaurant_menu</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {bn ? 'এখনো কোনো মেনু আইটেম নেই' : 'No menu items yet'}
            </p>
          </div>
        ) : (
          sections.map(section => (
            <div key={section.labelEn} className="mt-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-title-sm font-bold text-on-surface">{bn ? section.labelBn : section.labelEn}</h2>
                <span className="text-label-sm text-on-surface-variant">
                  {section.items.length} {bn ? 'টি আইটেম' : 'items'}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-4">
                {section.items.map(item => {
                  const cartItem = state.cart.find(i => i.id === item.id);
                  const qty = cartItem?.quantity ?? 0;
                  const unavailable = !restaurant.isOpen || !item.isAvailable;
                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        'flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-3',
                        unavailable && 'opacity-60',
                      )}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-[30px] flex-shrink-0">
                        {item.imageEmoji ?? restaurant.imageEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-medium text-on-surface leading-snug">
                          {bn ? item.nameBn : item.nameEn}
                          {item.isPopular && (
                            <span className="ml-1.5 text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full align-middle">
                              {bn ? 'বেস্ট সেলার' : 'Bestseller'}
                            </span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-label-lg font-bold text-primary mt-0.5">৳{item.price}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {unavailable ? (
                          <span className="text-label-sm text-on-surface-variant">
                            {!restaurant.isOpen ? (bn ? 'বন্ধ' : 'Closed') : (bn ? 'পাওয়া যাচ্ছে না' : 'Unavailable')}
                          </span>
                        ) : qty > 0 ? (
                          <QuantityStepper qty={qty} onIncrease={() => updateQty(item, qty + 1)} onDecrease={() => updateQty(item, qty - 1)} />
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="h-9 px-3.5 rounded-full bg-primary text-white text-label-md font-semibold flex items-center gap-1 active:scale-90 transition-transform shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            {bn ? 'যোগ করুন' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View-cart bar — design 13 */}
      {cartCount > 0 && (
        <div className="px-4 py-3 bg-surface border-t border-outline-variant/30">
          <button
            onClick={() => navigate('/cart')}
            className="w-full h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 font-label-lg font-bold shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            <span>{bn ? `কার্ট দেখুন • ${cartCount}টি (৳${cartTotal})` : `View cart • ${cartCount} items (৳${cartTotal})`}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
