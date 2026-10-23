// ============================================================
// Jovro — typed data-access layer over Supabase (backend Phase 2,
// wired into the app in Phase 3)
//
// One function set per aggregate, mirroring the AppContext
// action vocabulary (ADD_PRODUCT → addProduct, PLACE_ORDER →
// placeOrder, UPDATE_AREA → updateArea, …). Since Phase 3,
// AppContext calls these for write-through sync + hydration
// whenever `isSupabaseConfigured` is true; demo mode (no keys)
// never touches this file.
//
// ID MODEL (Phase 3): the app keeps its text ids (orders stay
// 'JV-XXXXXX', areas 'area-01'). People are the exception — the
// DB identity IS the auth profile uuid, so in configured mode
// the app-facing User.id / Rider.userId / Affiliate.userId /
// StaffMember.id ARE profile uuids, and orders.customer_id /
// orders.rider_id store those same uuids. Extension tables
// (rider_profiles…) are keyed by that uuid; no separate mapping
// table is needed — profiles is the lookup.
//
// Every function guards on `isSupabaseConfigured` and returns
// { data: null, error } with code 'not-configured' when the keys
// are missing — never throws for configuration problems. Table /
// column names match supabase/schema.sql + schema_phase3.sql
// EXACTLY; row types stay snake_case, return values are the
// app's camelCase types from src/types.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { NOT_CONFIGURED_ERROR, mapProfileRow } from './auth';
import type { BackendError, DbProfileRow, Profile } from './auth';
import type {
  ActivityLogEntry,
  AdminSettings,
  Affiliate,
  AffiliateWaitlistEntry,
  AppNotification,
  DeliveryArea,
  DeliveryPass,
  MenuItem,
  Order,
  OrderItem,
  PaymentRequest,
  ProblemReport,
  Product,
  PromoCode,
  Restaurant,
  Review,
  Rider,
  SavedAddress,
  StaffMember,
  StaffPermission,
  TrackingUpdate,
} from '../types';

// ── Result shape ─────────────────────────────────────────────
export type BackendResult<T> = { data: T | null; error: BackendError | null };

function toDbError(e: unknown): BackendError {
  if (e instanceof Error) return { code: 'db', message: e.message, cause: e };
  return { code: 'db', message: String(e), cause: e };
}

type PgResponse<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(res: PgResponse<T>): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function run<T>(fn: (db: SupabaseClient) => Promise<T>): Promise<BackendResult<T>> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: NOT_CONFIGURED_ERROR };
  }
  try {
    return { data: await fn(supabase), error: null };
  } catch (e) {
    return { data: null, error: toDbError(e) };
  }
}

// PostgREST may serialise `numeric` columns as strings — coerce.
const num = (v: number | string | null | undefined): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;
const opt = <T,>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);
const optNum = (v: number | string | null | undefined): number | undefined =>
  v == null ? undefined : num(v);

// ============================================================
// Row types — exact column names from supabase/schema.sql
// ============================================================

export interface DbAreaRow {
  id: string;
  name_bn: string;
  name_en: string;
  fee: number | string;
  zone: 'town' | 'union';
  group_name: string | null;
  is_served: boolean;
}

export interface DbProductRow {
  id: string;
  name_bn: string;
  name_en: string;
  category: Product['category'];
  unit: string;
  unit_en: string;
  approx_price: number | string;
  is_available: boolean;
  image_emoji: string | null;
  image_url: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
}

export interface DbRestaurantRow {
  id: string;
  name_bn: string;
  name_en: string;
  cuisine_type_bn: string;
  cuisine_type_en: string;
  address: string;
  is_open: boolean;
  min_order: number | string;
  delivery_time_min: number;
  rating: number | string;
  rating_count: number;
  image_emoji: string | null;
  image_url: string | null;
  area_id: string | null;
  opening_time: string | null;
  closing_time: string | null;
  created_at: string;
}

export interface DbMenuItemRow {
  id: string;
  restaurant_id: string;
  name_bn: string;
  name_en: string;
  price: number | string;
  category: string | null;
  section: string | null;
  description: string | null;
  image_emoji: string | null;
  is_available: boolean;
  is_popular: boolean;
}

