import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { Button } from '../../components/ui/Button';
import { FAQ_ITEMS } from '../../data/infoContent';
import { toBnDigits } from '../../services/orderUtils';

// Leading icons per question, following Stitch f1.4.
const FAQ_ICONS = ['all_inclusive', 'pedal_bike', 'price_check', 'swap_horiz', 'support_agent', 'smart_toy', 'contact_support'];

/** D16 — Help & FAQ, composed to Stitch f1.4: support hero,
 *  question search, icon accordion, help CTA card. */
export default function FaqScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = FAQ_ITEMS.map((item, i) => ({ item, i })).filter(({ item }) =>
    !q || item.qBn.includes(query.trim()) || item.qEn.toLowerCase().includes(q) ||
    item.aBn.includes(query.trim()) || item.aEn.toLowerCase().includes(q),
  );

  return (
    <InfoPage
      title={bn ? 'সাহায্য ও সাধারণ প্রশ্ন' : 'Help & FAQ'}
      subtitle={bn ? 'Help and FAQ' : 'সাহায্য ও সাধারণ প্রশ্ন'}
      icon="support_agent"
    >
      <p className="text-headline-sm font-semibold text-on-surface -mt-2 px-1 flex items-center justify-between">
        <span>{bn ? 'আমরা সবসময় আপনার পাশে আছি' : 'We are always by your side'}</span>
        <span className="text-bilingual-sub font-bilingual-sub text-on-surface-variant font-medium">Lalmonirhat</span>
      </p>

      {/* Search (design f1.4 — filters the questions) */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={bn ? 'আপনার প্রশ্ন খুঁজুন... / Search questions' : 'Search questions...'}
          className="w-full h-12 rounded-full bg-surface-container-lowest border border-outline-variant/50 pl-11 pr-4 text-body-md text-on-surface placeholder:text-outline/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-label-lg font-label-lg text-on-surface font-bold">
          {bn ? 'জরুরি প্রশ্নাবলি' : 'Common queries'} <span className="text-on-surface-variant font-normal">/ Common Queries</span>
        </h2>
        <span className="text-label-sm font-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
          {bn ? `${toBnDigits(visible.length, state.lang)}টি সমাধান` : `${visible.length} answers`}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map(({ item, i }) => {
          const open = openIdx === i;
          return (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[19px]">{FAQ_ICONS[i % FAQ_ICONS.length]}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-md font-semibold text-on-surface">{bn ? item.qBn : item.qEn}</span>
                  <span className="block text-bilingual-sub font-bilingual-sub text-on-surface-variant truncate">{bn ? item.qEn : item.qBn}</span>
                </span>
                <span className={clsx(
                  'material-symbols-outlined text-on-surface-variant text-[20px] transition-transform shrink-0',
                  open && 'rotate-180',
                )}>
                  keyboard_arrow_down
                </span>
              </button>
              {open && (
                <p className="px-4 pb-4 text-body-md text-on-surface-variant leading-relaxed">
                  {bn ? item.aBn : item.aEn}
                </p>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-body-md text-on-surface-variant px-1">
            {bn ? 'কোনো প্রশ্ন মিলল না — অন্য শব্দে খুঁজুন।' : 'No questions matched — try other words.'}
          </p>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-3xl p-4 flex flex-col gap-3">
        <p className="text-body-md font-semibold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">headset_mic</span>
          {bn ? 'উত্তর পেলেন না?' : "Didn't find your answer?"}
        </p>
        <p className="text-body-sm text-on-surface-variant -mt-1.5">
          {bn ? 'সরাসরি কথা বলুন অথবা অর্ডারে সমস্যা হলে রিপোর্ট করুন।' : 'Talk to us, or report a problem with an order.'}
        </p>
        <div className="flex gap-2">
          <Button variant="primary" size="full" icon="call" onClick={() => navigate('/contact')}>
            {bn ? 'যোগাযোগ' : 'Contact'}
          </Button>
          <Button variant="outline" size="full" icon="report" onClick={() => navigate('/report')}>
            {bn ? 'সমস্যা জানান' : 'Report'}
          </Button>
        </div>
      </div>
    </InfoPage>
  );
}
