// ============================================================
// Jovro AI Assistant (সহায়ক) — rule-based demo service
// HARD RULE: answers come ONLY from seeded data (PRODUCTS /
// DELIVERY_AREAS / the user's own orders). Prices quoted are
// always the seeded approx prices. Nothing is invented — no
// fake prices, stock claims, discounts or offers.
// ============================================================
import { PRODUCTS } from '../data/products';
import { DELIVERY_AREAS } from '../data/areas';
import type { Product, Order, DeliveryArea } from '../types';

// ── Live catalogue (Phase 5 groundwork) ─────────────────────
// The AI reads from AppContext state (state.products / state.areas)
// once AiScreen registers it, so admin product/area edits flow
// through here too. Falls back to the seed data.
let CATALOGUE: Product[] = PRODUCTS;
let AREA_LIST: DeliveryArea[] = DELIVERY_AREAS;
export function setAiCatalogue(products: Product[], areas: DeliveryArea[]): void {
  if (products.length > 0) CATALOGUE = products;
  if (areas.length > 0) AREA_LIST = areas;
}

// ── Bengali digit / number handling ───────────────────────────
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function bnDigitsToEn(text: string): string {
  return text.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
}

const NUMBER_WORDS: Record<string, number> = {
  'এক': 1, 'দুই': 2, 'দুইটা': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5,
  'ছয়': 6, 'ছয়টা': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'আধা': 0.5, 'half': 0.5,
};

function parseQuantity(segment: string): { qty: number | null; rest: string } {
  const numMatch = segment.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return { qty: parseFloat(numMatch[1]), rest: segment.replace(numMatch[1], ' ') };
  }
  for (const [word, val] of Object.entries(NUMBER_WORDS)) {
    if (segment.includes(word)) {
      return { qty: val, rest: segment.replace(word, ' ') };
    }
  }
  return { qty: null, rest: segment };
}

// ── Product matching ──────────────────────────────────────────
// Generic words a user types → preferred seeded product.
// Exact product names are matched before these aliases.
const ALIASES: { keywords: string[]; productId: string }[] = [
  { keywords: ['মুরগি', 'মোরগ', 'chicken'], productId: 'p-21' },
  { keywords: ['চাল', 'rice'], productId: 'p-01' },
  { keywords: ['ডাল', 'dal', 'lentil'], productId: 'p-03' },
  { keywords: ['তেল', 'oil'], productId: 'p-07' },
  { keywords: ['মাছ', 'fish'], productId: 'p-19' },
  { keywords: ['মাংস', 'meat', 'beef'], productId: 'p-23' },
  { keywords: ['ডিম', 'egg'], productId: 'p-25' },
  { keywords: ['দুধ', 'milk'], productId: 'p-26' },
  { keywords: ['আলু', 'potato'], productId: 'p-13' },
];

const FILLER_WORDS = [
  'দাও', 'দিয়ে', 'দিন', 'নেব', 'নিব', 'নাও', 'চাই', 'যোগ', 'করুন', 'করো', 'করে',
  'আমাকে', 'আমার', 'কার্টে', 'কার্ট', 'বাজারে', 'টা', 'টি', 'খানা', 'একটু',
  'কেজি', 'লিটার', 'পিস', 'হালি', 'প্যাকেট', 'আঁটি', 'গ্রাম', 'কিলো',
  'kg', 'ltr', 'pcs', 'add', 'please', 'give', 'me',
];