export interface DbOrderRow {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  delivery_area_id: string;
  delivery_address: string;
  order_note: string | null;
  items: OrderItem[];
  products_total: number | string;
  delivery_fee: number | string;
  rider_earning: number | string | null; // schema_phase3.sql
  discount_amount: number | string;
  promo_code: string | null;
  final_total: number | string;
  status: Order['status'];
  time_slot: Order['timeSlot'];
  rider_id: string | null;
  tracking_updates: TrackingUpdate[];
  has_complaint: boolean;
  refund_days: number | null;
  refund_status: string | null;
  refund_amount: number | string | null;
  refund_method: string | null;
  refund_note: string | null;
  proof_photo_url: string | null;
  customer_received: boolean;
  fail_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProblemReportRow {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  problem_type: ProblemReport['problemType'];
  description_bn: string | null;
  description_en: string | null;
  status: ProblemReport['status'];
  refund_days: number | null;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DbReviewRow {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment_bn: string | null;
  comment_en: string | null;
  is_approved: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface DbPaymentRequestRow {
  id: string;
  requester_id: string;
  requester_type: 'rider' | 'affiliate';
  amount: number | string;
  status: PaymentRequest['status'];
  method: string;
  account_number: string;
  requested_at: string;
  paid_at: string | null;
}

export interface DbPromoRow {
  code: string;
  description_bn: string;
  description_en: string;
  discount_type: PromoCode['discountType'];
  discount_value: number | string;
  min_order: number | string;
  max_discount: number | string | null;
  is_active: boolean;
  expires_at: string | null;
  used_count: number;
  usage_limit: number | null;
}

export interface DbNotificationRow {
  id: string;
  user_id: string;
  type: AppNotification['type'];
  title_bn: string;
  title_en: string;
  body_bn: string;
  body_en: string;
  is_read: boolean;
  order_id: string | null;
  created_at: string;
}

export interface DbApplicationRow {
  id: string;
  type: 'rider' | 'affiliate';
  profile_id: string | null;
  name: string;
  name_bn: string;
  mobile: string;
  email: string | null;
  area_id: string | null;
  vehicle_type: 'bicycle' | 'motorbike' | null;
  promote_note: string | null;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

export interface DbActivityLogRow {
  id: string;
  actor_profile_id: string | null;
  actor_name: string;
  action: string;
  category: ActivityLogEntry['category'] | null;
  at: string;
}

export interface DbSavedAddressRow {
  id: string;
  user_id: string;
  label: string;
  label_en: string;
  full_address: string;
  area_id: string;
  is_default: boolean;
}

export interface DbDeliveryPassRow {
  id: string;
  user_id: string;
  price: number | string;
  start_date: string;
  end_date: string;
  orders_used: number;
  is_active: boolean;
}

export interface DbRiderProfileRow {
  profile_id: string;
  vehicle_type: Rider['vehicleType'];
  area_id: string | null;
  status: Rider['status'];
  total_deliveries: number;
  total_earnings: number | string;
  rating: number | string;
  pending_payout: number | string;
  duty_on: boolean; // schema_phase3.sql
  joined_at: string;
}

export interface DbAffiliateProfileRow {
  profile_id: string;
  referral_code: string;
  promote_note: string | null;
  status: Affiliate['status'];
  total_referrals: number;
  total_earnings: number | string;
  pending_payout: number | string;
  commission_rate: number | string | null;
  joined_at: string;
}

export interface DbStaffProfileRow {
  profile_id: string;
  permissions: string[];
  is_active: boolean;
  added_at: string;
  last_active: string;
}

export interface DbAdminSettingsRow {
  id: number;
  settings: AdminSettings;
  updated_at: string;
}

// ============================================================
// Mappers (row → app type)
// ============================================================

export const mapAreaRow = (r: DbAreaRow): DeliveryArea => ({
  id: r.id,
  nameBn: r.name_bn,
  nameEn: r.name_en,
  fee: num(r.fee),
  zone: r.zone,
  group: opt(r.group_name),
  isServed: r.is_served,
});

export const mapProductRow = (r: DbProductRow): Product => ({
  id: r.id,
  nameBn: r.name_bn,
  nameEn: r.name_en,
  category: r.category,
  unit: r.unit,
  unitEn: r.unit_en,
  approxPrice: num(r.approx_price),
  isAvailable: r.is_available,
  imageEmoji: opt(r.image_emoji),
  imageUrl: opt(r.image_url),
  description: opt(r.description),
  tags: r.tags ?? [],
});

const mapRestaurantRow = (r: DbRestaurantRow, menuItems: MenuItem[]): Restaurant => ({
  id: r.id,
  nameBn: r.name_bn,
  nameEn: r.name_en,
  cuisineTypeBn: r.cuisine_type_bn,
  cuisineTypeEn: r.cuisine_type_en,
  address: r.address,
  isOpen: r.is_open,
  minOrder: num(r.min_order),
  deliveryTimeMin: r.delivery_time_min,
  rating: num(r.rating),
  ratingCount: r.rating_count,
  imageEmoji: opt(r.image_emoji),
  imageUrl: opt(r.image_url),
  areaId: opt(r.area_id),
  openingTime: opt(r.opening_time),
  closingTime: opt(r.closing_time),
  menuItems,
});

export const mapMenuItemRow = (r: DbMenuItemRow): MenuItem => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  nameBn: r.name_bn,
  nameEn: r.name_en,
  price: num(r.price),
  category: opt(r.category),
  section: opt(r.section),
  description: opt(r.description),
  imageEmoji: opt(r.image_emoji),
  isAvailable: r.is_available,
  isPopular: r.is_popular,
});

export const mapOrderRow = (r: DbOrderRow): Order => ({
  id: r.id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerMobile: r.customer_mobile,
  deliveryAreaId: r.delivery_area_id,
  deliveryAddress: r.delivery_address,
  orderNote: opt(r.order_note),
  items: r.items ?? [],
  productsTotal: num(r.products_total),
  deliveryFee: num(r.delivery_fee),
  riderEarning: optNum(r.rider_earning),
  discountAmount: num(r.discount_amount),
  promoCode: opt(r.promo_code),
  finalTotal: num(r.final_total),
  status: r.status,
  timeSlot: r.time_slot,
  riderId: opt(r.rider_id),
  trackingUpdates: r.tracking_updates ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  hasComplaint: r.has_complaint,
  refundDays: (r.refund_days as 3 | 5 | 7 | null) ?? undefined,
  refundStatus: (r.refund_status as Order['refundStatus']) ?? undefined,
  refundAmount: optNum(r.refund_amount),
  refundMethod: (r.refund_method as Order['refundMethod']) ?? undefined,
  refundNote: opt(r.refund_note),
  proofPhotoUrl: opt(r.proof_photo_url),
  customerReceived: r.customer_received,
  failReason: opt(r.fail_reason),
});

export const mapProblemReportRow = (r: DbProblemReportRow): ProblemReport => ({
  id: r.id,
  orderId: r.order_id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  problemType: r.problem_type,
  descriptionBn: opt(r.description_bn),
  descriptionEn: opt(r.description_en),
  status: r.status,
  refundDays: (r.refund_days as 3 | 5 | 7 | null) ?? undefined,
  createdAt: r.created_at,
  resolvedAt: opt(r.resolved_at),
  adminNote: opt(r.admin_note),
});

export const mapReviewRow = (r: DbReviewRow): Review => ({
  id: r.id,
  orderId: r.order_id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  rating: r.rating,
  commentBn: opt(r.comment_bn),
  commentEn: opt(r.comment_en),
  createdAt: r.created_at,
  isApproved: r.is_approved,
  isHidden: r.is_hidden,
});

/**
 * The app reuses PaymentRequest.riderId for affiliates too; the
 * DB splits it into requester_id + requester_type. The backend
 * shape keeps both pieces so Phase 3 loses no information.
 */
export interface BackendPaymentRequest extends PaymentRequest {
  requesterType: 'rider' | 'affiliate';
}

export const mapPaymentRequestRow = (r: DbPaymentRequestRow): BackendPaymentRequest => ({
  id: r.id,
  riderId: r.requester_id,
  amount: num(r.amount),
  status: r.status,
  requestedAt: r.requested_at,
  paidAt: opt(r.paid_at),
  method: r.method,
  accountNumber: r.account_number,
  requesterType: r.requester_type,
});

export const mapPromoRow = (r: DbPromoRow): PromoCode => ({
  code: r.code,
  descriptionBn: r.description_bn,
  descriptionEn: r.description_en,
  discountType: r.discount_type,
  discountValue: num(r.discount_value),
  minOrder: num(r.min_order),
  maxDiscount: optNum(r.max_discount),
  isActive: r.is_active,
  expiresAt: opt(r.expires_at),
  usedCount: r.used_count,
  usageLimit: opt(r.usage_limit),
});

export const mapNotificationRow = (r: DbNotificationRow): AppNotification => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  titleBn: r.title_bn,
  titleEn: r.title_en,
  bodyBn: r.body_bn,
  bodyEn: r.body_en,
  isRead: r.is_read,
  createdAt: r.created_at,
  orderId: opt(r.order_id),
});

/** The app has no Application type — applications are their own record. */
export interface ApplicationRecord {
  id: string;
  type: 'rider' | 'affiliate';
  profileId?: string;
  name: string;
  nameBn: string;
  mobile: string;
  email?: string;
  areaId?: string;
  vehicleType?: 'bicycle' | 'motorbike';
  promoteNote?: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}

