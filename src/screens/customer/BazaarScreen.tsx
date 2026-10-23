import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { SearchBar } from '../../components/ui/SearchBar';
import { ProductCard } from '../../components/shared/ProductCard';
import { CATEGORY_INFO, CATEGORY_ORDER } from '../../data/products';
import { productScore } from '../../lib/search';
import { toBn } from '../../lib/format';
import type { ProductCategory } from '../../types';

type Tab = ProductCategory | 'all';

export default function BazaarScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bn = state.lang === 'bn';

  const initial = (params.get('category') as Tab) ?? 'all';
  const [tab, setTab] = useState<Tab>(CATEGORY_ORDER.includes(initial as ProductCategory) ? initial : 'all');
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Keep the chip row in sync when the URL changes (e.g. home category tap).
  useEffect(() => {
    const next = params.get('category') as Tab | null;
    setTab(next && CATEGORY_ORDER.includes(next as ProductCategory) ? next : 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const products = useMemo(() => {
    let list = state.products;
    if (tab !== 'all') list = list.filter(p => p.category === tab);
    if (onlyAvailable) list = list.filter(p => p.isAvailable);
    if (query.trim()) {
      list = list
        .map(p => ({ p, score: productScore(p, query) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.p);
    }
    return list;
  }, [state.products, tab, query, onlyAvailable]);

  const selectTab = (id: Tab) => {
    setTab(id);
    setParams(id === 'all' ? {} : { category: id });
  };

  const total = state.products.length;
  const available = state.products.filter(p => p.isAvailable).length;

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        title={bn ? 'বাজার' : 'Bazaar'}
        subtitle={bn ? 'গোশালা কাঁচাবাজার ও মুদি আইটেম' : 'Goshala fresh & grocery items'}
        showBack
        onBack={() => navigate('/')}
        showLang
      />

      <div className="flex flex-col gap-3 pt-3">
        <div className="px-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={bn ? 'পণ্যের নাম খুঁজুন... / Search product' : 'Search product...'}
            showFilter
            onFilter={() => setOnlyAvailable(v => !v)}
          />
        </div>

        {/* Category chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => selectTab('all')}
            className={clsx(
              'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all',
              tab === 'all' ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container-lowest text-on-surface',
            )}
          >
            {bn ? 'সব' : 'All'} <span className={clsx('text-[10px]', tab === 'all' ? 'text-white/80' : 'text-on-surface-variant')}>All</span>
          </button>
          {CATEGORY_ORDER.map(cat => {
            const info = CATEGORY_INFO[cat];
            const active = tab === cat;
            return (
              <button
                key={cat}
                onClick={() => selectTab(cat)}
                className={clsx(
                  'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all',
                  active ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container-lowest text-on-surface',
                )}
              >
                {active && <span className="material-symbols-outlined text-[14px]">check</span>}
                {bn ? info.nameBn : info.nameEn}
                <span className={clsx('text-[10px] font-normal', active ? 'text-white/80' : 'text-on-surface-variant')}>
                  {info.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Count strip */}
        <div className="mx-4 flex items-center justify-between gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 shadow-card">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-deep">
              <span className="material-symbols-outlined text-[17px]">inventory_2</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-on-surface">
                {bn ? `মোট ${toBn(products.length, 'bn')}টি আইটেম` : `${products.length} total items`}
                <span className="mx-1 text-on-surface-variant">•</span>
                {bn ? `${toBn(products.filter(p => p.isAvailable).length, 'bn')}টি পাওয়া যায়` : `${products.filter(p => p.isAvailable).length} available`}
              </p>
              <p className="truncate text-[10.5px] text-on-surface-variant">
                {total} Total Items • {available} Available in Market
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/delivery-fees')}
            className="flex flex-shrink-0 items-center gap-1 rounded-full border border-secondary-bright/40 bg-secondary-soft px-2.5 py-1 text-[10.5px] font-semibold text-secondary"
          >
            <span className="material-symbols-outlined text-[13px]">receipt_long</span>
            {bn ? 'রসিদ যাচাই' : 'Receipt check'}
          </button>
        </div>

        {/* Product list */}
        {products.length === 0 ? (
          <div className="mx-4 rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-[38px] text-on-surface-variant/50">search_off</span>
            <p className="mt-2 text-[14px] font-semibold text-on-surface">{bn ? 'এই ক্যাটাগরিতে কিছু পাওয়া যায়নি' : 'Nothing found here'}</p>
            <p className="mt-1 text-[11.5px] text-on-surface-variant">
              {bn ? 'লিখে দিন — বাজার থেকে কিনে এনে দেওয়া হবে।' : 'Write it down — our shopper will buy it for you.'}
            </p>
            <button
              onClick={() => navigate(`/ai?q=${encodeURIComponent(query)}`)}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-white"
            >
              {bn ? 'সহায়ককে জানান' : 'Ask the assistant'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 px-4 pb-40">
            {products.map(p => (
              <ProductCard key={p.id} product={p} variant="search" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
