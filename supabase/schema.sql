-- ============================================================
-- Jovro — Supabase (Postgres) schema
-- Mirrors the frontend data model in src/types/index.ts.
-- Run this FIRST in the Supabase SQL Editor (see SETUP.md).
--
-- Identity model (Baker's rule): ONE app, role decided by the
-- email registered in `profiles`. Whoever signs up becomes a
-- 'customer' by default; Baker promotes accounts by changing
-- profiles.role (admin / staff / rider / affiliate).
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type public.user_role as enum ('admin', 'staff', 'rider', 'affiliate', 'customer');
create type public.order_status as enum (
  'pending', 'confirmed', 'buying', 'on-the-way', 'delivered',
  'failed', 'cancelled', 'refund-in-progress', 'refunded'
);
create type public.rider_status as enum ('pending', 'active', 'inactive', 'suspended');
create type public.affiliate_status as enum ('pending', 'active', 'inactive');

-- ── Helper: role of the currently signed-in user ─────────────
-- security definer so RLS policies can read profiles without
-- recursing into profiles' own policies.
create or replace function public.my_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.my_role() = 'admin', false);
$$;

-- Generic updated_at maintenance.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Areas (114 delivery areas — seeded in seed.sql) ──────────
create table public.areas (
  id         text primary key,               -- 'area-01' … 'area-114'
  name_bn    text not null,
  name_en    text not null,
  fee        numeric(10,2) not null,         -- delivery fee, BDT
  zone       text not null check (zone in ('town', 'union')),
  group_name text,                           -- app field: `group`
  is_served  boolean not null default true
);

-- ── Profiles (one row per auth user) ─────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null unique,
  role            public.user_role not null default 'customer',
  name            text not null default '',
  name_bn         text not null default '',
  mobile          text not null default '',
  avatar_url      text,
  delivery_area_id text references public.areas (id),
  is_verified     boolean not null default false,
  status          text not null default 'active' check (status in ('active', 'inactive')),
  referral_code   text unique,
  referred_by     text,                      -- referral code of whoever referred them
  has_active_pass boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Nobody except an admin may change role / email on a profile —
-- this is what stops a customer promoting themselves via the API.
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(public.is_admin(), false)
     and (new.role is distinct from old.role or new.email is distinct from old.email) then
    raise exception 'Only an admin can change role or email';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileged_fields();

