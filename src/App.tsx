import React, { Suspense, lazy } from 'react';
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

// Phase 2+ screens (stubs for now)
const HomeScreen = lazy(() => import('./screens/customer/HomeScreen'));
const BazaarScreen = lazy(() => import('./screens/customer/BazaarScreen'));
const FoodScreen = lazy(() => import('./screens/customer/FoodScreen'));
const CartScreen = lazy(() => import('./screens/customer/CartScreen'));
const ProfileScreen = lazy(() => import('./screens/customer/ProfileScreen'));
const OrdersScreen = lazy(() => import('./screens/customer/OrdersScreen'));
const OrderDetailScreen = lazy(() => import('./screens/customer/OrderDetailScreen'));
const NotificationsScreen = lazy(() => import('./screens/customer/NotificationsScreen'));

const RiderHomeScreen = lazy(() => import('./screens/rider/RiderHomeScreen'));
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

        {/* Customer */}
        <Route element={<AuthGuard><CustomerLayout /></AuthGuard>}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/bazaar" element={<BazaarScreen />} />
          <Route path="/food" element={<FoodScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/orders/:id" element={<OrderDetailScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
        </Route>

        {/* Rider */}
        <Route path="/rider" element={<AuthGuard><RiderLayout /></AuthGuard>}>
          <Route index element={<RiderHomeScreen />} />
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

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-frame">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
