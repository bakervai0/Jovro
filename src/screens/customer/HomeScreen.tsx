import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { HomeTopBar } from '../../components/layout/TopAppBar';
import { OrderCard } from '../../components/shared/OrderCard';
import { ProductCard } from '../../components/shared/ProductCard';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import type { Restaurant } from '../../types';

// ── Promo Banner ────────────────────────────────────────────────
function PromoBanner() {
  const { state, t } = useApp();
  const lang = state.lang;
  const promo = state.promos.find(p => p.isActive);
  const banner = state.adminSettings.banners.find(b => b.isActive);
  if (!promo && !banner) return null;
  if (!promo && banner) return (<div className="mx-4 rounded-3xl bg-gradient-to-r from-secondary to-secondary/80 p-4 flex items-center gap-3"><span className="text-[34px]">{banner.image}</span><div className="flex-1"><p className="text-label-lg font-bold text-white">{lang === 'bn' ? banner.headlineBn : banner.headlineEn}</p><p className="text-label-sm text-white/80">{lang === 'bn' ? banner.subBn : banner.subEn}</p></div></div>);
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

// ── AI Assistant entry card ─────────────────────────────────────
function AiEntryCard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  return (
    <button
      onClick={() => navigate('/ai')}
      className="mx-4 rounded-3xl bg-gradient-to-r from-tertiary to-tertiary/80 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
    >
      <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-white text-[24px]">smart_toy</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg font-bold text-white">
          {lang === 'bn' ? 'সহায়ককে লিখে দিন' : 'Ask the Assistant'}
        </p>
        <p className="text-label-sm text-white/85 mt-0.5">
          {lang === 'bn'
            ? '"৫ কেজি চাল আর ১ লিটার তেল দাও" — লিখলেই কার্টে যোগ হবে'
            : '"5 kg rice and 1 litre oil" — it goes straight to your cart'}
        </p>
      </div>
      <span className="material-symbols-outlined text-white/80 text-[18px]">chevron_right</span>
    </button>
  );
}

// ── Service Closed / Slot Full Banner (Stitch g3, part 1) ─────
function ServiceBanner({ type }: { type: 'closed' | 'slot_full' }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const isClosed = type === 'closed';
  return (
    <div className="mx-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 relative overflow-hidden">
      <div className={clsx(
        'absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r',
        isClosed ? 'from-secondary-container via-[#F97316] to-secondary' : 'from-tertiary-container via-tertiary to-tertiary-container',
      )} />
      <div className="flex flex-col items-center text-center mt-1">
        <div className={clsx(
          'w-14 h-14 rounded-full border flex items-center justify-center mb-3',
          isClosed ? 'bg-[#FFF7ED] border-[#F97316]/20 text-secondary' : 'bg-tertiary/10 border-tertiary/20 text-tertiary',
        )}>
          <span className="material-symbols-outlined text-3xl">{isClosed ? 'schedule' : 'event_busy'}</span>
        </div>
        <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold mb-0.5">
          {isClosed
            ? (bn ? 'এখন সার্ভিস বন্ধ আছে' : 'Service is closed right now')
            : (bn ? 'আজকের সব স্লট পূর্ণ হয়ে গেছে' : 'All of today\u2019s slots are full')}
        </h2>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mb-2">
          {isClosed ? 'We are closed right now' : 'Today\u2019s slots are full'}
        </p>
        <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full mb-2.5">
          <span className="material-symbols-outlined text-primary text-base">alarm_on</span>
          <p className="text-body-sm font-body-sm text-on-surface font-semibold">
            {isClosed ? (
              <>{bn ? 'আবার খুলবে: ' : 'Opens again: '}<span className="text-primary font-bold">{bn ? 'আগামীকাল সকাল ৬:০০ টা' : 'tomorrow at 6:00 AM'}</span></>
            ) : (
              <>{bn ? 'কাল সকালের স্লটে আবার চেষ্টা করুন' : 'Try again in tomorrow morning\u2019s slot'}</>
            )}
          </p>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant bg-surface-container-low px-3.5 py-2 rounded-xl mb-4 leading-relaxed">
          {isClosed
            ? (bn
              ? '"আমাদের রাইডার ও পার্সোনাল শপারগণ এখন বিশ্রামে আছেন। আপনার পছন্দের বাজার বা খাবারের জন্য নির্বিঘ্নে অগ্রিম অর্ডার দিয়ে রাখুন।"'
              : '"Our riders and personal shoppers are resting now. Feel free to place an advance order for your favourite bazaar items or food."')
            : (bn
              ? '"আজকের প্রতিটি স্লটের সব রাইডার বুকড হয়ে গেছেন। কালকের স্লটের জন্য এখনই আগাম অর্ডার দিয়ে রাখতে পারেন।"'
              : '"Every rider for today\u2019s slots is booked. You can place an advance order for tomorrow\u2019s slot right now."')}
        </p>
        <button
          onClick={() => navigate('/bazaar')}
          className="w-full h-12 rounded-full bg-primary active:scale-95 duration-150 text-white font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-lg">event_note</span>
          <span>{bn ? 'পরের স্লটের জন্য আগাম অর্ডার করুন' : 'Pre-order for the next slot'}</span>
        </button>
        <span className="text-bilingual-sub font-bilingual-sub text-outline mt-1.5">
          Pre-order for next slot
        </span>
      </div>
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

  const popularProducts = state.products.filter(p => p.tags?.includes('popular') && p.isAvailable).slice(0, 8);
  const openRestaurants = state.restaurants.filter(r => r.isOpen).slice(0, 4);

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

        {/* AI assistant entry */}
        <AiEntryCard />

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

        {/* Earn Money (D21) — repeated at the bottom of Home */}
        <EarnMoneyCard />
      </div>
    </div>
  );
}
