import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import { FooterBlock } from '../../components/shared/FooterBlock';
import { PRODUCT_IMAGES } from '../../data/images';
import { OPERATOR } from '../../data/infoContent';
import { fmtTk, toBnDigits, uid } from '../../services/orderUtils';
import type { SavedAddress } from '../../types';

// ── Stitch 19 family + 25 family · Profile & Settings ─────────
// Main hub (19), Favourites (19b), Edit Profile (19c), Change
// Password (19d), Saved Addresses (25) and Add/Edit Address
// (25b) as in-screen views. QS1 customer-ID card, the Earn
// Money card and the footer block are kept from the app's
// e1.1 / f1.1 / qs1 design families.

type View = 'main' | 'favourites' | 'edit' | 'password' | 'addresses' | 'addressForm';

const LABEL_TYPES = [
  { bn: 'বাড়ি', en: 'Home', emoji: '🏠' },
  { bn: 'অফিস', en: 'Office', emoji: '🏢' },
  { bn: 'আত্মীয়', en: 'Relatives', emoji: '📍' },
  { bn: 'অন্যান্য', en: 'Other', emoji: '🏷️' },
];

function labelEmoji(label: string): string {
  return LABEL_TYPES.find(t => t.bn === label)?.emoji ?? '📍';
}

function LangPill() {
  const { state, dispatch } = useApp();
  const bn = state.lang === 'bn';
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
      className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-colors shrink-0"
    >
      বাংলা <span className="text-outline-variant">|</span> EN
    </button>
  );
}

function SubHeader({ title, sub, onBack }: { title: string; sub: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1 min-w-0">
          <button type="button" onClick={onBack} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform shrink-0">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold truncate">{title}</h1>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{sub}</span>
          </div>
        </div>
        <LangPill />
      </div>
    </header>
  );
}

