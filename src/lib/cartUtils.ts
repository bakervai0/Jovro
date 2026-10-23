import type { CartItem, MenuItem, PackSize, Product, Restaurant } from '../types';

export type CartDispatch = (action: { type: 'ADD_TO_CART'; item: CartItem } | { type: 'UPDATE_CART_QTY'; id: string; qty: number } | { type: 'REMOVE_FROM_CART'; id: string }) => void;

export function bazaarLineId(productId: string, packId?: string) {
  return packId ? `${productId}::${packId}` : productId;
}

/** Add one unit of a bazaar product (optionally a specific pack size). */
export function addProductToCart(
  dispatch: CartDispatch,
  product: Product,
  pack?: PackSize,
  qty = 1,
) {
  const item: CartItem = {
    id: bazaarLineId(product.id, pack?.id),
    productId: product.id,
    nameBn: product.nameBn,
    nameEn: product.nameEn,
    price: pack ? pack.price : product.approxPrice,
    quantity: qty,
    unit: pack ? pack.labelBn : product.unit,
    source: 'bazaar',
    isApproxPrice: true,
  };
  dispatch({ type: 'ADD_TO_CART', item });
}

/** Add one unit of a restaurant menu item. */
export function addMenuItemToCart(dispatch: CartDispatch, restaurant: Restaurant, item: MenuItem, qty = 1) {
  const cartItem: CartItem = {
    id: item.id,
    menuItemId: item.id,
    restaurantId: restaurant.id,
    nameBn: item.nameBn,
    nameEn: item.nameEn,
    price: item.price,
    quantity: qty,
    unit: item.servesBn,
    source: 'restaurant',
    isApproxPrice: false,
  };
  dispatch({ type: 'ADD_TO_CART', item: cartItem });
}

export function findCartLine(cart: CartItem[], productId: string, packId?: string) {
  return cart.find(c => c.id === bazaarLineId(productId, packId));
}

export function cartSubtitle(cart: CartItem[], lang: 'bn' | 'en'): string {
  const hasBazaar = cart.some(i => i.source === 'bazaar');
  const hasRestaurant = cart.some(i => i.source === 'restaurant');
  if (lang === 'bn') {
    if (hasBazaar && hasRestaurant) return 'গোশালা বাজার ও রেস্টুরেন্ট';
    if (hasBazaar) return 'গোশালা বাজার';
    return 'রেস্টুরেন্ট';
  }
  if (hasBazaar && hasRestaurant) return 'Goshala Bazar & Restaurant';
  if (hasBazaar) return 'Goshala Bazar';
  return 'Restaurant';
}
