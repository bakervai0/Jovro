import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button } from '../../components/ui/Button';
import { DemoRoleSwitcher } from '../../components/shared/DemoRoleSwitcher';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Affiliate programme — CLOSED at launch (owner decision,
 * Oct 23). Every affiliate entry point for non-affiliates lands
 * here instead of the apply flow: /apply-affiliate (Earn Money
 * card on Home/Profile) and /affiliate/* for a signed-in user
 * with no affiliate record of their own (see the gate in
 * AffiliateScreen). Existing affiliates keep their dashboard;
 * admin affiliate management is untouched.
 *
 * Visitors can leave an email on the waitlist (AppContext slice
 * `affiliateWaitlist`, persisted in jovro_data_v5) and are told
 * they will be emailed when the programme opens.
 */
export default function AffiliateClosedScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const bn = state.lang === 'bn';

  const [email, setEmail] = useState(state.user?.email ?? '');
  const [error, setError] = useState<'invalid' | 'duplicate' | null>(null);
  const [done, setDone] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  // An existing affiliate who taps an entry point by mistake
  // gets a shortcut back to their dashboard (or pending notice).
  const myAffiliate = state.affiliates.find(a => a.userId === state.user?.id);

  const goHome = () => {
    if (state.role !== 'customer') dispatch({ type: 'SET_ROLE', role: 'customer' });
    navigate('/', { replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) { setError('invalid'); return; }
    if (state.affiliateWaitlist.some(w => w.email === value)) { setError('duplicate'); return; }
    dispatch({ type: 'ADD_AFFILIATE_WAITLIST', email: value });
    setSavedEmail(value);
    setError(null);
    setDone(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        title={bn ? 'অ্যাফিলিয়েট' : 'Affiliate'}
        subtitle={bn ? 'Affiliate Programme' : 'অ্যাফিলিয়েট প্রোগ্রাম'}
        showBack
        onBack={goHome}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-5 pb-8 flex flex-col">
        {/* Closed notice card — mirrors the r1.3 pending-notice
            structure, in the affiliate (tertiary) accent. */}
        <section
          aria-live="polite"
          className="mb-6 rounded-xl border border-tertiary/30 bg-tertiary/5 p-4 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary" />
          <div className="flex items-start gap-3 pl-1">
            <div className="w-9 h-9 rounded-full bg-tertiary/12 flex items-center justify-center shrink-0 text-tertiary">
              <span className="material-symbols-outlined filled-symbol text-[22px]">group_off</span>
            </div>
            <div className="flex-1">
              <h2 className="text-label-lg font-bold text-on-surface leading-tight">
                {bn ? 'আমরা এই মুহূর্তে নতুন অ্যাফিলিয়েট নিচ্ছি না' : 'We are not accepting new affiliates right now'}
              </h2>
              <p className="text-bilingual-sub text-on-surface-variant font-medium mt-0.5 mb-2.5 leading-snug">
                {bn ? 'We are not accepting new affiliates right now' : 'আমরা এই মুহূর্তে নতুন অ্যাফিলিয়েট নিচ্ছি না'}
              </p>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {bn
                  ? 'অ্যাফিলিয়েট প্রোগ্রামটি আপাতত বন্ধ রাখা হয়েছে। ভবিষ্যতে চালু হলে আগ্রহীদের আগে জানানো হবে — নিচে আপনার ইমেইল দিয়ে রাখুন।'
                  : 'The affiliate programme is paused for now. When it opens in the future, interested people will be informed first — leave your email below.'}
              </p>
            </div>
          </div>
        </section>

        {/* Existing-affiliate shortcut */}
        {myAffiliate && (
          <button
            onClick={() => navigate('/affiliate')}
            className="mb-6 w-full flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 text-left shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)] active:scale-[0.99] transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">handshake</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-bold text-on-surface">
                {bn ? 'আপনি ইতিমধ্যে অ্যাফিলিয়েট প্রোগ্রামে আছেন' : 'You are already in the affiliate programme'}
              </p>
              <p className="text-bilingual-sub text-outline leading-tight mt-0.5">
                {bn ? 'Go to your affiliate dashboard' : 'আপনার অ্যাফিলিয়েট ড্যাশবোর্ডে যান'}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </button>
        )}

        {/* Waitlist card */}
        <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(43,45,47,0.06),0_1px_2px_rgba(43,45,47,0.04)] border border-outline-variant/30 mb-6">
          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-primary/12 flex items-center justify-center">
                <span className="material-symbols-outlined filled-symbol text-primary text-[30px]">check_circle</span>
              </div>
              <h3 className="text-headline-sm font-semibold text-on-surface leading-snug">
                {bn ? 'ধন্যবাদ! চালু হলে আপনাকে ইমেইলে জানানো হবে' : "Thank you! We'll email you when it opens"}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant/40 text-body-sm text-on-surface font-mono">
                <span className="material-symbols-outlined text-[14px] text-primary">alternate_email</span>
                <span className="font-medium text-xs">{savedEmail}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {bn
                  ? 'আপনার ইমেইল অপেক্ষা তালিকায় যোগ হয়েছে। অ্যাফিলিয়েট প্রোগ্রাম চালু হলেই খবর পাবেন।'
                  : 'Your email has been added to the waitlist. You will be notified as soon as the affiliate programme opens.'}
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit} noValidate>
              <div>
                <label htmlFor="aff-waitlist-email" className="block text-label-md font-semibold text-on-surface mb-1.5">
                  {bn ? 'ভবিষ্যতে চালু হলে জানতে আপনার ইমেইল দিয়ে রাখুন' : 'Leave your email to be notified when it opens'}
                  <span className="block text-bilingual-sub text-outline font-normal mt-0.5">
                    {bn ? 'Leave your email — we will let you know when it opens' : 'ভবিষ্যতে চালু হলে জানতে আপনার ইমেইল দিয়ে রাখুন'}
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    id="aff-waitlist-email"
                    className="w-full h-12 pl-10 pr-4 text-body-md text-on-surface bg-surface-bright rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder={bn ? 'আপনার ইমেইল ঠিকানা' : 'Your email address'}
                  />
                </div>
                {error === 'invalid' && (
                  <p className="flex items-center gap-1.5 text-label-md font-semibold text-error mt-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {bn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address'}
                  </p>
                )}
                {error === 'duplicate' && (
                  <p className="flex items-center gap-1.5 text-label-md font-semibold text-tertiary mt-2">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    {bn ? 'আপনার ইমেইল ইতিমধ্যে তালিকায় আছে' : 'Your email is already on the list'}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-full flex items-center justify-center gap-2 text-on-primary text-label-lg shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                <span>{bn ? 'তালিকায় যোগ করুন' : 'Join the waitlist'}</span>
              </button>
            </form>
          )}
        </div>

        <Button variant="outline" size="full" icon="home" onClick={goHome}>
          {bn ? 'হোমে ফিরুন' : 'Back to home'}
        </Button>

        {/* Demo escape hatch, as on the affiliate pending notice */}
        {state.role === 'affiliate' && (
          <div className="mt-4">
            <DemoRoleSwitcher />
          </div>
        )}
      </div>
    </div>
  );
}
