import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const rounds = { sm: 'rounded', md: 'rounded-xl', lg: 'rounded-2xl', full: 'rounded-full' };
  return (
    <div className={clsx(
      'bg-surface-container-high animate-pulse',
      rounds[rounded],
      className,
    )} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl border border-outline-variant/40 p-3 flex flex-col gap-2">
      <Skeleton className="h-28 w-full" rounded="lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center mt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8" rounded="full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-3xl border border-outline-variant/40 p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-28" rounded="lg" />
      </div>
    </div>
  );
}
