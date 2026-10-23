import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { ProductCard } from '../../components/shared/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';

export default function FavouritesScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  // Favourites live in localStorage through the app context; the seed keeps
  // none selected so the empty state is the default experience.
  const favourites = state.products.filter(p => state.favouriteProductIds.includes(p.id));

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={bn ? 'পছন্দের পণ্য' : 'Favourites'}
        subtitle={bn ? `${favourites.length}টি সেভ করা আছে` : `${favourites.length} saved items`}
      />

      {favourites.length === 0 ? (
        <div className="px-4 pt-6">
          <EmptyState
            icon="favorite_border"
            title={bn ? 'পছন্দের তালিকা এখন খালি' : 'No favourites yet'}
            subtitle={bn ? 'পণ্যের পাশে ♡ চাপুন — পরে এক ট্যাপে কার্টে যোগ করতে পারবেন।' : 'Tap the heart on any product to save it for quick reordering.'}
            action={
              <button onClick={() => navigate('/bazaar')} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white">
                <span className="material-symbols-outlined text-[19px]">storefront</span>
                {bn ? 'বাজার ঘুরে দেখুন' : 'Browse the bazaar'}
              </button>
            }
          />
          <div className="mt-4 rounded-2xl bg-surface-container p-3">
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              <b className="text-on-surface">{bn ? 'টিপস:' : 'Tip:'}</b>{' '}
              {bn ? 'প্রতি সপ্তাহে যে পণ্যগুলো কেনেন সেগুলো পছন্দে রাখলে অর্ডার করা সহজ হয়।' : 'Save the items you buy weekly to reorder faster.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-40 pt-3">
          {favourites.map(p => <ProductCard key={p.id} product={p} variant="grid" />)}
        </div>
      )}
    </div>
  );
}