export const mapApplicationRow = (r: DbApplicationRow): ApplicationRecord => ({
  id: r.id,
  type: r.type,
  profileId: opt(r.profile_id),
  name: r.name,
  nameBn: r.name_bn,
  mobile: r.mobile,
  email: opt(r.email),
  areaId: opt(r.area_id),
  vehicleType: opt(r.vehicle_type),
  promoteNote: opt(r.promote_note),
  payload: r.payload ?? {},
  status: r.status,
  createdAt: r.created_at,
  reviewedAt: opt(r.reviewed_at),
});

export const mapActivityLogRow = (r: DbActivityLogRow): ActivityLogEntry => ({
  id: r.id,
  actorName: r.actor_name,
  action: r.action,
  at: r.at,
  category: opt(r.category),
});

export const mapSavedAddressRow = (r: DbSavedAddressRow): SavedAddress => ({
  id: r.id,
  userId: r.user_id,
  label: r.label,
  labelEn: r.label_en,
  fullAddress: r.full_address,
  areaId: r.area_id,
  isDefault: r.is_default,
});

export const mapDeliveryPassRow = (r: DbDeliveryPassRow): DeliveryPass => ({
  id: r.id,
  userId: r.user_id,
  price: num(r.price),
  startDate: r.start_date,
  endDate: r.end_date,
  ordersUsed: r.orders_used,
  isActive: r.is_active,
});

// Extension rows join with their profiles row for name/contact fields.
// NOTE: in the DB the rider IS the profile — so the app Rider's
// separate `id` and `userId` converge to the same profile uuid.
export const mapRiderRows = (r: DbRiderProfileRow, p: DbProfileRow): Rider => ({
  id: r.profile_id,
  userId: r.profile_id,
  name: p.name,
  nameBn: p.name_bn,
  mobile: p.mobile,
  email: p.email,
  areaId: opt(r.area_id),
  vehicleType: r.vehicle_type,
  status: r.status,
  totalDeliveries: r.total_deliveries,
  totalEarnings: num(r.total_earnings),
  rating: num(r.rating),
  joinedAt: r.joined_at,
  pendingPayout: num(r.pending_payout),
  dutyOn: r.duty_on,
});

export const mapAffiliateRows = (r: DbAffiliateProfileRow, p: DbProfileRow): Affiliate => ({
  id: r.profile_id,
  userId: r.profile_id,
  name: p.name,
  nameBn: p.name_bn,
  mobile: p.mobile,
  email: p.email,
  promoteNote: opt(r.promote_note),
  referralCode: r.referral_code,
  status: r.status,
  totalReferrals: r.total_referrals,
  totalEarnings: num(r.total_earnings),
  pendingPayout: num(r.pending_payout),
  joinedAt: r.joined_at,
  commissionRate: optNum(r.commission_rate),
});

export const mapStaffRows = (r: DbStaffProfileRow, p: DbProfileRow): StaffMember => ({
  id: r.profile_id,
  name: p.name,
  nameBn: p.name_bn,
  mobile: p.mobile,
  email: p.email,
  permissions: r.permissions as StaffPermission[],
  isActive: r.is_active,
  addedAt: r.added_at,
  lastActive: r.last_active,
});

// ============================================================
// Areas (UPDATE_AREA)
// ============================================================

export function fetchAreas(): Promise<BackendResult<DeliveryArea[]>> {
  return run(async (db) => {
    const rows = unwrap(await db.from('areas').select('*').order('id')) as DbAreaRow[];
    return rows.map(mapAreaRow);
  });
}

function areaPayload(area: DeliveryArea) {
  return {
    id: area.id,
    name_bn: area.nameBn,
    name_en: area.nameEn,
    fee: area.fee,
    zone: area.zone,
    group_name: area.group ?? null,
    is_served: area.isServed ?? true,
  };
}

export function updateArea(area: DeliveryArea): Promise<BackendResult<DeliveryArea>> {
  return run(async (db) => {
    const { id, ...rest } = areaPayload(area);
    const row = unwrap(
      await db
        .from('areas')
        .update(rest)
        .eq('id', id)
        .select()
        .single(),
    ) as DbAreaRow;
    return mapAreaRow(row);
  });
}

// ============================================================
// Products (ADD_PRODUCT / UPDATE_PRODUCT / DELETE_PRODUCT)
// ============================================================

export function fetchProducts(): Promise<BackendResult<Product[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('products').select('*').order('created_at'),
    ) as DbProductRow[];
    return rows.map(mapProductRow);
  });
}

export function fetchProductById(id: string): Promise<BackendResult<Product>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('products').select('*').eq('id', id).single(),
    ) as DbProductRow;
    return mapProductRow(row);
  });
}

function productPayload(p: Product) {
  return {
    id: p.id,
    name_bn: p.nameBn,
    name_en: p.nameEn,
    category: p.category,
    unit: p.unit,
    unit_en: p.unitEn,
    approx_price: p.approxPrice,
    is_available: p.isAvailable,
    image_emoji: p.imageEmoji ?? null,
    image_url: p.imageUrl ?? null,
    description: p.description ?? null,
    tags: p.tags ?? [],
  };
}

export function addProduct(product: Product): Promise<BackendResult<Product>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('products').insert(productPayload(product)).select().single(),
    ) as DbProductRow;
    return mapProductRow(row);
  });
}

export function updateProduct(product: Product): Promise<BackendResult<Product>> {
  return run(async (db) => {
    const { id, ...rest } = productPayload(product);
    const row = unwrap(
      await db.from('products').update(rest).eq('id', id).select().single(),
    ) as DbProductRow;
    return mapProductRow(row);
  });
}

export function deleteProduct(id: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(await db.from('products').delete().eq('id', id).select('id'));
    return true as const;
  });
}

// ============================================================
// Restaurants + menu items
// (ADD_RESTAURANT / UPDATE_RESTAURANT / DELETE_RESTAURANT)
// The app nests menuItems inside Restaurant; the DB splits them
// into menu_items — reads reassemble, writes replace the item set.
// ============================================================

export function fetchRestaurants(): Promise<BackendResult<Restaurant[]>> {
  return run(async (db) => {
    const restaurants = unwrap(
      await db.from('restaurants').select('*').order('created_at'),
    ) as DbRestaurantRow[];
    const items = unwrap(await db.from('menu_items').select('*')) as DbMenuItemRow[];
    const byRestaurant = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = byRestaurant.get(item.restaurant_id) ?? [];
      list.push(mapMenuItemRow(item));
      byRestaurant.set(item.restaurant_id, list);
    }
    return restaurants.map((r) => mapRestaurantRow(r, byRestaurant.get(r.id) ?? []));
  });
}

export function fetchRestaurantById(id: string): Promise<BackendResult<Restaurant>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('restaurants').select('*').eq('id', id).single(),
    ) as DbRestaurantRow;
    const items = unwrap(
      await db.from('menu_items').select('*').eq('restaurant_id', id),
    ) as DbMenuItemRow[];
    return mapRestaurantRow(row, items.map(mapMenuItemRow));
  });
}

