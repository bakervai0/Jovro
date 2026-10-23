import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import OperatorTodayScreen from './OperatorTodayScreen';
import OperatorOrderDetailScreen from './OperatorOrderDetailScreen';
import DailySummaryScreen from './DailySummaryScreen';
import BuyingListScreen from './BuyingListScreen';

const TABS = [
  { path: '/staff', labelBn: 'আজকের অর্ডার', labelEn: 'Today', icon: 'receipt_long', exact: true, permission: 'orders' },
  { path: '/staff/buying', labelBn: 'বাজার লিস্ট', labelEn: 'Buying List', icon: 'shopping_basket', exact: false, permission: 'orders' },
  { path: '/staff/summary', labelBn: 'দিনের হিসাব', labelEn: 'Summary', icon: 'summarize', exact: false, permission: 'reports' },
  { path: '/staff/reports', labelBn: 'সমস্যা রিপোর্ট', labelEn: 'Problem Reports', icon: 'report', exact: false, permission: 'problem-reports' },
] as const;

function StaffProblemReports() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-2">
      {state.problemReports.map(r => (
        <div key={r.id} className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
          <div className="flex justify-between gap-2">
            <p className="font-semibold text-on-surface">{r.customerName}</p>
            <span className="text-label-sm bg-warning/10 text-warning px-2 py-0.5 rounded-full">{r.status}</span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">#{r.orderId} · {r.problemType}</p>
          <p className="text-body-sm text-on-surface mt-1">{bn ? r.descriptionBn : (r.descriptionEn ?? r.descriptionBn)}</p>
        </div>
      ))}
      {state.problemReports.length === 0 && <p className="text-center text-on-surface-variant py-8">{bn ? 'কোনো রিপোর্ট নেই' : 'No reports'}</p>}
    </div>
  );
}

/**
 * Operator section (Section G) — lives inside the staff routes.
 * The operator is Baker himself (staff/admin-lite): today's
 * orders, the merged bazaar buying list and the daily summary.
 */
export default function StaffScreen() {
  const { state } = useApp();
  const [demoStaffId, setDemoStaffId] = useState('staff-01');
  const demoStaff = state.staff.find(m => m.id === demoStaffId) ?? state.staff[0];
  const allowedTabs = TABS.filter(tab => demoStaff?.permissions.some(p => p === tab.permission || (tab.permission === 'problem-reports' && p === 'reports')));
  const firstAllowed = allowedTabs[0]?.path ?? '/staff';
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const bn = state.lang === 'bn';

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        title={bn ? 'অপারেটর প্যানেল' : 'Operator Panel'}
        subtitle={bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
      />
      {/* H23 demo staff selector — the dashboard is rebuilt from this member's permissions only */}
      <div className="px-4 py-2 bg-surface flex items-center gap-2 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">badge</span>
        <span className="text-label-md text-on-surface-variant">{bn ? 'ডেমো স্টাফ:' : 'Demo staff:'}</span>
        <select value={demoStaff?.id ?? ''} onChange={e => setDemoStaffId(e.target.value)} className="flex-1 bg-surface-container rounded-xl px-2 py-1.5 text-body-sm text-on-surface outline-none">
          {state.staff.map(m => <option key={m.id} value={m.id}>{bn ? m.nameBn : m.name} — {m.permissions.join(', ')}</option>)}
        </select>
      </div>
      {/* H23 restricted-view preview — design 3._staff_view_restricted_dashboard:
          the selected staff member's dashboard is rebuilt from their
          permissions only; sections without permission are fully absent. */}
      <div className="px-4 pt-3">
        <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold">
              {(bn ? demoStaff?.nameBn : demoStaff?.name)?.charAt(0) ?? 'স'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-bold text-on-surface">
                {bn ? `স্বাগতম, ${demoStaff?.nameBn ?? ''}` : `Welcome, ${demoStaff?.name ?? ''}`}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {bn ? 'অপারেশন স্টাফ • ডিউটি চালু • লালমনিরহাট সদর হাব' : 'Operations staff • On duty • Lalmonirhat Sadar Hub'}
              </p>
            </div>
            <span className="text-label-sm font-bold bg-tertiary/10 text-tertiary px-2 py-1 rounded-full">
              {bn ? 'স্টাফ ভিউ' : 'Staff View'}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{bn ? 'স্টাফ যেটা দেখবে / What Staff See' : 'What Staff See'}</span>
            {' — '}
            {bn
              ? `এই স্টাফের কেবল “${(demoStaff?.permissions ?? []).join('”, “')}” অনুমতি আছে। বাকি সেকশনগুলো (প্রোডাক্ট, রাইডার পে-আউট, রিপোর্ট, সেটিংস) কোনো ত্রুটি ছাড়াই ড্যাশবোর্ড থেকে সম্পূর্ণ অনুপস্থিত।`
              : `This staff member only has “${(demoStaff?.permissions ?? []).join('”, “')}” permission. All other sections are completely absent from the dashboard — no errors.`}
          </p>
          <p className="text-label-md text-on-surface-variant">
            {bn ? 'অনুমোদিত ড্যাশবোর্ড মডিউল' : 'Authorised dashboard modules'} ({allowedTabs.length}{bn ? 'টি সক্রিয়' : ' active'}):{' '}
            <b className="text-on-surface">{allowedTabs.map(t => bn ? t.labelBn : t.labelEn).join(' · ') || (bn ? 'কিছুই না' : 'none')}</b>
          </p>
          {!demoStaff?.permissions.includes('refunds') && (
            <p className="text-label-md text-on-surface-variant flex items-start gap-1.5 bg-surface-container rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5">lock</span>
              {bn
                ? 'সীমাবদ্ধ অ্যাক্সেস: অনুমতি নেই এমন ফিচারগুলো যেমন প্রোডাক্ট দাম পরিবর্তন, রিফান্ড অনুমোদন ও আর্থিক খতিয়ান এখানে সম্পূর্ণ লুকানো রয়েছে।'
                : 'Restricted access: features without permission — product price changes, refund approvals and financial ledgers — are fully hidden here.'}
            </p>
          )}
        </div>
      </div>
      {/* Section tabs */}
      <div className="flex gap-2 px-4 py-2.5 bg-surface border-b border-outline-variant/30 overflow-x-auto no-scrollbar">
        {allowedTabs.map(tab => {
          const active = tab.exact ? pathname === tab.path : pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-label-md font-semibold whitespace-nowrap border transition-all flex-shrink-0',
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              {bn ? tab.labelBn : tab.labelEn}
            </button>
          );
        })}
      </div>

      <Routes>
        <Route index element={demoStaff?.permissions.includes('orders') ? <OperatorTodayScreen /> : <Navigate to={firstAllowed} replace />} />
        <Route path="orders/:id" element={<OperatorOrderDetailScreen />} />
        <Route path="buying" element={demoStaff?.permissions.includes('orders') ? <BuyingListScreen /> : <Navigate to={firstAllowed} replace />} />
        <Route path="summary" element={demoStaff?.permissions.includes('reports') ? <DailySummaryScreen /> : <Navigate to={firstAllowed} replace />} />
        <Route path="reports" element={demoStaff?.permissions.some(p => p === 'problem-reports' || p === 'reports') ? <StaffProblemReports /> : <Navigate to={firstAllowed} replace />} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>

      <div className="px-4 pb-4">
        <DemoRoleSwitcher />
      </div>
    </div>
  );
}
