import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { InfoPage } from '../../components/layout/InfoPage';
import { Button } from '../../components/ui/Button';
import { FAQ_ITEMS } from '../../data/infoContent';

/** D16 — Help & FAQ with an accordion. */
export default function FaqScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <InfoPage
      title={bn ? 'সাহায্য ও জিজ্ঞাসা' : 'Help & FAQ'}
      subtitle={bn ? 'সাধারণ প্রশ্নের উত্তর' : 'Answers to common questions'}
      icon="help"
    >
      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIdx === i;
          return (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex-1 text-body-md font-semibold text-on-surface">
                  {bn ? item.qBn : item.qEn}
                </span>
                <span className={clsx(
                  'material-symbols-outlined text-on-surface-variant text-[20px] transition-transform',
                  open && 'rotate-180',
                )}>
                  expand_more
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
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-3xl p-4 flex flex-col gap-3">
        <p className="text-body-md text-on-surface">
          {bn ? 'উত্তর খুঁজে পাননি? সরাসরি কথা বলুন অথবা অর্ডারে সমস্যা হলে রিপোর্ট করুন।' : 'Still need help? Talk to us, or report a problem with an order.'}
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
