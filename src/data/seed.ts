import type {
  User, Order, Rider, Affiliate, StaffMember,
  ProblemReport, Review, AppNotification, PromoCode,
  SavedAddress, TrackingUpdate
} from '../types';

// ── Demo Users ─────────────────────────────────────────────────
export const DEMO_USERS: Record<string, User> = {
  customer: {
    id: 'u-001', name: 'Rabeya Khatun', nameBn: 'রাবেয়া খাতুন',
    mobile: '01712345678', role: 'customer',
    deliveryAreaId: 'area-01', isVerified: true,
    createdAt: '2024-03-15', referralCode: 'RABEYA10',
  },
  rider: {
    id: 'u-002', name: 'Md. Rakibul Islam', nameBn: 'মো. রাকিবুল ইসলাম',
    mobile: '01811223344', role: 'rider',
    deliveryAreaId: 'area-01', isVerified: true,
    createdAt: '2024-01-10', referralCode: 'RAKIB20',
  },
  affiliate: {
    id: 'u-003', name: 'Nasrin Akter', nameBn: 'নাসরিন আক্তার',
    mobile: '01977665544', role: 'affiliate',
    deliveryAreaId: 'area-03', isVerified: true,
    createdAt: '2024-02-20', referralCode: 'NASRIN15',
  },
  staff: {
    id: 'u-004', name: 'Imran Hossain', nameBn: 'ইমরান হোসেন',
    mobile: '01633221100', role: 'staff',
    deliveryAreaId: 'area-01', isVerified: true,
    createdAt: '2024-01-05', referralCode: 'IMRAN30',
  },
  admin: {
    id: 'u-005', name: 'Shusmita Rani', nameBn: 'শুসমিতা রানী',
    mobile: '01555000001', role: 'admin',
    deliveryAreaId: 'area-01', isVerified: true,
    createdAt: '2023-11-01', referralCode: 'ADMIN00',
  },
};

// ── Tracking Updates ────────────────────────────────────────────
const makeTracking = (status: string, msgBn: string, msgEn: string, time: string, loc?: string): TrackingUpdate => ({
  id: `tr-${Math.random().toString(36).slice(2,8)}`,
  status: status as TrackingUpdate['status'],
  messageBn: msgBn, messageEn: msgEn,
  timestamp: time, locationNote: loc,
});

