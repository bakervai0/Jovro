import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * D21 — Earn Money card, composed to Stitch e1.1 / e1.2:
 * amber opportunity card with two big centred join buttons
 * (rider = green, affiliate = orange). The buttons navigate to
 * the real application screens (F1 / I1); the "applied" state is
 * derived from shared state as before. Used in Profile (above
 * the footer) and at the bottom of Home.
 */
export function EarnMoneyCard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;
  const bn = lang === 'bn';

  const myRider = state.riders.find(r => r.userId === state.user?.id);
  const myAffiliate = state.affiliates.find(a => a.userId === state.user?.id);
  const applied = {
    rider: !!myRider,
    affiliate: !!myAffiliate,
  };

  const options: {
    key: 'rider' | 'affiliate'; path: string; icon: string;
    labelBn: string; labelEn: string;
    microBn: string; microEn: string; microSub: string;
    btnClass: string;
  }[] = [
    {
      key: 'rider', path: '/apply-rider', icon: 'pedal_bike',
      labelBn: 'রাইডার হিসেবে যোগ দিন', labelEn: 'Join as a Rider',
      microBn: 'নিজের সাইকেলে ডেলিভারি করে আয়', microEn: 'Earn by delivering on your own bicycle',
      microSub: 'Own bicycle delivery',
      btnClass: 'bg-primary hover:bg-primary-container',
    },
    {
      key: 'affiliate', path: '/apply-affiliate', icon: 'group_add',
      labelBn: 'অ্যাফিলিয়েট হিসেবে যোগ দিন', labelEn: 'Join as an Affiliate',
      microBn: 'কাস্টমার আনলেই প্রতি অর্ডারে কমিশন', microEn: 'Commission on every order you bring',
      microSub: 'Per order commission',
      btnClass: 'bg-secondary hover:bg-secondary-container',
    },
  ];

  return (
    <section className="mx-4 bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-label-sm border border-[#FCD34D]">
          <span className="material-symbols-outlined text-[14px]">stars</span>
          {bn ? 'উপার্জন ও সুযোগ • Opportunities' : 'Opportunities'}
        </span>
        <span className="text-label-sm font-label-sm text-[#B45309] bg-white/70 px-2 py-0.5 rounded-full">
          {bn ? 'সদর এরিয়া' : 'Sadar area'}
        </span>
      </div>
      <div className="mb-3.5">
        <h2 className="text-headline-sm font-headline-sm text-gray-900 leading-snug">
          {bn ? 'জোভ্রোর সাথে আয় করুন' : 'Earn Money with Jovro'}
          <span className="block text-body-sm font-bilingual-sub text-gray-600 font-normal">Earn Money with Jovro</span>
        </h2>
        <p className="text-body-sm font-body-sm text-gray-700 mt-1 leading-relaxed">
          {bn ? 'ডেলিভারি করে, অথবা বন্ধুদের এনে — দুইভাবেই আয় করা যায়' : 'Earn by delivering, or by bringing friends'}
          <span className="block text-[11px] text-gray-500 font-normal">Earn by delivering, or by bringing friends</span>
        </p>
      </div>
      <div className="flex gap-2.5 items-stretch mb-3">
        {options.map(o => (
          <button
            key={o.key}
            onClick={() => navigate(o.path)}
            className={`flex-1 ${o.btnClass} text-white p-3.5 rounded-xl shadow-sm text-center flex flex-col items-center justify-between active:scale-95 transition-all`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[24px] text-white">{o.icon}</span>
            </div>
            <div className="w-full">
              <span className="font-bold text-label-lg block leading-tight text-white">
                {bn ? o.labelBn : o.labelEn}
              </span>
              <span className="text-bilingual-sub block text-white/90 font-normal leading-tight">
                {o.labelEn}
              </span>
              <div className="mt-2 pt-1.5 border-t border-white/20">
                <p className="text-[10px] leading-tight text-white/95 font-medium">
                  {applied[o.key]
                    ? (bn ? '✓ আবেদন করা হয়েছে' : '✓ Applied')
                    : (bn ? o.microBn : o.microEn)}
                </p>
                <p className="text-[9px] text-white/80 leading-tight">{o.microSub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1 text-center">
        <span className="material-symbols-outlined text-[14px] text-[#B45309]">verified_user</span>
        <span className="text-[11px] font-medium text-[#92400E]">
          {bn ? 'যাচাই ও অনুমোদন সাপেক্ষে সক্রিয় হয় • Subject to admin verification' : 'Activates after verification • যাচাই ও অনুমোদন সাপেক্ষে'}
        </span>
      </div>
    </section>
  );
}
