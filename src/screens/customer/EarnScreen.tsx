import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/Headers';
import { tk, toBn } from '../../lib/format';

export default function EarnScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const roles = [
    {
      id: 'rider',
      icon: 'pedal_bike',
      titleBn: 'রাইডার হোন',
      titleEn: 'Become a rider',
      descBn: 'নিজের সাইকেল বা মোটরসাইকেল নিয়ে ডেলিভারি করুন। প্রতিদিন দুটি স্লট, নগদ পেমেন্ট।',
      descEn: 'Deliver with your cycle or motorbike. Two slots a day, cash payouts.',
      pay: bn ? 'প্রতি ডেলিভারি ৳৪০–৭০' : '৳40–70 per delivery',
      path: '/apply-rider',
      tone: 'primary',
    },
    {
      id: 'affiliate',
      icon: 'share',
      titleBn: 'অ্যাফিলিয়েট হোন',
      titleEn: 'Become an affiliate',
      descBn: 'বন্ধুদের রেফার করুন — তাদের প্রতিটি অর্ডারে আপনি কমিশন পান।',
      descEn: 'Refer friends and earn commission on every order they place.',
      pay: bn ? 'প্রতি অর্ডারে ৳২০–৪০' : '৳20–40 per order',
      path: '/apply-affiliate',
      tone: 'secondary',
    },
  ];

  return (
    <div className="screen-scroll bg-surface">
      <PageHeader showBack title={bn ? 'আয় করার সুযোগ' : 'Earn with Jovro'} subtitle={bn ? 'লালমনিরহাট সদর' : 'Lalmonirhat Sadar'} />

      <div className="flex flex-col gap-3 px-4 pb-32 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F8A4E] to-primary-deep p-4 text-white">
          <span className="rounded-full bg-white/18 px-2 py-0.5 text-[9.5px] font-semibold">{bn ? 'আমাদের সাথে আয় করুন' : 'Earn with us'}</span>
          <h1 className="mt-2 text-[21px] font-bold leading-tight">
            {bn ? 'আপনার নিজের শহরে, নিজের সময়ে আয় করুন' : 'Earn in your own town, on your own time'}
          </h1>
          <p className="mt-1 text-[11.5px] leading-relaxed text-white/85">
            {bn
              ? 'Jovro একটি স্থানীয় সেবা — রাইডার ও অ্যাফিলিয়েট দুই ভাবেই লালমনিরহাটের তরুণরা আয় করছেন।'
              : 'Jovro is a local service — riders and affiliates across Lalmonirhat earn with us.'}
          </p>
          <div className="mt-3 flex gap-2">
            <div className="rounded-xl bg-white/12 px-3 py-2">
              <p className="text-[17px] font-bold">{toBn(state.riders.length, state.lang)}</p>
              <p className="text-[9.5px] text-white/75">{bn ? 'সক্রিয় রাইডার' : 'Active riders'}</p>
            </div>
            <div className="rounded-xl bg-white/12 px-3 py-2">
              <p className="text-[17px] font-bold">{tk(state.riders.reduce((s, r) => s + r.totalEarnings, 0), state.lang)}</p>
              <p className="text-[9.5px] text-white/75">{bn ? 'মোট রাইডার আয়' : 'Rider earnings'}</p>
            </div>
          </div>
        </div>

        {roles.map(role => (
          <div key={role.id} className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 shadow-card">
            <div className="flex items-start gap-3">
              <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ${role.tone === 'primary' ? 'bg-primary-soft text-primary-deep' : 'bg-secondary-soft text-secondary'}`}>
                <span className="material-symbols-outlined text-[23px]">{role.icon}</span>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold text-on-surface">{bn ? role.titleBn : role.titleEn}</h2>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-on-surface-variant">{bn ? role.descBn : role.descEn}</p>
                <p className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${role.tone === 'primary' ? 'bg-primary-soft text-primary-deep' : 'bg-secondary-soft text-secondary'}`}>
                  <span className="material-symbols-outlined text-[13px]">payments</span>
                  {role.pay}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(role.path)}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-[12.5px] font-bold text-white"
            >
              {bn ? 'আবেদন করুন' : 'Apply now'}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        ))}

        <div className="rounded-2xl bg-surface-container p-3.5">
          <h2 className="text-[12.5px] font-bold text-on-surface">{bn ? 'কীভাবে কাজ করে' : 'How it works'}</h2>
          <ol className="mt-2 flex flex-col gap-2">
            {[
              { bn: 'আবেদন করুন — নাম, মোবাইল ও এলাকা দিন।', en: 'Apply — name, mobile and area.' },
              { bn: 'অ্যাডমিন অনুমোদন করলে আপনার ড্যাশবোর্ড চালু হবে।', en: 'Once the admin approves, your dashboard activates.' },
              { bn: 'ডেলিভারি বা রেফারেল শেষে নগদ/বিকাশে পেমেন্ট নিন।', en: 'Get paid in cash or bKash after deliveries or referrals.' },
            ].map((step, i) => (
              <li key={step.en} className="flex items-start gap-2">
                <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{toBn(i + 1, state.lang)}</span>
                <span className="text-[11px] leading-relaxed text-on-surface-variant">{bn ? step.bn : step.en}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="px-2 text-center text-[10px] leading-relaxed text-on-surface-variant/80">
          {bn ? 'Jovro কোনো জামানত বা ফি নেয় না। আবেদন সম্পূর্ণ ফ্রি।' : 'Jovro charges no deposit or fee. Applying is free.'}
        </p>
      </div>
    </div>
  );
}
