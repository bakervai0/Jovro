// ============================================================
// Jovro — Core TypeScript Types
// ============================================================

export type UserRole = 'customer' | 'rider' | 'affiliate' | 'staff' | 'admin';
export type Lang = 'bn' | 'en';

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  nameBn: string;
  mobile: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  deliveryAreaId?: string;
  isVerified: boolean;
  createdAt: string;
  referralCode: string;
  referredBy?: string;
  hasActivePass?: boolean;
}

// ── Area & Fees ───────────────────────────────────────────────
export interface DeliveryArea {
  id: string;
  nameBn: string;
  nameEn: string;
  fee: number;        // BDT
  zone: 'town' | 'union';
  group?: string;
}

// ── Products ─────────────────────────────────────────────────
export type ProductCategory =
  | 'rice-pulses'
  | 'oil-spices'
  | 'vegetables'
  | 'fish-meat'
  | 'milk-eggs'
  | 'snacks';

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  category: ProductCategory;
  unit: string;       // e.g. "কেজি", "পিস", "লিটার"
  unitEn: string;
  approxPrice: number; // BDT — approximate bazaar price
  isAvailable: boolean;
  imageEmoji?: string; // fallback emoji for demo
  tags?: string[];
}

// ── Restaurants ───────────────────────────────────────────────
export interface MenuItem {
  id: string;
  restaurantId: string;
  nameBn: string;
  nameEn: string;
  price: number;      // exact price
  category?: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface Restaurant {
  id: string;
  nameBn: string;
  nameEn: string;
  cuisineTypeBn: string;
  cuisineTypeEn: string;
  address: string;
  isOpen: boolean;
  minOrder: number;
  deliveryTimeMin: number; // estimated minutes
  rating: number;
  ratingCount: number;
  imageEmoji?: string;
  menuItems: MenuItem[];
}

// ── Cart ──────────────────────────────────────────────────────
export type CartItemSource = 'bazaar' | 'restaurant';

export interface CartItem {
  id: string;
  productId?: string;
  menuItemId?: string;
  restaurantId?: string;
  nameBn: string;
  nameEn: string;
  price: number;
  quantity: number;
  unit?: string;
  source: CartItemSource;
  isApproxPrice?: boolean;
}

// ── Orders ────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'buying'
  | 'on-the-way'
  | 'delivered'
  | 'cancelled'
  | 'refund-in-progress'
  | 'refunded';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface OrderItem {
  id: string;
  nameBn: string;
  nameEn: string;
  quantity: number;
  unit?: string;
  approxPrice: number;
  actualPrice?: number;
  source: CartItemSource;
}

export interface TrackingUpdate {
  id: string;
  status: OrderStatus;
  messageBn: string;
  messageEn: string;
  timestamp: string;
  locationNote?: string;
}

export interface Order {
  id: string;           // e.g. JV-240001
  customerId: string;
  customerName: string;
  customerMobile: string;
  deliveryAreaId: string;
  deliveryAddress: string;
  orderNote?: string;
  items: OrderItem[];
  productsTotal: number;   // sum of approx prices
  deliveryFee: number;
  discountAmount: number;
  promoCode?: string;
  finalTotal: number;
  status: OrderStatus;
  timeSlot: TimeSlot;
  riderId?: string;
  trackingUpdates: TrackingUpdate[];
  createdAt: string;
  updatedAt: string;
  hasComplaint?: boolean;
  refundDays?: 3 | 5 | 7;
  proofPhotoUrl?: string;
}

// ── Promo Codes ───────────────────────────────────────────────
export interface PromoCode {
  code: string;
  descriptionBn: string;
  descriptionEn: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  isActive: boolean;
  expiresAt?: string;
}

// ── Rider ─────────────────────────────────────────────────────
export type RiderStatus = 'pending' | 'active' | 'inactive' | 'suspended';

export interface Rider {
  id: string;
  userId: string;
  name: string;
  nameBn: string;
  mobile: string;
  vehicleType: 'bicycle' | 'motorbike';
  status: RiderStatus;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  joinedAt: string;
  pendingPayout: number;
}

export interface PaymentRequest {
  id: string;
  riderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  paidAt?: string;
  method: string;
  accountNumber: string;
}

// ── Affiliate ─────────────────────────────────────────────────
export type AffiliateStatus = 'pending' | 'active' | 'inactive';

export interface Affiliate {
  id: string;
  userId: string;
  name: string;
  nameBn: string;
  mobile: string;
  referralCode: string;
  status: AffiliateStatus;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayout: number;
  joinedAt: string;
}

// ── Staff Member ───────────────────────────────────────────────
export type StaffPermission =
  | 'orders'
  | 'products'
  | 'riders'
  | 'customers'
  | 'reports'
  | 'promotions'
  | 'settings';

export interface StaffMember {
  id: string;
  name: string;
  nameBn: string;
  mobile: string;
  email: string;
  permissions: StaffPermission[];
  isActive: boolean;
  addedAt: string;
  lastActive: string;
}

// ── Reviews ───────────────────────────────────────────────────
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  commentBn?: string;
  commentEn?: string;
  createdAt: string;
  isApproved: boolean;
  isHidden: boolean;
}

// ── Problem Reports ───────────────────────────────────────────
export type ProblemType =
  | 'wrong-item'
  | 'missing-item'
  | 'damaged'
  | 'late-delivery'
  | 'overcharged'
  | 'other';

export type ProblemStatus = 'open' | 'in-review' | 'resolved' | 'refund-issued';

export interface ProblemReport {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  problemType: ProblemType;
  descriptionBn?: string;
  descriptionEn?: string;
  status: ProblemStatus;
  refundDays?: 3 | 5 | 7;
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
}

// ── Notifications ─────────────────────────────────────────────
export type NotificationType =
  | 'order-update'
  | 'promo'
  | 'system'
  | 'refund'
  | 'delivery';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

// ── Saved Address ──────────────────────────────────────────────
export interface SavedAddress {
  id: string;
  userId: string;
  label: string;        // e.g. "বাড়ি", "অফিস"
  labelEn: string;
  fullAddress: string;
  areaId: string;
  isDefault: boolean;
}

// ── Delivery Pass / Subscription ───────────────────────────────
export interface DeliveryPass {
  id: string;
  userId: string;
  price: number;
  startDate: string;
  endDate: string;
  ordersUsed: number;
  isActive: boolean;
}

// ── App State (context) ────────────────────────────────────────
export interface AppSession {
  user: User | null;
  role: UserRole;
  lang: Lang;
  isServiceOpen: boolean;
  isSlotFull: boolean;
}
