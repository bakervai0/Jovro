import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { PageFrame } from '../../components/layout/PageFrame';
import { Badge } from '../../components/ui/Badge';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { useCurrentRider } from '../../components/shared/RiderBits';
import { fmtTk, areaName, toBnDigits } from '../../services/orderUtils';

/** Rider profile — identity, vehicle, lifetime stats, shortcuts. */
export default function RiderProfileScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const rider = useCurrentRider();

  const rows: { icon: string; labelBn: string; labelEn: string; value: string }[] = rider ? [
    { icon: 'call', labelBn: 'মোবাইল', labelEn: 'Mobile', value: rider.mobile },
    { icon: 'two_wheeler', labelBn: 'যানবাহন', labelEn: 'Vehicle', value: rider.vehicleType === 'bicycle' ? (bn ? 'বাইসাইকেল' : 'Bicycle') : (bn ? 'মোটরসাইকেল' : 'Motorbike') },
    { icon: 'location_on', labelBn: 'এলাকা', labelEn: 'Area', value: rider.areaId ? areaName(state.areas, rider.areaId, state.lang) : '—' },
    { icon: 'local_shipping', labelBn: 'মোট ডেলিভারি', labelEn: 'Total deliveries', value: toBnDigits(rider.totalDeliveries, state.lang) },
    { icon: 'payments', labelBn: 'মোট আয়', labelEn: 'Total earnings', value: fmtTk(rider.totalEarnings, state.lang) },
    { icon: 'star', labelBn: 'রেটিং', labelEn: 'Rating', value: rider.rating ? `${rider.rating} ★` : '—' },
  ] : [];

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar showBack title={bn ? 'রাইডার প্রোফাইল' : 'Rider Profile'} />
      <PageFrame>
        <div className="flex flex-col items-center gap-2.5 py-6">
          <div className="w-20 h-20 rounded-full bg-secondary/12 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-[40px]">directions_bike</span>
          </div>
          <p className="text-headline-sm font-bold text-on-surface">{bn ? rider?.nameBn : rider?.name}</p>
          <Badge variant={rider?.status === 'active' ? 'success' : 'warning'}>
            {rider?.status === 'active' ? (bn ? 'সক্রিয় রাইডার' : 'Active rider') : rider?.status ?? ''}
          </Badge>
        </div>

        <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-1">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-outline-variant/20 last:border-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{r.icon}</span>
              <span className="text-body-sm text-on-surface-variant flex-1">{bn ? r.labelBn : r.labelEn}</span>
              <span className="text-body-md font-semibold text-on-surface">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => navigate('/rider/earnings')}
            className="rounded-2xl bg-surface-container p-4 text-left font-semibold text-label-lg text-on-surface flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
            {bn ? 'আয় ও পেমেন্ট' : 'Earnings'}
          </button>
          <button
            onClick={() => navigate('/rider/history')}
            className="rounded-2xl bg-surface-container p-4 text-left font-semibold text-label-lg text-on-surface flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            {bn ? 'ইতিহাস' : 'History'}
          </button>
        </div>

        <div className="mt-5">
          <DemoRoleSwitcher />
        </div>
      </PageFrame>
    </div>
  );
}