function restaurantPayload(r: Restaurant) {
  return {
    id: r.id,
    name_bn: r.nameBn,
    name_en: r.nameEn,
    cuisine_type_bn: r.cuisineTypeBn,
    cuisine_type_en: r.cuisineTypeEn,
    address: r.address,
    is_open: r.isOpen,
    min_order: r.minOrder,
    delivery_time_min: r.deliveryTimeMin,
    rating: r.rating,
    rating_count: r.ratingCount,
    image_emoji: r.imageEmoji ?? null,
    image_url: r.imageUrl ?? null,
    area_id: r.areaId ?? null,
    opening_time: r.openingTime ?? null,
    closing_time: r.closingTime ?? null,
  };
}

function menuItemPayload(m: MenuItem) {
  return {
    id: m.id,
    restaurant_id: m.restaurantId,
    name_bn: m.nameBn,
    name_en: m.nameEn,
    price: m.price,
    category: m.category ?? null,
    section: m.section ?? null,
    description: m.description ?? null,
    image_emoji: m.imageEmoji ?? null,
    is_available: m.isAvailable,
    is_popular: m.isPopular ?? false,
  };
}

export function addRestaurant(restaurant: Restaurant): Promise<BackendResult<Restaurant>> {
  return run(async (db) => {
    unwrap(
      await db.from('restaurants').insert(restaurantPayload(restaurant)).select().single(),
    );
    if (restaurant.menuItems.length > 0) {
      unwrap(
        await db
          .from('menu_items')
          .insert(restaurant.menuItems.map(menuItemPayload))
          .select('id'),
      );
    }
    const fetched = await fetchRestaurantById(restaurant.id);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Restaurant insert failed');
    }
    return fetched.data;
  });
}

export function updateRestaurant(restaurant: Restaurant): Promise<BackendResult<Restaurant>> {
  return run(async (db) => {
    const { id, ...rest } = restaurantPayload(restaurant);
    unwrap(await db.from('restaurants').update(rest).eq('id', id).select().single());
    // Replace the item set (menu_items cascade on restaurant delete,
    // but a plain update needs the items reconciled explicitly).
    unwrap(await db.from('menu_items').delete().eq('restaurant_id', id).select('id'));
    if (restaurant.menuItems.length > 0) {
      unwrap(
        await db
          .from('menu_items')
          .insert(restaurant.menuItems.map(menuItemPayload))
          .select('id'),
      );
    }
    const fetched = await fetchRestaurantById(id);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Restaurant update failed');
    }
    return fetched.data;
  });
}

export function deleteRestaurant(id: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(await db.from('restaurants').delete().eq('id', id).select('id'));
    return true as const;
  });
}

// Menu items are also editable one-by-one in the admin (H8).
export function fetchMenuItems(restaurantId: string): Promise<BackendResult<MenuItem[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('menu_items').select('*').eq('restaurant_id', restaurantId),
    ) as DbMenuItemRow[];
    return rows.map(mapMenuItemRow);
  });
}

export function addMenuItem(item: MenuItem): Promise<BackendResult<MenuItem>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('menu_items').insert(menuItemPayload(item)).select().single(),
    ) as DbMenuItemRow;
    return mapMenuItemRow(row);
  });
}

export function updateMenuItem(item: MenuItem): Promise<BackendResult<MenuItem>> {
  return run(async (db) => {
    const { id, ...rest } = menuItemPayload(item);
    const row = unwrap(
      await db.from('menu_items').update(rest).eq('id', id).select().single(),
    ) as DbMenuItemRow;
    return mapMenuItemRow(row);
  });
}

export function deleteMenuItem(id: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(await db.from('menu_items').delete().eq('id', id).select('id'));
    return true as const;
  });
}

// ============================================================
// Orders (PLACE_ORDER / UPDATE_ORDER)
// NOTE: in the DB, orders.rider_id and orders.customer_id are
// profile uuids (FK → profiles). The demo's record ids
// ('rider-01', 'u-001') only exist in localStorage state.
// ============================================================

function orderPayload(o: Order) {
  return {
    id: o.id,
    customer_id: o.customerId,
    customer_name: o.customerName,
    customer_mobile: o.customerMobile,
    delivery_area_id: o.deliveryAreaId,
    delivery_address: o.deliveryAddress,
    order_note: o.orderNote ?? null,
    items: o.items,
    products_total: o.productsTotal,
    delivery_fee: o.deliveryFee,
    rider_earning: o.riderEarning ?? null,
    discount_amount: o.discountAmount,
    promo_code: o.promoCode ?? null,
    final_total: o.finalTotal,
    status: o.status,
    time_slot: o.timeSlot,
    rider_id: o.riderId ?? null,
    tracking_updates: o.trackingUpdates,
    has_complaint: o.hasComplaint ?? false,
    refund_days: o.refundDays ?? null,
    refund_status: o.refundStatus ?? null,
    refund_amount: o.refundAmount ?? null,
    refund_method: o.refundMethod ?? null,
    refund_note: o.refundNote ?? null,
    proof_photo_url: o.proofPhotoUrl ?? null,
    customer_received: o.customerReceived ?? false,
    fail_reason: o.failReason ?? null,
  };
}

export function fetchOrders(): Promise<BackendResult<Order[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('orders').select('*').order('created_at', { ascending: false }),
    ) as DbOrderRow[];
    return rows.map(mapOrderRow);
  });
}

export function fetchOrderById(id: string): Promise<BackendResult<Order>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('orders').select('*').eq('id', id).single(),
    ) as DbOrderRow;
    return mapOrderRow(row);
  });
}

export function fetchOrdersByCustomer(customerId: string): Promise<BackendResult<Order[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),
    ) as DbOrderRow[];
    return rows.map(mapOrderRow);
  });
}

export function fetchOrdersByRider(riderProfileId: string): Promise<BackendResult<Order[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('orders')
        .select('*')
        .eq('rider_id', riderProfileId)
        .order('created_at', { ascending: false }),
    ) as DbOrderRow[];
    return rows.map(mapOrderRow);
  });
}

export function placeOrder(order: Order): Promise<BackendResult<Order>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('orders').insert(orderPayload(order)).select().single(),
    ) as DbOrderRow;
    return mapOrderRow(row);
  });
}

export function updateOrder(order: Order): Promise<BackendResult<Order>> {
  return run(async (db) => {
    const { id, ...rest } = orderPayload(order);
    const row = unwrap(
      await db.from('orders').update(rest).eq('id', id).select().single(),
    ) as DbOrderRow;
    return mapOrderRow(row);
  });
}

// ============================================================
// Problem reports (ADD_PROBLEM_REPORT / UPDATE_PROBLEM_REPORT)
// ============================================================

function problemReportPayload(r: ProblemReport) {
  return {
    id: r.id,
    order_id: r.orderId,
    customer_id: r.customerId,
    customer_name: r.customerName,
    problem_type: r.problemType,
    description_bn: r.descriptionBn ?? null,
    description_en: r.descriptionEn ?? null,
    status: r.status,
    refund_days: r.refundDays ?? null,
    admin_note: r.adminNote ?? null,
    resolved_at: r.resolvedAt ?? null,
  };
}