function ChatFab() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full max-w-app z-40 pointer-events-none">
      <div className="flex justify-end px-4">
        <button
          type="button" onClick={() => navigate('/ai')} aria-label="Chat"
          className="pointer-events-auto relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-primary text-white shadow-lg active:scale-95 duration-150 hover:scale-105 transition-transform border-2 border-white"
        >
          <span className="animate-ping absolute inset-0 rounded-full bg-primary opacity-30" />
          <span className="material-symbols-outlined text-[28px] filled-symbol">chat</span>
        </button>
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [view, setView] = useState<View>('main');
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [customerCopied, setCustomerCopied] = useState(false);

  const user = state.user;
  const defaultAddress = state.addresses.find(a => a.isDefault) ?? state.addresses[0];
  const defaultArea = state.areas.find(a => a.id === defaultAddress?.areaId);
  const feeMin = Math.min(...state.areas.map(a => a.fee));
  const feeMax = Math.max(...state.areas.map(a => a.fee));

  const customerCode = (() => {
    if (!user?.id) return '—';
    const m = user.id.match(/^u-(\d+)$/);
    return m ? `CUS-${m[1]}` : user.id.toUpperCase();
  })();

  const copyCustomerId = async () => {
    try { await navigator.clipboard.writeText(customerCode); } catch { /* noop */ }
    setCustomerCopied(true);
    setTimeout(() => setCustomerCopied(false), 2000);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/splash', { replace: true });
  };

  if (view === 'favourites') return <><FavouritesView onBack={() => setView('main')} /><ChatFab /></>;
  if (view === 'edit') return <><EditProfileView onBack={() => setView('main')} onPassword={() => setView('password')} /><ChatFab /></>;
  if (view === 'password') return <><ChangePasswordView onBack={() => setView('edit')} /><ChatFab /></>;
  if (view === 'addresses') return (
    <>
      <AddressesView
        onBack={() => setView('main')}
        onAdd={() => { setEditingAddress(null); setView('addressForm'); }}
        onEdit={a => { setEditingAddress(a); setView('addressForm'); }}
      />
      <ChatFab />
    </>
  );
  if (view === 'addressForm') return (
    <>
      <AddressFormView address={editingAddress} onBack={() => setView('addresses')} onSaved={() => setView('addresses')} />
      <ChatFab />
    </>
  );

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Header (Stitch 19) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold leading-tight truncate">
                {bn ? 'প্রোফাইল / Profile' : 'Profile'}
              </h1>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'} • Jovro</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-surface-container-low rounded-full p-0.5 shrink-0">
            <button
              type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: 'bn' })}
              className={clsx('flex items-center space-x-1 px-2.5 py-1 rounded-full font-label-md text-label-md transition-colors', bn ? 'bg-primary text-on-primary' : 'text-on-surface-variant')}
            >
              <span className="material-symbols-outlined text-[16px]">translate</span>
              <span>বাংলা</span>
            </button>
            <button
              type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: 'en' })}
              className={clsx('px-2.5 py-1 rounded-full font-label-md text-label-md transition-colors', !bn ? 'bg-primary text-on-primary' : 'text-on-surface-variant')}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-28 space-y-space-md">
        {/* Profile card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex items-start space-x-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-primary text-[34px]">person</span>}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary text-on-primary rounded-full border-2 border-surface-container-lowest flex items-center justify-center">
              <span className="material-symbols-outlined text-[12px] filled-symbol">check</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{user?.nameBn || user?.name || '—'}</h2>
                <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">{user?.name && user?.nameBn && user.name !== user.nameBn ? user.name : ''}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5" dir="ltr">{user?.mobile ?? '—'}</p>
              </div>
              <button
                type="button" onClick={() => setView('edit')} aria-label={bn ? 'প্রোফাইল সম্পাদনা' : 'Edit profile'}
                className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container text-primary flex items-center justify-center active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
            {defaultAddress && (
              <div className="mt-2 pt-2 border-t border-dashed border-outline-variant/50 flex items-start space-x-1.5 text-body-sm font-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">pin_drop</span>
                <p className="leading-snug">
                  <span className="font-semibold text-on-surface">{defaultArea ? (bn ? defaultArea.nameBn : defaultArea.nameEn) : ''}, {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
                  <span className="block text-bilingual-sub font-bilingual-sub text-outline mt-0.5">
                    {bn ? 'ডেলিভারি জোন' : 'Delivery zone'} #{toBnDigits((defaultArea?.id.match(/\d+/)?.[0] ?? '1').padStart(2, '0'), lang)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* QS1 customer ID card */}
        <div className="bg-[#E8F5E9] rounded-2xl p-4 border-2 border-primary/40 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-bilingual-sub font-bilingual-sub uppercase tracking-wider text-primary font-bold">
                {bn ? 'কাস্টমার আইডি / Customer ID' : 'Customer ID'}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-headline-md font-headline-md font-bold text-primary tracking-wide">{customerCode}</span>
                <span className="text-label-sm font-label-sm text-primary/80 font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                  {bn ? 'সক্রিয় গ্রাহক' : 'Active customer'}
                </span>
              </div>
            </div>
            <button
              type="button" onClick={copyCustomerId}
              className="h-10 px-3.5 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">{customerCopied ? 'done' : 'content_copy'}</span>
              <span>{customerCopied ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি' : 'Copy')}</span>
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-primary/20 flex items-start gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">support_agent</span>
            <p className="text-body-sm font-body-sm font-medium leading-snug">
              {bn ? 'ফোন কলে অপারেটরকে এই আইডিটি বলুন' : 'Read this ID to the operator when you call for support.'}
            </p>
          </div>
        </div>

        {/* Preferences (Stitch 19) */}
        <section>
          <h3 className="font-label-md text-label-md text-outline uppercase tracking-wider px-1 mb-2">
            {bn ? 'সাধারণ সেটিংস • Preferences' : 'Preferences'}
          </h3>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden">
            <button type="button" onClick={() => setView('addresses')} className="w-full flex items-center space-x-3 px-4 py-3.5 text-left hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">home_pin</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">{bn ? 'আমার ঠিকানা / Saved addresses' : 'Saved addresses'}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">
                  {bn ? `বাসা ও অফিসের সংরক্ষিত ঠিকানা (${toBnDigits(state.addresses.length, lang)}টি ঠিকানা সংরক্ষিত)` : `${state.addresses.length} saved addresses`}
                </span>
              </span>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </button>
            <button type="button" onClick={() => setView('favourites')} className="w-full flex items-center space-x-3 px-4 py-3.5 text-left hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <span className="w-10 h-10 rounded-full bg-secondary-fixed/60 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">favorite</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">{bn ? 'পছন্দের তালিকা / Favourites' : 'Favourites'}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">{bn ? 'নিয়মিত কেনাকাটা ও প্রিয় রেস্টুরেন্ট' : 'Regular shopping & favourite restaurants'}</span>
              </span>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </button>
            <div className="flex items-center space-x-3 px-4 py-3">
              <span className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">{bn ? 'ভাষা / Language' : 'Language'}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">{bn ? 'অ্যাপ ইন্টারফেসের প্রধান ভাষা' : 'Primary app interface language'}</span>
              </span>
              <span className="flex bg-surface-container rounded-full p-0.5 shrink-0">
                <button
                  type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: 'bn' })}
                  className={clsx('px-3 py-1 rounded-full font-label-md text-label-md transition-colors', bn ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant')}
                >
                  বাংলা
                </button>
                <button
                  type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: 'en' })}
                  className={clsx('px-3 py-1 rounded-full font-label-md text-label-md transition-colors', !bn ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant')}
                >
                  EN
                </button>
              </span>
            </div>
            <button type="button" onClick={() => navigate('/delivery-fees')} className="w-full flex items-center space-x-3 px-4 py-3.5 text-left hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">
                  {bn ? 'ডেলিভারি চার্জের তালিকা' : 'Delivery fee table'}{' '}
                  <span className="font-body-sm text-body-sm text-primary font-bold ml-1">{bn ? 'স্বচ্ছ তালিকা' : 'Transparent'}</span>
                </span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">
                  {bn ? `সব ${toBnDigits(state.areas.length, lang)}টি এলাকার নির্দিষ্ট চার্জ ও স্বচ্ছতা (${fmtTk(feeMin, lang)} - ${fmtTk(feeMax, lang)})` : `Fixed fees for all ${state.areas.length} areas (${fmtTk(feeMin, lang)} - ${fmtTk(feeMax, lang)})`}
                </span>
              </span>
              <span className="flex items-center text-primary font-label-md text-label-md font-bold shrink-0">
                <span className="mr-0.5">{bn ? 'দেখুন' : 'View'}</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </span>
            </button>
            <button type="button" onClick={() => navigate('/orders')} className="w-full flex items-center space-x-3 px-4 py-3.5 text-left hover:bg-surface-container-low active:bg-surface-container transition-colors">
              <span className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface font-semibold">{bn ? 'আমার অর্ডারসমূহ' : 'My orders'}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">{bn ? 'অর্ডার ইতিহাস ও লাইভ ট্র্যাকিং' : 'Order history & live tracking'}</span>
              </span>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Help Center (Stitch 19) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
          <div className="flex items-center space-x-3 mb-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </span>
            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">{bn ? 'সহায়তা / Help Center' : 'Help Center'}</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{bn ? 'সরাসরি কন্ট্রোল রুমে কল বা হোয়াটসঅ্যাপ করুন' : 'Call or WhatsApp the control room directly'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={OPERATOR.phoneTel} className="flex items-center justify-center space-x-1.5 h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>{bn ? 'কল করুন' : 'Call now'}</span>
            </a>
            <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-1.5 h-11 rounded-full bg-[#E8F5E9] text-primary border border-primary/30 font-label-md text-label-md font-bold active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[18px] filled-symbol">chat</span>
              <span>{bn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
            </a>
          </div>
        </section>

        {/* Trust note + version (Stitch 19) */}
        <section className="p-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/60 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-primary">
            <span className="material-symbols-outlined text-[18px] filled-symbol">verified</span>
            <span className="font-label-md text-label-md font-bold">{bn ? 'আমরা শুধু ডেলিভারি চার্জ নিই' : 'We charge only for delivery'}</span>
            <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">We charge only for delivery</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            {bn
              ? 'জোভ্রো লালমনিরহাটের স্থানীয় নিজস্ব ডেলিভারি নেটওয়ার্ক। বাজারে যে দামে কেনা হয় আসল রসিদ অনুযায়ী ঠিক সেই দামেই পণ্য পৌঁছে দেওয়া হয়। কোনো গোপন কমিশন বা পণ্যে অতিরিক্ত বাড়তি দাম নেই।'
              : 'Jovro is Lalmonirhat’s own local delivery network. Items are delivered at exactly the bazaar price on the original receipt — no hidden commission, no markup.'}
          </p>
          <div className="pt-1 flex items-center justify-between text-bilingual-sub font-bilingual-sub text-outline">
            <span className="font-mono">Jovro App v1.2.0</span>
            <span className="flex items-center gap-1"><span>📍</span><span>{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span></span>
          </div>
        </section>

        {/* Earn Money (e1.1) */}
        <EarnMoneyCard />

        {/* Operator mode (DemoRoleSwitcher — demo build control) */}
        <DemoRoleSwitcher />

        {/* Logout (Stitch 19) */}
        <button
          type="button" onClick={() => setShowLogout(true)}
          className="w-full flex items-center justify-center space-x-2 py-2 text-error font-label-lg text-label-lg font-bold hover:bg-error-container/20 rounded-full active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>{bn ? 'লগআউট / Log out' : 'Log out'}</span>
        </button>

        <FooterBlock />
      </div>

      <ChatFab />

      <ConfirmSheet
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title={bn ? 'লগ আউট করবেন?' : 'Log out?'}
        body={bn ? 'আবার লগ ইন করতে হবে।' : 'You will need to sign in again.'}
        confirmLabel={bn ? 'লগ আউট' : 'Log Out'}
        danger
      />
    </div>
  );
}

// ── Stitch 19b · Favourites ───────────────────────────────────
function FavouritesView({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [tab, setTab] = useState<'all' | 'bazaar' | 'food'>('all');

  const favProducts = state.products.filter(p => state.favouriteProductIds.includes(p.id));
  const suggestions = useMemo(() => {
    const rice = state.products.find(p => p.category === 'rice-pulses');
    const eggs = state.products.find(p => p.category === 'milk-eggs');
    const popular = state.products.find(p => p.tags?.includes('popular') && p.id !== rice?.id && p.id !== eggs?.id);
    return [rice, eggs, popular].filter(Boolean) as typeof state.products;
  }, [state.products]);
  const topRestaurant = state.restaurants[0];

  const tabs = [
    { id: 'all' as const, bn: `সব (${toBnDigits(favProducts.length, lang)})`, en: `All (${favProducts.length})` },
    { id: 'bazaar' as const, bn: `বাজার সামগ্রী (${toBnDigits(favProducts.length, lang)})`, en: `Bazaar items (${favProducts.length})` },
    { id: 'food' as const, bn: 'রেস্টুরেন্ট খাবার (০)', en: 'Restaurant food (0)' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <SubHeader title={bn ? 'পছন্দের তালিকা' : 'Favourites'} sub="Favourites List" onBack={onBack} />
      <div className="px-margin py-2 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center space-x-1.5 text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
        <span className="font-label-md text-label-md">{bn ? 'লালমনিরহাট সদর • সংরক্ষিত পছন্দের সামগ্রী' : 'Lalmonirhat Sadar • Your saved favourites'}</span>
      </div>
      <div className="px-margin pt-3 flex space-x-2 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id} type="button" onClick={() => setTab(t.id)}
            className={clsx(
              'shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors active:scale-95',
              tab === t.id ? 'bg-primary text-on-primary font-bold shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant',
            )}
          >
            {bn ? t.bn : t.en}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-4 pb-28">
        {favProducts.length === 0 || tab === 'food' ? (
          <div className="space-y-space-md">
            <div className="flex flex-col items-center text-center pt-4 pb-2">
              <div className="relative w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[44px] text-secondary">favorite_border</span>
                <span className="absolute top-1 right-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{bn ? 'পছন্দের তালিকা খালি' : 'No favourites yet'}</h2>
              <p className="font-label-sm text-label-sm text-outline tracking-widest uppercase mt-0.5">No favourites yet</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-[280px] leading-relaxed">
                {bn ? 'যে জিনিসটা বারবার লাগে, তার পাশের favorite চাপলেই এখানে এক জায়গায় জমা হবে।' : 'Tap the ♡ on any daily item or food stall to order in one tap next time.'}
                <span className="block mt-1 font-bilingual-sub text-bilingual-sub">Tap the ♡ on any daily item or food stall to order in one tap next time.</span>
              </p>
              <button
                type="button" onClick={() => navigate('/bazaar')}
                className="mt-4 flex items-center space-x-2 px-6 h-11 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                <span>{bn ? 'বাজারে যান / Browse the bazaar' : 'Browse the bazaar'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF7ED] border border-secondary-container/30 flex items-start space-x-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">lightbulb</span>
              <div>
                <h4 className="font-label-md text-label-md font-bold text-on-surface">{bn ? 'কেন পছন্দের তালিকা রাখবেন?' : 'Why keep favourites?'}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-0.5">
                  {bn ? 'নিত্যদিনের চাল, ডাল, আলু, তেল বা নান্না বিরিয়ানির প্রিয় খাবার দ্রুত এক ক্লিকে অর্ডার করার জন্য ফেভারিট করে রাখুন।' : 'Save daily rice, lentils, potatoes, oil or your favourite biryani to order in one tap.'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                <h3 className="font-label-lg text-label-lg font-bold text-on-surface">{bn ? 'দ্রুত সেভ করার প্রস্তাবিত তালিকা' : 'Quick-save suggestions'}</h3>
                <span className="font-bilingual-sub text-bilingual-sub text-outline">Lalmonirhat Top picks</span>
              </div>
              <div className="space-y-2.5">
                {suggestions.map(p => {
                  const photo = PRODUCT_IMAGES[p.id];
                  const isFav = state.favouriteProductIds.includes(p.id);
                  return (
                    <div key={p.id} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/30 flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                        {photo ? <img src={photo} alt={bn ? p.nameBn : p.nameEn} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl">{p.imageEmoji}</span>}
                      </div>
                      <button type="button" onClick={() => navigate(`/product/${p.id}`)} className="flex-1 min-w-0 text-left">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-bold text-on-surface-variant mb-0.5">{bn ? p.unit : p.unitEn}</span>
                        <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{bn ? p.nameBn : p.nameEn}</p>
                        <p className="font-bilingual-sub text-bilingual-sub text-outline truncate">{bn ? 'গোশালা বাজার' : 'Goshala Bazar'}</p>
                        <p className="font-label-md text-label-md text-on-surface font-bold mt-0.5">{fmtTk(p.approxPrice, lang)}</p>
                      </button>
                      <button
                        type="button" aria-label="Toggle favourite"
                        onClick={() => dispatch({ type: 'TOGGLE_FAVOURITE', productId: p.id })}
                        className={clsx(
                          'w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0',
                          isFav ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container-low text-secondary',
                        )}
                      >
                        <span className={clsx('material-symbols-outlined text-[20px]', isFav && 'filled-symbol')}>{isFav ? 'favorite' : 'favorite_border'}</span>
                      </button>
                    </div>
                  );
                })}
                {topRestaurant && (
                  <button
                    type="button" onClick={() => navigate(`/food/${topRestaurant.id}`)}
                    className="w-full bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/30 flex items-center space-x-3 text-left"
                  >
                    <div className="w-14 h-14 rounded-lg bg-surface-container shrink-0 flex items-center justify-center">
                      <span className="text-2xl">{topRestaurant.imageEmoji ?? '🍛'}</span>
                    </div>
                    <span className="flex-1 min-w-0">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[10px] font-bold text-secondary mb-0.5">{bn ? 'গরম খাবার' : 'Hot food'}</span>
                      <span className="block font-label-lg text-label-lg text-on-surface font-semibold truncate">{bn ? topRestaurant.nameBn : topRestaurant.nameEn}</span>
                      <span className="block font-bilingual-sub text-bilingual-sub text-outline truncate">{topRestaurant.address}</span>
                      <span className="block font-label-md text-label-md text-primary font-bold mt-0.5">★ {topRestaurant.rating} • {bn ? 'জনপ্রিয়' : 'Popular'}</span>
                    </span>
                    <span className="material-symbols-outlined text-outline-variant shrink-0">chevron_right</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified_user</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                  {bn ? 'যেকোনো সমস্যায় লালমনিরহাট সরাসরি কল বা WhatsApp সাপোর্ট' : 'Direct call or WhatsApp support in Lalmonirhat'}
                </p>
              </div>
              <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#25D366]/15 text-[#006a37] font-label-md text-label-md font-bold shrink-0">
                <span className="material-symbols-outlined text-[16px] filled-symbol">chat</span>
                <span>{bn ? 'হোয়াটসঅ্যাপ সাপোর্ট' : 'WhatsApp'}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {favProducts.map(p => {
              const photo = PRODUCT_IMAGES[p.id];
              const inCart = state.cart.some(ci => ci.id === p.id || ci.productId === p.id);
              return (
                <div key={p.id} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/30 flex items-center space-x-3">
                  <button type="button" onClick={() => navigate(`/product/${p.id}`)} className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                    {photo ? <img src={photo} alt={bn ? p.nameBn : p.nameEn} className="w-full h-full object-cover" loading="lazy" /> : <span className="text-2xl">{p.imageEmoji}</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{bn ? p.nameBn : p.nameEn}</p>
                    <p className="font-bilingual-sub text-bilingual-sub text-outline">{bn ? p.unit : p.unitEn} • {bn ? 'গোশালা বাজার' : 'Goshala Bazar'}</p>
                    <p className="font-label-md text-label-md text-on-surface font-bold mt-0.5">{fmtTk(p.approxPrice, lang)}</p>
                  </div>
                  <button
                    type="button" aria-label="Remove favourite"
                    onClick={() => dispatch({ type: 'TOGGLE_FAVOURITE', productId: p.id })}
                    className="w-9 h-9 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center active:scale-90 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px] filled-symbol">favorite</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => !inCart && dispatch({ type: 'ADD_TO_CART', item: { id: p.id, productId: p.id, nameBn: p.nameBn, nameEn: p.nameEn, quantity: 1, price: p.approxPrice, unit: p.unit, source: 'bazaar', isApproxPrice: true } })}
                    className={clsx(
                      'h-9 px-3 rounded-full font-label-md text-label-md font-bold active:scale-95 shrink-0',
                      inCart ? 'bg-surface-container text-on-surface-variant' : 'bg-primary text-on-primary',
                    )}
                  >
                    {inCart ? (bn ? 'কার্টে আছে' : 'In cart') : (bn ? 'যোগ করুন' : 'Add')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stitch 19c · Edit Profile ─────────────────────────────────
function EditProfileView({ onBack, onPassword }: { onBack: () => void; onPassword: () => void }) {
  const { state, dispatch, currentArea } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const user = state.user;

  const [name, setName] = useState(user?.nameBn || user?.name || '');
  const [altMobile, setAltMobile] = useState(user?.altMobile ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!user) return;
    dispatch({ type: 'UPDATE_PROFILE', user: { ...user, name: name.trim() || user.name, nameBn: name.trim() || user.nameBn, altMobile: altMobile.trim() || undefined, email: email.trim() || undefined } });
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 900);
  };

  const inputCls = 'w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <SubHeader title={bn ? 'প্রোফাইল সম্পাদনা / Edit Profile' : 'Edit Profile'} sub={bn ? 'ব্যক্তিগত তথ্য ও অ্যাকাউন্ট পরিচালনা' : 'Personal info & account management'} onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-40 space-y-space-md">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary text-[44px]">person</span>}
            </div>
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-on-primary border-2 border-surface-container-lowest flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </span>
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold">
            <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            {bn ? 'ছবি বদলান / Change Photo' : 'Change Photo'}
          </span>
          <p className="mt-1.5 flex items-center gap-1 text-body-sm font-body-sm text-on-surface-variant max-w-[300px]">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">verified_user</span>
            {bn ? 'প্রোফাইল ছবি ডেলিভারি রাইডারকে আপনাকে সহজে চিনতে সাহায্য করে।' : 'A profile photo helps the rider recognise you easily.'}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'আপনার পুরো নাম / Full Name *' : 'Full Name *'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
              <input value={name} onChange={e => setName(e.target.value)} className={clsx(inputCls, 'pl-10')} placeholder={bn ? 'আপনার নাম লিখুন' : 'Enter your name'} />
            </div>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'রেজিস্টার্ড মোবাইল নম্বর / Registered Mobile Number' : 'Registered Mobile Number'}</label>
            <div className="relative">
              <input value={user?.mobile ?? ''} readOnly className={clsx(inputCls, 'bg-surface-container-low text-on-surface-variant pr-24')} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px] filled-symbol">check_circle</span>
                {bn ? 'যাচাইকৃত (Verified)' : 'Verified'}
              </span>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] hidden">lock</span>
            </div>
            <div className="mt-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                  {bn ? 'অ্যাকাউন্ট সুরক্ষার স্বার্থে মোবাইল নম্বর সরাসরি অ্যাপে বদলানো যায় না। নম্বর পরিবর্তন করতে চাইলে আমাদের সরাসরি কল করুন বা কাস্টমার সাপোর্টে যোগাযোগ করুন।' : 'For account security, the mobile number cannot be changed in the app. Call us or contact support to change it.'}
                </p>
                <a href={OPERATOR.phoneTel} className="mt-1.5 inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  {bn ? 'কন্ট্রোল রুমে কল দিন / Call Support' : 'Call Support'}
                </a>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'বিকল্প যোগাযোগের নম্বর / Alternative Number (ঐচ্ছিক)' : 'Alternative Number (optional)'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">contact_phone</span>
              <input value={altMobile} onChange={e => setAltMobile(e.target.value)} inputMode="tel" className={clsx(inputCls, 'pl-10')} placeholder="+880 1XXX-XXXXXX" />
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-outline mt-1">{bn ? 'জরুরি ডেলিভারির সময় প্রধান ফোন বন্ধ থাকলে রাইডার এই নম্বরে যোগাযোগ করবেন।' : 'The rider will use this number if your main phone is off.'}</p>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'ইমেইল ঠিকানা / Email Address (ঐচ্ছিক)' : 'Email Address (optional)'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
              <input value={email} onChange={e => setEmail(e.target.value)} inputMode="email" className={clsx(inputCls, 'pl-10')} placeholder="you@example.com" />
            </div>
            <p className="text-bilingual-sub font-bilingual-sub text-outline mt-1">{bn ? 'ডিজিটাল ক্যাশ মেমো ও মাসিক হিসাবের কপির জন্য।' : 'For digital cash memos and monthly statements.'}</p>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'পছন্দের প্রধান এলাকা / Preferred Zone' : 'Preferred Zone'}</label>
            <button type="button" onClick={() => navigate('/area')} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-left active:scale-[0.99]">
              <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
              <span className="flex-1 min-w-0">
                <span className="block text-body-md font-body-md text-on-surface font-semibold truncate">
                  {currentArea ? (bn ? currentArea.nameBn : currentArea.nameEn) : '—'}, {bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
                </span>
                <span className="block text-bilingual-sub font-bilingual-sub text-outline">{bn ? 'আপনার বর্তমান ডেলিভারি এলাকা' : 'Your current delivery area'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold shrink-0">
                <span className="material-symbols-outlined text-[13px] filled-symbol">check</span>
                {bn ? 'ডেলিভারি চালু আছে' : 'Delivery on'}
              </span>
              <span className="text-primary font-label-md text-label-md font-bold shrink-0">{bn ? 'পরিবর্তন' : 'Change'}</span>
            </button>
          </div>

          <button type="button" onClick={onPassword} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-left active:scale-[0.99]">
            <span className="material-symbols-outlined text-primary text-[22px]">lock_reset</span>
            <span className="flex-1 min-w-0">
              <span className="block text-label-lg font-label-lg text-on-surface font-semibold">🔐 {bn ? 'পাসওয়ার্ড পরিবর্তন করুন / Change Password' : 'Change Password'}</span>
              <span className="block text-body-sm font-body-sm text-on-surface-variant">{bn ? 'নিরাপত্তা বজায় রাখতে নিয়মিত পাসওয়ার্ড বদলান' : 'Change your password regularly for security'}</span>
            </span>
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </button>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5 filled-symbol">verified</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              {bn ? 'সততা ও গোপনীয়তা নীতি: আপনার ব্যক্তিগত নাম, ফোন নম্বর ও ঠিকানার তথ্য কখনোই কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না। এটি কেবল লালমনিরহাট সদরের অভ্যন্তরীণ ডেলিভারির জন্য সংরক্ষিত।' : 'Honesty & privacy: your name, phone and address are never sold or shared with third parties — kept only for deliveries inside Lalmonirhat Sadar.'}
            </p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-margin py-3 pb-24 space-y-1.5">
        <button
          type="button" onClick={save} disabled={!name.trim()}
          className={clsx(
            'w-full h-12 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50',
            saved ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary',
          )}
        >
          <span className="material-symbols-outlined text-[20px]">{saved ? 'check_circle' : 'save'}</span>
          <span>{saved ? (bn ? 'সেভ হয়েছে!' : 'Saved!') : (bn ? 'সেভ করুন / Save Changes' : 'Save Changes')}</span>
        </button>
        <button type="button" onClick={onBack} className="w-full py-1.5 text-on-surface-variant font-label-md text-label-md">
          {bn ? 'পরিবর্তন বাতিল / Discard' : 'Discard changes'}
        </button>
      </footer>
    </div>
  );
}

// ── Stitch 19d · Change Password ──────────────────────────────
function ChangePasswordView({ onBack }: { onBack: () => void }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const user = state.user;

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const strength = next.length === 0 ? 0 : next.length < 6 ? 1 : /\d/.test(next) && /[a-zA-Z]/.test(next) ? (next.length >= 8 ? 3 : 2) : 2;
  const strengthLabel = strength === 3 ? (bn ? 'শক্তিশালী (Strong)' : 'Strong') : strength === 2 ? (bn ? 'মাঝারি (Medium)' : 'Medium') : (bn ? 'দুর্বল (Weak)' : 'Weak');
  const matched = confirm.length > 0 && next === confirm;

  const submit = () => {
    if (!current) { setError(bn ? 'বর্তমান পাসওয়ার্ড দিন' : 'Enter your current password'); return; }
    if (next.length < 6) { setError(bn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'New password must be at least 6 characters'); return; }
    if (!matched) { setError(bn ? 'নতুন পাসওয়ার্ড দুটি মিলছে না' : 'New passwords do not match'); return; }
    setError('');
    setDone(true);
    setTimeout(onBack, 1200);
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{label} <span className="text-error">*</span></label>
      <div className="relative">
        <input
          type={show[id] ? 'text' : 'password'} value={value} onChange={e => set(e.target.value)}
          className="w-full h-12 px-3.5 pr-11 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="••••••••"
        />
        <button type="button" aria-label="Toggle visibility" onClick={() => setShow(s => ({ ...s, [id]: !s[id] }))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-outline">
          <span className="material-symbols-outlined text-[20px]">{show[id] ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <SubHeader title={bn ? 'পাসওয়ার্ড পরিবর্তন / Change Password' : 'Change Password'} sub={bn ? 'অ্যাকাউন্ট নিরাপত্তা' : 'Account security'} onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-40 space-y-space-md">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
          <p className="text-label-lg font-label-lg font-semibold">{bn ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন' : 'Keep your account secure'}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#FFF7ED] border border-secondary-container/30 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">shield</span>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-on-surface">{bn ? 'শক্তিশালী পাসওয়ার্ড ব্যবহার করুন' : 'Use a strong password'}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-0.5">
              {bn ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন যাতে সংখ্যা ও বর্ণ উভয়ই থাকে। ব্যক্তিগত তথ্য পরিহার করুন।' : 'Use at least 6 characters with both letters and numbers. Avoid personal information.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {field('current', bn ? 'বর্তমান পাসওয়ার্ড / Current Password' : 'Current Password', current, setCurrent)}
          <div>
            {field('next', bn ? 'নতুন পাসওয়ার্ড / New Password' : 'New Password', next, setNext)}
            {next.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i <= strength ? (strength === 3 ? 'bg-primary' : strength === 2 ? 'bg-[#F97316]' : 'bg-error') : 'bg-surface-container-highest')} />
                  ))}
                </div>
                <p className="text-label-sm font-label-sm mt-1 text-on-surface-variant">
                  {bn ? 'পাসওয়ার্ড শক্তি (Strength):' : 'Password strength:'} <span className="font-bold text-on-surface">{strengthLabel}</span>
                </p>
              </div>
            )}
          </div>
          <div>
            {field('confirm', bn ? 'আবার নতুন পাসওয়ার্ড লিখুন / Confirm New Password' : 'Confirm New Password', confirm, setConfirm)}
            {matched && (
              <p className="mt-1.5 flex items-center gap-1 text-primary text-label-md font-label-md font-semibold">
                <span className="material-symbols-outlined text-[16px] filled-symbol">check_circle</span>
                {bn ? '✓ পাসওয়ার্ড মিলেছে / Passwords match' : 'Passwords match'}
              </p>
            )}
          </div>
          {error && <p className="text-body-sm text-error font-medium">{error}</p>}
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
            <h4 className="font-label-lg text-label-lg font-semibold text-on-surface">{bn ? 'বর্তমান পাসওয়ার্ড মনে নেই?' : 'Forgot current password?'}</h4>
            <span className="font-bilingual-sub text-bilingual-sub text-outline">Forgot current password?</span>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            {bn ? `আপনার নিবন্ধিত মোবাইল নম্বর ${user?.mobile ?? ''} এ ৪ ডিজিটের ওটিপি কোড পাঠানো হবে।` : `A 4-digit OTP will be sent to your registered mobile ${user?.mobile ?? ''}.`}
          </p>
          <button
            type="button" onClick={() => navigate('/forgot-password')}
            className="w-full h-11 rounded-full border-[1.5px] border-primary text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>📲 {bn ? 'OTP ভেরিফিকেশন দিয়ে রিসেট করুন / Reset with OTP' : 'Reset with OTP'}</span>
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/60">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">security</span>
          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">{bn ? 'ক্যাশ অন ডেলিভারি সুরক্ষা' : 'Cash-on-delivery safety'}</strong>
            {bn ? ' — আপনার অর্ডার ইতিহাস, লালমনিরহাটের স্থানীয় সংরক্ষিত ঠিকানা ও ডেলিভারি তথ্য সম্পূর্ণ সুরক্ষিত থাকে।' : ' — your order history, saved addresses and delivery details stay fully protected.'}
          </p>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-margin py-3 pb-24 space-y-1.5">
        <button
          type="button" onClick={submit}
          className={clsx(
            'w-full h-12 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all',
            done ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary',
          )}
        >
          <span className="material-symbols-outlined text-[20px]">{done ? 'check_circle' : 'save'}</span>
          <span>{done ? (bn ? 'পাসওয়ার্ড বদল হয়েছে!' : 'Password updated!') : (bn ? 'পাসওয়ার্ড পরিবর্তন নিশ্চিত করুন / Update Password' : 'Update Password')}</span>
        </button>
        <button type="button" onClick={onBack} className="w-full py-1.5 text-on-surface-variant font-label-md text-label-md">
          {bn ? 'ফিরে যান / Cancel' : 'Cancel'}
        </button>
      </footer>
    </div>
  );
}

// ── Stitch 25 · Saved Addresses ───────────────────────────────
function AddressesView({ onBack, onAdd, onEdit }: { onBack: () => void; onAdd: () => void; onEdit: (a: SavedAddress) => void }) {
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);

  const makeDefault = (a: SavedAddress) => {
    state.addresses.forEach(x => {
      if (x.isDefault && x.id !== a.id) dispatch({ type: 'UPDATE_ADDRESS', address: { ...x, isDefault: false } });
    });
    dispatch({ type: 'UPDATE_ADDRESS', address: { ...a, isDefault: true } });
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <SubHeader title={bn ? 'আমার ঠিকানা / Saved Addresses' : 'Saved Addresses'} sub={bn ? 'বাসা ও অফিসের পরিচিত নিশানা' : 'Familiar landmarks for home & office'} onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-40 space-y-space-md">
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">pedal_bike</span>
          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            {bn ? 'সঠিক ল্যান্ডমার্ক ও নিশানার কারণে সাইকেল রাইডার সরাসরি আপনার দরজায় সহজে পৌঁছে যেতে পারেন।' : 'Clear landmarks help the bicycle rider reach your door easily.'}
          </p>
        </div>

        {state.addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">home_pin</span>
            <p className="text-body-lg font-medium text-on-surface-variant">{bn ? 'কোনো ঠিকানা সেভ করা নেই' : 'No saved addresses'}</p>
          </div>
        )}

        {state.addresses.map(a => {
          const area = state.areas.find(x => x.id === a.areaId);
          return (
            <article key={a.id} className={clsx(
              'bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3',
              a.isDefault ? 'border-2 border-primary relative' : 'border border-outline-variant/30',
            )}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[20px]">{labelEmoji(a.label)}</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">{bn ? a.label : a.labelEn} / {bn ? a.labelEn : a.label}</h3>
                </div>
                {a.isDefault ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold shrink-0">
                    <span className="material-symbols-outlined text-[13px] filled-symbol">check_circle</span>
                    {bn ? 'ডিফল্ট / Default' : 'Default'}
                  </span>
                ) : (
                  <button type="button" onClick={() => makeDefault(a)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-outline-variant/60 text-on-surface-variant font-label-sm text-label-sm font-semibold shrink-0 active:scale-95">
                    <span className="material-symbols-outlined text-[13px]">bookmark</span>
                    {bn ? 'ডিফল্ট করুন / Make default' : 'Make default'}
                  </button>
                )}
              </div>
              <div className="space-y-1.5 text-body-sm font-body-sm">
                <p className="flex items-center gap-1.5 text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                  <span>{area ? (bn ? area.nameBn : area.nameEn) : ''}</span>
                  <span className="text-outline">•</span>
                  <span className="text-primary">{bn ? 'ডেলিভারি চার্জ' : 'Delivery'} {area ? fmtTk(area.fee, lang) : ''}</span>
                </p>
                <p className="text-on-surface-variant leading-relaxed pl-0.5">{a.fullAddress}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => onEdit(a)}
                  className="flex-1 h-10 rounded-full border-[1.5px] border-primary text-primary font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                  <span>{bn ? 'সম্পাদনা / Edit' : 'Edit'}</span>
                </button>
                <button
                  type="button" onClick={() => setDeleting(a)}
                  className="flex-1 h-10 rounded-full border border-error/40 text-error font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                  <span>{bn ? 'মুছুন / Delete' : 'Delete'}</span>
                </button>
              </div>
            </article>
          );
        })}

        <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            {bn ? 'লালমনিরহাট সদরের যেকোনো দুর্গম পাড়া বা মহলে পৌঁছে দেবে জোভরো টিম। নতুন ঠিকানা যুক্ত করে সঠিক নির্দেশনা দিন।' : 'The Jovro team reaches every neighbourhood of Lalmonirhat Sadar — add an address with clear directions.'}
          </p>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-margin py-3 pb-24">
        <button
          type="button" onClick={onAdd}
          className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>{bn ? 'নতুন ঠিকানা যোগ করুন / Add New Address' : 'Add New Address'}</span>
        </button>
      </footer>

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) dispatch({ type: 'DELETE_ADDRESS', id: deleting.id }); setDeleting(null); }}
        title={bn ? 'ঠিকানা মুছবেন?' : 'Delete this address?'}
        body={deleting ? (bn ? deleting.fullAddress : deleting.fullAddress) : ''}
        confirmLabel={bn ? 'মুছুন' : 'Delete'}
        danger
      />
    </div>
  );
}

// ── Stitch 25b · Add / Edit Address ───────────────────────────
function AddressFormView({ address, onBack, onSaved }: { address: SavedAddress | null; onBack: () => void; onSaved: () => void }) {
  const { state, dispatch, currentArea } = useApp();
  const lang = state.lang;
  const bn = lang === 'bn';
  const user = state.user;

  const [labelBn, setLabelBn] = useState(address?.label ?? 'বাড়ি');
  const [areaId, setAreaId] = useState(address?.areaId ?? currentArea?.id ?? state.areas[0]?.id ?? '');
  const [areaOpen, setAreaOpen] = useState(false);
  const [detail, setDetail] = useState(address?.fullAddress ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? state.addresses.length === 0);
  const [saved, setSaved] = useState(false);

  const area = state.areas.find(a => a.id === areaId);
  const inputCls = 'w-full px-3.5 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-body-md font-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  const save = () => {
    if (!detail.trim() || !area) return;
    const labelEn = LABEL_TYPES.find(t => t.bn === labelBn)?.en ?? 'Other';
    const contactSuffix = name.trim() && mobile.trim() ? ` — ${name.trim()} • ${mobile.trim()}` : '';
    const fullAddress = detail.trim().includes('•') ? detail.trim() : `${detail.trim()}${contactSuffix}`;
    if (isDefault) {
      state.addresses.forEach(x => {
        if (x.isDefault && x.id !== address?.id) dispatch({ type: 'UPDATE_ADDRESS', address: { ...x, isDefault: false } });
      });
    }
    if (address) {
      dispatch({ type: 'UPDATE_ADDRESS', address: { ...address, label: labelBn, labelEn, fullAddress, areaId, isDefault } });
    } else {
      dispatch({
        type: 'ADD_ADDRESS',
        address: { id: uid('addr'), userId: user?.id ?? 'u-001', label: labelBn, labelEn, fullAddress, areaId, isDefault },
      });
    }
    setSaved(true);
    setTimeout(onSaved, 800);
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      <SubHeader title={bn ? 'ঠিকানা যোগ / সম্পাদনা' : 'Add or Edit Address'} sub="Add or Edit Address" onBack={onBack} />
      <div className="px-margin py-2 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center space-x-1.5 text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
        <span className="font-label-md text-label-md">{bn ? 'ডেলিভারির জন্য সঠিক অবস্থান ও ল্যান্ডমার্ক দিন' : 'Give the exact location & landmark for delivery'}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-44 space-y-space-md">
        {/* Address type */}
        <section>
          <label className="block text-label-md font-label-md text-on-surface font-semibold mb-2">
            {bn ? 'ঠিকানার ধরন / Address Type' : 'Address Type'} <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LABEL_TYPES.map(t => {
              const selected = labelBn === t.bn;
              return (
                <button
                  key={t.bn} type="button" onClick={() => setLabelBn(t.bn)}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]',
                    selected ? 'border-2 border-primary bg-primary/5 text-primary font-bold' : 'border border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[18px]">{t.emoji}</span>
                    <span className="text-label-md font-label-md">{bn ? t.bn : t.en} / {bn ? t.en : t.bn}</span>
                  </span>
                  {selected && <span className="material-symbols-outlined text-primary text-[18px] filled-symbol">check_circle</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Area */}
        <section>
          <label className="block text-label-md font-label-md text-on-surface font-semibold mb-2">
            {bn ? 'ডেলিভারি এলাকা / Delivery Area' : 'Delivery Area'} <span className="text-error">*</span>
          </label>
          <button
            type="button" onClick={() => setAreaOpen(v => !v)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-left active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-primary text-[22px]">pin_drop</span>
            <span className="flex-1 min-w-0">
              <span className="block text-body-md font-body-md text-on-surface font-semibold truncate">{area ? (bn ? area.nameBn : area.nameEn) : (bn ? 'সদর উপজেলার এলাকা' : 'Pick an area')}</span>
              <span className="block text-bilingual-sub font-bilingual-sub text-outline">{bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}</span>
            </span>
            <span className="text-primary font-label-md text-label-md font-bold shrink-0">{bn ? 'এলাকা বদলান' : 'Change'}</span>
            <span className="material-symbols-outlined text-outline-variant">{areaOpen ? 'expand_less' : 'chevron_right'}</span>
          </button>
          {areaOpen && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest divide-y divide-outline-variant/20">
              {state.areas.map(a => (
                <button
                  key={a.id} type="button"
                  onClick={() => { setAreaId(a.id); setAreaOpen(false); }}
                  className={clsx('w-full flex items-center justify-between px-3.5 py-2.5 text-left', a.id === areaId ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface')}
                >
                  <span className="text-body-sm font-body-sm">{bn ? a.nameBn : a.nameEn}</span>
                  <span className="text-label-sm font-label-sm">{fmtTk(a.fee, lang)}</span>
                </button>
              ))}
            </div>
          )}
          {area && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">pedal_bike</span>
                {bn ? `সাইকেল ডেলিভারি চার্জ ${fmtTk(area.fee, lang)}` : `Bicycle delivery ${fmtTk(area.fee, lang)}`}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-primary border border-primary/20 text-label-sm font-label-sm font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {bn ? 'ডেলিভারি চালু আছে' : 'Delivery active'}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              {bn ? `লালমনিরহাট সদর উপজেলার ${toBnDigits(state.areas.length, lang)}টি গ্রাম ও মহল্লায় সরাসরি সাইকেল কুরিয়ার সার্ভিসের মাধ্যমে ডেলিভারি পৌঁছে দেওয়া হয়।` : `Deliveries reach all ${state.areas.length} villages and neighbourhoods of Lalmonirhat Sadar by bicycle courier.`}
            </p>
          </div>
        </section>

        {/* Detail / landmark */}
        <section>
          <label className="block text-label-md font-label-md text-on-surface font-semibold mb-2">
            {bn ? 'বিস্তারিত ঠিকানা ও চেনার নিশানা (Landmark)' : 'Detailed address & landmark'} <span className="text-error">*</span>
          </label>
          <textarea
            value={detail} onChange={e => setDetail(e.target.value)} rows={3}
            className={clsx(inputCls, 'resize-none')}
            placeholder={bn ? 'যেমন: কলেজ মোড়, সোনালী ব্যাংকের পেছনের গলি, দোতলা হলুদ বাড়ি...' : 'e.g. College Mor, lane behind Sonali Bank, two-storey yellow house...'}
          />
          <p className="mt-1.5 flex items-start gap-1.5 text-bilingual-sub font-bilingual-sub text-outline">
            <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">pedal_bike</span>
            {bn ? 'রাইডারের সুবিধার্থে: রিকশা বা সাইকেল রাইডারের সহজে খুঁজে পাওয়ার জন্য নিকটস্থ পরিচিত দোকান, মোড় বা ভবনের রং স্পষ্টভাবে উল্লেখ করুন।' : 'For the rider: mention a known shop, crossing or building colour so you are easy to find.'}
          </p>
        </section>

        {/* Recipient */}
        <section className="space-y-3">
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'প্রাপকের নাম / Recipient Name' : 'Recipient Name'} <span className="text-error">*</span></label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
              <input value={name} onChange={e => setName(e.target.value)} className={clsx(inputCls, 'pl-10')} placeholder={bn ? 'প্রাপকের নাম' : 'Recipient name'} />
            </div>
          </div>
          <div>
            <label className="block text-label-md font-label-md text-on-surface font-semibold mb-1.5">{bn ? 'যোগাযোগের মোবাইল নম্বর / Contact Number' : 'Contact Number'} <span className="text-error">*</span></label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">call</span>
              <input value={mobile} onChange={e => setMobile(e.target.value)} inputMode="tel" className={clsx(inputCls, 'pl-10 pr-24')} placeholder="+880 1XXX-XXXXXX" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[13px] filled-symbol">verified</span>
                {bn ? 'ভেরিফাইড' : 'Verified'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-bilingual-sub font-bilingual-sub text-outline">
              <span className="material-symbols-outlined text-[14px]">chat</span>
              {bn ? 'ডেলিভারি আপডেটের জন্য এই নম্বরে এসএমএস ও কল যাবে।' : 'Delivery updates by SMS and call go to this number.'}
            </p>
          </div>
        </section>

        {/* Default toggle */}
        <button
          type="button" onClick={() => setIsDefault(v => !v)}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-left"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-label-lg font-label-lg text-on-surface font-semibold">{bn ? 'ডিফল্ট ডেলিভারি ঠিকানা হিসেবে রাখুন' : 'Set as default address'}</span>
            <span className="block text-body-sm font-body-sm text-on-surface-variant">Set as default address</span>
            <span className="block text-bilingual-sub font-bilingual-sub text-outline mt-0.5">{bn ? 'পরবর্তী যেকোনো অর্ডারে এই ঠিকানাটি স্বয়ংক্রিয়ভাবে নির্বাচিত থাকবে।' : 'This address will be auto-selected for future orders.'}</span>
          </span>
          <span className={clsx('w-11 h-6 rounded-full p-0.5 transition-colors shrink-0', isDefault ? 'bg-primary' : 'bg-surface-container-highest')}>
            <span className={clsx('block w-5 h-5 rounded-full bg-white shadow transition-transform', isDefault && 'translate-x-5')} />
          </span>
        </button>

        <div className="flex items-center gap-2 text-bilingual-sub font-bilingual-sub text-outline">
          <span className="material-symbols-outlined text-[16px] text-primary">navigation</span>
          <span>{bn ? 'লালমনিরহাট পৌর সদর জোন-১' : 'Lalmonirhat Sadar Zone-1'}</span>
          <span className="text-primary font-semibold">{bn ? 'GPS প্রস্তুত' : 'GPS ready'}</span>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-margin py-3 pb-24 space-y-1.5">
        <button
          type="button" onClick={save} disabled={!detail.trim()}
          className={clsx(
            'w-full h-12 rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50',
            saved ? 'bg-emerald-600 text-white' : 'bg-primary text-on-primary',
          )}
        >
          <span className="material-symbols-outlined text-[20px] filled-symbol">check_circle</span>
          <span>{saved ? (bn ? 'সেভ হয়েছে!' : 'Saved!') : (bn ? 'ঠিকানা সেভ করুন / Save Address' : 'Save Address')}</span>
        </button>
        <button type="button" onClick={onBack} className="w-full py-1.5 text-on-surface-variant font-label-md text-label-md">
          {bn ? 'বাতিল / Cancel' : 'Cancel'}
        </button>
      </footer>
    </div>
  );
}
