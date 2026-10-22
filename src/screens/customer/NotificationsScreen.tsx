import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { IconButton } from '../../components/ui/Button';
import type { NotificationType } from '../../types';

const TYPE_ICON: Record<NotificationType, string> = {
  'order-update': 'local_shipping',
  promo: 'local_offer',
  system: 'info',
  refund: 'currency_exchange',
  delivery: 'package',
};

const TYPE_COLOR: Record<NotificationType, string> = {
  'order-update': 'bg-primary/10 text-primary',
  promo: 'bg-secondary/10 text-secondary',
  system: 'bg-surface-container text-on-surface-variant',
  refund: 'bg-success/10 text-success',
  delivery: 'bg-tertiary/10 text-tertiary',
};

export default function NotificationsScreen() {
  const { state, dispatch, unreadCount } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const handleClick = (notifId: string, orderId?: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', id: notifId });
    if (orderId) navigate(`/orders/${orderId}`);
  };

  const markAllRead = () => dispatch({ type: 'MARK_ALL_READ' });

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
        subtitle={unreadCount > 0 ? (lang === 'bn' ? `${unreadCount}টি অপঠিত` : `${unreadCount} unread`) : undefined}
        actions={
          unreadCount > 0 ? (
            <IconButton icon="done_all" onClick={markAllRead} title="Mark all read" />
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {state.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">notifications_off</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {lang === 'bn' ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {state.notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif.id, notif.orderId)}
                className={clsx(
                  'w-full text-left flex items-start gap-3 px-4 py-4 border-b border-outline-variant/20 transition-colors',
                  !notif.isRead ? 'bg-primary/4' : 'hover:bg-surface-container active:bg-surface-container',
                )}
              >
                {/* Icon */}
                <div className={clsx(
                  'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  TYPE_COLOR[notif.type],
                )}>
                  <span className="material-symbols-outlined text-[20px]">{TYPE_ICON[notif.type]}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx(
                      'text-body-sm leading-snug',
                      notif.isRead ? 'font-medium text-on-surface' : 'font-semibold text-on-surface',
                    )}>
                      {lang === 'bn' ? notif.titleBn : notif.titleEn}
                    </p>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">
                    {lang === 'bn' ? notif.bodyBn : notif.bodyEn}
                  </p>
                  <p className="text-label-sm text-on-surface-variant/60 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-BD', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