export function fetchProblemReports(): Promise<BackendResult<ProblemReport[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('problem_reports')
        .select('*')
        .order('created_at', { ascending: false }),
    ) as DbProblemReportRow[];
    return rows.map(mapProblemReportRow);
  });
}

export function fetchProblemReportById(id: string): Promise<BackendResult<ProblemReport>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('problem_reports').select('*').eq('id', id).single(),
    ) as DbProblemReportRow;
    return mapProblemReportRow(row);
  });
}

export function addProblemReport(
  report: ProblemReport,
): Promise<BackendResult<ProblemReport>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('problem_reports')
        .insert(problemReportPayload(report))
        .select()
        .single(),
    ) as DbProblemReportRow;
    return mapProblemReportRow(row);
  });
}

export function updateProblemReport(
  report: ProblemReport,
): Promise<BackendResult<ProblemReport>> {
  return run(async (db) => {
    const { id, ...rest } = problemReportPayload(report);
    const row = unwrap(
      await db
        .from('problem_reports')
        .update(rest)
        .eq('id', id)
        .select()
        .single(),
    ) as DbProblemReportRow;
    return mapProblemReportRow(row);
  });
}

// ============================================================
// Reviews (ADD_REVIEW / UPDATE_REVIEW)
// ============================================================

function reviewPayload(r: Review) {
  return {
    id: r.id,
    order_id: r.orderId,
    customer_id: r.customerId,
    customer_name: r.customerName,
    rating: r.rating,
    comment_bn: r.commentBn ?? null,
    comment_en: r.commentEn ?? null,
    is_approved: r.isApproved,
    is_hidden: r.isHidden,
  };
}

export function fetchReviews(): Promise<BackendResult<Review[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('reviews').select('*').order('created_at', { ascending: false }),
    ) as DbReviewRow[];
    return rows.map(mapReviewRow);
  });
}

export function fetchReviewsByOrder(orderId: string): Promise<BackendResult<Review[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('reviews').select('*').eq('order_id', orderId),
    ) as DbReviewRow[];
    return rows.map(mapReviewRow);
  });
}

export function addReview(review: Review): Promise<BackendResult<Review>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('reviews').insert(reviewPayload(review)).select().single(),
    ) as DbReviewRow;
    return mapReviewRow(row);
  });
}

export function updateReview(review: Review): Promise<BackendResult<Review>> {
  return run(async (db) => {
    const { id, ...rest } = reviewPayload(review);
    const row = unwrap(
      await db.from('reviews').update(rest).eq('id', id).select().single(),
    ) as DbReviewRow;
    return mapReviewRow(row);
  });
}

// ============================================================
// Payment requests (ADD_PAYMENT_REQUEST / UPDATE_PAYMENT_REQUEST)
// ============================================================

function paymentRequestPayload(r: BackendPaymentRequest) {
  return {
    id: r.id,
    requester_id: r.riderId,
    requester_type: r.requesterType,
    amount: r.amount,
    status: r.status,
    method: r.method,
    account_number: r.accountNumber,
    paid_at: r.paidAt ?? null,
  };
}

export function fetchPaymentRequests(): Promise<BackendResult<BackendPaymentRequest[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('payment_requests')
        .select('*')
        .order('requested_at', { ascending: false }),
    ) as DbPaymentRequestRow[];
    return rows.map(mapPaymentRequestRow);
  });
}

export function fetchPaymentRequestsByRequester(
  requesterProfileId: string,
): Promise<BackendResult<BackendPaymentRequest[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('payment_requests')
        .select('*')
        .eq('requester_id', requesterProfileId)
        .order('requested_at', { ascending: false }),
    ) as DbPaymentRequestRow[];
    return rows.map(mapPaymentRequestRow);
  });
}

export function addPaymentRequest(
  request: BackendPaymentRequest,
): Promise<BackendResult<BackendPaymentRequest>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('payment_requests')
        .insert(paymentRequestPayload(request))
        .select()
        .single(),
    ) as DbPaymentRequestRow;
    return mapPaymentRequestRow(row);
  });
}

export function updatePaymentRequest(
  request: BackendPaymentRequest,
): Promise<BackendResult<BackendPaymentRequest>> {
  return run(async (db) => {
    const { id, ...rest } = paymentRequestPayload(request);
    const row = unwrap(
      await db
        .from('payment_requests')
        .update(rest)
        .eq('id', id)
        .select()
        .single(),
    ) as DbPaymentRequestRow;
    return mapPaymentRequestRow(row);
  });
}

// ============================================================
// Promo codes (ADD_PROMO / UPDATE_PROMO)
// ============================================================

function promoPayload(p: PromoCode) {
  return {
    code: p.code,
    description_bn: p.descriptionBn,
    description_en: p.descriptionEn,
    discount_type: p.discountType,
    discount_value: p.discountValue,
    min_order: p.minOrder,
    max_discount: p.maxDiscount ?? null,
    is_active: p.isActive,
    expires_at: p.expiresAt ?? null,
    used_count: p.usedCount ?? 0,
    usage_limit: p.usageLimit ?? null,
  };
}

export function fetchPromos(): Promise<BackendResult<PromoCode[]>> {
  return run(async (db) => {
    const rows = unwrap(await db.from('promos').select('*')) as DbPromoRow[];
    return rows.map(mapPromoRow);
  });
}

export function fetchPromoByCode(code: string): Promise<BackendResult<PromoCode>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('promos').select('*').eq('code', code).single(),
    ) as DbPromoRow;
    return mapPromoRow(row);
  });
}

export function addPromo(promo: PromoCode): Promise<BackendResult<PromoCode>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('promos').insert(promoPayload(promo)).select().single(),
    ) as DbPromoRow;
    return mapPromoRow(row);
  });
}

export function updatePromo(promo: PromoCode): Promise<BackendResult<PromoCode>> {
  return run(async (db) => {
    const { code, ...rest } = promoPayload(promo);
    const row = unwrap(
      await db.from('promos').update(rest).eq('code', code).select().single(),
    ) as DbPromoRow;
    return mapPromoRow(row);
  });
}

// ============================================================
// Notifications (ADD_NOTIFICATION / MARK_NOTIFICATION_READ /
// MARK_ALL_READ)
// ============================================================

export function fetchNotificationsForUser(
  userId: string,
): Promise<BackendResult<AppNotification[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ) as DbNotificationRow[];
    return rows.map(mapNotificationRow);
  });
}

export function addNotification(
  n: AppNotification,
): Promise<BackendResult<AppNotification>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('notifications')
        .insert({
          id: n.id,
          user_id: n.userId,
          type: n.type,
          title_bn: n.titleBn,
          title_en: n.titleEn,
          body_bn: n.bodyBn,
          body_en: n.bodyEn,
          is_read: n.isRead,
          order_id: n.orderId ?? null,
        })
        .select()
        .single(),
    ) as DbNotificationRow;
    return mapNotificationRow(row);
  });
}

