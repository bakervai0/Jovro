import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import type { DeliveryArea } from '../../types';
import {
  Icon, PageTitle, fmtTk, logAction, toBnDigits, useActorName, useBn,
} from './adminShared';

// H10 — Areas & delivery fees. Built from design
// 10._areas_delivery_fees_jovro: info strip ("পরিবর্তনের সাথে
// সাথেই কাস্টমার অ্যাপে সরাসরি কার্যকর হবে"), search, zone
// chips (সব এলাকা / সদর টাউন / ইউনিয়ন), summary stats, Town
// Core and Union & Rural Hats groups with per-area fee field +
// ON/OFF, and the sticky "ডেলিভারি ফি সেভ করুন" bar.
// Edits dispatch UPDATE_AREA immediately (live-save), which the
// checkout reads through state.areas — the design's own model.
export default function AdminAreas() {
  const { state, dispatch } = useApp();
  const bn = useBn();
  const lang = state.lang;
  const actor = useActorName();
  const [zone, setZone] = useState<'all' | 'town' | 'union'>('all');
  const [query, setQuery] = useState('');
  const [savedTick, setSavedTick] = useState(false);

  const areas = state.areas;
  const townCount = areas.filter(a => a.zone === 'town').length;
  const unionCount = areas.filter(a => a.zone === 'union').length;
  const activeCount = areas.filter(a => a.isServed !== false).length;
  const avgFee = areas.length ? Math.round(areas.reduce((s, a) => s + a.fee, 0) / areas.length) : 0;

  const filtered = useMemo(() => {
    let list = areas;
    if (zone !== 'all') list = list.filter(a => a.zone === zone);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(a => a.nameBn.includes(query.trim()) || a.nameEn.toLowerCase().includes(q));
    }
    return list;
  }, [areas, zone, query]);

  const update = (area: DeliveryArea, note?: string) => {
    dispatch({ type: 'UPDATE_AREA', area });
    if (note) logAction(dispatch, actor, note, 'general');
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1200);
  };

  const AreaRow = ({ area }: { area: DeliveryArea }) => (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant/25 last:border-0">
      <span className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
        area.isServed === false ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary',
      )}>
        <Icon name={area.zone === 'town' ? 'near_me' : 'explore'} className="text-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface truncate">
          {bn ? area.nameBn : area.nameEn} <span className="font-normal text-on-surface-variant">/ {bn ? area.nameEn : area.nameBn}</span>
        </p>
        <p className="text-label-sm text-on-surface-variant">
          {area.group ?? (area.zone === 'town' ? (bn ? 'সদর টাউন' : 'Town') : (bn ? 'ইউনিয়ন' : 'Union'))}
          {area.isServed === false && <span className="text-error font-semibold"> · {bn ? 'OFF - সাময়িক বন্ধ' : 'Paused'}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-xl bg-surface-container px-2 py-1.5">
        <span className="text-label-md font-bold text-on-surface-variant">৳</span>
        <input
          type="number"
          defaultValue={area.fee}
          key={`${area.id}-${area.fee}`}
          onBlur={e => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v) && v !== area.fee) update({ ...area, fee: v }, `এলাকা ${area.nameBn}-এর ডেলিভারি ফি ${fmtTk(v, 'en')} করেছেন`);
          }}
          className="w-14 bg-transparent outline-none text-body-md font-bold text-on-surface text-center"
          aria-label={bn ? 'ডেলিভারি ফি' : 'Delivery fee'}
        />
      </div>
      <button
        role="switch"
        aria-checked={area.isServed !== false}
        onClick={() => update({ ...area, isServed: area.isServed === false }, `এলাকা ${area.nameBn} ডেলিভারি ${area.isServed === false ? 'চালু' : 'বন্ধ'} করেছেন`)}
        className={clsx('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', area.isServed !== false ? 'bg-primary' : 'bg-surface-container-highest')}
      >
        <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', area.isServed !== false ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );

  const townList = filtered.filter(a => a.zone === 'town');
  const unionList = filtered.filter(a => a.zone === 'union');

  return (
    <div className="flex flex-col gap-4 pb-16">
      <PageTitle
        icon="local_shipping"
        titleBn="এলাকাভিত্তিক ডেলিভারি ফি"
        titleEn="Delivery Fee Table"
        subBn="লালমনিরহাট সদর ১১৪টি এলাকা ও বাজার · Admin Sync"
        subEn="114 areas of Lalmonirhat Sadar · Admin Sync"
      />

      {/* Info strip — design 10 */}
      <div className="rounded-2xl bg-tertiary/8 border border-tertiary/25 px-4 py-3 flex gap-3">
        <Icon name="info" className="text-tertiary text-[22px]" />
        <p className="text-body-sm text-on-surface">
          <b>{bn ? 'সদরের দূরত্বের ভিত্তিতে' : 'By distance in Sadar'}</b>
          <span className="block text-label-md text-on-surface-variant mt-0.5">
            {bn ? 'প্রতিটি এলাকার ডেলিভারি ফি নির্ধারণ করা হয়েছে। পরিবর্তনের সাথে সাথেই কাস্টমার অ্যাপে সরাসরি কার্যকর হবে।' : 'Each area fee applies live in the customer app as soon as it changes.'}
          </span>
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
        <Icon name="search" className="text-on-surface-variant text-[20px]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={bn ? 'এলাকা খুঁজুন (বাংলা, English বা রোমান)' : 'Search an area'}
          className="flex-1 bg-transparent outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60 min-w-0"
        />
        <Icon name="mic" className="text-on-surface-variant text-[19px]" />
      </div>

      {/* Zone chips — design 10 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {([
          { id: 'all', bn: `সব এলাকা All · ${toBnDigits(areas.length, lang)}`, en: `All areas · ${areas.length}` },
          { id: 'town', bn: `সদর টাউন Town Zone · ${toBnDigits(townCount, lang)}`, en: `Town Zone · ${townCount}` },
          { id: 'union', bn: `ইউনিয়ন ও গ্রামীণ বাজার Union Hats · ${toBnDigits(unionCount, lang)}`, en: `Union Hats · ${unionCount}` },
        ] as const).map(c => (
          <button
            key={c.id}
            onClick={() => setZone(c.id)}
            className={clsx('px-3 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap border flex-shrink-0',
              zone === c.id ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant')}
          >
            {bn ? c.bn : c.en}
          </button>
        ))}
      </div>

      {/* Summary stats — design 10 */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl py-3 shadow-card">
          <p className="text-label-sm text-on-surface-variant">{bn ? 'সক্রিয় রুট Active' : 'Active routes'}</p>
          <p className="text-headline-sm font-bold text-primary">{toBnDigits(activeCount, lang)}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl py-3 shadow-card">
          <p className="text-label-sm text-on-surface-variant">{bn ? 'স্থগিত Paused' : 'Paused'}</p>
          <p className="text-headline-sm font-bold text-error">{toBnDigits(areas.length - activeCount, lang)}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl py-3 shadow-card">
          <p className="text-label-sm text-on-surface-variant">{bn ? 'গড় ডেলিভারি ফি' : 'Average fee'}</p>
          <p className="text-headline-sm font-bold text-on-surface">{fmtTk(avgFee, lang)}</p>
        </div>
      </div>

      {townList.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-1 shadow-card">
          <p className="text-label-lg font-bold text-on-surface flex items-center gap-2 pt-3">
            <Icon name="location_city" className="text-primary text-[19px]" />
            {bn ? 'সদর টাউন ও কেন্দ্রীয় এলাকা (Town Core)' : 'Town Core'}
            <span className="ml-auto text-label-sm font-normal text-on-surface-variant">
              {toBnDigits(townList.length, lang)}{bn ? 'টি প্রদর্শিত' : ' shown'} / {bn ? 'মোট' : 'total'} {toBnDigits(townCount, lang)}
            </span>
          </p>
          {townList.map(a => <AreaRow key={a.id} area={a} />)}
        </div>
      )}

      {unionList.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-1 shadow-card">
          <p className="text-label-lg font-bold text-on-surface flex items-center gap-2 pt-3">
            <Icon name="nature_people" className="text-primary text-[19px]" />
            {bn ? 'ইউনিয়ন ও গ্রামীণ বাজার (Union & Rural Hats)' : 'Union & Rural Hats'}
            <span className="ml-auto text-label-sm font-normal text-on-surface-variant">
              {toBnDigits(unionList.length, lang)}{bn ? 'টি প্রদর্শিত' : ' shown'} / {bn ? 'মোট' : 'total'} {toBnDigits(unionCount, lang)}
            </span>
          </p>
          {unionList.map(a => <AreaRow key={a.id} area={a} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-body-md text-on-surface-variant py-8">{bn ? 'কোনো এলাকা পাওয়া যায়নি' : 'No areas found'}</p>
      )}

      {/* Sticky save bar — design 10 (edits live-save via UPDATE_AREA) */}
      <div className="sticky bottom-20 z-20">
        <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl px-4 py-3 flex items-center gap-3 shadow-modal">
          <Icon name="cloud_sync" className="text-[22px]" />
          <p className="flex-1 text-label-md">
            {bn ? 'সরাসরি ক্লাউড সিঙ্ক' : 'Live cloud sync'}
            <span className="block text-label-sm opacity-75">
              {toBnDigits(areas.length, lang)}{bn ? 'টি এলাকা কনফিগার করা আছে · বদলালেই সেভ হয়' : ' areas configured · edits save instantly'}
            </span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-label-md font-bold">
            <Icon name="save" className="text-[17px]" />
            {savedTick ? (bn ? 'সেভ হয়েছে ✓' : 'Saved ✓') : (bn ? 'ডেলিভারি ফি সেভ করুন / Save Fee Table' : 'Save Fee Table')}
          </span>
        </div>
      </div>
    </div>
  );
}
