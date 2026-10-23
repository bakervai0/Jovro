import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { Input } from '../../components/ui/Input';
import { searchAreasIn } from '../../data/areas';
import { fmtTk, toBnDigits } from '../../services/orderUtils';

/**
 * D20 — Delivery fee table, composed to Stitch 20: trust strip,
 * Town / Union tabs, zone header with the fee range, and flat
 * area rows (group shown as the note line, "Standard" tag).
 * Search still covers all areas via searchAreasIn.
 */
export default function DeliveryFeesScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'town' | 'union'>('town');

  const townAreas = useMemo(() => state.areas.filter(a => a.zone === 'town'), [state.areas]);
  const unionAreas = useMemo(() => state.areas.filter(a => a.zone === 'union'), [state.areas]);
  const searching = query.trim().length > 0;
  const matched = useMemo(
    () => (searching ? searchAreasIn(state.areas, query.trim()) : state.areas),
    [query, state.areas, searching],
  );
  const shown = searching ? matched : tab === 'town' ? townAreas : unionAreas;

  const rangeOf = (list: typeof state.areas) =>
    list.length === 0
      ? ''
      : `${fmtTk(Math.min(...list.map(a => a.fee)), state.lang)} – ${fmtTk(Math.max(...list.map(a => a.fee)), state.lang)}`;

  const tabs = [
    {
      key: 'town' as const,
      labelBn: 'শহর / Town',
      labelEn: 'Town',
      subBn: `(এলাকা ১–${toBnDigits(townAreas.length, state.lang)})`,
      count: townAreas.length,
    },
    {
      key: 'union' as const,
      labelBn: 'ইউনিয়ন হাট-বাজার',
      labelEn: 'Union Bazaars',
      subBn: `(এলাকা ${toBnDigits(townAreas.length + 1, state.lang)}–${toBnDigits(state.areas.length, state.lang)})`,
      count: unionAreas.length,
    },
  ];

  return (
    <InfoPage
      title={bn ? 'ডেলিভারি ফি তালিকা' : 'Delivery Fee Table'}
      subtitle={bn ? 'Delivery Fee Table' : 'ডেলিভারি ফি তালিকা'}
      icon="local_shipping"
    >
      {/* Trust banner (design 20) */}
      <div className="bg-primary-container text-on-primary-container rounded-2xl p-4 -mt-2">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary-fixed text-[22px] shrink-0 mt-0.5">verified_user</span>
          <div>
            <p className="text-label-lg font-label-lg font-bold leading-snug">
              {bn ? 'সব এলাকার ডেলিভারি চার্জ এখানে — কোনো লুকানো খরচ নেই' : 'Every area’s delivery fee is listed here — no hidden charges'}
            </p>
            <p className="text-body-sm font-body-sm text-on-primary-container/85 mt-1 leading-relaxed">
              {bn
                ? 'বাজার ও দোকানের আসল ক্যাশ মেমোর মূল্যে কেনাকাটা। জোভ্রো শুধুমাত্র সাইকেল ব্যক্তিগত কুরিয়ার সেবার নির্দিষ্ট ডেলিভারি ফি গ্রহণ করে।'
                : 'Shopping at the original bazaar & shop cash-memo prices. Jovro only takes the fixed bicycle personal-courier delivery fee.'}
            </p>
          </div>
        </div>
      </div>

      {/* Trust strip (design 20) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { icon: 'verified_user', bn: 'আসল ভাউচার নিশ্চিত', en: 'Real voucher assured' },
          { icon: 'receipt_long', bn: 'মেমো অনুযায়ী দাম', en: 'Memo-based pricing' },
          { icon: 'pedal_bike', bn: 'সাইকেল রাইডার সাপোর্ট', en: 'Cycle rider support' },
        ].map(c => (
          <span key={c.icon} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-label-sm font-label-sm whitespace-nowrap shrink-0">
            <span className="material-symbols-outlined text-[15px]">{c.icon}</span>
            {bn ? c.bn : c.en}
          </span>
        ))}
      </div>

      <Input
        placeholder={bn ? 'এলাকার নাম খুঁজুন...' : 'Search your area...'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        icon="search"
      />

      {/* Zone tabs (design 20) */}
      {!searching && (
        <div className="grid grid-cols-2 gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.98]',
                tab === t.key
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface',
              )}
            >
              <span className="block text-label-lg font-bold">{bn ? t.labelBn : t.labelEn}</span>
              <span className={clsx('block text-bilingual-sub font-bilingual-sub', tab === t.key ? 'text-on-primary/85' : 'text-on-surface-variant')}>
                {bn ? t.subBn : `${t.count} areas`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Zone header + count line */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            {searching ? 'search' : tab === 'town' ? 'apartment' : 'storefront'}
          </span>
          {searching
            ? bn ? 'খোঁজার ফলাফল' : 'Search results'
            : tab === 'town'
              ? bn ? `শহর এলাকা (১–${toBnDigits(townAreas.length, state.lang)})` : 'Town Areas'
              : bn ? 'ইউনিয়ন হাট-বাজার' : 'Union Bazaars'}
        </h2>
        <span className="text-label-md font-bold text-primary">
          {rangeOf(searching ? matched : tab === 'town' ? townAreas : unionAreas)}
        </span>
      </div>
      <p className="text-label-md text-on-surface-variant -mt-2 px-1">
        {bn
          ? `${toBnDigits(shown.length, state.lang)}টি ${tab === 'town' && !searching ? 'শহর' : ''} এলাকা প্রদর্শিত হচ্ছে`
          : `${shown.length} areas shown`}
      </p>

      {/* Area rows */}
      {shown.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-8">
          {bn ? 'এই নামে কোনো এলাকা পাওয়া যায়নি। বানান বদলে আবার চেষ্টা করুন।' : 'No area found with that name. Try a different spelling.'}
        </p>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
          {shown.map((area, i) => (
            <div
              key={area.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-outline-variant/20' : ''}`}
            >
              <span className="text-label-md font-label-md font-bold text-outline w-6 text-center shrink-0">
                {toBnDigits(String(state.areas.findIndex(x => x.id === area.id) + 1).padStart(2, '0'), state.lang)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-body-md font-medium text-on-surface truncate">{bn ? area.nameBn : area.nameEn}</span>
                <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">
                  {bn ? area.nameEn : area.nameBn}
                  {area.group ? ` · ${area.group}` : ''}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-body-md font-bold text-primary">{fmtTk(area.fee, state.lang)}</span>
                <span className="block text-[10px] text-outline">Standard</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-label-sm text-on-surface-variant/70">
        {bn
          ? '* ফি প্রতি অর্ডারে একবারই ধরা হয় — কয়টা জিনিস কিনলেন তার ওপর নির্ভর করে না।'
          : '* The fee is charged once per order — it does not depend on how many items you buy.'}
      </p>
    </InfoPage>
  );
}