export function markNotificationRead(id: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(
      await db.from('notifications').update({ is_read: true }).eq('id', id).select('id'),
    );
    return true as const;
  });
}

export function markAllNotificationsRead(userId: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select('id'),
    );
    return true as const;
  });
}

// ============================================================
// Saved addresses (ADD_ADDRESS / UPDATE_ADDRESS / DELETE_ADDRESS)
// ============================================================

function savedAddressPayload(a: SavedAddress) {
  return {
    id: a.id,
    user_id: a.userId,
    label: a.label,
    label_en: a.labelEn,
    full_address: a.fullAddress,
    area_id: a.areaId,
    is_default: a.isDefault,
  };
}

export function fetchAddressesForUser(userId: string): Promise<BackendResult<SavedAddress[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('saved_addresses').select('*').eq('user_id', userId),
    ) as DbSavedAddressRow[];
    return rows.map(mapSavedAddressRow);
  });
}

export function addAddress(address: SavedAddress): Promise<BackendResult<SavedAddress>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('saved_addresses')
        .insert(savedAddressPayload(address))
        .select()
        .single(),
    ) as DbSavedAddressRow;
    return mapSavedAddressRow(row);
  });
}

export function updateAddress(address: SavedAddress): Promise<BackendResult<SavedAddress>> {
  return run(async (db) => {
    const { id, ...rest } = savedAddressPayload(address);
    const row = unwrap(
      await db.from('saved_addresses').update(rest).eq('id', id).select().single(),
    ) as DbSavedAddressRow;
    return mapSavedAddressRow(row);
  });
}

export function deleteAddress(id: string): Promise<BackendResult<true>> {
  return run(async (db) => {
    unwrap(await db.from('saved_addresses').delete().eq('id', id).select('id'));
    return true as const;
  });
}

// ============================================================
// Delivery passes (customer subscriptions)
// ============================================================

function deliveryPassPayload(p: DeliveryPass) {
  return {
    id: p.id,
    user_id: p.userId,
    price: p.price,
    start_date: p.startDate,
    end_date: p.endDate,
    orders_used: p.ordersUsed,
    is_active: p.isActive,
  };
}

export function fetchDeliveryPassesForUser(
  userId: string,
): Promise<BackendResult<DeliveryPass[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('delivery_passes').select('*').eq('user_id', userId),
    ) as DbDeliveryPassRow[];
    return rows.map(mapDeliveryPassRow);
  });
}

export function fetchActiveDeliveryPass(
  userId: string,
): Promise<BackendResult<DeliveryPass | null>> {
  return run(async (db) => {
    const res = await db
      .from('delivery_passes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? mapDeliveryPassRow(res.data as DbDeliveryPassRow) : null;
  });
}

export function addDeliveryPass(pass: DeliveryPass): Promise<BackendResult<DeliveryPass>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('delivery_passes')
        .insert(deliveryPassPayload(pass))
        .select()
        .single(),
    ) as DbDeliveryPassRow;
    return mapDeliveryPassRow(row);
  });
}

export function updateDeliveryPass(
  pass: DeliveryPass,
): Promise<BackendResult<DeliveryPass>> {
  return run(async (db) => {
    const { id, ...rest } = deliveryPassPayload(pass);
    const row = unwrap(
      await db.from('delivery_passes').update(rest).eq('id', id).select().single(),
    ) as DbDeliveryPassRow;
    return mapDeliveryPassRow(row);
  });
}

// ============================================================
// Applications (ADD_APPLICATION + admin review)
// Production flow: application lands in `applications` first;
// admin approval creates the *_profiles row + role change.
// ============================================================

export function fetchApplications(
  status?: ApplicationRecord['status'],
): Promise<BackendResult<ApplicationRecord[]>> {
  return run(async (db) => {
    let query = db
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const rows = unwrap(await query) as DbApplicationRow[];
    return rows.map(mapApplicationRow);
  });
}

export function addApplication(
  app: ApplicationRecord,
): Promise<BackendResult<ApplicationRecord>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('applications')
        .insert({
          id: app.id,
          type: app.type,
          profile_id: app.profileId ?? null,
          name: app.name,
          name_bn: app.nameBn,
          mobile: app.mobile,
          email: app.email ?? null,
          area_id: app.areaId ?? null,
          vehicle_type: app.vehicleType ?? null,
          promote_note: app.promoteNote ?? null,
          payload: app.payload,
          status: app.status,
        })
        .select()
        .single(),
    ) as DbApplicationRow;
    return mapApplicationRow(row);
  });
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationRecord['status'],
): Promise<BackendResult<ApplicationRecord>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('applications')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
    ) as DbApplicationRow;
    return mapApplicationRow(row);
  });
}

// ============================================================
// Admin settings (UPDATE_ADMIN_SETTINGS) — single row, id = 1,
// the whole AdminSettings object lives in the `settings` jsonb.
// ============================================================

export function fetchAdminSettings(): Promise<BackendResult<AdminSettings | null>> {
  return run(async (db) => {
    const res = await db.from('admin_settings').select('*').eq('id', 1).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) return null;
    return (res.data as DbAdminSettingsRow).settings;
  });
}

export function updateAdminSettings(
  settings: AdminSettings,
): Promise<BackendResult<AdminSettings>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('admin_settings')
        .upsert({ id: 1, settings }, { onConflict: 'id' })
        .select()
        .single(),
    ) as DbAdminSettingsRow;
    return row.settings;
  });
}

// ============================================================
// Activity log (LOG_ACTIVITY)
// ============================================================

export function fetchActivityLog(limit = 100): Promise<BackendResult<ActivityLogEntry[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('activity_log')
        .select('*')
        .order('at', { ascending: false })
        .limit(limit),
    ) as DbActivityLogRow[];
    return rows.map(mapActivityLogRow);
  });
}

export function logActivity(
  entry: ActivityLogEntry,
  actorProfileId?: string,
): Promise<BackendResult<ActivityLogEntry>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('activity_log')
        .insert({
          id: entry.id,
          actor_profile_id: actorProfileId ?? null,
          actor_name: entry.actorName,
          action: entry.action,
          category: entry.category ?? null,
          at: entry.at,
        })
        .select()
        .single(),
    ) as DbActivityLogRow;
    return mapActivityLogRow(row);
  });
}

// ============================================================
// Profiles (UPDATE_PROFILE + support lookups)
// Role / email are trigger-guarded in the DB: only an admin's
// update may change them; other callers get a DB error back.
// ============================================================

export function fetchProfiles(): Promise<BackendResult<Profile[]>> {
  return run(async (db) => {
    const rows = unwrap(await db.from('profiles').select('*')) as DbProfileRow[];
    return rows.map(mapProfileRow);
  });
}

