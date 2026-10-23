import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { useCurrentAffiliate } from '../../components/shared/AffiliateBits';
import AffiliateClosedScreen from './AffiliateClosedScreen';
import AffiliateHomeScreen from './AffiliateHomeScreen';
import ReferralToolsScreen from './ReferralToolsScreen';
import AffiliateEarningsScreen from './AffiliateEarningsScreen';

const TABS = [
  { path: '/affiliate', labelBn: 'হোম', labelEn: 'Home', icon: 'home', exact: true },
  { path: '/affiliate/tools', labelBn: 'রেফারেল টুলস', labelEn: 'Tools', icon: 'share', exact: false },
  { path: '/affiliate/earnings', labelBn: 'আয় ও পেমেন্ট', labelEn: 'Earnings', icon: 'account_balance_wallet', exact: false },
];

/**
 * Affiliate section shell (Section I). The programme is CLOSED
 * at launch: only a user with an affiliate record of their OWN
 * gets in — pending shows the I2 pending notice, active shows
 * the dashboard. Everyone else (no record, or an inactive one)
 * sees the closed notice + email waitlist instead, so the
 * affiliate screens are unreachable for new users. The seeded
 * demo affiliate (aff-01, user u-003) stays active so the
 * dashboard is demoable via the demo role switcher.
 */
export default function AffiliateScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bn = state.lang === 'bn';
  const affiliate = useCurrentAffiliate();
  const myAffiliate = state.affiliates.find(a => a.userId === state.user?.id);

  if (myAffiliate?.status !== 'active' && myAffiliate?.status !== 'pending') {
    return <AffiliateClosedScreen />;
  }

  if (myAffiliate?.status === 'pending') {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <TopAppBar title={bn ? 'অ্যাফিলিয়েট' : 'Affiliate'} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-warning/12 flex items-center justify-center">
            <span className="material-symbols-outlined text-warning text-[42px]">hourglass_top</span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface">
            {bn ? 'অপেক্ষা করুন — অ্যাডমিন অনুমোদন বাকি আছে' : 'Please wait — admin approval is pending'}
          </h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {bn
              ? 'আপনার অ্যাফিলিয়েট আবেদনটি অ্যাডমিনের কাছে আছে। অনুমোদন হলেই রেফারেল কোড ও ড্যাশবোর্ড চালু হবে।'
              : 'Your affiliate application is with the admin. Once approved, your referral code and dashboard activate.'}
          </p>
          <Button
            variant="primary"
            size="full"
            icon="store"
            onClick={() => { dispatch({ type: 'SET_ROLE', role: 'customer' }); navigate('/', { replace: true }); }}
          >
            {bn ? 'গ্রাহক হিসেবে কেনাকাটা করুন' : 'Shop as a customer'}
          </Button>
          <div className="w-full mt-2">
            <DemoRoleSwitcher />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        title={bn ? 'অ্যাফিলিয়েট ড্যাশবোর্ড' : 'Affiliate Dashboard'}
        subtitle={affiliate ? `${affiliate.referralCode} · ${bn ? affiliate.nameBn : affiliate.name}` : undefined}
      />
      <div className="flex gap-2 px-4 py-2.5 bg-surface border-b border-outline-variant/30 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const active = tab.exact ? pathname === tab.path : pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-label-md font-semibold whitespace-nowrap border transition-all flex-shrink-0',
                active
                  ? 'bg-tertiary text-white border-tertiary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              {bn ? tab.labelBn : tab.labelEn}
            </button>
          );
        })}
      </div>

      <Routes>
        <Route index element={<AffiliateHomeScreen />} />
        <Route path="tools" element={<ReferralToolsScreen />} />
        <Route path="earnings" element={<AffiliateEarningsScreen />} />
        <Route path="*" element={<Navigate to="/affiliate" replace />} />
      </Routes>

      <div className="px-4 pb-4">
        <DemoRoleSwitcher />
      </div>
    </div>
  );
}
