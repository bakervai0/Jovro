import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { PRIVACY_SECTIONS } from '../../data/infoContent';

export default function PrivacyScreen() {
  return (
    <TextInfoScreen
      titleBn="গোপনীয়তা নীতি"
      titleEn="Privacy Policy"
      icon="privacy_tip"
      sections={PRIVACY_SECTIONS}
    />
  );
}
