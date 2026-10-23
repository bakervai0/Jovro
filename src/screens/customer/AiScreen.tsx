import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { Button, IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AiBusyView } from './AiBusyScreen';
import {
  respondToMessage, aiThinkingDelay, buildBudgetBundle, getDefaultSuggestions,
} from '../../services/ai';
import type { BudgetBundle, ParsedLine } from '../../services/ai';
import type { CartItem } from '../../types';

interface ChatMessage {
  id: number;
  from: 'user' | 'ai';
  text: string;
  bundle?: BudgetBundle;
  bundleAdded?: boolean;
}

const BUDGET_CHIPS = [500, 1000, 2000];
let msgId = 0;
const nextId = () => ++msgId;

export default function AiScreen() {
  const { state, dispatch, cartCount } = useApp();
  const navigate = useNavigate();
  const lang = state.lang;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      from: 'ai',
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
    setMessages(m => [...m, { id: nextId(), from: 'user', text }]);
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
      text: lang === 'bn' ? reply.messageBn : reply.messageEn,
      bundle: reply.bundle,
    }]);
    setIsTyping(false);
  };

  const makeBundle = (amount: number) => {
    if (!amount || amount <= 0) return;
    const bundle = buildBudgetBundle(amount);
    setMessages(m => [...m,
      { id: nextId(), from: 'user', text: lang === 'bn' ? `৳${amount} বাজেটের বান্ডল বানাও` : `Make a ৳${amount} budget bundle` },
      {
        id: nextId(), from: 'ai',
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

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <TopAppBar
        showBack
        title={lang === 'bn' ? 'সহায়ক' : 'Assistant'}
        subtitle={lang === 'bn' ? 'বাজার লিস্ট লিখলেই কার্টে যোগ হবে' : 'Write a list — it goes to your cart'}
        actions={
          <>
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
          </>
        }
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'max-w-[85%] rounded-3xl px-4 py-3',
              msg.from === 'user'
                ? 'bg-primary text-white rounded-br-lg'
                : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface rounded-bl-lg',
            )}>
              {msg.from === 'ai' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-tertiary text-[16px]">smart_toy</span>
                  <span className="text-label-sm font-bold text-tertiary">{lang === 'bn' ? 'সহায়ক' : 'Assistant'}</span>
                </div>
              )}
              <p className="text-body-md whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* Budget bundle card (D3) */}
              {msg.bundle && (
                <div className="mt-3 bg-surface-container rounded-2xl p-3">
                  <div className="flex flex-col gap-1.5">
                    {msg.bundle.items.map(l => (
                      <div key={l.product.id} className="flex justify-between text-body-sm">
                        <span className="text-on-surface">{l.product.imageEmoji} {lang === 'bn' ? l.product.nameBn : l.product.nameEn} × {l.qty}</span>
                        <span className="font-semibold text-on-surface">৳{l.product.approxPrice * l.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-outline-variant/40 my-2" />
                  <div className="flex justify-between text-body-sm font-bold">
                    <span className="text-on-surface">{lang === 'bn' ? 'মোট (আনুমানিক)' : 'Total (approx)'}</span>
                    <span className="text-primary">৳{msg.bundle.total} / ৳{msg.bundle.budget}</span>
                  </div>
                  <Button
                    variant={msg.bundleAdded ? 'ghost' : 'primary'}
                    size="full"
                    className="mt-3"
                    icon={msg.bundleAdded ? 'check_circle' : 'add_shopping_cart'}
                    disabled={msg.bundleAdded}
                    onClick={() => addBundle(msg)}
                  >
                    {msg.bundleAdded
                      ? (lang === 'bn' ? 'কার্টে যোগ হয়েছে' : 'Added to cart')
                      : (lang === 'bn' ? 'সব কার্টে যোগ করুন' : 'Add all to cart')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator (D2) */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl rounded-bl-lg px-4 py-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[16px]">smart_toy</span>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-on-surface-variant/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
              <span className="text-label-sm text-on-surface-variant ml-1">
                {lang === 'bn' ? 'লিখছে...' : 'Typing...'}
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

      {/* Suggestion chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setShowBudget(v => !v)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full bg-secondary-container/15 text-secondary text-label-md font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">savings</span>
          {lang === 'bn' ? 'বাজেট বান্ডল' : 'Budget bundle'}
        </button>
        {getDefaultSuggestions().map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            className="flex-shrink-0 px-3 py-2 rounded-full bg-surface-container text-on-surface-variant text-label-md"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="px-4 py-3 bg-surface border-t border-outline-variant/30 flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder={lang === 'bn' ? 'লিখুন — যেমন: ৫ কেজি চাল দাও' : 'Type — e.g. 5 kg rice please'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            icon="edit_note"
          />
        </div>
        <IconButton
          icon="send"
          variant="primary"
          size="lg"
          onClick={() => send()}
          disabled={!input.trim() || isTyping}
        />
      </div>
    </div>
  );
}

function bnAmount(v: string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return v.replace(/[০-৯]/g, d => String(bn.indexOf(d)));
}
