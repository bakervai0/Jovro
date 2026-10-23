import type { Product, ProductCategory } from '../types';

// ============================================================
// Bazaar catalogue — seeded from the Jovro design screens.
// Prices are APPROXIMATE bazaar prices (আনুমানিক দাম); the final
// amount is settled from the bazaar receipt. Never a markup.
// ============================================================

const ricePacks = [
  { id: 'ps-500', labelBn: '৫০০ গ্রাম', labelEn: '500 g', price: 38 },
  { id: 'ps-1kg', labelBn: '১ কেজি', labelEn: '1 kg', price: 75, isDefault: true },
  { id: 'ps-5kg', labelBn: '৫ কেজি বস্তা', labelEn: '5 kg sack', price: 365 },
];

export const PRODUCTS: Product[] = [
  // ── চাল-ডাল · Rice & Pulses ──────────────────────────────
  {
    id: 'p-01', nameBn: 'মিনিকেট চাল (১ম শ্রেণী)', nameEn: 'Miniket Rice (Grade 1)',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 75, isAvailable: true,
    image: '/img/rice.jpg', imageEmoji: '🌾', gradeBn: '১ম শ্রেণী', gradeEn: 'Grade 1',
    marketBn: 'গোশালা বাজার • চালের আড়ত', marketEn: 'Goshala Bazar • Rice wholesale',
    qualityBn: 'চিকন, সুগন্ধি ও পরিষ্কার ঝরঝরে ভাত', qualityEn: 'Fine, fragrant and clean-cooking rice',
    isPopular: true, isFlashSale: true, flashDiscount: 5, packSizes: ricePacks,
    searchTags: ['chal', 'rice', 'miniket', 'চাল', 'মিনিকেট'],
    tags: ['popular', 'flash'],
  },
  {
    id: 'p-02', nameBn: 'নাজিরশাইল চাল (প্রিমিয়াম)', nameEn: 'Najirshail Rice Premium',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 78, isAvailable: true,
    image: '/img/rice.jpg', imageEmoji: '🌾', gradeBn: 'প্রিমিয়াম', gradeEn: 'Premium',
    marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    qualityBn: 'লম্বা দানার সুগন্ধি চাল', qualityEn: 'Long grain aromatic rice',
    isPopular: true, searchTags: ['najirshail', 'najir', 'rice', 'chal'],
    tags: ['popular'],
  },
  {
    id: 'p-03', nameBn: 'চিনিগুঁড়া পোলাও চাল', nameEn: 'Chinigura Polao Rice',
    category: 'rice-pulses', unit: '৫০০ গ্রাম', unitEn: '500 g', approxPrice: 65, isAvailable: true,
    image: '/img/rice.jpg', imageEmoji: '🍚',
    marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    qualityBn: 'পোলাও ও বিরিয়ানির জন্য সেরা', qualityEn: 'Best for polao and biryani',
    searchTags: ['chinigura', 'polao', 'polaw', 'rice'],
  },
  {
    id: 'p-04', nameBn: 'দেশি মসুর ডাল', nameEn: 'Deshi Red Lentils (Small Grain)',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 135, isAvailable: true,
    image: '/img/lentils.jpg', imageEmoji: '🫘', gradeBn: 'দেশি জাত', gradeEn: 'Deshi',
    marketBn: 'সরাসরি গোশালা পাইকারি আড়ত', marketEn: 'Direct Goshala wholesale',
    qualityBn: 'ছোট দানা, দ্রুত সিদ্ধ হয়', qualityEn: 'Small grain, cooks quickly',
    isPopular: true, packSizes: [
      { id: 'ps-500', labelBn: '৫০০ গ্রাম', labelEn: '500 g', price: 68 },
      { id: 'ps-1kg', labelBn: '১ কেজি', labelEn: '1 kg', price: 135, isDefault: true },
    ],
    searchTags: ['dal', 'daal', 'lentil', 'masur', 'ডাল'],
    tags: ['popular'],
  },
  {
    id: 'p-05', nameBn: 'মুগ ডাল', nameEn: 'Mung Dal',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 140, isAvailable: true,
    imageEmoji: '🫘', marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    searchTags: ['mug', 'moog', 'dal', 'lentil'],
  },
  {
    id: 'p-06', nameBn: 'ছোলার ডাল', nameEn: 'Chola Dal',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 110, isAvailable: true,
    imageEmoji: '🫘', marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    searchTags: ['chola', 'cholar', 'dal'],
  },
  {
    id: 'p-07', nameBn: 'বিআর-২৮ চাল', nameEn: 'BR-28 Rice',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 58, isAvailable: true,
    imageEmoji: '🌾', marketBn: 'গোশালা বাজার • চালের আড়ত', marketEn: 'Goshala Bazar • Rice wholesale',
    searchTags: ['br28', 'br 28', 'chal', 'rice'],
  },
  {
    id: 'p-08', nameBn: 'কাবুলি চানা', nameEn: 'Kabuli Chickpeas',
    category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 150, isAvailable: true,
    imageEmoji: '🫛', marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    searchTags: ['chana', 'chickpea', 'kabuli'],
  },

  // ── তেল-মসলা · Oil & Spices ──────────────────────────────
  {
    id: 'p-09', nameBn: 'তীর সয়াবিন তেল', nameEn: 'Teer Fortified Soybean Oil',
    category: 'oil-spices', unit: '১ লিটার', unitEn: '1 L', approxPrice: 166, isAvailable: true,
    image: '/img/oil.jpg', imageEmoji: '🫙', gradeBn: 'সিল প্যাক', gradeEn: 'Sealed pack',
    marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    qualityBn: 'গভর্নমেন্ট রেগুলেটেড এমআরপি', qualityEn: 'Government regulated MRP',
    isPopular: true, isFlashSale: true, flashDiscount: 3,
    searchTags: ['tel', 'oil', 'soybean', 'teer', 'সয়াবিন'],
    tags: ['popular', 'flash'],
  },
  {
    id: 'p-10', nameBn: 'সয়াবিন তেল (১ লিটার পেট বোতল)', nameEn: 'Soybean Oil (1 L Pet Bottle)',
    category: 'oil-spices', unit: 'লিটার', unitEn: 'ltr', approxPrice: 168, isAvailable: true,
    image: '/img/oil.jpg', imageEmoji: '🫙', isPopular: true,
    marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    searchTags: ['soyabin', 'tel', 'oil', 'bottle'],
  },
  {
    id: 'p-11', nameBn: 'সরিষার তেল', nameEn: 'Mustard Oil',
    category: 'oil-spices', unit: 'লিটার', unitEn: 'ltr', approxPrice: 220, isAvailable: true,
    imageEmoji: '🫙', marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    qualityBn: 'ঘানি ভাঙা খাঁটি সরিষার তেল', qualityEn: 'Pure cold-pressed mustard oil',
    searchTags: ['sorisar', 'mustard', 'tel', 'oil'],
  },
  {
    id: 'p-12', nameBn: 'দেশি পেঁয়াজ', nameEn: 'Local Deshi Onion',
    category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 55, isAvailable: true,
    image: '/img/onion.jpg', imageEmoji: '🧅', isPopular: true, isFlashSale: true, flashDiscount: 8,
    marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['peyaj', 'piyaj', 'onion', 'পেঁয়াজ'],
    tags: ['popular', 'flash'],
  },
  {
    id: 'p-13', nameBn: 'রসুন', nameEn: 'Garlic',
    category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 185, isAvailable: true,
    imageEmoji: '🧄', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['rosun', 'garlic'],
  },
  {
    id: 'p-14', nameBn: 'আদা', nameEn: 'Ginger',
    category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 160, isAvailable: true,
    imageEmoji: '🫚', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['ada', 'ginger'],
  },
  {
    id: 'p-15', nameBn: 'হলুদ গুঁড়া', nameEn: 'Turmeric Powder',
    category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 240, isAvailable: true,
    imageEmoji: '🌿', marketBn: 'গোশালা বাজার • মসলার দোকান', marketEn: 'Goshala Bazar • Spice shop',
    searchTags: ['holud', 'turmeric', 'masala'],
  },
  {
    id: 'p-16', nameBn: 'মরিচ গুঁড়া', nameEn: 'Chilli Powder',
    category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 260, isAvailable: true,
    imageEmoji: '🌶️', marketBn: 'গোশালা বাজার • মসলার দোকান', marketEn: 'Goshala Bazar • Spice shop',
    searchTags: ['morich', 'chilli', 'masala'],
  },

  // ── সবজি · Vegetables ────────────────────────────────────
  {
    id: 'p-17', nameBn: 'লাল আলু', nameEn: 'Red Potato',
    category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 45, isAvailable: true,
    image: '/img/potato.jpg', imageEmoji: '🥔', isPopular: true, isFlashSale: true, flashDiscount: 10,
    marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    qualityBn: 'নতুন আলু, হালকা খোসা', qualityEn: 'New season potato',
    searchTags: ['alu', 'potato', 'আলু'],
    tags: ['popular', 'flash'],
  },
  {
    id: 'p-18', nameBn: 'টমেটো', nameEn: 'Tomato',
    category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 60, isAvailable: true,
    imageEmoji: '🍅', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['tomato', 'tometo'],
  },
  {
    id: 'p-19', nameBn: 'বেগুন', nameEn: 'Eggplant',
    category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 50, isAvailable: true,
    imageEmoji: '🍆', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['begun', 'brinjal', 'eggplant'],
  },
  {
    id: 'p-20', nameBn: 'লাউ', nameEn: 'Bottle Gourd',
    category: 'vegetables', unit: 'পিস', unitEn: 'piece', approxPrice: 40, isAvailable: true,
    imageEmoji: '🥬', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['lau', 'gourd'],
  },
  {
    id: 'p-21', nameBn: 'ঢেঁড়স', nameEn: 'Okra (Lady Finger)',
    category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 40, isAvailable: true,
    imageEmoji: '🥒', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['dherosh', 'okra', 'ladyfinger'],
  },
  {
    id: 'p-22', nameBn: 'করলা', nameEn: 'Bitter Gourd',
    category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 65, isAvailable: true,
    imageEmoji: '🥒', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['korola', 'bittergourd'],
  },
  {
    id: 'p-23', nameBn: 'ধনেপাতা', nameEn: 'Coriander Leaf',
    category: 'vegetables', unit: 'আঁটি', unitEn: 'bunch', approxPrice: 15, isAvailable: true,
    imageEmoji: '🌿', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['dhone', 'coriander', 'pata'],
  },
  {
    id: 'p-24', nameBn: 'টাটকা পাতি লেবু', nameEn: 'Fresh Pati Lemon',
    category: 'vegetables', unit: '৪ পিস', unitEn: '4 pcs', approxPrice: 20, isAvailable: true,
    imageEmoji: '🍋', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    qualityBn: 'রসালো ও তাজা', qualityEn: 'Juicy and fresh',
    searchTags: ['lebu', 'lemon', 'loboo'],
  },
  {
    id: 'p-25', nameBn: 'কাঁচা মরিচ', nameEn: 'Green Chilli',
    category: 'vegetables', unit: '১০০ গ্রাম', unitEn: '100 g', approxPrice: 15, isAvailable: true,
    imageEmoji: '🌶️', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala vegetable market',
    searchTags: ['morich', 'chilli', 'kacha'],
  },

  // ── মাছ-মাংস · Fish & Meat ───────────────────────────────
  {
    id: 'p-26', nameBn: 'রুই মাছ', nameEn: 'Rui Fish',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 280, isAvailable: true,
    imageEmoji: '🐟', marketBn: 'গোশালা মাছ বাজার', marketEn: 'Goshala fish market',
    qualityBn: 'পুকুরের তাজা রুই, কাটা হবে', qualityEn: 'Fresh pond rui, cleaned on request',
    isPopular: true, searchTags: ['rui', 'fish', 'mach'],
    tags: ['popular'],
  },
  {
    id: 'p-27', nameBn: 'কাতলা মাছ', nameEn: 'Katla Fish',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 320, isAvailable: true,
    imageEmoji: '🐟', marketBn: 'গোশালা মাছ বাজার', marketEn: 'Goshala fish market',
    searchTags: ['katla', 'fish', 'mach'],
  },
  {
    id: 'p-28', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler Chicken',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 190, isAvailable: true,
    image: '/img/chicken.jpg', imageEmoji: '🍗', isPopular: true,
    marketBn: 'গোশালা কাঁচাবাজার • মুরগির দোকান', marketEn: 'Goshala Bazar • Poultry shop',
    qualityBn: 'প্রতিদিন সকালের তাজা চালান', qualityEn: 'Fresh morning stock daily',
    searchTags: ['murgi', 'chicken', 'broiler'],
    tags: ['popular'],
  },
  {
    id: 'p-29', nameBn: 'দেশি মুরগি', nameEn: 'Country Chicken',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 520, isAvailable: true,
    imageEmoji: '🐓', marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala Bazar',
    searchTags: ['deshi murgi', 'country chicken'],
  },
  {
    id: 'p-30', nameBn: 'গরুর মাংস', nameEn: 'Beef',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 750, isAvailable: true,
    imageEmoji: '🥩', marketBn: 'গোশালা মাংসের বাজার', marketEn: 'Goshala meat market',
    qualityBn: 'হালাল, ফ্রেশ কাটা', qualityEn: 'Halal, freshly cut',
    searchTags: ['gorur mangsho', 'beef', 'mangsho'],
  },
  {
    id: 'p-31', nameBn: 'তেলাপিয়া মাছ', nameEn: 'Tilapia Fish',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 170, isAvailable: true,
    imageEmoji: '🐠', marketBn: 'গোশালা মাছ বাজার', marketEn: 'Goshala fish market',
    searchTags: ['tilapia', 'mach', 'fish'],
  },
  {
    id: 'p-32', nameBn: 'চিংড়ি মাছ', nameEn: 'Prawn (Chingri)',
    category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 850, isAvailable: false,
    imageEmoji: '🦐', marketBn: 'গোশালা মাছ বাজার', marketEn: 'Goshala fish market',
    stockNoteBn: 'আজকের বাজারে পাওয়া যাচ্ছে না', stockNoteEn: 'Not available in the bazaar today',
    searchTags: ['chingri', 'prawn', 'shrimp'],
  },

  // ── দুধ-ডিম · Milk & Eggs ────────────────────────────────
  {
    id: 'p-33', nameBn: 'ফার্মের লাল ডিম', nameEn: 'Farm Fresh Brown Eggs',
    category: 'milk-eggs', unit: 'ডজন', unitEn: 'dozen', approxPrice: 145, isAvailable: true,
    image: '/img/eggs.jpg', imageEmoji: '🥚', isPopular: true, isFlashSale: true, flashDiscount: 4,
    marketBn: 'গোশালা কাঁচাবাজার', marketEn: 'Goshala Bazar',
    qualityBn: 'প্রতিদিন সকালের তাজা চালান', qualityEn: 'Fresh stock every morning',
    packSizes: [
      { id: 'ps-hali', labelBn: '১ হালি (৪ পিস)', labelEn: '4 pcs', price: 50 },
      { id: 'ps-dozen', labelBn: '১ ডজন (১২ পিস)', labelEn: '1 dozen', price: 145, isDefault: true },
    ],
    searchTags: ['dim', 'egg', 'anda', 'ডিম'],
    tags: ['popular', 'flash'],
  },
  {
    id: 'p-34', nameBn: 'গরুর দুধ', nameEn: 'Cow Milk',
    category: 'milk-eggs', unit: 'লিটার', unitEn: 'ltr', approxPrice: 80, isAvailable: true,
    imageEmoji: '🥛', marketBn: 'গোশালা বাজার • Dairy', marketEn: 'Goshala Bazar • Dairy',
    searchTags: ['dudh', 'milk', 'gorur'],
  },
  {
    id: 'p-35', nameBn: 'প্যাকেট দুধ (১ লিটার)', nameEn: 'Packed Milk (1 L)',
    category: 'milk-eggs', unit: 'লিটার', unitEn: 'ltr', approxPrice: 100, isAvailable: true,
    imageEmoji: '📦', marketBn: 'গোশালা বাজার', marketEn: 'Goshala Bazar',
    searchTags: ['packet dudh', 'milk', 'pasteurized'],
  },
  {
    id: 'p-36', nameBn: 'ছানা (কottage চিজ)', nameEn: 'Chhana (Cottage Cheese)',
    category: 'milk-eggs', unit: 'কেজি', unitEn: 'kg', approxPrice: 260, isAvailable: true,
    imageEmoji: '🧀', marketBn: 'গোশালা বাজার • Dairy', marketEn: 'Goshala Bazar • Dairy',
    searchTags: ['chana', 'chhana', 'cheese', 'ছানা'],
  },
  {
    id: 'p-37', nameBn: 'দই (৫০০ গ্রাম)', nameEn: 'Sweet Yogurt (500 g)',
    category: 'milk-eggs', unit: '৫০০ গ্রাম', unitEn: '500 g', approxPrice: 120, isAvailable: true,
    imageEmoji: '🍮', marketBn: 'বনলতা সুইট', marketEn: 'Bonolota Sweets',
    searchTags: ['doi', 'yogurt', 'mishti'],
  },

  // ── নাস্তা · Snacks ──────────────────────────────────────
  {
    id: 'p-38', nameBn: 'চিড়া', nameEn: 'Flattened Rice (Chira)',
    category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 65, isAvailable: true,
    imageEmoji: '🌾', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['chira', 'flattened rice', 'chidha'],
  },
  {
    id: 'p-39', nameBn: 'মুড়ি', nameEn: 'Puffed Rice (Muri)',
    category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 55, isAvailable: true,
    imageEmoji: '🍿', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['muri', 'puffed rice', 'mudi'],
  },
  {
    id: 'p-40', nameBn: 'চানাচুর', nameEn: 'Chanachur',
    category: 'snacks', unit: 'প্যাকেট', unitEn: 'packet', approxPrice: 30, isAvailable: true,
    imageEmoji: '🍿', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['chanachur', 'snacks', 'chanachur'],
  },
  {
    id: 'p-41', nameBn: 'বিস্কুট (লাক্স)', nameEn: 'Biscuit (Lux)',
    category: 'snacks', unit: 'প্যাকেট', unitEn: 'packet', approxPrice: 35, isAvailable: true,
    imageEmoji: '🍪', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['biscuit', 'biskut', 'lux'],
  },
  {
    id: 'p-42', nameBn: 'চিনি', nameEn: 'Sugar',
    category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 135, isAvailable: true,
    imageEmoji: '🧂', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['chini', 'sugar'],
  },
  {
    id: 'p-43', nameBn: 'লবণ', nameEn: 'Salt',
    category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 40, isAvailable: true,
    imageEmoji: '🧂', marketBn: 'গোশালা বাজার • মুদি দোকান', marketEn: 'Goshala Bazar • Grocery',
    searchTags: ['lobon', 'salt', 'noon'],
  },
];

