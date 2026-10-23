import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { searchAreasIn } from '../../data/areas';
import { tk } from '../../lib/format';
import type { SavedAddress } from '../../types';

const LABELS = [
  { id: 'home', bn: 'বাড়ি', en: 'Home', icon: 'home' },
  { id: 'office', bn: 'অফিস', en: 'Office', icon: 'work' },
  { id: 'other', bn: 'অন্যান্য', en: 'Other', icon: 'place' },
];

export default function AddressFormScreen() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const editing = state.addresses.find(a => a.id === id);

  const [labelId, setLabelId] = useState(() => {
    if (!editing) return 'home';
    if (editing.label === 'বাড়ি') return 'home';
    if (editing.label === 'অফিস') return 'office';
    return 'other';
  });
  const [address, setAddress] = useState(editing?.fullAddress ?? '');
  const [areaId, setAreaId] = useState(editing?.areaId ?? state.selectedAreaId);
  const [isDefault, setIsDefault] = useState(editing?.isDefault ?? state.addresses.length === 0);
  const [areaSheet, setAreaSheet] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const area = state.areas.find(a => a.id === areaId);
  const results = useMemo(() => (areaQuery ? searchAreasIn(state.areas, areaQuery) : state.areas), [areaQuery, state.areas]);

  const save = () => {
    if (address.trim().length < 8) {
      setError(bn ? 'বিস্তারিত ঠিকানা লিখুন (কমপক্ষে ৮ অক্ষর)' : 'Add a detailed address (8+ characters)');
      return;
    }
    const label = LABELS.find(l => l.id === labelId)!;
    const record: SavedAddress = {
      id: editing?.id ?? `addr-${Date.now()}`,
      userId: state.user?.id ?? 'u-001',
      label: label.bn,
      labelEn: label.en,
      fullAddress: address.trim(),
      areaId,
      isDefault,
    };
    if (isDefault) {
      state.addresses.filter(a => a.id !== record.id).forEach(a => dispatch({ type: 'UPDATE_ADDRESS', address: { ...a, isDefault: false } }));
    }
    if (editing) dispatch({ type: 'UPDATE_ADDRESS', address: record });
    else dispatch({ type: 'ADD_ADDRESS', address: record });
    dispatch({ type: 'SET_AREA', areaId });
    setSaved(true);
    setTimeout(() => navigate('/addresses', { replace: true }), 650);
  };

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader
        showBack
        title={editing ? (bn ? 'ঠিকানা সম্পাদনা' : 'Edit address') : (bn ? 'নতুন ঠিকানা' : 'New address')}
        subtitle={bn ? 'সঠিক ঠিকানা দিলে ডেলিভারি দ্রুত হয়' : 'Accurate addresses speed up delivery'}
      />

      <div className="flex flex-col gap-3 px-4 pb-32 pt-4">
        <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
          <p className="text-[11px] font-medium text-on-surface-variant">{bn ? 'ঠিকানার ধরন' : 'Address type'}</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {LABELS.map(l => (
              <button
                key={l.id}
                onClick={() => setLabelId(l.id)}
                className={clsx('flex flex-col items-center gap-1 rounded-xl border py-2', labelId === l.id ? 'border-primary bg-primary-tint' : 'border-outline-variant')}
              >
                <span className={clsx('material-symbols-outlined text-[19px]', labelId === l.id ? 'text-primary-deep' : 'text-on-surface-variant')}>{l.icon}</span>
                <span className={clsx('text-[11px] font-semibold', labelId === l.id ? 'text-primary-deep' : 'text-on-surface-variant')}>{bn ? l.bn : l.en}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] font-medium text-on-surface-variant">{bn ? 'ডেলিভারি এলাকা' : 'Delivery area'}</p>
          <button onClick={() => setAreaSheet(true)} className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-left">
            <span>
              <span className="block text-[12.5px] font-semibold text-on-surface">{bn ? area?.nameBn : area?.nameEn}</span>
              <span className="block text-[10px] text-on-surface-variant">{bn ? 'ডেলিভারি চার্জ' : 'Delivery fee'} {tk(area?.fee ?? 20, state.lang)}</span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>

          <p className="mt-3 text-[11px] font-medium text-on-surface-variant">{bn ? 'বিস্তারিত ঠিকানা' : 'Detailed address'}</p>
          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); setError(''); }}
            rows={4}
            placeholder={bn ? 'বাড়ি নম্বর, রোড, মসজিদ/স্কুলের পাশে, তলা...' : 'House number, road, landmark, floor...'}
            className={clsx('mt-1 w-full resize-none rounded-xl border bg-surface-container-low px-3 py-2 text-[12.5px] outline-none', error ? 'border-error' : 'border-outline-variant focus:border-primary')}
          />
          {error && <p className="mt-1 text-[10.5px] text-error">{error}</p>}

          <button
            onClick={() => setIsDefault(v => !v)}
            className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface-container px-3 py-2"
          >
            <span className="text-[11.5px] text-on-surface">{bn ? 'ডিফল্ট ঠিকানা হিসেবে সেভ করুন' : 'Save as default address'}</span>
            <span className={clsx('relative h-6 w-11 rounded-full transition-colors', isDefault ? 'bg-primary' : 'bg-surface-container-high')}>
              <span className={clsx('absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all', isDefault ? 'left-6' : 'left-1')} />
            </span>
          </button>
        </section>

        <div className="flex items-center gap-2.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-tertiary-soft text-tertiary">
            <span className="material-symbols-outlined text-[19px]">map</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-on-surface">{bn ? 'ম্যাপে পিন বসান' : 'Pin on the map'}</p>
            <p className="text-[10px] text-on-surface-variant">{bn ? 'লালমনিরহাট সদর · ডেমোতে ম্যাপ বন্ধ' : 'Lalmonirhat Sadar · map disabled in demo'}</p>
          </div>
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-semibold text-on-surface-variant">{bn ? 'শীঘ্রই' : 'Soon'}</span>
        </div>

        <button onClick={save} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13.5px] font-bold text-white">
          <span className="material-symbols-outlined text-[18px]">{saved ? 'check_circle' : 'save'}</span>
          {saved ? (bn ? 'সেভ হয়েছে' : 'Saved') : (bn ? 'ঠিকানা সেভ করুন' : 'Save address')}
        </button>
      </div>

      <BottomSheet open={areaSheet} onClose={() => setAreaSheet(false)} title={bn ? 'এলাকা বেছে নিন' : 'Select area'}>
        <div className="px-4 pb-4">
          <input
            value={areaQuery}
            onChange={e => setAreaQuery(e.target.value)}
            placeholder={bn ? 'এলাকার নাম (যেমন: গোশালা)' : 'Area name (e.g. gosala)'}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[12.5px] outline-none focus:border-primary"
          />
          <div className="mt-2 max-h-[50vh] overflow-y-auto">
            {results.slice(0, 80).map(a => (
              <button key={a.id} onClick={() => { setAreaId(a.id); setAreaSheet(false); }} className="flex w-full items-center justify-between border-b border-outline-variant/40 py-2.5 text-left">
                <span className="text-[12.5px] text-on-surface">{bn ? a.nameBn : a.nameEn}</span>
                <span className="text-[11.5px] font-semibold text-primary-deep">{tk(a.fee, state.lang)}</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
