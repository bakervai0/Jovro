import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { EarnMoneyCard } from '../../components/shared/EarnMoneyCard';
import { FooterBlock } from '../../components/shared/FooterBlock';

function MenuItem({ icon, labelBn, labelEn, onClick, danger, badge }: {
  icon: string; labelBn: string; labelEn: string;
  onClick?: () => void; danger?: boolean; badge?: string;
}) {
  const { state } = useApp();
  const lang = state.lang;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-surface-container transition-colors"
    >
      <span className={clsx('material-symbols-outlined text-[22px]', danger ? 'text-error' : 'text-on-surface-variant')}>
        {icon}
      </span>
      <span className={clsx('flex-1 text-left text-body-md font-medium', danger ? 'text-error' : 'text-on-surface')}>
        {lang === 'bn' ? labelBn : labelEn}
      </span>
      {badge && (
        <span className="text-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {!danger && <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">chevron_right</span>}
    </button>
  );
}

function MenuSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-outline-variant/20 mx-4" />;
}

export default function ProfileScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const [showLogout, setShowLogout] = useState(false);
  const [langEn, setLangEn] = useState(state.lang === 'en');
  const [customerCopied, setCustomerCopied] = useState(false);

  const user = state.user;
  // QS1: the visible customer code follows the app-wide convention
  // (u-001 → CUS-001) already used by admin search / Customer 360°.
  const customerCode = (() => {
    if (!user?.id) return '—';
    const m = user.id.match(/^u-(\d+)$/);
    return m ? `CUS-${m[1]}` : user.id.toUpperCase();
  })();

  const copyCustomerId = async () => {
    try { await navigator.clipboard.writeText(customerCode); } catch { /* clipboard unavailable in demo */ }
    setCustomerCopied(true);
    setTimeout(() => setCustomerCopied(false), 2000);
  };

  const toggleLang = () => {
    const newLang = langEn ? 'bn' : 'en';
    setLangEn(!langEn);
    dispatch({ type: 'SET_LANG', lang: newLang });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/splash', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        title={lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-6 px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[40px]">person</span>
          </div>
          <div className="text-center">
            <p className="text-headline-sm font-bold text-on-surface">{user?.name ?? '—'}</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{user?.mobile ?? '—'}</p>
            {user?.referralCode && (
              <div className="mt-2 flex items-center justify-center gap-2 bg-primary/8 rounded-full px-4 py-1.5">
                <span className="material-symbols-outlined text-primary text-[14px]">share</span>
                <span className="text-label-md text-primary font-semibold">{user.referralCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer ID — QS1: prominent green ID card with copy +
            the "read this ID to the operator" guidance. */}
        <div className="mx-4 mb-4 bg-[#E8F5E9] rounded-2xl p-4 border-2 border-primary/40 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-bilingual-sub font-bilingual-sub uppercase tracking-wider text-primary font-bold">
                {lang === 'bn' ? 'কাস্টমার আইডি / Customer ID' : 'Customer ID'}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-headline-md font-headline-md font-bold text-primary tracking-wide">{customerCode}</span>
                <span className="text-label-sm font-label-sm text-primary/80 font-semibold px-2 py-0.5 bg-primary/10 rounded-full">
                  {lang === 'bn' ? 'সক্রিয় গ্রাহক' : 'Active customer'}
                </span>
              </div>
            </div>
            <button
              onClick={copyCustomerId}
              className="h-10 px-3.5 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">{customerCopied ? 'done' : 'content_copy'}</span>
              <span>{customerCopied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-primary/20 flex items-start gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">support_agent</span>
            <p className="text-body-sm font-body-sm font-medium leading-snug">
              {lang === 'bn'
                ? <>ফোন কলে অপারেটরকে এই আইডিটি বলুন <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">(Read this ID when calling support)</span></>
                : 'Read this ID to the operator when you call for support.'}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          {[
            { labelBn: 'অর্ডার', labelEn: 'Orders', value: state.orders.filter(o => o.customerId === user?.id || true).length },
            { labelBn: 'পছন্দের', labelEn: 'Saved', value: state.favouriteProductIds.length },
            { labelBn: 'ঠিকানা', labelEn: 'Addresses', value: state.addresses.length },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-3 text-center">
              <p className="text-title-md font-bold text-primary">{stat.value}</p>
              <p className="text-label-sm text-on-surface-variant">{lang === 'bn' ? stat.labelBn : stat.labelEn}</p>
            </div>
          ))}
        </div>

        {/* Account */}
        <MenuSection>
          <MenuItem icon="manage_accounts" labelBn="অ্যাকাউন্ট সম্পাদনা" labelEn="Edit Account" />
          <Divider />
          <MenuItem icon="location_on" labelBn="ঠিকানাসমূহ" labelEn="Addresses" />
          <Divider />
          <MenuItem icon="receipt_long" labelBn="অর্ডার ইতিহাস" labelEn="Order History" onClick={() => navigate('/orders')} />
        </MenuSection>

        {/* Preferences */}
        <div className="mt-3">
          <MenuSection>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="material-symbols-outlined text-[22px] text-on-surface-variant">language</span>
              <span className="flex-1 text-left text-body-md font-medium text-on-surface">
                {lang === 'bn' ? 'ইংরেজি ভাষা' : 'English Language'}
              </span>
              <Toggle checked={langEn} onChange={toggleLang} />
            </div>
          </MenuSection>
        </div>

        {/* Support */}
        <div className="mt-3">
          <MenuSection>
            <MenuItem icon="smart_toy" labelBn="সহায়ক (AI)" labelEn="Assistant (AI)" onClick={() => navigate('/ai')} />
            <Divider />
            <MenuItem icon="report" labelBn="সমস্যা জানান" labelEn="Report a Problem" onClick={() => navigate('/report')} />
            <Divider />
            <MenuItem icon="group_add" labelBn="রেফার করে আয় করুন" labelEn="Refer & Earn" onClick={() => navigate('/refer')} />
            <Divider />
            <MenuItem icon="card_membership" labelBn="আমার সাবস্ক্রিপশন" labelEn="My Subscription" onClick={() => navigate('/subscription')} />
            <Divider />
            <MenuItem icon="help_outline" labelBn="সাহায্য ও সহায়তা" labelEn="Help & Support" onClick={() => navigate('/faq')} />
            <Divider />
            <MenuItem icon="privacy_tip" labelBn="গোপনীয়তা নীতি" labelEn="Privacy Policy" onClick={() => navigate('/privacy')} />
            <Divider />
            <MenuItem icon="info" labelBn="অ্যাপ সম্পর্কে" labelEn="About App" badge="v1.0" onClick={() => navigate('/about')} />
          </MenuSection>
        </div>

        {/* Logout */}
        <div className="mt-3 px-4">
          <Button
            variant="outline"
            size="full"
            onClick={() => setShowLogout(true)}
            className="border-error text-error"
            icon="logout"
          >
            {lang === 'bn' ? 'লগ আউট' : 'Log Out'}
          </Button>
        </div>

        {/* Earn Money (D21) — above the footer */}
        <div className="mt-4">
          <EarnMoneyCard />
        </div>

        {/* Demo role switcher */}
        <div className="mt-4 px-4">
          <DemoRoleSwitcher />
        </div>

        {/* Footer block (D13) — very bottom */}
        <FooterBlock />
      </div>

      <ConfirmSheet
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title={lang === 'bn' ? 'লগ আউট করবেন?' : 'Log out?'}
        body={lang === 'bn' ? 'আবার লগ ইন করতে হবে।' : 'You will need to sign in again.'}
        confirmLabel={lang === 'bn' ? 'লগ আউট' : 'Log Out'}
        danger
      />
    </div>
  );
}
