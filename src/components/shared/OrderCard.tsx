import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';
import type { Order, OrderStatus } from '../../types';

const STATUS_CONFIG: Record<OrderStatus, { labelBn: string; labelEn: string; variant: 'primary' | 'success' | 'warning' | 'error' | 'surface'; icon: string }> = {
  pending: { labelBn: 'অপেক্ষায়', labelEn: 'Pending', variant: 'warning', icon: 'receipt' },
  confirmed: { labelBn: 'নিশ্চিত হয়েছে', labelEn: 'Confirmed', variant: 'primary', icon: 'check_circle' },
  buying: { labelBn: 'কেনাকাটা হচ্ছে', labelEn: 'Buying', variant: 'warning', icon: 'shopping_basket' },
  'on-the-way': { labelBn: 'আসছে', labelEn: 'On the way', variant: 'primary', icon: 'directions_bike' },
  delivered: { labelBn: 'ডেলিভারি হয়েছে', labelEn: 'Delivered', variant: 'success', icon: 'task_alt' },
  failed: { labelBn: 'ডেলিভারি ব্যর্থ', labelEn: 'Delivery Failed', variant: 'error', icon: 'error' },
  cancelled: { labelBn: 'বাতিল হয়েছে', labelEn: 'Cancelled', variant: 'error', icon: 'cancel' },
  'refund-in-progress': { labelBn: 'রিফান্ড হচ্ছে', labelEn: 'Refunding', variant: 'warning', icon: 'currency_exchange' },
  refunded: { labelBn: 'রিফান্ড হয়েছে', labelEn: 'Refunded', variant: 'success', icon: 'paid' },
};

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way'];

interface OrderCardProps {
  order: Order;
  compact?: boolean;
}

export function OrderCard({ order, compact }: OrderCardProps) {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isActive = ACTIVE_STATUSES.includes(order.status);

  const itemSummary = order.items.slice(0, 2).map(i => lang === 'bn' ? i.nameBn : i.nameEn).join(', ')
    + (order.items.length > 2 ? ` +${order.items.length - 2}` : '');

  return (
    <button
      onClick={() => navigate(`/orders/${order.id}`)}
      className="w-full text-left rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 flex flex-col gap-2.5 active:bg-surface-container transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('material-symbols-outlined text-[18px]', isActive ? 'text-primary' : 'text-on-surface-variant')}>
            {status.icon}
          </span>
          <span className="text-label-md font-medium text-on-surface-variant">#{order.id}</span>
        </div>
        <Badge variant={status.variant as any} size="sm">
          {lang === 'bn' ? status.labelBn : status.labelEn}
        </Badge>
      </div>

      {/* Items */}
      {!compact && (
        <p className="text-body-md text-on-surface line-clamp-1">{itemSummary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-label-lg font-bold text-on-surface">৳{order.finalTotal}</p>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
          <span className="text-label-sm text-on-surface-variant">
            {new Date(order.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="flex items-center gap-2 mt-1">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
            <div className="absolute inset-0 rounded-full bg-primary" />
          </div>
          <span className="text-label-sm text-primary font-medium">
            {lang === 'bn' ? 'ট্র্যাক করুন' : 'Track order'}
          </span>
          <span className="material-symbols-outlined text-[14px] text-primary">chevron_right</span>
        </div>
      )}
    </button>
  );
}
