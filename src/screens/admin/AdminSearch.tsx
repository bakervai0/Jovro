import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import {
  AdminCard, Icon, PageTitle, StatusBadge, PROBLEM_LABELS, buildCustomers, customerCode,
  fmtDate, fmtTk, fmtTime, toBnDigits, useBn,
} from './adminShared';
import { areaName } from '../../services/orderUtils';

// H17 + H19 — Admin quick search. Built from design
// qs2._admin_quick_search_lookup_jovro: search box with type
// chips (অর্ডার আইডি / কাস্টমার আইডি / মোবাইল), open-complaint
// alert on top, customer card, then recent orders; the empty
// state uses the spec's exact wording. An exact Order ID goes
// straight to the H4 order detail (H19).
export default function AdminSearch() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [searched, setSearched] = useState(params.get('q') ?? '');

  const q = searched.trim();
  const qNorm = q.toLowerCase().replace(/^#/, '');
  const qDigits = q.replace(/\D/g, '');

  const customers = useMemo(
    () => buildCustomers(state.orders, state.problemReports),
    [state.orders, state.problemReports],
  );

  const matchedCustomer = useMemo(() => {
    if (!q) return undefined;
    return customers.find(c =>
      c.id.toLowerCase() === qNorm ||
      customerCode(c.id).toLowerCase() === qNorm ||
      (qDigits.length >= 6 && c.mobile.replace(/\D/g, '').includes(qDigits)) ||
      c.name.includes(q),
    );
  }, [customers, q, qNorm, qDigits]);

  const matchedOrders = useMemo(() => {
    if (!q) return [];
    if (matchedCustomer) return matchedCustomer.orders;
    return state.orders.filter(o =>
      o.id.toLowerCase().includes(qNorm) ||
      (qDigits.length >= 6 && o.customerMobile.replace(/\D/g, '').includes(qDigits)) ||
      o.customerName.includes(q),
    );
  }, [state.orders, matchedCustomer, q, qNorm, qDigits]);

  const openReport = matchedCustomer
    ? state.problemReports.find(r => r.customerId === matchedCustomer.id && r.status !== 'resolved')
    : state.problemReports.find(r => matchedOrders.some(o => o.id === r.orderId) && r.status !== 'resolved');

  const hasResults = !!matchedCustomer || matchedOrders.length > 0;

  const submit = () => {
    const v = query.trim();
    const exact = state.orders.find(o => o.id.toLowerCase() === v.toLowerCase().replace(/^#/, ''));
    if (exact) { navigate(`/admin/orders/${exact.id}`); return; } // H19
    setSearched(v);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="manage_search"
        titleBn="অ্যাডমিন কুইক সার্চ"
        titleEn="Quick Lookup"
        subBn="লালমনিরহাট সদর হাব (Lalmonirhat Sadar Hub) · লাইভ এডমিন"
        subEn="Lalmonirhat Sadar Hub · Live admin"
      />

      {/* Search box + type chips — qs2 */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-3 shadow-card">
        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
          <Icon name="search" className="text-on-surface-variant text-[20px]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={bn ? 'অর্ডার আইডি, কাস্টমার আইডি বা মোবাইল' : 'Order ID, Customer ID or mobile'}
            className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearched(''); }} aria-label="clear">
              <Icon name="close" className="text-on-surface-variant text-[19px]" />
            </button>
          )}
          <button onClick={submit} className="text-label-md font-bold text-primary flex-shrink-0">{bn ? 'খুঁজুন' : 'Search'}</button>
        </div>
        <div className="flex gap-2 mt-2.5">
          {[
            { icon: 'receipt_long', bn: 'অর্ডার আইডি / Order ID', en: 'Order ID', active: /^jv/i.test(qNorm) },
            { icon: 'badge', bn: 'কাস্টমার আইডি / Customer ID', en: 'Customer ID', active: /^(u|cus)-/i.test(qNorm) },
            { icon: 'phone_android', bn: 'মোবাইল / Mobile', en: 'Mobile', active: qDigits.length >= 6 },
          ].map(c => (
            <span key={c.icon} className={clsx('inline-flex items-center gap-1 text-label-sm rounded-full px-2 py-1 border',
              c.active && q ? 'bg-primary/10 text-primary border-primary/40 font-bold' : 'text-on-surface-variant border-outline-variant/50')}>
              <Icon name={c.icon} className="text-[13px]" />{bn ? c.bn : c.en}
              {c.active && q && <Icon name="check" className="text-[13px]" />}
            </span>
          ))}
        </div>
      </div>

      {q && !hasResults && (
        /* Empty state — spec wording (qs2 fallback preview) */
        <div className="flex flex-col items-center text-center gap-3 py-10 px-6">
          <span className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
            <Icon name="search_off" className="text-[40px] text-on-surface-variant/60" />
          </span>
          <h3 className="text-headline-sm font-bold text-on-surface">
            {bn ? 'কিছু পাওয়া যায়নি — নাম্বারটা আবার শুনে নিন' : 'Nothing found — please ask for the number again'}
          </h3>
          <p className="text-body-md text-on-surface-variant">
            {bn ? 'কিছু পাওয়া যায়নি / Nothing found — নাম্বারটা কাস্টমার থেকে আবার শুনে নিন অথবা সঠিক ১১ ডিজিট ডায়াল করুন' : 'Check the number with the customer or dial the correct 11 digits'}
          </p>
          <div className="flex gap-2 mt-1">
            <button onClick={() => { setQuery(''); setSearched(''); }} className="h-11 px-4 rounded-xl bg-primary text-white text-label-lg font-bold inline-flex items-center gap-1.5">
              <Icon name="refresh" className="text-[17px]" />{bn ? 'নতুন করে খুঁজুন' : 'Search again'}
            </button>
            <button onClick={() => navigate('/admin/customers')} className="h-11 px-4 rounded-xl border-2 border-primary text-primary text-label-lg font-bold inline-flex items-center gap-1.5">
              <Icon name="person_add" className="text-[17px]" />{bn ? 'নতুন কাস্টমার যোগ' : 'Add customer'}
            </button>
          </div>
          <p className="text-label-sm text-on-surface-variant/70 flex items-center gap-1 mt-2">
            <Icon name="support_agent" className="text-[14px]" />{bn ? 'অ্যাডমিন গাইড' : 'Admin guide'}
          </p>
        </div>
      )}

      {q && hasResults && (
        <>
          {/* Open complaint alert — qs2 */}
          {openReport && (
            <div className="rounded-2xl border-2 border-secondary/50 bg-orange-50 p-4">
              <p className="text-body-md font-bold text-secondary flex items-center gap-2">
                <Icon name="warning" className="text-[20px]" />
                {bn ? 'খোলা অভিযোগ' : 'Open Complaint'} (#{openReport.id.toUpperCase()})
              </p>
              <p className="text-body-sm text-on-surface mt-1.5">
                {bn ? 'অর্ডার' : 'Order'} #{openReport.orderId} · {fmtDate(openReport.createdAt, lang)} {fmtTime(openReport.createdAt, lang)}
              </p>
              <p className="text-body-sm text-on-surface mt-1">
                {bn ? 'অভিযোগের ধরন:' : 'Issue:'} {bn ? PROBLEM_LABELS[openReport.problemType].bn : PROBLEM_LABELS[openReport.problemType].en}
                {' — '}{bn ? openReport.descriptionBn : (openReport.descriptionEn ?? openReport.descriptionBn)}
              </p>
              <p className="text-label-md font-semibold text-error flex items-center gap-1 mt-2">
                <Icon name="report_problem" className="text-[15px]" />{bn ? 'তাত্ক্ষণিক ব্যবস্থা প্রয়োজন' : 'Immediate action needed'}
              </p>
              <button
                onClick={() => navigate(`/admin/problems/${openReport.id}`)}
                className="mt-2 inline-flex items-center gap-1.5 bg-secondary text-white text-label-md font-bold rounded-full px-3.5 py-2"
              >
                {bn ? 'অভিযোগ সমাধান করুন' : 'Resolve complaint'}<Icon name="arrow_forward" className="text-[15px]" />
              </button>
            </div>
          )}

          {/* Customer card — qs2 */}
          {matchedCustomer && (
            <AdminCard>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold text-body-lg">
                  {matchedCustomer.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-lg font-bold text-on-surface">
                    {matchedCustomer.name}
                    <span className="ml-2 text-label-md font-semibold text-on-surface-variant">{customerCode(matchedCustomer.id)}</span>
                  </p>
                  <p className="text-label-sm text-primary font-semibold inline-flex items-center gap-1">
                    <Icon name="verified" className="text-[14px]" />{bn ? 'ভেরিফাইড কাস্টমার' : 'Verified customer'}
                  </p>
                </div>
                <a href={`tel:${matchedCustomer.mobile}`} className="inline-flex items-center gap-1.5 bg-primary text-white text-label-md font-semibold rounded-full px-3 py-2">
                  <Icon name="call" className="text-[15px]" />{bn ? 'কল করুন' : 'Call'}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-3.5 text-body-sm">
                <p className="flex gap-2"><Icon name="phone_android" className="text-primary text-[18px]" /><span>{bn ? 'মোবাইল নাম্বার:' : 'Phone:'}<br /><b>{toBnDigits(matchedCustomer.mobile, lang)}</b></span></p>
                <p className="flex gap-2"><Icon name="location_on" className="text-primary text-[18px]" /><span>{bn ? 'এলাকা ও লোকেশন:' : 'Area:'}<br /><b>{matchedCustomer.areaId ? areaName(state.areas, matchedCustomer.areaId, lang) : '—'}, সদর</b></span></p>
                <p className="flex gap-2"><Icon name="shopping_bag" className="text-primary text-[18px]" /><span>{bn ? 'মোট সম্পন্ন অর্ডার:' : 'Total orders:'}<br /><b>{toBnDigits(matchedCustomer.orders.filter(o => o.status === 'delivered').length, lang)}{bn ? 'টি সফল অর্ডার' : ' successful'}</b></span></p>
                <p className="flex gap-2"><Icon name="payments" className="text-primary text-[18px]" /><span>{bn ? 'মোট কেনাকাটা:' : 'Total spent:'}<br /><b>{fmtTk(matchedCustomer.totalSpent, lang)} (LTV)</b></span></p>
              </div>
              <button
                onClick={() => navigate(`/admin/customers/${matchedCustomer.id}`)}
                className="mt-3.5 w-full h-11 rounded-xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2"
              >
                {bn ? 'কাস্টমার প্রোফাইল দেখুন (360° View)' : 'Customer Profile (360° View)'}<Icon name="arrow_forward" className="text-[17px]" />
              </button>
            </AdminCard>
          )}

          {/* Orders — qs2 "সাম্প্রতিক অর্ডারসমূহ" */}
          <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="history" className="text-primary text-[19px]" />
            {bn ? 'সাম্প্রতিক অর্ডারসমূহ (Recent Orders)' : 'Recent Orders'}
            <span className="ml-auto text-label-sm font-normal text-on-surface-variant">{toBnDigits(matchedOrders.length, lang)}{bn ? 'টি অর্ডার প্রদর্শিত' : ' orders shown'}</span>
          </p>
          <div className="flex flex-col gap-2.5">
            {matchedOrders.map(o => (
              <AdminCard key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                <div className="flex items-center gap-2">
                  <p className="text-body-md font-bold text-on-surface">#{o.id}</p>
                  {o.hasComplaint && (
                    <span className="text-label-sm font-bold bg-orange-100 text-secondary px-2 py-0.5 rounded-full">{bn ? 'অভিযোগযুক্ত / Has Complaint' : 'Has Complaint'}</span>
                  )}
                  <StatusBadge status={o.status} />
                  <span className="ml-auto text-body-md font-bold text-on-surface">{fmtTk(o.finalTotal, lang)}</span>
                </div>
                <p className="text-label-md text-on-surface-variant mt-1">
                  {fmtDate(o.createdAt, lang)} • {toBnDigits(o.items.length, lang)} {bn ? 'টি আইটেম' : 'items'} • {o.items.map(i => bn ? i.nameBn : i.nameEn).slice(0, 3).join(', ')}
                </p>
                <p className="text-label-md text-on-surface-variant">{o.customerName} · {toBnDigits(o.customerMobile, lang)}</p>
                <p className="text-label-md font-semibold text-primary mt-1.5">{bn ? 'ডিটেইলস' : 'Details'}</p>
              </AdminCard>
            ))}
          </div>
        </>
      )}

      {!q && (
        <p className="text-center text-body-md text-on-surface-variant py-8">
          {bn ? 'কুইক সার্চ দিয়ে যেকোনো অর্ডার, কাস্টমার বা মোবাইল নম্বর খুঁজুন' : 'Search any order, customer or mobile number'}
        </p>
      )}
    </div>
  );
}