// ── Sample Orders ───────────────────────────────────────────────
export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'JV-240001',
    customerId: 'u-001', customerName: 'রাবেয়া খাতুন', customerMobile: '01712345678',
    deliveryAreaId: 'area-01', deliveryAddress: 'গোশালা বাজার, মসজিদের পাশের গলি, ২য় বাড়ি',
    orderNote: 'মাছ যেন তাজা হয়',
    items: [
      { id: 'oi-1', nameBn: 'মিনিকেট চাল', nameEn: 'Miniket Rice', quantity: 2, unit: 'কেজি', approxPrice: 68, source: 'bazaar' },
      { id: 'oi-2', nameBn: 'রুই মাছ', nameEn: 'Rui Fish', quantity: 1, unit: 'কেজি', approxPrice: 220, source: 'bazaar' },
      { id: 'oi-3', nameBn: 'সয়াবিন তেল', nameEn: 'Soybean Oil', quantity: 1, unit: 'লিটার', approxPrice: 170, source: 'bazaar' },
    ],
    productsTotal: 526, deliveryFee: 20, discountAmount: 0, finalTotal: 546,
    status: 'on-the-way', timeSlot: 'morning', riderId: 'rider-01',
    trackingUpdates: [
      makeTracking('confirmed', 'অর্ডার নিশ্চিত হয়েছে', 'Order confirmed', '2024-11-10T09:00:00'),
      makeTracking('buying', 'গোশালা থেকে কিনলাম', 'Bought from Goshala', '2024-11-10T09:30:00', 'গোশালা বাজার'),
      makeTracking('on-the-way', 'আপনার কাছে রওনা দিয়েছি', 'On the way to you', '2024-11-10T09:50:00'),
    ],
    createdAt: '2024-11-10T08:55:00', updatedAt: '2024-11-10T09:50:00',
  },
  {
    id: 'JV-240002',
    customerId: 'u-001', customerName: 'রাবেয়া খাতুন', customerMobile: '01712345678',
    deliveryAreaId: 'area-01', deliveryAddress: 'গোশালা বাজার, মসজিদের পাশের গলি, ২য় বাড়ি',
    items: [
      { id: 'oi-4', nameBn: 'মুরগির বিরিয়ানি', nameEn: 'Chicken Biryani', quantity: 2, approxPrice: 120, source: 'restaurant' },
      { id: 'oi-5', nameBn: 'বোরহানি', nameEn: 'Borhani', quantity: 2, approxPrice: 30, source: 'restaurant' },
    ],
    productsTotal: 300, deliveryFee: 20, discountAmount: 50, promoCode: 'JOVRO50',
    finalTotal: 270, status: 'delivered', timeSlot: 'afternoon',
    trackingUpdates: [
      makeTracking('confirmed', 'অর্ডার নিশ্চিত', 'Order confirmed', '2024-11-08T12:00:00'),
      makeTracking('on-the-way', 'রওনা দিয়েছি', 'On the way', '2024-11-08T12:20:00'),
      makeTracking('delivered', 'পৌঁছে দিয়েছি', 'Delivered', '2024-11-08T12:45:00'),
    ],
    createdAt: '2024-11-08T11:55:00', updatedAt: '2024-11-08T12:45:00',
  },
  {
    id: 'JV-240003',
    customerId: 'u-006', customerName: 'মোহাম্মদ আব্দুল করিম', customerMobile: '01855443322',
    deliveryAreaId: 'area-03', deliveryAddress: 'হাড়িভাঙ্গা, বড় গেটের পাশের বাড়ি',
    items: [
      { id: 'oi-6', nameBn: 'আলু', nameEn: 'Potato', quantity: 3, unit: 'কেজি', approxPrice: 35, source: 'bazaar' },
      { id: 'oi-7', nameBn: 'পেঁয়াজ', nameEn: 'Onion', quantity: 1, unit: 'কেজি', approxPrice: 60, source: 'bazaar' },
    ],
    productsTotal: 165, deliveryFee: 25, discountAmount: 0, finalTotal: 190,
    status: 'cancelled', timeSlot: 'evening', riderId: undefined,
    trackingUpdates: [
      makeTracking('confirmed', 'অর্ডার নিশ্চিত', 'Order confirmed', '2024-11-07T17:00:00'),
      makeTracking('cancelled', 'অর্ডার বাতিল হয়েছে', 'Order cancelled', '2024-11-07T17:30:00'),
    ],
    createdAt: '2024-11-07T16:55:00', updatedAt: '2024-11-07T17:30:00',
  },
  {
    id: 'JV-240004',
    customerId: 'u-007', customerName: 'ফাতেমা বেগম', customerMobile: '01700112233',
    deliveryAreaId: 'area-05', deliveryAddress: 'খাটাপাড়া, রেলের পাশের গলি',
    items: [
      { id: 'oi-8', nameBn: 'মসুর ডাল', nameEn: 'Red Lentil', quantity: 1, unit: 'কেজি', approxPrice: 110, source: 'bazaar' },
      { id: 'oi-9', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler Chicken', quantity: 1, unit: 'কেজি', approxPrice: 190, source: 'bazaar' },
      { id: 'oi-10', nameBn: 'ডিম (হালি)', nameEn: 'Eggs', quantity: 2, unit: 'হালি', approxPrice: 50, source: 'bazaar' },
    ],
    productsTotal: 400, deliveryFee: 30, discountAmount: 0, finalTotal: 430,
    status: 'pending', timeSlot: 'morning', riderId: undefined,
    trackingUpdates: [
      makeTracking('pending', 'অর্ডার পেয়েছি, প্রক্রিয়া করছি', 'Order received, processing', '2024-11-10T08:00:00'),
    ],
    createdAt: '2024-11-10T08:00:00', updatedAt: '2024-11-10T08:00:00',
  },
  {
    id: 'JV-240005',
    customerId: 'u-008', customerName: 'সিরাজুল হক', customerMobile: '01922334455',
    deliveryAreaId: 'area-07', deliveryAddress: 'স্টেশন রোড, ৩ নম্বর বাড়ি',
    items: [
      { id: 'oi-11', nameBn: 'চিকেন বার্গার', nameEn: 'Chicken Burger', quantity: 2, approxPrice: 90, source: 'restaurant' },
      { id: 'oi-12', nameBn: 'ফ্রেঞ্চ ফ্রাই', nameEn: 'French Fries', quantity: 1, approxPrice: 60, source: 'restaurant' },
    ],
    productsTotal: 240, deliveryFee: 25, discountAmount: 0, finalTotal: 265,
    status: 'confirmed', timeSlot: 'afternoon', riderId: 'rider-02',
    trackingUpdates: [
      makeTracking('confirmed', 'অর্ডার নিশ্চিত, রাইডার যাচ্ছে', 'Order confirmed, rider dispatched', '2024-11-10T13:00:00'),
    ],
    createdAt: '2024-11-10T12:55:00', updatedAt: '2024-11-10T13:00:00',
    hasComplaint: false,
  },
];

