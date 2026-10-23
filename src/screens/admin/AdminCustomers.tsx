import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import {
  AdminCard, Avatar, Field, Icon, PageTitle, SectionHead, StatusBadge, ToggleRow,
  buildCustomers, customerCode, fmtDate, fmtTk, inputCls, logAction, toBnDigits,
  useActorName, useBn, PROBLEM_LABELS,
} from './adminShared';
import { areaName } from '../../services/orderUtils';

// H11 — Customers & subscriptions. Built from design
// 11._customers_subscriptions_jovro: header stats (নিবন্ধিত
// কাস্টমার / মাসিক পাস আগ্রহ), customer list with call buttons,
// the "আমি আগ্রহী" interest list, and the মাসিক পাস প্ল্যান
// কনফিগারেশন card (price, free deliveries, plan status, Save).
export function AdminCustomers() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const settings = state.adminSettings;
  const [query, setQuery] = useState('');
  const [price, setPrice] = useState(String(settings.passPrice));
  const [deliveries, setDeliveries] = useState(String(settings.passDeliveries));
  const [planSaved, setPlanSaved] = useState(false);

  const customers = useMemo(
    () => buildCustomers(state.orders, state.problemReports),
    [state.orders, state.problemReports],
  );
  const filtered = query.trim()
    ? customers.filter(c =>
        c.name.includes(query.trim()) || c.mobile.includes(query.trim()) ||
        customerCode(c.id).toLowerCase().includes(query.trim().toLowerCase()))
    : customers;

  const savePlan = () => {
    dispatch({
      type: 'UPDATE_ADMIN_SETTINGS',
      settings: { ...settings, passPrice: Number(price) || 0, passDeliveries: Number(deliveries) || 0 },
    });
    logAction(dispatch, actor, `মাসিক পাস প্ল্যান আপডেট করেছেন (মূল্য ${fmtTk(Number(price) || 0, 'en')}, ${deliveries}টি ফ্রি ডেলিভারি)`, 'general');
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="group"
        titleBn="কাস্টমার ও সাবস্ক্রিপশন"
        titleEn="Customers & Subscriptions"
        subBn="Customers & Subscriptions • অ্যাডমিন প্যানেল"
        subEn="Customers & Subscriptions • Admin Panel"
        right={
          <span className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
            <Icon name="refresh" className="text-[17px]" />
          </span>
        }
      />

      {/* Header stats — design 11 */}
      <div className="grid grid-cols-2 gap-3">
        <AdminCard className="p-3.5 text-center">
          <p className="text-label-md text-on-surface-variant">{bn ? 'নিবন্ধিত কাস্টমার' : 'Registered customers'}</p>
          <p className="text-headline-md font-bold text-on-surface mt-1">{toBnDigits(customers.length, lang)}</p>
        </AdminCard>
        <AdminCard className="p-3.5 text-center">
          <p className="text-label-md text-on-surface-variant">{bn ? 'মাসিক পাস আগ্রহ' : 'Pass interest'}</p>
          <p className="text-headline-md font-bold text-primary mt-1">{toBnDigits(settings.subscriptionInterests.length, lang)}</p>
        </AdminCard>
      </div>

      {/* Customer list — design 11 */}
      <SectionHead
        icon="group"
        titleBn="নিবন্ধিত গ্রাহক তালিকা"
        titleEn="Registered Customers"
        right={<span className="text-label-sm text-on-surface-variant">{toBnDigits(customers.length, lang)} {bn ? 'জন সক্রিয়' : 'active'}</span>}
      />
      <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
        <Icon name="search" className="text-on-surface-variant text-[20px]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={bn ? 'নাম, মোবাইল বা কাস্টমার আইডি খুঁজুন' : 'Search name, mobile or customer ID'}
          className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
        />
        <Icon name="filter_list" className="text-on-surface-variant text-[19px]" />
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map(c => (
          <AdminCard key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)}>
            <div className="flex items-center gap-3">
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface truncate">
                  {c.name}
                  <span className={clsx('ml-2 text-label-sm font-semibold px-2 py-0.5 rounded-full', c.orders.length >= 3 ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700')}>
                    {c.orders.length >= 3 ? (bn ? 'নিয়মিত গ্রাহক' : 'Regular') : (bn ? 'নতুন কাস্টমার' : 'New')}
                  </span>
                </p>
                <p className="text-label-md text-on-surface-variant mt-0.5">{toBnDigits(c.mobile, lang)} · {customerCode(c.id)}</p>
              </div>
              <a href={`tel:${c.mobile}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
                <Icon name="call" className="text-[16px]" />{bn ? 'কল করুন' : 'Call'}
              </a>
            </div>
            <div className="flex items-center gap-4 mt-2.5 text-label-md text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Icon name="home_pin" className="text-[15px]" />{c.areaId ? areaName(state.areas, c.areaId, lang) : '—'}
              </span>
              <span>{bn ? 'মোট অর্ডার:' : 'Total orders:'} <b className="text-on-surface">{toBnDigits(c.orders.length, lang)}{bn ? 'টি' : ''}</b></span>
              {c.lastOrderAt && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="schedule" className="text-[15px]" />{bn ? 'শেষ অর্ডার:' : 'Last:'} {fmtDate(c.lastOrderAt, lang)}
                </span>
              )}
              {c.openComplaints > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-secondary">
                  <Icon name="report_problem" className="text-[15px]" />{toBnDigits(c.openComplaints, lang)}
                </span>
              )}
            </div>
          </AdminCard>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-6">{bn ? 'কোনো কাস্টমার পাওয়া যায়নি' : 'No customers found'}</p>
        )}
      </div>

      {/* Subscription interest — design 11 */}
      <AdminCard className="flex flex-col gap-3">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="loyalty" className="text-primary text-[20px]" />
          {bn ? 'নতুন আবেদন' : 'New Applications'}
          <span className="text-label-sm font-normal text-on-surface-variant">Lalmonirhat Sadar</span>
        </p>
        <p className="text-body-sm text-on-surface-variant">
          {toBnDigits(settings.subscriptionInterests.length, lang)} {bn ? 'জন গ্রাহক মাসিক পাসের জন্য আবেদন করেছেন' : 'customers applied for the monthly pass'}
          <span className="block text-label-sm mt-0.5">{bn ? '"আমি আগ্রহী" বাটন থেকে সাম্প্রতিক আসা কাস্টমার রিকোয়েস্ট' : 'Recent requests from the "I\'m interested" button'}</span>
        </p>
        {settings.subscriptionInterests.map(i => (
          <div key={i.id} className="rounded-2xl bg-surface-container p-3.5">
            <div className="flex items-center gap-2">
              <p className="text-body-md font-bold text-on-surface flex-1">{i.name}</p>
              <span className="text-label-sm font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{bn ? 'অপেক্ষমাণ' : 'Pending'}</span>
            </div>
            <p className="text-label-md text-on-surface-variant mt-1">{toBnDigits(i.mobile, lang)} · {bn ? 'আবেদন:' : 'Applied:'} {fmtDate(i.requestedAt, lang)}</p>
            <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
              <Icon name="pin_drop" className="text-[14px]" />{bn ? 'লোকেশন:' : 'Location:'} {i.areaId ? areaName(state.areas, i.areaId, lang) : 'সদর'}, সদর
            </p>
            <a href={`tel:${i.mobile}`} className="mt-2 inline-flex items-center gap-1.5 text-label-md font-bold text-primary">
              <Icon name="phone_in_talk" className="text-[16px]" />{bn ? 'কল করে নিশ্চিত করুন' : 'Call to confirm'}
            </a>
          </div>
        ))}
        {settings.subscriptionInterests.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো আবেদন নেই' : 'No applications'}</p>
        )}
      </AdminCard>

      {/* Plan configuration — design 11 */}
      <AdminCard className="flex flex-col gap-4">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="admin_panel_settings" className="text-primary text-[20px]" />
          {bn ? 'মাসিক পাস প্ল্যান কনফিগারেশন' : 'Monthly Pass Configuration'}
          <span className="block text-label-sm font-normal text-on-surface-variant">Delivery Pass Configuration & Rules · {bn ? 'সদর জোন' : 'Sadar Zone'}</span>
        </p>
        <div className="flex items-center justify-between bg-surface-container rounded-xl px-3 py-2.5">
          <span className="text-body-sm text-on-surface-variant">{bn ? 'প্যাকেজ নাম (Package Name)' : 'Package Name'}</span>
          <span className="text-body-md font-bold text-on-surface inline-flex items-center gap-1">
            {bn ? 'মাসিক ডেলিভারি পাস' : 'Monthly Delivery Pass'}<Icon name="edit" className="text-[15px] text-primary" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field labelBn="মাসিক মূল্য (Price)" labelEn="Monthly Price">
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
              <span className="font-bold text-on-surface-variant">৳</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-body-md font-bold text-on-surface min-w-0" />
            </div>
          </Field>
          <Field labelBn="ফ্রি ডেলিভারি সংখ্যা" labelEn="Free deliveries included">
            <input type="number" value={deliveries} onChange={e => setDeliveries(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <ToggleRow
          titleBn="প্ল্যান স্ট্যাটাস (Plan Status)" titleEn="Plan Status"
          subBn={settings.passActive ? 'চালু আছে / Active' : 'বন্ধ আছে'} subEn={settings.passActive ? 'Active' : 'Off'}
          checked={settings.passActive}
          onChange={v => dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, passActive: v } })}
        />
        <button onClick={savePlan} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2">
          <Icon name="save" className="text-[19px]" />{bn ? 'প্ল্যান আপডেট করুন / Save Plan' : 'Save Plan'}
        </button>
        {planSaved && (
          <p className="text-label-md font-semibold text-emerald-700 flex items-center gap-1.5 justify-center">
            <Icon name="check_circle" className="text-[16px]" />{bn ? 'প্ল্যান সেটিংস সফলভাবে আপডেট হয়েছে!' : 'Plan settings updated!'}
          </p>
        )}
      </AdminCard>
    </div>
  );
}

// H18 — Customer 360°. Built from design qs3._customer_360_view_jovro:
// profile header (avatar, ID, verified), Call/WhatsApp/SMS
// buttons, phone + zone + saved address + rider note, stat
// chips (মোট অর্ডার / মোট কেনাকাটা / খোলা অভিযোগ / সাবস্ক্রিপশন),
// problem reports, order history, customer reviews.
export function AdminCustomer360() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;

  const customers = useMemo(
    () => buildCustomers(state.orders, state.problemReports),
    [state.orders, state.problemReports],
  );
  const customer = customers.find(c => c.id === id);

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon name="search_off" className="text-[48px] text-on-surface-variant/50" />
        <p className="text-body-lg text-on-surface-variant">{bn ? 'কাস্টমার পাওয়া যায়নি' : 'Customer not found'}</p>
        <button onClick={() => navigate('/admin/customers')} className="text-primary font-semibold">{bn ? 'তালিকায় ফিরুন' : 'Back to list'}</button>
      </div>
    );
  }

  const reports = state.problemReports.filter(r => r.customerId === customer.id);
  const reviews = state.reviews.filter(r => r.customerId === customer.id);
  const savedAddress = state.addresses.find(a => a.userId === customer.id && a.isDefault)
    ?? state.addresses.find(a => a.userId === customer.id);
  const address = savedAddress?.fullAddress ?? customer.address ?? '—';
  const riderNote = customer.orders.find(o => o.orderNote)?.orderNote;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const waNumber = customer.mobile.replace(/^0/, '880');

  const stats = [
    { icon: 'shopping_basket', labelBn: 'মোট অর্ডার', labelEn: 'Total Orders', value: `${toBnDigits(customer.orders.length, lang)}${bn ? 'টি' : ''}` },
    { icon: 'payments', labelBn: 'মোট কেনাকাটা', labelEn: 'Total Spent', value: fmtTk(customer.totalSpent, lang) },
    { icon: 'report_problem', labelBn: 'খোলা অভিযোগ', labelEn: 'Open Complaints', value: `${toBnDigits(customer.openComplaints, lang)}${bn ? 'টি' : ''}`, alert: customer.openComplaints > 0 },
    { icon: 'loyalty', labelBn: 'সাবস্ক্রিপশন', labelEn: 'Subscription', value: customer.hasPass ? (bn ? 'সুপার সেভার পাস ● সক্রিয়' : 'Pass ● Active') : (bn ? 'নেই' : 'None') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/customers')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'কাস্টমার ৩৬০° ভিউ' : 'Customer 360° View'} · Admin Hub
      </button>

      {/* Profile header — qs3 */}
      <AdminCard>
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold text-headline-sm">
            {customer.name.charAt(0)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-headline-sm font-bold text-on-surface">{customer.name}</p>
            <p className="text-label-md text-on-surface-variant">ID: {customerCode(customer.id)} · {customer.areaId ? areaName(state.areas, customer.areaId, lang) : ''}</p>
            <p className="text-label-sm text-primary font-semibold inline-flex items-center gap-1 mt-0.5">
              <Icon name="verified" className="text-[14px]" />{bn ? 'নিয়মিত স্থানীয় ক্রেতা (Verified)' : 'Verified local customer'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <a href={`tel:${customer.mobile}`} className="h-10 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
            <Icon name="call" className="text-[17px]" />{bn ? 'কল করুন' : 'Call'}
          </a>
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-emerald-600 text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5">
            <Icon name="chat" className="text-[17px]" />WhatsApp
          </a>
          <a href={`sms:${customer.mobile}`} className="h-10 rounded-xl bg-surface-container text-on-surface text-label-md font-bold inline-flex items-center justify-center gap-1.5">
            <Icon name="sms" className="text-[17px]" />{bn ? 'SMS পাঠান' : 'SMS'}
          </a>
        </div>
        <div className="flex flex-col gap-2 mt-4 text-body-sm">
          <p className="flex gap-2"><Icon name="smartphone" className="text-primary text-[18px]" /><span>{bn ? 'প্রাথমিক ফোন:' : 'Primary phone:'} {toBnDigits(customer.mobile, lang)}</span></p>
          <p className="flex gap-2"><Icon name="location_on" className="text-primary text-[18px]" /><span>{bn ? 'ডেলিভারি এরিয়া / Zone:' : 'Delivery Zone:'} {customer.areaId ? areaName(state.areas, customer.areaId, lang) : '—'}, সদর</span></p>
          <p className="flex gap-2"><Icon name="home_pin" className="text-primary text-[18px]" /><span>{bn ? 'সংরক্ষিত পূর্ণ ঠিকানা:' : 'Saved address:'} {address}</span></p>
          {riderNote && (
            <p className="flex gap-2"><Icon name="sticky_note_2" className="text-secondary text-[18px]" /><span>{bn ? 'রাইডারদের জন্য নোট:' : 'Note for riders:'} “{riderNote}”</span></p>
          )}
          {customer.joinedAt && (
            <p className="flex gap-2"><Icon name="calendar_month" className="text-primary text-[18px]" /><span>{bn ? 'সদস্য হওয়ার তারিখ:' : 'Joined:'} {fmtDate(customer.joinedAt, lang)}</span></p>
          )}
        </div>
      </AdminCard>

      {/* Stat chips — qs3 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.labelEn} className={clsx('rounded-2xl border p-3.5 shadow-card', s.alert ? 'bg-orange-50 border-secondary/40' : 'bg-surface-container-lowest border-outline-variant/40')}>
            <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
              <Icon name={s.icon} className={clsx('text-[16px]', s.alert ? 'text-secondary' : 'text-primary')} />{bn ? s.labelBn : s.labelEn}
            </p>
            <p className="text-body-lg font-bold text-on-surface mt-1">{s.value}{s.alert ? <span className="text-label-sm text-secondary"> ({bn ? 'জরুরি' : 'urgent'})</span> : null}</p>
          </div>
        ))}
      </div>

      {/* Problem reports — qs3 */}
      <SectionHead icon="report_problem" titleBn="খোলা ও পূর্বের অভিযোগ (Problem Reports)" titleEn="Problem Reports" />
      <div className="flex flex-col gap-2.5">
        {reports.map(r => (
          <AdminCard key={r.id} onClick={() => navigate(`/admin/problems/${r.id}`)}>
            <div className="flex items-center gap-2">
              <p className="text-body-md font-bold text-on-surface">{r.id.toUpperCase()}</p>
              <span className="text-label-sm bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant">Order #{r.orderId}</span>
              <span className={clsx('ml-auto text-label-sm font-bold px-2 py-0.5 rounded-full', r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {r.status === 'resolved' ? (bn ? 'মীমাংসা হয়েছে' : 'Resolved') : (bn ? 'তদন্তাধীন / Investigating' : 'Investigating')}
              </span>
            </div>
            <p className="text-body-sm font-medium text-on-surface mt-1.5">{bn ? PROBLEM_LABELS[r.problemType].bn : PROBLEM_LABELS[r.problemType].en}</p>
            <p className="text-label-md text-on-surface-variant mt-0.5">{bn ? r.descriptionBn : (r.descriptionEn ?? r.descriptionBn)}</p>
            <p className="text-label-md font-bold text-secondary mt-2 inline-flex items-center gap-1">
              <Icon name="currency_exchange" className="text-[15px]" />{bn ? 'রিফান্ড দিন / সমাধান করুন' : 'Refund / Resolve'}<Icon name="arrow_forward" className="text-[14px]" />
            </p>
          </AdminCard>
        ))}
        {reports.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো অভিযোগ নেই' : 'No problem reports'}</p>}
      </div>

      {/* Order history — qs3 */}
      <SectionHead icon="receipt_long" titleBn="অর্ডার হিস্ট্রি (Order History)" titleEn="Order History" />
      <div className="flex flex-col gap-2.5">
        {customer.orders.map(o => (
          <AdminCard key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
            <div className="flex items-center gap-2">
              <p className="text-body-md font-bold text-on-surface">#{o.id}</p>
              {o.hasComplaint && <span className="text-label-sm font-bold bg-orange-100 text-secondary px-2 py-0.5 rounded-full">{bn ? 'অভিযোগ আছে' : 'Has complaint'}</span>}
              <StatusBadge status={o.status} />
              <span className="ml-auto text-body-md font-bold text-on-surface">{fmtTk(o.finalTotal, lang)}</span>
            </div>
            <p className="text-label-md text-on-surface-variant mt-1">
              {fmtDate(o.createdAt, lang)} • {toBnDigits(o.items.length, lang)} {bn ? 'টি আইটেম' : 'items'} · {o.items.map(i => bn ? i.nameBn : i.nameEn).slice(0, 3).join(', ')}
            </p>
            <p className="text-label-md font-semibold text-primary mt-1.5 inline-flex items-center gap-1">
              {bn ? 'বিস্তারিত দেখুন' : 'View details'}<Icon name="arrow_forward" className="text-[14px]" />
            </p>
          </AdminCard>
        ))}
        {customer.orders.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো অর্ডার নেই' : 'No orders yet'}</p>}
      </div>

      {/* Reviews — qs3 */}
      <SectionHead
        icon="star"
        titleBn="গ্রাহকের রিভিউ ও রেটিং (Customer Reviews)"
        titleEn="Customer Reviews"
        right={avgRating ? <span className="text-label-md font-bold text-on-surface">{bn ? 'গড়' : 'Avg'} {toBnDigits(avgRating, lang)} ★</span> : undefined}
      />
      <div className="flex flex-col gap-2.5">
        {reviews.map(r => (
          <AdminCard key={r.id}>
            <div className="flex items-center gap-2">
              <span className="text-body-md font-bold text-on-surface">{toBnDigits(r.rating.toFixed(1), lang)}</span>
              <span className="flex">{Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" className={clsx('text-[15px]', i < r.rating ? 'text-amber-500 filled-symbol' : 'text-outline-variant')} />
              ))}</span>
              <span className="ml-auto text-label-sm text-on-surface-variant">Order #{r.orderId} · {fmtDate(r.createdAt, lang)}</span>
            </div>
            <p className="text-body-sm text-on-surface mt-1.5">“{bn ? r.commentBn : (r.commentEn ?? r.commentBn)}”</p>
          </AdminCard>
        ))}
        {reviews.length === 0 && <p className="text-body-sm text-on-surface-variant">{bn ? 'কোনো রিভিউ নেই' : 'No reviews'}</p>}
      </div>

      <button onClick={() => navigate('/admin/activity')} className="text-label-md text-on-surface-variant inline-flex items-center gap-1.5 justify-center py-1">
        <Icon name="lock_person" className="text-[16px]" />
        {bn ? 'অ্যাডমিন অ্যাকশন লগ সংরক্ষিত হচ্ছে · লগ দেখুন' : 'Admin actions are logged · View log'}
      </button>
    </div>
  );
}
