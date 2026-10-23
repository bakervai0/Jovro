import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';
import { OPERATOR } from '../../data/infoContent';

/**
 * F3 — sign-in pending notice. Strict replica of design r1.3:
 * sticky portal header, "রাইডার লগইন" title, the orange pending
 * notice card (custom notice shadow, filled pending icon, mono
 * email badge, status CTA) on top of the locked sign-in form
 * (soft-shadow card, ring-focus inputs), approval/NID info
 * cards, join referral block (mt-auto) and helpdesk footer.
 * Shown by the /rider layout guard when the signed-in user's
 * rider record has status 'pending'.
 * Deviations (wiring preserved): the language chip is a working
 * toggle button, the back/CTA/forgot controls are buttons wired
 * to real navigation/recheck, and the demo extras (shop-as-
 * customer button + DemoRoleSwitcher) sit between the info
 * cards and the referral block.
 */
export default function RiderPendingScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';
  const [showPw, setShowPw] = useState(false);

  const email = state.user?.email ?? '';

  const backToCustomer = () => {
    dispatch({ type: 'SET_ROLE', role: 'customer' });
    navigate('/', { replace: true });
  };

  /** Re-enter the rider guard — if the admin has approved in the
      meantime, the dashboard opens; otherwise this notice stays. */
  const recheck = () => navigate('/rider', { replace: true });

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAF7] overflow-hidden">
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-4 h-14 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <button
            aria-label="Go Back"
            onClick={backToCustomer}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="text-headline-sm font-bold text-primary tracking-tight">Jovro</span>
            <span className="text-[11px] font-semibold tracking-wide text-secondary px-2 py-0.5 rounded-full bg-secondary-fixed/50 uppercase">রাইডার পোর্টাল</span>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
          className="text-bilingual-sub text-on-surface-variant font-medium px-2.5 py-1 rounded bg-surface-container-low"
        >
          বাংলা | EN
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-8 flex flex-col">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-headline-md font-bold text-on-surface">রাইডার লগইন</h1>
            <span className="text-label-md text-on-surface-variant font-medium">/ Rider Sign-in</span>
          </div>
          <p className="text-body-sm text-outline flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-outline">verified_user</span>
            <span>শুধুমাত্র অনুমোদিত রাইডার ইমেইলের জন্য / For approved rider emails only</span>
          </p>
        </div>

        {/* Pending notice card (design r1.3) */}
        <section aria-live="polite" className="mb-6 rounded-xl border border-secondary-container/40 bg-orange-50/70 p-4 shadow-[0_4px_14px_-2px_rgba(253,118,26,0.12),0_2px_6px_-1px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container" />
          <div className="flex items-start gap-3 pl-1">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined filled-symbol text-[22px]">pending</span>
            </div>
            <div className="flex-1">
              <h2 className="text-label-lg font-bold text-on-secondary-container leading-tight">
                আপনার আবেদন এখনো অনুমোদনের অপেক্ষায় আছে
              </h2>
              <p className="text-bilingual-sub text-secondary font-medium mt-0.5 mb-2.5 leading-snug">
                Your application is still awaiting admin approval
              </p>
              {email && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-secondary-container/30 text-body-sm text-on-surface font-mono mb-3">
                  <span className="material-symbols-outlined text-[14px] text-secondary">alternate_email</span>
                  <span className="font-medium text-xs">{email}</span>
                </div>
              )}
              <div>
                <button
                  onClick={recheck}
                  className="inline-flex items-center gap-1.5 text-label-md font-bold text-secondary hover:text-on-secondary-container active:scale-95 transition-transform bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-secondary-container/50 shadow-sm"
                >
                  <span>আবেদনের অবস্থা দেখুন</span>
                  <span className="text-[10px] font-normal text-secondary/80">/ See status</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Locked sign-in form (design r1.3) */}
        <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)] border border-outline-variant/30 mb-6">
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); recheck(); }}>
            <div>
              <label className="block text-label-md font-semibold text-on-surface mb-1.5">
                ইমেইল অ্যাড্রেস <span className="text-outline font-normal text-body-sm">/ Registered Email</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  className="w-full h-12 pl-10 pr-10 text-body-md text-on-surface bg-surface-bright rounded-lg border border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium"
                  type="email"
                  value={email}
                  readOnly
                  placeholder="ইমেইল অ্যাড্রেস লিখুন"
                />
                <div className="absolute right-3.5 flex items-center pointer-events-none text-primary">
                  <span className="material-symbols-outlined filled-symbol text-[20px]">check_circle</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-label-md font-semibold text-on-surface">
                  পাসওয়ার্ড <span className="text-outline font-normal text-body-sm">/ Password</span>
                </label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-label-md font-semibold text-primary hover:underline active:opacity-80">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="w-full h-12 pl-10 pr-11 text-body-md text-on-surface bg-surface-bright rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all tracking-widest"
                  type={showPw ? 'text' : 'password'}
                  value="••••••••"
                  readOnly
                  placeholder="পাসওয়ার্ড লিখুন"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <div className="text-right mt-1">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-bilingual-sub text-outline hover:text-primary transition-colors">
                  Forgot password? (OTP Reset)
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-full flex items-center justify-center gap-2 text-on-primary text-label-lg shadow-sm"
              >
                <span>লগইন</span>
                <span className="text-xs font-normal opacity-90">/ Log in</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>

        {/* Info mini-cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)]">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div>
              <p className="text-label-md font-bold text-on-surface">অনুমোদন ধাপ</p>
              <p className="text-bilingual-sub text-outline leading-tight mt-0.5">Approval takes 12–24h by Lalmonirhat hub</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-between shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)]">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-secondary flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <div>
              <p className="text-label-md font-bold text-on-surface">NID ও লাইসেন্স</p>
              <p className="text-bilingual-sub text-outline leading-tight mt-0.5">Verified before account activation</p>
            </div>
          </div>
        </div>

        {/* Functional extras kept from the F3 demo flow (not in design) */}
        <div className="flex flex-col gap-3 mb-6">
          <Button variant="outline" size="full" icon="store" onClick={backToCustomer}>
            {bn ? 'গ্রাহক হিসেবে কেনাকাটা করুন' : 'Shop as a customer'}
          </Button>
          <DemoRoleSwitcher />
        </div>

        <div className="mt-auto text-center pt-2">
          <p className="text-body-sm text-on-surface mb-1">
            নতুন আবেদন করতে চান?
            <button onClick={() => navigate('/apply-rider')} className="font-bold text-primary hover:underline ml-1 inline-flex items-center">
              <span>রাইডার হিসেবে যোগ দিন</span>
              <span className="material-symbols-outlined text-[14px] ml-0.5">open_in_new</span>
            </button>
          </p>
          <p className="text-bilingual-sub text-outline">Apply to become a rider on Jovro Express</p>
        </div>
      </div>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">headset_mic</span>
          </div>
          <div>
            <p className="text-label-sm text-outline uppercase tracking-wider">রাইডার হেল্পডেস্ক / Support</p>
            <a href={OPERATOR.phoneTel} className="text-label-md font-bold text-on-surface hover:text-primary transition-colors">
              {bn ? OPERATOR.phoneDisplayBn.replace(' (নমুনা)', '') : OPERATOR.phoneDisplayEn.replace(' (sample)', '')}
            </a>
          </div>
        </div>
        <a
          href={OPERATOR.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-full flex items-center gap-1.5 transition-colors border border-[#25D366]/30 active:scale-95"
        >
          <span className="material-symbols-outlined filled-symbol text-[18px]">chat</span>
          <span className="text-label-sm font-bold">হোয়াটসঅ্যাপ</span>
        </a>
      </footer>
    </div>
  );
}
