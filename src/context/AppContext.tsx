import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type {
  User, UserRole, Lang, CartItem, Order, AppNotification,
  SavedAddress, PromoCode
} from '../types';
import { DEMO_USERS, SAMPLE_ORDERS, SAMPLE_NOTIFICATIONS, SAMPLE_ADDRESSES, PROMO_CODES } from '../data/seed';
import { DELIVERY_AREAS } from '../data/areas';
import { useT } from '../i18n';

// ── State Shape ────────────────────────────────────────────────
interface AppState {
  // Session
  user: User | null;
  role: UserRole;
  lang: Lang;
  isLoggedIn: boolean;
  isServiceOpen: boolean;
  isSlotFull: boolean;
  // Cart
  cart: CartItem[];
  // Data
  orders: Order[];
  notifications: AppNotification[];
  addresses: SavedAddress[];
  favouriteProductIds: string[];
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
  | { type: 'HYDRATE'; state: Partial<AppState> };

// ── Helpers ────────────────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

const INITIAL: AppState = {
  user: null, role: 'customer', lang: 'bn', isLoggedIn: false,
  isServiceOpen: true, isSlotFull: false,
  cart: [], orders: SAMPLE_ORDERS,
  notifications: SAMPLE_NOTIFICATIONS,
  addresses: SAMPLE_ADDRESSES,
  favouriteProductIds: [],
  selectedAreaId: 'area-01',
  appliedPromo: null,
};

// ── Reducer ────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.state };
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
  currentArea: typeof DELIVERY_AREAS[0] | undefined;
  // Helpers
  validatePromo: (code: string) => PromoCode | null;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate from localStorage
  useEffect(() => {
    const hydrated: Partial<AppState> = {
      lang: lsGet<Lang>('jovro_lang', 'bn'),
      role: lsGet<UserRole>('jovro_role', 'customer'),
      isLoggedIn: lsGet<boolean>('jovro_loggedIn', false),
      user: lsGet<User | null>('jovro_user', null),
      cart: lsGet<CartItem[]>('jovro_cart', []),
      favouriteProductIds: lsGet<string[]>('jovro_favs', []),
      selectedAreaId: lsGet<string>('jovro_area', 'area-01'),
    };
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

  // Computed values
  const currentArea = DELIVERY_AREAS.find(a => a.id === state.selectedAreaId);
  const cartDeliveryFee = currentArea?.fee ?? 20;

  const cartTotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  let cartDiscount = 0;
  if (state.appliedPromo) {
    const p = state.appliedPromo;
    if (p.discountType === 'flat') cartDiscount = p.discountValue;
    else cartDiscount = Math.min(Math.floor(cartTotal * p.discountValue / 100), p.maxDiscount ?? Infinity);
  }

  const cartFinal = cartTotal + cartDeliveryFee - cartDiscount;
  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  const validatePromo = useCallback((code: string): PromoCode | null => {
    const promo = PROMO_CODES.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    if (!promo) return null;
    if (cartTotal < promo.minOrder) return null;
    return promo;
  }, [cartTotal]);

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
