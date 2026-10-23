import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { StaffMember, StaffPermission } from '../../types';
import { DEMO_USERS } from '../../data/seed';
import {
  AdminCard, Avatar, Field, Icon, PageTitle, fmtDate, fmtTime, inputCls, logAction,
  toBnDigits, useActorName, useBn,
} from './adminShared';
import { uid } from '../../services/orderUtils';
import { TRACKING_MESSAGES } from '../../services/orders';

export const PERMISSION_LABELS: Record<string, { bn: string; en: string }> = {
  orders: { bn: 'অর্ডার', en: 'Orders' },
  'rider-assignment': { bn: 'রাইডার নিয়োগ', en: 'Rider Assignment' },
  products: { bn: 'প্রোডাক্ট', en: 'Products' },
  'problem-reports': { bn: 'সমস্যার রিপোর্ট', en: 'Problem Reports' },
  refunds: { bn: 'রিফান্ড', en: 'Refunds' },
  'riders-affiliates': { bn: 'রাইডার ও অ্যাফিলিয়েট', en: 'Riders & Affiliates' },
  reports: { bn: 'রিপোর্ট', en: 'Reports' },
  settings: { bn: 'সেটিংস', en: 'Settings' },
  riders: { bn: 'রাইডার', en: 'Riders' },
  customers: { bn: 'কাস্টমার', en: 'Customers' },
  promotions: { bn: 'প্রমোশন', en: 'Promotions' },
};

// H21 — Staff list. The OWNER row comes from DEMO_USERS.admin
// (Shusmita Rani) badged "মালিক / Owner — সব অনুমতি" with no
// edit/remove; staff rows follow state.staff with status,
// contact, last active and permission chips.
export function AdminStaffList() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const owner = DEMO_USERS.admin;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="badge"
        titleBn="স্টাফ পারমিশন ও অ্যাক্সেস"
        titleEn="Staff Access"
        subBn="Add / Edit Staff Access · Lalmonirhat Hub"
        subEn="Add / Edit Staff Access · Lalmonirhat Hub"
        right={
          <button onClick={() => navigate('/admin/staff/new')} className="inline-flex items-center gap-1 bg-primary text-white text-label-md font-bold rounded-full px-3 py-2">
            <Icon name="add" className="text-[16px]" />{bn ? '+ স্টাফ যোগ করুন' : 'Add Staff'}
          </button>
        }
      />

      {/* OWNER row — no edit/remove */}
      <AdminCard className="border-primary/40 bg-primary/5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body-lg">
            {(bn ? owner.nameBn : owner.name).charAt(0)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-bold text-on-surface">{bn ? owner.nameBn : owner.name}</p>
            <p className="text-label-sm text-on-surface-variant">{toBnDigits(owner.mobile, lang)} · {bn ? 'মালিক ও প্রধান অপারেটর' : 'Owner & chief operator'}</p>
          </div>
          <span className="text-label-sm font-bold bg-primary text-white px-2.5 py-1 rounded-full inline-flex items-center gap-1">
            <Icon name="shield_person" className="text-[14px]" />{bn ? 'মালিক / Owner — সব অনুমতি' : 'Owner — all permissions'}
          </span>
        </div>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-2.5">
          <Icon name="lock" className="text-[14px]" />{bn ? 'মালিকের অ্যাক্সেস বদলানো বা সরানো যায় না' : "The owner's access cannot be edited or removed"}
        </p>
      </AdminCard>

      <div className="flex flex-col gap-3">
        {state.staff.map(m => (
          <AdminCard key={m.id}>
            <div className="flex items-center gap-3">
              <Avatar name={bn ? m.nameBn : m.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? m.nameBn : m.name}</p>
                <p className="text-label-sm text-on-surface-variant truncate">{m.email} · {toBnDigits(m.mobile, lang)}</p>
              </div>
              <span className={clsx('text-label-sm font-bold px-2 py-0.5 rounded-full', m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-error/12 text-error')}>
                {m.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'বন্ধ' : 'Off')}
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant mt-2">
              {bn ? 'শেষ সক্রিয়:' : 'Last active:'} {fmtDate(m.lastActive, lang)} · {fmtTime(m.lastActive, lang)}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {m.permissions.map(p => (
                <span key={p} className="text-label-sm font-medium bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant">
                  {bn ? (PERMISSION_LABELS[p]?.bn ?? p) : (PERMISSION_LABELS[p]?.en ?? p)}
                </span>
              ))}
              {m.permissions.length === 0 && (
                <span className="text-label-sm text-error">{bn ? 'কোনো অনুমতি নেই' : 'No permissions'}</span>
              )}
            </div>
            <button
              onClick={() => navigate(`/admin/staff/${m.id}/edit`)}
              className="mt-3 inline-flex items-center gap-1.5 text-label-md font-bold text-primary"
            >
              <Icon name="edit" className="text-[15px]" />{bn ? 'অ্যাক্সেস সম্পাদনা' : 'Edit access'}
            </button>
          </AdminCard>
        ))}
        {state.staff.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-6">{bn ? 'কোনো স্টাফ নেই' : 'No staff yet'}</p>
        )}
      </div>

      <button
        onClick={() => navigate('/admin/staff/new')}
        className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2"
      >
        <Icon name="person_add" className="text-[19px]" />{bn ? '+ স্টাফ যোগ করুন' : 'Add Staff'}
      </button>
    </div>
  );
}

