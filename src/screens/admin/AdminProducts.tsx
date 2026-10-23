import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { Product, ProductCategory } from '../../types';
import { CATEGORY_INFO } from '../../data/products';
import {
  AdminCard, Field, Icon, PageTitle, ToggleRow, fmtTk, inputCls, logAction,
  toBnDigits, useActorName, useBn,
} from './adminShared';
import { uid } from '../../services/orderUtils';

// H5 — Product list. Built from design
// 3._product_list_bazaar_products_jovro: heading + Goshala
// Bazar sub-line, search row, category chips, "মোট Nটি আইটেম"
// summary, product cards with edit/delete, unit + approx price,
// receipt note and availability state, "+ নতুন প্রোডাক্ট" button.
export function AdminProductsList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [deleting, setDeleting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let list = state.products;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p => p.nameBn.includes(query.trim()) || p.nameEn.toLowerCase().includes(q));
    }
    return list;
  }, [state.products, cat, query]);

  const availableCount = state.products.filter(p => p.isAvailable).length;

  const confirmDelete = () => {
    if (!deleting) return;
    dispatch({ type: 'DELETE_PRODUCT', id: deleting.id });
    logAction(dispatch, actor, `পণ্য মুছে ফেলেছেন: ${deleting.nameBn}`, 'general');
    setDeleting(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        icon="storefront"
        titleBn="বাজার প্রোডাক্ট তালিকা"
        titleEn="Bazaar Products Catalogue"
        subBn="গোশালা বাজার কাঁচাবাজার ও মুদি আইটেম (Lalmonirhat Sadar)"
        subEn="Goshala Bazar fresh & grocery items (Lalmonirhat Sadar)"
        right={<span className="text-label-sm font-semibold text-primary bg-primary/10 rounded-full px-2 py-1">{bn ? 'গোশালা বাজার লাইভ' : 'Live'}</span>}
      />

      {/* Search — design 3 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2 flex-1">
          <Icon name="search" className="text-on-surface-variant text-[20px]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={bn ? 'পণ্য খুঁজুন' : 'Search products'}
            className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
          />
        </div>
        <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
          <Icon name="barcode_scanner" className="text-on-surface-variant text-[20px]" />
        </span>
      </div>

      {/* Category chips — design 3 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <button
          onClick={() => setCat('all')}
          className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0 inline-flex items-center gap-1',
            cat === 'all' ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
        >
          {cat === 'all' && <Icon name="check" className="text-[14px]" />}{bn ? 'সব' : 'All'}
        </button>
        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setCat(key)}
            className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0 inline-flex items-center gap-1',
              cat === key ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            {cat === key && <Icon name="check" className="text-[14px]" />}
            {bn ? info.nameBn : info.nameEn}
          </button>
        ))}
      </div>

      <p className="text-label-md text-on-surface-variant flex items-center gap-1.5">
        <Icon name="inventory_2" className="text-[16px]" />
        {bn
          ? `মোট ${toBnDigits(state.products.length, lang)}টি আইটেম • ${toBnDigits(availableCount, lang)}টি উপলভ্য`
          : `${state.products.length} total items • ${availableCount} available`}
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
          <Icon name="receipt_long" className="text-[15px]" />{bn ? 'রসিদ যাচাই' : 'Receipt check'}
        </span>
      </p>

      {/* Delete confirmation — design 4 dialog */}
      {deleting && (
        <div className="rounded-2xl border-2 border-error/40 bg-red-50 p-4">
          <p className="text-body-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="warning" className="text-error" />
            {bn ? 'প্রোডাক্টটি মুছতে চান?' : 'Delete this product?'}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            ‘{bn ? deleting.nameBn : deleting.nameEn}’ {bn ? 'ক্যাটালগ থেকে চিরতরে মুছে ফেলা হবে। আপনি কি নিশ্চিত?' : 'will be permanently removed from the catalogue. Are you sure?'}
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={confirmDelete} className="flex-1 h-11 rounded-xl bg-error text-white text-label-lg font-bold inline-flex items-center justify-center gap-1.5">
              <Icon name="delete_forever" className="text-[18px]" />{bn ? 'হ্যাঁ, মুছে ফেলুন / Yes, Delete' : 'Yes, Delete'}
            </button>
            <button onClick={() => setDeleting(null)} className="flex-1 h-11 rounded-xl border-2 border-outline-variant text-label-lg font-bold text-on-surface">
              {bn ? 'না, বাতিল / Cancel' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(p => (
          <AdminCard key={p.id}>
            <div className="flex items-start gap-3">
              <span className="text-[30px] leading-none">{p.imageEmoji ?? '🛒'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-semibold bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant">
                    {p.tags?.includes('popular') ? (bn ? 'জনপ্রিয়' : 'Popular') : (bn ? CATEGORY_INFO[p.category]?.nameBn : CATEGORY_INFO[p.category]?.nameEn)}
                  </span>
                  <span className="ml-auto flex gap-1">
                    <button onClick={() => navigate(`/admin/products/${p.id}/edit`)} aria-label="edit" className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                      <Icon name="edit" className="text-[16px] text-primary" />
                    </button>
                    <button onClick={() => setDeleting(p)} aria-label="delete" className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                      <Icon name="delete" className="text-[16px] text-error" />
                    </button>
                  </span>
                </div>
                <p className="text-body-lg font-bold text-on-surface mt-1">{bn ? p.nameBn : p.nameEn}</p>
                <p className="text-label-md text-on-surface-variant">{bn ? p.nameEn : p.nameBn}</p>
                <p className="text-body-sm text-on-surface mt-1.5">
                  {bn ? 'একক:' : 'Unit:'} {bn ? p.unit : p.unitEn} · {bn ? 'আনুমানিক' : 'Approx'} <b>{fmtTk(p.approxPrice, lang)}</b> / {bn ? p.unit : p.unitEn}
                </p>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <Icon name="info" className="text-[13px]" />
                  {p.description || (bn ? 'বাজার রসিদ অনুযায়ী চূড়ান্ত মূল্য নির্ধারিত হবে' : 'Final price as per bazaar receipt')}
                </p>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-outline-variant/25">
                  <span className={clsx('text-label-md font-semibold', p.isAvailable ? 'text-emerald-700' : 'text-error')}>
                    {p.isAvailable
                      ? (bn ? 'সাধারণত পাওয়া যায় (Available)' : 'Usually available')
                      : (bn ? 'স্টক আউট (Unavailable)' : 'Out of stock')}
                  </span>
                  <button
                    role="switch"
                    aria-checked={p.isAvailable}
                    onClick={() => {
                      dispatch({ type: 'UPDATE_PRODUCT', product: { ...p, isAvailable: !p.isAvailable } });
                      logAction(dispatch, actor, `পণ্য ${p.nameBn} ${!p.isAvailable ? 'উপলভ্য' : 'স্টক আউট'} করেছেন`, 'general');
                    }}
                    className={clsx('relative w-11 h-6 rounded-full transition-colors', p.isAvailable ? 'bg-primary' : 'bg-surface-container-highest')}
                  >
                    <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', p.isAvailable ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-body-md text-on-surface-variant py-8">{bn ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}</p>
        )}
      </div>

      <button
        onClick={() => navigate('/admin/products/new')}
        className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2"
      >
        <Icon name="add_circle" className="text-[20px]" />
        {bn ? '+ নতুন প্রোডাক্ট' : '+ Add Product'} · {bn ? 'Add Product' : 'নতুন প্রোডাক্ট'}
      </button>
    </div>
  );
}

// H6 — Add / Edit product form. Built from design
// 4._add_edit_product_form_jovro: photo upload box, Bn/En
// names, category dropdown, unit chips, approx price with the
// receipt note, description, availability + flash-sale
// toggles, Save, and (edit) Delete + confirmation dialog.
const UNIT_CHIPS = [
  { bn: '১ কেজি', en: '1 kg', unitBn: 'কেজি', unitEn: 'kg' },
  { bn: '৫০০ গ্রাম', en: '500 g', unitBn: '৫০০ গ্রাম', unitEn: '500 g' },
  { bn: '১ লিটার', en: '1 litre', unitBn: 'লিটার', unitEn: 'ltr' },
  { bn: '১ হালি', en: '4 pcs', unitBn: 'হালি', unitEn: '4 pcs' },
  { bn: '১ ডজন', en: '1 dozen', unitBn: 'ডজন', unitEn: 'dozen' },
  { bn: '১ পিস', en: '1 pc', unitBn: 'পিস', unitEn: 'pc' },
];

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = useBn();
  const actor = useActorName();
  const existing = id ? state.products.find(p => p.id === id) : undefined;
  const settings = state.adminSettings;

  const [nameBn, setNameBn] = useState(existing?.nameBn ?? '');
  const [nameEn, setNameEn] = useState(existing?.nameEn ?? '');
  const [category, setCategory] = useState<ProductCategory>(existing?.category ?? 'rice-pulses');
  const [unitBn, setUnitBn] = useState(existing?.unit ?? 'কেজি');
  const [unitEn, setUnitEn] = useState(existing?.unitEn ?? 'kg');
  const [customUnit, setCustomUnit] = useState('');
  const [price, setPrice] = useState(String(existing?.approxPrice ?? ''));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [emoji, setEmoji] = useState(existing?.imageEmoji ?? '🛒');
  const [available, setAvailable] = useState(existing?.isAvailable ?? true);
  const [flash, setFlash] = useState(
    existing ? (settings.flashSaleProductIds.includes(existing.id) || (existing.tags?.includes('flash-sale') ?? false)) : false,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState(false);

  const save = () => {
    if (!nameBn.trim() || !price) return;
    const finalUnitBn = customUnit.trim() || unitBn;
    const product: Product = {
      id: existing?.id ?? uid('p'),
      nameBn: nameBn.trim(),
      nameEn: nameEn.trim() || nameBn.trim(),
      category,
      unit: finalUnitBn,
      unitEn: customUnit.trim() || unitEn,
      approxPrice: Number(price) || 0,
      isAvailable: available,
      imageEmoji: emoji || '🛒',
      description: description.trim() || undefined,
      tags: flash
        ? [...(existing?.tags ?? []).filter(t => t !== 'flash-sale'), 'flash-sale']
        : (existing?.tags ?? []).filter(t => t !== 'flash-sale'),
    };
    dispatch({ type: existing ? 'UPDATE_PRODUCT' : 'ADD_PRODUCT', product });
    // Keep the H9 flash-sale manager in sync.
    const ids = settings.flashSaleProductIds.filter(x => x !== product.id);
    if (flash) ids.push(product.id);
    dispatch({ type: 'UPDATE_ADMIN_SETTINGS', settings: { ...settings, flashSaleProductIds: ids } });
    logAction(dispatch, actor, existing ? `পণ্য বদল করেছেন: ${product.nameBn}` : `নতুন পণ্য যোগ করেছেন: ${product.nameBn}`, 'general');
    navigate('/admin/products');
  };

  const remove = () => {
    if (!existing) return;
    dispatch({ type: 'DELETE_PRODUCT', id: existing.id });
    logAction(dispatch, actor, `পণ্য মুছে ফেলেছেন: ${existing.nameBn}`, 'general');
    navigate('/admin/products');
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/admin/products')} className="self-start inline-flex items-center gap-1 text-label-lg font-semibold text-on-surface-variant">
        <Icon name="arrow_back" className="text-[18px]" />{bn ? 'প্রোডাক্ট তালিকা' : 'Product list'}
      </button>
      <PageTitle
        icon="inventory_2"
        titleBn={existing ? 'প্রোডাক্ট সম্পাদনা' : 'নতুন প্রোডাক্ট যোগ'}
        titleEn={existing ? 'Edit Product · Jovro Admin' : 'Add Product · Jovro Admin'}
        right={
          <button onClick={() => setPreview(v => !v)} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary">
            <Icon name="visibility" className="text-[17px]" />{bn ? 'প্রিভিউ' : 'Preview'}
          </button>
        }
      />

      {preview && (
        <AdminCard className="flex items-center gap-3 bg-primary/5">
          <span className="text-[36px]">{emoji}</span>
          <div>
            <p className="text-body-lg font-bold text-on-surface">{nameBn || (bn ? 'প্রোডাক্টের নাম' : 'Product name')}</p>
            <p className="text-label-md text-on-surface-variant">{nameEn} · {fmtTk(Number(price) || 0, state.lang)} / {unitBn}</p>
          </div>
        </AdminCard>
      )}

      {/* Photo box — design 4 */}
      <AdminCard>
        <p className="text-label-lg font-bold text-on-surface">{bn ? 'প্রোডাক্টের ছবি' : 'Product Photo'} <span className="font-normal text-on-surface-variant">(Max 5MB, JPG/PNG)</span></p>
        <div className="mt-3 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container/60 py-5 flex flex-col items-center gap-1.5">
          <span className="text-[40px] leading-none">{emoji}</span>
          <Icon name="photo_camera" className="text-on-surface-variant text-[20px]" />
          <p className="text-label-md text-primary font-semibold inline-flex items-center gap-1">
            <Icon name="add_a_photo" className="text-[15px]" />{bn ? 'ছবি পরিবর্তন করুন / Change' : 'Change photo'}
          </p>
          <p className="text-label-sm text-on-surface-variant">{bn ? 'সর্বোচ্চ রেজোলিউশন ও পরিষ্কার ব্যাকগ্রাউন্ড বাঞ্ছনীয়' : 'Clear background recommended'}</p>
        </div>
        <div className="mt-3">
          <Field labelBn="ছবি (ইমোজি বা URL)" labelEn="Image (emoji or URL)">
            <input value={emoji} onChange={e => setEmoji(e.target.value)} className={inputCls} placeholder="🛒 বা https://…" />
          </Field>
        </div>
      </AdminCard>

      <AdminCard className="flex flex-col gap-4">
        <Field labelBn="প্রোডাক্টের নাম (বাংলা)" labelEn="Product name (Bangla)" required hint={bn ? 'গ্রাহক অ্যাপে প্রধান শিরোনাম হিসেবে প্রদর্শিত হবে' : 'Shown as the main title in the customer app'}>
          <input value={nameBn} onChange={e => setNameBn(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: মিনিকেট চাল (১ম শ্রেণী)' : 'e.g. Miniket Rice'} />
        </Field>
        <Field labelBn="Product name (English)" labelEn="Product name (English)" hint={bn ? 'English subtext for searching and rider slips' : 'English subtext for searching and rider slips'}>
          <input value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputCls} placeholder="Miniket Rice (Grade 1)" />
        </Field>
        <Field labelBn="ক্যাটাগরি / Category" labelEn="Category / ক্যাটাগরি" required>
          <select value={category} onChange={e => setCategory(e.target.value as ProductCategory)} className={inputCls}>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <option key={key} value={key}>{bn ? info.nameBn : info.nameEn} / {bn ? info.nameEn : info.nameBn}</option>
            ))}
          </select>
        </Field>

        <div>
          <p className="text-label-md font-semibold text-on-surface-variant mb-1.5">{bn ? 'একক / Unit *' : 'Unit / একক *'} <span className="font-normal">({bn ? 'প্যাকেজিং পরিমাপ' : 'packaging measure'})</span></p>
          <div className="flex flex-wrap gap-2">
            {UNIT_CHIPS.map(u => {
              const selected = !customUnit && unitBn === u.unitBn;
              return (
                <button
                  key={u.en}
                  onClick={() => { setUnitBn(u.unitBn); setUnitEn(u.unitEn); setCustomUnit(''); }}
                  className={clsx('px-3 py-2 rounded-xl border-2 text-label-md font-semibold text-center',
                    selected ? 'border-primary bg-primary/8 text-primary' : 'border-outline-variant text-on-surface')}
                >
                  {bn ? u.bn : u.en}<span className="block text-[10px] font-normal text-on-surface-variant">{bn ? u.en : u.bn}</span>
                </button>
              );
            })}
          </div>
          <input
            value={customUnit}
            onChange={e => setCustomUnit(e.target.value)}
            placeholder={bn ? 'কাস্টম একক লিখুন (যদি লাগে)' : 'Custom unit (if needed)'}
            className={clsx(inputCls, 'mt-2')}
          />
        </div>

        <Field labelBn="আনুমানিক দাম / Approx. price" labelEn="Approx. price / আনুমানিক দাম" required>
          <div className="flex items-center gap-2 rounded-xl border-2 border-outline-variant focus-within:border-primary px-3">
            <span className="font-bold text-on-surface-variant">৳</span>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-body-md font-bold text-on-surface min-w-0" placeholder="75" />
            <span className="text-label-sm text-on-surface-variant">{bn ? `প্রতি ${customUnit || unitBn}` : `per ${unitEn}`}</span>
          </div>
          <p className="text-label-sm text-on-surface-variant flex gap-1 mt-1">
            <Icon name="info" className="text-[14px] flex-shrink-0" />
            <span>{bn ? 'চূড়ান্ত দাম বাজারের রসিদ অনুযায়ী নির্ধারিত হবে। Final price is always determined by authentic bazaar cash receipt (Zero Markup Guarantee).' : 'Final price is always determined by authentic bazaar cash receipt (Zero Markup Guarantee).'}</span>
          </p>
        </Field>

        <Field labelBn="বর্ণনা / Description (ঐচ্ছিক)" labelEn="Description / বর্ণনা (optional)">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={200} className={clsx(inputCls, 'resize-none')} placeholder={bn ? 'পণ্যের সংক্ষিপ্ত বর্ণনা…' : 'Short description…'} />
          <span className="text-label-sm text-on-surface-variant self-end">{toBnDigits(description.length, state.lang)}/২০০</span>
        </Field>

        <div className="flex flex-col gap-3 pt-1">
          <ToggleRow
            titleBn="সাধারণত পাওয়া যায়" titleEn="Usually Available in Bazaar"
            subBn="Usually Available in Bazaar" subEn="সাধারণত পাওয়া যায়"
            checked={available} onChange={setAvailable}
          />
          <ToggleRow
            titleBn="ফ্ল্যাশ সেলে রাখুন" titleEn="Put in Flash Sale (Special Highlight)"
            subBn="১০% স্পেশাল ছাড়" subEn="Special discount highlight"
            checked={flash} onChange={setFlash}
          />
        </div>

        <button onClick={save} disabled={!nameBn.trim() || !price} className="w-full h-12 rounded-2xl bg-primary text-white text-label-lg font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon name="save" className="text-[19px]" />{bn ? 'প্রোডাক্ট সেভ করুন / Save product changes' : 'Save product'}
        </button>

        {existing && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} className="w-full h-11 rounded-2xl border-2 border-error/50 text-error text-label-lg font-bold inline-flex items-center justify-center gap-2">
            <Icon name="delete" className="text-[18px]" />{bn ? 'প্রোডাক্ট মুছুন / Delete product' : 'Delete product'}
          </button>
        )}
        {existing && confirmDelete && (
          <div className="rounded-2xl border-2 border-error/40 bg-red-50 p-4">
            <p className="text-body-md font-bold text-on-surface flex items-center gap-2">
              <Icon name="warning" className="text-error" />{bn ? 'প্রোডাক্টটি মুছতে চান?' : 'Delete Product Confirmation'}
            </p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              ‘{bn ? existing.nameBn : existing.nameEn}’ {bn ? 'ক্যাটালগ থেকে চিরতরে মুছে ফেলা হবে। আপনি কি নিশ্চিত?' : 'will be removed permanently from Jovro inventory.'}
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={remove} className="flex-1 h-11 rounded-xl bg-error text-white text-label-md font-bold inline-flex items-center justify-center gap-1">
                <Icon name="delete_forever" className="text-[17px]" />{bn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 h-11 rounded-xl border-2 border-outline-variant text-label-md font-bold">
                {bn ? 'না, বাতিল / Cancel' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