export function fetchProfileById(id: string): Promise<BackendResult<Profile>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('profiles').select('*').eq('id', id).single(),
    ) as DbProfileRow;
    return mapProfileRow(row);
  });
}

export function fetchProfileByEmail(email: string): Promise<BackendResult<Profile>> {
  return run(async (db) => {
    const row = unwrap(
      await db.from('profiles').select('*').eq('email', email).single(),
    ) as DbProfileRow;
    return mapProfileRow(row);
  });
}

export function updateProfile(profile: Profile): Promise<BackendResult<Profile>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('profiles')
        .update({
          name: profile.name,
          name_bn: profile.nameBn,
          mobile: profile.mobile,
          alt_mobile: profile.altMobile ?? null,
          avatar_url: profile.avatarUrl ?? null,
          delivery_area_id: profile.deliveryAreaId ?? null,
          is_verified: profile.isVerified,
          status: profile.status,
          referral_code: profile.referralCode ?? null,
          referred_by: profile.referredBy ?? null,
          has_active_pass: profile.hasActivePass,
          // Included so an admin can promote/demote and fix emails;
          // the profiles_guard trigger rejects these for non-admins.
          role: profile.role,
          email: profile.email,
        })
        .eq('id', profile.id)
        .select()
        .single(),
    ) as DbProfileRow;
    return mapProfileRow(row);
  });
}

/** Customers who signed up with this referral code (affiliate view). */
export function fetchReferredCustomers(
  referralCode: string,
): Promise<BackendResult<Profile[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('profiles').select('*').eq('referred_by', referralCode),
    ) as DbProfileRow[];
    return rows.map(mapProfileRow);
  });
}

// ============================================================
// Riders (ADD_RIDER / UPDATE_RIDER) — rider_profiles ⨝ profiles
// addRider assumes the person's profile already exists (they
// signed up; admin approval creates this extension row).
// ============================================================

type RiderJoinRow = DbRiderProfileRow & { profiles: DbProfileRow | null };

async function fetchRiderJoin(db: SupabaseClient): Promise<Rider[]> {
  const rows = unwrap(
    await db.from('rider_profiles').select('*, profiles(*)'),
  ) as RiderJoinRow[];
  return rows
    .filter((r) => r.profiles)
    .map((r) => mapRiderRows(r, r.profiles as DbProfileRow));
}

export function fetchRiders(): Promise<BackendResult<Rider[]>> {
  return run((db) => fetchRiderJoin(db));
}

export function fetchRiderByProfileId(profileId: string): Promise<BackendResult<Rider>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('rider_profiles')
        .select('*, profiles(*)')
        .eq('profile_id', profileId)
        .single(),
    ) as RiderJoinRow;
    if (!row.profiles) throw new Error('Rider profile not found');
    return mapRiderRows(row, row.profiles);
  });
}

export function addRider(rider: Rider): Promise<BackendResult<Rider>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('rider_profiles')
        .insert({
          profile_id: rider.userId,
          vehicle_type: rider.vehicleType,
          area_id: rider.areaId ?? null,
          status: rider.status,
          total_deliveries: rider.totalDeliveries,
          total_earnings: rider.totalEarnings,
          rating: rider.rating,
          pending_payout: rider.pendingPayout,
          duty_on: rider.dutyOn ?? true,
        })
        .select()
        .single(),
    );
    const fetched = await fetchRiderByProfileId(rider.userId);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Rider insert failed');
    }
    return fetched.data;
  });
}

export function updateRider(rider: Rider): Promise<BackendResult<Rider>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('rider_profiles')
        .update({
          vehicle_type: rider.vehicleType,
          area_id: rider.areaId ?? null,
          status: rider.status,
          total_deliveries: rider.totalDeliveries,
          total_earnings: rider.totalEarnings,
          rating: rider.rating,
          pending_payout: rider.pendingPayout,
          duty_on: rider.dutyOn ?? true,
        })
        .eq('profile_id', rider.userId)
        .select()
        .single(),
    );
    const fetched = await fetchRiderByProfileId(rider.userId);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Rider update failed');
    }
    return fetched.data;
  });
}

// ============================================================
// Affiliates (ADD_AFFILIATE / UPDATE_AFFILIATE)
// ============================================================

type AffiliateJoinRow = DbAffiliateProfileRow & { profiles: DbProfileRow | null };

export function fetchAffiliates(): Promise<BackendResult<Affiliate[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('affiliate_profiles').select('*, profiles(*)'),
    ) as AffiliateJoinRow[];
    return rows
      .filter((r) => r.profiles)
      .map((r) => mapAffiliateRows(r, r.profiles as DbProfileRow));
  });
}

export function fetchAffiliateByProfileId(
  profileId: string,
): Promise<BackendResult<Affiliate>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('affiliate_profiles')
        .select('*, profiles(*)')
        .eq('profile_id', profileId)
        .single(),
    ) as AffiliateJoinRow;
    if (!row.profiles) throw new Error('Affiliate profile not found');
    return mapAffiliateRows(row, row.profiles);
  });
}

export function addAffiliate(affiliate: Affiliate): Promise<BackendResult<Affiliate>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('affiliate_profiles')
        .insert({
          profile_id: affiliate.userId,
          referral_code: affiliate.referralCode,
          promote_note: affiliate.promoteNote ?? null,
          status: affiliate.status,
          total_referrals: affiliate.totalReferrals,
          total_earnings: affiliate.totalEarnings,
          pending_payout: affiliate.pendingPayout,
          commission_rate: affiliate.commissionRate ?? null,
        })
        .select()
        .single(),
    );
    const fetched = await fetchAffiliateByProfileId(affiliate.userId);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Affiliate insert failed');
    }
    return fetched.data;
  });
}

export function updateAffiliate(
  affiliate: Affiliate,
): Promise<BackendResult<Affiliate>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('affiliate_profiles')
        .update({
          referral_code: affiliate.referralCode,
          promote_note: affiliate.promoteNote ?? null,
          status: affiliate.status,
          total_referrals: affiliate.totalReferrals,
          total_earnings: affiliate.totalEarnings,
          pending_payout: affiliate.pendingPayout,
          commission_rate: affiliate.commissionRate ?? null,
        })
        .eq('profile_id', affiliate.userId)
        .select()
        .single(),
    );
    const fetched = await fetchAffiliateByProfileId(affiliate.userId);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Affiliate update failed');
    }
    return fetched.data;
  });
}

// ============================================================
// Staff (ADD_STAFF / UPDATE_STAFF) — staff_profiles ⨝ profiles
// ============================================================

type StaffJoinRow = DbStaffProfileRow & { profiles: DbProfileRow | null };

export function fetchStaff(): Promise<BackendResult<StaffMember[]>> {
  return run(async (db) => {
    const rows = unwrap(
      await db.from('staff_profiles').select('*, profiles(*)'),
    ) as StaffJoinRow[];
    return rows
      .filter((r) => r.profiles)
      .map((r) => mapStaffRows(r, r.profiles as DbProfileRow));
  });
}

