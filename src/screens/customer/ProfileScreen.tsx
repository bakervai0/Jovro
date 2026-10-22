import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';

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

  const user = state.user;

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
            <MenuItem icon="help_outline" labelBn="সাহায্য ও সহায়তা" labelEn="Help & Support" />
            <Divider />
            <MenuItem icon="privacy_tip" labelBn="গোপনীয়তা নীতি" labelEn="Privacy Policy" />
            <Divider />
            <MenuItem icon="info_outline" labelBn="অ্যাপ সম্পর্কে" labelEn="About App" badge="v1.0" />
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

        {/* Demo role switcher */}
        <div className="mt-4 px-4">
          <DemoRoleSwitcher />
        </div>
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
