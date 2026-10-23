// ── Image registry ────────────────────────────────────────────
// Generated photos live in src/assets/img/. They are picked up
// with an eager glob so the app builds (and falls back to the
// emoji tiles) while any file is still missing — as each photo
// lands in the folder it is wired in automatically.
//
// Expected file names:
//   products:    p01.jpg … p32.jpg          → product ids p-01 … p-32
//   categories:  cat-<slug>.jpg             → CATEGORY_INFO slugs
//   restaurants: rest-01.jpg … rest-06.jpg  → restaurant ids
//   home:        hero-banner.jpg, banner-2.jpg, banner-3.jpg,
//                card-bazaar.jpg, card-restaurant.jpg
// A `media-generation-…` prefixed variant of a name is accepted
// as a fallback while generated files are being renamed.

const modules = import.meta.glob('../assets/img/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const byBase = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  byBase.set(path.split('/').pop() ?? path, url);
}

/** Exact file name first, then any generated-name variant. */
function find(fileName: string, token: string): string | undefined {
  const exact = byBase.get(fileName);
  if (exact) return exact;
  for (const [name, url] of byBase) {
    if (name.includes(token)) return url;
  }
  return undefined;
}

function buildRecord(
  count: number,
  fileFor: (nn: string) => string,
  tokenFor: (nn: string) => string,
  idFor: (nn: string) => string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 1; i <= count; i++) {
    const nn = String(i).padStart(2, '0');
    const src = find(fileFor(nn), tokenFor(nn));
    if (src) out[idFor(nn)] = src;
  }
  return out;
}

/** Product photos keyed by product id ('p-01' … 'p-32'). */
export const PRODUCT_IMAGES: Record<string, string> = buildRecord(
  32,
  nn => `p${nn}.jpg`,
  nn => `p${nn}-`,
  nn => `p-${nn}`,
);

/** Category photos keyed by CATEGORY_INFO slug. */
export const CATEGORY_IMAGES: Record<string, string> = {};
for (const slug of ['rice-pulses', 'oil-spices', 'vegetables', 'fish-meat', 'milk-eggs', 'snacks']) {
  const src = find(`cat-${slug}.jpg`, `cat-${slug}`);
  if (src) CATEGORY_IMAGES[slug] = src;
}

/** Restaurant photos keyed by restaurant id ('rest-01' …). */
export const RESTAURANT_IMAGES: Record<string, string> = buildRecord(
  6,
  nn => `rest-${nn}.jpg`,
  nn => `rest-${nn}`,
  nn => `rest-${nn}`,
);

/** Home-screen artwork (hero slider + entry cards). */
export const HOME_ASSETS: {
  hero?: string;
  banner2?: string;
  banner3?: string;
  cardBazaar?: string;
  cardRestaurant?: string;
} = {
  hero: find('hero-banner.jpg', 'hero-banner'),
  banner2: find('banner-2.jpg', 'banner-2'),
  banner3: find('banner-3.jpg', 'banner-3'),
  cardBazaar: find('card-bazaar.jpg', 'card-bazaar'),
  cardRestaurant: find('card-restaurant.jpg', 'card-restaurant'),
};
