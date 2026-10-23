-- ============================================================
-- Jovro — Phase 3 delta (run AFTER schema.sql, BEFORE seed.sql)
--
-- IDEMPOTENT: safe to run more than once — every statement uses
-- IF (NOT) EXISTS / drop-policy-if-exists guards.
--
-- Covers the app state added after schema.sql was written:
--  1. rider_profiles.duty_on      — Rider.dutyOn (on-duty switch)
--  2. orders.rider_earning        — Order.riderEarning (frozen
--                                   deliveryFee − company cut)
--  3. profiles.alt_mobile         — User.altMobile
--  4. affiliate_waitlist table    — AffiliateWaitlistEntry
--                                   (affiliate programme closed;
--                                   entry points collect emails)
--  5. Realtime publication        — orders + notifications, so
--                                   the app can merge live updates
-- admin_settings needs NO change: the whole AdminSettings
-- object (incl. riderIntakeOpen, riderCap,
-- companyCutPerDelivery, companyFundTotal, serviceOverride)
-- lives in its `settings` jsonb and round-trips as-is.
-- ============================================================

-- ── 1. Rider on-duty switch ──────────────────────────────────
alter table public.rider_profiles
  add column if not exists duty_on boolean not null default true;

-- ── 2. Frozen per-order rider earning ────────────────────────
alter table public.orders
  add column if not exists rider_earning numeric(12,2);

comment on column public.orders.rider_earning is
  'What the rider earned for this delivery, frozen at delivery time: delivery_fee - company cut (adminSettings.companyCutPerDelivery). NULL on orders delivered before the cut existed; readers fall back to fee - current cut.';

-- Proof photos: orders.proof_photo_url is `text` (unbounded in
-- Postgres), so the app's proof-photo data URLs fit as-is.
-- NOTE for later: once volume grows, move proof photos to a
-- Supabase Storage bucket and keep only the file URL here.
comment on column public.orders.proof_photo_url is
  'Delivery proof photo. Currently a data URL (column is unbounded text, so this works); migrate to a Storage bucket URL when volume grows.';

-- ── 3. Profile alternate mobile (User.altMobile) ─────────────
alter table public.profiles
  add column if not exists alt_mobile text;

-- ── 4. Affiliate waitlist ────────────────────────────────────
create table if not exists public.affiliate_waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.affiliate_waitlist enable row level security;

-- Anyone may leave their email (the closed-programme screen is
-- the public entry point); only the admin can read the list.
drop policy if exists "affiliate_waitlist_insert" on public.affiliate_waitlist;
create policy "affiliate_waitlist_insert" on public.affiliate_waitlist
  for insert with check (true);

drop policy if exists "affiliate_waitlist_admin_read" on public.affiliate_waitlist;
create policy "affiliate_waitlist_admin_read" on public.affiliate_waitlist
  for select using (public.is_admin());

drop policy if exists "affiliate_waitlist_admin_delete" on public.affiliate_waitlist;
create policy "affiliate_waitlist_admin_delete" on public.affiliate_waitlist
  for delete using (public.is_admin());

-- ── 5. Realtime: live order + notification updates ───────────
-- REPLICA IDENTITY FULL so UPDATE events carry the whole row.
alter table public.orders replica identity full;
alter table public.notifications replica identity full;

-- Add both tables to the supabase_realtime publication
-- (guarded — `alter publication … add table` errors if the
-- table is already a member).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
