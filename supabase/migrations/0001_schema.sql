-- Kadai OS schema — Phase 1.
-- Money is integer paise (ADR 0001). The loyalty ledger and stock movements
-- are append-only journals (ADR 0002). Bills carry client-generated ids as
-- idempotency keys (ADR 0003). Domain logic lands in 0003_rpcs.sql (ADR 0004).

-- ─── Enums ────────────────────────────────────────────────────────

create type public.member_role as enum ('owner', 'staff');
create type public.stock_reason as enum ('sale', 'restock', 'adjustment', 'return');
create type public.ledger_entry_type as enum ('earn', 'redeem', 'expire', 'adjust');
create type public.reward_kind as enum ('percent_off', 'flat_off');
create type public.tender as enum ('cash', 'upi', 'card');
create type public.bill_status as enum ('completed', 'void');

-- ─── Shops & membership ───────────────────────────────────────────

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  upi_id text not null check (char_length(upi_id) between 3 and 120),
  gstin text,
  -- Loyalty config lives on the shop; flat columns keep RPC math simple.
  earn_points_per_hundred_rupees integer not null default 1 check (earn_points_per_hundred_rupees >= 0),
  tier_gold_points integer not null default 2000 check (tier_gold_points > 0),
  tier_platinum_points integer not null default 5000 check (tier_platinum_points > tier_gold_points),
  created_at timestamptz not null default now()
);

create table public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  -- 4-digit quick-switch PIN for staff devices.
  pin text check (pin ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index shop_members_user_idx on public.shop_members (user_id);

-- Per-shop bill numbering, incremented atomically inside create_bill().
create table public.bill_counters (
  shop_id uuid primary key references public.shops (id) on delete cascade,
  next_number bigint not null default 1001 check (next_number > 0)
);

-- ─── Catalog & stock ──────────────────────────────────────────────

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  sku text not null check (char_length(sku) between 1 and 40),
  barcode text,
  category text not null default 'General',
  price_paise bigint not null check (price_paise > 0),
  cost_paise bigint not null default 0 check (cost_paise >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  reorder_level integer not null default 5 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, sku)
);

create index products_barcode_idx on public.products (shop_id, barcode) where barcode is not null;
create index products_low_stock_idx on public.products (shop_id) where is_active and stock_qty <= reorder_level;

-- Append-only stock journal; stock_qty on products is its running total.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason public.stock_reason not null,
  bill_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

-- ─── Customers & loyalty ──────────────────────────────────────────

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  -- Aggregates maintained only inside create_bill/ledger transactions;
  -- the ledger is the source of truth (ADR 0002).
  points_balance integer not null default 0,
  lifetime_spend_paise bigint not null default 0,
  visit_count integer not null default 0,
  last_visit_at timestamptz,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (shop_id, phone)
);

create index customers_shop_idx on public.customers (shop_id, name);

-- Append-only loyalty ledger (ADR 0002): no update/delete path exists,
-- in code or in RLS (0002_rls.sql).
create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  type public.ledger_entry_type not null,
  points integer not null check (points <> 0),
  bill_id uuid,
  note text,
  balance_after integer not null,
  created_at timestamptz not null default now(),
  check (
    (type = 'earn' and points > 0)
    or (type in ('redeem', 'expire') and points < 0)
    or type = 'adjust'
  )
);

create index loyalty_ledger_customer_idx on public.loyalty_ledger (customer_id, created_at desc);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  kind public.reward_kind not null,
  -- percent (1-100) for percent_off, paise for flat_off.
  value bigint not null check (value > 0),
  min_spend_paise bigint,
  cost_points integer not null default 0 check (cost_points >= 0),
  expiry_days integer check (expiry_days is null or expiry_days > 0),
  is_active boolean not null default true
);

-- ─── Bills ────────────────────────────────────────────────────────

create table public.bills (
  -- Client-generated (ADR 0003); doubles as the sync idempotency key.
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  number bigint not null,
  customer_id uuid references public.customers (id),
  subtotal_paise bigint not null check (subtotal_paise > 0),
  discount_percent smallint not null default 0 check (discount_percent between 0 and 100),
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  earned_points integer not null default 0 check (earned_points >= 0),
  redeemed_points integer not null default 0 check (redeemed_points >= 0),
  redeemed_reward_id uuid references public.rewards (id),
  tender public.tender not null,
  status public.bill_status not null default 'completed',
  -- Client clock at creation; the server stamps received_at itself.
  created_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (shop_id, number)
);

create index bills_shop_created_idx on public.bills (shop_id, created_at desc);
create index bills_customer_idx on public.bills (customer_id) where customer_id is not null;

create table public.bill_items (
  bill_id uuid not null references public.bills (id) on delete cascade,
  product_id uuid not null references public.products (id),
  -- Frozen at sale time: catalog edits never rewrite history.
  name_snapshot text not null,
  sku_snapshot text not null,
  unit_price_paise bigint not null check (unit_price_paise > 0),
  qty integer not null check (qty > 0),
  line_total_paise bigint not null check (line_total_paise > 0),
  primary key (bill_id, product_id)
);

-- Wire the bill references now that bills exists.
alter table public.stock_movements
  add constraint stock_movements_bill_fkey foreign key (bill_id) references public.bills (id) on delete set null;
alter table public.loyalty_ledger
  add constraint loyalty_ledger_bill_fkey foreign key (bill_id) references public.bills (id) on delete set null;

-- ─── updated_at maintenance ───────────────────────────────────────

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ─── shop defaults ────────────────────────────────────────────────

create or replace function public.init_shop_defaults() returns trigger
language plpgsql as $$
begin
  insert into public.bill_counters (shop_id) values (new.id);
  return new;
end;
$$;

create trigger shops_init_defaults
  after insert on public.shops
  for each row execute function public.init_shop_defaults();
