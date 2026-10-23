import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { OrderCard } from '../../components/shared/OrderCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { toBn } from '../../lib/format';
import type { OrderStatus } from '../../types';

const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way'];
const PAST: OrderStatus[] = ['delivered', 'failed', 'cancelled', 'refund-in-progress', 'refunded'];

export default function OrdersScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const activeOrders = state.orders.filter(o => ACTIVE.includes(o.status));
  const pastOrders = state.orders.filter(o => PAST.includes(o.status));
  const shown = tab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        title={bn ? 'আমার অর্ডার' : 'My orders'}
        subtitle={bn ? 'চলমান ও পুরনো অর্ডার' : 'Active and past orders'}
        right={
          <button onClick={() => navigate('/notifications')} className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {state.notifications.some(n => !n.isRead) && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary-bright" />
            )}
          </button>
        }
      />

      <div className="sticky top-0 z-20 flex border-b border-outline-variant/50 bg-surface/95 backdrop-blur">
        {[
          { id: 'active' as const, bn: 'চলমান', en: 'Active', count: activeOrders.length },
          { id: 'past' as const, bn: 'ইতিহাস', en: 'History', count: pastOrders.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx('relative flex-1 px-2 py-2.5 text-[13.5px] font-semibold', tab === t.id ? 'text-primary-deep' : 'text-on-surface-variant')}
          >
            {bn ? t.bn : t.en} ({toBn(t.count, state.lang)})
            {tab === t.id && <span className="absolute inset-x-8 bottom-0 h-[2.5px] rounded-t-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-40 pt-3">
        {shown.length === 0 ? (
          <EmptyState
            icon={tab === 'active' ? 'pending_actions' : 'receipt_long'}
            title={tab === 'active' ? (bn ? 'কোনো চলমান অর্ডার নেই' : 'No active orders') : (bn ? 'পুরনো কোনো অর্ডার নেই' : 'No past orders')}
            subtitle={bn ? 'বাজার বা রেস্টুরেন্ট থেকে অর্ডার করুন — প্রতিটি ধাপ এখানে দেখতে পাবেন।' : 'Order from the bazaar or a restaurant and follow every step here.'}
            action={
              <button onClick={() => navigate('/bazaar')} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-bold text-white">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                {bn ? 'বাজার শুরু করুন' : 'Start shopping'}
              </button>
            }
          />
        ) : (
          shown.map(order => <OrderCard key={order.id} order={order} />)
        )}

        {shown.length > 0 && (
          <div className="mt-1 rounded-2xl bg-primary-tint p-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-primary-deep">
              <span className="material-symbols-outlined text-[16px]">help</span>
              {bn ? 'অর্ডার নিয়ে সমস্যা?' : 'Problem with an order?'}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-on-surface-variant">
              {bn ? 'যেকোনো অর্ডার খুলে "সমস্যা জানান" চাপুন — রিফান্ড বা বদলির ব্যবস্থা হবে।' : 'Open any order and tap “Report a problem” for a replacement or refund.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
