import React from 'react';
import { useApp } from '../../context/AppContext';
import { InfoPage, InfoSection } from '../../components/layout/InfoPage';
import { Button } from '../../components/ui/Button';
import { OPERATOR } from '../../data/infoContent';

/** D15 — Contact Us: sample operator contact with call / WhatsApp actions. */
export default function ContactScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';

  const rows = [
    { icon: 'call', labelBn: 'ফোন', labelEn: 'Phone', value: bn ? OPERATOR.phoneDisplayBn : OPERATOR.phoneDisplayEn },
    { icon: 'mail', labelBn: 'ইমেইল', labelEn: 'Email', value: OPERATOR.email },
    { icon: 'schedule', labelBn: 'সার্ভিস সময়', labelEn: 'Service hours', value: bn ? OPERATOR.hoursBn : OPERATOR.hoursEn },
    { icon: 'location_on', labelBn: 'ঠিকানা', labelEn: 'Address', value: bn ? OPERATOR.addressBn : OPERATOR.addressEn },
  ];

  return (
    <InfoPage
      title={bn ? 'যোগাযোগ' : 'Contact Us'}
      subtitle={bn ? 'যেকোনো প্রয়োজনে ফোন বা মেসেজ করুন' : 'Call or message us anytime'}
      icon="support_agent"
    >
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl px-4 py-3.5">
            <span className="material-symbols-outlined text-primary text-[22px]">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-label-sm text-on-surface-variant">{bn ? r.labelBn : r.labelEn}</p>
              <p className="text-body-md font-medium text-on-surface">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <a href={OPERATOR.phoneTel} className="flex-1">
          <Button variant="primary" size="full" icon="call">
            {bn ? 'এখনই কল করুন' : 'Call Now'}
          </Button>
        </a>
        <a href={OPERATOR.whatsappUrl} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="success" size="full" icon="chat">
            WhatsApp
          </Button>
        </a>
      </div>

      <InfoSection
        paragraphs={bn
          ? ['অর্ডার, ডেলিভারি বা রিফান্ড — যেকোনো বিষয়ে উপরের নম্বরে যোগাযোগ করুন। সার্ভিস সময়ের বাইরে মেসেজ পাঠিয়ে রাখলে আমরা খুললেই উত্তর দেবো।']
          : ['For orders, delivery or refunds, reach us on the number above. If you message outside service hours, we will reply as soon as we open.']}
      />
    </InfoPage>
  );
}
