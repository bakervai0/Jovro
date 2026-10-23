import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { OPERATOR } from '../../data/infoContent';

/** D15 — Contact Us, composed to Stitch f1.3: operator phone
 *  card, WhatsApp card, email card with copy, hours + address. */
export default function ContactScreen() {
  const { state } = useApp();
  const bn = state.lang === 'bn';
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(OPERATOR.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <InfoPage
      title={bn ? 'যোগাযোগ' : 'Contact Us'}
      subtitle={bn ? 'Contact Us' : 'যোগাযোগ'}
      icon="support_agent"
    >
      <p className="text-headline-sm font-semibold text-on-surface -mt-2 px-1">
        {bn ? 'আমরা আপনাকে সহযোগিতায় প্রস্তুত' : 'We are ready to help you'}
      </p>

      {/* Operator phone card */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">call</span>
            {bn ? 'সরাসরি কল সাপোর্ট' : 'Direct call support'}
          </span>
          <span className="text-label-sm font-label-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {bn ? 'সরাসরি উত্তর' : 'Live answer'}
          </span>
        </div>
        <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant mt-3">
          {bn ? 'অপারেটর মোবাইল নম্বর (Direct Operator Line)' : 'Operator mobile number (Direct Operator Line)'}
        </p>
        <p className="text-headline-md font-headline-md font-bold text-on-surface tracking-tight">
          {bn ? OPERATOR.phoneDisplayBn : OPERATOR.phoneDisplayEn}
        </p>
        <a
          href={OPERATOR.phoneTel}
          className="mt-3 w-full h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 font-label-lg text-label-lg active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
          {bn ? 'কল করুন / Call now' : 'Call now'}
        </a>
      </section>

      {/* WhatsApp card */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#25D366]/15 text-[#128C4B] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">chat</span>
          </span>
          <div>
            <h2 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'হোয়াটসঅ্যাপ সাপোর্ট' : 'WhatsApp support'}</h2>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">Fastest dispatch response via WhatsApp</p>
          </div>
        </div>
        <a
          href={OPERATOR.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 w-full h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center gap-2 font-label-lg text-label-lg active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          {bn ? 'WhatsApp-এ মেসেজ করুন / Message on WhatsApp' : 'Message on WhatsApp'}
        </a>
      </section>

      {/* Email card */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">mail</span>
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-label-lg font-label-lg text-on-surface font-bold">{bn ? 'ইমেইল পরামর্শ ও অভিযোগ' : 'Email for advice & complaints'}</h2>
            <p className="text-body-md font-medium text-primary truncate">{OPERATOR.email}</p>
            <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">{bn ? 'আনুষ্ঠানিক সাপোর্ট ইমেইল' : 'Official support email'}</p>
          </div>
          <button
            onClick={copyEmail}
            className="flex items-center gap-1 px-3 py-2 rounded-full border border-outline-variant/50 text-label-md font-label-md text-on-surface active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? (bn ? 'কপি হয়েছে' : 'Copied') : bn ? 'কপি করুন' : 'Copy'}
          </button>
        </div>
      </section>

      {/* Hours + address cards */}
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
        <div>
          <p className="text-label-sm text-on-surface-variant">{bn ? 'সার্ভিসের সময় / Service hours' : 'Service hours'}</p>
          <p className="text-body-md font-medium text-on-surface">{bn ? OPERATOR.hoursBn : OPERATOR.hoursEn}</p>
          <p className="text-bilingual-sub font-bilingual-sub text-on-surface-variant">
            {bn ? 'সাত দিনই ডেলিভারি ও সাপোর্ট সক্রিয়' : 'Delivery & support active all seven days'}
          </p>
        </div>
      </section>
      <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
        <div>
          <p className="text-label-sm text-on-surface-variant">{bn ? 'ঠিকানা / Address' : 'Address'}</p>
          <p className="text-body-md font-medium text-on-surface">{bn ? OPERATOR.addressBn : OPERATOR.addressEn}</p>
        </div>
      </section>

      <p className="text-body-sm text-on-surface-variant leading-relaxed px-1">
        {bn
          ? 'অর্ডার, ডেলিভারি বা রিফান্ড — যেকোনো বিষয়ে উপরের নম্বরে যোগাযোগ করুন। সার্ভিস সময়ের বাইরে মেসেজ পাঠিয়ে রাখলে আমরা খুললেই উত্তর দেবো।'
          : 'For orders, delivery or refunds, reach us on the number above. If you message outside service hours, we will reply as soon as we open.'}
      </p>
    </InfoPage>
  );
}
