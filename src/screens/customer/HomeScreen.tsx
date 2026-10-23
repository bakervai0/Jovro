import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { HomeHeader, ServiceHoursStrip, SectionHeading } from '../../components/layout/Headers';
import { SearchBar } from '../../components/ui/SearchBar';
import { ProductCard } from '../../components/shared/ProductCard';
import { RestaurantCard } from '../../components/shared/RestaurantCard';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import { CATEGORY_INFO, CATEGORY_ORDER } from '../../data/products';
import { countdownParts, toBn } from '../../lib/format';
import { asset } from '../../lib/asset';
import type { Product } from '../../types';

// ── Banner carousel ─────────────────────────────────────────────
interface Slide {
  eyebrowBn: string;
  eyebrowEn: string;
  titleBn: string;
  titleEn: string;
  sub: string;
  code?: string;
  image: string;
  path: string;
}

const SLIDES: Slide[] = [
  {
    eyebrowBn: 'লালমনিরহাট সদর অফার',
    eyebrowEn: 'Lalmonirhat Sadar offer',
    titleBn: 'প্রথম অর্ডারে ডেলিভারি ফ্রি!',
    titleEn: 'Free delivery on your first order!',
    sub: 'Free delivery on your first grocery & food order',
    code: 'JOVROFREE',
    image: '/img/banner-cart.jpg',
    path: '/bazaar',
  },
  {
    eyebrowBn: 'শুভবিবাহের বাজার',
    eyebrowEn: 'Wedding bazaar',
    titleBn: 'বিয়ের বাজার — এক কলেই',
    titleEn: 'Wedding shopping, one call away',
    sub: 'Bulk bazaar lists bought & delivered by our shoppers',
    image: '/img/bazaar-stalls.jpg',
    path: '/bazaar',
  },
  {
    eyebrowBn: 'রেস্টুরেন্ট খায়া',
    eyebrowEn: 'Restaurant deals',
    titleBn: 'গরম বিরিয়ানি, দরজায় এসে',
    titleEn: 'Hot biryani at your door',
    sub: 'Nanna Biryani · Rongdhonu · Nawab Kacchi',
    image: '/img/food-spread.jpg',
    path: '/food',
  },
];

