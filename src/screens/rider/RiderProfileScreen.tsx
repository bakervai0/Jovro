import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageFrame, EmptyState } from '../../components/layout/PageFrame';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { useCurrentRider } from '../../components/shared/RiderBits';
import { fmtTk, areaName, toBnDigits } from '../../services/orderUtils';
import type { RiderStatus } from '../../types';

const STATUS_LABEL: Record<RiderStatus, { bn: string; en: string; variant: 'success' | 'warning' | 'error' | 'surface' }> = {
  active: { bn: 'সক্রিয় রাইডার', en: 'Active rider', variant: 'success' },
  pending: { bn: 'অনুমোদনের অপেক্ষায়', en: 'Pending approval', variant: 'warning' },
  inactive: { bn: 'নিষ্ক্রিয়', en: 'Inactive', variant: 'surface' },
  suspended: { bn: 'স্থগিত', en: 'Suspended', variant: 'error' },
};

/**
 * Rider profile — no dedicated Stitch screen exists, so this uses
 * the aligned rider design language (r2.2/r2.3 headers, identity
 * strips, cards and chips). Every value comes from the signed-in
 * rider's record in AppContext state; absent fields are omitted.
 */
export default function RiderProfileScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const lang = state.lang;
  const rider = useCurrentRider();
  const [showLogout, setShowLogout] = useState(false);

  const header = (
    <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
        <div className="min-w-0">
          <h1 className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight leading-tight truncate">
            Jovro {bn ? 'রাইডার পোর্টাল' : 'Rider Portal'}
          </h1>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant -mt-0.5">
            {bn ? 'রাইডার প্রোফাইল / Rider Profile' : 'Rider Profile'}
          </p>
        </div>
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
        className="text-label-md font-label-md text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/40 shrink-0"
      >
        বাংলা | EN
      </button>
    </header>
  );

  if (!rider) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        {header}
        <PageFrame>
          <EmptyState
            icon="person_off"
            title={bn ? 'রাইডার রেকর্ড পাওয়া যায়নি' : 'Rider record not found'}
            body={bn ? 'এই অ্যাকাউন্টের সঙ্গে কোনো রাইডার রেকর্ড যুক্ত নেই।' : 'No rider record is linked to this account.'}
          />
          <DemoRoleSwitcher />
        </PageFrame>
      </div>
    );
  }

  const riderName = bn ? rider.nameBn : rider.name;
  const riderInitial = riderName?.trim().charAt(0) ?? 'র';
  const riderCode = `#${rider.id.replace('rider-', 'JVR-')}`;
  const status = STATUS_LABEL[rider.status];
  const vehicleBn = rider.vehicleType === 'bicycle' ? 'বাইসাইকেল' : 'মোটরসাইকেল';
  const vehicleEn = rider.vehicleType === 'bicycle' ? 'Bicycle Courier' : 'Motorbike Courier';
  const baseArea = rider.areaId ? areaName(state.areas, rider.areaId, lang) : null;
  const joinedDate = new Date(`${rider.joinedAt}T00:00:00`).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const detailRows: { icon: string; labelBn: string; labelEn: string; value: string }[] = [
    { icon: 'badge', labelBn: 'রাইডার আইডি', labelEn: 'Rider ID', value: riderCode },
    { icon: 'call', labelBn: 'মোবাইল', labelEn: 'Mobile', value: toBnDigits(rider.mobile, lang) },
    ...(rider.email ? [{ icon: 'mail', labelBn: 'ইমেইল', labelEn: 'Email', value: rider.email }] : []),
    ...(baseArea ? [{ icon: 'location_on', labelBn: 'বেস এলাকা', labelEn: 'Base area', value: baseArea }] : []),
    {
      icon: rider.vehicleType === 'bicycle' ? 'directions_bike' : 'two_wheeler',
      labelBn: 'যানবাহন', labelEn: 'Vehicle', value: bn ? vehicleBn : vehicleEn,
    },
    { icon: 'calendar_month', labelBn: 'যোগদানের তারিখ', labelEn: 'Joined', value: joinedDate },
    { icon: 'payments', labelBn: 'মোট আয়', labelEn: 'Total earnings', value: fmtTk(rider.totalEarnings, lang) },
  ];

  const links: { icon: string; labelBn: string; labelEn: string; subBn: string; subEn: string; path: string; statusBadge?: boolean }[] = [
    {
      icon: 'local_shipping', labelBn: 'আজকের ডেলিভারি', labelEn: "Today's deliveries",
      subBn: 'অ্যাসাইন করা অর্ডার ও চলতি কাজ', subEn: 'Assigned orders and current work', path: '/rider',
    },
    {
      icon: 'account_balance_wallet', labelBn: 'আয় ও পেমেন্ট', labelEn: 'Earnings & payout',
      subBn: 'পেন্ডিং পেআউট ও পেমেন্ট রিকোয়েস্ট', subEn: 'Pending payout and payment requests', path: '/rider/earnings',
    },
    {
      icon: 'history', labelBn: 'ডেলিভারি ইতিহাস', labelEn: 'Delivery history',
      subBn: 'আগের সব ডেলিভারির খতিয়ান', subEn: 'Ledger of all past deliveries', path: '/rider/history',
    },
    {
      icon: 'assignment_turned_in', labelBn: 'আবেদন ও অবস্থা', labelEn: 'Application & status',
      subBn: 'রাইডার আবেদনের বিবরণ ও বর্তমান অবস্থা', subEn: 'Application details and current status', path: '/apply-rider', statusBadge: true,
    },
  ];

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/splash', { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {header}

      <PageFrame>
        {/* Identity card — r2.2 rider strip / r2.3 identity strip */}
        <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm mt-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-headline-md ring-2 ring-primary/25">
                {riderInitial}
              </div>
              {rider.status === 'active' && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full ring-2 ring-surface-container-lowest" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface truncate">{riderName}</h2>
                {rider.status === 'active' && (
                  <span className="material-symbols-outlined text-primary text-[17px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </div>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                <span className="truncate">Lalmonirhat Sadar Hub • {bn ? 'আইডি' : 'ID'} {riderCode}</span>
              </p>
              <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-0.5">
                {bn ? vehicleBn : vehicleEn} • {bn ? 'রেটিং' : 'Rating'} {toBnDigits(rider.rating ? rider.rating.toFixed(1) : '—', lang)} ★
              </p>
            </div>
            <Badge variant={status.variant} size="sm">{bn ? status.bn : status.en}</Badge>
          </div>

          {/* Lifetime summary */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: 'star', labelBn: 'রেটিং', labelEn: 'Rating', value: rider.rating ? toBnDigits(rider.rating.toFixed(1), lang) : '—' },
              { icon: 'local_shipping', labelBn: 'মোট ডেলিভারি', labelEn: 'Deliveries', value: toBnDigits(rider.totalDeliveries, lang) },
              { icon: 'hourglass_top', labelBn: 'পেআউট বাকি', labelEn: 'Payout due', value: fmtTk(rider.pendingPayout, lang) },
            ].map(s => (
              <div key={s.labelEn} className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-2.5 text-center">
                <span className="material-symbols-outlined text-primary text-[18px]">{s.icon}</span>
                <p className="text-label-lg font-label-lg font-bold text-on-surface leading-tight">{s.value}</p>
                <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? s.labelBn : s.labelEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Account details */}
        <section className="mt-4">
          <h3 className="text-label-lg font-label-lg font-bold text-on-surface">
            {bn ? 'অ্যাকাউন্ট বিবরণ' : 'Account details'}
            <span className="block text-bilingual-sub font-bilingual-sub font-normal text-on-surface-variant">Account Details</span>
          </h3>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm px-4 py-1 mt-2">
            {detailRows.map((row, i) => (
              <div key={row.labelEn} className={clsx('flex items-center gap-3 py-3', i < detailRows.length - 1 && 'border-b border-outline-variant/20')}>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">{row.icon}</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant flex-1">{bn ? row.labelBn : row.labelEn}</span>
                <span className="text-body-md font-body-md font-semibold text-on-surface text-right break-all">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rider section links */}
        <section className="mt-4">
          <h3 className="text-label-lg font-label-lg font-bold text-on-surface">
            {bn ? 'রাইডার সেকশন' : 'Rider section'}
            <span className="block text-bilingual-sub font-bilingual-sub font-normal text-on-surface-variant">Rider Section</span>
          </h3>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mt-2">
            {links.map((link, i) => (
              <button
                key={link.path + link.labelEn}
                onClick={() => navigate(link.path)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-container transition-colors',
                  i < links.length - 1 && 'border-b border-outline-variant/20',
                )}
              >
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">{link.icon}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-md font-body-md font-semibold text-on-surface">{bn ? link.labelBn : link.labelEn}</span>
                  <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">{bn ? link.subBn : link.subEn}</span>
                </span>
                {link.statusBadge && <Badge variant={status.variant} size="sm">{bn ? status.bn : status.en}</Badge>}
                <span className="material-symbols-outlined text-on-surface-variant/50 text-[18px] shrink-0">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        {/* Session — role switch (demo) + logout, as on the customer profile */}
        <section className="mt-5 flex flex-col gap-3 pb-2">
          <DemoRoleSwitcher />
          <Button
            variant="outline"
            size="full"
            onClick={() => setShowLogout(true)}
            className="border-error text-error"
            icon="logout"
          >
            {bn ? 'লগ আউট' : 'Log Out'}
          </Button>
        </section>
      </PageFrame>

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
