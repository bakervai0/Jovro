import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';
import type { Order, Rider } from '../../types';
import { STATUS_META, areaName, cashToCollect, fmtTk } from '../../services/orderUtils';

/** The Rider record belonging to the signed-in demo rider user. */
export function useCurrentRider(): Rider | undefined {
  const { state } = useApp();
  return state.riders.find(r => r.userId === state.user?.id) ?? state.riders.find(r => r.id === 'rider-01');
}

/** Compact rider-facing order row → rider order detail. */
export function RiderOrderRow({ order, showCash = true }: { order: Order; showCash?: boolean }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const meta = STATUS_META[order.status];

  return (
    <button
      onClick={() => navigate(`/rider/orders/${order.id}`)}
      className="w-full text-left rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 flex flex-col gap-2 active:bg-surface-container transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-label-md font-semibold text-on-surface-variant">#{order.id}</span>
        <Badge variant={meta.variant} size="sm">
          {lang === 'bn' ? meta.labelBn : meta.labelEn}
        </Badge>
      </div>
      <p className="text-body-md font-medium text-on-surface line-clamp-1">
        {order.customerName} · {areaName(state.areas, order.deliveryAreaId, lang)}
      </p>
      <p className="text-label-sm text-on-surface-variant line-clamp-1">
        {order.items.map(i => (lang === 'bn' ? i.nameBn : i.nameEn)).join(', ')}
      </p>
      <div className="flex items-center justify-between">
        {showCash ? (
          <span className="text-label-lg font-bold text-primary">
            {lang === 'bn' ? 'সংগ্রহ: ' : 'Collect: '}{fmtTk(cashToCollect(order), lang)}
          </span>
        ) : <span />}
        <span className={clsx('material-symbols-outlined text-[18px] text-on-surface-variant/60')}>chevron_right</span>
      </div>
    </button>
  );
}

/** Shared payout-status badge for rider + affiliate payment requests. */
export function PayoutStatusBadge({ status }: { status: 'pending' | 'paid' | 'rejected' }) {
  const { state } = useApp();
  const lang = state.lang;
  if (status === 'paid') {
    return <Badge variant="success" size="sm">{lang === 'bn' ? 'সম্পন্ন ✓' : 'Paid ✓'}</Badge>;
  }
  if (status === 'rejected') {
    return <Badge variant="error" size="sm">{lang === 'bn' ? 'বাতিল' : 'Rejected'}</Badge>;
  }
  return <Badge variant="warning" size="sm">{lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</Badge>;
}
