import type { MenuItem, Product, Restaurant } from '../types';
import { CATEGORY_INFO } from '../data/products';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/gh/g, 'g')
    .replace(/kh/g, 'k')
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .trim();

function isSubsequence(needle: string, hay: string) {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++;
  return i === needle.length && needle.length >= 3;
}

function scoreText(query: string, ...fields: (string | undefined)[]) {
  const q = norm(query);
  if (!q) return 0;
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    const f = norm(field);
    if (!f) continue;
    if (f === q) best = Math.max(best, 100);
    else if (f.startsWith(q)) best = Math.max(best, 80);
    else if (f.includes(q)) best = Math.max(best, 60);
    else if (isSubsequence(q, f)) best = Math.max(best, 30);
    else {
      // token-wise partial match: every query token matches some field token
      const tokens = q.split(' ').filter(Boolean);
      if (tokens.length > 1 && tokens.every(t => f.includes(t))) best = Math.max(best, 40);
    }
  }
  return best;
}

export function productScore(product: Product, query: string) {
  const cat = CATEGORY_INFO[product.category];
  return Math.max(
    scoreText(query, product.nameBn, product.nameEn, product.gradeBn, product.gradeEn),
    scoreText(query, ...(product.searchTags ?? [])),
    scoreText(query, cat?.nameBn, cat?.nameEn),
  );
}

export interface SearchHit {
  product?: Product;
  restaurant?: Restaurant;
  item?: MenuItem;
  score: number;
  kind: 'product' | 'menu';
}

export function searchCatalog(
  products: Product[],
  restaurants: Restaurant[],
  query: string,
): SearchHit[] {
  if (!query.trim()) return [];
  const hits: SearchHit[] = [];

  products.forEach(p => {
    const score = productScore(p, query);
    if (score > 0) hits.push({ product: p, score, kind: 'product' });
  });

  restaurants.forEach(r => {
    const restaurantScore = scoreText(query, r.nameBn, r.nameEn, r.cuisineTypeBn, r.cuisineTypeEn);
    r.menuItems.forEach(item => {
      const score = Math.max(scoreText(query, item.nameBn, item.nameEn), restaurantScore ? restaurantScore - 20 : 0);
      if (score > 0) hits.push({ item, restaurant: r, score, kind: 'menu' });
    });
  });

  return hits.sort((a, b) => b.score - a.score);
}

export function menuSearch(restaurant: Restaurant, query: string) {
  if (!query.trim()) return restaurant.menuItems;
  return restaurant.menuItems.filter(
    i => scoreText(query, i.nameBn, i.nameEn, i.sectionBn, i.section) > 0,
  );
}

/** romanised queries that the demo popular chips map to */
export const QUERY_SYNONYMS: Record<string, string> = {
  chal: 'চাল',
  rice: 'চাল',
  dal: 'ডাল',
  daal: 'ডাল',
  tel: 'তেল',
  oil: 'তেল',
  peyaj: 'পেঁয়াজ',
  onion: 'পেঁয়াজ',
  alu: 'আলু',
  potato: 'আলু',
  dim: 'ডিম',
  egg: 'ডিম',
  murgi: 'মুরগি',
  chicken: 'মুরগি',
  mach: 'মাছ',
  fish: 'মাছ',
  biryani: 'বিরিয়ানি',
  polao: 'পোলাও',
  gosala: 'গোশালা',
  goshala: 'গোশালা',
};
