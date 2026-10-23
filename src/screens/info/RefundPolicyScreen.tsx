import React from 'react';
import { TextInfoScreen } from './TextInfoScreen';
import { REFUND_SECTIONS } from '../../data/infoContent';

export default function RefundPolicyScreen() {
  return (
    <TextInfoScreen
      titleBn="রিপ্লেসমেন্ট ও রিফান্ড নীতি"
      titleEn="Replacement & Refund Policy"
      icon="currency_exchange"
      sections={REFUND_SECTIONS}
    />
  );
}
