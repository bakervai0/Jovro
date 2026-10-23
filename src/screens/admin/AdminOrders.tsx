import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { Order, OrderStatus } from '../../types';
import {
  AdminCard, Field, Icon, PageTitle, StatusBadge, fmtTk, fmtTime, logAction,
  toBnDigits, useActorName, useBn, ORDER_STATUS_OPTIONS,
} from './adminShared';
import { STATUS_META, areaName, isActiveOrder, todayOrders } from '../../services/orderUtils';

// H3 — Orders & rider assignment.
// Built from designs: a1.2_orders_rider_assignment_jovro
// (summary strip, filter chips with counts, order cards with
// assign/change rider) and 2._orders_management_detail_jovro
// (chip row সব/নতুন/কেনা হচ্ছে/রওনা হয়েছে/পৌঁছে গেছে/বাতিল/ব্যর্থ).
type Filter = 'all' | 'unassigned' | OrderStatus;

export function AdminOrdersList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const todays = todayOrders(state.orders);
  const activeCount = state.orders.filter(isActiveOrder).length;
  const todayTotal = todays.reduce((s, o) => s + o.finalTotal, 0);
  const activeRiders = state.riders.filter(r => r.status === 'active');

  const chips: { id: Filter; bn: string; en: string }[] = [
    { id: 'all', bn: 'সব', en: 'All' },
    { id: 'pending', bn: 'নতুন', en: 'New' },
    { id: 'unassigned', bn: 'রাইডার দেওয়া হয়নি', en: 'Unassigned' },
    { id: 'buying', bn: 'কেনা হচ্ছে', en: 'Buying' },
    { id: 'on-the-way', bn: 'রওনা হয়েছে', en: 'On the way' },
    { id: 'delivered', bn: 'পৌঁছে গেছে', en: 'Delivered' },
    { id: 'cancelled', bn: 'বাতিল', en: 'Cancelled' },
    { id: 'failed', bn: 'ব্যর্থ', en: 'Failed' },
  ];
  const countFor = (f: Filter) =>
    f === 'all' ? state.orders.length
      : f === 'unassigned' ? state.orders.filter(o => !o.riderId && isActiveOrder(o)).length
        : state.orders.filter(o => o.status === f).length;

  const filtered = useMemo(() => {
    let list = [...state.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === 'unassigned') list = list.filter(o => !o.riderId && isActiveOrder(o));
    else if (filter !== 'all') list = list.filter(o => o.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) || o.customerName.includes(query.trim()) ||
        o.customerMobile.includes(query.trim()));
    }
    return list;
  }, [state.orders, filter, query]);

  const assign = (order: Order, riderId: string) => {
    // Empty selection = unassign (the list select's first option);
    // it previously early-returned, so unassign only worked from
    // the order detail's save button.
    const rider = riderId ? state.riders.find(r => r.id === riderId) : undefined;
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, riderId: riderId || undefined, updatedAt: new Date().toISOString() } });
    logAction(dispatch, actor, riderId
      ? `অর্ডার #${order.id}-এ রাইডার ${rider?.nameBn ?? riderId} নিয়োগ দিলেন`
      : `অর্ডার #${order.id} থেকে রাইডার সরিয়ে দিলেন`, 'order');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="receipt_long"
        titleBn="অর্ডার ব্যবস্থাপনা"
        titleEn="Orders Management"
        subBn="All Orders · লালমনিরহাট সদর"
        subEn="All Orders · Lalmonirhat Sadar"
        right={<span className="text-label-sm font-bold text-primary bg-primary/10 rounded-full px-2 py-1">{bn ? 'লাইভ' : 'LIVE'}</span>}
      />

      {/* Summary strip — a1.2 */}
      <div className="rounded-2xl bg-surface-container px-4 py-2.5 flex items-center gap-2 text-label-md text-on-surface-variant">
        <span>{bn ? 'চলতি সক্রিয়:' : 'Active now:'} <b className="text-on-surface">{toBnDigits(activeCount, lang)}{bn ? 'টি' : ''}</b></span>
        <span className="w-1 h-1 rounded-full bg-outline" />
        <span>{bn ? 'আজকের মোট:' : 'Today:'} {toBnDigits(todays.length, lang)} {bn ? 'অর্ডার' : 'orders'} ({fmtTk(todayTotal, lang)})</span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
        <Icon name="search" className="text-on-surface-variant text-[20px]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={bn ? 'অর্ডার, কাস্টমার বা মোবাইল খুঁজুন' : 'Search order, customer or mobile'}
          className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
        />
        <Icon name="tune" className="text-on-surface-variant text-[20px]" />
      </div>

      {/* Filter chips — design 2 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0',
              filter === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant',
            )}
          >
            {bn ? c.bn : c.en} ({toBnDigits(countFor(c.id), lang)})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(o => {
          const rider = state.riders.find(r => r.id === o.riderId);
          return (
            <AdminCard key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
              <div className="flex items-center gap-2">
                <p className="text-body-md font-bold text-on-surface">#{o.id}</p>
                <StatusBadge status={o.status} />
                {o.hasComplaint && <Icon name="report_problem" className="text-secondary text-[18px]" />}
                <span className="ml-auto text-body-md font-bold text-on-surface">{fmtTk(o.finalTotal, lang)}</span>
              </div>
              <p className="text-label-md text-on-surface-variant mt-1">
                {bn ? 'সময়:' : 'Time:'} {fmtTime(o.createdAt, lang)} · {toBnDigits(o.items.length, lang)} {bn ? 'টি পণ্য' : 'items'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Icon name="person" className="text-on-surface-variant text-[18px]" />
                <p className="text-body-sm font-medium text-on-surface flex-1 truncate">{o.customerName}</p>
                <a
                  href={`tel:${o.customerMobile}`}
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-label-md font-semibold text-primary"
                >
                  <Icon name="call" className="text-[16px]" />{bn ? 'কল করুন' : 'Call'}
                </a>
              </div>
              <p className="text-label-md text-on-surface-variant flex items-center gap-1.5 mt-1">
                <Icon name="location_on" className="text-[15px]" />
                {areaName(state.areas, o.deliveryAreaId, lang)} — {o.deliveryAddress}
              </p>
              {/* Rider assignment — a1.2 */}
              <div
                className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/30"
                onClick={e => e.stopPropagation()}
              >
                <Icon name="two_wheeler" className="text-primary text-[20px]" />
                {rider ? (
                  <>
                    <p className="text-body-sm text-on-surface flex-1 truncate">
                      {bn ? 'রাইডার:' : 'Rider:'} <b>{bn ? rider.nameBn : rider.name}</b>
                    </p>
                    <span className="text-label-sm text-on-surface-variant">{bn ? 'বদলান / Change' : 'Change'}</span>
                  </>
                ) : (
                  <p className="text-body-sm font-semibold text-secondary flex-1">
                    {bn ? 'রাইডার দিন / Assign rider' : 'Assign rider'}
                  </p>
                )}
                <select
                  value={o.riderId ?? ''}
                  onChange={e => assign(o, e.target.value)}
                  className="bg-surface-container rounded-lg px-2 py-1.5 text-label-md text-on-surface outline-none max-w-[150px]"
                  aria-label={bn ? 'রাইডার নির্বাচন' : 'Select rider'}
                >
                  <option value="">{bn ? 'রাইডার নির্বাচন করুন' : 'Select rider'}</option>
                  {activeRiders.map(r => (
                    <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name}</option>
                  ))}
                </select>
              </div>
            </AdminCard>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-8">
            {bn ? 'এই ফিল্টারে কোনো অর্ডার নেই' : 'No orders in this filter'}
          </p>
        )}
      </div>
    </div>
  );
}

