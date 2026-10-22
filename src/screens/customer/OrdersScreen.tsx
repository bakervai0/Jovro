import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { OrderCard } from '../../components/shared/OrderCard';
import type { OrderStatus } from '../../types';

const TABS: { id: 'active' | 'past'; labelBn: string; labelEn: string }[] = [
  { id: 'active', labelBn: 'চলমান', labelEn: 'Active' },
  { id: 'past', labelBn: 'ইতিহাস', labelEn: 'History' },
];

const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way'];
const PAST: OrderStatus[] = ['delivered', 'cancelled', 'refund-in-progress', 'refunded'];

export default function OrdersScreen() {
  const { state } = useApp();
  const lang = state.lang;
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const activeOrders = state.orders.filter(o => ACTIVE.includes(o.status));
  const pastOrders = state.orders.filter(o => PAST.includes(o.status));
  const shown = tab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        title={lang === 'bn' ? 'আমার অর্ডার' : 'My Orders'}
      />

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 px-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 py-3 text-label-lg font-medium transition-colors relative',
              tab === t.id ? 'text-primary' : 'text-on-surface-variant',
            )}
          >
            {lang === 'bn' ? t.labelBn : t.labelEn}
            {t.id === 'active' && activeOrders.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold">
                {activeOrders.length}
              </span>
            )}
            {tab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">
              {tab === 'active' ? 'pending_actions' : 'receipt_long'}
            </span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {tab === 'active'
                ? (lang === 'bn' ? 'কোনো চলমান অর্ডার নেই' : 'No active orders')
                : (lang === 'bn' ? 'কোনো পুরনো অর্ডার নেই' : 'No past orders')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