-- Auto-create a customer profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, name_bn, mobile, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'name_bn', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile', ''),
    'JV-' || upper(substr(md5(new.id::text), 1, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Role extension tables (keyed to profiles) ────────────────
create table public.rider_profiles (
  profile_id       uuid primary key references public.profiles (id) on delete cascade,
  vehicle_type     text not null default 'bicycle' check (vehicle_type in ('bicycle', 'motorbike')),
  area_id          text references public.areas (id),
  status           public.rider_status not null default 'pending',
  total_deliveries integer not null default 0,
  total_earnings   numeric(12,2) not null default 0,
  rating           numeric(3,2) not null default 0,
  pending_payout   numeric(12,2) not null default 0,
  joined_at        timestamptz not null default now()
);

create table public.affiliate_profiles (
  profile_id       uuid primary key references public.profiles (id) on delete cascade,
  referral_code    text not null unique,
  promote_note     text,                     -- "কোথায় প্রচার করবেন?"
  status           public.affiliate_status not null default 'pending',
  total_referrals  integer not null default 0,
  total_earnings   numeric(12,2) not null default 0,
  pending_payout   numeric(12,2) not null default 0,
  commission_rate  numeric(10,2),            -- ৳ per order, set by admin
  joined_at        timestamptz not null default now()
);

-- SIMPLIFICATION: the app's StaffMember.permissions[] is enforced
-- in the frontend today. In SQL, staff get broad operational
-- access (see policies below) and this table only stores the
-- checklist for display / future fine-grained policies.
create table public.staff_profiles (
  profile_id  uuid primary key references public.profiles (id) on delete cascade,
  permissions text[] not null default '{}',  -- 'orders','products','refunds','settings',…
  is_active   boolean not null default true,
  added_at    timestamptz not null default now(),
  last_active timestamptz not null default now()
);

-- ── Products (bazaar catalogue) ──────────────────────────────
create table public.products (
  id           text primary key,
  name_bn      text not null,
  name_en      text not null,
  category     text not null check (category in
                 ('rice-pulses','oil-spices','vegetables','fish-meat','milk-eggs','snacks')),
  unit         text not null,
  unit_en      text not null,
  approx_price numeric(10,2) not null,
  is_available boolean not null default true,
  image_emoji  text,
  image_url    text,
  description  text,
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ── Restaurants + menu items ─────────────────────────────────
create table public.restaurants (
  id               text primary key,
  name_bn          text not null,
  name_en          text not null,
  cuisine_type_bn  text not null default '',
  cuisine_type_en  text not null default '',
  address          text not null default '',
  is_open          boolean not null default true,
  min_order        numeric(10,2) not null default 0,
  delivery_time_min integer not null default 30,
  rating           numeric(3,2) not null default 0,
  rating_count     integer not null default 0,
  image_emoji      text,
  image_url        text,
  area_id          text references public.areas (id),
  opening_time     text,
  closing_time     text,
  created_at       timestamptz not null default now()
);

create table public.menu_items (
  id            text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name_bn       text not null,
  name_en       text not null,
  price         numeric(10,2) not null,      -- exact price (unlike bazaar approx)
  category      text,
  section       text,
  description   text,
  image_emoji   text,
  is_available  boolean not null default true,
  is_popular    boolean not null default false
);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id);

-- ── Orders ───────────────────────────────────────────────────
-- items / tracking_updates stay jsonb, exactly like the app's
-- OrderItem[] and TrackingUpdate[] arrays.
create table public.orders (
  id               text primary key,         -- 'JV-240001'
  customer_id      uuid not null references public.profiles (id),
  customer_name    text not null,            -- denormalised, as in the app
  customer_mobile  text not null,
  delivery_area_id text not null references public.areas (id),
  delivery_address text not null,
  order_note       text,
  items            jsonb not null default '[]',
  products_total   numeric(12,2) not null default 0,
  delivery_fee     numeric(10,2) not null default 0,
  discount_amount  numeric(10,2) not null default 0,
  promo_code       text,
  final_total      numeric(12,2) not null default 0,
  status           public.order_status not null default 'pending',
  time_slot        text not null default 'morning'
                     check (time_slot in ('morning', 'afternoon', 'evening')),
  rider_id         uuid references public.profiles (id),  -- the rider's profile id
  tracking_updates jsonb not null default '[]',
  has_complaint    boolean not null default false,
  refund_days      integer check (refund_days in (3, 5, 7)),
  refund_status    text check (refund_status in ('processing', 'paid')),
  refund_amount    numeric(12,2),
  refund_method    text check (refund_method in ('bkash', 'nagad', 'cash')),
  refund_note      text,
  proof_photo_url  text,
  customer_received boolean not null default false,
  fail_reason      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_customer_idx on public.orders (customer_id);
create index orders_rider_idx    on public.orders (rider_id);
create index orders_status_idx   on public.orders (status);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── Problem reports ──────────────────────────────────────────
create table public.problem_reports (
  id            text primary key,
  order_id      text not null references public.orders (id) on delete cascade,
  customer_id   uuid not null references public.profiles (id),
  customer_name text not null,
  problem_type  text not null check (problem_type in
                  ('wrong-item','missing-item','damaged','late-delivery','overcharged','other')),
  description_bn text,
  description_en text,
  status        text not null default 'open'
                  check (status in ('open','in-review','resolved','refund-issued')),
  refund_days   integer check (refund_days in (3, 5, 7)),
  admin_note    text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index problem_reports_order_idx on public.problem_reports (order_id);

-- ── Reviews ──────────────────────────────────────────────────
create table public.reviews (
  id            text primary key,
  order_id      text not null references public.orders (id) on delete cascade,
  customer_id   uuid not null references public.profiles (id),
  customer_name text not null,
  rating        integer not null check (rating between 1 and 5),
  comment_bn    text,
  comment_en    text,
  is_approved   boolean not null default false,
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index reviews_order_idx on public.reviews (order_id);

-- ── Payment requests (rider + affiliate payouts) ─────────────
-- SIMPLIFICATION: one table for both roles (the app reuses the
-- same shape); requester_type says which extension table the
-- requester belongs to. The app demo reuses riderId for both —
-- in production it is the requester's profile uuid.
create table public.payment_requests (
  id             text primary key,
  requester_id   uuid not null references public.profiles (id),
  requester_type text not null check (requester_type in ('rider', 'affiliate')),
  amount         numeric(12,2) not null,
  status         text not null default 'pending'
                   check (status in ('pending', 'paid', 'rejected')),
  method         text not null,              -- 'bkash' / 'nagad' / …
  account_number text not null,
  requested_at   timestamptz not null default now(),
  paid_at        timestamptz
);
create index payment_requests_requester_idx on public.payment_requests (requester_id);

-- ── Promo codes ──────────────────────────────────────────────
create table public.promos (
  code           text primary key,
  description_bn text not null default '',
  description_en text not null default '',
  discount_type  text not null check (discount_type in ('flat', 'percent', 'free-delivery')),
  discount_value numeric(10,2) not null default 0,
  min_order      numeric(10,2) not null default 0,
  max_discount   numeric(10,2),
  is_active      boolean not null default true,
  expires_at     timestamptz,
  used_count     integer not null default 0,
  usage_limit    integer
);

-- ── Notifications ────────────────────────────────────────────
create table public.notifications (
  id         text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in
               ('order-update','promo','system','refund','delivery')),
  title_bn   text not null,
  title_en   text not null,
  body_bn    text not null,
  body_en    text not null,
  is_read    boolean not null default false,
  order_id   text references public.orders (id),
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id);

-- ── Applications (rider / affiliate sign-ups awaiting approval) ──
-- In the frontend demo an application is stored as a pending
-- Rider/Affiliate record; in production it lands here first and
-- an admin approval creates the *_profiles row + role change.
create table public.applications (
  id           text primary key,
  type         text not null check (type in ('rider', 'affiliate')),
  profile_id   uuid references public.profiles (id),
  name         text not null,
  name_bn      text not null default '',
  mobile       text not null,
  email        text,
  area_id      text references public.areas (id),
  vehicle_type text check (vehicle_type in ('bicycle', 'motorbike')),
  promote_note text,                          -- affiliates: কোথায় প্রচার করবেন?
  payload      jsonb not null default '{}',   -- anything extra from the form
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
create index applications_status_idx on public.applications (status);

-- ── Admin settings (single row; value mirrors AdminSettings) ──
create table public.admin_settings (
  id         integer primary key default 1 check (id = 1),
  settings   jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger admin_settings_touch before update on public.admin_settings
  for each row execute function public.touch_updated_at();

-- ── Team activity log ────────────────────────────────────────
create table public.activity_log (
  id               text primary key,
  actor_profile_id uuid references public.profiles (id),
  actor_name       text not null,
  action           text not null,
  category         text check (category in ('order', 'refund', 'general')),
  at               timestamptz not null default now()
);
create index activity_log_at_idx on public.activity_log (at desc);

-- ── Saved addresses + delivery passes (customer extras) ──────
create table public.saved_addresses (
  id          text primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null,
  label_en    text not null default '',
  full_address text not null,
  area_id     text not null references public.areas (id),
  is_default  boolean not null default false
);
create index saved_addresses_user_idx on public.saved_addresses (user_id);

create table public.delivery_passes (
  id          text primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  price       numeric(10,2) not null,
  start_date  date not null,
  end_date    date not null,
  orders_used integer not null default 0,
  is_active   boolean not null default true
);
create index delivery_passes_user_idx on public.delivery_passes (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.areas              enable row level security;
alter table public.profiles           enable row level security;
alter table public.rider_profiles     enable row level security;
alter table public.affiliate_profiles enable row level security;
alter table public.staff_profiles     enable row level security;
alter table public.products           enable row level security;
alter table public.restaurants        enable row level security;
alter table public.menu_items         enable row level security;
alter table public.orders             enable row level security;
alter table public.problem_reports    enable row level security;
alter table public.reviews            enable row level security;
alter table public.payment_requests   enable row level security;
alter table public.promos             enable row level security;
alter table public.notifications      enable row level security;
alter table public.applications       enable row level security;
alter table public.admin_settings     enable row level security;
alter table public.activity_log       enable row level security;
alter table public.saved_addresses    enable row level security;
alter table public.delivery_passes    enable row level security;

-- ── Public catalogue: anyone (even logged-out) can browse ────
create policy "areas_public_read" on public.areas
  for select using (true);
create policy "areas_admin_write" on public.areas
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products
  for select using (true);
create policy "products_staff_write" on public.products
  for all using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

create policy "restaurants_public_read" on public.restaurants
  for select using (true);
create policy "restaurants_staff_write" on public.restaurants
  for all using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

create policy "menu_items_public_read" on public.menu_items
  for select using (true);
create policy "menu_items_staff_write" on public.menu_items
  for all using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

create policy "promos_public_read" on public.promos
  for select using (true);
create policy "promos_admin_write" on public.promos
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Profiles: own row; staff/admin can look people up (support) ──
create policy "profiles_self_read" on public.profiles
  for select using (
    id = auth.uid() or public.my_role() in ('admin', 'staff')
    -- affiliates can see customers they referred (for their referral list)
    or exists (
      select 1 from public.affiliate_profiles a
      where a.profile_id = auth.uid() and a.referral_code = profiles.referred_by
    )
  );
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- (role/email changes for non-admins are additionally blocked by
--  the profiles_guard trigger above.)

-- ── Extension tables: own row + admin; staff read for ops ────
create policy "rider_profiles_read" on public.rider_profiles
  for select using (
    profile_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "rider_profiles_admin_write" on public.rider_profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "rider_profiles_self_update" on public.rider_profiles
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "affiliate_profiles_read" on public.affiliate_profiles
  for select using (
    profile_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "affiliate_profiles_admin_write" on public.affiliate_profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "affiliate_profiles_self_update" on public.affiliate_profiles
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "staff_profiles_read" on public.staff_profiles
  for select using (
    profile_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "staff_profiles_admin_write" on public.staff_profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Orders: the heart of the operation ───────────────────────
-- admin/staff: everything. customer: only their own.
-- rider: only orders assigned to them.
create policy "orders_read" on public.orders
  for select using (
    public.my_role() in ('admin', 'staff')
    or customer_id = auth.uid()
    or rider_id = auth.uid()
  );
create policy "orders_customer_insert" on public.orders
  for insert with check (customer_id = auth.uid());
create policy "orders_update" on public.orders
  for update using (
    public.my_role() in ('admin', 'staff')
    or customer_id = auth.uid()          -- e.g. customer_received confirm
    or rider_id = auth.uid()             -- rider posts status / tracking
  ) with check (
    public.my_role() in ('admin', 'staff')
    or customer_id = auth.uid()
    or rider_id = auth.uid()
  );
create policy "orders_admin_delete" on public.orders
  for delete using (public.is_admin());
-- NOTE (simplification): row-level policies cannot restrict single
-- columns, so a rider updating their order could in theory touch
-- price fields too. The app never sends those fields; a stricter
-- column-guard trigger can be added before real-money launch.

-- ── Problem reports ──────────────────────────────────────────
create policy "problem_reports_read" on public.problem_reports
  for select using (
    public.my_role() in ('admin', 'staff') or customer_id = auth.uid());
create policy "problem_reports_customer_insert" on public.problem_reports
  for insert with check (customer_id = auth.uid());
create policy "problem_reports_staff_update" on public.problem_reports
  for update using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

-- ── Reviews: customers post on their own orders; moderation ──
create policy "reviews_public_read_approved" on public.reviews
  for select using (
    (is_approved and not is_hidden)
    or customer_id = auth.uid()
    or public.my_role() in ('admin', 'staff'));
create policy "reviews_customer_insert" on public.reviews
  for insert with check (customer_id = auth.uid());
create policy "reviews_staff_update" on public.reviews
  for update using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

-- ── Payment requests: own + admin decides ────────────────────
-- SIMPLIFICATION: staff can READ payout requests (to answer
-- questions) but only admin can mark paid / reject — refunds and
-- payouts stay admin-only even though the app checklist has a
-- 'refunds' permission item.
create policy "payment_requests_read" on public.payment_requests
  for select using (
    requester_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "payment_requests_insert" on public.payment_requests
  for insert with check (
    requester_id = auth.uid() and public.my_role() in ('rider', 'affiliate'));
create policy "payment_requests_admin_update" on public.payment_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- ── Notifications: own inbox; admin/staff can send ───────────
create policy "notifications_read_own" on public.notifications
  for select using (user_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_staff_insert" on public.notifications
  for insert with check (public.my_role() in ('admin', 'staff'));

-- ── Applications: apply yourself; admin/staff review ─────────
create policy "applications_insert" on public.applications
  for insert with check (profile_id is null or profile_id = auth.uid());
create policy "applications_read" on public.applications
  for select using (
    profile_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "applications_staff_update" on public.applications
  for update using (public.my_role() in ('admin', 'staff'))
  with check (public.my_role() in ('admin', 'staff'));

-- ── Admin settings: everyone signed-in reads (banners, pass
--    price, slots…), only admin writes. Staff are locked out of
--    writes by Baker's rule, even with a 'settings' checklist tick.
create policy "admin_settings_read" on public.admin_settings
  for select using (auth.uid() is not null);
create policy "admin_settings_admin_write" on public.admin_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Activity log: admin/staff read + write ───────────────────
create policy "activity_log_staff_read" on public.activity_log
  for select using (public.my_role() in ('admin', 'staff'));
create policy "activity_log_staff_insert" on public.activity_log
  for insert with check (public.my_role() in ('admin', 'staff'));

-- ── Customer extras: fully private to the owner ──────────────
create policy "saved_addresses_own" on public.saved_addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "delivery_passes_own" on public.delivery_passes
  for select using (user_id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "delivery_passes_admin_write" on public.delivery_passes
  for all using (public.is_admin()) with check (public.is_admin());