// H4 + H19 — Admin order detail.
// Built from design 2._orders_management_detail_jovro (detail
// panel: customer + call, marked address, customer note, item
// list, editable Final Bill, Assign Rider, Status, Save) and
// qs4._order_lookup_result_with_complaint_jovro (orange complaint
// banner + rider & delivery timeline).
export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const order = state.orders.find(o => o.id === id);

  const [bill, setBill] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [saved, setSaved] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon name="search_off" className="text-[48px] text-on-surface-variant/50" />
        <p className="text-body-lg text-on-surface-variant">{bn ? 'অর্ডার পাওয়া যায়নি' : 'Order not found'}</p>
        <button onClick={() => navigate('/admin/orders')} className="text-primary font-semibold text-label-lg">
          {bn ? 'অর্ডার তালিকায় ফিরুন' : 'Back to orders'}
        </button>
      </div>
    );
  }

  const finalBill = bill === null ? order.productsTotal : Number(bill) || 0;
  const selRider = riderId === null ? (order.riderId ?? '') : riderId;
  const selStatus = status === null ? order.status : status;
  const activeRiders = state.riders.filter(r => r.status === 'active');
  const report = state.problemReports.find(r => r.orderId === order.id && r.status !== 'resolved');
  const riderBusy = (rid: string) => state.orders.some(o => o.riderId === rid && o.status === 'on-the-way' && o.id !== order.id);

  const save = () => {
    const updated: Order = {
      ...order,
      productsTotal: finalBill,
      finalTotal: finalBill + order.deliveryFee - order.discountAmount,
      riderId: selRider || undefined,
      status: selStatus,
      updatedAt: new Date().toISOString(),
      trackingUpdates: selStatus !== order.status
        ? [...order.trackingUpdates, {
            id: `trk-${Date.now()}`, status: selStatus,
            messageBn: STATUS_META[selStatus].labelBn, messageEn: STATUS_META[selStatus].labelEn,
            timestamp: new Date().toISOString(),
          }]
        : order.trackingUpdates,
    };
    dispatch({ type: 'UPDATE_ORDER', order: updated });
    logAction(dispatch, actor, `অর্ডার #${order.id} আপডেট করেছেন (বিল ${fmtTk(updated.finalTotal, 'en')}, স্ট্যাটাস ${STATUS_META[selStatus].labelBn})`, 'order');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const cancelOrder = () => {
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, status: 'cancelled', updatedAt: new Date().toISOString() } });
    logAction(dispatch, actor, `অর্ডার #${order.id} বাতিল করেছেন`, 'order');
    setStatus('cancelled');
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/orders')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'অর্ডার ব্যবস্থাপনা' : 'Orders Management'}
      </button>
      <PageTitle
        icon="receipt_long"
        titleBn={`অর্ডার #${order.id}`}
        titleEn={`Order #${order.id}`}
        subBn={`অর্ডারের সময়: ${fmtTime(order.createdAt, lang)} • সদর বাজার এক্সপ্রেস`}
        subEn={`Order time: ${fmtTime(order.createdAt, lang)} • Sadar Bazar Express`}
        right={<StatusBadge status={order.status} />}
      />

      {/* H19 — complaint banner (qs4) */}
      {order.hasComplaint && (
        <div className="rounded-2xl border-2 border-secondary-container bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Icon name="report_problem" className="text-secondary text-[26px]" />
            <div className="flex-1">
              <p className="text-body-md font-bold text-secondary">
                {bn ? 'এই অর্ডারে অভিযোগ আছে' : 'This order has a complaint'}
              </p>
              <p className="text-label-md text-on-surface-variant">
                {bn ? 'This order has an active complaint' : 'এই অর্ডারে সক্রিয় অভিযোগ আছে'}
              </p>
              {report && (
                <p className="text-body-sm text-on-surface mt-1.5">
                  <b>{order.customerName}</b> — {bn ? report.descriptionBn : (report.descriptionEn ?? report.descriptionBn)}
                </p>
              )}
              <button
                onClick={() => navigate(report ? `/admin/problems/${report.id}` : '/admin/problems')}
                className="mt-2 inline-flex items-center gap-1 text-label-lg font-bold text-secondary"
              >
                {bn ? 'অভিযোগ সমাধান ও রিফান্ড ফরম দেখুন' : 'Open complaint & refund form'}
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer — design 2 */}
      <AdminCard>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold text-body-lg">
            {order.customerName.charAt(0)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-lg font-bold text-on-surface">{order.customerName}</p>
            <p className="text-label-sm text-on-surface-variant">
              {bn ? 'নিয়মিত গ্রাহক' : 'Regular customer'} · {order.customerId.toUpperCase()} · {bn ? 'ফোন:' : 'Phone:'} {toBnDigits(order.customerMobile, lang)}
            </p>
          </div>
          <a href={`tel:${order.customerMobile}`} className="inline-flex items-center gap-1.5 bg-primary text-white text-label-md font-semibold rounded-full px-3 py-2">
            <Icon name="call" className="text-[16px]" />{bn ? 'কল করুন / Call' : 'Call'}
          </a>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-body-sm">
          <p className="flex gap-2">
            <Icon name="location_on" className="text-primary text-[18px]" />
            <span>{bn ? 'ডেলিভারি এলাকা:' : 'Delivery area:'} {areaName(state.areas, order.deliveryAreaId, lang)}</span>
          </p>
          <p className="flex gap-2">
            <Icon name="home_pin" className="text-primary text-[18px]" />
            <span>{bn ? 'চিহ্নিত ঠিকানা:' : 'Marked address:'} “{order.deliveryAddress}”</span>
          </p>
          {order.orderNote && (
            <p className="flex gap-2">
              <Icon name="edit_note" className="text-secondary text-[18px]" />
              <span>{bn ? 'গ্রাহকের নোট:' : 'Customer note:'} “{order.orderNote}”</span>
            </p>
          )}
          <button
            onClick={() => navigate(`/admin/customers/${order.customerId}`)}
            className="self-start text-label-md font-semibold text-primary inline-flex items-center gap-1 mt-1"
          >
            <Icon name="person" className="text-[15px]" />{bn ? 'কাস্টমার ৩৬০° ভিউ' : 'Customer 360° view'}
          </button>
        </div>
      </AdminCard>

      {/* Items — design 2 */}
      <AdminCard>
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="local_mall" className="text-primary text-[19px]" />
          {bn ? `বাজারের পণ্যের তালিকা (${toBnDigits(order.items.length, lang)}টি পণ্য)` : `Bazaar items (${order.items.length})`}
          <span className="ml-auto text-label-sm font-medium text-on-surface-variant">{bn ? 'আনুমানিক দাম' : 'Approx price'}</span>
        </p>
        <div className="flex flex-col divide-y divide-outline-variant/25 mt-1">
          {order.items.map((it, i) => (
            <div key={it.id} className="flex items-center gap-3 py-2.5">
              <span className="w-6 h-6 rounded-full bg-surface-container text-label-md font-bold text-on-surface-variant flex items-center justify-center">
                {toBnDigits(i + 1, lang)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-on-surface truncate">{bn ? it.nameBn : it.nameEn}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {bn ? 'পরিমাণ:' : 'Qty:'} {toBnDigits(it.quantity, lang)} {it.unit ?? ''} · {fmtTk(it.approxPrice, lang)}/{it.unit ?? (bn ? 'পিস' : 'pc')}
                </p>
              </div>
              <p className="text-body-md font-bold text-on-surface">{fmtTk(it.approxPrice * it.quantity, lang)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-outline-variant/30 mt-1 pt-3 flex flex-col gap-1.5 text-body-sm">
          <p className="flex justify-between"><span className="text-on-surface-variant">{bn ? 'পণ্যের আনুমানিক মোট মূল্য:' : 'Approx products total:'}</span><b>{fmtTk(order.productsTotal, lang)}</b></p>
          <p className="flex justify-between"><span className="text-on-surface-variant">{bn ? 'ডেলিভারি চার্জ (Delivery Fee):' : 'Delivery Fee:'}</span><b>{fmtTk(order.deliveryFee, lang)}</b></p>
          {order.discountAmount > 0 && (
            <p className="flex justify-between text-emerald-700"><span>{bn ? 'ছাড়' : 'Discount'}{order.promoCode ? ` (${order.promoCode})` : ''}:</span><b>−{fmtTk(order.discountAmount, lang)}</b></p>
          )}
        </div>
      </AdminCard>

      {/* Final bill + assign + status — design 2 */}
      <AdminCard className="flex flex-col gap-4">
        <Field labelBn="চূড়ান্ত বিল / Final Bill" labelEn="Final Bill / চূড়ান্ত বিল">
          <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
            <span className="text-body-lg font-bold text-on-surface-variant">৳</span>
            <input
              type="number"
              value={bill === null ? order.productsTotal : bill}
              onChange={e => setBill(e.target.value)}
              className="flex-1 py-2.5 bg-transparent outline-none text-body-lg font-bold text-on-surface min-w-0"
            />
            <span className="text-label-sm text-on-surface-variant">BDT (টাকা)</span>
          </div>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
            <Icon name="info" className="text-[14px]" />
            {bn ? 'চূড়ান্ত দাম বাজারের রসিদ অনুযায়ী সমন্বয় করা যাবে।' : 'Final price can be adjusted to the bazaar receipt.'}
          </p>
        </Field>

        <Field labelBn="রাইডার নিয়োগ / Assign Rider" labelEn="Assign Rider / রাইডার নিয়োগ">
          <select
            value={selRider}
            onChange={e => setRiderId(e.target.value)}
            className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none"
          >
            <option value="">{bn ? 'রাইডার দেওয়া হয়নি / Not assigned' : 'Not assigned'}</option>
            {activeRiders.map(r => (
              <option key={r.id} value={r.id}>
                {bn ? r.nameBn : r.name} ({riderBusy(r.id) ? (bn ? 'ব্যস্ত' : 'Busy') : (bn ? 'ফ্রি আছেন' : 'Free')} - {areaName(state.areas, r.areaId ?? '', lang)})
              </option>
            ))}
          </select>
        </Field>

        <Field labelBn="অর্ডার স্ট্যাটাস / Status" labelEn="Order Status / স্ট্যাটাস">
          <select
            value={selStatus}
            onChange={e => setStatus(e.target.value as OrderStatus)}
            className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none"
          >
            {ORDER_STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{bn ? STATUS_META[s].labelBn : STATUS_META[s].labelEn} / {bn ? STATUS_META[s].labelEn : STATUS_META[s].labelBn}</option>
            ))}
          </select>
        </Field>

        <button
          onClick={save}
          className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Icon name="check_circle" className="text-[20px]" />
          {saved ? (bn ? 'সেভ হয়েছে ✓' : 'Saved ✓') : (bn ? 'সেভ ও আপডেট করুন / Save changes' : 'Save changes')}
        </button>
        {order.status !== 'cancelled' && (
          <button
            onClick={cancelOrder}
            className="w-full h-11 rounded-2xl border-2 border-error/50 text-error text-label-lg font-bold inline-flex items-center justify-center gap-2"
          >
            <Icon name="cancel" className="text-[19px]" />
            {bn ? 'অর্ডার বাতিল / Cancel order' : 'Cancel order'}
          </button>
        )}
      </AdminCard>

      {/* Timeline — qs4 */}
      <AdminCard>
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="directions_bike" className="text-primary text-[19px]" />
          {bn ? 'রাইডার ও ডেলিভারি টাইমলাইন' : 'Rider & Delivery Timeline'}
        </p>
        <div className="flex flex-col mt-2">
          {order.trackingUpdates.map((u, i) => (
            <div key={u.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={clsx('w-2.5 h-2.5 rounded-full mt-1.5', i === order.trackingUpdates.length - 1 ? 'bg-primary' : 'bg-outline-variant')} />
                {i < order.trackingUpdates.length - 1 && <span className="w-px flex-1 bg-outline-variant/50" />}
              </div>
              <div className="pb-3">
                <p className="text-body-sm font-medium text-on-surface">{bn ? u.messageBn : u.messageEn}</p>
                <p className="text-label-sm text-on-surface-variant">{fmtTime(u.timestamp, lang)}{u.locationNote ? ` · ${u.locationNote}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
