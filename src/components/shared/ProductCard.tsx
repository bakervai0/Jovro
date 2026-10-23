import React from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PRODUCT_IMAGES } from '../../data/images';
import { cartLineForPrice, primaryCartLine } from '../../services/orderUtils';
import type { Product, CartItem, CartItemSource } from '../../types';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { state, dispatch, t } = useApp();
  const lang = state.lang;

  // Stepper acts on the real cart line (pack / price-split safe).
  const line = cartLineForPrice(state.cart, product.id, product.approxPrice) ?? primaryCartLine(state.cart, product.id);
  const qty = line?.quantity ?? 0;
  const isFav = state.favouriteProductIds.includes(product.id);

  const name = lang === 'bn' ? product.nameBn : product.nameEn;
  const unit = lang === 'bn' ? product.unit : product.unitEn;

  const addToCart = () => {
    const item: CartItem = {
      id: product.id,
      productId: product.id,
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      quantity: 1,
      price: product.approxPrice,
      unit: product.unit,
      source: 'bazaar' as CartItemSource,
      isApproxPrice: true,
    };
    dispatch({ type: 'ADD_TO_CART', item });
  };

  const updateQty = (delta: number) => {
    if (!line) return;
    const newQty = line.quantity + delta;
    if (newQty <= 0) dispatch({ type: 'REMOVE_FROM_CART', id: line.id });
    else dispatch({ type: 'UPDATE_CART_QTY', id: line.id, qty: newQty });
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_FAVOURITE', productId: product.id });
  };

  if (layout === 'list') {
    return (
      <div className={clsx(
        'flex items-center gap-3 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 p-3',
        !product.isAvailable && 'opacity-60',
      )}>
        {/* Photo (emoji fallback while a generated photo is missing) */}
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-[36px] flex-shrink-0 overflow-hidden">
          {PRODUCT_IMAGES[product.id]
            ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="w-full h-full object-cover" loading="lazy" />
            : product.imageEmoji}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-medium text-on-surface truncate">{name}</p>
          <p className="text-label-sm text-on-surface-variant">{unit}</p>
          <p className="text-label-lg font-bold text-primary">৳{product.approxPrice}</p>
        </div>
        {/* Actions */}
        <div className="flex-shrink-0">
          {!product.isAvailable ? (
            <span className="text-label-sm text-on-surface-variant">{t('common.unavailable')}</span>
          ) : qty > 0 ? (
            <QuantityStepper qty={qty} onIncrease={() => updateQty(1)} onDecrease={() => updateQty(-1)} />
          ) : (
            <button
              onClick={addToCart}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'rounded-3xl bg-surface-container-lowest border border-outline-variant/40 p-3 flex flex-col gap-2 relative',
      !product.isAvailable && 'opacity-60',
    )}>
      {/* Fav button */}
      <button
        onClick={toggleFav}
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center"
      >
        <span className={clsx(
          'material-symbols-outlined text-[20px]',
          isFav ? 'text-error filled-symbol' : 'text-on-surface-variant',
        )}>favorite</span>
      </button>

      {/* Image — generated photo, emoji tile as fallback */}
      <div className="h-28 rounded-2xl bg-surface-container flex items-center justify-center text-[52px] overflow-hidden">
        {PRODUCT_IMAGES[product.id]
          ? <img src={PRODUCT_IMAGES[product.id]} alt={name} className="w-full h-full object-cover" loading="lazy" />
          : product.imageEmoji}
      </div>

      {/* Name */}
      <div>
        <p className="text-body-md font-medium text-on-surface leading-snug line-clamp-2">{name}</p>
        <p className="text-label-sm text-on-surface-variant">{unit}</p>
      </div>

      {/* Price + Add */}
      <div className="flex items-center justify-between mt-auto">
        <p className="text-label-lg font-bold text-primary">৳{product.approxPrice}</p>
        {!product.isAvailable ? (
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">{t('common.unavailable')}</span>
        ) : qty > 0 ? (
          <QuantityStepper qty={qty} onIncrease={() => updateQty(1)} onDecrease={() => updateQty(-1)} compact />
        ) : (
          <button
            onClick={addToCart}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface QuantityStepperProps {
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  compact?: boolean;
}

export function QuantityStepper({ qty, onIncrease, onDecrease, compact }: QuantityStepperProps) {
  return (
    <div className={clsx(
      'flex items-center rounded-full bg-primary/12',
      compact ? 'gap-0' : 'gap-1',
    )}>
      <button
        onClick={onDecrease}
        className={clsx(
          'flex items-center justify-center rounded-full bg-primary text-white active:scale-90 transition-transform',
          compact ? 'w-7 h-7' : 'w-8 h-8',
        )}
      >
        <span className={clsx('material-symbols-outlined', compact ? 'text-[16px]' : 'text-[18px]')}>remove</span>
      </button>
      <span className={clsx(
        'font-bold text-primary text-center',
        compact ? 'text-label-md w-6' : 'text-body-md w-8',
      )}>{qty}</span>
      <button
        onClick={onIncrease}
        className={clsx(
          'flex items-center justify-center rounded-full bg-primary text-white active:scale-90 transition-transform',
          compact ? 'w-7 h-7' : 'w-8 h-8',
        )}
      >
        <span className={clsx('material-symbols-outlined', compact ? 'text-[16px]' : 'text-[18px]')}>add</span>
      </button>
    </div>
  );
}
