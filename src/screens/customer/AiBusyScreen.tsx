import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { OPERATOR } from '../../data/infoContent';
import { toBnDigits } from '../../services/orderUtils';

const QUICK_CHIPS = [
  { icon: 'nutrition', labelBn: 'তাজা শাক-সবজি তালিকা', textBn: 'তাজা শাক-সবজি: ' },
  { icon: 'restaurant', labelBn: 'রেস্টুরেন্টের পার্সেল', textBn: 'রেস্টুরেন্টের পার্সেল: ' },
  { icon: 'egg', labelBn: 'চাল-ডাল-ডিম', textBn: 'চাল, ডাল আর ডিম: ' },
];

/**
 * D4 — AI busy fallback, aligned to Stitch 23c: operator-standby
 * strip and the human-service card — the customer writes a free
 * shopping note which is handed to the operator on WhatsApp,
 * or calls the operator directly. Browse/try-again actions from
 * the earlier build stay below the card.
 */
export function AiBusyView() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';
  const [note, setNote] = useState('');

  const sendNote = () => {
    if (!note.trim()) return;
    const url = `${OPERATOR.whatsappUrl}?text=${encodeURIComponent(note.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Operator standby strip */}
      <div className="bg-primary/5 px-4 py-2 flex items-center justify-between border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="font-label-md text-label-md text-primary font-semibold">{bn ? 'অপারেটর সংযোগ প্রস্তুত' : 'Operator connection ready'}</span>
          <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-normal">/ Operator Standby</span>
        </div>
        <span className="font-bilingual-sub text-bilingual-sub text-outline font-medium">{bn ? 'সদর হাব • অনলাইন' : 'Sadar Hub • Online'}</span>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex justify-center">
          <span className="bg-surface-container-high/60 text-outline px-2.5 py-0.5 rounded-full font-label-sm text-label-sm">
            {bn ? 'আজ • গোশালা বাজার রোড' : 'Today • Goshala Bazar Road'}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary mt-1">
            <span className="material-symbols-outlined text-[18px]">directions_bike</span>
          </span>
          <div className="flex-1">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-fixed via-primary to-primary-fixed" />
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">storefront</span>
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">
                      {bn ? 'সহায়ক এখন কিছুটা ব্যস্ত আছে' : 'The assistant is a bit busy right now'}
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-low text-primary border border-outline-variant/30">
                      {bn ? 'মানুষী সেবা' : 'Human service'}
                    </span>
                  </div>
                  <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant mt-0.5">
                    The AI assistant is momentarily occupied — write down your items below and we will personally handle your shopping.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low/70 rounded-xl p-3 border border-outline-variant/20">
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  {bn
                    ? 'লালমনিরহাট সদর হাবের আমাদের মানব অপারেটর ও সাইকেল রাইডার সরাসরি গোশালা বাজারে আছেন। আপনি বাংলায় লিখে দিলেই আমরা বাজারে গিয়ে সেরা পণ্য বাছাই করে দেব।'
                    : 'Our human operator and cycle riders are right at Goshala Bazar. Write your list and we will pick the best items for you.'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-label-lg text-label-lg text-on-surface font-semibold mb-1.5" htmlFor="ai-busy-note">
                    <span>📝 {bn ? 'আপনার কাঁচাবাজারের তালিকা বা বিশেষ নির্দেশ লিখুন:' : 'Write your bazaar list or special instructions:'}</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="ai-busy-note"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      maxLength={300}
                      rows={4}
                      placeholder={bn ? 'যেমন: মিনিকেট চাল ৫ কেজি, আলু ২ কেজি, কাঁচা মরিচ ও নান্না বিরিয়ানির ২ প্যাকেট...' : 'e.g. Miniket rice 5 kg, potatoes 2 kg...'}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none shadow-sm"
                    />
                    <div className="flex items-center justify-between pt-1 px-1">
                      <span className="font-label-sm text-label-sm text-outline">{bn ? 'বাংলা বা বাংলিশে লিখতে পারেন' : 'You can write in Bangla or Banglish'}</span>
                      <span className="font-label-sm text-label-sm text-outline font-medium">
                        {toBnDigits(note.length, lang)}/{toBnDigits(300, lang)} {bn ? 'অক্ষর' : 'chars'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-11 border border-outline-variant/60 rounded-xl bg-surface-container-low flex items-center justify-center gap-2 text-on-surface font-label-md text-label-md">
                  <span className="material-symbols-outlined text-secondary">mic</span>
                  <span className="font-semibold text-secondary">{bn ? 'মুখে বলে রেকর্ড করুন (ভয়েস নোট)' : 'Record by voice (voice note)'}</span>
                  <span className="font-bilingual-sub text-bilingual-sub text-outline">/ Hold to speak</span>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={sendNote}
                    disabled={!note.trim()}
                    className="w-full h-12 rounded-full bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>{bn ? 'অর্ডারের চিরকুট পাঠান' : 'Send shopping note'}</span>
                    <span className="font-bilingual-sub font-normal text-on-primary/90">/ Send Shopping Note</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <a
                    href={OPERATOR.phoneTel}
                    className="w-full h-12 rounded-full border border-primary bg-surface-container-lowest text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    <span className="font-semibold">{bn ? 'সরাসরি অপারেটরকে ফোন দিন' : 'Call the operator directly'}</span>
                    <span className="font-bilingual-sub font-normal text-on-surface-variant">/ Call Operator</span>
                  </a>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-2.5 border border-primary/15 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                  <span className="font-semibold text-on-surface">{bn ? '✓ বাজারের পাকা মেমোর মূল্যেই কেনাকাটা' : '✓ Shopping at real memo prices'}</span>
                  {bn ? ' • কোনো লুকানো চার্জ নেই • সাইকেল ডেলিভারি নিশ্চিত' : ' • No hidden charges • Cycle delivery assured'}
                </p>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mt-3">
              {QUICK_CHIPS.map(c => (
                <button
                  key={c.labelBn}
                  onClick={() => setNote(v => (v ? v : c.textBn))}
                  className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-full font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center gap-1 active:scale-95 whitespace-nowrap shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
                  <span>{bn ? c.labelBn : c.labelBn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kept browse / retry actions (functional — not in 23c) */}
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="primary" size="full" icon="storefront" onClick={() => navigate('/bazaar')}>
            {bn ? 'বাজার দেখুন' : 'Browse Bazaar'}
          </Button>
          <Button variant="outline" size="full" icon="restaurant" onClick={() => navigate('/food')}>
            {bn ? 'রেস্টুরেন্ট দেখুন' : 'Browse Restaurants'}
          </Button>
          <Button variant="ghost" size="full" onClick={() => navigate('/ai')}>
            {bn ? 'আবার চেষ্টা করুন' : 'Try again'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AiBusyScreen() {
  const { state } = useApp();
  const lang = state.lang;
  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar showBack title={lang === 'bn' ? 'সহায়ক' : 'Assistant'} />
      <AiBusyView />
    </div>
  );
}
