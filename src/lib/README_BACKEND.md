# Jovro backend — Phase 2: integration layer

Phase 1 (done): `supabase/schema.sql` (19 tables + RLS), `supabase/seed.sql`,
`src/lib/supabase.ts` client, `@supabase/supabase-js` installed.

## What Phase 2 provides (this layer — NOT wired into the app yet)

- **`src/lib/auth.ts`** — Supabase Auth helpers:
  `signUp`, `signIn`, `signOut`, `getMyProfile()` (role from `profiles` —
  role is decided by the registered email), `routeForRole(role)`
  (`admin→/admin`, `staff→/staff`, `rider→/rider`, `affiliate→/affiliate`,
  `customer→/`), `onAuthChange(cb)`, plus `Profile` type + `profileToUser()`.
- **`src/lib/backend.ts`** — typed data-access layer over every schema
  table, mirroring the AppContext action vocabulary
  (`PLACE_ORDER→placeOrder`, `ADD_PRODUCT→addProduct`, `UPDATE_AREA→updateArea`,
  …): areas, products, restaurants + menu items, orders, problem reports,
  reviews, payment requests, promos, notifications, saved addresses,
  delivery passes, applications, admin settings, activity log, profiles,
  and rider/affiliate/staff reads+writes (extension table ⨝ profile).
  Returns the app's own types from `src/types`.

Every function returns `{ data, error }` and **no-ops safely** when
Supabase is not configured (`error.code === 'not-configured'`) — the app
keeps running on localStorage demo state until then. Nothing imports
these files yet, so current behaviour is 100% unchanged.

## What Phase 3 will do

Once Baker creates his Supabase project (see `supabase/SETUP.md`) and the
`.env` keys exist:

1. Run `schema.sql`, then `seed.sql` (with Baker's admin email) in the
   Supabase SQL Editor.
2. Rewire AppContext: replace localStorage HYDRATE/dispatch persistence
   with calls to `src/lib/backend.ts`; keep the same Action vocabulary.
3. Wire the auth screens (login/signup) to `src/lib/auth.ts`; route by
   `routeForRole(profile.role)` after `getMyProfile()`.
4. Handle the id migration: demo record ids (`rider-01`, `u-001`) become
   profile uuids — in the DB a rider/affiliate IS their profile, and
   `payment_requests` uses `requester_id` + `requester_type`.
5. Then verify each role end-to-end against the RLS policies.

## .env keys needed

Copy `.env.example` to `.env` and fill in (Supabase dashboard →
Project Settings → API):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```
