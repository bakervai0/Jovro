import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { DELIVERY_AREAS, searchAreas } from '../../data/areas';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Input } from '../../components/ui/Input';
import type { DeliveryArea } from '../../types';

const ZONES = ['all', 'town', 'union'] as const;

export default function AreaPickerScreen() {
  const { state, dispatch, t } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<'all' | 'town' | 'union'>('all');

  const results = useMemo(() => {
    let areas = query ? searchAreas(query) : DELIVERY_AREAS;
    if (zone !== 'all') areas = areas.filter(a => a.zone === zone);
    return areas;
  }, [query, zone]);

  const selectArea = (area: DeliveryArea) => {
    dispatch({ type: 'SET_AREA', areaId: area.id });
    navigate(-1);
  };

  // Group by first letter / group
  const grouped = useMemo(() => {
    const map = new Map<string, DeliveryArea[]>();
    results.forEach(area => {
      const key = area.group ?? (lang === 'bn' ? area.nameBn[0] : area.nameEn[0].toUpperCase());
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(area);
    });
    return map;
  }, [results, lang]);

  const zoneLabelBn: Record<string, string> = { all: 'সব এলাকা', town: 'শহর', union: 'ইউনিয়ন' };
  const zoneLabelEn: Record<string, string> = { all: 'All areas', town: 'Town', union: 'Union' };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'এলাকা বেছে নিন' : 'Select area'}
        subtitle={lang === 'bn' ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'}
      />

      {/* Search + filter */}
      <div className="px-4 py-3 flex flex-col gap-3 bg-surface sticky top-14 z-20 shadow-elevated-bar">
        <Input
          type="search"
          placeholder={lang === 'bn' ? 'এলাকার নাম লিখুন...' : 'Search area...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          icon="search"
          iconEnd={query ? 'close' : undefined}
          onIconEndClick={() => setQuery('')}
        />

        {/* Zone filter chips */}
        <div className="flex gap-2">
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-label-md font-medium border transition-all',
                zone === z
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              {lang === 'bn' ? zoneLabelBn[z] : zoneLabelEn[z]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[56px]">search_off</span>
            <p className="text-body-lg font-medium text-on-surface-variant">
              {lang === 'bn' ? 'কোনো এলাকা পাওয়া যায়নি' : 'No areas found'}
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([group, areas]) => (
            <div key={group}>
              <div className="px-4 py-2 bg-surface-container/50">
                <p className="text-label-md font-semibold text-on-surface-variant">{group}</p>
              </div>
              {areas.map(area => {
                const isSelected = area.id === state.selectedAreaId;
                return (
                  <button
                    key={area.id}
                    onClick={() => selectArea(area)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20 transition-colors',
                      isSelected ? 'bg-primary/8' : 'hover:bg-surface-container active:bg-surface-container',
                    )}
                  >
                    <span className={clsx(
                      'material-symbols-outlined text-[20px]',
                      isSelected ? 'text-primary filled-symbol' : 'text-on-surface-variant',
                    )}>
                      {area.zone === 'town' ? 'location_city' : 'village'}
                    </span>
                    <div className="flex-1 text-left">
                      <p className={clsx(
                        'text-body-md font-medium',
                        isSelected ? 'text-primary' : 'text-on-surface',
                      )}>
                        {lang === 'bn' ? area.nameBn : area.nameEn}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {lang === 'bn' ? `ডেলিভারি ৳${area.fee}` : `Delivery ৳${area.fee}`}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    )}
                    {area.zone === 'union' && (
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded-full">
                        {lang === 'bn' ? 'ইউনিয়ন' : 'Union'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
