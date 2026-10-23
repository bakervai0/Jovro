import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FullScreenLoader } from './components/layout/PageFrame';
import { CustomerBottomNav, RiderBottomNav } from './components/layout/BottomNav';

// ── Lazy imports ──────────────────────────────────────────────
const SplashScreen = lazy(() => import('./screens/auth/SplashScreen'));
const LanguageSelectScreen = lazy(() => import('./screens/auth/LanguageSelectScreen'));
const OnboardScreen = lazy(() => import('./screens/auth/OnboardScreen'));
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const SignUpScreen = lazy(() => import('./screens/auth/SignUpScreen'));
const OtpScreen = lazy(() => import('./screens/auth/OtpScreen'));
const ForgotPasswordScreen = lazy(() => import('./screens/auth/ForgotPasswordScreen'));
const SetPasswordScreen = lazy(() => import('./screens/auth/SetPasswordScreen'));
const AreaPickerScreen = lazy(() => import('./screens/auth/AreaPickerScreen'));

// Phase 2+ screens
const HomeScreen = lazy(() => import('./screens/customer/HomeScreen'));
const BazaarScreen = lazy(() => import('./screens/customer/BazaarScreen'));
const ProductDetailScreen = lazy(() => import('./screens/customer/ProductDetailScreen'));
const FoodScreen = lazy(() => import('./screens/customer/FoodScreen'));
const RestaurantMenuScreen = lazy(() => import('./screens/customer/RestaurantMenuScreen'));
const CartScreen = lazy(() => import('./screens/customer/CartScreen'));
const ProfileScreen = lazy(() => import('./screens/customer/ProfileScreen'));
const OrdersScreen = lazy(() => import('./screens/customer/OrdersScreen'));
const OrderDetailScreen = lazy(() => import('./screens/customer/OrderDetailScreen'));
const NotificationsScreen = lazy(() => import('./screens/customer/NotificationsScreen'));

// Phase 4 screens (AI, growth, info)
const AiScreen = lazy(() => import('./screens/customer/AiScreen'));
const AiBusyScreen = lazy(() => import('./screens/customer/AiBusyScreen'));
const ReportScreen = lazy(() => import('./screens/customer/ReportScreen'));
const ReferScreen = lazy(() => import('./screens/customer/ReferScreen'));
const SubscriptionScreen = lazy(() => import('./screens/customer/SubscriptionScreen'));
const AboutScreen = lazy(() => import('./screens/info/AboutScreen'));
const ContactScreen = lazy(() => import('./screens/info/ContactScreen'));
const FaqScreen = lazy(() => import('./screens/info/FaqScreen'));
const PrivacyScreen = lazy(() => import('./screens/info/PrivacyScreen'));
const TermsScreen = lazy(() => import('./screens/info/TermsScreen'));
const RefundPolicyScreen = lazy(() => import('./screens/info/RefundPolicyScreen'));
const DeliveryFeesScreen = lazy(() => import('./screens/info/DeliveryFeesScreen'));

const RiderHomeScreen = lazy(() => import('./screens/rider/RiderHomeScreen'));
const RiderOrderDetailScreen = lazy(() => import('./screens/rider/RiderOrderDetailScreen'));
const RiderHistoryScreen = lazy(() => import('./screens/rider/RiderHistoryScreen'));
const RiderEarningsScreen = lazy(() => import('./screens/rider/RiderEarningsScreen'));
const RiderProfileScreen = lazy(() => import('./screens/rider/RiderProfileScreen'));
const RiderPendingScreen = lazy(() => import('./screens/rider/RiderPendingScreen'));
const RiderBlockedScreen = lazy(() => import('./screens/rider/RiderPendingScreen').then(m => ({ default: m.RiderBlockedScreen })));
const RiderApplyScreen = lazy(() => import('./screens/rider/RiderApplyScreen'));
const AffiliateClosedScreen = lazy(() => import('./screens/affiliate/AffiliateClosedScreen'));
const AdminScreen = lazy(() => import('./screens/admin/AdminScreen'));
const AffiliateScreen = lazy(() => import('./screens/affiliate/AffiliateScreen'));
const StaffScreen = lazy(() => import('./screens/staff/StaffScreen'));

// ── Guards ─────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (state.isLoggedIn) {
    const routes: Record<string, string> = {
      customer: '/', rider: '/rider', affiliate: '/affiliate', staff: '/staff', admin: '/admin',
    };
    return <Navigate to={routes[state.role] ?? '/'} replace />;
  }
  return <>{children}</>;
}

// ── Customer layout ────────────────────────────────────────────
function CustomerLayout() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Outlet />
      <CustomerBottomNav />
    </div>
  );
}

// ── Rider layout ───────────────────────────────────────────────
function RiderLayout() {
  const { state } = useApp();
  // F3: a rider whose application is still pending sees the
  // approval notice instead of the dashboard. The rider record
  // is matched by the signed-in user's id (seeded demo rider
  // rider-01 stays active, so the dashboard stays demoable).
  // Only an ACTIVE record reaches the dashboard: rejected /
  // inactive / suspended riders — and rider-role users with no
  // record at all — get the blocked notice, never the portal.
  const myRider = state.riders.find(r => r.userId === state.user?.id);
  if (myRider?.status === 'pending') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <RiderPendingScreen />
      </div>
    );
  }
  if (!myRider || myRider.status !== 'active') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <RiderBlockedScreen status={myRider?.status} />
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Outlet />
      <RiderBottomNav />
    </div>
  );
}

