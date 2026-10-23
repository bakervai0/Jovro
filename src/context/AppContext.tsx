import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import type {
  User, UserRole, Lang, CartItem, Order, AppNotification,
  SavedAddress, PromoCode, Rider, Affiliate, StaffMember,
  ProblemReport, Review, PaymentRequest, Product, DeliveryArea,
  ActivityLogEntry, Restaurant, AdminSettings, AffiliateWaitlistEntry
} from '../types';
import {
  DEMO_USERS, SAMPLE_ORDERS, SAMPLE_NOTIFICATIONS, SAMPLE_ADDRESSES, PROMO_CODES,
  SAMPLE_RIDERS, SAMPLE_AFFILIATES, SAMPLE_STAFF, SAMPLE_PROBLEM_REPORTS,
  SAMPLE_REVIEWS, SAMPLE_PAYMENT_REQUESTS, ACTIVITY_LOG_SEED, DEFAULT_ADMIN_SETTINGS
} from '../data/seed';
import { DELIVERY_AREAS } from '../data/areas';
import { isWithinServiceHours } from '../services/orderUtils';
import { PRODUCTS } from '../data/products';
import { RESTAURANTS } from '../data/restaurants';
import { useT } from '../i18n';
// Backend (Phase 3) — only ever exercised when Supabase is
// configured; in demo mode every path below is a no-op and the
// localStorage behaviour is byte-for-byte what it always was.
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import * as be from '../lib/backend';
import {
  onAuthChange, profileToUser, signOut as supabaseSignOut, type Profile,
} from '../lib/auth';

// ── State Shape ────────────────────────────────────────────────
interface AppState {
  // Session
  user: User | null;
  role: UserRole;
  lang: Lang;
  isLoggedIn: boolean;
  isServiceOpen: boolean;
  /** Admin master-switch override: 'auto' follows the Dhaka
   * service windows (06:00–13:30 + 16:30–22:30); 'open'/'closed'
   * are manual overrides set from the admin TOGGLE_SERVICE switch. */
  serviceOverride: 'auto' | 'open' | 'closed';
  isSlotFull: boolean;
  // Cart
  cart: CartItem[];
  // Data
  orders: Order[];
  notifications: AppNotification[];
  addresses: SavedAddress[];
  favouriteProductIds: string[];
  // Shared collections (Phase 5 groundwork — consumed by rider /
  // operator / affiliate sections now, admin section in Part 2)
  riders: Rider[];
  affiliates: Affiliate[];
  affiliateWaitlist: AffiliateWaitlistEntry[];
  staff: StaffMember[];
  problemReports: ProblemReport[];
  reviews: Review[];
  paymentRequests: PaymentRequest[];
  products: Product[];
  areas: DeliveryArea[];
  activityLog: ActivityLogEntry[];
  restaurants: Restaurant[];
  promos: PromoCode[];
  adminSettings: AdminSettings;
  // App state
  selectedAreaId: string;
  appliedPromo: PromoCode | null;
}

// ── Actions ────────────────────────────────────────────────────
type Action =
  | { type: 'SET_ROLE'; role: UserRole }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_AREA'; areaId: string }
  | { type: 'ADD_TO_CART'; item: CartItem }
  | { type: 'REMOVE_FROM_CART'; id: string }
  | { type: 'UPDATE_CART_QTY'; id: string; qty: number }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_PROMO'; promo: PromoCode }
  | { type: 'REMOVE_PROMO' }
  | { type: 'PLACE_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'ADD_ADDRESS'; address: SavedAddress }
  | { type: 'UPDATE_ADDRESS'; address: SavedAddress }
  | { type: 'DELETE_ADDRESS'; id: string }
  | { type: 'TOGGLE_FAVOURITE'; productId: string }
  | { type: 'TOGGLE_SERVICE' }
  | { type: 'SET_SERVICE_OVERRIDE'; override: 'auto' | 'open' | 'closed' }
  | { type: 'SERVICE_TICK' }
  | { type: 'TOGGLE_SLOT' }
  | { type: 'UPDATE_PROFILE'; user: User }
  // Phase 5 shared collections
  | { type: 'ADD_RIDER'; rider: Rider }
  | { type: 'UPDATE_RIDER'; rider: Rider }
  | { type: 'ADD_AFFILIATE'; affiliate: Affiliate }
  | { type: 'UPDATE_AFFILIATE'; affiliate: Affiliate }
  | { type: 'ADD_AFFILIATE_WAITLIST'; email: string }
  | { type: 'ADD_STAFF'; member: StaffMember }
  | { type: 'UPDATE_STAFF'; member: StaffMember }
  | { type: 'ADD_PROBLEM_REPORT'; report: ProblemReport }
  | { type: 'UPDATE_PROBLEM_REPORT'; report: ProblemReport }
  | { type: 'ADD_PAYMENT_REQUEST'; request: PaymentRequest }
  | { type: 'UPDATE_PAYMENT_REQUEST'; request: PaymentRequest }
  | { type: 'ADD_PRODUCT'; product: Product }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'DELETE_PRODUCT'; id: string }
  | { type: 'UPDATE_AREA'; area: DeliveryArea }
  | { type: 'ADD_REVIEW'; review: Review }
  | { type: 'UPDATE_REVIEW'; review: Review }
  | { type: 'LOG_ACTIVITY'; entry: ActivityLogEntry }
  | { type: 'ADD_APPLICATION'; rider?: Rider; affiliate?: Affiliate }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'ADD_RESTAURANT'; restaurant: Restaurant }
  | { type: 'UPDATE_RESTAURANT'; restaurant: Restaurant }
  | { type: 'DELETE_RESTAURANT'; id: string }
  | { type: 'ADD_PROMO'; promo: PromoCode }
  | { type: 'UPDATE_PROMO'; promo: PromoCode }
  | { type: 'UPDATE_ADMIN_SETTINGS'; settings: AdminSettings }
  | { type: 'HYDRATE'; state: Partial<AppState> }
  | { type: 'MERGE_ORDERS'; orders: Order[] }
  | { type: 'MERGE_NOTIFICATIONS'; notifications: AppNotification[] };

