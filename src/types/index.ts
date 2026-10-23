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
  altMobile?: string;
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
  isServed?: boolean; // admin can switch an area off (Phase 5 groundwork)
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
  imageUrl?: string;
  description?: string;
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
  section?: string;
  description?: string;
  imageEmoji?: string;
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
  imageUrl?: string;
  areaId?: string;
  openingTime?: string;
  closingTime?: string;
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
  note?: string; // per-item shopper note (Stitch 11 detail screen)
}

// ── Orders ────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'buying'
  | 'on-the-way'
  | 'delivered'
  | 'failed'
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
  /** What the rider actually earned for this delivery, frozen
   *  at delivery time: deliveryFee − company cut (owner's
   *  per-delivery cut model, Oct 23). Absent on orders that
   *  were seeded or delivered before the cut existed — readers
   *  fall back to fee − current cut (see orderUtils). */
  riderEarning?: number;
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
  refundStatus?: 'processing' | 'paid';
  refundAmount?: number;
  refundMethod?: 'bkash' | 'nagad' | 'cash';
  refundNote?: string;
  proofPhotoUrl?: string;
  customerReceived?: boolean; // F13 — customer tapped "পণ্য পেয়েছি ✓"
  failReason?: string;        // F12 — rider-reported failure reason
}

// ── Promo Codes ───────────────────────────────────────────────
export interface PromoCode {
  code: string;
  descriptionBn: string;
  descriptionEn: string;
  discountType: 'flat' | 'percent' | 'free-delivery';
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  isActive: boolean;
  expiresAt?: string;
  usedCount?: number;
  usageLimit?: number;
}

// ── Rider ─────────────────────────────────────────────────────
export type RiderStatus = 'pending' | 'active' | 'inactive' | 'suspended';

export interface Rider {
  id: string;
  userId: string;
  name: string;
  nameBn: string;
  mobile: string;
  email?: string;
  areaId?: string;
  vehicleType: 'bicycle' | 'motorbike';
  status: RiderStatus;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  joinedAt: string;
  pendingPayout: number;
  /** On-duty switch (RiderHomeScreen). Undefined = on duty. */
  dutyOn?: boolean;
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
  email?: string;
  promoteNote?: string; // I1 — "কোথায় প্রচার করবেন?"
  referralCode: string;
  status: AffiliateStatus;
  totalReferrals: number;
  totalEarnings: number;
  pendingPayout: number;
  joinedAt: string;
  commissionRate?: number; // ৳ per order — set by admin (H26)
}

// ── Affiliate waitlist ───────────────────────────────────────
// The affiliate programme is CLOSED at launch: entry points show
// a closed notice and collect emails here instead of taking new
// applications. Reopening = route the apply flow back to
// AffiliateApplyScreen and drop the gate in AffiliateScreen.
export interface AffiliateWaitlistEntry {
  email: string;
  at: string; // ISO timestamp
}

// ── Staff Member ───────────────────────────────────────────────
export type StaffPermission =
  | 'orders'
  | 'products'
  | 'riders'
  | 'customers'
  | 'reports'
  | 'rider-assignment'
  | 'problem-reports'
  | 'refunds'
  | 'riders-affiliates'
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

// ── Team Activity Log (H24 groundwork) ─────────────────────────
export interface ActivityLogEntry {
  id: string;
  actorName: string;
  action: string;
  at: string; // ISO timestamp
  category?: 'order' | 'refund' | 'general';
}

// ── App State (context) ────────────────────────────────────────
export interface AppSession {
  user: User | null;
  role: UserRole;
  lang: Lang;
  isServiceOpen: boolean;
  isSlotFull: boolean;
}

// ── Admin Settings / Marketing (Phase 5 Part 2) ─────────────
export interface HomeBanner {
  id: string;
  image: string;
  headlineBn: string;
  headlineEn: string;
  subBn: string;
  subEn: string;
  isActive: boolean;
}

export interface SubscriptionInterest {
  id: string;
  name: string;
  mobile: string;
  areaId?: string;
  requestedAt: string;
}

export interface AdminSettings {
  serviceHours: string;
  deliverySlots: string[];
  /** Rider intake control (owner, Oct 23): when false — or when
   *  the active+pending rider count reaches riderCap — the
   *  /apply-rider form is replaced by a closed notice. */
  riderIntakeOpen: boolean;
  riderCap: number;
  /** Company cut kept from every delivery fee (owner, Oct 23):
   *  rider earns deliveryFee − cut; the cut accrues to the
   *  company fund below. Riders are paid monthly from office. */
  companyCutPerDelivery: number;
  companyFundTotal: number;
  passPrice: number;
  passDeliveries: number;
  passActive: boolean;
  banners: HomeBanner[];
  flashSaleProductIds: string[];
  flashSaleDiscount: number;
  flashSaleStart: string;
  flashSaleEnd: string;
  flashSaleActive: boolean;
  subscriptionInterests: SubscriptionInterest[];
}
