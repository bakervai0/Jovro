import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { toBn, tk } from '../../lib/format';

/** Service-closed state (checklist B) — shown when the admin switches
 *  the business toggle OFF in Business Controls. */
export default function ServiceClosedScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const hours = [
    { day: bn ? 'শনি – বৃহস্পতি' : 'Sat – Thu', time: '6:00 AM – 9:00 PM', open: true },
    { day: bn ? 'শুক্রবার (জুমার দিন)' : 'Friday (Jummah)', time: '2:00 PM – 9:00 PM', open: true },
    { day: bn ? 'সরকারি ছুটির দিন' : 'Public holidays', time: bn ? 'শুধু আগাম অর্ডার' : 'Pre-orders only', open: false },
  ];

  return (
    <div className="screen-scroll bg-surface">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-outline-variant/50 bg-surface/95 px-4 py-2.5 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          aria-label={bn ? 'ফিরে যান' : 'Back'}
          className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-on-surface active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[23px]">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16.5px] font-bold leading-tight text-on-surface">
            {bn ? 'সেবা এখন বন্ধ' : 'Service closed'}
          </h1>
          <p className="truncate text-[11.5px] leading-tight text-on-surface-variant">
            {bn ? 'Service closed' : 'সেবা এখন বন্ধ'}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-40 pt-5">
        <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-5 py-7 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-secondary-soft">
            <span className="material-symbols-outlined text-[46px] text-secondary">schedule</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary-soft px-2.5 py-1 text-[10.5px] font-bold text-secondary">
            <span className="material-symbols-outlined text-[13px]">storefront</span>
            {bn ? 'গোশালা বাজার · লালমনিরহাট সদর' : 'Goshala Bazar · Lalmonirhat Sadar'}
          </span>
          <h2 className="mt-3 text-[19px] font-bold leading-snug text-on-surface">
            {bn ? 'আজকের জন্য অর্ডার নেওয়া বন্ধ' : 'Ordering is paused right now'}
          </h2>
          <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-on-surface-variant">
            {bn
              ? 'আমাদের শপাররা আজ বাজারে যাচ্ছেন না। আগামীকাল সকাল ৬:০০ টায় আবার অর্ডার নেওয়া শুরু হবে — চাইলে এখনই আগাম অর্ডার করে রাখতে পারেন।'
              : 'Our shoppers are not going to the bazar today. Ordering reopens tomorrow at 6:00 AM — you can place a pre-order now.'}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary-tint px-3 py-3">
            <span className="material-symbols-outlined text-[20px] text-primary">wb_sunny</span>
            <div className="text-left">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-primary-deep/70">
                {bn ? 'পরবর্তী সময়সূচি' : 'Next opening'}
              </p>
              <p className="text-[13.5px] font-bold text-primary-deep">
                {bn ? 'আগামীকাল সকাল ৬:০০' : 'Tomorrow, 6:00 AM'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/bazaar')}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[14px] font-bold text-white shadow-fab active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[19px]">event_available</span>
            {bn ? 'আগাম অর্ডার করুন' : 'Pre-order for tomorrow'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-full border border-outline-variant text-[13.5px] font-semibold text-on-surface active:scale-[0.98]"
          >
            {bn ? 'পরে দেখব' : 'Look around instead'}
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
          <p className="border-b border-outline-variant/30 px-4 py-2.5 text-[12px] font-bold text-on-surface">
            {bn ? 'সাপ্তাহিক সময়সূচি' : 'Weekly schedule'}
          </p>
          <ul className="divide-y divide-outline-variant/20">
            {hours.map(h => (
              <li key={h.day} className="flex items-center gap-3 px-4 py-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">calendar_month</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-on-surface">{h.day}</p>
                  <p className="text-[11px] text-on-surface-variant">{h.time}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    h.open ? 'bg-primary-soft text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {h.open ? (bn ? 'খোলা' : 'Open') : (bn ? 'সীমিত' : 'Limited')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
          <p className="text-[12px] font-bold text-on-surface">
            {bn ? 'জরুরি বাজার দরকার?' : 'Need an urgent bazar run?'}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-on-surface-variant">
            {bn
              ? `আমাদের অপারেটরকে সরাসরি জানান — জরুরি অর্ডারের জন্য ${tk(60, state.lang)} অতিরিক্ত ডেলিভারি চার্জ প্রযোজ্য।`
              : `Message our operator directly — urgent errands carry an extra ${tk(60, state.lang)} delivery charge.`}
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-primary text-[12.5px] font-bold text-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[17px]">support_agent</span>
            {bn ? 'অপারেটরকে মেসেজ করুন' : 'Message the operator'}
          </button>
        </section>

        <p className="text-center text-[10.5px] text-on-surface-variant">
          {bn ? `আজকের সময় ${toBn(new Date().getHours())}:${toBn(String(new Date().getMinutes()).padStart(2, '0'))} · লালমনিরহাট সদর` : 'Lalmonirhat Sadar · local time'}
        </p>
      </div>
    </div>
  );
}