// H22 — Add / Edit staff form. Built from design
// 2._add_edit_staff_permissions_jovro: identity card (name,
// login email with the "এই ইমেইল দিয়ে লগইন করলে অনুমতি
// সক্রিয় হবে" note, mobile), the permission checklist with
// one-line explanations and Active/বন্ধ states, the Refunds
// orange warning, the locked Settings row (owner only), Save &
// Grant Access, and (edit) Remove Access + confirmation.
const CHECKLIST: {
  id: StaffPermission; icon: string;
  titleBn: string; titleEn: string; explBn: string; explEn: string;
}[] = [
  { id: 'orders', icon: 'receipt_long', titleBn: 'অর্ডার দেখা ও চালানো', titleEn: 'Orders', explBn: 'View & manage daily orders (বাজার, রেস্টুরেন্ট ও খাবার অর্ডার পরিচালনা)', explEn: 'View & manage daily orders (bazaar, restaurant & food orders)' },
  { id: 'rider-assignment', icon: 'two_wheeler', titleBn: 'রাইডার নিয়োগ', titleEn: 'Rider Assignment', explBn: 'রাইডারদের অর্ডারে অ্যাসাইন করা ও স্থিতি পরিবর্তন', explEn: 'Assign riders to orders and change their status' },
  { id: 'products', icon: 'inventory_2', titleBn: 'প্রোডাক্ট যোগ ও বদল', titleEn: 'Products', explBn: 'প্রোডাক্ট ও রেস্টুরেন্ট মেনু আইটেম তৈরি ও দাম আপডেট', explEn: 'Create products & menu items, update prices' },
  { id: 'problem-reports', icon: 'report_problem', titleBn: 'সমস্যার রিপোর্ট', titleEn: 'Problem Reports', explBn: 'কাস্টমারের অভিযোগ ও মিসিং আইটেমের সমাধান করা', explEn: 'Resolve customer complaints & missing items' },
  { id: 'refunds', icon: 'currency_exchange', titleBn: 'রিফান্ড দেওয়া', titleEn: 'Issue Refunds', explBn: 'কাস্টমারকে সরাসরি বিকাশ/নগদে ক্ষতিপূরণ প্রদান', explEn: 'Compensate customers directly via bKash/Nagad' },
  { id: 'riders-affiliates', icon: 'groups', titleBn: 'রাইডার ও অ্যাফিলিয়েট', titleEn: 'Riders & Affiliates', explBn: 'রাইডার ও প্রমোটারদের পে-আউট ও অনুমোদন', explEn: 'Rider & promoter payouts and approvals' },
  { id: 'reports', icon: 'analytics', titleBn: 'রিপোর্ট দেখা', titleEn: 'Reports', explBn: 'আজকের খতিয়ান ও হিসাব দেখা (শুধু দেখার অনুমতি / View only)', explEn: "View today's ledger & accounts (view only)" },
];