function BannerCarousel() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-4">
      <div className="overflow-hidden rounded-3xl">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {SLIDES.map(slide => (
            <button
              key={slide.code ?? slide.titleEn}
              onClick={() => navigate(slide.path)}
              className="relative flex h-[150px] w-full flex-shrink-0 items-stretch overflow-hidden bg-gradient-to-br from-[#0F8A4E] via-primary-deep to-[#0A7040] p-3.5 text-left"
            >
              <div className="relative z-10 flex min-w-0 flex-[1.35] flex-col">
                <span className="w-fit rounded-full bg-white/18 px-2 py-0.5 text-[9.5px] font-semibold text-white">
                  {bn ? slide.eyebrowBn : slide.eyebrowEn}
                </span>
                <h3 className="mt-1.5 text-[19px] font-bold leading-[1.25] text-white">
                  {bn ? slide.titleBn : slide.titleEn}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/85">{slide.sub}</p>

                <div className="mt-auto flex items-center gap-2 pt-1.5">
                  {slide.code && (
                    <>
                      <span className="rounded-md border border-dashed border-white/75 bg-white/10 px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-white">
                        {slide.code}
                      </span>
                      <span className="text-[10px] text-white/80">{bn ? 'কুপন কোড' : 'Coupon code'}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="relative ml-2 w-[38%] flex-shrink-0">
                <img src={asset(slide.image)} alt="" className="h-full w-full rounded-xl object-cover" loading="lazy" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.titleEn}
              onClick={() => setIndex(i)}
              aria-label={`slide ${i + 1}`}
              className={clsx('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant')}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => navigate('/bazaar')} className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-0.5 text-[9.5px] text-on-surface-variant">
            ({bn ? '২' : '2'}) {bn ? 'শুভবিবাহের বাজার' : 'Wedding bazaar'}
          </button>
          <button onClick={() => navigate('/food')} className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-0.5 text-[9.5px] text-on-surface-variant">
            ({bn ? '৩' : '3'}) {bn ? 'রেস্টুরেন্ট খায়া' : 'Restaurant deals'}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Two shopping entrances ─────────────────────────────────────
function EntryCards() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const cards = [
    {
      path: '/bazaar',
      eyebrow: bn ? 'গোশালা বাজারের সেরা বাজার' : 'Goshala Bazar picks',
      titleBn: 'কাঁচাবাজার',
      titleEn: 'Bazaar Grocery',
      image: '/img/bazaar-stalls.jpg',
      tone: 'primary' as const,
    },
    {
      path: '/food',
      eyebrow: bn ? 'স্থানীয় সেরা রেস্টুরেন্ট' : 'Best local restaurants',
      titleBn: 'রেস্টুরেন্টের খাবার',
      titleEn: 'Restaurant Food',
      image: '/img/food-spread.jpg',
      tone: 'secondary' as const,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 px-4">
      {cards.map(card => (
        <button
          key={card.path}
          onClick={() => navigate(card.path)}
          className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-2 text-left shadow-card active:scale-[0.99]"
        >
          <span
            className={clsx(
              'inline-block rounded-md px-1.5 py-0.5 text-[9px] font-semibold',
              card.tone === 'primary' ? 'bg-primary-soft text-primary-deep' : 'bg-secondary-soft text-secondary',
            )}
          >
            {card.eyebrow}
          </span>
          <h3 className="mt-1 text-[16px] font-bold leading-tight text-on-surface">{bn ? card.titleBn : card.titleEn}</h3>
          <p className="text-[10.5px] leading-tight text-on-surface-variant">{card.titleEn}</p>
          <div className="relative mt-1.5">
            <img src={asset(card.image)} alt="" className="h-[74px] w-full rounded-xl object-cover" loading="lazy" />
            <span
              className={clsx(
                'absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full text-white shadow-sm',
                card.tone === 'primary' ? 'bg-primary' : 'bg-secondary-bright',
              )}
            >
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}

// ── Category rail ──────────────────────────────────────────────
function CategoryRail() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  return (
    <section>
      <SectionHeading
        titleBn="ক্যাটাগরি ব্রাউজ করুন"
        titleEn="Browse categories"
        actionBn="সব দেখুন"
        actionEn="See all"
        onAction={() => navigate('/bazaar')}
      />
      <div className="no-scrollbar mt-2.5 flex gap-3 overflow-x-auto px-4 pb-1">
        {CATEGORY_ORDER.map(cat => {
          const info = CATEGORY_INFO[cat];
          return (
            <button
              key={cat}
              onClick={() => navigate(`/bazaar?category=${cat}`)}
              className="flex w-[62px] flex-shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid h-[52px] w-[52px] place-items-center rounded-full border border-outline-variant/70 bg-surface-container-lowest shadow-card">
                <span className={clsx('material-symbols-outlined text-[24px]', cat === 'oil-spices' || cat === 'milk-eggs' ? 'text-secondary' : cat === 'fish-meat' ? 'text-[#0B6E99]' : 'text-primary')}>
                  {info.icon}
                </span>
              </span>
              <span className="text-center text-[11px] font-semibold leading-tight text-on-surface">
                {bn ? info.nameBn : info.nameEn}
              </span>
              <span className="text-center text-[9px] leading-tight text-on-surface-variant">{info.nameEn}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Flash sale ─────────────────────────────────────────────────
function FlashSale({ products }: { products: Product[] }) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const end = useRef(Date.now() + 5 * 3600 * 1000 + 30 * 60 * 1000);
  const [left, setLeft] = useState(end.current - Date.now());

  useEffect(() => {
    const t = setInterval(() => setLeft(end.current - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { h, m, s } = countdownParts(left);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="mx-4 rounded-3xl border border-[#F3E3D5] bg-[#FDF6EF] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary-bright/12 text-secondary-bright">
            <span className="material-symbols-outlined filled-symbol text-[20px]">bolt</span>
          </span>
          <div>
            <h2 className="text-[17px] font-bold leading-tight text-secondary">{bn ? 'ফ্ল্যাশ মেল' : 'Flash Sale'}</h2>
            <p className="text-[10.5px] leading-tight text-on-surface-variant">Flash Sale Deals</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-secondary-bright/30 bg-white px-2.5 py-1 text-[11px] font-bold text-secondary">
          <span className="material-symbols-outlined text-[14px]">timer</span>
          {toBn(`${pad(h)}:${pad(m)}:${pad(s)}`, state.lang)}
        </span>
      </div>

      <div className="no-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto pb-1">
        {products.map(p => (
          <ProductCard key={p.id} product={p} variant="flash" />
        ))}
      </div>
    </section>
  );
}

// ── Custom bazaar request ──────────────────────────────────────
function CustomRequestCard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [text, setText] = useState('');

  const submit = () => {
    const q = text.trim();
    navigate(q ? `/ai?q=${encodeURIComponent(q)}` : '/ai');
  };

  return (
    <section className="mx-4 rounded-3xl border border-secondary-bright/40 bg-secondary-soft p-3.5">
      <div className="flex gap-2.5">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-secondary-bright/15 text-secondary-bright">
          <span className="material-symbols-outlined text-[22px]">shopping_basket</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold leading-snug text-secondary">
            {bn ? 'যা খুঁজে পাচ্ছেন না, লিখে দিন — বাজার থেকে কিনে এনে দেব' : 'Can’t find it? Type it — we will buy it from the local bazaar'}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-secondary/85">
            Can’t find it? Type anything — we will buy it from local bazaar
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-secondary-bright/55 bg-white p-1">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder={bn ? 'যেমন: ৫ কেজি মিনিকেট চাল, ১ কেজি দেশি আলু, ২টা' : 'e.g. 5 kg miniket rice, 1 kg potato'}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[12px] text-on-surface outline-none placeholder:text-on-surface-variant/60"
        />
        <button
          onClick={submit}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-[12px] font-bold text-white active:scale-95"
        >
          {bn ? 'পাঠান' : 'Send'}
          <span className="material-symbols-outlined text-[15px]">send</span>
        </button>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-snug text-secondary/90">
        <span className="material-symbols-outlined text-[14px]">verified</span>
        {bn ? 'পণ্যের পাবে কোনো বাড়তি দাম নেওয়া হয় না, শুধু ডেলিভারি চার্জ।' : 'No markup — only the delivery fee.'}
      </p>
    </section>
  );
}

// ── Home ───────────────────────────────────────────────────────
export default function HomeScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const flashProducts = useMemo(
    () => state.products.filter(p => p.isFlashSale && p.isAvailable).slice(0, 6),
    [state.products],
  );
  const restaurants = useMemo(
    () => [...state.restaurants].sort((a, b) => Number(b.isOpen) - Number(a.isOpen)).slice(0, 6),
    [state.restaurants],
  );

  // Buy-again comes from the customer's own delivered orders.
  const buyAgain = useMemo(() => {
    const ids = new Set<string>();
    state.orders.forEach(o => o.items.forEach(i => {
      const match = state.products.find(p => p.nameBn === i.nameBn);
      if (match) ids.add(match.id);
    }));
    const list = state.products.filter(p => ids.has(p.id));
    return (list.length > 0 ? list : state.products.filter(p => p.isPopular)).slice(0, 6);
  }, [state.orders, state.products]);

  const activeOrder = state.orders.find(o => ['pending', 'confirmed', 'buying', 'on-the-way'].includes(o.status));

  return (
    <div className="screen-scroll bg-surface">
      <HomeHeader />
      <ServiceHoursStrip />

      <div className="flex flex-col gap-4 pb-40 pt-3">
        <div className="px-4">
          <SearchBar
            readOnly
            onClick={() => navigate('/search')}
            placeholder={bn ? 'কী খুঁজছেন? / Search rice, egg, biryani...' : 'Search rice, egg, biryani...'}
          />
        </div>

        {/* Service closed / slot full states */}
        {(!state.isServiceOpen || state.isSlotFull) && (
          <div className="mx-4 rounded-2xl border border-secondary-bright/35 bg-secondary-soft p-3">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-secondary">
              <span className="material-symbols-outlined text-[17px]">{state.isServiceOpen ? 'event_busy' : 'schedule'}</span>
              {state.isServiceOpen
                ? (bn ? 'আজকের সব স্লট পূর্ণ — কালকের জন্য আগাম অর্ডার করুন' : 'Today’s slots are full — pre-order for tomorrow')
                : (bn ? 'এখন সার্ভিস বন্ধ • আগামীকাল সকাল ৬:০০ টায় আবার খুলবে' : 'Service closed • opens tomorrow at 6:00 AM')}
            </p>
            <button onClick={() => navigate('/bazaar')} className="mt-2 rounded-full bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-white">
              {bn ? 'আগাম অর্ডার করুন' : 'Pre-order now'}
            </button>
          </div>
        )}

        {/* Live order strip */}
        {activeOrder && (
          <button
            onClick={() => navigate(`/orders/${activeOrder.id}`)}
            className="mx-4 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-tint p-3 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary">
              <span className="material-symbols-outlined filled-symbol text-[19px]">delivery_dining</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-bold text-primary-deep">
                {bn ? 'চলমান অর্ডার' : 'Ongoing order'} · {activeOrder.id.slice(0, 8)}
              </span>
              <span className="block truncate text-[10.5px] text-on-surface-variant">
                {bn ? activeOrder.trackingUpdates.at(-1)?.messageBn : activeOrder.trackingUpdates.at(-1)?.messageEn}
              </span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-primary">chevron_right</span>
          </button>
        )}

        <BannerCarousel />
        <EntryCards />
        <CategoryRail />
        <FlashSale products={flashProducts} />

        {/* Restaurants rail */}
        <section>
          <SectionHeading
            titleBn="আশপাশের রেস্টুরেন্ট"
            titleEn="Top Restaurants Near You"
            subtitleBn="Top Restaurants Near You in Sadar"
            subtitleEn="Top Restaurants Near You in Sadar"
            actionBn="সবগুলো"
            actionEn="See all"
            onAction={() => navigate('/food')}
          />
          <div className="no-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {restaurants.map(r => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </section>

        <CustomRequestCard />

        {/* Buy again */}
        <section>
          <SectionHeading
            titleBn="আবার অর্ডার করুন"
            titleEn="Buy Again"
            subtitleBn="Buy Again From Previous Orders"
            subtitleEn="Buy Again From Previous Orders"
            actionBn="হিস্টোরি"
            actionEn="History"
            onAction={() => navigate('/orders')}
          />
          <div className="no-scrollbar mt-2.5 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {buyAgain.map(p => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </div>
        </section>

        {/* Trust note */}
        <div className="mx-4 rounded-2xl bg-primary-tint p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-primary-deep">
            <span className="material-symbols-outlined text-[17px]">verified_user</span>
            {bn ? 'স্বচ্ছতা ও আসল বাজার দাম' : 'Transparency & real bazaar prices'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
            {bn
              ? 'আমরা পণ্যের দামে কোনো বাড়তি নিই না। রসিদ দেখে আসল বাজার দামেই হিসাব, শুধু ডেলিভারি ফি।'
              : 'No markup on products. You pay the bazaar receipt price plus the delivery fee only.'}
          </p>
        </div>

        <EarnMoneyCard />

        <p className="px-6 pb-2 text-center text-[10px] leading-relaxed text-on-surface-variant/70">
          {bn ? 'Jovro — লালমনিরহাট সদরের নিজের বাজার সেবা · গোশালা বাজার হাব' : 'Jovro — Lalmonirhat Sadar personal shopper service · Goshala Bazar hub'}
        </p>
      </div>
    </div>
  );
}
