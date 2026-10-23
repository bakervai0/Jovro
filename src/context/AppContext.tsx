import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type {
  User, UserRole, Lang, CartItem, Order, AppNotification,
  SavedAddress, PromoCode, Rider, Affiliate, StaffMember,
  ProblemReport, Review, PaymentRequest, Product, DeliveryArea,
  ActivityLogEntry, Restaurant, AdminSettings
} from '../types';
import {
  DEMO_USERS, SAMPLE_ORDERS, SAMPLE_NOTIFICATIONS, SAMPLE_ADDRESSES, PROMO_CODES,
  SAMPLE_RIDERS, SAMPLE_AFFILIATES, SAMPLE_STAFF, SAMPLE_PROBLEM_REPORTS,
  SAMPLE_REVIEWS, SAMPLE_PAYMENT_REQUESTS, ACTIVITY_LOG_SEED, DEFAULT_ADMIN_SETTINGS
} from '../data/seed';
import { DELIVERY_AREAS } from '../data/areas';
import { PRODUCTS } from '../data/products';
import { RESTAURANTS } from '../data/restaurants';
import { useT } from '../i18n';

// ── State Shape ────────────────────────────────────────────────
interface AppState {
  // Session
  user: User | null;
  role: UserRole;
  lang: Lang;
  isLoggedIn: boolean;
  /** true once localStorage has been read — guards must wait for it. */
  hydrated: boolean;
  isServiceOpen: boolean;
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
  | { type: 'TOGGLE_SLOT' }
  | { type: 'UPDATE_PROFILE'; user: User }
  // Phase 5 shared collections
  | { type: 'ADD_RIDER'; rider: Rider }
  | { type: 'UPDATE_RIDER'; rider: Rider }
  | { type: 'ADD_AFFILIATE'; affiliate: Affiliate }
  | { type: 'UPDATE_AFFILIATE'; affiliate: Affiliate }
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
  | { type: 'HYDRATE'; state: Partial<AppState> };

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
  addresses: SavedAddress[];
  riders: Rider[];
  affiliates: Affiliate[];
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
  isServiceOpen: boolean;
  isSlotFull: boolean;
}

