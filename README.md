# Jovro — হাইপারলোকাল পার্সোনাল শপার (Frontend)

Jovro is a hyperlocal personal-shopping and delivery web app for **Lalmonirhat Sadar, Bangladesh**.
Customers order from Goshala Bazar and local restaurants, a shopper buys at the real bazaar price,
and a rider delivers by bicycle. This repository contains the **complete frontend** — there is no
backend, auth server, SMS gateway or payment processor anywhere in the codebase.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build  → dist/
npm run preview  # serve the production build
npm test         # 23 jsdom interaction tests (Vitest + Testing Library)
npm run lint     # oxlint
```

Production builds are published under `/Jovro/` (GitHub Pages); dev and previews run at `/`.
Every image goes through `src/lib/asset.ts`, so the base path is handled in one place.

## Demo access

| What | How |
| --- | --- |
| Customer login | any 11-digit mobile (`01XXXXXXXXX`) + any password of 4+ characters |
| OTP login | demo code **1234** — the hint is printed on the OTP screen |
| Role switcher | the discreet pill at the bottom of **Login** and in **Profile → ডেমো মোড** |
| Roles | Customer · Rider · Affiliate · Staff · Admin — switching is instant, no reload |
| Admin master switch | `/admin/settings` → turn the service off to see the customer closed state |
| Rider flow | approve/assign in `/admin/orders`, then open `/rider` as the rider |
| Staff flow | `/staff` shows the permission-restricted operator workspace |

The switcher writes `jovro_role` / `jovro_loggedIn` to localStorage and navigates with
`replace`, so the target portal renders on its first paint. Orders, riders, payouts, products,
areas, promos, reviews, problem reports, notifications, addresses and the service switch all live
in one persisted slice (`jovro_data_v5`), which is why a change made in one role is visible in the
next.

## Architecture

```
src/
  types/        Product, Restaurant, MenuItem, Area, Order, OrderItem, User, Rider,
                Affiliate, StaffMember, Review, ProblemReport, PromoCode, Notification …
  data/         seed catalogue: 43 bazaar products, 6 restaurants with priced menus,
                114 delivery areas + fees, promo codes, sample orders/riders/reviews
  services/     mock async API: orders (place/cancel/refund), auth (demo login/OTP), ai, utils
  context/      AppContext — reducer, localStorage hydration/persistence, cart math, i18n
  i18n/         complete Bangla ⇄ English dictionary (Bangla is the default)
  components/   layout (headers, bottom navs, page frame) · ui · shared (cards, cart bar)
  screens/      auth · customer · info · rider · admin · staff · affiliate
  test/         jsdom interaction tests for the documented demo flows
```

Only `src/data/` and `src/services/` know about the mock backend; screens consume typed state and
async services. Replacing the services with real HTTP calls does not require touching the UI.

## Design system

* One Tailwind theme (`tailwind.config.js`): Jovro green `#1D9D57`, terracotta `#C2410C`,
  warm surface `#F7F8F4`, `maxWidth.app = 430px`, radius/shadow/typography scales.
* **Hind Siliguri** for Bangla and **Material Symbols Outlined** for icons, loaded in `src/index.css`.
* Shared primitives built once: `Button`, `Input`, `Stepper`, `Card`, `Toggle`, `BottomSheet`,
  `SearchBar`, `EmptyState`, `ProductCard`, `OrderCard`, `CartBar`, `PageHeader`, `BottomNav`.
* The app renders inside a centred 430 px phone frame on desktop with a soft page background;
  full-screen on mobile with safe-area aware sticky bars.

## Screen map

| Area | Routes |
| --- | --- |
| Onboarding | `/splash` `/lang` `/onboard` `/signup` `/login` `/otp` `/forgot-password` `/set-password` `/area` |
| Shopping | `/` `/bazaar` `/search` `/product/:id` `/food` `/food/:id` `/cart` `/checkout` `/order-success/:id` |
| Account | `/orders` `/orders/:id` `/profile/*` `/favourites` `/addresses` `/notifications` `/report` `/refer` `/subscription` `/earn` |
| AI | `/ai` `/ai/busy` |
| Info | `/about` `/contact` `/faq` `/privacy` `/terms` `/refund-policy` `/delivery-fees` |
| States | `/offline` `/closed` `/slot-full` |
| Rider | `/apply-rider` `/rider` `/rider/orders/:id` `/rider/history` `/rider/earnings` |
| Admin | `/admin` → dashboard, orders, products, restaurants, promotions, areas, customers, 360°, reviews, notifications, reports, settings, problems, search, people, payouts, approvals, staff, activity, templates |
| Staff | `/staff` → today's orders, order detail, buying list, daily summary, problem reports |
| Affiliate | `/apply-affiliate` `/affiliate` `/affiliate/tools` `/affiliate/earnings` |

## Demo flows covered by the test suite

1. Browse → add (ADD becomes a stepper) → grouped cart → invalid/valid promo → checkout → place order → order persisted.
2. Admin assigns a rider → the order appears in that rider's portal.
3. Rider sends a tracking update → the customer timeline shows the same message.
4. Customer files a problem report → it appears in the admin problem inbox.
5. Admin adds a product → it appears in the customer catalogue.
6. Admin edits an area fee → checkout charges the new fee.
7. Admin turns the service off → home shows the closed state and links to `/closed`.
8. Language toggle, area search (`gosala` → গোশালা বাজার), favourites and address book persistence.
