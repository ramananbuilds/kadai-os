-- Kadai OS row-level security. One rule: you see and touch exactly the
-- rows of shops you are a member of. Journals (stock_movements,
-- loyalty_ledger) get NO update/delete policies — append-only is
-- enforced here, not just by convention (ADR 0002).

create or replace function public.has_shop_access(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shop_members m
    where m.shop_id = p_shop_id and m.user_id = auth.uid()
  )
$$;

-- ─── enable RLS everywhere ────────────────────────────────────────

alter table public.shops           enable row level security;
alter table public.shop_members    enable row level security;
alter table public.bill_counters   enable row level security;
alter table public.products        enable row level security;
alter table public.stock_movements enable row level security;
alter table public.customers       enable row level security;
alter table public.loyalty_ledger  enable row level security;
alter table public.rewards         enable row level security;
alter table public.bills           enable row level security;
alter table public.bill_items      enable row level security;

-- ─── shops ────────────────────────────────────────────────────────

create policy shops_read on public.shops for select
  using (has_shop_access(id));
create policy shops_update on public.shops for update
  using (has_shop_access(id))
  with check (has_shop_access(id));

-- ─── membership (read-only via RLS; invites flow through owner RPCs later)

create policy members_read on public.shop_members for select
  using (has_shop_access(shop_id) or user_id = auth.uid());

-- ─── counters ─────────────────────────────────────────────────────

create policy counters_read on public.bill_counters for select
  using (has_shop_access(shop_id));

-- ─── catalog ──────────────────────────────────────────────────────

create policy products_read   on public.products for select
  using (has_shop_access(shop_id));
create policy products_insert on public.products for insert
  with check (has_shop_access(shop_id));
create policy products_update on public.products for update
  using (has_shop_access(shop_id))
  with check (has_shop_access(shop_id));
-- deliberately no delete policy: deactivate products instead.

-- ─── stock journal — append-only ──────────────────────────────────

create policy stock_read   on public.stock_movements for select
  using (has_shop_access(shop_id));
create policy stock_insert on public.stock_movements for insert
  with check (has_shop_access(shop_id));
-- no update, no delete. Ever.

-- ─── customers ────────────────────────────────────────────────────

create policy customers_read   on public.customers for select
  using (has_shop_access(shop_id));
create policy customers_insert on public.customers for insert
  with check (has_shop_access(shop_id));
create policy customers_update on public.customers for update
  using (has_shop_access(shop_id))
  with check (has_shop_access(shop_id));

-- ─── loyalty ledger — append-only ─────────────────────────────────

create policy ledger_read   on public.loyalty_ledger for select
  using (has_shop_access(shop_id));
create policy ledger_insert on public.loyalty_ledger for insert
  with check (has_shop_access(shop_id));
-- no update, no delete. The ledger is the truth (ADR 0002).

-- ─── rewards ──────────────────────────────────────────────────────

create policy rewards_read   on public.rewards for select
  using (has_shop_access(shop_id));
create policy rewards_insert on public.rewards for insert
  with check (has_shop_access(shop_id));
create policy rewards_update on public.rewards for update
  using (has_shop_access(shop_id))
  with check (has_shop_access(shop_id));

-- ─── bills & items ────────────────────────────────────────────────

create policy bills_read   on public.bills for select
  using (has_shop_access(shop_id));
create policy bills_insert on public.bills for insert
  with check (has_shop_access(shop_id));
create policy bills_update on public.bills for update   -- void, later
  using (has_shop_access(shop_id))
  with check (has_shop_access(shop_id));
-- no delete: bills are records, not rows to clean up.

create policy bill_items_read   on public.bill_items for select
  using (exists (
    select 1 from public.bills b
    where b.id = bill_items.bill_id and has_shop_access(b.shop_id)
  ));
create policy bill_items_insert on public.bill_items for insert
  with check (exists (
    select 1 from public.bills b
    where b.id = bill_id and has_shop_access(b.shop_id)
  ));
