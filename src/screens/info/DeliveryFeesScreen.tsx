import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { Input } from '../../components/ui/Input';
import { DELIVERY_AREAS, searchAreas } from '../../data/areas';
import type { DeliveryArea } from '../../types';

/** D20 — Delivery fee table: all 114 areas, grouped Town / Union, searchable. */
export default function DeliveryFeesScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [query, setQuery] = useState('');

  const areas = useMemo(
    () => (query.trim() ? searchAreas(query.trim()) : DELIVERY_AREAS),
    [query],
  );

  const zones: { key: 'town' | 'union'; titleBn: string; titleEn: string }[] = [
    { key: 'town', titleBn: 'শহর এলাকা', titleEn: 'Town Areas' },
    { key: 'union', titleBn: 'ইউনিয়ন বাজার', titleEn: 'Union Bazaars' },
  ];

  const renderZone = (zoneKey: 'town' | 'union', title: string) => {
    const zoneAreas = areas.filter(a => a.zone === zoneKey);
    if (zoneAreas.length === 0) return null;
    // Group by the area's group field, preserving seed order
    const groups = new Map<string, DeliveryArea[]>();
    for (const area of zoneAreas) {
      const g = area.group ?? (bn ? 'অন্যান্য' : 'Other');
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(area);
    }
    return (
      <section key={zoneKey}>
        <h2 className="text-title-md font-bold text-on-surface mb-2">
          {title} <span className="text-body-sm font-medium text-on-surface-variant">({zoneAreas.length})</span>
        </h2>
        <div className="flex flex-col gap-3">
          {[...groups.entries()].map(([group, groupAreas]) => (
            <div key={group} className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl overflow-hidden">
              <p className="px-4 pt-3 pb-1 text-label-lg font-bold text-primary">{group}</p>
              {groupAreas.map((area, i) => (
                <div
                  key={area.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-outline-variant/20' : ''}`}
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">location_on</span>
                  <span className="flex-1 text-body-md text-on-surface">
                    {bn ? area.nameBn : area.nameEn}
                  </span>
                  <span className="text-body-md font-bold text-primary">৳{area.fee}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <InfoPage
      title={bn ? 'ডেলিভারি ফি তালিকা' : 'Delivery Fee Table'}
      subtitle={bn ? `মোট ${DELIVERY_AREAS.length}টি এলাকা — লালমনিরহাট সদর` : `${DELIVERY_AREAS.length} areas — Lalmonirhat Sadar`}
      icon="local_shipping"
    >
      <Input
        placeholder={bn ? 'এলাকার নাম খুঁজুন...' : 'Search your area...'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        icon="search"
      />
      {areas.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-8">
          {bn ? 'এই নামে কোনো এলাকা পাওয়া যায়নি। বানান বদলে আবার চেষ্টা করুন।' : 'No area found with that name. Try a different spelling.'}
        </p>
      ) : (
        zones.map(z => renderZone(z.key, bn ? z.titleBn : z.titleEn))
      )}
      <p className="text-label-sm text-on-surface-variant/70">
        {bn
          ? '* ফি প্রতি অর্ডারে একবারই ধরা হয় — কয়টা জিনিস কিনলেন তার ওপর নির্ভর করে না।'
          : '* The fee is charged once per order — it does not depend on how many items you buy.'}
      </p>
    </InfoPage>
  );
}
