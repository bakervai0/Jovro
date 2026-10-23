import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader, LangToggle } from '../../components/layout/Headers';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import { FooterBlock } from '../../components/shared/FooterBlock';
import { toBn } from '../../lib/format';

function Row({ icon, labelBn, labelEn, onClick, danger, badge, sub }: {
  icon: string; labelBn: string; labelEn: string; onClick?: () => void; danger?: boolean; badge?: string; sub?: string;
}) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-surface-container/60">
      <span className={clsx('grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg', danger ? 'bg-error-soft text-error' : 'bg-primary-soft text-primary-deep')}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx('block truncate text-[13px] font-semibold', danger ? 'text-error' : 'text-on-surface')}>
          {bn ? labelBn : labelEn}
        </span>
        {sub && <span className="block truncate text-[10.5px] text-on-surface-variant">{sub}</span>}
      </span>
      {badge && <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[9.5px] font-bold text-secondary">{badge}</span>}
      {!danger && <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">chevron_right</span>}
    </button>
  );
}

function Group({ titleBn, titleEn, children }: { titleBn: string; titleEn: string; children: React.ReactNode }) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <section className="mx-4">
      <h2 className="mb-1.5 px-1 text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant">
        {bn ? titleBn : titleEn}
      </h2>
      <div className="divide-y divide-outline-variant/40 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-card">
        {children}
      </div>
    </section>
  );
}

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [showLogout, setShowLogout] = useState(false);
  const [copied, setCopied] = useState(false);
  const user = state.user;

  const customerCode = (() => {
    if (!user?.id) return 'CUS-001';
    const m = user.id.match(/^u-(\d+)$/);
    return m ? `CUS-${m[1]}` : user.id.toUpperCase();
  })();

  const myOrders = state.orders.filter(o => o.customerId === user?.id);
  const displayOrders = myOrders.length > 0 ? myOrders : state.orders;

  const copyId = async () => {
    try { await navigator.clipboard.writeText(customerCode); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        title={bn ? 'প্রোফাইল' : 'Profile'}
        subtitle={bn ? 'আমার অ্যাকাউন্ট ও সেটিংস' : 'Account & settings'}
        right={
          <button onClick={() => navigate('/profile/edit')} className="grid h-8 w-8 place-items-center rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        }
      />

      <div className="flex flex-col gap-3 pb-32 pt-3">
        {/* Header card */}
        <section className="mx-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary-tint to-surface-container-lowest p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
              <span className="material-symbols-outlined filled-symbol text-[32px]">person</span>
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold text-on-surface">{bn ? (user?.nameBn ?? user?.name) : user?.name}</h1>
              <p className="text-[11.5px] text-on-surface-variant">{user?.mobile}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9.5px] font-semibold text-primary-deep shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {bn ? 'সক্রিয় গ্রাহক' : 'Active customer'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-primary-deep">{bn ? 'কাস্টমার আইডি' : 'Customer ID'}</p>
              <p className="text-[16px] font-bold tracking-wide text-primary-deep">{customerCode}</p>
              <p className="text-[9.5px] text-on-surface-variant">{bn ? 'ফোনে অপারেটরকে এই আইডি বলুন' : 'Read this ID when calling support'}</p>
            </div>
            <button onClick={copyId} className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[10.5px] font-bold text-white">
              <span className="material-symbols-outlined text-[14px]">{copied ? 'done' : 'content_copy'}</span>
              {copied ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি' : 'Copy')}
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {[
              { labelBn: 'অর্ডার', labelEn: 'Orders', value: displayOrders.length, path: '/orders' },
              { labelBn: 'পছন্দের', labelEn: 'Saved', value: state.favouriteProductIds.length, path: '/favourites' },
              { labelBn: 'ঠিকানা', labelEn: 'Addresses', value: state.addresses.length, path: '/addresses' },
            ].map(stat => (
              <button key={stat.labelEn} onClick={() => navigate(stat.path)} className="rounded-xl bg-white/70 py-1.5 text-center">
                <span className="block text-[15px] font-bold text-primary-deep">{toBn(stat.value, state.lang)}</span>
                <span className="block text-[9.5px] text-on-surface-variant">{bn ? stat.labelBn : stat.labelEn}</span>
              </button>
            ))}
          </div>
        </section>

        <Group titleBn="আমার অ্যাকাউন্ট" titleEn="My account">
          <Row icon="manage_accounts" labelBn="প্রোফাইল সম্পাদনা" labelEn="Edit profile" onClick={() => navigate('/profile/edit')} />
          <Row icon="location_on" labelBn="সেভ করা ঠিকানা" labelEn="Saved addresses" sub={bn ? `${toBn(state.addresses.length, 'bn')}টি ঠিকানা` : `${state.addresses.length} saved`} onClick={() => navigate('/addresses')} />
          <Row icon="favorite" labelBn="পছন্দের পণ্য" labelEn="Favourites" onClick={() => navigate('/favourites')} />
          <Row icon="receipt_long" labelBn="আমার অর্ডার" labelEn="My orders" onClick={() => navigate('/orders')} />
          <Row icon="lock_reset" labelBn="পাসওয়ার্ড বদলান" labelEn="Change password" onClick={() => navigate('/profile/password')} />
          <Row icon="notifications" labelBn="নোটিফিকেশন" labelEn="Notifications" badge={state.notifications.filter(n => !n.isRead).length > 0 ? String(state.notifications.filter(n => !n.isRead).length) : undefined} onClick={() => navigate('/notifications')} />
        </Group>

        <Group titleBn="পছন্দ" titleEn="Preferences">
          <div className="flex items-center gap-3 px-3.5 py-3">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-tertiary-soft text-tertiary">
              <span className="material-symbols-outlined text-[18px]">language</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-on-surface">{bn ? 'অ্যাপের ভাষা' : 'App language'}</span>
              <span className="block text-[10.5px] text-on-surface-variant">{bn ? 'বাংলা ডিফল্ট · ইংরেজিতে এক ট্যাপ' : 'Bangla by default · one tap to English'}</span>
            </span>
            <LangToggle compact />
          </div>
          <Row icon="notifications_active" labelBn="অর্ডার আপডেট নোটিফিকেশন" labelEn="Order update alerts" badge={bn ? 'চালু' : 'On'} onClick={() => navigate('/notifications')} />
        </Group>

        <Group titleBn="সেবা ও সুবিধা" titleEn="Services">
          <Row icon="card_membership" labelBn="মান্থলি ডেলিভারি পাস" labelEn="Monthly delivery pass" badge={user?.hasActivePass ? (bn ? 'সক্রিয়' : 'Active') : undefined} onClick={() => navigate('/subscription')} />
          <Row icon="group_add" labelBn="রেফার করে আয় করুন" labelEn="Refer & earn" onClick={() => navigate('/refer')} />
          <Row icon="work" labelBn="আয় করার সুযোগ" labelEn="Earn money with Jovro" onClick={() => navigate('/earn')} />
          <Row icon="smart_toy" labelBn="সহায়ক (AI)" labelEn="Assistant (AI)" onClick={() => navigate('/ai')} />
        </Group>

        <Group titleBn="সাহায্য" titleEn="Help & legal">
          <Row icon="report" labelBn="সমস্যা জানান" labelEn="Report a problem" onClick={() => navigate('/report')} />
          <Row icon="help_outline" labelBn="সাহায্য ও প্রশ্নোত্তর" labelEn="Help & FAQ" onClick={() => navigate('/faq')} />
          <Row icon="call" labelBn="যোগাযোগ করুন" labelEn="Contact us" onClick={() => navigate('/contact')} />
          <Row icon="local_shipping" labelBn="ডেলিভারি চার্জ তালিকা" labelEn="Delivery fee table" onClick={() => navigate('/delivery-fees')} />
          <Row icon="privacy_tip" labelBn="গোপনীয়তা নীতি" labelEn="Privacy policy" onClick={() => navigate('/privacy')} />
          <Row icon="gavel" labelBn="শর্তাবলী" labelEn="Terms & conditions" onClick={() => navigate('/terms')} />
          <Row icon="currency_exchange" labelBn="রিপ্লেসমেন্ট ও রিফান্ড" labelEn="Replacement & refund" onClick={() => navigate('/refund-policy')} />
          <Row icon="info" labelBn="অ্যাপ সম্পর্কে" labelEn="About Jovro" badge="v1.0" onClick={() => navigate('/about')} />
        </Group>

        <EarnMoneyCard />

        <div className="px-4">
          <DemoRoleSwitcher />
        </div>

        <div className="mx-4">
          <button
            onClick={() => setShowLogout(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-error/60 text-[13px] font-bold text-error"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {bn ? 'লগ আউট' : 'Log out'}
          </button>
        </div>

        <FooterBlock />
      </div>

      <ConfirmSheet
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => { dispatch({ type: 'LOGOUT' }); navigate('/login', { replace: true }); }}
        title={bn ? 'লগ আউট করবেন?' : 'Log out?'}
        body={bn ? 'আবার লগ ইন করতে হবে।' : 'You will need to sign in again.'}
        confirmLabel={bn ? 'লগ আউট' : 'Log out'}
        danger
      />
    </div>
  );
}
