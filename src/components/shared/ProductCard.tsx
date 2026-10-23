import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { addProductToCart, findCartLine } from '../../lib/cartUtils';
import { tk, toBn } from '../../lib/format';
import { AddButton, QuantityStepper } from '../ui/Stepper';
import { asset } from '../../lib/asset';
import type { Product } from '../../types';

type Variant = 'flash' | 'grid' | 'search' | 'row' | 'compact';

export function ProductPhoto({
  product, className, rounded = 'rounded-2xl', emojiSize = 'text-[38px]',
}: {
  product: Product;
  className?: string;
  rounded?: string;
  emojiSize?: string;
}) {
  if (product.image) {
    return (
      <div className={clsx('relative overflow-hidden bg-surface-container', rounded, className)}>
        <img src={asset(product.image)} alt={product.nameEn} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={clsx('relative grid place-items-center overflow-hidden bg-gradient-to-br from-primary-tint to-surface-container', rounded, className)}>
      <span className={emojiSize}>{product.imageEmoji ?? '🛒'}</span>
    </div>
  );
}

function discountPrice(product: Product) {
  if (!product.isFlashSale || !product.flashDiscount) return null;
  return Math.round(product.approxPrice * (1 - product.flashDiscount / 100));
}

export function ProductCard({
  product,
  variant = 'grid',
  highlighted,
  onAdd,
}: {
  product: Product;
  variant?: Variant;
  highlighted?: boolean;
  onAdd?: () => void;
}) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const name = bn ? product.nameBn : product.nameEn;
  const unit = bn ? product.unit : product.unitEn;
  const soldOut = !product.isAvailable;

  const line = findCartLine(state.cart, product.id);
  const qty = line?.quantity ?? 0;

  const add = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (soldOut) return;
    if (onAdd) { onAdd(); return; }
    addProductToCart(dispatch, product);
  };

  const goDetail = () => navigate(`/product/${product.id}`);

  const stepper = (
    <QuantityStepper
      qty={qty}
      size={variant === 'search' ? 'md' : 'sm'}
      onDecrease={() => dispatch({ type: 'UPDATE_CART_QTY', id: line!.id, qty: qty - 1 })}
      onIncrease={() => addProductToCart(dispatch, product)}
    />
  );

  if (variant === 'flash') {
    const flash = discountPrice(product);
    return (
      <article
        onClick={goDetail}
        className="w-[142px] flex-shrink-0 cursor-pointer rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-card"
      >
        <div className="relative">
          <ProductPhoto product={product} className="h-[104px] w-full" rounded="rounded-xl" emojiSize="text-[40px]" />
          {product.flashDiscount ? (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-secondary-bright px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{toBn(product.flashDiscount, state.lang)}%
            </span>
          ) : null}
          {soldOut && (
            <span className="absolute inset-0 grid place-items-center rounded-xl bg-white/65 text-[11px] font-bold text-error">
              {bn ? 'স্টক নেই' : 'Sold out'}
            </span>
          )}
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[34px] text-[12.5px] font-semibold leading-snug text-on-surface">{name}</h3>
        <p className="text-[10.5px] text-on-surface-variant">
          {bn ? '১' : '1'} {unit}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[17px] font-bold leading-tight text-secondary">{tk(flash ?? product.approxPrice, state.lang)}</span>
          {flash && <span className="strike text-[11px] text-on-surface-variant">{tk(product.approxPrice, state.lang)}</span>}
        </div>

        <div className="mt-1.5">
          {qty > 0 ? (
            <div className="flex justify-center">{stepper}</div>
          ) : (
            <AddButton
              onClick={() => add()}
              disabled={soldOut}
              full
              size="sm"
              labelBn={bn ? 'যোগ করুন' : 'Add'}
              labelEn=""
            />
          )}
        </div>
      </article>
    );
  }

  if (variant === 'search') {
    return (
      <article
        onClick={goDetail}
        className={clsx(
          'relative cursor-pointer rounded-2xl bg-surface-container-lowest p-3 shadow-card transition-colors',
          highlighted ? 'border-2 border-primary' : 'border border-outline-variant/60',
        )}
      >
        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            <ProductPhoto product={product} className="h-[92px] w-[92px]" rounded="rounded-xl" emojiSize="text-[36px]" />
            {product.gradeBn && (
              <span className="absolute -bottom-1 left-1 rounded-md bg-primary-deep px-1.5 py-0.5 text-[9px] font-bold text-white">
                {bn ? product.gradeBn : (product.gradeEn ?? product.gradeBn)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[15.5px] font-bold leading-snug text-on-surface">{name}</h3>
            <p className="mt-0.5 text-[11.5px] leading-tight text-on-surface-variant">
              {product.nameEn} <span className="px-0.5">•</span> {bn ? product.unit : product.unitEn}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-medium text-primary-deep">
              <span className="material-symbols-outlined text-[14px]">storefront</span>
              {bn ? product.marketBn : (product.marketEn ?? product.marketBn)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[17px] font-bold leading-tight text-primary-deep">
              <span className="mr-1 text-[12px] font-semibold text-on-surface-variant">{bn ? 'আনুমানিক' : 'Approx'}</span>
              {tk(product.approxPrice, state.lang)}
            </p>
            <p className="text-[10.5px] leading-tight text-on-surface-variant/85">
              {bn ? 'রসিদ অনুযায়ী চূড়ান্ত হিসাব / As per bazaar receipt' : 'Final amount as per bazaar receipt'}
            </p>
          </div>
          <div className="flex-shrink-0 pb-0.5">
            {soldOut ? (
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                {bn ? 'স্টক নেই' : 'Sold out'}
              </span>
            ) : qty > 0 ? (
              stepper
            ) : (
              <AddButton
                onClick={() => add()}
                size="md"
                labelBn={bn ? 'যোগ করুন' : 'Add'}
                labelEn=""
              />
            )}
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="w-[118px] flex-shrink-0 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-1.5 shadow-card">
        <button onClick={goDetail} className="block w-full text-left">
          <ProductPhoto product={product} className="h-[76px] w-full" rounded="rounded-xl" emojiSize="text-[30px]" />
          <h3 className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-on-surface">{name}</h3>
          <p className="text-[11px] font-bold text-primary">
            {tk(product.approxPrice, state.lang)}
            <span className="text-[10px] font-normal text-on-surface-variant">/{unit}</span>
          </p>
        </button>
        <button
          onClick={() => add()}
          disabled={soldOut}
          className="mt-1 flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-primary-soft text-[11px] font-semibold text-primary-deep active:scale-95 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          {bn ? 'যোগ' : 'Add'}
        </button>
      </article>
    );
  }

  // grid + row (grid is the default two-column tile)
  return (
    <article
      onClick={goDetail}
      className={clsx(
        'flex cursor-pointer flex-col rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-card',
        variant === 'row' && 'flex-row items-center gap-3 p-3',
        soldOut && 'opacity-70',
      )}
    >
      <div className={clsx('relative', variant === 'row' && 'flex-shrink-0')}>
        <ProductPhoto
          product={product}
          className={clsx(variant === 'row' ? 'h-[72px] w-[72px]' : 'h-[104px] w-full')}
          rounded="rounded-xl"
          emojiSize="text-[34px]"
        />
        {product.gradeBn && (
          <span className="absolute left-1 top-1 rounded bg-primary-deep px-1 py-0.5 text-[9px] font-semibold text-white">
            {bn ? product.gradeBn : (product.gradeEn ?? product.gradeBn)}
          </span>
        )}
      </div>

      <div className={clsx('min-w-0 flex-1', variant === 'grid' && 'mt-1.5')}>
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-on-surface">{name}</h3>
        <p className="text-[10.5px] text-on-surface-variant">
          {bn ? '১' : '1'} {unit}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-[15px] font-bold text-primary-deep">{tk(product.approxPrice, state.lang)}</span>
          {soldOut ? (
            <span className="text-[10px] font-semibold text-on-surface-variant">{bn ? 'স্টক নেই' : 'Sold out'}</span>
          ) : qty > 0 ? (
            stepper
          ) : (
            <button
              onClick={e => { e.stopPropagation(); add(); }}
              aria-label="add"
              className="grid h-7 w-7 place-items-center rounded-full bg-primary-deep text-white active:scale-90"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
