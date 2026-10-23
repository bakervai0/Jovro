import React from 'react';
import { useApp } from '../../context/AppContext';
import { InfoPage, InfoSection } from '../../components/layout/InfoPage';
import type { InfoSectionData } from '../../data/infoContent';

/** Shared renderer for the simple bilingual text pages (D10/D14/D17–D19). */
export function TextInfoScreen({
  titleBn, titleEn, icon, sections,
}: {
  titleBn: string; titleEn: string; icon: string; sections: InfoSectionData[];
}) {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  return (
    <InfoPage title={bn ? titleBn : titleEn} icon={icon}>
      {sections.map((s, i) => (
        <InfoSection
          key={i}
          heading={bn ? s.headingBn : s.headingEn}
          paragraphs={bn ? s.bodyBn : s.bodyEn}
          bullets={bn ? s.bulletsBn : s.bulletsEn}
        />
      ))}
    </InfoPage>
  );
}
