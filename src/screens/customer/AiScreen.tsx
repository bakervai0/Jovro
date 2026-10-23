import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AiBusyView } from './AiBusyScreen';
import { OPERATOR } from '../../data/infoContent';
import {
  respondToMessage, aiThinkingDelay, buildBudgetBundle, getDefaultSuggestions,
  setAiCatalogue,
} from '../../services/ai';
import type { BudgetBundle, ParsedLine } from '../../services/ai';
import type { CartItem } from '../../types';

interface ChatMessage {
  id: number;
  from: 'user' | 'ai';
  text: string;
  bundle?: BudgetBundle;
  bundleAdded?: boolean;
  at?: number;
}

const BUDGET_CHIPS = [500, 1000, 2000];
let msgId = 0;
const nextId = () => ++msgId;

export default function AiScreen() {
  const { state, dispatch, cartCount } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  // Register the live catalogue so AI answers use state.products/areas
  useEffect(() => { setAiCatalogue(state.products, state.areas); }, [state.products, state.areas]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      from: 'ai',
      at: Date.now(),
      text: lang === 'bn'
        ? 'আসসালামু আলাইকুম! আমি জোভ্রোর সহায়ক। বাজারের লিস্ট লিখে দিন — যেমন "৫ কেজি চাল আর ১ লিটার তেল দাও" — কার্টে যোগ করে দেবো। পণ্যের আনুমানিক দাম বা ডেলিভারি ফিও জিজ্ঞেস করতে পারেন।'
        : 'Hello! I am the Jovro assistant. Write your bazaar list — e.g. "5 kg rice and 1 litre oil" — and I will add it to your cart. You can also ask approx prices or delivery fees.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBusy, setShowBusy] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [customBudget, setCustomBudget] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add parsed lines to the cart, respecting quantities already in it.
  const addLinesToCart = (lines: ParsedLine[]) => {
    const planned = new Map(state.cart.map(i => [i.id, i.quantity]));
    for (const line of lines) {
      const id = line.product.id;
      const existingQty = planned.get(id);
      if (existingQty != null) {
        dispatch({ type: 'UPDATE_CART_QTY', id, qty: existingQty + line.qty });
        planned.set(id, existingQty + line.qty);
      } else {
        const item: CartItem = {
          id, productId: id,
          nameBn: line.product.nameBn, nameEn: line.product.nameEn,
          quantity: line.qty, price: line.product.approxPrice,
          unit: line.product.unit, source: 'bazaar', isApproxPrice: true,
        };
        dispatch({ type: 'ADD_TO_CART', item });
        planned.set(id, line.qty);
      }
    }
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || isTyping) return;
    setInput('');
    setMessages(m => [...m, { id: nextId(), from: 'user', text, at: Date.now() }]);
    setIsTyping(true);
    await aiThinkingDelay();
    const reply = respondToMessage(text, {
      orders: state.orders,
      cartProductIds: state.cart.map(i => i.productId ?? i.id),
    });
    if (reply.added.length > 0) addLinesToCart(reply.added);
    setMessages(m => [...m, {
      id: nextId(),
      from: 'ai',
      at: Date.now(),
      text: lang === 'bn' ? reply.messageBn : reply.messageEn,
      bundle: reply.bundle,
    }]);
    setIsTyping(false);
  };

  const makeBundle = (amount: number) => {
    if (!amount || amount <= 0) return;
    const bundle = buildBudgetBundle(amount);
    setMessages(m => [...m,
      { id: nextId(), from: 'user', at: Date.now(), text: lang === 'bn' ? `৳${amount} বাজেটের বান্ডল বানাও` : `Make a ৳${amount} budget bundle` },
      {
        id: nextId(), from: 'ai',
        at: Date.now(),
        text: lang === 'bn'
          ? `৳${amount} বাজেটে এই বান্ডলটা সাজালাম (মোট আনুমানিক ৳${bundle.total}):`
          : `Here is a bundle within ৳${amount} (approx total ৳${bundle.total}):`,
        bundle,
      },
    ]);
    setShowBudget(false);
    setCustomBudget('');
  };

  const addBundle = (msg: ChatMessage) => {
    if (!msg.bundle || msg.bundleAdded) return;
    addLinesToCart(msg.bundle.items);
    setMessages(m => m.map(x => x.id === msg.id ? { ...x, bundleAdded: true } : x));
  };

  if (showBusy) {
    return (
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        <TopAppBar
          showBack
          title={lang === 'bn' ? 'সহায়ক' : 'Assistant'}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setShowBusy(false)}>
              {lang === 'bn' ? 'চ্যাটে ফিরুন' : 'Back to chat'}
            </Button>
          }
        />
        <AiBusyView />
      </div>
    );
  }

  const bn = lang === 'bn';
  const selectedFee = state.areas.find(a => a.id === state.selectedAreaId)?.fee ?? 40;
  const fmtMsgTime = (at?: number) => (at ? new Date(at).toLocaleTimeString(bn ? 'bn-BD' : 'en-BD', { hour: 'numeric', minute: '2-digit' }) : '');
  const SUGGESTION_ICONS = ['receipt_long', 'restaurant', 'egg', 'shopping_basket'];

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAF7] overflow-hidden">
      {/* Header (Stitch 23) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-2.5 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                  {bn ? 'জোভ্রো সহায়ক' : 'Jovro Assistant'}
                </h1>
                <span className="font-bilingual-sub text-bilingual-sub text-on-surface-variant font-medium">/ Shopping Assistant</span>
              </div>
              <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
                {bn ? 'লালমনিরহাট গোশালা বাজার ও রেস্টুরেন্ট সহায়ক' : 'Lalmonirhat Goshala Bazar & restaurant helper'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'SET_LANG', lang: bn ? 'en' : 'bn' })}
              className="px-2.5 py-1 rounded-full bg-surface-container-low text-primary font-label-md text-label-md border border-outline-variant/40 active:scale-95 duration-150"
            >
              বাংলা | EN
            </button>
            {/* Demo: preview the AI-busy fallback state (D4) */}
            <IconButton icon="cloud_off" onClick={() => setShowBusy(true)} />
            <div className="relative">
              <IconButton icon="shopping_cart" onClick={() => navigate('/cart')} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-secondary-container text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-primary border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-label-sm">● {bn ? 'সক্রিয় / Active AI Helper' : 'Active AI Helper'}</span>
          </span>
          <span className="font-bilingual-sub text-bilingual-sub text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
            {bn ? 'গোশালা বাজার দর যাচাইকৃত' : 'Goshala Bazar prices verified'}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="flex justify-center my-1">
          <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-bilingual-sub text-bilingual-sub border border-outline-variant/30">
            {bn ? 'আজকের সহকারী সেশন · লালমনিরহাট সদর' : 'Today’s assistant session · Lalmonirhat Sadar'}
          </span>
        </div>
        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex flex-col w-full', msg.from === 'user' ? 'items-end' : 'items-start')}>
            {msg.from === 'ai' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-primary border border-primary/20 mb-1">
                <span className="material-symbols-outlined text-[15px]">arrow_back_ios_new</span>
                <span className="font-label-md text-label-md">{bn ? 'সহায়ক / Assistant' : 'Assistant'}</span>
              </span>
            )}
            <div className={clsx(
              'max-w-[92%] p-3.5 shadow-sm',
              msg.from === 'user'
                ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm'
                : 'bg-surface-container-lowest text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/20',
            )}>
              <p className="font-body-md text-body-md whitespace-pre-line leading-relaxed">{msg.text}</p>
              <div className={clsx(
                'mt-2 flex items-center justify-between gap-3 font-bilingual-sub text-bilingual-sub pt-1.5 border-t',
                msg.from === 'user' ? 'border-white/20 text-primary-fixed-dim justify-end' : 'border-outline-variant/15 text-outline',
              )}>
                {msg.from === 'ai' && <span>{bn ? 'জোভ্রো স্মার্ট পার্সোনাল শপার' : 'Jovro Smart Personal Shopper'}</span>}
                <span className="flex items-center gap-1">
                  {fmtMsgTime(msg.at)}
                  {msg.from === 'user' && <span className="material-symbols-outlined text-[14px]">done_all</span>}
                </span>
              </div>
            </div>

            {/* Budget bundle card (D3, Stitch 23/23b) */}
            {msg.bundle && (
              <div className="w-full mt-2 bg-surface-container-lowest rounded-2xl shadow-sm border-2 border-primary/25 relative overflow-hidden">
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                    </span>
                    <div>
                      <h2 className="font-label-lg text-label-lg text-on-surface font-bold">
                        {bn ? 'প্রস্তুতকৃত কাঁচাবাজারের ফর্দ' : 'Prepared bazaar list'}
                      </h2>
                      <p className="font-bilingual-sub text-bilingual-sub text-on-surface-variant">
                        {bn ? `গোশালা বাজার সংগৃহীত · ${msg.bundle.items.length}টি আইটেম` : `Goshala Bazar · ${msg.bundle.items.length} items`}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-primary text-on-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    {bn ? 'বাজেট অপ্টিমাইজড' : 'Budget optimized'}
                  </span>
                </div>
                <div className="px-4 py-1">
                  {msg.bundle.items.map((l, i) => (
                    <div key={l.product.id} className="py-2.5 flex items-center justify-between border-b border-outline-variant/15 last:border-0">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm flex items-center justify-center mt-0.5 font-bold shrink-0">
                          {bn ? ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][i] ?? i + 1 : i + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                            {l.product.imageEmoji} {bn ? l.product.nameBn : l.product.nameEn}
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {bn ? 'পরিমাণ' : 'Qty'}: {l.qty}{l.product.unit ? ` ${l.product.unit}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">৳{l.product.approxPrice * l.qty}</span>
                        <p className="font-bilingual-sub text-bilingual-sub text-outline">{bn ? 'আনুমানিক (Approx.)' : 'Approx.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <div className="pt-3 mt-1 border-t border-dashed border-outline-variant/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-on-surface font-semibold">{bn ? 'মোট আনুমানিক পণ্যের মূল্য:' : 'Approx. goods total:'}</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">৳{msg.bundle.total} <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">/ ৳{msg.bundle.budget}</span></span>
                    </div>
                    <p className="font-bilingual-sub text-bilingual-sub text-outline bg-surface-container-low p-2 rounded-lg flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">verified</span>
                      <span>{bn ? 'বাজারের আসল ক্যাশ মেমোর মূল্যেই কেনা হবে। কোনো লুকানো চার্জ নেই।' : 'Bought at the real bazaar cash-memo price. No hidden charges.'}</span>
                    </p>
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#FFF7ED] border border-[#F97316]/30 text-[#C2410C]">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">pedal_bike</span>
                        <span className="font-label-md text-label-md font-semibold">{bn ? '+ সাইকেল ডেলিভারি চার্জ (Bicycle Delivery):' : '+ Delivery charge:'}</span>
                      </span>
                      <span className="font-label-lg text-label-lg font-bold">৳{selectedFee}</span>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button
                      onClick={() => addBundle(msg)}
                      disabled={msg.bundleAdded}
                      className="w-full h-12 bg-primary active:scale-[0.98] duration-150 transition-all rounded-full flex items-center justify-center gap-2 text-white font-label-lg text-label-lg shadow-md disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">{msg.bundleAdded ? 'check_circle' : 'add_shopping_cart'}</span>
                      <span>
                        {msg.bundleAdded
                          ? (bn ? 'কার্টে যোগ হয়েছে' : 'Added to cart')
                          : (bn ? `সব কার্টে যোগ করুন / Add all to cart (৳${msg.bundle.total})` : `Add all to cart (৳${msg.bundle.total})`)}
                      </span>
                      {!msg.bundleAdded && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                    </button>
                    <button
                      onClick={() => navigate('/cart')}
                      className="w-full h-10 bg-transparent active:scale-[0.98] duration-150 transition-all rounded-full border border-primary/40 flex items-center justify-center gap-1.5 text-primary font-label-md text-label-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      <span>{bn ? 'আইটেম পরিবর্তন করুন / Edit list' : 'Edit list'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator (Stitch 23 typing state) */}
        {isTyping && (
          <div className="flex flex-col items-start max-w-[92%] space-y-1 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-primary border border-primary/20">
              <span className="material-symbols-outlined text-[14px] animate-pulse">smart_toy</span>
              <span className="font-label-sm text-label-sm font-semibold text-primary">
                {bn ? 'জোভ্রো শপার লিখছেন... / Jovro AI is typing' : 'Jovro AI is typing...'}
              </span>
            </span>
            <div className="bg-surface-container-lowest text-on-surface px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-outline-variant/25 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E8F5E9] text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-[16px] text-primary">local_mall</span>
              </span>
              <span className="flex items-center gap-1.5 py-1 px-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-on-surface-variant/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </span>
              <span className="font-bilingual-sub text-bilingual-sub text-outline/80 italic pl-1 border-l border-outline-variant/30">
                {bn ? 'গোশালা বাজারের দর যাচাই হচ্ছে...' : 'Checking Goshala Bazar prices...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Budget bundle builder (D3) */}
      {showBudget && (
        <div className="px-4 pb-2">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-4">
            <p className="text-label-lg font-semibold text-on-surface mb-2">
              {lang === 'bn' ? 'বাজেট বেছে নিন' : 'Choose a budget'}
            </p>
            <div className="flex gap-2 mb-3">
              {BUDGET_CHIPS.map(amount => (
                <button
                  key={amount}
                  onClick={() => makeBundle(amount)}
                  className="flex-1 py-2.5 rounded-2xl bg-primary/10 text-primary text-label-lg font-bold active:scale-95 transition-transform"
                >
                  ৳{amount}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={lang === 'bn' ? 'নিজের বাজেট (৳)' : 'Custom budget (৳)'}
                  value={customBudget}
                  onChange={e => setCustomBudget(e.target.value)}
                />
              </div>
              <button
                onClick={() => makeBundle(parseInt(bnAmount(customBudget), 10))}
                disabled={!customBudget.trim()}
                className="px-4 rounded-2xl bg-primary text-white text-label-md font-medium disabled:opacity-40"
              >
                {lang === 'bn' ? 'বানান' : 'Build'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick prompts (Stitch 23) */}
      <div className="px-4 pb-2">
        <p className="font-bilingual-sub text-bilingual-sub text-outline mb-2 px-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
          {bn ? 'ক্লিক করে দ্রুত শুরু করুন (Quick Prompts):' : 'Tap to start quickly (Quick Prompts):'}
        </p>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setShowBudget(v => !v)}
            className="whitespace-nowrap px-3.5 py-2 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md border border-primary/30 shadow-sm active:scale-95 duration-150 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            {bn ? 'বাজেট বান্ডল বানাও' : 'Build a budget bundle'}
          </button>
          {getDefaultSuggestions().map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="whitespace-nowrap px-3.5 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md border border-outline-variant/50 shadow-sm active:scale-95 duration-150 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">{SUGGESTION_ICONS[i % SUGGESTION_ICONS.length]}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp order pill (Stitch 23) */}
      <div className="px-4 pb-2 flex justify-end">
        <a
          href={OPERATOR.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] text-white shadow-lg active:scale-95 duration-150 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">chat</span>
          <span className="font-label-md text-label-md font-bold tracking-tight">{bn ? 'হোয়াটসঅ্যাপে অর্ডার' : 'Order on WhatsApp'}</span>
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        </a>
      </div>

      {/* Input row (Stitch 23) */}
      <div className="px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(43,45,47,0.08)]">
        <div className="flex items-center gap-2">
          <span
            title={bn ? 'ভয়েস ইনপুট (শীঘ্রই আসছে)' : 'Voice input (coming soon)'}
            className="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center shrink-0 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[24px]">mic</span>
          </span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder={bn ? 'লিখুন… যেমন: ৫ কেজি চাল দাও' : 'Type… e.g. 5 kg rice please'}
            className="flex-1 w-full h-12 pl-3.5 pr-4 rounded-full bg-white border-[1.5px] border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface font-body-md text-body-md placeholder:text-outline/70 transition-all outline-none"
          />
          <IconButton
            icon="send"
            variant="primary"
            size="lg"
            onClick={() => send()}
            disabled={!input.trim() || isTyping}
          />
        </div>
      </div>
    </div>
  );
}

function bnAmount(v: string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return v.replace(/[০-৯]/g, d => String(bn.indexOf(d)));
}
