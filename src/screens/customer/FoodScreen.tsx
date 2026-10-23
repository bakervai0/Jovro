import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Input } from '../../components/ui/Input';
import type { Restaurant } from '../../types';

const CUISINE_FILTERS = [
  { id: 'all', labelBn: 'সব', labelEn: 'All' },
  { id: 'বিরিয়ানি', labelBn: 'বিরিয়ানি', labelEn: 'Biryani' },
  { id: 'ভাত-তরকারি', labelBn: 'ভাত-তরকারি', labelEn: 'Rice & Curry' },
  { id: 'ফাস্ট ফুড', labelBn: 'ফাস্ট ফুড', labelEn: 'Fast Food' },
  { id: 'চা-নাস্তা', labelBn: 'চা-নাস্তা', labelEn: 'Tea & Snacks' },
];

function RestaurantListCard({ restaurant }: { restaurant: Restaurant }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  return (
    <button
      onClick={() => navigate(`/food/${restaurant.id}`)}
      className={clsx(
        'w-full text-left bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden active:bg-surface-container transition-colors',
        !restaurant.isOpen && 'opacity-70',
      )}
    >
      {/* Top banner with emoji */}
      <div className="h-28 bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center relative">
        <span className="text-[64px]">{restaurant.imageEmoji}</span>
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
            <span className="text-label-lg font-bold text-on-surface-variant bg-surface/80 px-3 py-1 rounded-full">
              {lang === 'bn' ? 'বন্ধ' : 'Closed'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-body-md font-semibold text-on-surface">
              {lang === 'bn' ? restaurant.nameBn : restaurant.nameEn}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              {lang === 'bn' ? restaurant.cuisineTypeBn : restaurant.cuisineTypeEn}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-success/10 rounded-full px-2 py-0.5 flex-shrink-0">
            <span className="material-symbols-outlined text-[13px] text-success filled-symbol">star</span>
            <span className="text-label-sm font-bold text-success">{restaurant.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span className="text-label-sm">{restaurant.deliveryTimeMin} {lang === 'bn' ? 'মিনিট' : 'min'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            <span className="text-label-sm">
              {lang === 'bn' ? `সর্বনিম্ন ৳${restaurant.minOrder}` : `Min ৳${restaurant.minOrder}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">reviews</span>
            <span className="text-label-sm">{restaurant.ratingCount}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function FoodScreen() {
  const { state } = useApp();
  const lang = state.lang;

  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');

  const filtered = useMemo(() => {
    let items = state.restaurants;
    if (cuisine !== 'all') items = items.filter(r => r.cuisineTypeBn === cuisine);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(r =>
        r.nameBn.includes(query) ||
        r.nameEn.toLowerCase().includes(q),
      );
    }
    // Open restaurants first
    return [...items].sort((a, b) => (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0));
  }, [query, cuisine]);

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'খাবার' : 'Food'}
        subtitle={lang === 'bn' ? 'রেস্টুরেন্ট থেকে অর্ডার করুন' : 'Order from restaurants'}
      />

      {/* Sticky search + filters */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-surface sticky top-14 z-20 shadow-sm">
        <Input
          type="search"
          placeholder={lang === 'bn' ? 'রেস্টুরেন্ট খুঁজুন...' : 'Search restaurants...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          icon="search"
          iconEnd={query ? 'close' : undefined}
          onIconEndClick={() => setQuery('')}
        />

        {/* Cuisine filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CUISINE_FILTERS.map(c => (
            <button
              key={c.id}
              onClick={() => setCuisine(c.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-label-md font-medium whitespace-nowrap border transition-all flex-shrink-0',
                cuisine === c.id
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              {lang === 'bn' ? c.labelBn : c.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">restaurant_menu</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {lang === 'bn' ? 'কোনো রেস্টুরেন্ট পাওয়া যায়নি' : 'No restaurants found'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-3">
            {filtered.map(r => (
              <RestaurantListCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
