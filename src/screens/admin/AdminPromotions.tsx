import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { PromoCode } from '../../types';
import {
  AdminCard, Field, Icon, PageTitle, SectionHead, ToggleRow, fmtDate, fmtTk,
  inputCls, logAction, toBnDigits, useActorName, useBn,
} from './adminShared';

// H9 — Promotions. Built from design 9._promotions_marketing_jovro:
// three tabs (প্রোমো কোড / ফ্ল্যাশ সেল / হোম ব্যানার), promo list
// cards (code, type, discount, min order, used, expiry, active),
// create-promo form (type chips ফ্রি ডেলিভারি / ৳ ছাড় / % ছাড়,
// value, min order, expiry, total limit), Flash Sale Manager
// with the active offer card + add form, and the 3-slot Banner
// Manager. Promos live in state.promos (cart validates against
// the same slice); flash sale + banners live in adminSettings.
type Tab = 'promo' | 'flash' | 'banner';

export default function AdminPromotions() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const settings = state.adminSettings;
  const [tab, setTab] = useState<Tab>('promo');

  // ── Create promo form state ──
  const [code, setCode] = useState('');
  const [type, setType] = useState<PromoCode['discountType']>('free-delivery');
  const [value, setValue] = useState('40');
  const [minOrder, setMinOrder] = useState('300');
  const [expiry, setExpiry] = useState('');
  const [limit, setLimit] = useState('');
  const [promoSaved, setPromoSaved] = useState(false);

  const createPromo = () => {
    if (!code.trim()) return;
    const promo: PromoCode = {
      code: code.trim().toUpperCase(),
      descriptionBn: type === 'free-delivery' ? 'ফ্রি ডেলিভারি' : type === 'percent' ? `${value}% ছাড়` : `৳${value} ছাড়`,
      descriptionEn: type === 'free-delivery' ? 'Free delivery' : type === 'percent' ? `${value}% off` : `৳${value} off`,
      discountType: type,
      discountValue: type === 'free-delivery' ? 0 : Number(value) || 0,
      minOrder: Number(minOrder) || 0,
      isActive: true,
      expiresAt: expiry || undefined,
      usedCount: 0,
      usageLimit: limit ? Number(limit) : undefined,
    };
    dispatch({ type: 'ADD_PROMO', promo });
    logAction(dispatch, actor, `নতুন প্রোমো কোড তৈরি করেছেন: ${promo.code}`, 'general');
    setCode('');
    setPromoSaved(true);
    setTimeout(() => setPromoSaved(false), 2000);
  };

  // ── Flash sale form state ──
  const flashProducts = state.products.filter(p => settings.flashSaleProductIds.includes(p.id));
  const [flashPick, setFlashPick] = useState('');

  const tabs: { id: Tab; icon: string; bn: string; en: string }[] = [
    { id: 'promo', icon: 'sell', bn: 'প্রোমো কোড (Promo Codes)', en: 'Promo Codes' },
    { id: 'flash', icon: 'bolt', bn: 'ফ্ল্যাশ সেল (Flash Sales)', en: 'Flash Sales' },
    { id: 'banner', icon: 'view_carousel', bn: 'হোম ব্যানার (Banners)', en: 'Home Banners' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="campaign"
        titleBn="প্রমোশন ও মার্কেটিং"
        titleEn="Promotions & Marketing"
        subBn="Promotions & Marketing Manager · লালমনিরহাট সদর"
        subEn="Promotions & Marketing Manager · Lalmonirhat Sadar"
        right={<span className="text-label-sm font-bold text-primary bg-primary/10 rounded-full px-2 py-1">{bn ? 'লাইভ ক্যাম্পেইন' : 'Live campaign'}</span>}
      />

      {/* Tabs — design 9 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-3 py-2 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0 inline-flex items-center gap-1.5',
              tab === t.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant',
            )}
          >
            <Icon name={t.icon} className="text-[16px]" />{bn ? t.bn : t.en}
          </button>
        ))}
      </div>

      {tab === 'promo' && (
        <>
          <SectionHead
            icon="local_offer"
            titleBn="প্রোমো কোড তালিকা ও তৈরি"
            titleEn="Promo Codes & Create"
            right={<span className="text-label-sm text-on-surface-variant">{toBnDigits(state.promos.filter(p => p.isActive).length, lang)}{bn ? 'টি সক্রিয় কোড' : ' active codes'}</span>}
          />
          <div className="flex flex-col gap-3">
            {state.promos.map(p => (
              <AdminCard key={p.code}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon name={p.discountType === 'free-delivery' ? 'local_shipping' : p.discountType === 'percent' ? 'percent' : 'payments'} className="text-primary text-[20px]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-lg font-bold text-on-surface">{p.code}</p>
                    <p className="text-label-md text-on-surface-variant">{bn ? p.descriptionBn : p.descriptionEn}</p>
                  </div>
                  <span className={clsx('text-label-sm font-bold px-2 py-1 rounded-full inline-flex items-center gap-1', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-on-surface-variant')}>
                    <Icon name="check_circle" className="text-[13px]" />{p.isActive ? (bn ? 'চালু আছে' : 'Active') : (bn ? 'বন্ধ' : 'Off')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className="text-label-sm text-on-surface-variant">{bn ? 'ছাড় / Discount' : 'Discount'}</p>
                    <p className="text-body-md font-bold text-on-surface">{p.discountType === 'free-delivery' ? (bn ? 'ফ্রি ডেলিভারি' : 'Free') : p.discountType === 'percent' ? `${toBnDigits(p.discountValue, lang)}%` : fmtTk(p.discountValue, lang)}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className="text-label-sm text-on-surface-variant">{bn ? 'সর্বনিম্ন অর্ডার' : 'Min order'}</p>
                    <p className="text-body-md font-bold text-on-surface">{fmtTk(p.minOrder, lang)}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className="text-label-sm text-on-surface-variant">{bn ? 'ব্যবহৃত / Used' : 'Used'}</p>
                    <p className="text-body-md font-bold text-on-surface">{toBnDigits(p.usedCount ?? 0, lang)}{p.usageLimit ? ` / ${toBnDigits(p.usageLimit, lang)}` : ''} {bn ? 'বার' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-label-md text-on-surface-variant inline-flex items-center gap-1">
                    <Icon name="event" className="text-[15px]" />{bn ? 'মেয়াদ:' : 'Expiry:'} {p.expiresAt ? fmtDate(p.expiresAt, lang) : (bn ? 'সীমাহীন' : 'No limit')}
                  </span>
                  <ToggleRow
                    titleBn="" titleEn=""
                    checked={p.isActive}
                    onChange={v => {
                      dispatch({ type: 'UPDATE_PROMO', promo: { ...p, isActive: v } });
                      logAction(dispatch, actor, `প্রোমো ${p.code} ${v ? 'চালু' : 'বন্ধ'} করেছেন`, 'general');
                    }}
                  />
                </div>
              </AdminCard>
            ))}
          </div>

          {/* Create form — design 9 */}
          <AdminCard className="flex flex-col gap-4 border-primary/40">
            <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="add_circle" className="text-primary text-[20px]" />
              {bn ? 'নতুন প্রোমো কোড তৈরি করুন' : 'Create New Promo Voucher'}
            </p>
            <Field labelBn="প্রোমো কোড (Promo Code)" labelEn="Promo Code" required>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={inputCls} placeholder="JOVROFREE" />
                <button
                  onClick={() => setCode(`JOVRO${Math.floor(10 + Math.random() * 89)}`)}
                  className="px-3 rounded-xl bg-surface-container text-label-md font-semibold text-primary flex-shrink-0"
                >
                  {bn ? 'জেনারেট' : 'Generate'}
                </button>
              </div>
            </Field>
            <div>
              <p className="text-label-md font-semibold text-on-surface-variant mb-1.5">{bn ? 'টাইপ নির্বাচন করুন (Discount Type)' : 'Discount Type'}</p>
              <div className="flex gap-2">
                {([
                  { id: 'free-delivery', icon: 'local_shipping', bn: 'ফ্রি ডেলিভারি', en: 'Free Delivery' },
                  { id: 'flat', icon: 'payments', bn: '৳ ছাড় (টাকা)', en: '৳ off' },
                  { id: 'percent', icon: 'percent', bn: '% ছাড়', en: '% off' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={clsx('flex-1 py-2.5 rounded-xl border-2 text-label-md font-semibold inline-flex flex-col items-center gap-1',
                      type === t.id ? 'border-primary bg-primary/8 text-primary' : 'border-outline-variant text-on-surface')}
                  >
                    <Icon name={t.icon} className="text-[18px]" />{bn ? t.bn : t.en}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field labelBn="ছাড়ের পরিমাণ" labelEn="Discount value">
                <input type="number" value={value} onChange={e => setValue(e.target.value)} disabled={type === 'free-delivery'} className={clsx(inputCls, type === 'free-delivery' && 'opacity-50')} />
              </Field>
              <Field labelBn="সর্বনিম্ন অর্ডার" labelEn="Minimum order">
                <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} className={inputCls} />
              </Field>
              <Field labelBn="মেয়াদ (Expiry Date)" labelEn="Expiry Date">
                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className={inputCls} />
              </Field>
              <Field labelBn="মোট লিমিট" labelEn="Usage limit">
                <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className={inputCls} placeholder={bn ? 'সীমাহীন' : 'Unlimited'} />
              </Field>
            </div>
            <button onClick={createPromo} disabled={!code.trim()} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Icon name="save" className="text-[19px]" />
              {promoSaved ? (bn ? 'তৈরি হয়েছে ✓' : 'Created ✓') : (bn ? 'প্রোমো কোড তৈরি করুন / Save Promo' : 'Save Promo')}
            </button>
          </AdminCard>
        </>
      )}

      {tab === 'flash' && (
        <>
          <SectionHead
            icon="timer"
            titleBn="ফ্ল্যাশ সেল ম্যানেজার"
            titleEn="Flash Sale Manager"
            right={<span className="text-label-sm text-on-surface-variant">{bn ? 'চলমান অফার' : 'Running offer'}</span>}
          />
          <ToggleRow
            titleBn="ফ্ল্যাশ সেল চালু" titleEn="Flash sale active"
            subBn="Flash Sale Manager & Countdown" subEn="ফ্ল্যাশ সেল ম্যানেজার"
            checked={settings.flashSaleActive}
            onChange={v => dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleActive: v } })}
          />
          {flashProducts.map(p => {
            const salePrice = Math.round(p.approxPrice * (1 - settings.flashSaleDiscount / 100));
            return (
              <div key={p.id} className="rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 text-white p-4">
                <p className="text-label-md font-semibold flex items-center gap-1.5">
                  <Icon name="local_fire_department" className="text-[17px]" />
                  {bn ? 'বর্তমান অফার (Active Flash Offer)' : 'Active Flash Offer'} · {toBnDigits(settings.flashSaleDiscount, lang)}% {bn ? 'ছাড়' : 'off'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[34px]">{p.imageEmoji ?? '🛒'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-lg font-bold truncate">{bn ? p.nameBn : p.nameEn}</p>
                    <p className="text-label-md text-white/85">
                      <b>{fmtTk(salePrice, lang)}</b> <s className="opacity-80">{fmtTk(p.approxPrice, lang)}</s>
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch({
                      type: 'UPDATE_ADMIN_SETTINGS',
                      settings: { ...settings, flashSaleProductIds: settings.flashSaleProductIds.filter(x => x !== p.id) },
                    })}
                    className="text-label-md font-semibold bg-white/20 rounded-full px-2.5 py-1.5"
                  >
                    {bn ? 'সরান' : 'Remove'}
                  </button>
                </div>
                <p className="text-label-sm text-white/85 flex items-center gap-1 mt-2">
                  <Icon name="alarm" className="text-[14px]" />
                  {settings.flashSaleStart} → {settings.flashSaleEnd}
                </p>
              </div>
            );
          })}
          {settings.flashSaleActive && flashProducts.length === 0 && (
            <p className="text-body-md text-on-surface-variant text-center py-3">{bn ? 'ফ্ল্যাশ সেলে কোনো প্রোডাক্ট নেই' : 'No products in the flash sale'}</p>
          )}

          {/* Add to flash sale — design 9 */}
          <AdminCard className="flex flex-col gap-4">
            <p className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="add_box" className="text-primary text-[20px]" />
              {bn ? 'নতুন ফ্ল্যাশ সেল আইটেম যোগ' : 'Add Product to Flash Deal'}
            </p>
            <Field labelBn="প্রোডাক্ট নির্বাচন করুন (Search Product)" labelEn="Select product">
              <select value={flashPick} onChange={e => setFlashPick(e.target.value)} className={inputCls}>
                <option value="">{bn ? 'প্রোডাক্ট বেছে নিন' : 'Choose a product'}</option>
                {state.products.filter(p => !settings.flashSaleProductIds.includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{bn ? p.nameBn : p.nameEn} — {fmtTk(p.approxPrice, lang)}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field labelBn="ছাড়ের হার (Discount)" labelEn="Discount %">
                <input
                  type="number"
                  value={settings.flashSaleDiscount}
                  onChange={e => dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleDiscount: Number(e.target.value) || 0 } })}
                  className={inputCls}
                />
              </Field>
              <Field labelBn="শুরুর সময় (Start)" labelEn="Start">
                <input type="date" value={settings.flashSaleStart} onChange={e => dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleStart: e.target.value } })} className={inputCls} />
              </Field>
              <Field labelBn="শেষের সময় (End)" labelEn="End">
                <input type="date" value={settings.flashSaleEnd} onChange={e => dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleEnd: e.target.value } })} className={inputCls} />
              </Field>
            </div>
            <button
              onClick={() => {
                if (!flashPick) return;
                dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleActive: true, flashSaleProductIds: [...settings.flashSaleProductIds, flashPick] } });
                const p = state.products.find(x => x.id === flashPick);
                if (p) logAction(dispatch, actor, `ফ্ল্যাশ সেলে যোগ করেছেন: ${p.nameBn} (${settings.flashSaleDiscount}% ছাড়)`, 'general');
                setFlashPick('');
              }}
              disabled={!flashPick}
              className="w-full h-12 rounded-2xl bg-secondary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icon name="bolt" className="text-[19px]" />{bn ? 'ফ্ল্যাশ সেলে প্রকাশ করুন / Save Deal' : 'Publish Flash Deal'}
            </button>
          </AdminCard>
        </>
      )}

      {tab === 'banner' && (
        <>
          <SectionHead
            icon="view_carousel"
            titleBn="হোম ব্যানার ম্যানেজার"
            titleEn="Banner Manager"
            right={<span className="text-label-sm text-on-surface-variant">{bn ? '৩টি স্লট' : '3 slots'}</span>}
          />
          {settings.banners.map((b, i) => (
            <AdminCard key={b.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-label-sm font-bold bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant">
                  {bn ? `স্লট ${toBnDigits(i + 1, lang)}` : `Slot ${i + 1}`}
                </span>
                <span className={clsx('text-label-sm font-bold px-2 py-0.5 rounded-full', b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container text-on-surface-variant')}>
                  {b.isActive ? (bn ? 'সক্রিয় / Active' : 'Active') : (bn ? 'বন্ধ' : 'Off')}
                </span>
                <span className="ml-auto text-[26px]">{b.image}</span>
              </div>
              <Field labelBn="শিরোনাম (বাংলা)" labelEn="Headline (Bangla)">
                <input
                  value={bn ? b.headlineBn : b.headlineEn}
                  onChange={e => dispatch({
                    type: 'UPDATE_ADMIN_SETTINGS',
                    settings: { ...settings, banners: settings.banners.map(x => x.id === b.id ? (bn ? { ...x, headlineBn: e.target.value } : { ...x, headlineEn: e.target.value }) : x) },
                  })}
                  className={inputCls}
                />
              </Field>
              <Field labelBn="সাব-টেক্সট" labelEn="Sub text">
                <input
                  value={bn ? b.subBn : b.subEn}
                  onChange={e => dispatch({
                    type: 'UPDATE_ADMIN_SETTINGS',
                    settings: { ...settings, banners: settings.banners.map(x => x.id === b.id ? (bn ? { ...x, subBn: e.target.value } : { ...x, subEn: e.target.value }) : x) },
                  })}
                  className={inputCls}
                />
              </Field>
              <div className="flex items-center gap-3">
                <Field labelBn="ছবি (ইমোজি)" labelEn="Image (emoji)">
                  <input
                    value={b.image}
                    onChange={e => dispatch({
                      type: 'UPDATE_ADMIN_SETTINGS',
                      settings: { ...settings, banners: settings.banners.map(x => x.id === b.id ? { ...x, image: e.target.value } : x) },
                    })}
                    className={clsx(inputCls, 'w-24 text-center')}
                  />
                </Field>
                <span className="ml-auto pt-5">
                  <ToggleRow
                    titleBn="" titleEn=""
                    checked={b.isActive}
                    onChange={v => dispatch({
                      type: 'UPDATE_ADMIN_SETTINGS',
                      settings: { ...settings, banners: settings.banners.map(x => x.id === b.id ? { ...x, isActive: v } : x) },
                    })}
                  />
                </span>
              </div>
            </AdminCard>
          ))}
          <div className="rounded-2xl border-2 border-dashed border-outline-variant p-4 flex items-center gap-3 text-on-surface-variant">
            <Icon name="add_photo_alternate" className="text-[24px]" />
            <p className="text-body-sm">{bn ? 'নতুন ব্যানার ইমেজ আপলোড করুন — ৩টি স্লট পূর্ণ হলে পুরনোটি বদলে দিন' : 'Upload a new banner image — with 3 slots full, replace an old one'}</p>
          </div>
          <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
            <Icon name="verified" className="text-primary text-[16px]" />
            {bn ? 'সরাসরি ক্যাম্পেইন মনিটরিং — সকল প্রমোশন ও সেল রিয়েলটাইমে কাস্টমার অ্যাপে আপডেট হয়।' : 'All promotions update live in the customer app.'}
          </p>
        </>
      )}
    </div>
  );
}
