import type { Product } from '../types';

export const PRODUCTS: Product[] = [
  // চাল-ডাল (Rice & Pulses)
  { id: 'p-01', nameBn: 'মিনিকেট চাল', nameEn: 'Miniket Rice', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 68, isAvailable: true, imageEmoji: '🌾', tags: ['popular'] },
  { id: 'p-02', nameBn: 'বিআর-২৮ চাল', nameEn: 'BR-28 Rice', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 55, isAvailable: true, imageEmoji: '🌾' },
  { id: 'p-03', nameBn: 'মসুর ডাল', nameEn: 'Red Lentil', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 110, isAvailable: true, imageEmoji: '🫘', tags: ['popular'] },
  { id: 'p-04', nameBn: 'মুগ ডাল', nameEn: 'Mung Dal', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 130, isAvailable: true, imageEmoji: '🫘' },
  { id: 'p-05', nameBn: 'ছোলার ডাল', nameEn: 'Chola Dal', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 95, isAvailable: true, imageEmoji: '🫘' },
  { id: 'p-06', nameBn: 'নাজিরশাইল চাল', nameEn: 'Najirshail Rice', category: 'rice-pulses', unit: 'কেজি', unitEn: 'kg', approxPrice: 75, isAvailable: true, imageEmoji: '🌾' },

  // তেল-মসলা (Oil & Spices)
  { id: 'p-07', nameBn: 'সয়াবিন তেল', nameEn: 'Soybean Oil', category: 'oil-spices', unit: 'লিটার', unitEn: 'ltr', approxPrice: 170, isAvailable: true, imageEmoji: '🫙', tags: ['popular'] },
  { id: 'p-08', nameBn: 'সরিষার তেল', nameEn: 'Mustard Oil', category: 'oil-spices', unit: 'লিটার', unitEn: 'ltr', approxPrice: 200, isAvailable: true, imageEmoji: '🫙' },
  { id: 'p-09', nameBn: 'পেঁয়াজ', nameEn: 'Onion', category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 60, isAvailable: true, imageEmoji: '🧅', tags: ['popular'] },
  { id: 'p-10', nameBn: 'রসুন', nameEn: 'Garlic', category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 180, isAvailable: true, imageEmoji: '🧄' },
  { id: 'p-11', nameBn: 'আদা', nameEn: 'Ginger', category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 140, isAvailable: true, imageEmoji: '🫚' },
  { id: 'p-12', nameBn: 'হলুদ গুঁড়া', nameEn: 'Turmeric Powder', category: 'oil-spices', unit: 'কেজি', unitEn: 'kg', approxPrice: 220, isAvailable: true, imageEmoji: '🌿' },

  // সবজি (Vegetables)
  { id: 'p-13', nameBn: 'আলু', nameEn: 'Potato', category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 35, isAvailable: true, imageEmoji: '🥔', tags: ['popular'] },
  { id: 'p-14', nameBn: 'টমেটো', nameEn: 'Tomato', category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 60, isAvailable: true, imageEmoji: '🍅' },
  { id: 'p-15', nameBn: 'লাউ', nameEn: 'Bottle Gourd', category: 'vegetables', unit: 'পিস', unitEn: 'pcs', approxPrice: 40, isAvailable: true, imageEmoji: '🥬' },
  { id: 'p-16', nameBn: 'বেগুন', nameEn: 'Eggplant', category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 50, isAvailable: true, imageEmoji: '🍆' },
  { id: 'p-17', nameBn: 'করলা', nameEn: 'Bitter Gourd', category: 'vegetables', unit: 'কেজি', unitEn: 'kg', approxPrice: 60, isAvailable: true, imageEmoji: '🥒' },
  { id: 'p-18', nameBn: 'ধনেপাতা', nameEn: 'Coriander Leaf', category: 'vegetables', unit: 'আঁটি', unitEn: 'bunch', approxPrice: 15, isAvailable: true, imageEmoji: '🌿' },

  // মাছ-মাংস (Fish & Meat)
  { id: 'p-19', nameBn: 'রুই মাছ', nameEn: 'Rui Fish', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 220, isAvailable: true, imageEmoji: '🐟', tags: ['popular'] },
  { id: 'p-20', nameBn: 'কাতলা মাছ', nameEn: 'Katla Fish', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 250, isAvailable: true, imageEmoji: '🐟' },
  { id: 'p-21', nameBn: 'ব্রয়লার মুরগি', nameEn: 'Broiler Chicken', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 190, isAvailable: true, imageEmoji: '🍗', tags: ['popular'] },
  { id: 'p-22', nameBn: 'দেশি মুরগি', nameEn: 'Country Chicken', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 500, isAvailable: true, imageEmoji: '🐓' },
  { id: 'p-23', nameBn: 'গরুর মাংস', nameEn: 'Beef', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 720, isAvailable: true, imageEmoji: '🥩' },
  { id: 'p-24', nameBn: 'তেলাপিয়া মাছ', nameEn: 'Tilapia Fish', category: 'fish-meat', unit: 'কেজি', unitEn: 'kg', approxPrice: 160, isAvailable: true, imageEmoji: '🐠' },

  // দুধ-ডিম (Milk & Eggs)
  { id: 'p-25', nameBn: 'ডিম (হালি)', nameEn: 'Eggs (4 pcs)', category: 'milk-eggs', unit: 'হালি', unitEn: '4 pcs', approxPrice: 50, isAvailable: true, imageEmoji: '🥚', tags: ['popular'] },
  { id: 'p-26', nameBn: 'গরুর দুধ', nameEn: 'Cow Milk', category: 'milk-eggs', unit: 'লিটার', unitEn: 'ltr', approxPrice: 80, isAvailable: true, imageEmoji: '🥛' },
  { id: 'p-27', nameBn: 'প্যাকেট দুধ', nameEn: 'Packed Milk', category: 'milk-eggs', unit: 'লিটার', unitEn: 'ltr', approxPrice: 100, isAvailable: true, imageEmoji: '📦' },
  { id: 'p-28', nameBn: 'ছানা', nameEn: 'Cottage Cheese', category: 'milk-eggs', unit: 'কেজি', unitEn: 'kg', approxPrice: 250, isAvailable: false, imageEmoji: '🧀' },

  // নাস্তা (Snacks)
  { id: 'p-29', nameBn: 'চিড়া', nameEn: 'Flattened Rice', category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 60, isAvailable: true, imageEmoji: '🌾' },
  { id: 'p-30', nameBn: 'মুড়ি', nameEn: 'Puffed Rice', category: 'snacks', unit: 'কেজি', unitEn: 'kg', approxPrice: 50, isAvailable: true, imageEmoji: '🍿', tags: ['popular'] },
  { id: 'p-31', nameBn: 'বিস্কুট', nameEn: 'Biscuit', category: 'snacks', unit: 'প্যাকেট', unitEn: 'packet', approxPrice: 30, isAvailable: true, imageEmoji: '🍪' },
  { id: 'p-32', nameBn: 'চানাচুর', nameEn: 'Chanachur', category: 'snacks', unit: 'প্যাকেট', unitEn: 'packet', approxPrice: 25, isAvailable: true, imageEmoji: '🍿' },
];

export const CATEGORY_INFO: Record<string, { nameBn: string; nameEn: string; emoji: string }> = {
  'rice-pulses': { nameBn: 'চাল-ডাল', nameEn: 'Rice & Pulses', emoji: '🌾' },
  'oil-spices': { nameBn: 'তেল-মসলা', nameEn: 'Oil & Spices', emoji: '🫙' },
  'vegetables': { nameBn: 'সবজি', nameEn: 'Vegetables', emoji: '🥬' },
  'fish-meat': { nameBn: 'মাছ-মাংস', nameEn: 'Fish & Meat', emoji: '🐟' },
  'milk-eggs': { nameBn: 'দুধ-ডিম', nameEn: 'Milk & Eggs', emoji: '🥚' },
  'snacks': { nameBn: 'নাস্তা', nameEn: 'Snacks', emoji: '🍿' },
};
