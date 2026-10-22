import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { ConfirmSheet } from '../../components/ui/BottomSheet';
import { cancelOrder } from '../../services/orders';
import type { OrderStatus } from '../../types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'buying', 'on-the-way', 'delivered'];

const STATUS_LABEL: Record<OrderStatus, { bn: string; en: string; icon: string }> = {
  pending: { bn: 'অপেক্ষায়', en: 'Pending', icon: 'receipt' },
  confirmed: { bn: 'নিশ্চিত', en: 'Confirmed', icon: 'check_circle' },
  buying: { bn: 'কেনাকাটা', en: 'Buying', icon: 'shopping_basket' },
  'on-the-way': { bn: 'আসছে', en: 'On the way', icon: 'directions_bike' },
  delivered: { bn: 'ডেলিভারি হয়েছে', en: 'Delivered', icon: 'task_alt' },
  cancelled: { bn: 'বাতিল', en: 'Cancelled', icon: 'cancel' },
  'refund-in-progress': { bn: 'রিফান্ড হচ্ছে', en: 'Refunding', icon: 'currency_exchange' },
  refunded: { bn: 'রিফান্ড হয়েছে', en: 'Refunded', icon: 'paid' },
};

export default function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const lang = state.lang;
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const order = state.orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-surface">
        <TopAppBar showBack title={lang === 'bn' ? 'অর্ডার বিবরণ' : 'Order Detail'} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body-lg text-on-surface-variant">
            {lang === 'bn' ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}
          </p>
        </div>
      </div>
    );
  }

  const isActive = ['pending', 'confirmed', 'buying', 'on-the-way'].includes(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const currentStepIdx = STATUS_STEPS.indexOf(order.status as OrderStatus);

  const handleCancel = () => {
    setCancelling(true);
    cancelOrder(order.id).then(result => {
      if (result.success) {
        dispatch({
          type: 'UPDATE_ORDER',
          order: {
            ...order,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          },
        });
      }
      setCancelling(false);
      setShowCancel(false);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={`#${order.id}`}
        subtitle={lang === 'bn' ? STATUS_LABEL[order.status].bn : STATUS_LABEL[order.status].en}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* Progress stepper (only for non-cancelled) */}
        {isActive && (
          <div className="px-4 py-5">
            <div className="flex items-start gap-0">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < currentStepIdx;
                const current = idx === currentStepIdx;
                const future = idx > currentStepIdx;
                const label = STATUS_LABEL[step];
                return (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    {/* Dot + line */}
                    <div className="flex items-center w-full">
                      {idx > 0 && (
                        <div className={clsx('flex-1 h-0.5', done || current ? 'bg-primary' : 'bg-outline-variant')} />
                      )}
                      <div className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all',
                        done ? 'bg-primary border-primary' :
                        current ? 'bg-white border-primary' :
                        'bg-surface border-outline-variant',
                      )}>
                        {done ? (
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        ) : current ? (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={clsx('flex-1 h-0.5', done ? 'bg-primary' : 'bg-outline-variant')} />
                      )}
                    </div>
                    {/* Label */}
                    <p className={clsx(
                      'text-[10px] mt-1.5 text-center leading-tight',
                      current ? 'text-primary font-semibold' :
                      done ? 'text-primary/70' :
                      'text-on-surface-variant',
                    )}>
                      {lang === 'bn' ? label.bn : label.en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {order.status === 'cancelled' && (
          <div className="mx-4 my-4 p-4 bg-error/10 border border-error/20 rounded-3xl flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
            <p className="text-body-sm text-error font-medium">
              {lang === 'bn' ? 'এই অর্ডারটি বাতিল হয়েছে।' : 'This order has been cancelled.'}
            </p>
          </div>
        )}

        {/* Tracking updates */}
        {order.trackingUpdates.length > 0 && (
          <div className="px-4 mb-4">
            <p className="text-label-lg font-semibold text-on-surface mb-3">
              {lang === 'bn' ? 'ট্র্যাকিং' : 'Tracking'}
            </p>
            <div className="flex flex-col gap-0">
              {[...order.trackingUpdates].reverse().map((upd, i) => (
                <div key={upd.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      i === 0 ? 'bg-primary' : 'bg-outline-variant',
                    )} />
                    {i < order.trackingUpdates.length - 1 && (
                      <div className="w-px flex-1 bg-outline-variant/50 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-body-sm font-medium text-on-surface">
                      {lang === 'bn' ? upd.messageBn : upd.messageEn}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      {new Date(upd.timestamp).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-BD', { hour: '2-digit', minute: '2-digit' })}
                      {upd.locationNote && ` · ${upd.locationNote}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="px-4 mb-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? `পণ্য (${order.items.length}টি)` : `Items (${order.items.length})`}
          </p>
          <div className="flex flex-col gap-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0">
                <div>
                  <p className="text-body-sm font-medium text-on-surface">
                    {lang === 'bn' ? item.nameBn : item.nameEn}
                  </p>
                  {item.unit && (
                    <p className="text-label-sm text-on-surface-variant">{item.unit}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-medium text-on-surface">
                    ×{item.quantity}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">≈৳{item.approxPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery info */}
        <div className="mx-4 mb-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Info'}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">location_on</span>
              <p className="text-body-sm text-on-surface flex-1">{order.deliveryAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
              <p className="text-body-sm text-on-surface">
                {lang === 'bn'
                  ? order.timeSlot === 'morning' ? 'সকাল ৮টা–১২টা' : order.timeSlot === 'afternoon' ? 'দুপুর ১২টা–৫টা' : 'সন্ধ্যা ৫টা–৮টা'
                  : order.timeSlot === 'morning' ? '8AM–12PM' : order.timeSlot === 'afternoon' ? '12PM–5PM' : '5PM–8PM'}
              </p>
            </div>
          </div>
        </div>

        {/* Bill */}
        <div className="mx-4 mb-4 bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
          <p className="text-label-lg font-semibold text-on-surface mb-3">
            {lang === 'bn' ? 'বিল' : 'Bill'}
          </p>
          {[
            { labelBn: 'পণ্যের আনুমানিক দাম', labelEn: 'Items (approx)', value: order.productsTotal },
            { labelBn: 'ডেলিভারি ফি', labelEn: 'Delivery fee', value: order.deliveryFee },
            ...(order.discountAmount > 0 ? [{ labelBn: 'ছাড়', labelEn: 'Discount', value: -order.discountAmount }] : []),
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-1">
              <span className="text-body-sm text-on-surface-variant">{lang === 'bn' ? row.labelBn : row.labelEn}</span>
              <span className={clsx('text-body-sm font-medium', row.value < 0 ? 'text-success' : 'text-on-surface')}>
                {row.value < 0 ? `-৳${Math.abs(row.value)}` : `৳${row.value}`}
              </span>
            </div>
          ))}
          <div className="h-px bg-outline-variant/40 my-2" />
          <div className="flex justify-between">
            <span className="text-body-md font-bold text-on-surface">{lang === 'bn' ? 'মোট' : 'Total'}</span>
            <span className="text-title-sm font-bold text-primary">৳{order.finalTotal}</span>
          </div>
        </div>

        {/* Cancel button */}
        {canCancel && (
          <div className="px-4">
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowCancel(true)}
              loading={cancelling}
              className="border-error text-error"
            >
              {lang === 'bn' ? 'অর্ডার বাতিল করুন' : 'Cancel Order'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmSheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title={lang === 'bn' ? 'অর্ডার বাতিল করবেন?' : 'Cancel this order?'}
        body={lang === 'bn' ? 'বাতিল করলে আর ফেরত নেওয়া যাবে না।' : 'This cannot be undone.'}
        confirmLabel={lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, cancel'}
        danger
        loading={cancelling}
      />
    </div>
  );
}
