import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { ABOUT_SECTIONS } from '../../data/infoContent';

export default function AboutScreen() {
  return (
    <TextInfoScreen
      titleBn="জোভ্রো সম্পর্কে"
      titleEn="About Jovro"
      icon="storefront"
      sections={ABOUT_SECTIONS}
    />
  );
}
