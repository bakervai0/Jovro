import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import {
  AdminCard, Avatar, Field, Icon, PageTitle, SectionHead, ToggleRow, buildCustomers,
  fmtDate, fmtTk, fmtTime, inputCls, logAction, toBnDigits, useActorName, useBn,
} from './adminShared';
import { areaName, dayKey, latestOrderDay, uid } from '../../services/orderUtils';
import { DEMO_USERS, REFERRALS_SEED } from '../../data/seed';

// H12 — Reviews moderation. Built from design
// 12._reviews_moderation_jovro: totals header (মোট রিভিউ /
// লুকানো), filter chips (সব/দৃশ্যমান/লুকানো/৫ স্টার/৪ স্টার/
// কম রেটিং), review cards (customer, area, time, status,
// product/order, stars, comment) with লুকান / Hide and
// আবার দেখান / Restore actions.
export function AdminReviews() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | '5' | '4' | 'low'>('all');

  const total = state.reviews.length;
  const hidden = state.reviews.filter(r => r.isHidden).length;
  const visiblePct = total ? Math.round(((total - hidden) / total) * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...state.reviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === 'visible') list = list.filter(r => !r.isHidden);
    if (filter === 'hidden') list = list.filter(r => r.isHidden);
    if (filter === '5') list = list.filter(r => r.rating === 5);
    if (filter === '4') list = list.filter(r => r.rating === 4);
    if (filter === 'low') list = list.filter(r => r.rating <= 2);
    return list;
  }, [state.reviews, filter]);

  const chips = [
    { id: 'all' as const, bn: `সব রিভিউ All · ${toBnDigits(total, lang)}`, en: `All · ${total}` },
    { id: 'visible' as const, bn: `দৃশ্যমান Visible · ${toBnDigits(total - hidden, lang)}`, en: `Visible · ${total - hidden}` },
    { id: 'hidden' as const, bn: `লুকানো Hidden · ${toBnDigits(hidden, lang)}`, en: `Hidden · ${hidden}` },
    { id: '5' as const, bn: '৫ স্টার ⭐5', en: '5 stars' },
    { id: '4' as const, bn: '৪ স্টার ⭐4', en: '4 stars' },
    { id: 'low' as const, bn: 'কম রেটিং (১-২ স্টার)', en: 'Low (1-2 stars)' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="rate_review"
        titleBn="রিভিউ ও রেটিং যাচাই"
        titleEn="Reviews Moderation"
        subBn="কাস্টমারদের মতামত পর্যবেক্ষণ · Admin Live"
        subEn="Customer feedback monitoring · Admin Live"
      />

      {/* Totals — design 12 */}
      <div className="grid grid-cols-2 gap-3">
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
            <Icon name="verified" className="text-primary text-[16px]" />{bn ? 'মোট রিভিউ সংখ্যা' : 'Total reviews'}
          </p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">
            {toBnDigits(total, lang)} {bn ? 'টি' : ''} <span className="text-label-md font-medium text-on-surface-variant">({bn ? 'সক্রিয়' : 'visible'} {toBnDigits(visiblePct, lang)}%)</span>
          </p>
        </AdminCard>
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
            <Icon name="visibility_off" className="text-error text-[16px]" />{bn ? 'লুকানো রিভিউ' : 'Hidden reviews'}
          </p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">{toBnDigits(hidden, lang)} {bn ? 'টি লুকানো' : 'hidden'}</p>
        </AdminCard>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0 inline-flex items-center gap-1',
              filter === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            {(c.id === '5' || c.id === '4') && <Icon name="star" className="text-[14px]" />}{bn ? c.bn : c.en}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(r => {
          const order = state.orders.find(o => o.id === r.orderId);
          return (
            <AdminCard key={r.id} className={clsx(r.isHidden && 'opacity-80')}>
              <div className="flex items-center gap-3">
                <Avatar name={r.customerName} className="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface inline-flex items-center gap-1.5">
                    {r.customerName}
                    <Icon name="check_circle" className="text-primary text-[15px]" />
                  </p>
                  <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                    <Icon name="location_on" className="text-[13px]" />
                    {order ? areaName(state.areas, order.deliveryAreaId, lang) : 'সদর'} • {fmtDate(r.createdAt, lang)}
                  </p>
                </div>
                <span className={clsx('text-label-sm font-bold px-2 py-0.5 rounded-full', r.isHidden ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-emerald-100 text-emerald-700')}>
                  {r.isHidden ? (bn ? 'লুকানো হয়েছে / Hidden' : 'Hidden') : (bn ? 'দৃশ্যমান / Published' : 'Published')}
                </span>
              </div>
              {order && (
                <p className="text-label-md text-on-surface-variant flex items-center gap-1.5 mt-2">
                  <Icon name="shopping_basket" className="text-[15px]" />
                  {order.items.map(i => bn ? i.nameBn : i.nameEn).slice(0, 3).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className={clsx('text-[16px]', i < r.rating ? 'text-amber-500 filled-symbol' : 'text-outline-variant')} />
                ))}
                <span className="text-body-sm font-bold text-on-surface ml-1">{toBnDigits(r.rating.toFixed(1), lang)}</span>
              </div>
              <p className="text-body-md text-on-surface mt-1.5">“{bn ? r.commentBn : (r.commentEn ?? r.commentBn)}”</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/25">
                <span className="text-label-sm text-on-surface-variant inline-flex items-center gap-1">
                  <Icon name="inventory_2" className="text-[14px]" />{bn ? 'অর্ডার আইডি:' : 'Order ID:'} #{r.orderId}
                </span>
                <button
                  onClick={() => {
                    dispatch({ type: 'UPDATE_REVIEW', review: { ...r, isHidden: !r.isHidden } });
                    logAction(dispatch, actor, `রিভিউ ${r.isHidden ? 'আবার দেখিয়েছেন' : 'লুকিয়েছেন'}: ${r.customerName} (${r.orderId})`, 'general');
                  }}
                  className={clsx('inline-flex items-center gap-1.5 text-label-md font-bold', r.isHidden ? 'text-primary' : 'text-error')}
                >
                  <Icon name={r.isHidden ? 'restore' : 'visibility_off'} className="text-[16px]" />
                  {r.isHidden ? (bn ? 'আবার দেখান / Restore' : 'Restore') : (bn ? 'লুকান / Hide review' : 'Hide review')}
                </button>
              </div>
            </AdminCard>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-8">{bn ? 'এই ফিল্টারে কোনো রিভিউ নেই' : 'No reviews in this filter'}</p>
        )}
      </div>

      <p className="text-label-md text-on-surface-variant flex gap-1.5">
        <Icon name="info" className="text-[15px] flex-shrink-0 mt-0.5" />
        {bn ? 'গ্রাহকের প্রকৃত মতামত সবসময় স্বচ্ছ রাখতে সহায়তা করুন। কেবল অসঙ্গত ভাষা থাকলেই লুকানো যাবে।' : 'Keep genuine customer opinions transparent. Hide only for policy violations.'}
      </p>
    </div>
  );
}

// H13 — Send notification. Built from design 13._send_
// notification_jovro: audience cards (সব কাস্টমার / নির্দিষ্ট
// এলাকা / শুধু রাইডারগণ), area select, Bangla title + message
// with character counts, deep-link select, live push preview,
// broadcast button and sent history.
export function AdminNotify() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [audience, setAudience] = useState<'all' | 'area' | 'riders'>('all');
  const [areaId, setAreaId] = useState(state.areas[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('bazaar');
  const [sent, setSent] = useState(false);

  const customerCount = useMemo(
    () => buildCustomers(state.orders, state.problemReports).length,
    [state.orders, state.problemReports],
  );
  const riderCount = state.riders.filter(r => r.status === 'active').length;
  const reach = audience === 'riders' ? riderCount : customerCount;

  const history = state.activityLog
    .filter(e => e.action.startsWith('নোটিফিকেশন পাঠিয়েছেন:'))
    .map(e => {
      const m = e.action.match(/নোটিফিকেশন পাঠিয়েছেন: "(.+)" → (.+)$/);
      return { id: e.id, title: m?.[1] ?? e.action, audience: m?.[2] ?? '', at: e.at };
    });

  const send = () => {
    if (!title.trim() || !message.trim()) return;
    const audienceLabel = audience === 'all'
      ? (bn ? 'সব কাস্টমার' : 'All customers')
      : audience === 'riders'
        ? (bn ? 'শুধু রাইডারগণ' : 'Riders only')
        : areaName(state.areas, areaId, lang);
    // The demo customer / rider inboxes receive the broadcast so
    // it is visible after a role switch.
    const targetUser = audience === 'riders' ? DEMO_USERS.rider : DEMO_USERS.customer;
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: uid('notif'), userId: targetUser.id, type: 'promo',
        titleBn: title.trim(), titleEn: titleEn.trim() || title.trim(),
        bodyBn: message.trim(), bodyEn: message.trim(),
        isRead: false, createdAt: new Date().toISOString(),
      },
    });
    logAction(dispatch, actor, `নোটিফিকেশন পাঠিয়েছেন: "${title.trim()}" → ${audienceLabel}`, 'general');
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  const audienceCards = [
    { id: 'all' as const, emoji: '👥', bn: 'সব কাস্টমার', en: 'All Customers', count: toBnDigits(customerCount, lang) },
    { id: 'area' as const, emoji: '📍', bn: 'নির্দিষ্ট এলাকা', en: 'One Area', count: '' },
    { id: 'riders' as const, emoji: '🚴', bn: 'শুধু রাইডারগণ', en: 'Riders Only', count: `${toBnDigits(riderCount, lang)} ${bn ? 'জন' : ''}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="campaign" titleBn="নোটিফিকেশন পাঠান" titleEn="Send Push Notification" subBn="এডমিন · সরাসরি ব্রডকাস্ট" subEn="Admin · Direct broadcast" />

      {/* Audience — design 13 */}
      <div>
        <p className="text-label-lg font-bold text-on-surface mb-2">{bn ? 'প্রাপক নির্বাচন' : 'Target Audience'} <span className="font-normal text-on-surface-variant">/ Target Audience</span></p>
        <div className="grid grid-cols-3 gap-2.5">
          {audienceCards.map(c => (
            <button
              key={c.id}
              onClick={() => setAudience(c.id)}
              className={clsx('rounded-2xl border-2 p-3 flex flex-col items-center gap-1 text-center',
                audience === c.id ? 'border-primary bg-primary/6' : 'border-outline-variant bg-surface-container-lowest')}
            >
              <span className="text-[22px]">{c.emoji}</span>
              <span className="text-label-md font-bold text-on-surface leading-tight">{bn ? c.bn : c.en}</span>
              <span className="text-[10px] text-on-surface-variant">{bn ? c.en : c.bn}{c.count ? ` · ${c.count}` : ''}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Field labelBn="এলাকা নির্বাচন (Select Area)" labelEn="Select Area">
            <select value={areaId} onChange={e => setAreaId(e.target.value)} disabled={audience !== 'area'} className={clsx(inputCls, audience !== 'area' && 'opacity-50')}>
              {state.areas.map(a => <option key={a.id} value={a.id}>{bn ? a.nameBn : a.nameEn}</option>)}
            </select>
          </Field>
          {audience === 'all' && <p className="text-label-sm text-on-surface-variant mt-1">{bn ? '(সব বাছাই থাকলে এলাকা নিষ্ক্রিয় থাকে)' : '(Area is disabled when All is picked)'}</p>}
        </div>
      </div>

      {/* Compose — design 13 */}
      <AdminCard className="flex flex-col gap-4">
        <Field labelBn="নোটিফিকেশন শিরোনাম (বাংলা) *" labelEn="Notification Title (Bangla) *">
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={50} className={inputCls} placeholder={bn ? 'যেমন: আজকের তাজা কাঁচাবাজারে বিশেষ ছাড়! 🥦' : 'Notification title'} />
          <span className="text-label-sm text-on-surface-variant self-end">{toBnDigits(title.length, lang)}/৫০</span>
        </Field>
        <Field labelBn="Title (English optional)" labelEn="Title (English optional)">
          <input value={titleEn} onChange={e => setTitleEn(e.target.value)} className={inputCls} placeholder="English title (optional)" />
        </Field>
        <Field labelBn="বার্তার বিস্তারিত বিবরণ / Notification Message" labelEn="Notification Message">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={150}
            rows={3}
            className={clsx(inputCls, 'resize-none')}
            placeholder={bn ? 'গোশালা বাজার থেকে আজ সকালে তাজা ইলিশ ও দেশি শাকসবজি সরাসরি কিনুন…' : 'Write the message…'}
          />
          <span className="text-label-sm text-on-surface-variant self-end">{toBnDigits(message.length, lang)}/১৫০</span>
        </Field>
        <Field labelBn="ডিপ লিঙ্ক / Action on tap" labelEn="Deep Link / Action on tap">
          <select value={link} onChange={e => setLink(e.target.value)} className={inputCls}>
            <option value="bazaar">{bn ? 'হোম ক্যাটাগরি -> কাঁচাবাজার (Bazaar)' : 'Home category -> Bazaar'}</option>
            <option value="food">{bn ? 'রেস্তোরাঁ মেন্যু -> হাজী বিরিয়ানি' : 'Restaurant menu'}</option>
            <option value="promo">{bn ? 'অফার পাতা -> ফ্রি ডেলিভারি কুপন' : 'Offers page -> Free delivery coupon'}</option>
            <option value="help">{bn ? 'সরাসরি মেসেঞ্জার / হেল্পলাইন' : 'Messenger / Helpline'}</option>
          </select>
        </Field>

        {/* Live preview — design 13 */}
        <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-3.5">
          <p className="text-label-sm opacity-75 flex items-center gap-1.5">
            <Icon name="phone_iphone" className="text-[14px]" />{bn ? 'লাইভ প্রিভিউ / Live Push Preview · লক স্ক্রিন ভিউ' : 'Live Push Preview · Lock screen'}
          </p>
          <div className="bg-white/10 rounded-xl p-3 mt-2 flex gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Icon name="pedal_bike" className="text-white text-[19px]" />
            </span>
            <div className="min-w-0">
              <p className="text-label-md font-bold flex justify-between gap-2">Jovro <span className="font-normal opacity-70">{bn ? 'এখনই' : 'now'}</span></p>
              <p className="text-body-sm font-semibold mt-0.5">{title || (bn ? 'আজকের তাজা কাঁচাবাজারে বিশেষ ছাড়! 🥦' : 'Your title here')}</p>
              <p className="text-label-md opacity-85 mt-0.5">{message || (bn ? 'গোশালা বাজার থেকে আজ সকালে তাজা ইলিশ ও দেশি শাকসবজি সরাসরি কিনুন।' : 'Your message here')}</p>
            </div>
          </div>
        </div>

        <button onClick={send} disabled={!title.trim() || !message.trim()} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          {sent ? (bn ? 'পাঠানো হয়েছে ✓' : 'Sent ✓') : (<>{bn ? 'নোটিফিকেশন সম্প্রচার করুন / Send Notification' : 'Send Notification'} 🚀</>)}
        </button>
        <p className="text-label-sm text-on-surface-variant text-center -mt-1">
          {bn ? `ট্যাপ করার সাথে সাথেই ${toBnDigits(reach, lang)} জন সক্রিয় গ্রাহকের ফোনে পুশ রিকোয়েস্ট চলে যাবে।` : `One tap sends the push to ${reach} active recipients.`}
        </p>
      </AdminCard>

      {/* Sent history — design 13 */}
      <SectionHead icon="history_toggle_off" titleBn="পূর্ববর্তী পাঠানো নোটিফিকেশন" titleEn="Sent History" />
      <div className="flex flex-col gap-2.5">
        {history.map(h => (
          <AdminCard key={h.id}>
            <p className="text-body-md font-semibold text-on-surface">“{h.title}”</p>
            <p className="text-label-md text-on-surface-variant flex items-center gap-3 mt-1">
              <span className="inline-flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{fmtTime(h.at, lang)}</span>
              <span className="inline-flex items-center gap-1"><Icon name="groups" className="text-[14px]" />{bn ? 'পাঠানো হয়েছে:' : 'Sent to:'} {h.audience}</span>
              <span className="font-semibold text-emerald-700">{bn ? 'সফল' : 'Success'}</span>
            </p>
          </AdminCard>
        ))}
        {history.length === 0 && (
          <>
            <AdminCard>
              <p className="text-body-md font-semibold text-on-surface">“হাজী বিরিয়ানি আজ দুপুর থেকে অর্ডার নিচ্ছে”</p>
              <p className="text-label-md text-on-surface-variant flex items-center gap-3 mt-1">
                <span className="font-semibold text-emerald-700">{bn ? 'সফল' : 'Success'}</span>
                <span className="inline-flex items-center gap-1"><Icon name="groups" className="text-[14px]" />{bn ? 'পাঠানো হয়েছে: সবাইকে' : 'Sent to: everyone'}</span>
                <span className="inline-flex items-center gap-1"><Icon name="touch_app" className="text-[14px]" />{bn ? 'ওপেন রেট: ৪২%' : 'Open rate: 42%'}</span>
              </p>
            </AdminCard>
            <AdminCard>
              <p className="text-body-md font-semibold text-on-surface">“বৃষ্টির জন্য ডেলিভারিতে কিছুটা বিলম্ব হতে পারে”</p>
              <p className="text-label-md text-on-surface-variant flex items-center gap-3 mt-1">
                <span className="font-semibold text-emerald-700">{bn ? 'সম্পন্ন' : 'Done'}</span>
                <span className="inline-flex items-center gap-1"><Icon name="location_on" className="text-[14px]" />{bn ? 'পাঠানো হয়েছে: মিশন মোড় ও কলেজ রোড' : 'Sent to: Mission Mor & College Road'}</span>
              </p>
            </AdminCard>
          </>
        )}
      </div>
    </div>
  );
}

// H14 — Reports. Built from design 14._reports_summaries_jovro:
// period chips (আজকের হিসাব / এই সপ্তাহ / চলতি মাস), cash-flow
// card (জিরো প্রোডাক্ট মার্কআপ), stat grid, CSV download,
// Top 5 products, rider performance, affiliate contribution.
type Period = 'today' | 'week' | 'month';

export function AdminReports() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const [period, setPeriod] = useState<Period>('today');

  const latest = latestOrderDay(state.orders);
  const inPeriod = useMemo(() => {
    const latestDate = new Date(`${latest}T00:00:00`);
    return state.orders.filter(o => {
      const d = dayKey(o.createdAt);
      if (period === 'today') return d === latest;
      if (period === 'month') return d.slice(0, 7) === latest.slice(0, 7);
      const diff = (latestDate.getTime() - new Date(`${d}T00:00:00`).getTime()) / 86400000;
      return diff >= 0 && diff < 7;
    });
  }, [state.orders, period, latest]);

  const delivered = inPeriod.filter(o => o.status === 'delivered');
  const failedCancelled = inPeriod.filter(o => o.status === 'failed' || o.status === 'cancelled');
  const cashFlow = inPeriod.reduce((s, o) => s + o.productsTotal, 0);
  const deliveryIncome = delivered.reduce((s, o) => s + o.deliveryFee, 0);
  const successPct = inPeriod.length ? Math.round((delivered.length / inPeriod.length) * 100) : 0;

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; unit: string; revenue: number }>();
    for (const o of inPeriod) {
      for (const it of o.items) {
        const key = bn ? it.nameBn : it.nameEn;
        const cur = map.get(key) ?? { name: key, qty: 0, unit: it.unit ?? '', revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.approxPrice * it.quantity;
        map.set(key, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [inPeriod, bn]);

  const topRiders = useMemo(() => {
    return state.riders
      .map(r => {
        const done = delivered.filter(o => o.riderId === r.id);
        return { rider: r, count: done.length, income: done.reduce((s, o) => s + o.deliveryFee, 0) };
      })
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [state.riders, delivered]);

  const topAffiliates = useMemo(() => {
    return state.affiliates
      .filter(a => a.status === 'active')
      .map(a => ({ affiliate: a, orders: REFERRALS_SEED.filter(r => r.affiliateId === a.id).length }))
      .sort((x, y) => y.orders - x.orders || y.affiliate.totalReferrals - x.affiliate.totalReferrals)
      .slice(0, 3);
  }, [state.affiliates]);

  const downloadCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Mobile', 'Status', 'Products Total', 'Delivery Fee', 'Final Total', 'Date'],
      ...inPeriod.map(o => [o.id, o.customerName, o.customerMobile, o.status, o.productsTotal, o.deliveryFee, o.finalTotal, o.createdAt]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `jovro-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const periodChips: { id: Period; bn: string; en: string }[] = [
    { id: 'today', bn: 'আজকের হিসাব', en: "Today's Summary" },
    { id: 'week', bn: 'এই সপ্তাহ', en: 'This Week' },
    { id: 'month', bn: 'চলতি মাস', en: 'This Month' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="analytics"
        titleBn="রিপোর্ট ও আর্থিক খতিয়ান"
        titleEn="Reports & Analytics"
        subBn="Reports & Analytics · Lalmonirhat Sadar"
        subEn="Reports & Analytics · Lalmonirhat Sadar"
        right={<span className="text-label-sm font-bold text-primary bg-primary/10 rounded-full px-2 py-1">LIVE</span>}
      />
      <p className="text-label-md text-on-surface-variant flex items-center gap-1.5 -mt-1">
        <Icon name="verified" className="text-primary text-[16px]" />
        {bn ? 'সরাসরি ডেটা সিঙ্ক সম্পন্ন · লাইভ ট্রানজেকশন খতিয়ান (জিরো মার্জিন)' : 'Live data synced · Zero-margin ledger'}
      </p>

      <div className="flex gap-2">
        {periodChips.map(c => (
          <button
            key={c.id}
            onClick={() => setPeriod(c.id)}
            className={clsx('flex-1 py-2 rounded-full text-label-md font-semibold border',
              period === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            {bn ? c.bn : c.en}
          </button>
        ))}
      </div>

      {/* Cash flow — design 14 */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white p-4">
        <p className="text-label-md text-white/85 flex items-center gap-1.5">
          <Icon name="payments" className="text-[17px]" />{bn ? 'বাজারের পণ্য ট্রানজেকশন (ক্যাশ ফ্লো)' : 'Bazaar product transactions (cash flow)'}
        </p>
        <p className="text-headline-lg font-bold mt-1">{fmtTk(cashFlow, lang)}</p>
        <p className="text-label-md text-white/85 mt-0.5">{bn ? '১০০% বাজারের রসিদ মূল্য · Customer Direct Pass' : '100% bazaar receipt value'}</p>
        <p className="text-label-sm bg-white/15 rounded-full px-2 py-1 inline-flex items-center gap-1 mt-2">
          <Icon name="info" className="text-[13px]" />{bn ? 'জিরো প্রোডাক্ট মার্কআপ নিশ্চিত' : 'Zero product markup'} · {toBnDigits(inPeriod.length, lang)} {bn ? 'টি অর্ডার' : 'orders'}
        </p>
      </div>

      {/* Stat grid — design 14 */}
      <div className="grid grid-cols-2 gap-3">
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5"><Icon name="shopping_cart" className="text-primary text-[16px]" />{bn ? 'মোট অর্ডার' : 'Total Orders'}</p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">{toBnDigits(inPeriod.length, lang)}{bn ? 'টি' : ''}</p>
          <p className="text-label-sm text-on-surface-variant">Total Orders</p>
        </AdminCard>
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5"><Icon name="check_circle" className="text-emerald-600 text-[16px]" />{bn ? 'সম্পন্ন ডেলিভারি' : 'Delivered'}</p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">{toBnDigits(delivered.length, lang)}{bn ? 'টি' : ''}</p>
          <p className="text-label-sm text-emerald-700 font-semibold">{toBnDigits(successPct, lang)}% {bn ? 'সাকসেস রেট' : 'success rate'}</p>
        </AdminCard>
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5"><Icon name="cancel" className="text-error text-[16px]" />{bn ? 'ব্যর্থ / বাতিল' : 'Failed / Cancelled'}</p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">{toBnDigits(failedCancelled.length, lang)}{bn ? 'টি' : ''}</p>
          <p className="text-label-sm text-on-surface-variant">Failed / Cancelled</p>
        </AdminCard>
        <AdminCard className="p-3.5">
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5"><Icon name="savings" className="text-primary text-[16px]" />{bn ? 'মোট ডেলিভারি আয়' : 'Delivery Income'}</p>
          <p className="text-headline-sm font-bold text-on-surface mt-1">{fmtTk(deliveryIncome, lang)}</p>
          <p className="text-label-sm text-on-surface-variant">{bn ? 'জিরো প্রোডাক্ট মার্জিন' : 'Zero product margin'}</p>
        </AdminCard>
      </div>

      <button onClick={downloadCsv} className="w-full h-11 rounded-2xl border-2 border-primary text-primary text-label-lg font-bold inline-flex items-center justify-center gap-2">
        <Icon name="download" className="text-[18px]" />
        {bn ? 'এক্সেল / CSV রিপোর্ট ডাউনলোড করুন' : 'Download Excel / CSV Report'}
      </button>

      {/* Top 5 products — design 14 */}
      <SectionHead icon="trending_up" titleBn="সবচেয়ে বেশি বিক্রিত বাজার আইটেম" titleEn="Top 5 Products List (Volumetric)" />
      <AdminCard className="flex flex-col divide-y divide-outline-variant/25 !py-1">
        {topProducts.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 py-3">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-label-md font-bold flex items-center justify-center">{toBnDigits(i + 1, lang)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-semibold text-on-surface truncate">{p.name}</p>
              <p className="text-label-sm text-on-surface-variant">{toBnDigits(p.qty, lang)} {p.unit}</p>
            </div>
            <p className="text-body-md font-bold text-on-surface">{fmtTk(p.revenue, lang)} <span className="text-label-sm font-normal text-on-surface-variant">{bn ? 'ক্যাশ ফ্লো' : 'cash flow'}</span></p>
          </div>
        ))}
        {topProducts.length === 0 && <p className="text-body-sm text-on-surface-variant py-3">{bn ? 'এই সময়ে কোনো বিক্রি নেই' : 'No sales in this period'}</p>}
      </AdminCard>

      {/* Top riders — design 14 */}
      <SectionHead icon="two_wheeler" titleBn="রাইডার পারফরম্যান্স" titleEn="Top Riders by Deliveries & Payouts" right={<span className="text-label-sm text-on-surface-variant">{bn ? 'মোট' : 'Total'} {toBnDigits(delivered.length, lang)}{bn ? 'টি ডেলিভারি' : ' deliveries'}</span>} />
      <AdminCard className="flex flex-col divide-y divide-outline-variant/25 !py-1">
        {topRiders.map((x, i) => (
          <div key={x.rider.id} className="flex items-center gap-3 py-3">
            <span className="w-7 h-7 rounded-full bg-tertiary/10 text-tertiary text-label-md font-bold flex items-center justify-center">{toBnDigits(i + 1, lang)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-body-md font-semibold text-on-surface">{bn ? x.rider.nameBn : x.rider.name}</p>
              <p className="text-label-sm text-on-surface-variant">{toBnDigits(x.count, lang)}{bn ? 'টি ডেলিভারি' : ' deliveries'}</p>
            </div>
            <p className="text-body-md font-bold text-on-surface">{fmtTk(x.income, lang)} <span className="text-label-sm font-normal text-on-surface-variant">{bn ? 'রাইডার আয়' : 'rider income'}</span></p>
          </div>
        ))}
        {topRiders.length === 0 && <p className="text-body-sm text-on-surface-variant py-3">{bn ? 'এই সময়ে কোনো ডেলিভারি নেই' : 'No deliveries in this period'}</p>}
      </AdminCard>

      {/* Top affiliates — design 14 */}
      <SectionHead icon="share" titleBn="অ্যাফিলিয়েট অবদান" titleEn="Top Affiliates by Active Customers & Orders" />
      <div className="flex flex-col gap-2.5">
        {topAffiliates.map((x, i) => (
          <AdminCard key={x.affiliate.id}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center font-bold">{(bn ? x.affiliate.nameBn : x.affiliate.name).charAt(0)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-bold text-on-surface">{bn ? x.affiliate.nameBn : x.affiliate.name}</p>
                <p className="text-label-sm text-primary font-semibold">#{x.affiliate.referralCode}</p>
              </div>
              <span className="text-label-sm font-bold bg-tertiary/10 text-tertiary px-2 py-1 rounded-full">{toBnDigits(i + 1, lang)}{bn ? 'ম স্থান' : ' place'}</span>
            </div>
            <p className="text-label-md text-on-surface-variant mt-2">
              {toBnDigits(x.affiliate.totalReferrals, lang)} {bn ? 'জন কাস্টমার' : 'customers'} · {toBnDigits(x.orders, lang)}{bn ? 'টি অর্ডার' : ' orders'}
            </p>
          </AdminCard>
        ))}
      </div>

      <button onClick={() => navigate('/admin/activity')} className="text-label-md text-on-surface-variant inline-flex items-center gap-1.5 justify-center py-1">
        <Icon name="lock" className="text-[15px]" />{bn ? 'অ্যাডমিন সুরক্ষিত অডিট লগ · লালমনিরহাট হাব' : 'Admin-secured audit log · Lalmonirhat Hub'}
      </button>
    </div>
  );
}

// H15 — Settings & controls. Built from design
// 15._admin_settings_controls_jovro: master service switch,
// service schedule (morning/evening shifts), delivery-slot
// editor, admin profile & security, change password, logout.
export function AdminSettings() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const settings = state.adminSettings;
  const [hours, setHours] = useState(settings.serviceHours);
  const [newSlot, setNewSlot] = useState('');
  const [pwNote, setPwNote] = useState(false);

  const saveHours = () => {
    dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, serviceHours: hours } });
    logAction(dispatch, actor, `সার্ভিসের সময় বদল করেছেন: ${hours}`, 'general');
  };
  const setSlots = (slots: string[]) =>
    dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, deliverySlots: slots } });

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="settings"
        titleBn="অ্যাডমিন সেটিংস ও নিয়ন্ত্রণ"
        titleEn="Admin Settings & Controls"
        right={<span className="text-label-sm font-bold text-primary bg-primary/10 rounded-full px-2 py-1">{bn ? 'লাইভ' : 'LIVE'}</span>}
      />

      {/* Master switch — design 15 */}
      <AdminCard className={clsx('flex flex-col gap-2', !state.isServiceOpen && 'border-error/40')}>
        <div className="flex items-center gap-3">
          <span className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center', state.isServiceOpen ? 'bg-primary/10' : 'bg-error/10')}>
            <Icon name="power_settings_new" className={clsx('text-[22px]', state.isServiceOpen ? 'text-primary' : 'text-error')} />
          </span>
          <div className="flex-1">
            <p className="text-label-md text-on-surface-variant">{bn ? 'মাস্টার সার্ভিস সুইচ' : 'Master Service Switch'}</p>
            <p className="text-body-lg font-bold text-on-surface">
              {state.isServiceOpen ? (bn ? 'সার্ভিস চালু আছে' : 'Service is ACTIVE & ON') : (bn ? 'সার্ভিস বন্ধ আছে' : 'Service is OFF')}
            </p>
          </div>
          <ToggleRow
            titleBn="" titleEn="" danger={!state.isServiceOpen}
            label={bn ? 'মাস্টার সার্ভিস সুইচ' : 'Master Service Switch'}
            checked={state.isServiceOpen}
            onChange={() => { dispatch({ type: 'TOGGLE_SERVICE' }); logAction(dispatch, actor, `মাস্টার সার্ভিস সুইচ ${state.isServiceOpen ? 'বন্ধ' : 'চালু'} করেছেন`, 'general'); }}
          />
        </div>
        <p className="text-body-sm text-on-surface-variant">
          {state.isServiceOpen
            ? (bn ? 'গ্রাহকরা অ্যাপে অর্ডার প্লেস করতে পারছেন। লালমনিরহাট সদর জোন ডেলিভারির জন্য উন্মুক্ত।' : 'Customers can place orders. Lalmonirhat Sadar zone is open for delivery.')
            : (bn ? 'গ্রাহক অ্যাপে সার্ভিস বন্ধ অবস্থা দেখাবে।' : 'The customer app shows the closed state.')}
        </p>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><Icon name="check_circle" className="text-primary text-[14px]" />{bn ? 'সার্ভার রেসপন্স: স্বাভাবিক (৯৫ms)' : 'Server response: normal (95ms)'}</span>
          <span>Zone: Sadar #01</span>
        </p>
        <div className="border-t border-outline-variant/25 pt-3">
          <ToggleRow
            titleBn="আজকের স্লট ফুল" titleEn="Today's slots full"
            subBn="চালু থাকলে কাস্টমার অ্যাপে স্লট-ফুল অবস্থা দেখাবে" subEn="Shows the slot-full state in the customer app"
            label={bn ? 'আজকের স্লট ফুল' : "Today's slots full"}
            checked={state.isSlotFull}
            onChange={() => dispatch({ type: 'TOGGLE_SLOT' })}
          />
        </div>
      </AdminCard>

      {/* Service schedule — design 15 */}
      <AdminCard className="flex flex-col gap-3">
        <p className="text-label-lg font-bold text-on-surface">
          {bn ? 'সার্ভিসের সময়সূচী' : 'Service Schedule'}
          <span className="block text-label-sm font-normal text-on-surface-variant">Store Operations & Delivery Shifts · {bn ? 'লালমনিরহাট সদর হাব' : 'Sadar Hub'}</span>
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 bg-surface-container rounded-2xl px-3.5 py-3">
            <Icon name="wb_sunny" className="text-amber-500 text-[22px]" />
            <div className="flex-1">
              <p className="text-body-md font-semibold text-on-surface">{bn ? 'সকালের শিফট (Morning Shift)' : 'Morning Shift'}</p>
              <p className="text-label-sm text-on-surface-variant">{bn ? 'শুরু (From) সকাল ০৬:০০ · পর্যন্ত (To) দুপুর ০১:৩০' : 'From 06:00 · To 13:30'}</p>
            </div>
            <span className="text-label-sm font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{bn ? 'সক্রিয়' : 'Active'}</span>
          </div>
          <div className="flex items-center gap-3 bg-surface-container rounded-2xl px-3.5 py-3">
            <Icon name="nights_stay" className="text-tertiary text-[22px]" />
            <div className="flex-1">
              <p className="text-body-md font-semibold text-on-surface">{bn ? 'বিকালের শিফট (Evening Shift)' : 'Evening Shift'}</p>
              <p className="text-label-sm text-on-surface-variant">{bn ? 'শুরু (From) বিকাল ০৪:৩০ · পর্যন্ত (To) রাত ১০:৩০' : 'From 16:30 · To 22:30'}</p>
            </div>
            <span className="text-label-sm font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{bn ? 'সক্রিয়' : 'Active'}</span>
          </div>
        </div>
        <Field labelBn="সার্ভিসের সময় (প্রদর্শন)" labelEn="Service hours (display)">
          <div className="flex gap-2">
            <input value={hours} onChange={e => setHours(e.target.value)} className={inputCls} />
            <button onClick={saveHours} className="px-4 rounded-xl bg-primary text-white text-label-md font-bold inline-flex items-center gap-1.5 flex-shrink-0">
              <Icon name="save" className="text-[16px]" />{bn ? 'সময় সেভ করুন' : 'Save Schedule'}
            </button>
          </div>
        </Field>
      </AdminCard>

      {/* Slot editor — design 15 */}
      <AdminCard className="flex flex-col gap-2.5">
        <p className="text-label-lg font-bold text-on-surface">
          {bn ? 'ডেলিভারি স্লট তালিকা ও এডিটর' : 'Delivery Slot Editor'}
          <span className="block text-label-sm font-normal text-on-surface-variant">Manage Active Dispatch Intervals · {toBnDigits(settings.deliverySlots.length, lang)}{bn ? 'টি স্লট' : ' slots'}</span>
        </p>
        {settings.deliverySlots.map((slot, i) => (
          <div key={`${slot}-${i}`} className="flex items-center gap-3 bg-surface-container rounded-2xl px-3.5 py-2.5">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="shopping_basket" className="text-[16px]" />
            </span>
            <p className="flex-1 text-body-md font-medium text-on-surface">
              <span className="text-label-sm text-on-surface-variant block">{bn ? `স্লট ${toBnDigits(i + 1, lang)}` : `Slot ${i + 1}`}</span>
              {slot}
            </p>
            <button
              onClick={() => { setSlots(settings.deliverySlots.filter((_, x) => x !== i)); logAction(dispatch, actor, `ডেলিভারি স্লট সরিয়েছেন: ${slot}`, 'general'); }}
              aria-label="remove slot"
              className="text-error"
            >
              <Icon name="delete" className="text-[18px]" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={newSlot}
            onChange={e => setNewSlot(e.target.value)}
            placeholder={bn ? 'যেমন: রাত ০৮:০০ – ১০:০০' : 'e.g. 8PM – 10PM'}
            className={inputCls}
          />
          <button
            onClick={() => { if (!newSlot.trim()) return; setSlots([...settings.deliverySlots, newSlot.trim()]); logAction(dispatch, actor, `নতুন ডেলিভারি স্লট যোগ করেছেন: ${newSlot.trim()}`, 'general'); setNewSlot(''); }}
            className="px-3.5 rounded-xl border-2 border-dashed border-primary text-primary text-label-md font-bold inline-flex items-center gap-1 flex-shrink-0"
          >
            <Icon name="add_circle" className="text-[16px]" />{bn ? '+ নতুন স্লট যোগ করুন' : 'Add Slot'}
          </button>
        </div>
      </AdminCard>

      {/* Admin profile — design 15 */}
      <AdminCard className="flex flex-col gap-3">
        <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
          <Icon name="admin_panel_settings" className="text-primary text-[20px]" />
          {bn ? 'অ্যাডমিন প্রোফাইল ও নিরাপত্তা' : 'Admin Profile & Security'}
          <span className="block text-label-sm font-normal text-on-surface-variant">Operator Credentials & Role</span>
        </p>
        <div className="flex flex-col gap-2.5 text-body-sm">
          <p className="flex items-center gap-2.5">
            <Icon name="person" className="text-on-surface-variant text-[19px]" />
            <span className="text-on-surface-variant w-32 flex-shrink-0">{bn ? 'অ্যাডমিন নাম' : 'Admin Name'}</span>
            <b className="text-on-surface">{state.user ? (bn ? state.user.nameBn : state.user.name) : '—'}</b>
          </p>
          <p className="text-label-sm text-on-surface-variant pl-8 -mt-1.5">{bn ? 'মালিক ও প্রধান অপারেটর (Lalmonirhat Hub)' : 'Owner & chief operator (Lalmonirhat Hub)'}</p>
          <p className="flex items-center gap-2.5">
            <Icon name="mail" className="text-on-surface-variant text-[19px]" />
            <span className="text-on-surface-variant w-32 flex-shrink-0">{bn ? 'লগইন ইমেইল' : 'Login Email'}</span>
            <b className="text-on-surface">{state.user?.email ?? 'admin@jovro.app'}</b>
          </p>
          <p className="flex items-center gap-2.5">
            <Icon name="call" className="text-on-surface-variant text-[19px]" />
            <span className="text-on-surface-variant w-32 flex-shrink-0">{bn ? 'মোবাইল নম্বর' : 'Mobile'}</span>
            <b className="text-on-surface">{state.user ? toBnDigits(state.user.mobile, lang) : '—'}</b>
          </p>
        </div>
        <button onClick={() => setPwNote(v => !v)} className="w-full h-11 rounded-xl border-2 border-outline-variant text-label-lg font-bold text-on-surface inline-flex items-center justify-center gap-2">
          <Icon name="lock_reset" className="text-[18px]" />{bn ? 'পাসওয়ার্ড পরিবর্তন করুন / Change Password' : 'Change Password'}
        </button>
        {pwNote && (
          <p className="text-label-md text-on-surface-variant text-center">{bn ? 'ডেমো সংস্করণে পাসওয়ার্ড বদল নিষ্ক্রিয় আছে।' : 'Password change is disabled in the demo build.'}</p>
        )}
        <button
          onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/login'); }}
          className="w-full h-11 rounded-xl bg-error text-white text-label-lg font-bold inline-flex items-center justify-center gap-2"
        >
          <Icon name="logout" className="text-[18px]" />{bn ? 'লগআউট / Log out' : 'Log out'}
          <span className="text-label-sm font-normal opacity-80">{bn ? '(অ্যাডমিন প্যানেল থেকে বের হন)' : ''}</span>
        </button>
      </AdminCard>
    </div>
  );
}