export function fetchStaffByProfileId(
  profileId: string,
): Promise<BackendResult<StaffMember>> {
  return run(async (db) => {
    const row = unwrap(
      await db
        .from('staff_profiles')
        .select('*, profiles(*)')
        .eq('profile_id', profileId)
        .single(),
    ) as StaffJoinRow;
    if (!row.profiles) throw new Error('Staff profile not found');
    return mapStaffRows(row, row.profiles);
  });
}

export function addStaff(member: StaffMember): Promise<BackendResult<StaffMember>> {
  return run(async (db) => {
    // StaffMember.id is the profile uuid in the backend model.
    unwrap(
      await db
        .from('staff_profiles')
        .insert({
          profile_id: member.id,
          permissions: member.permissions,
          is_active: member.isActive,
          last_active: member.lastActive,
        })
        .select()
        .single(),
    );
    const fetched = await fetchStaffByProfileId(member.id);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Staff insert failed');
    }
    return fetched.data;
  });
}

export function updateStaff(member: StaffMember): Promise<BackendResult<StaffMember>> {
  return run(async (db) => {
    unwrap(
      await db
        .from('staff_profiles')
        .update({
          permissions: member.permissions,
          is_active: member.isActive,
          last_active: member.lastActive,
        })
        .eq('profile_id', member.id)
        .select()
        .single(),
    );
    const fetched = await fetchStaffByProfileId(member.id);
    if (!fetched.data) {
      throw new Error(fetched.error?.message ?? 'Staff update failed');
    }
    return fetched.data;
  });
}

// ============================================================
// Affiliate waitlist (ADD_AFFILIATE_WAITLIST) — schema_phase3.sql
// The programme is closed at launch; entry points collect emails
// here. Email is UNIQUE in the DB, mirroring the app reducer's
// trim/lowercase/dedupe behaviour.
// ============================================================

export interface DbAffiliateWaitlistRow {
  id: string;
  email: string;
  created_at: string;
}

export const mapAffiliateWaitlistRow = (
  r: DbAffiliateWaitlistRow,
): AffiliateWaitlistEntry => ({
  email: r.email,
  at: r.created_at,
});

export function fetchAffiliateWaitlist(): Promise<
  BackendResult<AffiliateWaitlistEntry[]>
> {
  return run(async (db) => {
    const rows = unwrap(
      await db
        .from('affiliate_waitlist')
        .select('*')
        .order('created_at', { ascending: true }),
    ) as DbAffiliateWaitlistRow[];
    return rows.map(mapAffiliateWaitlistRow);
  });
}

export function addAffiliateWaitlistEmail(
  email: string,
): Promise<BackendResult<AffiliateWaitlistEntry>> {
  const clean = email.trim().toLowerCase();
  return run(async (db) => {
    const res = await db
      .from('affiliate_waitlist')
      .insert({ email: clean })
      .select()
      .single();
    if (res.error) {
      // Already on the list — the app treats duplicates as a
      // no-op success, so do the same here.
      if (/duplicate key|unique/i.test(res.error.message)) {
        return { email: clean, at: new Date().toISOString() };
      }
      throw new Error(res.error.message);
    }
    return mapAffiliateWaitlistRow(res.data as DbAffiliateWaitlistRow);
  });
}

// ============================================================
// First-run seeding (admin action: "সিড ডেটা বসান")
// Inserts the starter catalogue from src/data constants into
// EMPTY tables only — every table is checked first, so running
// it twice (or after seed.sql already loaded areas) changes
// nothing. Settings are written only when no settings row
// exists yet. The seed constants are passed in by the caller so
// this layer stays free of data imports.
// ============================================================

export interface SeedBundle {
  areas: DeliveryArea[];
  products: Product[];
  restaurants: Restaurant[];
  promos: PromoCode[];
  settings: AdminSettings;
}

export interface SeedSummary {
  areas: number;
  products: number;
  restaurants: number;
  menuItems: number;
  promos: number;
  settings: boolean;
}

export function seedStarterData(
  bundle: SeedBundle,
): Promise<BackendResult<SeedSummary>> {
  return run(async (db) => {
    const summary: SeedSummary = {
      areas: 0,
      products: 0,
      restaurants: 0,
      menuItems: 0,
      promos: 0,
      settings: false,
    };
    const isEmpty = async (table: string): Promise<boolean> => {
      const res = await db
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (res.error) throw new Error(res.error.message);
      return (res.count ?? 0) === 0;
    };

    if ((await isEmpty('areas')) && bundle.areas.length > 0) {
      unwrap(
        await db.from('areas').insert(bundle.areas.map(areaPayload)).select('id'),
      );
      summary.areas = bundle.areas.length;
    }

    if ((await isEmpty('products')) && bundle.products.length > 0) {
      unwrap(
        await db
          .from('products')
          .insert(bundle.products.map(productPayload))
          .select('id'),
      );
      summary.products = bundle.products.length;
    }

    if ((await isEmpty('restaurants')) && bundle.restaurants.length > 0) {
      unwrap(
        await db
          .from('restaurants')
          .insert(bundle.restaurants.map(restaurantPayload))
          .select('id'),
      );
      summary.restaurants = bundle.restaurants.length;
      const items = bundle.restaurants.flatMap((r) => r.menuItems);
      if (items.length > 0) {
        unwrap(
          await db.from('menu_items').insert(items.map(menuItemPayload)).select('id'),
        );
        summary.menuItems = items.length;
      }
    }

    if ((await isEmpty('promos')) && bundle.promos.length > 0) {
      unwrap(
        await db.from('promos').insert(bundle.promos.map(promoPayload)).select('code'),
      );
      summary.promos = bundle.promos.length;
    }

    const existingSettings = await fetchAdminSettings();
    if (!existingSettings.data) {
      const saved = await updateAdminSettings(bundle.settings);
      if (saved.error) throw new Error(saved.error.message);
      summary.settings = true;
    }

    return summary;
  });
}

// ============================================================
// Realtime subscriptions (Phase 3) — orders + notifications.
// Requires schema_phase3.sql (tables added to the
// supabase_realtime publication). RLS still applies: a client
// only receives change events for rows it may SELECT.
// DELETE events are ignored by design (order deletes are
// admin-only and rare; the next hydration covers them).
// Returns an unsubscribe function (safe no-op unconfigured).
// ============================================================

export function subscribeToOrders(onChange: (order: Order) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => undefined;
  const db = supabase;
  const channel = db
    .channel('jovro-orders-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        onChange(mapOrderRow(payload.new as DbOrderRow));
      },
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}

export function subscribeToNotifications(
  onChange: (notification: AppNotification) => void,
): () => void {
  if (!isSupabaseConfigured || !supabase) return () => undefined;
  const db = supabase;
  const channel = db
    .channel('jovro-notifications-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        onChange(mapNotificationRow(payload.new as DbNotificationRow));
      },
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}