export const CATEGORY_INFO: Record<ProductCategory, { nameBn: string; nameEn: string; emoji: string; icon: string; tint: string }> = {
  'rice-pulses': { nameBn: 'চাল-ডাল', nameEn: 'Rice & Pulses', emoji: '🌾', icon: 'grain', tint: 'bg-[#EAF6EE] text-[#1D9D57]' },
  'oil-spices': { nameBn: 'তেল-মসলা', nameEn: 'Oil & Spices', emoji: '🫙', icon: 'oil_barrel', tint: 'bg-[#FDF1EA] text-[#C2410C]' },
  'vegetables': { nameBn: 'সবজি', nameEn: 'Vegetables', emoji: '🥬', icon: 'nutrition', tint: 'bg-[#EAF6EE] text-[#1D9D57]' },
  'fish-meat': { nameBn: 'মাছ-মাংস', nameEn: 'Fish & Meat', emoji: '🐟', icon: 'set_meal', tint: 'bg-[#EAF3FB] text-[#0B6E99]' },
  'milk-eggs': { nameBn: 'দুধ-ডিম', nameEn: 'Milk & Eggs', emoji: '🥚', icon: 'egg_alt', tint: 'bg-[#FDF1EA] text-[#C2410C]' },
  'snacks': { nameBn: 'নাস্তা', nameEn: 'Snacks', emoji: '🍿', icon: 'cookie', tint: 'bg-[#EAF6EE] text-[#1D9D57]' },
};

export const CATEGORY_ORDER: ProductCategory[] = ['rice-pulses', 'oil-spices', 'vegetables', 'fish-meat', 'milk-eggs', 'snacks'];

export const POPULAR_SEARCHES = ['পোলাও চাল', 'সোনালী মুরগি', 'কাচ্চি বিরিয়ানি', 'সয়াবিন তেল'];

export const CUSTOM_REQUEST_HINT = 'যেমন: ৫ কেজি মিনিকেট চাল, ১ কেজি দেশি আলু, ২টা';