// ── Fallback stub ──────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  const { state } = useApp();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
      <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">construction</span>
      <h2 className="text-headline-sm font-semibold text-on-surface-variant">{title}</h2>
      <p className="text-body-md text-on-surface-variant/60">
        {state.lang === 'bn' ? 'শীঘ্রই আসছে...' : 'Coming soon...'}
      </p>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Splash */}
        <Route path="/splash" element={<SplashScreen />} />

        {/* Guest-only */}
        <Route path="/lang" element={<GuestGuard><LanguageSelectScreen /></GuestGuard>} />
        <Route path="/onboard" element={<OnboardScreen />} />
        <Route path="/login" element={<GuestGuard><LoginScreen /></GuestGuard>} />
        <Route path="/otp-login" element={<OtpScreen />} />
        <Route path="/otp" element={<OtpScreen />} />
        <Route path="/signup" element={<GuestGuard><SignUpScreen /></GuestGuard>} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/set-password" element={<SetPasswordScreen />} />

        {/* Area picker (accessible always) */}
        <Route path="/area" element={<AreaPickerScreen />} />

        {/* Public info pages — guests must be able to open these
            from the SignUp / OTP screens (terms, privacy, help). */}
        <Route element={<CustomerLayout />}>
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/contact" element={<ContactScreen />} />
          <Route path="/faq" element={<FaqScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/terms" element={<TermsScreen />} />
          <Route path="/refund-policy" element={<RefundPolicyScreen />} />
        </Route>

        {/* Customer */}
        <Route element={<AuthGuard><CustomerLayout /></AuthGuard>}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/bazaar" element={<BazaarScreen />} />
          <Route path="/product/:id" element={<ProductDetailScreen />} />
          <Route path="/food" element={<FoodScreen />} />
          <Route path="/food/:id" element={<RestaurantMenuScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/orders/:id" element={<OrderDetailScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          {/* Phase 4 */}
          <Route path="/ai" element={<AiScreen />} />
          <Route path="/ai/busy" element={<AiBusyScreen />} />
          <Route path="/report" element={<ReportScreen />} />
          <Route path="/refer" element={<ReferScreen />} />
          <Route path="/subscription" element={<SubscriptionScreen />} />
          <Route path="/delivery-fees" element={<DeliveryFeesScreen />} />
          {/* Phase 5 — applications (F1 / I1) */}
          <Route path="/apply-rider" element={<RiderApplyScreen />} />
          {/* Affiliate programme is CLOSED at launch — the apply
              route shows the closed notice + email waitlist
              (AffiliateApplyScreen is kept for reopening). */}
          <Route path="/apply-affiliate" element={<AffiliateClosedScreen />} />
        </Route>

        {/* Rider */}
        <Route path="/rider" element={<AuthGuard><RiderLayout /></AuthGuard>}>
          <Route index element={<RiderHomeScreen />} />
          <Route path="orders/:id" element={<RiderOrderDetailScreen />} />
          <Route path="history" element={<RiderHistoryScreen />} />
          <Route path="earnings" element={<RiderEarningsScreen />} />
          <Route path="notifications" element={<NotificationsScreen />} />
          <Route path="profile" element={<RiderProfileScreen />} />
        </Route>

        {/* Admin/Affiliate/Staff – simple wrappers */}
        <Route path="/admin/*" element={<AuthGuard><AdminScreen /></AuthGuard>} />
        <Route path="/affiliate/*" element={<AuthGuard><AffiliateScreen /></AuthGuard>} />
        <Route path="/staff/*" element={<AuthGuard><StaffScreen /></AuthGuard>} />

        {/* Catch-all → splash */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </Suspense>
  );
}

// ── Offline banner (Stitch 14 · no-internet state) ────────────
// Slim global strip shown while the browser reports offline:
// wifi_off + offline-mode text + the auto-refresh promise and a
// manual re-check button. Placed orders stay safe (local state).
function OfflineBanner() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [offline, setOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="relative z-50 bg-[#7C2D12] text-white px-4 py-2 flex items-center gap-2.5 shadow-md">
      <span className="material-symbols-outlined text-[20px] shrink-0">wifi_off</span>
      <div className="flex-1 min-w-0">
        <p className="text-label-md font-label-md font-bold leading-tight">
          {bn ? 'ইন্টারনেট বিচ্ছিন্ন • অফলাইন মোড' : 'Offline Mode'}
          <span className="font-bilingual-sub font-normal opacity-80"> / Offline Mode</span>
        </p>
        <p className="text-[11px] opacity-85 leading-tight">
          {bn ? 'সংযোগ ফিরলে স্বয়ংক্রিয় রিফ্রেশ হবে (Auto-refresh on restore) • ক্যাশ/রাইডার সুরক্ষিত' : 'Auto-refresh on restore • Your placed orders are safe'}
        </p>
      </div>
      <button
        type="button" onClick={() => setOffline(!navigator.onLine)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/15 font-label-sm text-label-sm font-bold shrink-0 active:scale-95"
      >
        <span className="material-symbols-outlined text-[14px]">sync</span>
        {bn ? 'যাচাই' : 'Retry'}
      </button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-frame">
          <OfflineBanner />
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