// ── Helpers ────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

/** Slices persisted together so cross-role demo flows (assign →
 * rider view, report → admin inbox) survive the role switcher's
 * full-page navigation. */
const DATA_KEY = 'jovro_data_v5';
interface PersistedData {
  orders: Order[];
  riders: Rider[];
  affiliates: Affiliate[];
  affiliateWaitlist: AffiliateWaitlistEntry[];
  staff: StaffMember[];
  problemReports: ProblemReport[];
  reviews: Review[];
  paymentRequests: PaymentRequest[];
  products: Product[];
  areas: DeliveryArea[];
  activityLog: ActivityLogEntry[];
  restaurants: Restaurant[];
  promos: PromoCode[];
  adminSettings: AdminSettings;
  notifications: AppNotification[];
  addresses: SavedAddress[];
  appliedPromo: PromoCode | null;
  serviceOverride: 'auto' | 'open' | 'closed';
}

const INITIAL: AppState = {
  user: null, role: 'customer', lang: 'bn', isLoggedIn: false,
  isServiceOpen: isWithinServiceHours(), serviceOverride: 'auto', isSlotFull: false,
  cart: [], orders: SAMPLE_ORDERS,
  notifications: SAMPLE_NOTIFICATIONS,
  addresses: SAMPLE_ADDRESSES,
  favouriteProductIds: [],
  riders: SAMPLE_RIDERS,
  affiliates: SAMPLE_AFFILIATES,
  affiliateWaitlist: [],
  staff: SAMPLE_STAFF,
  problemReports: SAMPLE_PROBLEM_REPORTS,
  reviews: SAMPLE_REVIEWS,
  paymentRequests: SAMPLE_PAYMENT_REQUESTS,
  products: PRODUCTS,
  areas: DELIVERY_AREAS,
  activityLog: ACTIVITY_LOG_SEED,
  restaurants: RESTAURANTS,
  promos: PROMO_CODES,
  adminSettings: DEFAULT_ADMIN_SETTINGS,
  selectedAreaId: 'area-01',
  appliedPromo: null,
};

