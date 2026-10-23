import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { cartSubtitle } from '../../lib/cartUtils';
import { tk, toBn } from '../../lib/format';

/** Floating deep-green cart bar shown above the nav on every shopping screen. */
export function StickyCartBar({ className }: { className?: string }) {
  const { state, cartCount, cartFinal } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bn = state.lang === 'bn';

  const hidden = ['/cart', '/checkout', '/order-success'].some(p => pathname.startsWith(p));
  if (cartCount === 0 || hidden) return null;

  return (
    <div className={clsx('cart-bar-float pointer-events-none', className)} style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <button
        onClick={() => navigate('/cart')}
        className="pointer-events-auto flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-primary-deep to-primary px-2.5 py-2.5 text-left shadow-cart-bar transition-transform active:scale-[0.985]"
      >
        <span className="relative grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/15">
          <span className="material-symbols-outlined filled-symbol text-[19px] text-white">shopping_bag</span>
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-primary-deep">
            {toBn(cartCount, state.lang)}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold leading-tight text-white">
            {toBn(cartCount, state.lang)}
            {bn ? 'টি আইটেম' : ' items'} <span className="mx-1 opacity-60">•</span> {tk(cartFinal, state.lang)}
          </span>
          <span className="block truncate text-[10.5px] leading-tight text-white/75">{cartSubtitle(state.cart, state.lang)}</span>
        </span>

        <span className="flex flex-shrink-0 items-center gap-1.5 pr-2 text-[12.5px] font-bold text-white">
          <span className="whitespace-nowrap">
            {bn ? 'কার্ট দেখুন' : 'View cart'}
            <span className="ml-1 font-normal opacity-80">{bn ? 'View Cart' : 'কার্ট দেখুন'}</span>
          </span>
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </span>
      </button>
    </div>
  );
}

/** Floating AI-assistant chat button (always visible for customers). */
export function ChatFab({ withLabel }: { withLabel?: boolean }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bn = state.lang === 'bn';
  const { cartCount } = useApp();
  const bottom = cartCount > 0 && !['/cart', '/checkout'].some(p => pathname.startsWith(p))
    ? 'calc(10.75rem + env(safe-area-inset-bottom, 0px))'
    : 'calc(5rem + env(safe-area-inset-bottom, 0px))';

  if (pathname.startsWith('/ai') || pathname.startsWith('/checkout')) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-fab flex w-full max-w-app -translate-x-1/2 justify-end px-4"
      style={{ bottom }}
    >
      <button
        onClick={() => navigate('/ai')}
        aria-label={bn ? 'সহায়ক' : 'Assistant'}
        className={clsx(
          'pointer-events-auto relative flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#22C55E] to-primary text-white shadow-fab transition-transform active:scale-95',
          withLabel ? 'h-11 pl-3 pr-4' : 'h-[54px] w-[54px] justify-center',
        )}
      >
        <span className="material-symbols-outlined filled-symbol text-[24px]">chat</span>
        {withLabel && <span className="text-[13px] font-semibold">{bn ? 'সহায়ক' : 'Assistant'}</span>}
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-secondary-bright" />
      </button>
    </div>
  );
}

/** Cart bar + chat button layer used by the customer layout. */
export function FloatingShoppingLayer() {
  const { pathname } = useLocation();
  const { cartCount } = useApp();
  const hideCart = ['/cart', '/checkout', '/order-success'].some(p => pathname.startsWith(p));
  return (
    <>
      {cartCount > 0 && !hideCart ? <StickyCartBar /> : null}
      <ChatFab />
    </>
  );
}