// ── Riders ──────────────────────────────────────────────────────
export const SAMPLE_RIDERS: Rider[] = [
  { id: 'rider-01', userId: 'u-002', name: 'Md. Rakibul Islam', nameBn: 'রাকিবুল ইসলাম', mobile: '01811223344', vehicleType: 'bicycle', status: 'active', totalDeliveries: 342, totalEarnings: 34200, rating: 4.8, joinedAt: '2024-01-10', pendingPayout: 1500 },
  { id: 'rider-02', userId: 'u-009', name: 'Sumon Mia', nameBn: 'সুমন মিয়া', mobile: '01755667788', vehicleType: 'bicycle', status: 'active', totalDeliveries: 198, totalEarnings: 19800, rating: 4.6, joinedAt: '2024-03-05', pendingPayout: 800 },
  { id: 'rider-03', userId: 'u-010', name: 'Sharif Uddin', nameBn: 'শরিফ উদ্দিন', mobile: '01622334411', vehicleType: 'motorbike', status: 'inactive', totalDeliveries: 512, totalEarnings: 61440, rating: 4.9, joinedAt: '2023-12-15', pendingPayout: 0 },
];

// ── Affiliates ──────────────────────────────────────────────────
export const SAMPLE_AFFILIATES: Affiliate[] = [
  { id: 'aff-01', userId: 'u-003', name: 'Nasrin Akter', nameBn: 'নাসরিন আক্তার', mobile: '01977665544', referralCode: 'NASRIN15', status: 'active', totalReferrals: 28, totalEarnings: 2800, pendingPayout: 350, joinedAt: '2024-02-20' },
  { id: 'aff-02', userId: 'u-011', name: 'Karim Bepari', nameBn: 'করিম বেপারী', mobile: '01844556677', referralCode: 'KARIM20', status: 'active', totalReferrals: 15, totalEarnings: 1500, pendingPayout: 200, joinedAt: '2024-04-01' },
];

// ── Staff Members ───────────────────────────────────────────────
export const SAMPLE_STAFF: StaffMember[] = [
  { id: 'staff-01', name: 'Imran Hossain', nameBn: 'ইমরান হোসেন', mobile: '01633221100', email: 'imran@jovro.com', permissions: ['orders', 'products', 'customers'], isActive: true, addedAt: '2024-01-05', lastActive: '2024-11-10T08:30:00' },
  { id: 'staff-02', name: 'Rima Begum', nameBn: 'রিমা বেগম', mobile: '01744556677', email: 'rima@jovro.com', permissions: ['orders', 'riders'], isActive: true, addedAt: '2024-02-15', lastActive: '2024-11-10T09:00:00' },
];

