import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { TERMS_SECTIONS } from '../../data/infoContent';

export default function TermsScreen() {
  return (
    <TextInfoScreen
      titleBn="শর্তাবলী"
      titleEn="Terms & Conditions"
      icon="description"
      sections={TERMS_SECTIONS}
    />
  );
}
