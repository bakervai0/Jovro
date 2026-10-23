import type { Order, CartItem, OrderStatus, OrderItem, TrackingUpdate, TimeSlot } from '../types';

const delay = (ms = 800) => new Promise(res => setTimeout(res, ms));

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'buying', 'on-the-way', 'delivered',
];

export const TRACKING_MESSAGES: Record<OrderStatus, { bn: string; en: string }> = {
  pending: { bn: 'অর্ডার পাওয়া গেছে', en: 'Order received' },
  confirmed: { bn: 'অর্ডার নিশ্চিত হয়েছে', en: 'Order confirmed' },
  buying: { bn: 'পণ্য কিনছি', en: 'Buying your items' },
  'on-the-way': { bn: 'রাইডার রওনা দিয়েছে', en: 'Rider on the way' },
  delivered: { bn: 'ডেলিভারি সম্পন্ন হয়েছে', en: 'Delivered successfully' },
  failed: { bn: 'ডেলিভারি ব্যর্থ হয়েছে', en: 'Delivery failed' },
  cancelled: { bn: 'অর্ডার বাতিল হয়েছে', en: 'Order cancelled' },
  'refund-in-progress': { bn: 'রিফান্ড প্রক্রিয়াধীন', en: 'Refund in progress' },
  refunded: { bn: 'রিফান্ড সম্পন্ন', en: 'Refunded' },
};

export async function placeOrder(
  cart: CartItem[],
  areaId: string,
  deliveryAddress: string,
  deliveryFee: number,
  promoCode: string | null,
  discount: number,
  paymentMethod: 'cod' | 'bkash' | 'nagad',
  timeSlot: TimeSlot,
  customerName: string,
  customerMobile: string,
  note?: string,
): Promise<{ success: boolean; order?: Order; error?: string }> {
  await delay(1200);

  const productsTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalTotal = productsTotal + deliveryFee - discount;

  const now = new Date().toISOString();
  const orderId = `JVR-${Date.now().toString(36).toUpperCase()}`;

  const trackingUpdates: TrackingUpdate[] = [{
    id: `trk-${Date.now()}`,
    status: 'pending',
    messageBn: TRACKING_MESSAGES.pending.bn,
    messageEn: TRACKING_MESSAGES.pending.en,
    timestamp: now,
  }];

  const items: OrderItem[] = cart.map((i, idx) => ({
    id: `item-${idx}-${Date.now()}`,
    nameBn: i.nameBn,
    nameEn: i.nameEn,
    quantity: i.quantity,
    unit: i.unit,
    approxPrice: i.price,
    source: i.source,
  }));

  const order: Order = {
    id: orderId,
    customerId: 'user-demo',
    customerName,
    customerMobile,
    deliveryAreaId: areaId,
    deliveryAddress,
    orderNote: note,
    items,
    productsTotal,
    deliveryFee,
    discountAmount: discount,
    promoCode: promoCode ?? undefined,
    finalTotal,
    status: 'pending',
    timeSlot,
    trackingUpdates,
    createdAt: now,
    updatedAt: now,
  };

  return { success: true, order };
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  await delay(600);
  console.log(`[Mock] Cancel order ${orderId}`);
  return { success: true };
}

export async function rateOrder(orderId: string, rating: number, comment: string): Promise<{ success: boolean }> {
  await delay(500);
  console.log(`[Mock] Rating order ${orderId}: ${rating}/5 — "${comment}"`);
  return { success: true };
}

/** Simulate auto-advance of order status (for demo) */
export function advanceOrderStatus(order: Order): Order {
  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  if (currentIdx === -1 || currentIdx >= ORDER_STATUSES.length - 1) return order;

  const nextStatus = ORDER_STATUSES[currentIdx + 1];
  const now = new Date().toISOString();
  const msg = TRACKING_MESSAGES[nextStatus];

  return {
    ...order,
    status: nextStatus,
    updatedAt: now,
    trackingUpdates: [...order.trackingUpdates, {
      id: `trk-${Date.now()}`,
      status: nextStatus,
      messageBn: msg.bn,
      messageEn: msg.en,
      timestamp: now,
    }],
  };
}