function cleanSegment(segment: string): string {
  let s = ` ${segment.toLowerCase()} `;
  for (const w of FILLER_WORDS) s = s.split(` ${w} `).join(' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function scoreProduct(product: Product, rawText: string): number {
  const text = ` ${rawText.toLowerCase()} `;
  const clean = cleanSegment(rawText);
  let score = 0;
  if (rawText.includes(product.nameBn)) score += 100;
  if (text.includes(` ${product.nameEn.toLowerCase()} `) || text.trim().endsWith(product.nameEn.toLowerCase())) score += 100;
  // word-level partial matches on the Bangla name
  for (const word of product.nameBn.split(' ')) {
    if (word.length >= 2 && clean.includes(word)) score += 45;
  }
  for (const word of product.nameEn.toLowerCase().split(' ')) {
    if (word.length >= 3 && clean.includes(word)) score += 45;
  }
  const alias = ALIASES.find(a => a.productId === product.id);
  if (alias && alias.keywords.some(k => clean.includes(k))) score += 90;
  return score;
}

export function matchProducts(text: string, limit = 4, availableOnly = false): Product[] {
  return CATALOGUE
    .map(p => ({ p, score: scoreProduct(p, text) }))
    .filter(({ p, score }) => score >= 45 && (!availableOnly || p.isAvailable))
    .sort((a, b) => b.score - a.score || (b.p.tags?.includes('popular') ? 1 : 0) - (a.p.tags?.includes('popular') ? 1 : 0))
    .slice(0, limit)
    .map(({ p }) => p);
}

function bestProduct(text: string): Product | null {
  const matches = matchProducts(text, 1);
  return matches[0] ?? null;
}

// ── Shopping-list parsing (D1a) ───────────────────────────────
export interface ParsedLine {
  product: Product;
  qty: number;
}

export function parseShoppingList(rawText: string): { lines: ParsedLine[]; unmatched: string[] } {
  const text = bnDigitsToEn(rawText);
  const segments = text.split(/আর|,|এবং|\+|\band\b/i).map(s => s.trim()).filter(Boolean);
  const lines: ParsedLine[] = [];
  const unmatched: string[] = [];

  for (const segment of segments) {
    const { qty, rest } = parseQuantity(segment);
    const product = bestProduct(rest);
    if (product && product.isAvailable) {
      const existing = lines.find(l => l.product.id === product.id);
      const amount = qty ?? 1;
      if (existing) existing.qty += amount;
      else lines.push({ product, qty: amount });
    } else if (segment.replace(/[\s।.]/g, '').length >= 2) {
      unmatched.push(segment);
    }
  }
  return { lines, unmatched };
}

// ── Budget bundle (D3) ────────────────────────────────────────
export interface BudgetBundle {
  budget: number;
  items: ParsedLine[];
  total: number;
}

export function buildBudgetBundle(budget: number): BudgetBundle {
  const available = CATALOGUE.filter(p => p.isAvailable);
  // Popular first, then cheaper first — greedy fill, 1 unit each.
  const ordered = [...available].sort((a, b) => {
    const ap = a.tags?.includes('popular') ? 0 : 1;
    const bp = b.tags?.includes('popular') ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.approxPrice - b.approxPrice;
  });
  const items: ParsedLine[] = [];
  let total = 0;
  for (const product of ordered) {
    if (total + product.approxPrice <= budget) {
      items.push({ product, qty: 1 });
      total += product.approxPrice;
    }
  }
  return { budget, items, total };
}

// ── Add-on suggestions (D1c) — seeded catalogue only ─────────
const ADDON_PAIRS: Record<string, string[]> = {
  'rice-pulses': ['p-07', 'p-09'],   // চাল/ডালের সাথে তেল, পেঁয়াজ
  'oil-spices': ['p-03'],
  'vegetables': ['p-10'],
  'fish-meat': ['p-18', 'p-11'],    // মাছ/মাংসের সাথে ধনেপাতা, আদা
  'milk-eggs': ['p-29'],
  'snacks': ['p-26'],
};

export function getAddonSuggestions(cartProductIds: string[], limit = 3): Product[] {
  const inCart = new Set(cartProductIds);
  const suggestions: Product[] = [];
  for (const id of cartProductIds) {
    const product = CATALOGUE.find(p => p.id === id);
    if (!product) continue;
    for (const addonId of ADDON_PAIRS[product.category] ?? []) {
      const addon = CATALOGUE.find(p => p.id === addonId);
      if (addon && addon.isAvailable && !inCart.has(addon.id) && !suggestions.find(s => s.id === addon.id)) {
        suggestions.push(addon);
      }
    }
  }
  // Top up with popular available items not in the cart
  if (suggestions.length < limit) {
    for (const p of CATALOGUE) {
      if (suggestions.length >= limit) break;
      if (p.isAvailable && p.tags?.includes('popular') && !inCart.has(p.id) && !suggestions.find(s => s.id === p.id)) {
        suggestions.push(p);
      }
    }
  }
  return suggestions.slice(0, limit);
}

// ── Reorder from history (D1c) ────────────────────────────────
export function getReorderLines(orders: Order[]): ParsedLine[] {
  // Prefer a delivered order that has bazaar items; otherwise the most
  // recent order with bazaar items (restaurant items cannot be re-added
  // to the bazaar cart).
  const withBazaar = orders.filter(o => o.items.some(i => i.source === 'bazaar'));
  const past = withBazaar.find(o => o.status === 'delivered') ?? withBazaar[0];
  if (!past) return [];
  const lines: ParsedLine[] = [];
  for (const item of past.items) {
    if (item.source !== 'bazaar') continue;
    const product = CATALOGUE.find(p => p.nameBn === item.nameBn) ?? bestProduct(item.nameBn);
    if (product && product.isAvailable && !lines.find(l => l.product.id === product.id)) {
      lines.push({ product, qty: item.quantity });
    }
  }
  return lines;
}

// ── Main responder ────────────────────────────────────────────
export interface AiReply {
  messageBn: string;
  messageEn: string;
  added: ParsedLine[];
  bundle?: BudgetBundle;
  suggestions: string[];
}

const DEFAULT_SUGGESTIONS = [
  '৫ কেজি চাল আর ১ লিটার তেল দাও',
  'চালের দাম কত?',
  '৫০০ টাকার বাজেট বান্ডল বানাও',
  'আগের অর্ডারটা আবার দাও',
];

function priceLineBn(p: Product): string {
  return `${p.imageEmoji ?? ''} ${p.nameBn} — আনুমানিক ৳${p.approxPrice}/${p.unit}`;
}
function priceLineEn(p: Product): string {
  return `${p.imageEmoji ?? ''} ${p.nameEn} — approx ৳${p.approxPrice}/${p.unitEn}`;
}

export function respondToMessage(
  rawText: string,
  ctx: { orders: Order[]; cartProductIds: string[] },
): AiReply {
  const text = bnDigitsToEn(rawText);
  const lower = text.toLowerCase();
  const none: ParsedLine[] = [];

  // Budget bundle request
  const budgetMatch = text.match(/(\d{3,6})/);
  if ((text.includes('বাজেট') || lower.includes('budget') || text.includes('বান্ডল') || lower.includes('bundle')) && budgetMatch) {
    const budget = parseInt(budgetMatch[1], 10);
    const bundle = buildBudgetBundle(budget);
    if (bundle.items.length > 0) {
      return {
        messageBn: `৳${budget} বাজেটে এই বান্ডলটা সাজালাম (মোট আনুমানিক ৳${bundle.total}):\n${bundle.items.map(l => priceLineBn(l.product)).join('\n')}`,
        messageEn: `Here is a bundle within ৳${budget} (approx total ৳${bundle.total}):\n${bundle.items.map(l => priceLineEn(l.product)).join('\n')}`,
        added: none,
        bundle,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
  }

  // Reorder request
  if (text.includes('আগের অর্ডার') || text.includes('আবার দাও') || lower.includes('reorder') || lower.includes('order again')) {
    const lines = getReorderLines(ctx.orders);
    if (lines.length > 0) {
      const total = lines.reduce((s, l) => s + l.product.approxPrice * l.qty, 0);
      return {
        messageBn: `আগের অর্ডারের এই জিনিসগুলো কার্টে যোগ করলাম (মোট আনুমানিক ৳${total}):\n${lines.map(l => `${l.product.nameBn} × ${l.qty} ${l.product.unit}`).join('\n')}`,
        messageEn: `Re-added your previous items to the cart (approx total ৳${total}):\n${lines.map(l => `${l.product.nameEn} × ${l.qty} ${l.product.unitEn}`).join('\n')}`,
        added: lines,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
    return {
      messageBn: 'আপনার আগের কোনো অর্ডার খুঁজে পাইনি। বাজারের লিস্ট লিখে দিলে কার্টে যোগ করে দেবো।',
      messageEn: 'I could not find a previous order. Write a shopping list and I will add it to your cart.',
      added: none,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  // Delivery area / fee question — only seeded area data
  if (text.includes('এলাকা') || text.includes('ডেলিভারি ফি') || lower.includes('delivery') || lower.includes('area')) {
    const areaHit = AREA_LIST.find(a => text.includes(a.nameBn) || lower.includes(a.nameEn.toLowerCase()));
    if (areaHit) {
      return {
        messageBn: `হ্যাঁ, ${areaHit.nameBn} এলাকায় ডেলিভারি আছে। ডেলিভারি ফি ৳${areaHit.fee}।`,
        messageEn: `Yes, we deliver to ${areaHit.nameEn}. The delivery fee is ৳${areaHit.fee}.`,
        added: none,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
    const townFees = AREA_LIST.filter(a => a.zone === 'town').map(a => a.fee);
    const unionFees = AREA_LIST.filter(a => a.zone === 'union').map(a => a.fee);
    return {
      messageBn: `আমরা লালমনিরহাট সদরের মোট ${AREA_LIST.length}টি এলাকায় ডেলিভারি দিই। শহরে ফি ৳${Math.min(...townFees)}–${Math.max(...townFees)}, ইউনিয়নে ৳${Math.min(...unionFees)}–${Math.max(...unionFees)}। সব এলাকার তালিকা প্রোফাইলের "ডেলিভারি ফি তালিকা" পেজে আছে।`,
      messageEn: `We deliver to ${AREA_LIST.length} areas in Lalmonirhat Sadar. Town fees are ৳${Math.min(...townFees)}–${Math.max(...townFees)}, union fees ৳${Math.min(...unionFees)}–${Math.max(...unionFees)}. See the full list on the Delivery Fee Table page in Profile.`,
      added: none,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  // Price question — seeded approx prices only
  if (text.includes('দাম') || lower.includes('price') || text.includes('কত করে') || text.includes('কত টাকা')) {
    const matches = matchProducts(text, 4);
    if (matches.length > 0) {
      return {
        messageBn: `বাজারের আনুমানিক দাম:\n${matches.map(priceLineBn).join('\n')}\n(দাম আনুমানিক — কেনার সময়ের বাজারদর অনুযায়ী সামান্য কম-বেশি হতে পারে।)`,
        messageEn: `Approx bazaar prices:\n${matches.map(priceLineEn).join('\n')}\n(Prices are approximate and may vary slightly at buying time.)`,
        added: none,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
  }

  // Availability question
  if (text.includes('আছে কি') || text.includes('পাওয়া যাবে') || lower.includes('available')) {
    const product = bestProduct(text);
    if (product) {
      return {
        messageBn: product.isAvailable
          ? `হ্যাঁ, ${product.nameBn} এখন বাজারে পাওয়া যাচ্ছে (আনুমানিক ৳${product.approxPrice}/${product.unit})।`
          : `দুঃখিত, ${product.nameBn} এই মুহূর্তে পাওয়া যাচ্ছে না।`,
        messageEn: product.isAvailable
          ? `Yes, ${product.nameEn} is available now (approx ৳${product.approxPrice}/${product.unitEn}).`
          : `Sorry, ${product.nameEn} is not available right now.`,
        added: none,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
  }

  // Shopping list → add to cart
  const looksLikeList = /দাও|যোগ|নেব|নিব|চাই|add/i.test(text) || /\d/.test(text) || Object.keys(NUMBER_WORDS).some(w => text.includes(w));
  if (looksLikeList) {
    const { lines, unmatched } = parseShoppingList(rawText);
    if (lines.length > 0) {
      const total = lines.reduce((s, l) => s + l.product.approxPrice * l.qty, 0);
      const addons = getAddonSuggestions([...ctx.cartProductIds, ...lines.map(l => l.product.id)], 2);
      let bn = `কার্টে যোগ করেছি (মোট আনুমানিক ৳${total}):\n${lines.map(l => `• ${l.product.nameBn} — ${l.qty} ${l.product.unit} × ৳${l.product.approxPrice} = ৳${l.product.approxPrice * l.qty}`).join('\n')}`;
      let en = `Added to your cart (approx total ৳${total}):\n${lines.map(l => `• ${l.product.nameEn} — ${l.qty} ${l.product.unitEn} × ৳${l.product.approxPrice} = ৳${l.product.approxPrice * l.qty}`).join('\n')}`;
      if (addons.length > 0) {
        bn += `\n\nসাথে এগুলোও লাগতে পারে: ${addons.map(a => `${a.nameBn} (৳${a.approxPrice})`).join(', ')} — নাম লিখলেই যোগ করে দেবো।`;
        en += `\n\nYou might also need: ${addons.map(a => `${a.nameEn} (৳${a.approxPrice})`).join(', ')} — just type the name and I will add it.`;
      }
      if (unmatched.length > 0) {
        bn += `\n\n"${unmatched.join('", "')}" — এটা আমাদের তালিকায় খুঁজে পাইনি, তাই যোগ করিনি। বাজার পেজে দেখে নিন।`;
        en += `\n\nI could not find "${unmatched.join('", "')}" in our catalogue, so I did not add it. Please check the Bazaar page.`;
      }
      return { messageBn: bn, messageEn: en, added: lines, suggestions: DEFAULT_SUGGESTIONS };
    }
    if (unmatched.length > 0) {
      return {
        messageBn: `"${unmatched.join('", "')}" আমাদের বাজারের তালিকায় খুঁজে পাইনি। চাল, ডাল, তেল, সবজি, মাছ-মাংস, দুধ-ডিম — এগুলো থেকে লিখে দেখুন।`,
        messageEn: `I could not find that in our bazaar list. Try items like rice, lentils, oil, vegetables, fish, meat, milk or eggs.`,
        added: none,
        suggestions: DEFAULT_SUGGESTIONS,
      };
    }
  }

  // Greeting
  if (text.includes('আসসালামু') || text.includes('হ্যালো') || text.includes('হাই') || lower.includes('hello') || lower.includes('hi')) {
    return {
      messageBn: 'আসসালামু আলাইকুম! আমি জোভ্রোর সহায়ক। বাজারের লিস্ট লিখে দিলে কার্টে যোগ করে দেবো, যেকোনো পণ্যের আনুমানিক দামও জানাতে পারবো — সবই আমাদের বাজারের তালিকা থেকে।',
      messageEn: 'Hello! I am the Jovro assistant. Write your bazaar list and I will add it to your cart, or ask me the approx price of any product — everything comes from our seeded catalogue.',
      added: none,
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  // Honest fallback — no invented answers
  return {
    messageBn: 'এটা আমি আমাদের বাজারের তালিকা থেকে বলতে পারছি না। আমি যা পারি: (১) লিস্ট লিখে দিলে কার্টে যোগ করা, (২) তালিকার পণ্যের আনুমানিক দাম বলা, (৩) বাজেট অনুযায়ী বান্ডল সাজানো, (৪) এলাকার ডেলিভারি ফি বলা। নিচের একটা বেছে লিখে দেখুন।',
    messageEn: 'I cannot answer that from our bazaar list. I can: (1) add a written list to your cart, (2) quote approx prices from the catalogue, (3) build a budget bundle, (4) tell you an area\'s delivery fee. Try one of the suggestions below.',
    added: none,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export function getDefaultSuggestions(): string[] {
  return DEFAULT_SUGGESTIONS;
}

/** Simulated thinking delay for the typing indicator (D2). */
export function aiThinkingDelay(): Promise<void> {
  return new Promise(res => setTimeout(res, 900 + Math.random() * 700));
}
