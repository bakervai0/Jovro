import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { Order } from '../../types';
import {
  AdminCard, Icon, PageTitle, PROBLEM_LABELS, fmtDate, fmtTk, fmtTime, logAction,
  toBnDigits, useActorName, useBn,
} from './adminShared';
import { uid } from '../../services/orderUtils';

// H16 — Problem reports inbox. Built from design
// g2._problem_reports_inbox_jovro: header with "Nটি নতুন",
// chips নতুন / মীমাংসা হয়েছে / সব, problem-ratio strip, and
// report cards (type, time, customer + call, order chip,
// customer message, items, refund note, Replace / Resolve).
export function AdminProblemsList() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const [filter, setFilter] = useState<'new' | 'resolved' | 'all'>('new');

  const openCount = state.problemReports.filter(r => r.status !== 'resolved').length;
  const resolvedCount = state.problemReports.filter(r => r.status === 'resolved').length;
  const ratio = state.orders.length
    ? ((state.problemReports.length / state.orders.length) * 100).toFixed(1)
    : '0';

  const filtered = useMemo(() => {
    const list = [...state.problemReports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === 'new') return list.filter(r => r.status !== 'resolved');
    if (filter === 'resolved') return list.filter(r => r.status === 'resolved');
    return list;
  }, [state.problemReports, filter]);

  const chips = [
    { id: 'new' as const, bn: `নতুন / New (${toBnDigits(openCount, lang)})`, en: `New (${openCount})`, icon: 'fiber_manual_record' },
    { id: 'resolved' as const, bn: `মীমাংসা হয়েছে / Resolved (${toBnDigits(resolvedCount, lang)})`, en: `Resolved (${resolvedCount})`, icon: 'check_circle' },
    { id: 'all' as const, bn: `সব / All (${toBnDigits(state.problemReports.length, lang)})`, en: `All (${state.problemReports.length})`, icon: 'list' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="report_problem"
        titleBn="সমস্যার রিপোর্ট"
        titleEn="Problem Reports"
        subBn="লালমনিরহাট সদর হাব · অ্যাডমিন"
        subEn="Lalmonirhat Sadar Hub · Admin"
        right={<span className="text-label-sm font-bold bg-error/12 text-error rounded-full px-2 py-1">{toBnDigits(openCount, lang)}{bn ? 'টি নতুন' : ' new'}</span>}
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0 inline-flex items-center gap-1.5',
              filter === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            <Icon name={c.icon} className="text-[14px]" />{bn ? c.bn : c.en}
          </button>
        ))}
      </div>

      {/* Ratio strip — g2 */}
      <div className="rounded-2xl bg-surface-container px-4 py-2.5 flex items-center gap-2 text-label-md text-on-surface-variant">
        <Icon name="quick_reference" className="text-[18px] text-primary" />
        <span>{bn ? 'আজকের সমস্যা রেশিও:' : 'Problem ratio:'} <b className="text-on-surface">{toBnDigits(ratio, lang)}%</b> ({bn ? 'স্বাভাবিক' : 'normal'})</span>
        <span className="ml-auto font-semibold">SLA: {toBnDigits(30, lang)} {bn ? 'মিনিট' : 'min'}</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(r => {
          const order = state.orders.find(o => o.id === r.orderId);
          const label = PROBLEM_LABELS[r.problemType];
          const resolved = r.status === 'resolved';
          return (
            <AdminCard key={r.id} onClick={() => navigate(`/admin/problems/${r.id}`)} className={clsx(resolved && 'opacity-75')}>
              <div className="flex items-center gap-2">
                <Icon name={label.icon} className={clsx('text-[20px]', resolved ? 'text-emerald-600' : 'text-secondary')} />
                <p className="text-body-md font-bold text-on-surface flex-1">{bn ? label.bn : label.en} / {bn ? label.en : label.bn}</p>
                <span className={clsx('text-label-sm font-bold px-2 py-0.5 rounded-full', resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                  {resolved ? (bn ? 'মীমাংসা হয়েছে / Resolved' : 'Resolved') : (bn ? 'অপেক্ষমাণ / Pending' : 'Pending')}
                </span>
              </div>
              <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-1.5">
                <Icon name="schedule" className="text-[14px]" />{fmtDate(r.createdAt, lang)} · {fmtTime(r.createdAt, lang)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-body-sm font-semibold text-on-surface flex-1">{r.customerName}</p>
                {order && (
                  <a href={`tel:${order.customerMobile}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
                    <Icon name="call" className="text-[15px]" />{toBnDigits(order.customerMobile, lang)}
                  </a>
                )}
              </div>
              {order && (
                <p className="text-label-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Icon name="receipt" className="text-[14px]" />
                  {bn ? 'অর্ডার' : 'Order'} #{order.id} · {bn ? 'মোট বিল' : 'Total'} {fmtTk(order.finalTotal, lang)}
                  {order.refundStatus === 'processing' && <span className="font-semibold text-amber-700">· {bn ? 'রিফান্ড প্রক্রিয়াধীন' : 'Refund in progress'}</span>}
                  {order.refundStatus === 'paid' && <span className="font-semibold text-emerald-700">· {bn ? 'রিফান্ড সম্পন্ন ✓' : 'Refund paid ✓'}</span>}
                </p>
              )}
              <p className="text-body-sm text-on-surface mt-2 line-clamp-2">“{bn ? r.descriptionBn : (r.descriptionEn ?? r.descriptionBn)}”</p>
              <p className="text-label-md font-semibold text-primary mt-2 inline-flex items-center gap-1">
                {bn ? 'বিস্তারিত দেখুন' : 'View details'}<Icon name="chevron_right" className="text-[15px]" />
              </p>
            </AdminCard>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-8">
            {bn ? 'এই তালিকায় কোনো রিপোর্ট নেই' : 'No reports in this list'}
          </p>
        )}
      </div>
    </div>
  );
}

// H16 detail + H20 refund action. Built from designs
// g2._problem_reports_inbox_jovro (detail: message, attached
// items, refund note, Replace / Resolve) and
// qs5._refund_action_customer_progress_jovro (refund amount,
// method chips বিকাশ/নগদ/ক্যাশ, timeline chips ৩/৫/৭ কর্মদিবস,
// live SMS preview, customer states A প্রক্রিয়াধীন / B সম্পন্ন).
const METHOD_OPTIONS = [
  { id: 'bkash', icon: 'account_balance_wallet', bn: 'বিকাশ', en: 'bKash', inBn: 'বিকাশে' },
  { id: 'nagad', icon: 'account_balance_wallet', bn: 'নগদ', en: 'Nagad', inBn: 'নগদে' },
  { id: 'cash', icon: 'payments', bn: 'ক্যাশ সমন্বয়', en: 'Cash · Next Order', inBn: 'ক্যাশ সমন্বয়ে' },
] as const;

export function AdminProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const report = state.problemReports.find(r => r.id === id);
  const order: Order | undefined = report ? state.orders.find(o => o.id === report.orderId) : undefined;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'cash'>('bkash');
  const [days, setDays] = useState<3 | 5 | 7>(5);
  const [note, setNote] = useState('');
  const [replacementSent, setReplacementSent] = useState(false);

  useEffect(() => {
    if (order) {
      setAmount(String(order.refundAmount ?? order.finalTotal));
      if (order.refundMethod) setMethod(order.refundMethod);
      if (order.refundDays) setDays(order.refundDays);
      setNote(order.refundNote ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon name="search_off" className="text-[48px] text-on-surface-variant/50" />
        <p className="text-body-lg text-on-surface-variant">{bn ? 'রিপোর্ট পাওয়া যায়নি' : 'Report not found'}</p>
        <button onClick={() => navigate('/admin/problems')} className="text-primary font-semibold">{bn ? 'ইনবক্সে ফিরুন' : 'Back to inbox'}</button>
      </div>
    );
  }

  const label = PROBLEM_LABELS[report.problemType];
  const methodMeta = METHOD_OPTIONS.find(m => m.id === method)!;
  const refundAmount = Number(amount) || 0;
  const smsPreview = `দুঃখিত স্যার, আপনার সমস্যার জন্য আমরা আন্তরিকভাবে দুঃখিত। আপনার রিফান্ড ৳${refundAmount} আমরা ${days} কর্মদিবসের মধ্যে আপনার ${methodMeta.bn}ে পৌঁছে দেবো। — জোভরো`;

  const clearComplaintIfDone = (ord: Order) => {
    const othersOpen = state.problemReports.some(r => r.orderId === ord.id && r.id !== report.id && r.status !== 'resolved');
    if (!othersOpen && ord.hasComplaint) {
      dispatch({ type: 'UPDATE_ORDER', order: { ...ord, hasComplaint: false, updatedAt: new Date().toISOString() } });
    }
  };

  const sendReplacement = () => {
    dispatch({
      type: 'UPDATE_PROBLEM_REPORT',
      report: { ...report, status: 'in-review', adminNote: [report.adminNote, 'বদলি পাঠানো হয়েছে'].filter(Boolean).join(' · ') },
    });
    logAction(dispatch, actor, `রিপোর্ট ${report.id.toUpperCase()} (${report.orderId})-এর জন্য বদলি পাঠিয়েছেন`, 'general');
    setReplacementSent(true);
  };

  const confirmRefund = () => {
    if (!order || refundAmount <= 0) return;
    const updatedOrder: Order = {
      ...order,
      refundStatus: 'processing',
      refundAmount,
      refundMethod: method,
      refundDays: days,
      refundNote: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_ORDER', order: updatedOrder });
    dispatch({
      type: 'UPDATE_PROBLEM_REPORT',
      report: { ...report, status: 'refund-issued', refundDays: days, adminNote: [report.adminNote, note.trim()].filter(Boolean).join(' · ') || report.adminNote },
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: uid('notif'), userId: order.customerId, type: 'refund',
        titleBn: 'রিফান্ড প্রক্রিয়াধীন', titleEn: 'Refund in progress',
        bodyBn: smsPreview, bodyEn: smsPreview,
        isRead: false, createdAt: new Date().toISOString(), orderId: order.id,
      },
    });
    logAction(dispatch, actor, `রিফান্ড অনুমোদন: অর্ডার #${order.id}-এর জন্য ${fmtTk(refundAmount, 'en')} ${methodMeta.en} রিফান্ড নিশ্চিত করলেন (${days} কর্মদিবস)`, 'refund');
  };

  const markPaid = () => {
    if (!order) return;
    dispatch({ type: 'UPDATE_ORDER', order: { ...order, refundStatus: 'paid', updatedAt: new Date().toISOString() } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: uid('notif'), userId: order.customerId, type: 'refund',
        titleBn: 'রিফান্ড সম্পন্ন ✓', titleEn: 'Refund completed ✓',
        bodyBn: `আপনার ${fmtTk(order.refundAmount ?? refundAmount, 'bn')} রিফান্ড পাঠানো হয়েছে। জোভরোর সাথে কেনাকাটা করার জন্য ধন্যবাদ!`,
        bodyEn: `Your refund of ${fmtTk(order.refundAmount ?? refundAmount, 'en')} has been sent. Thank you for shopping with Jovro!`,
        isRead: false, createdAt: new Date().toISOString(), orderId: order.id,
      },
    });
    logAction(dispatch, actor, `রিফান্ড পরিশোধ সম্পন্ন চিহ্নিত: অর্ডার #${order.id} (${fmtTk(order.refundAmount ?? refundAmount, 'en')})`, 'refund');
  };

  const resolve = () => {
    dispatch({
      type: 'UPDATE_PROBLEM_REPORT',
      report: { ...report, status: 'resolved', resolvedAt: new Date().toISOString(), adminNote: [report.adminNote, note.trim()].filter(Boolean).join(' · ') || report.adminNote },
    });
    if (order) clearComplaintIfDone(order);
    logAction(dispatch, actor, `রিপোর্ট ${report.id.toUpperCase()} (${report.orderId}) মীমাংসা হয়েছে চিহ্নিত করেছেন`, 'general');
    navigate('/admin/problems');
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/problems')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'সমস্যার রিপোর্ট' : 'Problem Reports'}
      </button>
      <PageTitle
        icon={label.icon}
        titleBn={`${label.bn} / ${label.en}`}
        titleEn={`${label.en} / ${label.bn}`}
        subBn={`অর্ডার #${report.orderId} • লালমনিরহাট সদর`}
        subEn={`Order #${report.orderId} • Lalmonirhat Sadar`}
        right={
          <span className={clsx('text-label-sm font-bold px-2 py-1 rounded-full', report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
            {report.status === 'resolved' ? (bn ? 'মীমাংসা হয়েছে' : 'Resolved') : (bn ? 'অভিযোগ সক্রিয়' : 'Complaint active')}
          </span>
        }
      />

      {/* Customer + message — g2 */}
      <AdminCard>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary/12 text-primary flex items-center justify-center font-bold">{report.customerName.charAt(0)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-bold text-on-surface">{report.customerName}</p>
            <p className="text-label-sm text-on-surface-variant">{fmtDate(report.createdAt, lang)} · {fmtTime(report.createdAt, lang)}</p>
          </div>
          {order && (
            <a href={`tel:${order.customerMobile}`} className="inline-flex items-center gap-1.5 bg-primary text-white text-label-md font-semibold rounded-full px-3 py-2">
              <Icon name="call" className="text-[15px]" />{bn ? 'কল করুন / Call' : 'Call'}
            </a>
          )}
        </div>
        <p className="text-label-md font-semibold text-on-surface-variant mt-3 flex items-center gap-1">
          <Icon name="chat" className="text-[15px]" />{bn ? 'কাস্টমারের মেসেজ:' : "Customer's message:"}
        </p>
        <p className="text-body-md text-on-surface mt-1">“{bn ? report.descriptionBn : (report.descriptionEn ?? report.descriptionBn)}”</p>
        <div className="mt-3 rounded-2xl bg-surface-container px-3 py-2.5 flex items-center gap-2 text-label-md text-on-surface-variant">
          <Icon name="image" className="text-[18px]" />
          {bn ? 'সংযুক্ত ছবি থাকলে ডেলিভারির সময় তোলা প্রামাণ্য ছবি এখানে দেখা যাবে' : 'Any attached photo appears here'}
          <span className="ml-auto font-semibold text-primary">{bn ? 'বড় আকারে দেখুন' : 'Zoom'}</span>
        </div>
      </AdminCard>

      {/* Linked order summary — g2 */}
      {order && (
        <AdminCard>
          <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="w-full text-left">
            <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="shopping_bag" className="text-primary text-[19px]" />
              {bn ? `অর্ডারকৃত সামগ্রী (${toBnDigits(order.items.length, lang)}টি আইটেম)` : `Ordered items (${order.items.length})`}
              <span className="ml-auto text-primary"><Icon name="chevron_right" className="text-[18px]" /></span>
            </p>
          </button>
          <div className="flex flex-col divide-y divide-outline-variant/25 mt-1">
            {order.items.map(it => (
              <div key={it.id} className="flex items-center gap-2 py-2 text-body-sm">
                <span className="flex-1 text-on-surface">{bn ? it.nameBn : it.nameEn} ({toBnDigits(it.quantity, lang)} {it.unit ?? ''})</span>
                <span className="font-semibold text-on-surface">{fmtTk(it.approxPrice * it.quantity, lang)}</span>
              </div>
            ))}
          </div>
          <p className="flex justify-between text-body-sm pt-2 border-t border-outline-variant/30">
            <span className="text-on-surface-variant">{bn ? 'ডেলিভারি ফি:' : 'Delivery fee:'} {fmtTk(order.deliveryFee, lang)}</span>
            <span>{bn ? 'মোট বিল' : 'Total'}: <b>{fmtTk(order.finalTotal, lang)}</b></span>
          </p>
        </AdminCard>
      )}

      {/* H20 — refund action (qs5) */}
      {order && order.refundStatus !== 'paid' && (
        <AdminCard className="flex flex-col gap-4 border-secondary/40">
          <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="currency_exchange" className="text-secondary text-[20px]" />
            {bn ? 'রিফান্ড দিন / Issue Refund' : 'Issue Refund'}
            <span className="ml-auto text-label-sm font-bold bg-orange-100 text-secondary px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Icon name="report_problem" className="text-[13px]" />{bn ? 'অভিযোগ সক্রিয়' : 'Complaint active'}
            </span>
          </p>

          {order.refundStatus === 'processing' ? (
            <>
              {/* Customer state A — qs5 */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
                <p className="text-body-md font-bold text-on-surface flex items-center gap-2">
                  <Icon name="schedule" className="text-amber-600" />
                  {bn ? 'রিফান্ড প্রক্রিয়াধীন' : 'Refund in progress'}
                  <span className="ml-auto text-label-sm font-semibold text-amber-700">{bn ? 'অপেক্ষা করুন' : 'Please wait'}</span>
                </p>
                <p className="text-body-sm text-on-surface-variant mt-1.5">
                  {bn ? 'অনুমোদিত রিফান্ড মূল্য:' : 'Approved amount:'} <b className="text-on-surface">{fmtTk(order.refundAmount ?? 0, lang)}</b>
                  {' · '}{bn ? 'প্রাপক চ্যানেল:' : 'Channel:'} {order.refundMethod === 'nagad' ? 'নগদ' : order.refundMethod === 'cash' ? 'ক্যাশ' : 'বিকাশ'} ({toBnDigits(order.customerMobile, lang)})
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  {bn ? `সর্বোচ্চ ${toBnDigits(order.refundDays ?? 5, lang)} কর্মদিবসের মধ্যে আপনার একাউন্টে যোগ হবে।` : `Will arrive within ${order.refundDays ?? 5} working days.`}
                </p>
              </div>
              <button onClick={markPaid} className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-label-lg font-bold inline-flex items-center justify-center gap-2">
                <Icon name="task_alt" className="text-[19px]" />{bn ? 'রিফান্ড পাঠানো হয়েছে — Mark paid' : 'Mark refund paid'}
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-label-md font-semibold text-on-surface-variant">{bn ? 'রিফান্ডের পরিমাণ (Refund Amount) *' : 'Refund Amount *'} <span className="font-normal">· {bn ? 'নষ্ট পণ্যের মূল্য' : 'damaged item value'}</span></p>
                <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3 mt-1.5">
                  <span className="font-bold text-on-surface-variant">৳</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-body-lg font-bold text-on-surface min-w-0" />
                </div>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <Icon name="info" className="text-[13px]" />{bn ? 'কাস্টমার চাহিদামতো সমন্বয় করা যাবে (Adjustable on dispute)' : 'Adjustable on dispute'}
                </p>
              </div>

              <div>
                <p className="text-label-md font-semibold text-on-surface-variant mb-1.5">{bn ? 'রিফান্ড মাধ্যম (Refund Method)' : 'Refund Method'}</p>
                <div className="flex gap-2">
                  {METHOD_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={clsx('flex-1 py-2.5 rounded-xl border-2 text-label-md font-semibold inline-flex flex-col items-center gap-1',
                        method === m.id ? 'border-primary bg-primary/8 text-primary' : 'border-outline-variant text-on-surface')}
                    >
                      <Icon name={method === m.id ? 'check_circle' : m.icon} className="text-[18px]" />
                      {bn ? m.bn : m.en}
                      <span className="text-[10px] font-normal text-on-surface-variant">{bn ? m.en : m.bn}</span>
                    </button>
                  ))}
                </div>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1.5">
                  <Icon name="smartphone" className="text-[14px]" />
                  {bn ? 'কাস্টমার রেজিস্টার্ড একাউন্ট:' : 'Customer account:'} {toBnDigits(order.customerMobile, lang)} ({bn ? 'বিকাশ পার্সোনাল' : 'bKash personal'})
                </p>
              </div>

              <div>
                <p className="text-label-md font-semibold text-on-surface-variant mb-1.5">{bn ? 'প্রতিশ্রুত সময়সীমা (Promised Timeline)' : 'Promised Timeline'}</p>
                <div className="flex gap-2">
                  {([3, 5, 7] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={clsx('flex-1 py-2.5 rounded-xl border-2 text-label-md font-semibold',
                        days === d ? 'border-primary bg-primary/8 text-primary' : 'border-outline-variant text-on-surface')}
                    >
                      {toBnDigits(d, lang)} {bn ? 'কর্মদিবস' : 'work days'}
                      <span className="block text-[10px] font-normal text-on-surface-variant">{d} Work Days{d === 5 ? (bn ? ' (ডিফল্ট)' : ' (default)') : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live SMS preview — qs5 */}
              <div className="rounded-2xl bg-surface-container p-3.5">
                <p className="text-label-md font-bold text-on-surface flex items-center gap-1.5">
                  <Icon name="sms" className="text-[16px] text-primary" />
                  {bn ? 'লাইভ নোটিফিকেশন প্রিভিউ (Customer SMS/Push)' : 'Live Notification Preview'}
                  <span className="ml-auto text-label-sm font-normal text-on-surface-variant">{bn ? 'স্বয়ংক্রিয় প্রেরণ' : 'Auto-send'}</span>
                </p>
                <p className="text-body-sm text-on-surface mt-1.5">JOVRO-CARE • {bn ? 'প্রাপক:' : 'To:'} {toBnDigits(order.customerMobile, lang)}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">“{smsPreview}”</p>
              </div>

              <button onClick={confirmRefund} disabled={refundAmount <= 0} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Icon name="verified" className="text-[19px]" />{bn ? 'রিফান্ড নিশ্চিত করুন / Confirm Refund' : 'Confirm Refund'}
              </button>
            </>
          )}
        </AdminCard>
      )}

      {/* Customer state B — refund completed (qs5) */}
      {order?.refundStatus === 'paid' && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-body-lg font-bold text-emerald-700 flex items-center gap-2">
            <Icon name="task_alt" className="text-[22px]" />{bn ? 'রিফান্ড সম্পন্ন ✓' : 'Refund completed ✓'}
            <span className="ml-auto text-label-sm font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{bn ? 'সফল' : 'Success'}</span>
          </p>
          <p className="text-body-sm text-on-surface mt-1.5">
            {bn ? 'প্রেরিত রিফান্ড অংক:' : 'Refund sent:'} <b>{fmtTk(order.refundAmount ?? 0, lang)}</b>
            {' · '}{bn ? 'মাধ্যম:' : 'Method:'} {order.refundMethod === 'nagad' ? 'নগদ' : order.refundMethod === 'cash' ? 'ক্যাশ' : 'বিকাশ'} ({toBnDigits(order.customerMobile, lang)})
          </p>
          <p className="text-label-md text-on-surface-variant mt-1">{bn ? 'জোভরোর সাথে কেনাকাটা করার জন্য ধন্যবাদ।' : 'Thank you for shopping with Jovro.'}</p>
        </div>
      )}

      {/* Refund note + actions — g2 */}
      <AdminCard className="flex flex-col gap-3">
        <div>
          <p className="text-label-md font-semibold text-on-surface-variant flex items-center gap-1.5">
            <Icon name="edit_note" className="text-[16px]" />{bn ? 'রিফান্ড নোট / Refund note' : 'Refund note'}
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder={bn ? 'নোট লিখুন…' : 'Write a note…'}
            className="w-full mt-1.5 rounded-xl border-2 border-outline-variant focus:border-primary bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none resize-none"
          />
          <p className="text-label-sm text-on-surface-variant">{bn ? 'এই নোটটি কাস্টমারের এসএমএস এবং অ্যাডমিন লগে যুক্ত থাকবে।' : 'This note joins the customer SMS and the admin log.'}</p>
          {report.adminNote && <p className="text-label-sm text-on-surface-variant mt-1">{bn ? 'আগের নোট:' : 'Previous note:'} {report.adminNote}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={sendReplacement}
            disabled={replacementSent || report.status === 'resolved'}
            className="flex-1 h-12 rounded-2xl bg-tertiary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="two_wheeler" className="text-[18px]" />
            {replacementSent ? (bn ? 'বদলি পাঠানো হয়েছে ✓' : 'Replacement sent ✓') : (bn ? 'বদলি পাঠান / Replace' : 'Send replacement')}
          </button>
          <button
            onClick={resolve}
            disabled={report.status === 'resolved'}
            className="flex-1 h-12 rounded-2xl bg-primary text-white text-label-md font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="check_circle" className="text-[18px]" />
            {report.status === 'resolved' ? (bn ? 'মীমাংসা হয়েছে ✓' : 'Resolved ✓') : (bn ? 'মীমাংসা হয়েছে / Mark resolved' : 'Mark resolved')}
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