export function AdminStaffForm() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const actor = useActorName();
  const existing = id ? state.staff.find(m => m.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [mobile, setMobile] = useState(existing?.mobile ?? '');
  const [permissions, setPermissions] = useState<StaffPermission[]>(existing?.permissions ?? ['orders']);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const togglePerm = (p: StaffPermission) =>
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const save = () => {
    if (!name.trim() || !email.trim() || !mobile.trim()) return;
    const member: StaffMember = existing
      ? { ...existing, name: name.trim(), email: email.trim(), mobile: mobile.trim(), permissions, isActive: true }
      : {
          id: uid('staff'), name: name.trim(), nameBn: name.trim(), email: email.trim(),
          mobile: mobile.trim(), permissions, isActive: true,
          addedAt: new Date().toISOString().slice(0, 10), lastActive: new Date().toISOString(),
        };
    dispatch({ type: existing ? 'UPDATE_STAFF' : 'ADD_STAFF', member });
    logAction(dispatch, actor, existing ? `স্টাফ অ্যাক্সেস বদল করেছেন: ${member.name}` : `নতুন স্টাফ যোগ করেছেন: ${member.name} (${member.email})`, 'general');
    navigate('/admin/staff');
  };

  const removeAccess = () => {
    if (!existing) return;
    dispatch({ type: 'UPDATE_STAFF', member: { ...existing, isActive: false, permissions: [] } });
    logAction(dispatch, actor, `স্টাফ অ্যাক্সেস বন্ধ করেছেন: ${existing.name} (${existing.email})`, 'general');
    navigate('/admin/staff');
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/staff')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'স্টাফ তালিকা' : 'Staff list'}
      </button>
      <PageTitle
        icon="badge"
        titleBn="স্টাফ পারমিশন ও অ্যাক্সেস"
        titleEn="Add / Edit Staff Access"
        right={existing?.isActive ? <span className="text-label-sm font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{bn ? 'সক্রিয় কর্মী' : 'Active staff'}</span> : undefined}
      />

      {/* Identity — design 2 */}
      <AdminCard className="flex flex-col gap-4">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="badge" className="text-primary text-[20px]" />
          {bn ? 'ব্যক্তিগত পরিচয় ও লগইন' : 'Identity & Login'}
          <span className="text-label-sm font-normal text-on-surface-variant">Lalmonirhat Hub</span>
        </p>
        <Field labelBn="স্টাফের নাম / Name" labelEn="Name" required>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: রাকিব হাসান' : 'e.g. Rakib Hasan'} />
        </Field>
        <Field labelBn="লগইন ইমেইল / Login Email" labelEn="Login Email" required>
          <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="staff@jovro.com" />
          <span className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
            <Icon name="info" className="text-[13px]" />{bn ? 'এই ইমেইল দিয়ে লগইন করলে অনুমতি সক্রিয় হবে' : 'Permissions activate when they log in with this email'}
          </span>
        </Field>
        <Field labelBn="মোবাইল নম্বর / Mobile Number" labelEn="Mobile Number" required>
          <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
            <span className="text-body-md font-semibold text-on-surface-variant">+৮৮</span>
            <input value={mobile} onChange={e => setMobile(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-body-md text-on-surface min-w-0" placeholder="01XXXXXXXXX" />
          </div>
        </Field>
      </AdminCard>

      {/* Permission checklist — design 2 */}
      <AdminCard className="flex flex-col gap-1">
        <div className="flex items-center justify-between pb-2">
          <p className="text-label-lg font-bold text-on-surface">
            {bn ? 'কোন কোন অংশ দেখতে ও বদলাতে পারবে' : 'What they can see & change'}
            <span className="block text-label-sm font-normal text-on-surface-variant">Permission Checklist & Role Delegation</span>
          </p>
          <span className="text-label-md font-bold text-primary bg-primary/10 rounded-full px-2 py-1">
            {toBnDigits(permissions.length, state.lang)}/৮ {bn ? 'সক্রিয়' : 'active'}
          </span>
        </div>
        {CHECKLIST.map(item => {
          const on = permissions.includes(item.id);
          return (
            <div key={item.id} className={clsx('py-3 border-b border-outline-variant/25 last:border-0', item.id === 'refunds' && 'rounded-xl px-2 -mx-2 bg-orange-50 border border-secondary/30')}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <Icon name={item.icon} className="text-on-surface-variant text-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">
                    {bn ? `${item.titleBn} / ${item.titleEn}` : `${item.titleEn} / ${item.titleBn}`}
                    <span className={clsx('ml-2 text-label-sm font-bold', on ? 'text-emerald-700' : 'text-on-surface-variant')}>
                      {item.id === 'refunds' ? (on ? 'Active' : 'OFF') : (on ? 'Active' : (bn ? 'বন্ধ' : 'Off'))}
                    </span>
                  </p>
                  <p className="text-label-md text-on-surface-variant mt-0.5">{bn ? item.explBn : item.explEn}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  onClick={() => togglePerm(item.id)}
                  className={clsx('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', on ? 'bg-primary' : 'bg-surface-container-highest')}
                >
                  <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </div>
              {item.id === 'refunds' && (
                <p className="text-label-md font-semibold text-secondary mt-2 flex items-center gap-1">
                  ⚠️ {bn ? 'সংবেদনশীল — শুধু সবচেয়ে বিশ্বস্ত স্টাফকে দিন (Sensitive — trusted staff only)' : 'Sensitive — trusted staff only'}
                </p>
              )}
            </div>
          );
        })}
        {/* Locked settings row — design 2 */}
        <div className="py-3 flex items-center gap-3 opacity-70">
          <span className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
            <Icon name="lock" className="text-on-surface-variant text-[18px]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-on-surface">
              {bn ? 'সিস্টেম সেটিংস ও স্টাফ অ্যাক্সেস / Settings' : 'Settings / সিস্টেম সেটিংস'}
              <span className="ml-2 text-label-sm font-bold text-on-surface-variant">{bn ? 'লক করা' : 'Locked'}</span>
            </p>
            <p className="text-label-md text-on-surface-variant mt-0.5">🔒 {bn ? 'শুধু মূল মালিকের জন্য সংরক্ষিত (Owner Only)' : 'Reserved for the owner only'}</p>
          </div>
          <span className="relative w-11 h-6 rounded-full bg-surface-container-highest flex-shrink-0 opacity-60">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
          </span>
        </div>
      </AdminCard>

      <button onClick={save} disabled={!name.trim() || !email.trim() || !mobile.trim()} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
        <Icon name="how_to_reg" className="text-[19px]" />{bn ? 'অ্যাক্সেস সংরক্ষণ করুন / Save & Grant Access' : 'Save & Grant Access'}
      </button>

      {existing && !confirmRemove && (
        <button onClick={() => setConfirmRemove(true)} className="w-full h-11 rounded-2xl border-2 border-error/50 text-error text-label-lg font-bold inline-flex items-center justify-center gap-2">
          <Icon name="person_remove" className="text-[18px]" />{bn ? 'অ্যাক্সেস বাতিল করুন / Remove Access' : 'Remove Access'}
        </button>
      )}
      {existing && confirmRemove && (
        <div className="rounded-2xl border-2 border-error/40 bg-red-50 p-4">
          <p className="text-body-md font-bold text-on-surface flex items-center gap-2">
            <Icon name="warning" className="text-error" />{bn ? 'স্টাফ অ্যাক্সেস বন্ধ করতে চান?' : 'Revoke Administrative Privileges'}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {existing.name} ({existing.email}){bn ? '-এর সব অ্যাক্সেস কেড়ে নেওয়া হবে। এই স্টাফ আর অ্যাডমিন ড্যাশবোর্ডে ঢুকতে পারবে না।' : ' will lose all access and can no longer open the admin dashboard.'}
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={removeAccess} className="flex-1 h-11 rounded-xl bg-error text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
              <Icon name="delete_forever" className="text-[17px]" />{bn ? 'হ্যাঁ, অ্যাক্সেস বন্ধ করুন / Yes, Remove' : 'Yes, Remove'}
            </button>
            <button onClick={() => setConfirmRemove(false)} className="flex-1 h-11 rounded-xl border-2 border-outline-variant text-label-md font-bold">
              {bn ? 'না, ফিরে যান / Cancel' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// H24 — Team activity log. Built from design
// 4._team_activity_log_jovro: filter chips (সবাই / রিফান্ড /
// অর্ডার ও রাইডার / প্রোডাক্ট ও মেনু) with counts, hub summary
// strip, actor cards (avatar, name, role chip, action, time)
// and the audit security footer.
type LogFilter = 'all' | 'refund' | 'order' | 'products';

export function AdminActivity() {
  const { state } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const [filter, setFilter] = useState<LogFilter>('all');

  const counts = useMemo(() => ({
    all: state.activityLog.length,
    refund: state.activityLog.filter(e => e.category === 'refund').length,
    order: state.activityLog.filter(e => e.category === 'order').length,
    products: state.activityLog.filter(e => /পণ্য|মেনু|প্রোডাক্ট/.test(e.action)).length,
  }), [state.activityLog]);

  const filtered = useMemo(() => {
    if (filter === 'refund') return state.activityLog.filter(e => e.category === 'refund');
    if (filter === 'order') return state.activityLog.filter(e => e.category === 'order');
    if (filter === 'products') return state.activityLog.filter(e => /পণ্য|মেনু|প্রোডাক্ট/.test(e.action));
    return state.activityLog;
  }, [state.activityLog, filter]);

  const chips: { id: LogFilter; bn: string; en: string }[] = [
    { id: 'all', bn: `সবাই / All (${toBnDigits(counts.all, lang)})`, en: `All (${counts.all})` },
    { id: 'refund', bn: `রিফান্ড / Refunds (${toBnDigits(counts.refund, lang)})`, en: `Refunds (${counts.refund})` },
    { id: 'order', bn: `অর্ডার ও রাইডার / Orders (${toBnDigits(counts.order, lang)})`, en: `Orders (${counts.order})` },
    { id: 'products', bn: `প্রোডাক্ট ও মেনু / Products (${toBnDigits(counts.products, lang)})`, en: `Products (${counts.products})` },
  ];
  const ownerBn = DEMO_USERS.admin.nameBn;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="groups"
        titleBn="টিম অ্যাক্টিভিটি লগ"
        titleEn="Team Activity Log"
        subBn="লাইভ অডিট · Audit Trail • কে কী করলো"
        subEn="Live Audit · Audit Trail • Who did what"
        right={<span className="text-on-surface-variant"><Icon name="tune" className="text-[20px]" /></span>}
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0',
              filter === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            {bn ? c.bn : c.en}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-primary/8 border border-primary/25 px-4 py-2.5 flex items-center gap-2 text-label-md text-on-surface">
        <Icon name="verified" className="text-primary text-[18px]" />
        <span className="flex-1">{bn ? 'লালমনিরহাট সদর হাব' : 'Lalmonirhat Sadar Hub'} • {bn ? 'আজ মোট কর্মতৎপরতা:' : 'Total activity:'} <b>{toBnDigits(state.activityLog.length, lang)}{bn ? 'টি' : ''}</b></span>
        <span className="text-on-surface-variant">Auto-sync 30s</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.map(e => {
          const isOwner = e.actorName === ownerBn || e.actorName === DEMO_USERS.admin.name;
          return (
            <AdminCard key={e.id}>
              <div className="flex items-start gap-3">
                <span className={clsx('w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0',
                  isOwner ? 'bg-secondary/15 text-secondary' : 'bg-primary/12 text-primary')}>
                  {e.actorName.trim().charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface">
                    {e.actorName}
                    <span className={clsx('ml-2 text-label-sm font-bold px-2 py-0.5 rounded-full', isOwner ? 'bg-secondary/15 text-secondary' : 'bg-surface-container text-on-surface-variant')}>
                      {isOwner ? (bn ? 'মালিক / Owner' : 'Owner') : (bn ? 'স্টাফ' : 'Staff')}
                    </span>
                    {e.category && (
                      <span className="ml-1.5 text-label-sm font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {e.category === 'refund' ? (bn ? 'রিফান্ড' : 'Refund') : e.category === 'order' ? (bn ? 'অর্ডার' : 'Order') : (bn ? 'সাধারণ' : 'General')}
                      </span>
                    )}
                  </p>
                  <p className="text-body-sm text-on-surface mt-1">{e.action}</p>
                  <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1.5">
                    <Icon name="schedule" className="text-[13px]" />{fmtDate(e.at, lang)} · {fmtTime(e.at, lang)} • {bn ? 'মোবাইল অ্যাপ (Android)' : 'Mobile app (Android)'}
                  </p>
                </div>
              </div>
            </AdminCard>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-8">{bn ? 'এই ফিল্টারে কোনো অ্যাক্টিভিটি নেই' : 'No activity in this filter'}</p>
        )}
      </div>

      <div className="rounded-2xl bg-surface-container px-4 py-3 flex gap-2.5">
        <Icon name="lock" className="text-on-surface-variant text-[20px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'নিরাপত্তা ও স্বচ্ছতা নিশ্চয়তা' : 'Security & transparency'}</b>
          <span className="block text-label-md text-on-surface-variant mt-0.5">
            {bn ? 'অ্যাডমিন অডিট লগ ১০০% সংরক্ষিত ও অপরিবর্তনীয়। যেকোনো ভুল বা অননুমোদিত কাজ দ্রুত শনাক্ত করা সম্ভব।' : 'The admin audit log is fully preserved and immutable.'}
          </span>
        </p>
      </div>
    </div>
  );
}

// H25 — Delivery message templates (read-only). Built from
// design delivery_confirmation_sms_push_templates_jovro:
// auto-send banner, per-status SMS (160 chars, masking JOVRO)
// + push cards, dynamic variable chips, WhatsApp memo for
// delivered, and the telecom gateway settings summary.
// Message texts are based on TRACKING_MESSAGES in
// src/services/orders.ts — the same texts the app sends.
export function AdminTemplates() {
  const { state } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const [note, setNote] = useState(false);
  const statuses = Object.keys(TRACKING_MESSAGES) as (keyof typeof TRACKING_MESSAGES)[];
  const sampleOrder = state.orders[0];

  const smsFor = (msgBn: string) =>
    `জোভ্রো: আপনার অর্ডার #${sampleOrder?.id ?? 'JVR-0000'} — ${msgBn}। মোট বিল: ৳${sampleOrder?.finalTotal ?? 0} (ক্যাশ মেমো প্যাকেটে সংযুক্ত)। কোনো সমস্যা হলে কল করুন: 01712-345678 বা jovro.app/track`;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="notifications_active"
        titleBn="নোটিফিকেশন ও এসএমএস"
        titleEn="Notification & SMS Templates"
        subBn="ডেলিভারি বার্তা • Lalmonirhat Sadar"
        subEn="Delivery messages • Lalmonirhat Sadar"
      />

      {/* Auto-send banner — design */}
      <div className="rounded-2xl bg-primary/8 border border-primary/25 px-4 py-3 flex gap-3">
        <Icon name="bolt" className="text-primary text-[22px]" />
        <div>
          <p className="text-body-md font-bold text-on-surface flex items-center gap-2">
            {bn ? 'স্বয়ংক্রিয় নোটিফিকেশন প্রেরণ' : 'Automatic Notifications'}
            <span className="text-label-sm font-bold bg-primary text-white px-2 py-0.5 rounded-full">{bn ? 'Auto-Sync On' : 'Auto-Sync On'}</span>
          </p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {bn ? 'রাইডার বা অ্যাডমিন অর্ডারটি ‘পৌঁছে দেওয়া হয়েছে’ (DELIVERED) মার্ক করার সাথে সাথে কাস্টমারের মোবাইলে এই বার্তাগুলো স্বয়ংক্রিয়ভাবে প্রেরিত হয়।' : 'These messages send automatically when an order status changes.'}
          </p>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1"><Icon name="verified" className="text-primary text-[14px]" />{bn ? 'BTRC রেগুলেশন অনুমোদিত' : 'BTRC approved'}</span>
            <span>{bn ? 'বিলম্বহীন (Instant)' : 'Instant'}</span>
          </p>
        </div>
      </div>

      {/* Variable chips — design */}
      <div className="flex flex-wrap gap-1.5">
        {['{অর্ডার নং}', '{বিল পরিমাণ}', '{রাইডারের নাম}', '{হেল্পলাইন}', '{রশিদ লিংক}'].map(v => (
          <span key={v} className="text-label-sm font-semibold bg-surface-container rounded-full px-2 py-1 text-on-surface-variant">{v}</span>
        ))}
        <span className="text-label-sm text-on-surface-variant self-center ml-1">{bn ? 'সিস্টেম ভেরিয়েবল ট্যাগসমূহ (Dynamic Chips)' : 'Dynamic variable tags'}</span>
      </div>

      {statuses.map(status => {
        const msg = TRACKING_MESSAGES[status];
        const sms = smsFor(msg.bn);
        return (
          <AdminCard key={status} className="flex flex-col gap-3">
            <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="event" className="text-primary text-[19px]" />
              {bn ? msg.bn : msg.en}
              <span className="text-label-sm font-semibold bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant uppercase">{status}</span>
            </p>

            {/* SMS */}
            <div className="rounded-2xl bg-surface-container p-3.5">
              <p className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
                <Icon name="sms" className="text-[16px] text-primary" />{bn ? 'সরাসরি মোবাইল এসএমএস' : 'Direct Mobile SMS'}
                <span className="font-normal text-on-surface-variant">Direct Mobile SMS (160 Chars) · {bn ? 'মাস্কিং:' : 'Masking:'} JOVRO</span>
              </p>
              <p className="text-body-sm text-on-surface mt-2">{sms}</p>
              <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-2">
                <Icon name="done_all" className="text-primary text-[14px]" />
                {toBnDigits(sms.length, lang)}/১৬০ {bn ? 'বর্ণ (১টি SMS) · বাংলা ইউনিকোড সমর্থিত' : 'chars (1 SMS) · Bangla Unicode'}
              </p>
            </div>

            {/* Push */}
            <div className="rounded-2xl border border-outline-variant/40 p-3.5">
              <p className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
                <Icon name="notifications_active" className="text-[16px] text-primary" />{bn ? 'অ্যাপ পুশ নোটিফিকেশন' : 'App Push Notification'}
                <span className="font-normal text-on-surface-variant">App Push Simulation Tray · {bn ? 'হাই প্রায়োরিটি' : 'High priority'}</span>
              </p>
              <div className="bg-surface-container rounded-xl p-3 mt-2 flex gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="pedal_bike" className="text-white text-[19px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-label-md font-bold text-on-surface">Jovro • {bn ? 'এখনই' : 'now'}</p>
                  <p className="text-body-sm font-semibold text-on-surface mt-0.5">{msg.bn} {status === 'delivered' ? '🚴‍♂️' : ''}</p>
                  <p className="text-label-md text-on-surface-variant mt-0.5">
                    {bn ? `আপনার অর্ডার #${sampleOrder?.id ?? ''} — ${msg.bn}। প্যাকেট ও বাজারের আসল রসিদ মিলিয়ে নিন।` : `Your order #${sampleOrder?.id ?? ''} — ${msg.en}.`}
                  </p>
                </div>
              </div>
              <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-2">
                <Icon name="link" className="text-[13px]" />{bn ? 'ট্যাপ করলে গন্তব্য (Deep-link): অর্ডার ট্র্যাকিং ও ফিডব্যাক পেজ' : 'Deep-link: order tracking & feedback page'}
              </p>
            </div>

            {status === 'delivered' && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5">
                <p className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
                  <Icon name="chat" className="text-[16px] text-emerald-700" />{bn ? 'হোয়াটসঅ্যাপ কনফার্মেশন মেমো' : 'WhatsApp Confirmation Memo'}
                  <span className="text-label-sm font-semibold text-emerald-700">{bn ? 'অটো-চালু' : 'Auto on'}</span>
                </p>
                <p className="text-body-sm text-on-surface mt-2 whitespace-pre-line">
                  {`আসসালামু আলাইকুম! 🙏\nআপনার অর্ডার #${sampleOrder?.id ?? ''} ঠিকানায় পৌঁছে দেওয়া সম্পন্ন হয়েছে।\nবাজার খরচ: ৳${sampleOrder?.productsTotal ?? 0}\nডেলিভারি চার্জ: ৳${sampleOrder?.deliveryFee ?? 0}\nপরিশোধিত মোট: ৳${sampleOrder?.finalTotal ?? 0}`}
                </p>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-2">
                  <Icon name="info" className="text-[13px]" />{bn ? 'গ্রাহকের ফোন নম্বরে সক্রিয় WhatsApp থাকলে তবেই এটি প্রেরিত হবে।' : 'Sent only if the customer has WhatsApp on that number.'}
                </p>
              </div>
            )}
          </AdminCard>
        );
      })}

      {/* Gateway settings — design */}
      <AdminCard className="flex flex-col gap-2.5">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="admin_panel_settings" className="text-primary text-[20px]" />
          {bn ? 'টেলিকম ও সেন্ডার সেটিংস (Admin Gateway)' : 'Telecom & Sender Settings'}
        </p>
        <div className="grid grid-cols-2 gap-2.5 text-body-sm">
          <div className="bg-surface-container rounded-xl px-3 py-2.5">
            <p className="text-label-sm text-on-surface-variant">SENDER ID ({bn ? 'মাস্কিং' : 'masking'})</p>
            <p className="font-bold text-on-surface mt-0.5">JOVRO <span className="text-label-sm font-semibold text-emerald-700">● BTRC Approved</span></p>
          </div>
          <div className="bg-surface-container rounded-xl px-3 py-2.5">
            <p className="text-label-sm text-on-surface-variant">{bn ? 'গেটওয়ে ব্যালেন্স' : 'Gateway balance'}</p>
            <p className="font-bold text-on-surface mt-0.5">{toBnDigits('৩,৪২০', lang)} {bn ? 'এসএমএস · রিচার্জ প্রয়োজন নেই' : 'SMS · no recharge needed'}</p>
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant flex items-center gap-2"><Icon name="person_off" className="text-[17px]" />{bn ? 'গ্রাহক অপ্ট-আউট (DND) সম্মান করুন' : 'Respect customer opt-out (DND)'}</p>
        <p className="text-body-sm text-on-surface-variant flex items-center gap-2"><Icon name="receipt_long" className="text-[17px]" />{bn ? 'ক্যাশ মেমো ফটো লিঙ্ক সংযুক্ত রাখা' : 'Keep the cash memo photo link attached'}</p>
        <div className="flex gap-2 mt-1">
          <button onClick={() => setNote(true)} className="flex-1 h-10 rounded-xl border-2 border-outline-variant text-label-md font-bold text-on-surface inline-flex items-center justify-center gap-1.5">
            <Icon name="edit_note" className="text-[16px]" />{bn ? 'টেমপ্লেট পরিবর্তন' : 'Edit template'}
          </button>
          <button onClick={() => setNote(true)} className="flex-1 h-10 rounded-xl border-2 border-outline-variant text-label-md font-bold text-on-surface inline-flex items-center justify-center gap-1.5">
            <Icon name="send" className="text-[16px]" />{bn ? 'টেস্ট এসএমএস পাঠান' : 'Send test SMS'}
          </button>
        </div>
        {note && <p className="text-label-md text-on-surface-variant text-center">{bn ? 'এই পেজটি শুধু দেখার জন্য (read-only) — ডেমো বিল্ডে টেমপ্লেট বদল নিষ্ক্রিয়।' : 'This page is read-only in the demo build.'}</p>}
      </AdminCard>

      <div className="rounded-2xl bg-primary/8 border border-primary/25 px-4 py-3 flex gap-2.5">
        <Icon name="local_mall" className="text-primary text-[20px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'লালমনিরহাট সদর জোভ্রো প্রতিশ্রুতি:' : 'Jovro promise:'}</b>{' '}
          {bn ? 'দোকানদারের আসল ভাউচার ছাড়া কোনো অতিরিক্ত খরচ যোগ করা হয় না। প্রতিটি নোটিফিকেশনে সঠিক বিলের স্বচ্ছতা বজায় রাখুন।' : 'No extra cost beyond the real shop voucher. Keep every bill transparent.'}
        </p>
      </div>
    </div>
  );
}