// ── Reducer ────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.state };
    case 'MERGE_ORDERS': {
      // Realtime merge: a remote row replaces the same-id local
      // row, brand-new remote rows go on top, and local-only
      // rows survive (an optimistic row the server echo has not
      // reached yet must never vanish).
      const incoming = new Map(action.orders.map(o => [o.id, o]));
      const known = new Set(state.orders.map(o => o.id));
      const fresh = action.orders.filter(o => !known.has(o.id));
      const merged = state.orders.map(o => incoming.get(o.id) ?? o);
      return { ...state, orders: [...fresh, ...merged] };
    }
    case 'MERGE_NOTIFICATIONS': {
      const incoming = new Map(action.notifications.map(n => [n.id, n]));
      const known = new Set(state.notifications.map(n => n.id));
      const fresh = action.notifications.filter(n => !known.has(n.id));
      const merged = state.notifications.map(n => incoming.get(n.id) ?? n);
      return { ...state, notifications: [...fresh, ...merged] };
    }
    case 'SET_ROLE': {
      const user = DEMO_USERS[action.role];
      return { ...state, role: action.role, user, isLoggedIn: true };
    }
    case 'SET_LANG': return { ...state, lang: action.lang };
    case 'LOGIN': return { ...state, user: action.user, role: action.user.role, isLoggedIn: true };
    case 'LOGOUT': return { ...state, user: null, role: 'customer', isLoggedIn: false, cart: [], appliedPromo: null };
    case 'UPDATE_PROFILE': return { ...state, user: action.user };
    case 'SET_AREA': return { ...state, selectedAreaId: action.areaId };

    case 'ADD_TO_CART': {
      // Lines are keyed by id + unit price: the same product at a
      // different price (flash sale vs regular, pack variants)
      // must never merge into one mis-priced line. Merging adds
      // the incoming quantity (reorder passes original qtys).
      const item = action.item;
      const qty = Math.max(1, item.quantity || 1);
      const bump = (line: CartItem) => ({ ...line, quantity: line.quantity + qty, note: item.note ?? line.note });
      const exact = state.cart.find(i => i.id === item.id && i.price === item.price);
      if (exact) {
        return { ...state, cart: state.cart.map(i => (i === exact ? bump(i) : i)) };
      }
      if (state.cart.some(i => i.id === item.id)) {
        const derivedId = `${item.id}::${item.price}`;
        const derived = state.cart.find(i => i.id === derivedId);
        if (derived) {
          return { ...state, cart: state.cart.map(i => (i === derived ? bump(i) : i)) };
        }
        return { ...state, cart: [...state.cart, { ...item, id: derivedId, quantity: qty }] };
      }
      return { ...state, cart: [...state.cart, { ...item, quantity: qty }] };
    }
    case 'REMOVE_FROM_CART': return { ...state, cart: state.cart.filter(i => i.id !== action.id) };
    case 'UPDATE_CART_QTY': {
      if (action.qty <= 0) return { ...state, cart: state.cart.filter(i => i.id !== action.id) };
      return { ...state, cart: state.cart.map(i => i.id === action.id ? { ...i, quantity: action.qty } : i) };
    }
    case 'CLEAR_CART': return { ...state, cart: [], appliedPromo: null };
    case 'APPLY_PROMO': return { ...state, appliedPromo: action.promo };
    case 'REMOVE_PROMO': return { ...state, appliedPromo: null };

    case 'PLACE_ORDER': return { ...state, orders: [action.order, ...state.orders], cart: [], appliedPromo: null };
    case 'UPDATE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.order.id ? action.order : o) };

    case 'MARK_NOTIFICATION_READ': return { ...state, notifications: state.notifications.map(n => n.id === action.id ? { ...n, isRead: true } : n) };
    case 'MARK_ALL_READ': return { ...state, notifications: state.notifications.map(n => (!state.user || n.userId === state.user.id || n.userId === 'all') ? { ...n, isRead: true } : n) };

    case 'ADD_ADDRESS': return { ...state, addresses: [...state.addresses, action.address] };
    case 'UPDATE_ADDRESS': return { ...state, addresses: state.addresses.map(a => a.id === action.address.id ? action.address : a) };
    case 'DELETE_ADDRESS': return { ...state, addresses: state.addresses.filter(a => a.id !== action.id) };

    case 'TOGGLE_FAVOURITE': {
      const favs = state.favouriteProductIds;
      return { ...state, favouriteProductIds: favs.includes(action.productId) ? favs.filter(id => id !== action.productId) : [...favs, action.productId] };
    }
    case 'TOGGLE_SERVICE': {
      // Master switch = manual override of the time-based state.
      const override = state.isServiceOpen ? 'closed' as const : 'open' as const;
      return { ...state, serviceOverride: override, isServiceOpen: override === 'open' };
    }
    case 'SET_SERVICE_OVERRIDE': {
      // Explicit tri-state from admin settings: 'auto' hands the
      // open/closed decision back to the service-hours clock.
      const o = action.override;
      return {
        ...state,
        serviceOverride: o,
        isServiceOpen: o === 'auto' ? isWithinServiceHours() : o === 'open',
      };
    }
    case 'SERVICE_TICK': {
      if (state.serviceOverride !== 'auto') return state;
      const open = isWithinServiceHours();
      return open === state.isServiceOpen ? state : { ...state, isServiceOpen: open };
    }
    case 'TOGGLE_SLOT': return { ...state, isSlotFull: !state.isSlotFull };

    // Phase 5 shared collections
    case 'ADD_RIDER': return { ...state, riders: [action.rider, ...state.riders] };
    case 'UPDATE_RIDER': return { ...state, riders: state.riders.map(r => r.id === action.rider.id ? action.rider : r) };
    case 'ADD_AFFILIATE': return { ...state, affiliates: [action.affiliate, ...state.affiliates] };
    case 'UPDATE_AFFILIATE': return { ...state, affiliates: state.affiliates.map(a => a.id === action.affiliate.id ? action.affiliate : a) };
    case 'ADD_AFFILIATE_WAITLIST': {
      const email = action.email.trim().toLowerCase();
      if (!email || state.affiliateWaitlist.some(e => e.email === email)) return state;
      return { ...state, affiliateWaitlist: [...state.affiliateWaitlist, { email, at: new Date().toISOString() }] };
    }
    case 'ADD_STAFF': return { ...state, staff: [action.member, ...state.staff] };
    case 'UPDATE_STAFF': return { ...state, staff: state.staff.map(m => m.id === action.member.id ? action.member : m) };
    case 'ADD_PROBLEM_REPORT': return { ...state, problemReports: [action.report, ...state.problemReports] };
    case 'UPDATE_PROBLEM_REPORT': return { ...state, problemReports: state.problemReports.map(r => r.id === action.report.id ? action.report : r) };
    case 'ADD_PAYMENT_REQUEST': return { ...state, paymentRequests: [action.request, ...state.paymentRequests] };
    case 'UPDATE_PAYMENT_REQUEST': return { ...state, paymentRequests: state.paymentRequests.map(r => r.id === action.request.id ? action.request : r) };
    case 'ADD_PRODUCT': return { ...state, products: [action.product, ...state.products] };
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.product.id ? action.product : p) };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.id) };
    case 'UPDATE_AREA': return { ...state, areas: state.areas.map(a => a.id === action.area.id ? action.area : a) };
    case 'ADD_REVIEW': return { ...state, reviews: [action.review, ...state.reviews] };
    case 'UPDATE_REVIEW': return { ...state, reviews: state.reviews.map(r => r.id === action.review.id ? action.review : r) };
    case 'LOG_ACTIVITY': return { ...state, activityLog: [action.entry, ...state.activityLog] };
    case 'ADD_NOTIFICATION': return { ...state, notifications: [action.notification, ...state.notifications] };
    case 'ADD_RESTAURANT': return { ...state, restaurants: [action.restaurant, ...state.restaurants] };
    case 'UPDATE_RESTAURANT': return { ...state, restaurants: state.restaurants.map(r => r.id === action.restaurant.id ? action.restaurant : r) };
    case 'DELETE_RESTAURANT': return { ...state, restaurants: state.restaurants.filter(r => r.id !== action.id) };
    case 'ADD_PROMO': return { ...state, promos: [action.promo, ...state.promos] };
    case 'UPDATE_PROMO': return { ...state, promos: state.promos.map(pr => pr.code === action.promo.code ? action.promo : pr) };
    case 'UPDATE_ADMIN_SETTINGS': return { ...state, adminSettings: action.settings };
    case 'ADD_APPLICATION': {
      let next = state;
      if (action.rider) next = { ...next, riders: [action.rider, ...next.riders] };
      if (action.affiliate) next = { ...next, affiliates: [action.affiliate, ...next.affiliates] };
      return next;
    }

    default: return state;
  }
}

// ── Backend sync (Phase 3 — configured mode ONLY) ─────────────
// Every mutation is applied locally FIRST (the reducer above),
// then written through to Supabase. A failed write is logged and
// recorded in a non-blocking sync flag — the local update is
// never rolled back. People-ids: in configured mode the app's
// User.id / Rider.userId / Affiliate.userId / StaffMember.id ARE
// profile uuids (see src/lib/backend.ts header), so FK columns
// (orders.customer_id, payment_requests.requester_id, …) take
// the app ids verbatim — profiles is the only lookup needed.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string | undefined | null): v is string => !!v && UUID_RE.test(v);
const syncId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type SyncFail = (label: string, e: unknown) => void;

async function chk<T>(label: string, p: Promise<be.BackendResult<T>>, fail: SyncFail): Promise<T | null> {
  const r = await p;
  if (r.error) { fail(label, r.error); return null; }
  return r.data;
}