const INITIAL: AppState = {
  user: null, role: 'customer', lang: 'bn', isLoggedIn: false, hydrated: false,
  isServiceOpen: true, isSlotFull: false,
  cart: [], orders: SAMPLE_ORDERS,
  notifications: SAMPLE_NOTIFICATIONS,
  addresses: SAMPLE_ADDRESSES,
  favouriteProductIds: [],
  riders: SAMPLE_RIDERS,
  affiliates: SAMPLE_AFFILIATES,
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
    case 'HYDRATE': return { ...state, ...action.state, hydrated: true };
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
      const existing = state.cart.find(i => i.id === action.item.id);
      if (existing) {
        return { ...state, cart: state.cart.map(i => i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...state, cart: [...state.cart, action.item] };
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
    case 'MARK_ALL_READ': return { ...state, notifications: state.notifications.map(n => ({ ...n, isRead: true })) };

    case 'ADD_ADDRESS': return { ...state, addresses: [...state.addresses, action.address] };
    case 'UPDATE_ADDRESS': return { ...state, addresses: state.addresses.map(a => a.id === action.address.id ? action.address : a) };
    case 'DELETE_ADDRESS': return { ...state, addresses: state.addresses.filter(a => a.id !== action.id) };

    case 'TOGGLE_FAVOURITE': {
      const favs = state.favouriteProductIds;
      return { ...state, favouriteProductIds: favs.includes(action.productId) ? favs.filter(id => id !== action.productId) : [...favs, action.productId] };
    }
    case 'TOGGLE_SERVICE': return { ...state, isServiceOpen: !state.isServiceOpen };
    case 'TOGGLE_SLOT': return { ...state, isSlotFull: !state.isSlotFull };

    // Phase 5 shared collections
    case 'ADD_RIDER': return { ...state, riders: [action.rider, ...state.riders] };
    case 'UPDATE_RIDER': return { ...state, riders: state.riders.map(r => r.id === action.rider.id ? action.rider : r) };
    case 'ADD_AFFILIATE': return { ...state, affiliates: [action.affiliate, ...state.affiliates] };
    case 'UPDATE_AFFILIATE': return { ...state, affiliates: state.affiliates.map(a => a.id === action.affiliate.id ? action.affiliate : a) };
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

// ── Context ────────────────────────────────────────────────────
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Computed
  cartTotal: number;
  cartCount: number;
  cartDeliveryFee: number;
  cartDiscount: number;
  cartFinal: number;
  unreadCount: number;
  currentArea: DeliveryArea | undefined;
  // Helpers
  validatePromo: (code: string) => PromoCode | null;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

function dayjsExpired(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

// ── Provider ───────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = lsGet<Partial<PersistedData> | null>(DATA_KEY, null);
    const hydrated: Partial<AppState> = {
      lang: lsGet<Lang>('jovro_lang', 'bn'),
      role: lsGet<UserRole>('jovro_role', 'customer'),
      isLoggedIn: lsGet<boolean>('jovro_loggedIn', false),
      user: lsGet<User | null>('jovro_user', null),
      cart: lsGet<CartItem[]>('jovro_cart', []),
      favouriteProductIds: lsGet<string[]>('jovro_favs', []),
      selectedAreaId: lsGet<string>('jovro_area', 'area-01'),
    };
    if (saved) {
      if (saved.orders) hydrated.orders = saved.orders;
      if (saved.addresses) hydrated.addresses = saved.addresses;
      if (saved.riders) hydrated.riders = saved.riders;
      if (saved.affiliates) hydrated.affiliates = saved.affiliates;
      if (saved.staff) hydrated.staff = saved.staff;
      if (saved.problemReports) hydrated.problemReports = saved.problemReports;
      if (saved.reviews) hydrated.reviews = saved.reviews;
      if (saved.paymentRequests) hydrated.paymentRequests = saved.paymentRequests;
      if (saved.products) hydrated.products = saved.products;
      if (saved.areas) hydrated.areas = saved.areas;
      if (saved.activityLog) hydrated.activityLog = saved.activityLog;
      if (saved.restaurants) hydrated.restaurants = saved.restaurants;
      if (saved.promos) hydrated.promos = saved.promos;
      if (saved.adminSettings) hydrated.adminSettings = saved.adminSettings;
      if (saved.notifications) hydrated.notifications = saved.notifications;
      if (typeof saved.isServiceOpen === 'boolean') hydrated.isServiceOpen = saved.isServiceOpen;
      if (typeof saved.isSlotFull === 'boolean') hydrated.isSlotFull = saved.isSlotFull;
    }
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
      addresses: state.addresses,
      riders: state.riders,
      affiliates: state.affiliates,
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
      isServiceOpen: state.isServiceOpen,
      isSlotFull: state.isSlotFull,
    };
    lsSet(DATA_KEY, data);
  }, [state.orders, state.addresses, state.riders, state.affiliates, state.staff, state.problemReports,
      state.reviews, state.paymentRequests, state.products, state.areas, state.activityLog,
      state.restaurants, state.promos, state.adminSettings, state.notifications,
      state.isServiceOpen, state.isSlotFull]);

  // Computed values
  const currentArea = state.areas.find(a => a.id === state.selectedAreaId);
  const cartDeliveryFee = currentArea?.fee ?? 20;

  const cartTotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  let cartDiscount = 0;
  if (state.appliedPromo) {
    const p = state.appliedPromo;
    if (p.discountType === 'flat') cartDiscount = p.discountValue;
    else if (p.discountType === 'free-delivery') cartDiscount = cartDeliveryFee;
    else cartDiscount = Math.min(Math.floor(cartTotal * p.discountValue / 100), p.maxDiscount ?? Infinity);
  }

  const cartFinal = cartTotal + cartDeliveryFee - cartDiscount;
  const unreadCount = state.notifications.filter(n => !n.isRead).length;

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
    cartTotal, cartCount, cartDeliveryFee, cartDiscount, cartFinal,
    unreadCount, currentArea, validatePromo, t,
  }), [state, cartTotal, cartCount, cartDeliveryFee, cartDiscount, cartFinal, unreadCount, currentArea, validatePromo, t]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
