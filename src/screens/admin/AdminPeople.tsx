import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { PaymentRequest } from '../../types';
import {
  AdminCard, Avatar, Field, Icon, PageTitle, SectionHead, fmtDate, fmtTk, fmtTime,
  inputCls, logAction, toBnDigits, useActorName, useBn,
} from './adminShared';
import { areaName, todayOrders, uid } from '../../services/orderUtils';
import { REFERRALS_SEED } from '../../data/seed';

// People hub — bottom-nav "মানুষ / People" landing, list style
// follows a1.6_business_controls_jovro.
export function AdminPeopleHub() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const pendingRiders = state.riders.filter(r => r.status === 'pending').length;
  const pendingAffiliates = state.affiliates.filter(a => a.status === 'pending').length;
  const pendingPayouts = state.paymentRequests.filter(p => p.status === 'pending').length;

  const rows = [
    { icon: 'pending_actions', bn: 'অনুমোদন', en: 'Approvals', subBn: 'রাইডার ও অ্যাফিলিয়েট আবেদন যাচাই', subEn: 'Review rider & affiliate applications', path: '/admin/approvals', badge: pendingRiders + pendingAffiliates },
    { icon: 'two_wheeler', bn: 'রাইডার ব্যবস্থাপনা', en: 'Rider Management', subBn: 'আবেদন, সরাসরি যোগ ও রাইডার তালিকা', subEn: 'Applications, direct add & rider list', path: '/admin/riders', badge: pendingRiders },
    { icon: 'handshake', bn: 'অ্যাফিলিয়েট ব্যবস্থাপনা', en: 'Affiliate Management', subBn: 'আবেদন, কমিশন রেট ও পে-আউট', subEn: 'Applications, commission rates & payouts', path: '/admin/affiliates', badge: pendingAffiliates },
    { icon: 'account_balance_wallet', bn: 'পেমেন্ট রিকোয়েস্ট', en: 'Payout Requests', subBn: 'রাইডার ও অ্যাফিলিয়েট পে-আউট', subEn: 'Rider & affiliate payouts', path: '/admin/payouts', badge: pendingPayouts },
    { icon: 'group', bn: 'কাস্টমার তালিকা', en: 'Customer List', subBn: 'নিবন্ধিত গ্রাহক ও সাবস্ক্রিপশন', subEn: 'Registered customers & subscriptions', path: '/admin/customers', badge: 0 },
    { icon: 'badge', bn: 'স্টাফ অ্যাক্সেস', en: 'Staff Access', subBn: 'টিমের অনুমতি ও অ্যাক্সেস নিয়ন্ত্রণ', subEn: 'Team permissions & access control', path: '/admin/staff', badge: 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="group" titleBn="মানুষ" titleEn="People" subBn="রাইডার, অ্যাফিলিয়েট, কাস্টমার ও স্টাফ" subEn="Riders, affiliates, customers & staff" />
      <div className="flex flex-col gap-2.5">
        {rows.map(r => (
          <AdminCard key={r.path} onClick={() => navigate(r.path)}>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon name={r.icon} className="text-primary text-[22px]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? r.bn : r.en}</p>
                <p className="text-label-md text-on-surface-variant truncate">{bn ? r.subBn : r.subEn}</p>
              </div>
              {r.badge > 0 && (
                <span className="min-w-[22px] h-[22px] px-1 rounded-full bg-error text-white text-label-sm font-bold flex items-center justify-center">
                  {toBnDigits(r.badge, lang)}
                </span>
              )}
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

function RoleTabs({ active }: { active: 'riders' | 'affiliates' }) {
  const navigate = useNavigate();
  const bn = useBn();
  return (
    <div className="flex gap-2">
      <button
        onClick={() => navigate('/admin/riders')}
        className={clsx('flex-1 py-2.5 rounded-xl text-label-lg font-bold inline-flex items-center justify-center gap-1.5 border-2',
          active === 'riders' ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface border-outline-variant')}
      >
        <Icon name="two_wheeler" className="text-[18px]" />{bn ? 'রাইডার' : 'Riders'}
      </button>
      <button
        onClick={() => navigate('/admin/affiliates')}
        className={clsx('flex-1 py-2.5 rounded-xl text-label-lg font-bold inline-flex items-center justify-center gap-1.5 border-2',
          active === 'affiliates' ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface border-outline-variant')}
      >
        <Icon name="group" className="text-[18px]" />{bn ? 'অ্যাফিলিয়েট' : 'Affiliates'}
      </button>
    </div>
  );
}

function ApproveReject({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  const bn = useBn();
  return (
    <div className="flex gap-2 mt-3">
      <button onClick={onReject} className="flex-1 h-10 rounded-xl border-2 border-error/50 text-error text-label-md font-bold inline-flex items-center justify-center gap-1.5">
        <Icon name="cancel" className="text-[16px]" />{bn ? 'বাতিল / Reject' : 'Reject'}
      </button>
      <button onClick={onApprove} className="flex-1 h-10 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
        <Icon name="check_circle" className="text-[16px]" />{bn ? 'অনুমোদন করুন / Approve' : 'Approve'}
      </button>
    </div>
  );
}

// H26 (rider side) — Rider management. Built from designs
// a1.3_rider_management_jovro + 7._riders_management_payouts_jovro:
// applications with the "অনুমোদন মানেই এই ইমেইল দিয়ে লগইন
// করলেই রাইডার সেকশন খুলবে" info strip, direct add-by-email,
// and the approved riders list with today's deliveries + income.
export function AdminRiders() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const pending = state.riders.filter(r => r.status === 'pending');
  const active = state.riders.filter(r => r.status !== 'pending');
  const todays = todayOrders(state.orders);

  const approve = (id: string, riderName: string) => {
    const r = state.riders.find(x => x.id === id);
    if (!r) return;
    dispatch({ type: 'UPDATE_RIDER', rider: { ...r, status: 'active' } });
    logAction(dispatch, actor, `রাইডার আবেদন অনুমোদন করেছেন: ${riderName}`, 'general');
  };
  const reject = (id: string, riderName: string) => {
    const r = state.riders.find(x => x.id === id);
    if (!r) return;
    dispatch({ type: 'UPDATE_RIDER', rider: { ...r, status: 'inactive' } });
    logAction(dispatch, actor, `রাইডার আবেদন বাতিল করেছেন: ${riderName}`, 'general');
  };
  const addDirect = () => {
    if (!name.trim() || !email.trim()) return;
    dispatch({
      type: 'ADD_RIDER',
      rider: {
        id: uid('rider'), userId: uid('u'), name: name.trim(), nameBn: name.trim(),
        mobile: mobile.trim() || '—', email: email.trim(), areaId: state.areas[0]?.id,
        vehicleType: 'bicycle', status: 'active', totalDeliveries: 0, totalEarnings: 0,
        rating: 0, joinedAt: new Date().toISOString().slice(0, 10), pendingPayout: 0,
      },
    });
    logAction(dispatch, actor, `সরাসরি রাইডার যোগ করেছেন: ${name.trim()} (${email.trim()})`, 'general');
    setName(''); setEmail(''); setMobile('');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="two_wheeler" titleBn="রাইডার ব্যবস্থাপনা" titleEn="Rider Management" subBn="Rider Management · লালমনিরহাট" subEn="Rider Management · Lalmonirhat" />
      <RoleTabs active="riders" />

      <SectionHead
        icon="pending_actions"
        titleBn="রাইডার আবেদন"
        titleEn="Rider Applications"
        right={<span className="text-label-sm font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{toBnDigits(pending.length, lang)}{bn ? 'টি অপেক্ষমাণ' : ' pending'}</span>}
      />
      <div className="rounded-2xl bg-tertiary/8 border border-tertiary/25 px-4 py-3 flex gap-2.5">
        <Icon name="info" className="text-tertiary text-[20px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'অনুমোদন মানেই:' : 'Approving means:'}</b>{' '}
          {bn ? 'এই ইমেইল দিয়ে লগইন করলেই রাইডার সেকশন খুলবে' : 'this email opens the rider section at login'}
          <span className="block text-label-sm text-on-surface-variant">Approving means: this email opens the rider section at login</span>
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {pending.map(r => (
          <AdminCard key={r.id}>
            <div className="flex items-center gap-3">
              <Avatar name={bn ? r.nameBn : r.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? r.nameBn : r.name}</p>
                <p className="text-label-sm text-on-surface-variant">{bn ? 'আবেদনকারী' : 'Applicant'} · {fmtDate(r.joinedAt, lang)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2.5 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-2"><Icon name="phone" className="text-[16px]" />{toBnDigits(r.mobile, lang)}</span>
              <span className="flex items-center gap-2"><Icon name="mail" className="text-[16px]" />{r.email ?? '—'}</span>
              <span className="flex items-center gap-2"><Icon name="near_me" className="text-[16px]" />{bn ? 'এলাকা:' : 'Area:'} {areaName(state.areas, r.areaId ?? '', lang)}</span>
            </div>
            <ApproveReject onApprove={() => approve(r.id, r.nameBn)} onReject={() => reject(r.id, r.nameBn)} />
          </AdminCard>
        ))}
        {pending.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো অপেক্ষমাণ আবেদন নেই' : 'No pending applications'}</p>}
      </div>

      {/* Direct add — a1.3 */}
      <AdminCard className="flex flex-col gap-3.5">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="person_add" className="text-primary text-[20px]" />
          {bn ? 'সরাসরি রাইডার যোগ করুন' : 'Add Rider Directly'}
          <span className="block text-label-sm font-normal text-on-surface-variant">Add a rider email directly</span>
        </p>
        <p className="text-label-md text-on-surface-variant -mt-1">{bn ? 'কোনো আবেদন ছাড়াই সরাসরি রাইডার অ্যাক্সেস দিতে ইমেইল যোগ করুন।' : 'Add an email to grant rider access without an application.'}</p>
        <Field labelBn="রাইডারের নাম / Rider Name" labelEn="Rider Name">
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder={bn ? 'নাম লিখুন' : 'Full name'} />
        </Field>
        <Field labelBn="রাইডারের অনুমোদিত ইমেইল / Authorized Email" labelEn="Authorized Email">
          <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="rider@gmail.com" />
        </Field>
        <Field labelBn="মোবাইল" labelEn="Mobile">
          <input value={mobile} onChange={e => setMobile(e.target.value)} className={inputCls} placeholder="01XXXXXXXXX" />
        </Field>
        <button onClick={addDirect} disabled={!name.trim() || !email.trim()} className="w-full h-11 rounded-xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon name="add_circle" className="text-[18px]" />{bn ? 'যোগ করুন / Add rider' : 'Add rider'}
        </button>
      </AdminCard>

      <SectionHead
        icon="group"
        titleBn="রাইডারগণ"
        titleEn="Riders List"
        right={<span className="text-label-sm text-on-surface-variant">{bn ? 'অনুমোদিত:' : 'Approved:'} {toBnDigits(active.length, lang)} {bn ? 'জন' : ''}</span>}
      />
      <div className="flex flex-col gap-3">
        {active.map(r => {
          const doneToday = todays.filter(o => o.riderId === r.id && o.status === 'delivered').length;
          const failedToday = todays.filter(o => o.riderId === r.id && o.status === 'failed').length;
          return (
            <AdminCard key={r.id}>
              <div className="flex items-center gap-3">
                <Avatar name={bn ? r.nameBn : r.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface">
                    {bn ? r.nameBn : r.name}
                    <span className={clsx('ml-2 text-label-sm font-bold px-2 py-0.5 rounded-full', r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-on-surface-variant')}>
                      {r.status === 'active' ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </p>
                  <p className="text-label-sm text-on-surface-variant truncate">{r.email ?? ''}</p>
                </div>
              </div>
              <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-2">
                <Icon name="location_on" className="text-[14px]" />{areaName(state.areas, r.areaId ?? '', lang)} · {bn ? 'আইডি:' : 'ID:'} #{r.id.toUpperCase()}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2.5 text-center">
                <div className="bg-surface-container rounded-xl py-2">
                  <p className="text-label-sm text-on-surface-variant inline-flex items-center gap-1"><Icon name="local_shipping" className="text-[13px]" />{bn ? 'আজকের ডেলিভারি' : "Today's deliveries"}</p>
                  <p className="text-body-md font-bold text-on-surface">{bn ? 'সম্পন্ন' : 'Done'} {toBnDigits(doneToday, lang)} · {bn ? 'ব্যর্থ' : 'Failed'} {toBnDigits(failedToday, lang)}</p>
                </div>
                <div className="bg-surface-container rounded-xl py-2">
                  <p className="text-label-sm text-on-surface-variant inline-flex items-center gap-1"><Icon name="payments" className="text-[13px]" />{bn ? 'মোট আয়' : 'Total earnings'}</p>
                  <p className="text-body-md font-bold text-on-surface">{fmtTk(r.totalEarnings, lang)}</p>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}

// H26 (affiliate side) — Affiliate management. Built from
// designs a1.5_affiliate_management_jovro + 8._affiliates_
// management_jovro: pending application with promo channel,
// direct add, active affiliates with per-affiliate commission
// rate editor, and affiliate payout requests.
export function AdminAffiliates() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [rates, setRates] = useState<Record<string, string>>({});

  const pending = state.affiliates.filter(a => a.status === 'pending');
  const active = state.affiliates.filter(a => a.status !== 'pending');
  const affPayouts = state.paymentRequests.filter(p => p.riderId.startsWith('aff-') && p.status === 'pending');

  const approve = (id: string) => {
    const a = state.affiliates.find(x => x.id === id);
    if (!a) return;
    dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...a, status: 'active' } });
    logAction(dispatch, actor, `অ্যাফিলিয়েট আবেদন অনুমোদন করেছেন: ${a.nameBn}`, 'general');
  };
  const reject = (id: string) => {
    const a = state.affiliates.find(x => x.id === id);
    if (!a) return;
    dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...a, status: 'inactive' } });
    logAction(dispatch, actor, `অ্যাফিলিয়েট আবেদন বাতিল করেছেন: ${a.nameBn}`, 'general');
  };
  const addDirect = () => {
    if (!name.trim() || !email.trim()) return;
    const code = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '') + '10';
    dispatch({
      type: 'ADD_AFFILIATE',
      affiliate: {
        id: uid('aff'), userId: uid('u'), name: name.trim(), nameBn: name.trim(),
        mobile: mobile.trim() || '—', email: email.trim(), referralCode: code || 'JOVRO10',
        status: 'active', totalReferrals: 0, totalEarnings: 0, pendingPayout: 0,
        joinedAt: new Date().toISOString().slice(0, 10), commissionRate: 20,
      },
    });
    logAction(dispatch, actor, `সরাসরি অ্যাফিলিয়েট যোগ করেছেন: ${name.trim()} (${email.trim()})`, 'general');
    setName(''); setEmail(''); setMobile('');
  };
  const saveRate = (id: string) => {
    const a = state.affiliates.find(x => x.id === id);
    const v = Number(rates[id]);
    if (!a || Number.isNaN(v)) return;
    dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...a, commissionRate: v } });
    logAction(dispatch, actor, `অ্যাফিলিয়েট ${a.nameBn}-এর কমিশন রেট ${fmtTk(v, 'en')}/অর্ডার করেছেন`, 'general');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="handshake" titleBn="অ্যাফিলিয়েট ব্যবস্থাপনা" titleEn="Affiliate Management" subBn="Affiliate Management • Lalmonirhat Sadar Hub" subEn="Affiliate Management • Lalmonirhat Sadar Hub" />
      <RoleTabs active="affiliates" />

      <SectionHead
        icon="groups"
        titleBn="অ্যাফিলিয়েট আবেদন"
        titleEn="Affiliate Applications"
        right={<span className="text-label-sm font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{toBnDigits(pending.length, lang)}{bn ? 'টি অপেক্ষমাণ' : ' pending'}</span>}
      />
      <div className="rounded-2xl bg-tertiary/8 border border-tertiary/25 px-4 py-3 flex gap-2.5">
        <Icon name="info" className="text-tertiary text-[20px]" />
        <p className="text-body-sm text-on-surface">
          {bn ? 'অনুমোদন মানেই: এই ইমেইল দিয়ে লগইন করলেই অ্যাফিলিয়েট ড্যাশবোর্ড খুলবে' : 'This email opens the affiliate dashboard at login.'}
          <span className="block text-label-sm text-on-surface-variant">Approving activates the affiliate dashboard for this email.</span>
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {pending.map(a => (
          <AdminCard key={a.id}>
            <div className="flex items-center gap-3">
              <Avatar name={bn ? a.nameBn : a.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? a.nameBn : a.name} <span className="font-normal text-on-surface-variant">({a.name})</span></p>
                <p className="text-label-sm text-on-surface-variant">{bn ? 'আবেদনকারী' : 'Applicant'} · {fmtDate(a.joinedAt, lang)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2.5 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-2"><Icon name="call" className="text-[16px]" />{toBnDigits(a.mobile, lang)}</span>
              <span className="flex items-center gap-2"><Icon name="mail" className="text-[16px]" />{a.email ?? '—'}</span>
              {a.promoteNote && (
                <span className="flex items-start gap-2">
                  <Icon name="campaign" className="text-[16px] mt-0.5" />
                  <span>{bn ? 'প্রচার মাধ্যম • Promo Channel:' : 'Promo Channel:'} {a.promoteNote}</span>
                </span>
              )}
            </div>
            <ApproveReject onApprove={() => approve(a.id)} onReject={() => reject(a.id)} />
          </AdminCard>
        ))}
        {pending.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো অপেক্ষমাণ আবেদন নেই' : 'No pending applications'}</p>}
      </div>

      {/* Direct add — a1.5 */}
      <AdminCard className="flex flex-col gap-3.5">
        <p className="text-label-lg font-bold text-on-surface">{bn ? 'সরাসরি অ্যাফিলিয়েট ইমেইল যোগ করুন' : 'Add an affiliate email directly'}</p>
        <Field labelBn="নাম / Full Name" labelEn="Full Name">
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder={bn ? 'পুরো নাম' : 'Full name'} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field labelBn="অনুমোদিত ইমেইল / Authorized Email" labelEn="Authorized Email">
            <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="partner@gmail.com" />
          </Field>
          <Field labelBn="মোবাইল" labelEn="Mobile">
            <input value={mobile} onChange={e => setMobile(e.target.value)} className={inputCls} placeholder="01XXXXXXXXX" />
          </Field>
        </div>
        <button onClick={addDirect} disabled={!name.trim() || !email.trim()} className="w-full h-11 rounded-xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon name="person_add" className="text-[18px]" />{bn ? 'যোগ করুন / Add affiliate' : 'Add affiliate'}
        </button>
      </AdminCard>

      <SectionHead icon="verified" titleBn="অ্যাফিলিয়েটগণ" titleEn="Active Affiliates" right={<span className="text-label-sm text-on-surface-variant">{bn ? 'অনুমোদিত তালিকা' : 'Approved list'}</span>} />
      <div className="flex flex-col gap-3">
        {active.map(a => {
          const ordersCount = REFERRALS_SEED.filter(r => r.affiliateId === a.id).length;
          return (
            <AdminCard key={a.id}>
              <div className="flex items-center gap-3">
                <Avatar name={bn ? a.nameBn : a.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface inline-flex items-center gap-1.5">
                    {bn ? a.nameBn : a.name}
                    {a.status === 'active' && <Icon name="verified" className="text-primary text-[16px]" />}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">{bn ? 'রেফারেল কোড:' : 'Referral code:'} <b className="text-primary">#{a.referralCode}</b></p>
                </div>
                <span className={clsx('text-label-sm font-bold px-2 py-0.5 rounded-full', a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-on-surface-variant')}>
                  {a.status === 'active' ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-surface-container rounded-xl py-2">
                  <p className="text-label-sm text-on-surface-variant">{bn ? 'কাস্টমার' : 'Customers'}</p>
                  <p className="text-body-md font-bold text-on-surface">{toBnDigits(a.totalReferrals, lang)}</p>
                </div>
                <div className="bg-surface-container rounded-xl py-2">
                  <p className="text-label-sm text-on-surface-variant">{bn ? 'অর্ডার' : 'Orders'}</p>
                  <p className="text-body-md font-bold text-on-surface">{toBnDigits(ordersCount, lang)}</p>
                </div>
                <div className="bg-surface-container rounded-xl py-2">
                  <p className="text-label-sm text-on-surface-variant">{bn ? 'বকেয়া' : 'Owed'}</p>
                  <p className="text-body-md font-bold text-secondary">{fmtTk(a.pendingPayout, lang)}</p>
                </div>
              </div>
              {/* Commission rate editor — design 8 "Rate Controller" */}
              <div className="flex items-end gap-2 mt-3">
                <div className="flex-1">
                  <Field labelBn="কমিশন প্রতি অর্ডারে (৳) / Commission per order (৳)" labelEn="Commission per order (৳)">
                    <div className="flex items-center gap-1.5 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
                      <span className="font-bold text-on-surface-variant">৳</span>
                      <input
                        type="number"
                        value={rates[a.id] ?? String(a.commissionRate ?? 20)}
                        onChange={e => setRates(prev => ({ ...prev, [a.id]: e.target.value }))}
                        className="flex-1 py-2 bg-transparent outline-none text-body-md font-bold text-on-surface min-w-0"
                      />
                      <span className="text-label-sm text-on-surface-variant">{bn ? '/ প্রতি অর্ডারে' : '/ per order'}</span>
                    </div>
                  </Field>
                </div>
                <button onClick={() => saveRate(a.id)} className="h-11 px-4 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center gap-1.5">
                  <Icon name="save" className="text-[16px]" />{bn ? 'সেভ / Save' : 'Save'}
                </button>
              </div>
            </AdminCard>
          );
        })}
      </div>
      <p className="text-label-sm text-on-surface-variant">* {bn ? 'অ্যাডমিন প্রতি অ্যাফিলিয়েটের কমিশন রেট আলাদাভাবে সেট করতে পারেন।' : 'Admin can set each affiliate\'s commission rate separately.'}</p>

      {/* Affiliate payout requests — a1.5 */}
      <SectionHead
        icon="payments"
        titleBn="অ্যাফিলিয়েট পেমেন্ট রিকোয়েস্ট"
        titleEn="Affiliate payout requests"
        right={affPayouts.length > 0 ? <span className="text-label-sm font-bold text-secondary">{toBnDigits(affPayouts.length, lang)}{bn ? 'টি নতুন' : ' new'}</span> : undefined}
      />
      <div className="flex flex-col gap-2.5">
        {affPayouts.map(p => {
          const aff = state.affiliates.find(a => a.id === p.riderId);
          return (
            <AdminCard key={p.id}>
              <div className="flex items-center gap-3">
                <Avatar name={aff?.nameBn ?? '?'} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface">{aff ? (bn ? aff.nameBn : aff.name) : p.riderId}</p>
                  <p className="text-label-sm text-on-surface-variant">{bn ? 'অনুরোধ:' : 'Requested:'} {fmtDate(p.requestedAt, lang)}</p>
                  <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <Icon name="account_balance_wallet" className="text-[14px]" />{p.method === 'nagad' ? 'নগদ' : 'বিকাশ'} • {toBnDigits(p.accountNumber, lang)}
                  </p>
                </div>
                <p className="text-body-lg font-bold text-on-surface">{fmtTk(p.amount, lang)}</p>
              </div>
              <button onClick={() => navigate('/admin/payouts')} className="mt-2.5 w-full h-10 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
                <Icon name="task_alt" className="text-[16px]" />{bn ? 'পেমেন্ট হয়েছে বলে চিহ্নিত করুন / Mark as paid' : 'Mark as paid'}
              </button>
            </AdminCard>
          );
        })}
        {affPayouts.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো পে-আউট রিকোয়েস্ট নেই' : 'No payout requests'}</p>}
      </div>
    </div>
  );
}

// Payout requests — built from design a1.4_rider_payout_requests_jovro:
// total pending card, "আগে বিকাশ/নগদে টাকা পাঠান, তারপর
// চিহ্নিত করুন" note, pending request cards with Mark paid /
// Reject, and the recent payment history. Covers rider AND
// affiliate requests (H26).
export function AdminPayouts() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();

  const pending = state.paymentRequests.filter(p => p.status === 'pending');
  const paid = state.paymentRequests.filter(p => p.status === 'paid');
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  const requester = (p: PaymentRequest) => {
    const rider = state.riders.find(r => r.id === p.riderId);
    if (rider) return { name: bn ? rider.nameBn : rider.name, kind: bn ? 'রাইডার' : 'Rider', record: rider, isRider: true };
    const aff = state.affiliates.find(a => a.id === p.riderId);
    if (aff) return { name: bn ? aff.nameBn : aff.name, kind: bn ? 'অ্যাফিলিয়েট' : 'Affiliate', record: aff, isRider: false };
    return { name: p.riderId, kind: '', record: null, isRider: false };
  };

  const markPaid = (p: PaymentRequest) => {
    dispatch({ type: 'UPDATE_PAYMENT_REQUEST', request: { ...p, status: 'paid', paidAt: new Date().toISOString() } });
    const info = requester(p);
    const rider = state.riders.find(r => r.id === p.riderId);
    const affiliate = state.affiliates.find(a => a.id === p.riderId);
    if (rider) {
      dispatch({ type: 'UPDATE_RIDER', rider: { ...rider, pendingPayout: Math.max(0, rider.pendingPayout - p.amount) } });
    }
    if (affiliate) {
      dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...affiliate, pendingPayout: Math.max(0, affiliate.pendingPayout - p.amount) } });
    }
    logAction(dispatch, actor, `পে-আউট পরিশোধ করেছেন: ${info.name} (${fmtTk(p.amount, 'en')}, ${p.method})`, 'general');
  };
  const rejectReq = (p: PaymentRequest) => {
    dispatch({ type: 'UPDATE_PAYMENT_REQUEST', request: { ...p, status: 'rejected' } });
    logAction(dispatch, actor, `পে-আউট রিকোয়েস্ট বাতিল করেছেন: ${requester(p).name} (${fmtTk(p.amount, 'en')})`, 'general');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="payments"
        titleBn="পেমেন্ট রিকোয়েস্ট"
        titleEn="Payout Requests"
        subBn="Rider Payout Requests • সদর এরিয়া ম্যানেজমেন্ট"
        subEn="Rider & Affiliate Payout Requests • Sadar Area Management"
      />

      {/* Total pending — a1.4 */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white p-4">
        <p className="text-label-md text-white/85 flex items-center gap-1.5">
          <Icon name="payments" className="text-[17px]" />{bn ? 'মোট বকেয়া পেমেন্ট / Total pending payouts' : 'Total pending payouts'}
        </p>
        <p className="text-headline-md font-bold mt-1">{fmtTk(totalPending, lang)}</p>
        <p className="text-label-md text-white/85 mt-0.5">
          ({toBnDigits(pending.length, lang)}{bn ? 'টি অপেক্ষমাণ রিকোয়েস্ট' : ' pending requests'})
          <span className="ml-2 inline-flex items-center gap-1 font-semibold"><Icon name="hourglass_top" className="text-[14px]" />{toBnDigits(pending.length, lang)}{bn ? 'টি পেন্ডিং' : ' pending'}</span>
        </p>
      </div>
      <div className="rounded-2xl bg-tertiary/8 border border-tertiary/25 px-4 py-3 flex gap-2.5">
        <Icon name="verified_user" className="text-tertiary text-[20px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'আগে বিকাশ/নগদে টাকা পাঠান, তারপর চিহ্নিত করুন' : 'Send the money first, then mark paid'}</b>
          <span className="block text-label-sm text-on-surface-variant">Send the money by bKash/Nagad first, then mark paid to confirm ledger.</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {pending.map(p => {
          const info = requester(p);
          return (
            <AdminCard key={p.id}>
              <div className="flex items-center gap-3">
                <Avatar name={info.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface">
                    {info.name} <span className="text-label-sm font-semibold text-on-surface-variant">#{p.id.toUpperCase()}</span>
                  </p>
                  <p className="text-label-sm text-on-surface-variant">{fmtDate(p.requestedAt, lang)} · {fmtTime(p.requestedAt, lang)} · {info.kind}</p>
                </div>
                <span className="text-label-sm font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <Icon name="schedule" className="text-[13px]" />{bn ? 'অপেক্ষমাণ / Pending' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 bg-surface-container rounded-xl px-3 py-2.5">
                <span className="text-label-md text-on-surface-variant">{bn ? 'রিকোয়েস্ট অ্যামাউন্ট' : 'Request amount'}</span>
                <span className="text-body-lg font-bold text-on-surface">{fmtTk(p.amount, lang)}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-2">
                <Icon name="account_balance_wallet" className="text-[17px]" />
                {p.method === 'nagad' ? 'নগদ (Personal)' : 'বিকাশ (Personal)'} · {toBnDigits(p.accountNumber, lang)}
                <Icon name="content_copy" className="text-[15px]" />
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => rejectReq(p)} className="h-11 px-4 rounded-xl border-2 border-error/50 text-error text-label-md font-bold">
                  {bn ? 'বাতিল / Reject' : 'Reject'}
                </button>
                <button onClick={() => markPaid(p)} className="flex-1 h-11 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
                  <Icon name="check_circle" className="text-[17px]" />{bn ? 'পেমেন্ট হয়েছে বলে চিহ্নিত করুন' : 'Mark as paid'}
                </button>
              </div>
            </AdminCard>
          );
        })}
        {pending.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-6">{bn ? 'কোনো অপেক্ষমাণ রিকোয়েস্ট নেই' : 'No pending requests'}</p>
        )}
      </div>

      {/* Recent history — a1.4 */}
      <SectionHead icon="history" titleBn="সাম্প্রতিক পেমেন্ট ইতিহাস" titleEn="Recent History" />
      <AdminCard className="flex flex-col divide-y divide-outline-variant/25 !py-1">
        {paid.map(p => {
          const info = requester(p);
          return (
            <div key={p.id} className="flex items-center gap-3 py-3">
              <Icon name="check_circle" className="text-emerald-600 text-[20px]" />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-on-surface">{info.name} • {p.method === 'nagad' ? 'নগদ' : 'বিকাশ'}</p>
                <p className="text-label-sm text-on-surface-variant">{p.paidAt ? fmtDate(p.paidAt, lang) : fmtDate(p.requestedAt, lang)}</p>
              </div>
              <p className="text-body-md font-bold text-on-surface">{fmtTk(p.amount, lang)}</p>
              <span className="text-label-sm font-bold text-emerald-700">{bn ? 'পেমেন্ট সম্পন্ন / Paid' : 'Paid'}</span>
            </div>
          );
        })}
        {paid.length === 0 && <p className="text-body-sm text-on-surface-variant py-3">{bn ? 'কোনো পেমেন্ট ইতিহাস নেই' : 'No payment history'}</p>}
      </AdminCard>
    </div>
  );
}

// H26 — combined approvals queue (linked from the admin home
// alert): pending riders + pending affiliates in one place.
export function AdminApprovals() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const pendingRiders = state.riders.filter(r => r.status === 'pending');
  const pendingAffiliates = state.affiliates.filter(a => a.status === 'pending');

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="pending_actions"
        titleBn="অনুমোদনের অপেক্ষায়"
        titleEn="Pending Approvals"
        subBn={`${toBnDigits(pendingRiders.length + pendingAffiliates.length, lang)}টি আবেদন পর্যালোচনার জন্য জমা আছে`}
        subEn={`${pendingRiders.length + pendingAffiliates.length} applications waiting for review`}
      />

      <SectionHead icon="two_wheeler" titleBn="রাইডার আবেদন" titleEn="Rider Applications" />
      <div className="flex flex-col gap-3">
        {pendingRiders.map(r => (
          <AdminCard key={r.id}>
            <div className="flex items-center gap-3">
              <Avatar name={bn ? r.nameBn : r.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? r.nameBn : r.name}</p>
                <p className="text-label-sm text-on-surface-variant">{toBnDigits(r.mobile, lang)} · {r.email ?? ''} · {areaName(state.areas, r.areaId ?? '', lang)}</p>
              </div>
            </div>
            <ApproveReject
              onApprove={() => { dispatch({ type: 'UPDATE_RIDER', rider: { ...r, status: 'active' } }); logAction(dispatch, actor, `রাইডার আবেদন অনুমোদন করেছেন: ${r.nameBn}`, 'general'); }}
              onReject={() => { dispatch({ type: 'UPDATE_RIDER', rider: { ...r, status: 'inactive' } }); logAction(dispatch, actor, `রাইডার আবেদন বাতিল করেছেন: ${r.nameBn}`, 'general'); }}
            />
          </AdminCard>
        ))}
        {pendingRiders.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো রাইডার আবেদন নেই' : 'No rider applications'}</p>}
      </div>

      <SectionHead icon="handshake" titleBn="অ্যাফিলিয়েট আবেদন" titleEn="Affiliate Applications" />
      <div className="flex flex-col gap-3">
        {pendingAffiliates.map(a => (
          <AdminCard key={a.id}>
            <div className="flex items-center gap-3">
              <Avatar name={bn ? a.nameBn : a.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? a.nameBn : a.name}</p>
                <p className="text-label-sm text-on-surface-variant">{toBnDigits(a.mobile, lang)} · {a.email ?? ''}</p>
                {a.promoteNote && <p className="text-label-sm text-on-surface-variant mt-0.5">{bn ? 'প্রচার মাধ্যম:' : 'Channel:'} {a.promoteNote}</p>}
              </div>
            </div>
            <ApproveReject
              onApprove={() => { dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...a, status: 'active' } }); logAction(dispatch, actor, `অ্যাফিলিয়েট আবেদন অনুমোদন করেছেন: ${a.nameBn}`, 'general'); }}
              onReject={() => { dispatch({ type: 'UPDATE_AFFILIATE', affiliate: { ...a, status: 'inactive' } }); logAction(dispatch, actor, `অ্যাফিলিয়েট আবেদন বাতিল করেছেন: ${a.nameBn}`, 'general'); }}
            />
          </AdminCard>
        ))}
        {pendingAffiliates.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো অ্যাফিলিয়েট আবেদন নেই' : 'No affiliate applications'}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/admin/riders')} className="h-11 rounded-xl border-2 border-primary text-primary text-label-md font-bold">
          {bn ? 'রাইডার ব্যবস্থাপনা' : 'Rider Management'}
        </button>
        <button onClick={() => navigate('/admin/affiliates')} className="h-11 rounded-xl border-2 border-primary text-primary text-label-md font-bold">
          {bn ? 'অ্যাফিলিয়েট ব্যবস্থাপনা' : 'Affiliate Management'}
        </button>
      </div>
    </div>
  );
}