function userToProfile(user: User): Profile {
  return {
    id: user.id,
    email: user.email ?? '',
    role: user.role,
    name: user.name,
    nameBn: user.nameBn,
    mobile: user.mobile,
    altMobile: user.altMobile,
    avatarUrl: user.avatarUrl,
    deliveryAreaId: user.deliveryAreaId,
    isVerified: user.isVerified,
    status: 'active',
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    hasActivePass: user.hasActivePass ?? false,
    createdAt: user.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

async function writeSettingsRow(
  settings: AdminSettings,
  override: 'auto' | 'open' | 'closed',
  fail: SyncFail,
): Promise<void> {
  // admin_settings.settings is jsonb: the tri-state override
  // rides along as an extra key so it round-trips with the rest
  // of AdminSettings (extracted again at hydration).
  const merged = { ...settings, serviceOverride: override } as AdminSettings;
  await chk('সেটিংস সেভ', be.updateAdminSettings(merged), fail);
}

async function syncActionToBackend(
  action: Action,
  state: AppState,
  pendingApps: Map<string, be.ApplicationRecord>,
  fail: SyncFail,
): Promise<void> {
  switch (action.type) {
    // ── Orders ──────────────────────────────────────────────
    case 'PLACE_ORDER':
      await chk('অর্ডার সেভ', be.placeOrder(action.order), fail);
      return;
    case 'UPDATE_ORDER':
      await chk('অর্ডার আপডেট', be.updateOrder(action.order), fail);
      return;

    // ── Catalogue ───────────────────────────────────────────
    case 'ADD_PRODUCT':
      await chk('পণ্য যোগ', be.addProduct(action.product), fail);
      return;
    case 'UPDATE_PRODUCT':
      await chk('পণ্য আপডেট', be.updateProduct(action.product), fail);
      return;
    case 'DELETE_PRODUCT':
      await chk('পণ্য মোছা', be.deleteProduct(action.id), fail);
      return;
    case 'ADD_RESTAURANT':
      await chk('রেস্টুরেন্ট যোগ', be.addRestaurant(action.restaurant), fail);
      return;
    case 'UPDATE_RESTAURANT':
      await chk('রেস্টুরেন্ট আপডেট', be.updateRestaurant(action.restaurant), fail);
      return;
    case 'DELETE_RESTAURANT':
      await chk('রেস্টুরেন্ট মোছা', be.deleteRestaurant(action.id), fail);
      return;
    case 'ADD_PROMO':
      await chk('প্রোমো যোগ', be.addPromo(action.promo), fail);
      return;
    case 'UPDATE_PROMO':
      await chk('প্রোমো আপডেট', be.updatePromo(action.promo), fail);
      return;
    case 'UPDATE_AREA':
      await chk('এলাকা আপডেট', be.updateArea(action.area), fail);
      return;

    // ── Support / reviews / payouts ─────────────────────────
    case 'ADD_PROBLEM_REPORT':
      await chk('রিপোর্ট সেভ', be.addProblemReport(action.report), fail);
      return;
    case 'UPDATE_PROBLEM_REPORT':
      await chk('রিপোর্ট আপডেট', be.updateProblemReport(action.report), fail);
      return;
    case 'ADD_REVIEW':
      await chk('রিভিউ সেভ', be.addReview(action.review), fail);
      return;
    case 'UPDATE_REVIEW':
      await chk('রিভিউ আপডেট', be.updateReview(action.review), fail);
      return;
    case 'ADD_PAYMENT_REQUEST':
    case 'UPDATE_PAYMENT_REQUEST': {
      const req = action.request;
      const requesterType: 'rider' | 'affiliate' =
        state.affiliates.some(a => a.id === req.riderId || a.userId === req.riderId)
          ? 'affiliate'
          : 'rider';
      const payload: be.BackendPaymentRequest = { ...req, requesterType };
      if (action.type === 'ADD_PAYMENT_REQUEST') {
        await chk('পেমেন্ট রিকোয়েস্ট', be.addPaymentRequest(payload), fail);
      } else {
        await chk('পেমেন্ট রিকোয়েস্ট আপডেট', be.updatePaymentRequest(payload), fail);
      }
      return;
    }

    // ── Notifications ───────────────────────────────────────
    case 'ADD_NOTIFICATION': {
      const n = action.notification;
      if (n.userId === 'all') {
        // notifications.user_id is a profile FK — a literal
        // 'all' row cannot exist in the DB. Broadcasts fan out
        // to one row per profile instead (admin/staff senders
        // may read profiles; anyone else's attempt is logged).
        const profiles = await chk('ব্রডকাস্ট', be.fetchProfiles(), fail);
        if (profiles) {
          for (const p of profiles) {
            await chk('ব্রডকাস্ট', be.addNotification({ ...n, id: syncId('notif'), userId: p.id }), fail);
          }
        }
        return;
      }
      if (isUuid(n.userId)) await chk('নোটিফিকেশন', be.addNotification(n), fail);
      return;
    }
    case 'MARK_NOTIFICATION_READ':
      await chk('নোটিফিকেশন', be.markNotificationRead(action.id), fail);
      return;
    case 'MARK_ALL_READ':
      if (isUuid(state.user?.id)) {
        await chk('নোটিফিকেশন', be.markAllNotificationsRead(state.user.id), fail);
      }
      return;

    // ── Addresses ───────────────────────────────────────────
    case 'ADD_ADDRESS':
      await chk('ঠিকানা সেভ', be.addAddress(action.address), fail);
      return;
    case 'UPDATE_ADDRESS':
      await chk('ঠিকানা আপডেট', be.updateAddress(action.address), fail);
      return;
    case 'DELETE_ADDRESS':
      await chk('ঠিকানা মোছা', be.deleteAddress(action.id), fail);
      return;

    // ── Waitlist ────────────────────────────────────────────
    case 'ADD_AFFILIATE_WAITLIST':
      await chk('অপেক্ষা তালিকা', be.addAffiliateWaitlistEmail(action.email), fail);
      return;

    // ── Settings ────────────────────────────────────────────
    case 'UPDATE_ADMIN_SETTINGS':
      await writeSettingsRow(action.settings, state.serviceOverride, fail);
      return;
    case 'SET_SERVICE_OVERRIDE':
      await writeSettingsRow(state.adminSettings, action.override, fail);
      return;
    case 'TOGGLE_SERVICE': {
      const next = state.isServiceOpen ? 'closed' as const : 'open' as const;
      await writeSettingsRow(state.adminSettings, next, fail);
      return;
    }

    // ── Profile ─────────────────────────────────────────────
    case 'UPDATE_PROFILE':
      if (isUuid(action.user.id)) {
        await chk('প্রোফাইল আপডেট', be.updateProfile(userToProfile(action.user)), fail);
      }
      return;

    // ── Activity log (best-effort: RLS only lets admin/staff
    //    insert, so customer-side entries are console-only) ───
    case 'LOG_ACTIVITY': {
      const r = await be.logActivity(
        action.entry,
        isUuid(state.user?.id) ? state.user.id : undefined,
      );
      if (r.error) console.debug('[Jovro backend sync] activity log skipped:', r.error.message);
      return;
    }

    // ── Applications ────────────────────────────────────────
    case 'ADD_APPLICATION': {
      const myId = isUuid(state.user?.id) ? state.user.id : undefined;
      if (action.rider) {
        const r = action.rider;
        await chk('রাইডার আবেদন', be.addApplication({
          id: syncId('app'),
          type: 'rider',
          profileId: isUuid(r.userId) ? r.userId : myId,
          name: r.name, nameBn: r.nameBn, mobile: r.mobile, email: r.email,
          areaId: r.areaId, vehicleType: r.vehicleType,
          payload: {}, status: 'pending', createdAt: new Date().toISOString(),
        }), fail);
      }
      if (action.affiliate) {
        const a = action.affiliate;
        await chk('অ্যাফিলিয়েট আবেদন', be.addApplication({
          id: syncId('app'),
          type: 'affiliate',
          profileId: isUuid(a.userId) ? a.userId : myId,
          name: a.name, nameBn: a.nameBn, mobile: a.mobile, email: a.email,
          promoteNote: a.promoteNote,
          payload: {}, status: 'pending', createdAt: new Date().toISOString(),
        }), fail);
      }
      return;
    }

    // ── Riders ──────────────────────────────────────────────
    case 'ADD_RIDER': {
      // Direct add: the person must already have signed up —
      // their profile (found by email) gains the rider row +
      // the rider role.
      const email = action.rider.email?.trim();
      if (!email) { fail('রাইডার যোগ', new Error('ইমেইল ছাড়া backend-এ রাইডার যোগ করা যায় না')); return; }
      const found = await be.fetchProfileByEmail(email);
      if (!found.data) {
        fail('রাইডার যোগ', new Error(`${email} দিয়ে কোনো অ্যাকাউন্ট নেই — তাকে আগে অ্যাপে সাইন আপ করতে বলুন`));
        return;
      }
      await chk('রাইডার তৈরি', be.addRider({ ...action.rider, id: found.data.id, userId: found.data.id, status: 'active' }), fail);
      await chk('রোল বদল', be.updateProfile({ ...found.data, role: 'rider' }), fail);
      return;
    }
    case 'UPDATE_RIDER': {
      const app = pendingApps.get(action.rider.id);
      if (app) {
        // This "rider" is a pending APPLICATION — approving it
        // creates the real rider row and flips the profile role;
        // rejecting just closes the application.
        if (action.rider.status === 'active') {
          if (!isUuid(app.profileId)) {
            fail('রাইডার অনুমোদন', new Error('আবেদনকারীর অ্যাকাউন্ট (profile) পাওয়া যায়নি'));
            return;
          }
          await chk('আবেদন আপডেট', be.updateApplicationStatus(app.id, 'approved'), fail);
          await chk('রাইডার তৈরি', be.addRider({ ...action.rider, id: app.profileId, userId: app.profileId, status: 'active' }), fail);
          const prof = await chk('প্রোফাইল খোঁজা', be.fetchProfileById(app.profileId), fail);
          if (prof) await chk('রোল বদল', be.updateProfile({ ...prof, role: 'rider' }), fail);
          pendingApps.delete(app.id);
        } else if (action.rider.status === 'inactive') {
          await chk('আবেদন আপডেট', be.updateApplicationStatus(app.id, 'rejected'), fail);
          pendingApps.delete(app.id);
        }
        return;
      }
      if (isUuid(action.rider.userId)) {
        await chk('রাইডার আপডেট', be.updateRider(action.rider), fail);
      }
      return;
    }

    // ── Affiliates ──────────────────────────────────────────
    case 'ADD_AFFILIATE': {
      const email = action.affiliate.email?.trim();
      if (!email) { fail('অ্যাফিলিয়েট যোগ', new Error('ইমেইল ছাড়া backend-এ অ্যাফিলিয়েট যোগ করা যায় না')); return; }
      const found = await be.fetchProfileByEmail(email);
      if (!found.data) {
        fail('অ্যাফিলিয়েট যোগ', new Error(`${email} দিয়ে কোনো অ্যাকাউন্ট নেই — তাকে আগে অ্যাপে সাইন আপ করতে বলুন`));
        return;
      }
      await chk('অ্যাফিলিয়েট তৈরি', be.addAffiliate({
        ...action.affiliate, id: found.data.id, userId: found.data.id, status: 'active',
        referralCode: action.affiliate.referralCode || (found.data.referralCode ?? ''),
      }), fail);
      await chk('রোল বদল', be.updateProfile({ ...found.data, role: 'affiliate' }), fail);
      return;
    }
    case 'UPDATE_AFFILIATE': {
      const app = pendingApps.get(action.affiliate.id);
      if (app) {
        if (action.affiliate.status === 'active') {
          if (!isUuid(app.profileId)) {
            fail('অ্যাফিলিয়েট অনুমোদন', new Error('আবেদনকারীর অ্যাকাউন্ট (profile) পাওয়া যায়নি'));
            return;
          }
          await chk('আবেদন আপডেট', be.updateApplicationStatus(app.id, 'approved'), fail);
          const prof = await chk('প্রোফাইল খোঁজা', be.fetchProfileById(app.profileId), fail);
          await chk('অ্যাফিলিয়েট তৈরি', be.addAffiliate({
            ...action.affiliate, id: app.profileId, userId: app.profileId, status: 'active',
            referralCode: action.affiliate.referralCode || (prof?.referralCode ?? ''),
          }), fail);
          if (prof) await chk('রোল বদল', be.updateProfile({ ...prof, role: 'affiliate' }), fail);
          pendingApps.delete(app.id);
        } else if (action.affiliate.status === 'inactive') {
          await chk('আবেদন আপডেট', be.updateApplicationStatus(app.id, 'rejected'), fail);
          pendingApps.delete(app.id);
        }
        return;
      }
      if (isUuid(action.affiliate.userId)) {
        await chk('অ্যাফিলিয়েট আপডেট', be.updateAffiliate(action.affiliate), fail);
      }
      return;
    }

    // ── Staff ───────────────────────────────────────────────
    case 'ADD_STAFF': {
      const email = action.member.email?.trim();
      if (!email) { fail('স্টাফ যোগ', new Error('ইমেইল ছাড়া backend-এ স্টাফ যোগ করা যায় না')); return; }
      const found = await be.fetchProfileByEmail(email);
      if (!found.data) {
        fail('স্টাফ যোগ', new Error(`${email} দিয়ে কোনো অ্যাকাউন্ট নেই — তাকে আগে অ্যাপে সাইন আপ করতে বলুন`));
        return;
      }
      await chk('স্টাফ তৈরি', be.addStaff({ ...action.member, id: found.data.id }), fail);
      await chk('রোল বদল', be.updateProfile({ ...found.data, role: 'staff' }), fail);
      return;
    }
    case 'UPDATE_STAFF': {
      if (isUuid(action.member.id)) {
        await chk('স্টাফ আপডেট', be.updateStaff(action.member), fail);
        return;
      }
      const email = action.member.email?.trim();
      if (email) {
        const found = await be.fetchProfileByEmail(email);
        if (found.data) {
          await chk('স্টাফ আপডেট', be.updateStaff({ ...action.member, id: found.data.id }), fail);
        }
      }
      return;
    }

    default:
      return;
  }
}

/**
 * Hydrate the shared collections from Supabase (configured mode
 * only), replacing the seed slices. Any slice whose fetch fails
 * keeps its current local value — a flaky connection must never
 * blank the app. Pending applications are folded into the
 * riders/affiliates lists as pending records (id = application
 * id) so the existing admin approval UI works unchanged; the
 * sync layer recognises those ids via `pendingApps`.
 */
async function hydrateFromBackend(
  rawDispatch: React.Dispatch<Action>,
  pendingApps: Map<string, be.ApplicationRecord>,
  fail: SyncFail,
): Promise<void> {
  const db = supabase;
  if (!db) return;
  const take = <T,>(label: string, r: be.BackendResult<T>): T | null => {
    if (r.error) { fail(`ডেটা লোড (${label})`, r.error); return null; }
    return r.data;
  };

  const [
    areasR, productsR, restaurantsR, promosR, settingsR, ordersR,
    ridersR, affiliatesR, staffR, reportsR, reviewsR, paymentsR,
    activityR, waitlistR, applicationsR,
  ] = await Promise.all([
    be.fetchAreas(), be.fetchProducts(), be.fetchRestaurants(), be.fetchPromos(),
    be.fetchAdminSettings(), be.fetchOrders(), be.fetchRiders(), be.fetchAffiliates(),
    be.fetchStaff(), be.fetchProblemReports(), be.fetchReviews(), be.fetchPaymentRequests(),
    be.fetchActivityLog(), be.fetchAffiliateWaitlist(), be.fetchApplications('pending'),
  ]);

  const partial: Partial<AppState> = {};
  const areas = take('এলাকা', areasR); if (areas) partial.areas = areas;
  const products = take('পণ্য', productsR); if (products) partial.products = products;
  const restaurants = take('রেস্টুরেন্ট', restaurantsR); if (restaurants) partial.restaurants = restaurants;
  const promos = take('প্রোমো', promosR); if (promos) partial.promos = promos;
  const orders = take('অর্ডার', ordersR); if (orders) partial.orders = orders;
  const reports = take('রিপোর্ট', reportsR); if (reports) partial.problemReports = reports;
  const reviews = take('রিভিউ', reviewsR); if (reviews) partial.reviews = reviews;
  const payments = take('পেমেন্ট রিকোয়েস্ট', paymentsR); if (payments) partial.paymentRequests = payments;
  const staff = take('স্টাফ', staffR); if (staff) partial.staff = staff;
  const activity = take('অ্যাক্টিভিটি লগ', activityR); if (activity) partial.activityLog = activity;
  const waitlist = take('অপেক্ষা তালিকা', waitlistR); if (waitlist) partial.affiliateWaitlist = waitlist;
  const riders = take('রাইডার', ridersR); if (riders) partial.riders = riders;
  const affiliates = take('অ্যাফিলিয়েট', affiliatesR); if (affiliates) partial.affiliates = affiliates;

  const settings = take('সেটিংস', settingsR);
  if (settings) {
    partial.adminSettings = { ...DEFAULT_ADMIN_SETTINGS, ...settings };
    const ov = (settings as AdminSettings & { serviceOverride?: 'auto' | 'open' | 'closed' }).serviceOverride;
    if (ov === 'auto' || ov === 'open' || ov === 'closed') {
      partial.serviceOverride = ov;
      partial.isServiceOpen = ov === 'auto' ? isWithinServiceHours() : ov === 'open';
    }
  }

  const applications = take('আবেদন', applicationsR);
  if (applications) {
    pendingApps.clear();
    for (const app of applications) pendingApps.set(app.id, app);
    if (partial.riders) {
      const extras: Rider[] = [];
      for (const app of applications) {
        if (app.type !== 'rider' || partial.riders.some(r => r.id === app.id)) continue;
        extras.push({
          id: app.id, userId: app.profileId ?? `app:${app.id}`,
          name: app.name, nameBn: app.nameBn, mobile: app.mobile, email: app.email,
          areaId: app.areaId, vehicleType: app.vehicleType ?? 'bicycle',
          status: 'pending', totalDeliveries: 0, totalEarnings: 0, rating: 0,
          joinedAt: app.createdAt.slice(0, 10), pendingPayout: 0,
        });
      }
      if (extras.length) partial.riders = [...extras, ...partial.riders];
    }
    if (partial.affiliates) {
      const extras: Affiliate[] = [];
      for (const app of applications) {
        if (app.type !== 'affiliate' || partial.affiliates.some(a => a.id === app.id)) continue;
        let code = '';
        if (isUuid(app.profileId)) {
          const prof = await be.fetchProfileById(app.profileId);
          code = prof.data?.referralCode ?? '';
        }
        extras.push({
          id: app.id, userId: app.profileId ?? `app:${app.id}`,
          name: app.name, nameBn: app.nameBn, mobile: app.mobile, email: app.email,
          promoteNote: app.promoteNote, referralCode: code,
          status: 'pending', totalReferrals: 0, totalEarnings: 0, pendingPayout: 0,
          joinedAt: app.createdAt.slice(0, 10),
        });
      }
      if (extras.length) partial.affiliates = [...extras, ...partial.affiliates];
    }
  }

  // Session-scoped slices: my notifications + my saved addresses.
  const { data: authData } = await db.auth.getUser();
  const uid = authData.user?.id;
  if (uid) {
    const [notifR, addrR] = await Promise.all([
      be.fetchNotificationsForUser(uid), be.fetchAddressesForUser(uid),
    ]);
    const notifs = take('নোটিফিকেশন', notifR); if (notifs) partial.notifications = notifs;
    const addrs = take('ঠিকানা', addrR); if (addrs) partial.addresses = addrs;
  }

  rawDispatch({ type: 'HYDRATE', state: partial });
}

// ── Context ────────────────────────────────────────────────────
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Computed
  cartTotal: number;
  cartCount: number;
  cartDeliveryFee: number;
  /** Area fee before any pass / free-delivery-promo waiver. */
  cartDeliveryFeeRaw: number;
  /** Why the delivery fee is waived, if it is: active delivery
   * pass first, then a free-delivery promo. */
  cartFeeWaiver: 'pass' | 'promo' | null;
  cartDiscount: number;
  cartFinal: number;
  unreadCount: number;
  currentArea: DeliveryArea | undefined;
  // Helpers
  validatePromo: (code: string) => PromoCode | null;
  t: (key: string) => string;
  /** True when Supabase keys exist (backend mode). */
  isBackendMode: boolean;
  /** Last backend write-through failure (non-blocking; the
   *  local update always stands). Null in demo mode. */
  backendSyncError: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

function dayjsExpired(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

// ── Provider ───────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL);
  const [backendSyncError, setBackendSyncError] = useState<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const pendingAppsRef = useRef(new Map<string, be.ApplicationRecord>());

  const reportSyncError = useCallback<SyncFail>((label, e) => {
    const msg = e instanceof Error
      ? e.message
      : ((e as { message?: string } | null)?.message ?? String(e));
    console.error(`[Jovro backend sync] ${label} failed:`, e);
    setBackendSyncError(`${label}: ${msg}`);
  }, []);

  // The one dispatch the whole app uses: reducer first
  // (optimistic local update), then — configured mode only —
  // the write-through to Supabase.
  const dispatch = useCallback((action: Action) => {
    rawDispatch(action);
    if (!isSupabaseConfigured) return;
    if (action.type === 'LOGOUT') { void supabaseSignOut(); return; }
    void syncActionToBackend(action, stateRef.current, pendingAppsRef.current, reportSyncError);
  }, [reportSyncError]);

  // Hydrate from localStorage
  useEffect(() => {
    const deviceLocal: Partial<AppState> = {
      lang: lsGet<Lang>('jovro_lang', 'bn'),
      cart: lsGet<CartItem[]>('jovro_cart', []),
      favouriteProductIds: lsGet<string[]>('jovro_favs', []),
      selectedAreaId: lsGet<string>('jovro_area', 'area-01'),
    };
    if (isSupabaseConfigured) {
      // Backend mode: the session + shared collections come
      // from Supabase (auth subscription + backend hydration
      // below) — restoring demo slices or a stored demo user
      // here would resurrect stale local state.
      rawDispatch({ type: 'HYDRATE', state: deviceLocal });
      return;
    }
    const saved = lsGet<Partial<PersistedData> | null>(DATA_KEY, null);
    const hydrated: Partial<AppState> = {
      ...deviceLocal,
      role: lsGet<UserRole>('jovro_role', 'customer'),
      isLoggedIn: lsGet<boolean>('jovro_loggedIn', false),
      user: lsGet<User | null>('jovro_user', null),
    };
    if (saved) {
      if (saved.orders) hydrated.orders = saved.orders;
      if (saved.riders) hydrated.riders = saved.riders;
      if (saved.affiliates) hydrated.affiliates = saved.affiliates;
      if (saved.affiliateWaitlist) hydrated.affiliateWaitlist = saved.affiliateWaitlist;
      if (saved.staff) hydrated.staff = saved.staff;
      if (saved.problemReports) hydrated.problemReports = saved.problemReports;
      if (saved.reviews) hydrated.reviews = saved.reviews;
      if (saved.paymentRequests) hydrated.paymentRequests = saved.paymentRequests;
      if (saved.products) hydrated.products = saved.products;
      if (saved.areas) hydrated.areas = saved.areas;
      if (saved.activityLog) hydrated.activityLog = saved.activityLog;
      if (saved.restaurants) hydrated.restaurants = saved.restaurants;
      if (saved.promos) hydrated.promos = saved.promos;
      if (saved.adminSettings) hydrated.adminSettings = { ...DEFAULT_ADMIN_SETTINGS, ...saved.adminSettings };
      if (saved.notifications) hydrated.notifications = saved.notifications;
      if (saved.addresses) hydrated.addresses = saved.addresses;
      if (saved.appliedPromo !== undefined) hydrated.appliedPromo = saved.appliedPromo;
      if (saved.serviceOverride) hydrated.serviceOverride = saved.serviceOverride;
    }
    const override = hydrated.serviceOverride ?? 'auto';
    hydrated.isServiceOpen = override === 'auto' ? isWithinServiceHours() : override === 'open';
    if (hydrated.isLoggedIn && !hydrated.user && hydrated.role) {
      hydrated.user = DEMO_USERS[hydrated.role as UserRole] ?? DEMO_USERS.customer;
    }
    dispatch({ type: 'HYDRATE', state: hydrated });
  }, []);

  // Persist to localStorage
  useEffect(() => { lsSet('jovro_lang', state.lang); }, [state.lang]);
  useEffect(() => { lsSet('jovro_role', state.role); }, [state.role]);
  useEffect(() => { lsSet('jovro_loggedIn', state.isLoggedIn); }, [state.isLoggedIn]);
  useEffect(() => { lsSet('jovro_user', state.user); }, [state.user]);
  useEffect(() => { lsSet('jovro_cart', state.cart); }, [state.cart]);
  useEffect(() => { lsSet('jovro_favs', state.favouriteProductIds); }, [state.favouriteProductIds]);
  useEffect(() => { lsSet('jovro_area', state.selectedAreaId); }, [state.selectedAreaId]);
  useEffect(() => {
    const data: PersistedData = {
      orders: state.orders,
      riders: state.riders,
      affiliates: state.affiliates,
      affiliateWaitlist: state.affiliateWaitlist,
      staff: state.staff,
      problemReports: state.problemReports,
      reviews: state.reviews,
      paymentRequests: state.paymentRequests,
      products: state.products,
      areas: state.areas,
      activityLog: state.activityLog,
      restaurants: state.restaurants,
      promos: state.promos,
      adminSettings: state.adminSettings,
      notifications: state.notifications,
      addresses: state.addresses,
      appliedPromo: state.appliedPromo,
      serviceOverride: state.serviceOverride,
    };
    lsSet(DATA_KEY, data);
  }, [state.orders, state.riders, state.affiliates, state.affiliateWaitlist, state.staff, state.problemReports,
      state.reviews, state.paymentRequests, state.products, state.areas, state.activityLog,
      state.restaurants, state.promos, state.adminSettings, state.notifications,
      state.addresses, state.appliedPromo, state.serviceOverride]);

  // Re-derive the time-based open state while the app is open
  // (no-op whenever the admin override is engaged).
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'SERVICE_TICK' }), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Backend mode (Phase 3) ────────────────────────────────
  // Initial hydration from Supabase (public catalogue is
  // readable signed-out; the rest is RLS-scoped to the session).
  const hydrateBackend = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await hydrateFromBackend(rawDispatch, pendingAppsRef.current, reportSyncError);
  }, [reportSyncError]);

  useEffect(() => { void hydrateBackend(); }, [hydrateBackend]);

  // Session changes: the profile decides the session user +
  // role; signing in re-hydrates (RLS visibility changes with
  // the role), signing out drops back to the guest state.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    return onAuthChange(({ event, session, profile }) => {
      if (session && profile) {
        rawDispatch({ type: 'LOGIN', user: profileToUser(profile) });
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          void hydrateBackend();
        }
      } else if (!session) {
        rawDispatch({ type: 'LOGOUT' });
      }
    });
  }, [hydrateBackend]);

  // Realtime: merge other people's order / notification
  // changes into local state while signed in.
  useEffect(() => {
    if (!isSupabaseConfigured || !state.isLoggedIn) return;
    const unsubOrders = be.subscribeToOrders(order =>
      rawDispatch({ type: 'MERGE_ORDERS', orders: [order] }));
    const unsubNotifs = be.subscribeToNotifications(n =>
      rawDispatch({ type: 'MERGE_NOTIFICATIONS', notifications: [n] }));
    return () => { unsubOrders(); unsubNotifs(); };
  }, [state.isLoggedIn]);

  // Computed values
  const currentArea = state.areas.find(a => a.id === state.selectedAreaId);
  const cartDeliveryFeeRaw = currentArea?.fee ?? 20;

  const cartTotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Delivery-fee waiver: an active delivery pass waives the fee,
  // and so does a free-delivery promo (e.g. JOVROFREE). The fee
  // itself drops to 0 — item discounts stay separate.
  const cartFeeWaiver: 'pass' | 'promo' | null = state.user?.hasActivePass
    ? 'pass'
    : state.appliedPromo?.discountType === 'free-delivery'
      ? 'promo'
      : null;
  const cartDeliveryFee = cartFeeWaiver ? 0 : cartDeliveryFeeRaw;

  let cartDiscount = 0;
  if (state.appliedPromo) {
    const p = state.appliedPromo;
    if (p.discountType === 'flat') cartDiscount = p.discountValue;
    else if (p.discountType === 'free-delivery') cartDiscount = 0; // fee waived above
    else cartDiscount = Math.min(Math.floor(cartTotal * p.discountValue / 100), p.maxDiscount ?? Infinity);
  }

  const cartFinal = cartTotal + cartDeliveryFee - cartDiscount;
  // Customers only count their own notifications (+ global ones).
  const unreadCount = state.notifications.filter(n =>
    (!state.user || n.userId === state.user.id || n.userId === 'all') && !n.isRead,
  ).length;

  const validatePromo = useCallback((code: string): PromoCode | null => {
    const promo = state.promos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    if (!promo) return null;
    if (promo.expiresAt && dayjsExpired(promo.expiresAt)) return null;
    if (promo.usageLimit && (promo.usedCount ?? 0) >= promo.usageLimit) return null;
    if (cartTotal < promo.minOrder) return null;
    return promo;
  }, [cartTotal, state.promos]);

  const t = useT(state.lang);

  const value: AppContextType = useMemo(() => ({
    state, dispatch,
    cartTotal, cartCount, cartDeliveryFee, cartDeliveryFeeRaw, cartFeeWaiver, cartDiscount, cartFinal,
    unreadCount, currentArea, validatePromo, t,
    isBackendMode: isSupabaseConfigured,
    backendSyncError,
  }), [state, dispatch, cartTotal, cartCount, cartDeliveryFee, cartDeliveryFeeRaw, cartFeeWaiver, cartDiscount, cartFinal, unreadCount, currentArea, validatePromo, t, backendSyncError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
