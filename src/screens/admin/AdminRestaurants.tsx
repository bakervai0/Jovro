import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { MenuItem, Restaurant } from '../../types';
import {
  AdminCard, Field, Icon, PageTitle, ToggleRow, fmtTk, inputCls, logAction,
  toBnDigits, useActorName, useBn,
} from './adminShared';
import { areaName, uid } from '../../services/orderUtils';

const TYPE_OPTIONS = ['বিরিয়ানি / Biryani', 'ভাত-হোটেল / Rice Hotel', 'ফাস্টফুড / Fast Food', 'মিষ্টি / Sweets & Bakery', 'অন্যান্য / Others'];
const SECTION_OPTIONS = ['সেট মেনু / Set Menu', 'একক আইটেম / Single Items', 'পানীয় ও ডেজার্ট / Drinks & Dessert', 'স্পেশাল থালি / Special Thali'];

// H7 — Restaurants. Built from design 5._restaurants_form_jovro:
// partner header, restaurant list (delivery time, names, edit,
// type, area, minimum, OPEN/CLOSED) and the add/edit form card
// (photo, names, type, 114-area picker, timings, min order,
// open status, Save).
export function AdminRestaurants() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();

  const blank: Restaurant = {
    id: '', nameBn: '', nameEn: '', cuisineTypeBn: 'বিরিয়ানি', cuisineTypeEn: 'Biryani',
    address: '', isOpen: true, minOrder: 100, deliveryTimeMin: 25, rating: 0, ratingCount: 0,
    imageEmoji: '🍛', areaId: state.areas[0]?.id, openingTime: '09:00', closingTime: '22:00', menuItems: [],
  };
  const [params] = useSearchParams();
  const [form, setForm] = useState<Restaurant>(blank);
  const [editing, setEditing] = useState(() => params.get('new') === '1');

  const openCount = state.restaurants.filter(r => r.isOpen).length;

  const startEdit = (r: Restaurant) => {
    setForm({ ...r });
    setEditing(true);
  };

  const save = () => {
    if (!form.nameBn.trim()) return;
    const area = state.areas.find(a => a.id === form.areaId);
    const restaurant: Restaurant = {
      ...form,
      id: form.id || uid('rest'),
      nameEn: form.nameEn.trim() || form.nameBn.trim(),
      address: form.address.trim() || (area ? (bn ? area.nameBn : area.nameEn) : ''),
      cuisineTypeBn: form.cuisineTypeBn.split(' / ')[0],
      cuisineTypeEn: form.cuisineTypeEn || form.cuisineTypeBn.split(' / ')[1] || form.cuisineTypeBn,
    };
    dispatch({ type: form.id ? 'UPDATE_RESTAURANT' : 'ADD_RESTAURANT', restaurant });
    logAction(dispatch, actor, form.id ? `রেস্টুরেন্ট বদল করেছেন: ${restaurant.nameBn}` : `নতুন রেস্টুরেন্ট যোগ করেছেন: ${restaurant.nameBn}`, 'general');
    setForm(blank);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="storefront"
        titleBn="রেস্টুরেন্ট পার্টনার"
        titleEn="Restaurant Partners"
        subBn="Lalmonirhat Sadar Zone Management"
        subEn="Lalmonirhat Sadar Zone Management"
        right={<span className="text-label-sm font-semibold text-primary bg-primary/10 rounded-full px-2 py-1">{toBnDigits(openCount, lang)}{bn ? 'টি সক্রিয়' : ' active'}</span>}
      />

      <div className="flex items-center justify-between">
        <p className="text-label-lg font-bold text-on-surface">
          {bn ? 'রেস্টুরেন্ট তালিকা / Restaurants' : 'Restaurants / রেস্টুরেন্ট তালিকা'}
          <span className="block text-label-sm font-normal text-on-surface-variant">
            {toBnDigits(state.restaurants.length, lang)} restaurants enrolled in Lalmonirhat
          </span>
        </p>
        <button
          onClick={() => { setForm(blank); setEditing(true); }}
          className="inline-flex items-center gap-1 bg-primary text-white text-label-md font-bold rounded-full px-3 py-2"
        >
          <Icon name="add" className="text-[16px]" />{bn ? 'নতুন যোগ' : 'Add new'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {state.restaurants.map(r => (
          <AdminCard key={r.id}>
            <div className="flex items-start gap-3">
              <span className="text-[30px] leading-none">{r.imageEmoji ?? '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-semibold bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant inline-flex items-center gap-1">
                    <Icon name="schedule" className="text-[12px]" />{toBnDigits(r.deliveryTimeMin, lang)} {bn ? 'মিনিট' : 'min'}
                  </span>
                  <span className={clsx('ml-auto text-label-sm font-bold px-2 py-0.5 rounded-full', r.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-error/12 text-error')}>
                    {r.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <p className="text-body-lg font-bold text-on-surface mt-1">{bn ? r.nameBn : r.nameEn}</p>
                <p className="text-label-md text-on-surface-variant">{bn ? r.nameEn : r.nameBn}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {bn ? r.cuisineTypeBn : r.cuisineTypeEn} · <Icon name="place" className="text-[13px]" /> {r.areaId ? areaName(state.areas, r.areaId, lang) : r.address}
                </p>
                <p className="text-label-md text-on-surface-variant">{bn ? 'মিনিমাম:' : 'Minimum:'} {fmtTk(r.minOrder, lang)}</p>
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-outline-variant/25">
                  <button onClick={() => startEdit(r)} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
                    <Icon name="edit" className="text-[15px]" />{bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button onClick={() => navigate(`/admin/restaurants/${r.id}/menu`)} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
                    <Icon name="menu_book" className="text-[15px]" />{bn ? 'মেনু' : 'Menu'}
                  </button>
                  <span className="ml-auto">
                    <ToggleRow
                      titleBn="" titleEn=""
                      checked={r.isOpen}
                      onChange={v => {
                        dispatch({ type: 'UPDATE_RESTAURANT', restaurant: { ...r, isOpen: v } });
                        logAction(dispatch, actor, `রেস্টুরেন্ট ${r.nameBn} ${v ? 'খুলেছেন' : 'বন্ধ করেছেন'}`, 'general');
                      }}
                    />
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Add / edit form — design 5 */}
      {editing && (
        <AdminCard className="flex flex-col gap-4 border-primary/40">
          <div className="flex items-center gap-2">
            <Icon name="restaurant" className="text-primary text-[22px]" />
            <p className="text-label-lg font-bold text-on-surface flex-1">
              {form.id ? (bn ? 'রেস্টুরেন্ট সম্পাদনা' : 'Edit Restaurant') : (bn ? 'রেস্টুরেন্ট যোগ / Add Restaurant' : 'Add Restaurant')}
              <span className="block text-label-sm font-normal text-on-surface-variant">{bn ? 'নতুন পার্টনার ডাটাবেসে অন্তর্ভুক্ত করুন' : 'Add the partner to the database'}</span>
            </p>
            <button onClick={() => setEditing(false)} aria-label="close"><Icon name="close" className="text-on-surface-variant" /></button>
          </div>

          <div>
            <p className="text-label-md font-semibold text-on-surface-variant">{bn ? 'রেস্টুরেন্টের লোগো বা ছবি / Upload Photo' : 'Restaurant photo / লোগো'}</p>
            <div className="mt-1.5 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container/60 py-4 flex flex-col items-center gap-1">
              <span className="text-[34px] leading-none">{form.imageEmoji || '🍽️'}</span>
              <Icon name="cloud_upload" className="text-on-surface-variant text-[20px]" />
              <p className="text-label-sm text-on-surface-variant">{bn ? 'ছবি নির্বাচন করতে ট্যাপ করুন · JPG, PNG (সর্বোচ্চ ২ MB)' : 'Tap to pick a photo · JPG, PNG (max 2 MB)'}</p>
            </div>
            <input
              value={form.imageEmoji ?? ''}
              onChange={e => setForm({ ...form, imageEmoji: e.target.value })}
              className={clsx(inputCls, 'mt-2')}
              placeholder={bn ? 'ইমোজি বা ছবির URL' : 'Emoji or image URL'}
            />
          </div>

          <Field labelBn="নাম (বাংলা)" labelEn="Name (Bangla)" required>
            <input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} className={inputCls} placeholder={bn ? 'যেমন: হাজী বিরিয়ানি হাউজ' : 'e.g. Haji Biryani House'} />
          </Field>
          <Field labelBn="Name (English)" labelEn="Name (English)">
            <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={inputCls} placeholder="Haji Biryani House" />
          </Field>
          <Field labelBn="রেস্টুরেন্টের ধরণ / Type" labelEn="Type / ধরণ">
            <select
              value={TYPE_OPTIONS.find(t => t.startsWith(form.cuisineTypeBn)) ?? TYPE_OPTIONS[4]}
              onChange={e => {
                const [bnPart, enPart] = e.target.value.split(' / ');
                setForm({ ...form, cuisineTypeBn: bnPart, cuisineTypeEn: enPart ?? bnPart });
              }}
              className={inputCls}
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field labelBn="এলাকা / Area picker" labelEn="Area picker / এলাকা" hint={bn ? `১১৪টি এলাকা সক্রিয় · ${toBnDigits(state.areas.length, lang)} areas` : `${state.areas.length} areas active`}>
            <select value={form.areaId ?? ''} onChange={e => setForm({ ...form, areaId: e.target.value })} className={inputCls}>
              {state.areas.map(a => (
                <option key={a.id} value={a.id}>{bn ? a.nameBn : a.nameEn} / {bn ? a.nameEn : a.nameBn}</option>
              ))}
            </select>
          </Field>
          <Field labelBn="ঠিকানা / Address" labelEn="Address / ঠিকানা">
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder={bn ? 'যেমন: মিশন মোড়' : 'e.g. Mission Mor'} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field labelBn="খোলা / Opening" labelEn="Opening / খোলা">
              <input type="time" value={form.openingTime ?? '09:00'} onChange={e => setForm({ ...form, openingTime: e.target.value })} className={inputCls} />
            </Field>
            <Field labelBn="বন্ধ / Closing" labelEn="Closing / বন্ধ">
              <input type="time" value={form.closingTime ?? '22:00'} onChange={e => setForm({ ...form, closingTime: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field labelBn="সর্বনিম্ন অর্ডার মূল্য / Min. order" labelEn="Min. order / সর্বনিম্ন অর্ডার" hint={bn ? 'অর্ডার ডেলিভারির ন্যূনতম কার্ট ভ্যালু' : 'Minimum cart value for delivery'}>
            <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
              <span className="font-bold text-on-surface-variant">৳</span>
              <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) || 0 })} className="flex-1 py-2.5 bg-transparent outline-none text-body-md font-bold text-on-surface min-w-0" />
              <Icon name="payments" className="text-on-surface-variant text-[18px]" />
            </div>
          </Field>
          <ToggleRow
            titleBn="দোকান চালু / Open status" titleEn="Open status / দোকান চালু"
            subBn="গ্রাহকরা অ্যাপে অর্ডার প্লেস করতে পারবেন" subEn="Customers can order in the app"
            checked={form.isOpen} onChange={v => setForm({ ...form, isOpen: v })}
          />
          <button onClick={save} disabled={!form.nameBn.trim()} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Icon name="check_circle" className="text-[19px]" />{bn ? 'রেস্টুরেন্ট সেভ করুন / Save Restaurant' : 'Save Restaurant'}
          </button>
        </AdminCard>
      )}
    </div>
  );
}

// H8 — Menu items. Built from design 6._restaurant_menu_items_jovro:
// restaurant header + fixed-price verified banner, section
// chips with counts, item list (ফিক্সড chip, price, availability)
// and the add/edit item form (photo, names, section, description,
// fixed price, availability, Save).
export function AdminRestaurantMenu() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const restaurant = state.restaurants.find(r => r.id === id);

  const blankItem: MenuItem = {
    id: '', restaurantId: id ?? '', nameBn: '', nameEn: '', price: 0,
    section: 'সেট মেনু', description: '', imageEmoji: '🍽️', isAvailable: true,
  };
  const [form, setForm] = useState<MenuItem>(blankItem);
  const [editing, setEditing] = useState(false);

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon name="search_off" className="text-[48px] text-on-surface-variant/50" />
        <p className="text-body-lg text-on-surface-variant">{bn ? 'রেস্টুরেন্ট পাওয়া যায়নি' : 'Restaurant not found'}</p>
        <button onClick={() => navigate('/admin/restaurants')} className="text-primary font-semibold">{bn ? 'তালিকায় ফিরুন' : 'Back to list'}</button>
      </div>
    );
  }

  const sectionOf = (item: MenuItem) => item.section ?? 'একক আইটেম';
  const sectionCounts = SECTION_OPTIONS.map(s => {
    const bnPart = s.split(' / ')[0];
    return { label: s, count: restaurant.menuItems.filter(i => sectionOf(i) === bnPart).length };
  });

  const saveRestaurant = (items: MenuItem[], note: string) => {
    dispatch({ type: 'UPDATE_RESTAURANT', restaurant: { ...restaurant, menuItems: items } });
    logAction(dispatch, actor, note, 'general');
  };

  const saveItem = () => {
    if (!form.nameBn.trim() || !form.price) return;
    const item: MenuItem = {
      ...form, id: form.id || uid('mi'), restaurantId: restaurant.id,
      nameEn: form.nameEn.trim() || form.nameBn.trim(),
    };
    const items = form.id
      ? restaurant.menuItems.map(i => i.id === item.id ? item : i)
      : [...restaurant.menuItems, item];
    saveRestaurant(items, form.id ? `মেনু আইটেম বদল করেছেন: ${item.nameBn} (${restaurant.nameBn})` : `নতুন মেনু আইটেম যোগ করেছেন: ${item.nameBn} (${restaurant.nameBn})`);
    setForm(blankItem);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/restaurants')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'মেনু আইটেম ব্যবস্থাপনা' : 'Menu Management'}
      </button>
      <PageTitle
        icon="storefront"
        titleBn={restaurant.nameBn}
        titleEn={restaurant.nameEn}
        subBn={`ফিক্সড প্রাইস · ${restaurant.areaId ? areaName(state.areas, restaurant.areaId, lang) : restaurant.address}`}
        subEn={`Fixed price · ${restaurant.address}`}
      />

      {/* Fixed-price banner — design 6 */}
      <div className="rounded-2xl bg-primary/8 border border-primary/30 px-4 py-3 flex gap-3">
        <Icon name="verified" className="text-primary text-[22px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'রেস্টুরেন্টের খাবার নির্ধারিত দামে বিক্রি হয়' : 'Restaurant food sells at fixed prices'}</b>
          <span className="block text-label-md text-on-surface-variant mt-0.5">
            {bn ? 'মেনুর রেট রেস্টুরেন্টের কাউন্টার প্রাইসের সমান ও যাচাইকৃত। অতিরিক্ত চার্জ নিষিদ্ধ।' : 'Menu rates equal the verified counter price. No extra charge allowed.'}
          </span>
        </p>
      </div>

      {/* Section counts — design 6 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {sectionCounts.map(s => (
          <span key={s.label} className="px-3 py-1.5 rounded-full bg-surface-container text-label-md font-semibold text-on-surface whitespace-nowrap flex-shrink-0">
            {bn ? s.label : s.label.split(' / ')[1]} · {toBnDigits(s.count, lang)}
          </span>
        ))}
      </div>

      <p className="text-label-lg font-bold text-on-surface">
        {bn ? `চলতি আইটেম তালিকা (${toBnDigits(restaurant.menuItems.length, lang)})` : `Active Catalogue (${restaurant.menuItems.length})`}
      </p>
      <div className="flex flex-col gap-3">
        {restaurant.menuItems.map(item => (
          <AdminCard key={item.id}>
            <div className="flex items-start gap-3">
              <span className="text-[28px] leading-none">{item.imageEmoji ?? '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <span className="text-label-sm font-semibold bg-tertiary/10 text-tertiary rounded-full px-2 py-0.5">{bn ? 'ফিক্সড' : 'Fixed'}</span>
                <p className="text-body-lg font-bold text-on-surface mt-1">{bn ? item.nameBn : item.nameEn}</p>
                <p className="text-label-md text-on-surface-variant">{bn ? item.nameEn : item.nameBn} · {sectionOf(item)}</p>
                <p className="text-body-md font-bold text-on-surface mt-1">
                  {fmtTk(item.price, lang)} <span className="text-label-sm font-normal text-on-surface-variant">({bn ? 'ফিক্সড প্রাইস' : 'fixed price'})</span>
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/25">
                  <span className={clsx('text-label-md font-semibold', item.isAvailable ? 'text-emerald-700' : 'text-error')}>
                    {item.isAvailable ? (bn ? 'উপলভ্য / In Stock' : 'In Stock') : (bn ? 'শেষ হয়ে গেছে / Sold Out' : 'Sold Out')}
                  </span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => { setForm({ ...item, section: sectionOf(item) }); setEditing(true); }} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
                      <Icon name="edit" className="text-[15px]" />{bn ? 'সম্পাদনা' : 'Edit'}
                    </button>
                    <button
                      role="switch"
                      aria-checked={item.isAvailable}
                      onClick={() => saveRestaurant(
                        restaurant.menuItems.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i),
                        `মেনু আইটেম ${item.nameBn} ${!item.isAvailable ? 'উপলভ্য' : 'বন্ধ'} করেছেন`,
                      )}
                      className={clsx('relative w-11 h-6 rounded-full transition-colors', item.isAvailable ? 'bg-primary' : 'bg-surface-container-highest')}
                    >
                      <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', item.isAvailable ? 'left-[22px]' : 'left-0.5')} />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
        {restaurant.menuItems.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-6">{bn ? 'কোনো মেনু আইটেম নেই' : 'No menu items yet'}</p>
        )}
      </div>

      <button onClick={() => { setForm(blankItem); setEditing(true); }} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2">
        <Icon name="restaurant_menu" className="text-[19px]" />{bn ? 'নতুন মেনু আইটেম যোগ' : 'Add Menu Item'}
      </button>

      {/* Add / edit form — design 6 */}
      {editing && (
        <AdminCard className="flex flex-col gap-4 border-primary/40">
          <p className="text-label-lg font-bold text-on-surface">
            {bn ? 'নতুন মেনু আইটেম যোগ' : 'Add / Edit Menu Item'}
            <span className="block text-label-sm font-normal text-on-surface-variant">Add / Edit Menu Item · {form.id ? 'Active Edit' : 'New'}</span>
          </p>
          <div>
            <p className="text-label-md font-semibold text-on-surface-variant">{bn ? 'খাবারের ছবি আপলোড / Food Photo' : 'Food Photo / খাবারের ছবি'}</p>
            <div className="mt-1.5 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container/60 py-4 flex flex-col items-center gap-1">
              <span className="text-[32px] leading-none">{form.imageEmoji || '🍽️'}</span>
              <Icon name="add_a_photo" className="text-on-surface-variant text-[20px]" />
              <p className="text-label-sm text-on-surface-variant">{bn ? 'ছবি তুলুন বা ফাইল বাছুন · JPG, PNG (সর্বোচ্চ ৩ মেগাবাইট)' : 'Take a photo or pick a file · JPG, PNG (max 3 MB)'}</p>
            </div>
            <input value={form.imageEmoji ?? ''} onChange={e => setForm({ ...form, imageEmoji: e.target.value })} className={clsx(inputCls, 'mt-2')} placeholder={bn ? 'ইমোজি বা URL' : 'Emoji or URL'} />
          </div>
          <Field labelBn="আইটেমের নাম (বাংলা)" labelEn="Item name (Bangla)" required>
            <input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} className={inputCls} placeholder={bn ? 'যেমন: কাচ্চি বিরিয়ানি (হাফ)' : 'e.g. Kacchi Biryani (Half)'} />
          </Field>
          <Field labelBn="Item Name (English)" labelEn="Item Name (English)">
            <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={inputCls} placeholder="Kacchi Biryani (Half)" />
          </Field>
          <Field labelBn="সেকশন / Section" labelEn="Section / সেকশন" required>
            <select
              value={SECTION_OPTIONS.find(s => s.startsWith(form.section ?? '')) ?? SECTION_OPTIONS[1]}
              onChange={e => setForm({ ...form, section: e.target.value.split(' / ')[0] })}
              className={inputCls}
            >
              {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field labelBn="সংক্ষিপ্ত বিবরণ / Short Description" labelEn="Short Description / বিবরণ">
            <textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className={clsx(inputCls, 'resize-none')} placeholder={bn ? 'সংক্ষিপ্ত বিবরণ…' : 'Short description…'} />
          </Field>
          <Field labelBn="মূল্য / Price (৳)" labelEn="Price (৳) / মূল্য" required hint={bn ? 'রেস্টুরেন্ট খাবারের দাম অপরিবর্তনশীল / Fixed restaurant price' : 'Fixed restaurant price'}>
            <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
              <span className="font-bold text-on-surface-variant">৳</span>
              <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) || 0 })} className="flex-1 py-2.5 bg-transparent outline-none text-body-md font-bold text-on-surface min-w-0" placeholder="180" />
              <span className="text-label-sm text-on-surface-variant">{bn ? 'ফিক্সড রেট' : 'Fixed rate'}</span>
            </div>
          </Field>
          <ToggleRow
            titleBn="উপলব্ধতা / Stock Availability" titleEn="Stock Availability / উপলব্ধতা"
            subBn="বর্তমানে অর্ডারের জন্য সচল (Active)" subEn="Currently active for orders"
            checked={form.isAvailable} onChange={v => setForm({ ...form, isAvailable: v })}
          />
          <button onClick={saveItem} disabled={!form.nameBn.trim() || !form.price} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Icon name="check_circle" className="text-[19px]" />{bn ? 'আইটেম সেভ করুন / Save Menu Item' : 'Save Menu Item'}
          </button>
        </AdminCard>
      )}
    </div>
  );
}
