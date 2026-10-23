import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader, SectionHeading } from '../../components/layout/Headers';
import { SearchBar } from '../../components/ui/SearchBar';
import { RestaurantRow } from '../../components/shared/RestaurantCard';
import { toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { Restaurant } from '../../types';

const CUISINES = [
  { id: 'all', bn: 'সব', en: 'All' },
  { id: 'biryani', bn: 'বিরিয়ানি', en: 'Biryani' },
  { id: 'rice', bn: 'ভাত-তরকারি', en: 'Rice hotel' },
  { id: 'sweets', bn: 'মিষ্টি', en: 'Sweets' },
  { id: 'fastfood', bn: 'ফাস্ট ফুড', en: 'Fast food' },
];

function matchesCuisine(r: Restaurant, id: string) {
  if (id === 'all') return true;
  const text = `${r.cuisineTypeBn} ${r.cuisineTypeEn}`.toLowerCase();
  if (id === 'biryani') return text.includes('বিরিয়ানি') || text.includes('biryani') || text.includes('কাচ্চি');
  if (id === 'rice') return text.includes('ভাত') || text.includes('rice') || text.includes('হোটেল');
  if (id === 'sweets') return text.includes('মিষ্টি') || text.includes('sweet');
  if (id === 'fastfood') return text.includes('ফাস্ট') || text.includes('fast');
  return true;
}

export default function FoodScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [openOnly, setOpenOnly] = useState(false);

  const restaurants = useMemo(() => {
    let list = state.restaurants.filter(r => matchesCuisine(r, cuisine));
    if (openOnly) list = list.filter(r => r.isOpen);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.nameBn.includes(query) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.cuisineTypeBn.includes(query) ||
        r.menuItems.some(m => m.nameBn.includes(query) || m.nameEn.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || b.rating - a.rating);
  }, [state.restaurants, cuisine, openOnly, query]);

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        title={bn ? 'রেস্টুরেন্ট' : 'Restaurants'}
        subtitle={bn ? 'স্থানীয় হোটেল ও রেস্টুরেন্ট' : 'Local hotels & restaurants'}
        showBack
        onBack={() => navigate('/')}
        showLang
      />

      <div className="flex flex-col gap-3 pt-3">
        <div className="px-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={bn ? 'রেস্টুরেন্ট বা খাবার খুঁজুন...' : 'Search restaurant or dish...'}
          />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {CUISINES.map(c => (
            <button
              key={c.id}
              onClick={() => setCuisine(c.id)}
              className={clsx(
                'flex flex-shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold',
                cuisine === c.id ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container-lowest text-on-surface',
              )}
            >
              {bn ? c.bn : c.en}
            </button>
          ))}
          <button
            onClick={() => setOpenOnly(v => !v)}
            className={clsx(
              'flex flex-shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold',
              openOnly ? 'border-primary bg-primary-soft text-primary-deep' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
            )}
          >
            <span className="material-symbols-outlined text-[14px]">{openOnly ? 'check_box' : 'check_box_outline_blank'}</span>
            {bn ? 'শুধু খোলা' : 'Open only'}
          </button>
        </div>

        {/* Offer banner */}
        <div className="mx-4 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-secondary to-secondary-bright p-3">
          <img src={asset('/img/food-spread.jpg')} alt="" className="h-[62px] w-[74px] flex-shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-white/80">{bn ? 'নান্না বিরিয়ানি হাউজ' : 'Nanna Biryani House'}</p>
            <p className="text-[14px] font-bold leading-tight text-white">
              {bn ? 'খাসির কাচ্চি (হাফ) — ৳২২০' : 'Mutton Kacchi (Half) — ৳220'}
            </p>
            <p className="text-[10.5px] text-white/80">{bn ? '৩০–৪০ মিনিটে আপনার দরজায়' : 'Delivered in 30–40 minutes'}</p>
          </div>
          <button onClick={() => navigate('/food/rest-01')} className="flex-shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-bold text-secondary">
            {bn ? 'দেখুন' : 'View'}
          </button>
        </div>

        <SectionHeading
          titleBn={`${toBn(restaurants.length, 'bn')}টি রেস্টুরেন্ট`}
          titleEn={`${restaurants.length} restaurants`}
          subtitleBn="Top Restaurants Near You in Sadar"
          subtitleEn="Top Restaurants Near You in Sadar"
        />

        <div className="flex flex-col gap-2.5 px-4 pb-40">
          {restaurants.map(r => <RestaurantRow key={r.id} restaurant={r} />)}
          {restaurants.length === 0 && (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/50">restaurant</span>
              <p className="mt-2 text-[13.5px] font-semibold text-on-surface">{bn ? 'কোনো রেস্টুরেন্ট পাওয়া যায়নি' : 'No restaurants found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
