import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { IconButton } from '../../components/ui/Button';
import { ProductCard } from '../../components/shared/ProductCard';
import { Input } from '../../components/ui/Input';
import type { ProductCategory } from '../../types';

const CATEGORIES: { id: ProductCategory | 'all'; labelBn: string; labelEn: string; icon: string }[] = [
  { id: 'all', labelBn: 'সব', labelEn: 'All', icon: '🛒' },
  { id: 'rice-pulses', labelBn: 'চাল-ডাল', labelEn: 'Rice & Pulses', icon: '🌾' },
  { id: 'oil-spices', labelBn: 'তেল-মসলা', labelEn: 'Oil & Spices', icon: '🫙' },
  { id: 'vegetables', labelBn: 'সবজি', labelEn: 'Vegetables', icon: '🥬' },
  { id: 'fish-meat', labelBn: 'মাছ-মাংস', labelEn: 'Fish & Meat', icon: '🐟' },
  { id: 'milk-eggs', labelBn: 'দুধ-ডিম', labelEn: 'Milk & Eggs', icon: '🥚' },
  { id: 'snacks', labelBn: 'নাস্তা', labelEn: 'Snacks', icon: '🍪' },
];

export default function BazaarScreen() {
  const { state } = useApp();
  const lang = state.lang;

  // Home screen deep-links: ?q= (search bar) and ?category= (category rail)
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState<ProductCategory | 'all'>(() => {
    const c = searchParams.get('category');
    return c && CATEGORIES.some(x => x.id === c) ? (c as ProductCategory) : 'all';
  });
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let items = state.products;
    if (category !== 'all') items = items.filter(p => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(p =>
        p.nameBn.includes(query) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.includes(q)),
      );
    }
    return items;
  }, [query, category, state.products]);

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'বাজার' : 'Bazaar'}
        subtitle={lang === 'bn' ? 'তাজা পণ্য, বাজারদর' : 'Fresh items, market price'}
        actions={
          <IconButton
            icon={layout === 'grid' ? 'view_list' : 'grid_view'}
            onClick={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}
          />
        }
      />

      {/* Sticky search + categories */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-surface sticky top-14 z-20 shadow-sm">
        <Input
          type="search"
          placeholder={lang === 'bn' ? 'পণ্যের নাম লিখুন...' : 'Search products...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          icon="search"
          iconEnd={query ? 'close' : undefined}
          onIconEndClick={() => setQuery('')}
        />

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-medium whitespace-nowrap border transition-all flex-shrink-0',
                category === cat.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              <span className="text-[14px]">{cat.icon}</span>
              {lang === 'bn' ? cat.labelBn : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">search_off</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
            </p>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-primary text-body-sm font-medium"
              >
                {lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
              </button>
            )}
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 pt-3">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-3">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} layout="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