// ── Promo Codes ─────────────────────────────────────────────────
export const PROMO_CODES: PromoCode[] = [
  { code: 'JOVRO50', descriptionBn: 'প্রথম অর্ডারে ৳৫০ ছাড়', descriptionEn: '৳50 off on first order', discountType: 'flat', discountValue: 50, minOrder: 200, isActive: true },
  { code: 'NEWUSER', descriptionBn: 'নতুন ব্যবহারকারীর জন্য ১০% ছাড়', descriptionEn: '10% off for new users', discountType: 'percent', discountValue: 10, minOrder: 150, maxDiscount: 80, isActive: true },
  { code: 'SAVE30', descriptionBn: '৳৩০ ছাড়', descriptionEn: '৳30 flat discount', discountType: 'flat', discountValue: 30, minOrder: 150, isActive: false },
];

// ── Problem Reports ─────────────────────────────────────────────
export const SAMPLE_PROBLEM_REPORTS: ProblemReport[] = [
  { id: 'pr-01', orderId: 'JV-240002', customerId: 'u-001', customerName: 'রাবেয়া খাতুন', problemType: 'wrong-item', descriptionBn: 'মুরগির বিরিয়ানি দেওয়ার কথা ছিল কিন্তু গরুর বিরিয়ানি দিয়েছে', status: 'in-review', createdAt: '2024-11-08T14:00:00' },
  { id: 'pr-02', orderId: 'JV-240003', customerId: 'u-006', customerName: 'আব্দুল করিম', problemType: 'late-delivery', descriptionBn: 'নির্ধারিত সময়ের ২ ঘণ্টা পরে এসেছে', status: 'resolved', createdAt: '2024-11-07T20:00:00', resolvedAt: '2024-11-08T10:00:00' },
];

// ── Reviews ─────────────────────────────────────────────────────
export const SAMPLE_REVIEWS: Review[] = [
  { id: 'rev-01', orderId: 'JV-240002', customerId: 'u-001', customerName: 'রাবেয়া খাতুন', rating: 5, commentBn: 'অনেক দ্রুত এবং সুন্দর সার্ভিস!', isApproved: true, isHidden: false, createdAt: '2024-11-08T13:00:00' },
  { id: 'rev-02', orderId: 'JV-240005', customerId: 'u-008', customerName: 'সিরাজুল হক', rating: 4, commentBn: 'ভালো সার্ভিস, একটু দেরি হয়েছিল', isApproved: true, isHidden: false, createdAt: '2024-11-09T15:00:00' },
];

// ── Notifications ────────────────────────────────────────────────
export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  { id: 'notif-01', userId: 'u-001', type: 'order-update', titleBn: 'অর্ডার রওনা দিয়েছে', titleEn: 'Order on the way', bodyBn: 'আপনার অর্ডার JV-240001 এখন রওনা দিয়েছে।', bodyEn: 'Your order JV-240001 is on the way.', isRead: false, createdAt: '2024-11-10T09:50:00', orderId: 'JV-240001' },
  { id: 'notif-02', userId: 'u-001', type: 'promo', titleBn: 'বিশেষ অফার!', titleEn: 'Special Offer!', bodyBn: 'আজ সন্ধ্যায় ৳৫০ ছাড়। কোড: JOVRO50', bodyEn: 'Get ৳50 off this evening. Code: JOVRO50', isRead: false, createdAt: '2024-11-10T07:00:00' },
  { id: 'notif-03', userId: 'u-001', type: 'order-update', titleBn: 'অর্ডার ডেলিভারি হয়েছে', titleEn: 'Order Delivered', bodyBn: 'আপনার অর্ডার JV-240002 পৌঁছে দেওয়া হয়েছে।', bodyEn: 'Your order JV-240002 has been delivered.', isRead: true, createdAt: '2024-11-08T12:45:00', orderId: 'JV-240002' },
];

// ── Saved Addresses ─────────────────────────────────────────────
export const SAMPLE_ADDRESSES: SavedAddress[] = [
  { id: 'addr-01', userId: 'u-001', label: 'বাড়ি', labelEn: 'Home', fullAddress: 'গোশালা বাজার, মসজিদের পাশের গলি, ২য় বাড়ি', areaId: 'area-01', isDefault: true },
  { id: 'addr-02', userId: 'u-001', label: 'অফিস', labelEn: 'Office', fullAddress: 'মিশন মোড়, ডিসি অফিসের কাছে', areaId: 'area-02', isDefault: false },
];
