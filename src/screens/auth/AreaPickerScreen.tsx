import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { searchAreasIn } from '../../data/areas';
import { fmtTk, toBnDigits } from '../../services/orderUtils';
import type { DeliveryArea } from '../../types';

// ── Stitch 4 (area selector) + Stitch 7 (area picker) ─────────
// Hub banner, fuzzy search with the "spelling mistakes OK" tip
// and Suggested Matches block, then Town / Union sections with
// fee rows. Selection wiring unchanged (SET_AREA → back).

const GROUP_ICONS: Record<string, string> = {
  'বাজার': 'storefront',
  'রাস্তা': 'signpost',
  'মোড়': 'signpost',
  'হাসপাতাল': 'local_hospital',
  'স্টেশন': 'directions_railway',
  'বাসা': 'home_pin',
  'আবাসিক': 'home_pin',
};

function groupIcon(area: DeliveryArea): string {
  if (area.group) {
    for (const [key, icon] of Object.entries(GROUP_ICONS)) {
      if (area.group.includes(key)) return icon;
    }
  }
  return area.zone === 'town' ? 'location_city' : 'store';
}

export default function AreaPickerScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const townAreas = useMemo(() => state.areas.filter(a => a.zone === 'town'), [state.areas]);
  const unionAreas = useMemo(() => state.areas.filter(a => a.zone === 'union'), [state.areas]);
  const matches = useMemo(
    () => (searching ? searchAreasIn(state.areas, query.trim()) : []),
    [searching, query, state.areas],
  );

  const selectArea = (area: DeliveryArea) => {
    dispatch({ type: 'SET_AREA', areaId: area.id });
    navigate(-1);
  };

  const rangeLabel = (from: number, to: number) =>
    bn ? `(${toBnDigits(from, lang)}–${toBnDigits(to, lang)})` : `(${from}–${to})`;

  const areaRow = (area: DeliveryArea, suggested = false) => {
    const isSelected = area.id === state.selectedAreaId;
    return (
      <button
        key={area.id} type="button" onClick={() => selectArea(area)}
        className={clsx(
          'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all active:scale-[0.99]',
          isSelected
            ? 'border-2 border-primary bg-primary/5'
            : 'border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low',
        )}
      >
        <span className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary',
        )}>
          <span className="material-symbols-outlined text-[20px]">{suggested ? 'storefront' : groupIcon(area)}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className={clsx('text-body-md font-body-md font-semibold truncate', isSelected ? 'text-primary' : 'text-on-surface')}>
              {bn ? area.nameBn : area.nameEn}
            </span>
            {isSelected && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary shrink-0">
                <span className="material-symbols-outlined text-[12px] filled-symbol">check</span>
                {bn ? 'নির্বাচিত' : 'Selected'}
              </span>
            )}
          </span>
          <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">
            {bn ? area.nameEn : area.nameBn}{area.group ? ` · ${area.group}` : ''}
          </span>
        </span>
        <span className="text-right shrink-0">
          <span className={clsx('block text-label-lg font-label-lg font-bold', isSelected ? 'text-primary' : 'text-on-surface')}>
            {fmtTk(area.fee, lang)}
          </span>
          <span className="block text-[10px] text-outline">{bn ? 'ডেলিভারি' : 'Delivery'} {fmtTk(area.fee, 'en')}</span>
        </span>
        {!isSelected && <span className="material-symbols-outlined text-outline-variant shrink-0">chevron_right</span>}
        {isSelected && <span className="material-symbols-outlined text-primary shrink-0 filled-symbol">check_circle</span>}
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header (Stitch 4/7) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-margin py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1 min-w-0">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-90 transition-transform shrink-0">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold leading-tight truncate">
                {bn ? 'আপনার এলাকা নির্বাচন করুন' : 'Select Delivery Area'}
              </h1>
              <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
                {bn ? 'Select Delivery Area · লালমনিরহাট' : 'Your delivery area · Lalmonirhat'}
              </span>
            </div>
          </div>
          <button
            type="button" onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
            className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md shrink-0"
          >
            বাংলা | EN
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-margin pt-space-md pb-8 space-y-space-md">
        {/* Hub banner (Stitch 4) */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0">pedal_bike</span>
          <div>
            <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">
              {bn
                ? 'গোশালা বাজার (Goshala Bazar) কেন্দ্র থেকে আপনার এলাকায় দ্রুত সাইকেল কুরিয়ার ডেলিভারি চার্জ নিচে দেখুন।'
                : 'See the bicycle courier delivery charge from the Goshala Bazar hub to your area below.'}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-label-md font-label-md font-bold text-secondary">
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              {bn ? 'গড় ডেলিভারি সময়: ২৫-৪৫ মিনিট' : 'Average delivery time: 25-45 minutes'}
            </p>
          </div>
        </div>

        {/* Search (Stitch 7) */}
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-full pl-4 pr-2 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder={bn ? 'এলাকার নাম লিখুন...' : 'Type your area name...'}
            className="flex-1 bg-transparent outline-none text-body-md font-body-md text-on-surface placeholder:text-outline min-w-0"
          />
          {query ? (
            <button type="button" aria-label="Clear" onClick={() => setQuery('')} className="w-8 h-8 rounded-full flex items-center justify-center text-outline shrink-0">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-outline text-[20px] shrink-0">mic</span>
          )}
        </div>

        {searching ? (
          <>
            <p className="flex items-start gap-1.5 text-body-sm font-body-sm text-on-surface-variant px-0.5">
              <span>💡</span>
              <span>{bn ? 'বানান একটু ভুল হলেও চলবে / Small spelling mistakes are OK — কাছাকাছি মিলগুলো দেখানো হচ্ছে' : 'Small spelling mistakes are OK — showing close matches'}</span>
            </p>
            <section>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <h2 className="flex items-center gap-1.5 text-label-lg font-label-lg font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                  {bn ? 'খুঁজে পাওয়া এলাকা / Suggested Matches' : 'Suggested Matches'}
                </h2>
                <span className="text-label-sm font-label-sm text-outline">
                  {bn ? `${toBnDigits(matches.length, lang)}টি মিল পাওয়া গেছে` : `${matches.length} matches`}
                </span>
              </div>
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-[52px]">search_off</span>
                  <p className="text-body-lg font-medium text-on-surface-variant">{bn ? 'কোনো এলাকা পাওয়া যায়নি' : 'No areas found'}</p>
                </div>
              ) : (
                <div className="space-y-2">{matches.map(a => areaRow(a, true))}</div>
              )}
            </section>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-label-md font-label-md text-on-surface-variant px-0.5">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              {bn ? 'লালমনিরহাট সদর এলাকা' : 'Lalmonirhat Sadar areas'}
              <span className="text-outline">•</span>
              <span>{bn ? `সব ${toBnDigits(state.areas.length, lang)}টি কভার্ড এলাকা ও ইউনিয়ন বাজার` : `All ${state.areas.length} covered areas and union bazaars`}</span>
              <span className="ml-auto font-bold text-primary">{toBnDigits(state.areas.length, lang)} {bn ? 'এলাকা' : 'areas'}</span>
            </p>

            <section>
              <h2 className="flex items-center gap-1.5 text-label-lg font-label-lg font-bold text-on-surface mb-2 px-0.5">
                <span className="material-symbols-outlined text-primary text-[19px]">location_city</span>
                {bn ? `শহর / Town ${rangeLabel(1, townAreas.length)}` : 'Town'}
              </h2>
              <p className="text-bilingual-sub font-bilingual-sub text-outline px-0.5 -mt-1 mb-2">{bn ? 'পৌরসভা ও সদর শহর কেন্দ্রিক এলাকা • সরাসরি ডেলিভারি' : 'Municipality & Sadar town areas • Direct delivery'}</p>
              <div className="space-y-2">{townAreas.map(a => areaRow(a))}</div>
            </section>

            <section>
              <h2 className="flex items-center gap-1.5 text-label-lg font-label-lg font-bold text-on-surface mb-2 px-0.5">
                <span className="material-symbols-outlined text-primary text-[19px]">agriculture</span>
                {bn ? `ইউনিয়ন হাট-বাজার ${rangeLabel(townAreas.length + 1, state.areas.length)}` : 'Union Bazaars'}
              </h2>
              <p className="text-bilingual-sub font-bilingual-sub text-outline px-0.5 -mt-1 mb-2">{bn ? 'ইউনিয়নের হাট-বাজার ও দূরবর্তী এলাকা • সদর উপজেলা' : 'Union bazaars & outlying areas • Sadar Upazila'}</p>
              <div className="space-y-2">{unionAreas.map(a => areaRow(a))}</div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
