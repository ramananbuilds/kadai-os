-- Kadai OS domain RPCs (ADR 0004): transactions live in Postgres so
-- bill + items + stock + ledger commit atomically. Mirrors the memory
-- driver in packages/api/src/memory.ts — the PGlite harness asserts both
-- stay in lockstep.

-- ─── create_bill ──────────────────────────────────────────────────
-- Called by clients (and the offline outbox drain). Idempotent on the
-- client-generated bill id (ADR 0003). Re-prices every item from the
-- live catalog; client prices are never trusted.

create or replace function public.create_bill(
  p_id uuid,
  p_customer_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_discount_percent smallint default 0,
  p_redeemed_points integer default 0,
  p_redeemed_reward_id uuid default null,
  p_tender public.tender default 'cash',
  p_created_at timestamptz default now()
) returns public.bills
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_bill bills;
  v_item jsonb;
  v_qty integer;
  v_product products;
  v_customer customers;
  v_has_customer boolean := false;
  v_reward rewards;
  v_effective_percent smallint := p_discount_percent;
  v_flat_reward_paise bigint := 0;
  v_subtotal bigint := 0;
  v_discount bigint;
  v_total bigint;
  v_earned integer := 0;
  v_number bigint;
  v_balance integer;
begin
  -- The caller's shop: exactly the shops this user is a member of (v1: one).
  select m.shop_id into v_shop_id
  from shop_members m where m.user_id = auth.uid()
  order by m.created_at limit 1;

  if v_shop_id is null then
    raise exception 'KADAI/no-shop: caller is not a shop member';
  end if;

  -- Idempotent replay: return the original bill, touch nothing.
  select * into v_bill from bills where id = p_id;
  if found then
    if v_bill.shop_id <> v_shop_id then
      raise exception 'KADAI/forbidden: bill belongs to another shop';
    end if;
    return v_bill;
  end if;

  -- Customer validation under row lock.
  if p_customer_id is not null then
    select * into v_customer from customers
    where id = p_customer_id and shop_id = v_shop_id for update;
    if not found then
      raise exception 'KADAI/customer-not-found: %', p_customer_id;
    end if;
    if v_customer.is_blocked then
      raise exception 'KADAI/customer-blocked: %', p_customer_id;
    end if;
    v_has_customer := true;
  elsif p_redeemed_points > 0 then
    raise exception 'KADAI/walk-in-cannot-redeem: points require a customer';
  end if;

  if p_redeemed_points > coalesce(v_customer.points_balance, 0) then
    raise exception 'KADAI/insufficient-points: balance %, tried %',
      coalesce(v_customer.points_balance, 0), p_redeemed_points;
  end if;

  -- Reward: flat off reduces the total directly; percent off stacks onto
  -- the bill discount (capped at 100).
  if p_redeemed_reward_id is not null then
    select * into v_reward from rewards
    where id = p_redeemed_reward_id and shop_id = v_shop_id and is_active;
    if not found then
      raise exception 'KADAI/reward-not-found: %', p_redeemed_reward_id;
    end if;
    if v_reward.kind = 'flat_off' then
      v_flat_reward_paise := v_reward.value;
    else
      v_effective_percent := least(100, p_discount_percent + v_reward.value::smallint);
    end if;
  end if;

  -- Pass 1: resolve, lock, validate stock, accumulate the subtotal.
  for v_item in select value from jsonb_array_elements(p_items) as e(value) loop
    v_qty := (v_item->>'qty')::integer;
    select * into v_product from products
    where id = (v_item->>'product_id')::uuid and shop_id = v_shop_id and is_active
    for update;
    if not found then
      raise exception 'KADAI/product-not-found: %', v_item->>'product_id';
    end if;
    if v_product.stock_qty < v_qty then
      raise exception 'KADAI/insufficient-stock: % has %, need %',
        v_product.name, v_product.stock_qty, v_qty;
    end if;
    v_subtotal := v_subtotal + v_product.price_paise * v_qty;
  end loop;

  if v_subtotal <= 0 then
    raise exception 'KADAI/empty-bill: at least one item is required';
  end if;

  -- Money math in integer paise (ADR 0001); rounding mirrors
  -- discountPaise()/computeEarnedPoints() in @kadai-os/core.
  v_discount := case
    when v_effective_percent <= 0 then 0
    when v_effective_percent >= 100 then v_subtotal
    else (v_subtotal * v_effective_percent + 50) / 100
  end;
  v_total := greatest(0, v_subtotal - v_discount - v_flat_reward_paise);

  if v_has_customer then
    v_earned := (
      v_total * (select earn_points_per_hundred_rupees from shops where id = v_shop_id)
    ) / 10000;
  end if;

  -- Sequential bill number, atomically.
  update bill_counters set next_number = next_number + 1
  where shop_id = v_shop_id
  returning next_number - 1 into v_number;

  insert into bills (
    id, shop_id, number, customer_id,
    subtotal_paise, discount_percent, discount_paise, total_paise,
    earned_points, redeemed_points, redeemed_reward_id,
    tender, status, created_at
  ) values (
    p_id, v_shop_id, v_number, p_customer_id,
    v_subtotal, v_effective_percent, v_discount, v_total,
    v_earned, p_redeemed_points, p_redeemed_reward_id,
    p_tender, 'completed', p_created_at
  ) returning * into v_bill;

  -- Pass 2: items, stock, journal (products still locked from pass 1).
  for v_item in select value from jsonb_array_elements(p_items) as e(value) loop
    v_qty := (v_item->>'qty')::integer;
    insert into bill_items (bill_id, product_id, name_snapshot, sku_snapshot, unit_price_paise, qty, line_total_paise)
    select p_id, p.id, p.name, p.sku, p.price_paise, v_qty, p.price_paise * v_qty
    from products p where p.id = (v_item->>'product_id')::uuid;

    update products set stock_qty = stock_qty - v_qty
    where id = (v_item->>'product_id')::uuid;

    insert into stock_movements (shop_id, product_id, delta, reason, bill_id)
    values (v_shop_id, (v_item->>'product_id')::uuid, -v_qty, 'sale', p_id);
  end loop;

  -- Loyalty ledger + maintained aggregates (ADR 0002).
  if v_has_customer then
    if p_redeemed_points > 0 then
      update customers set points_balance = points_balance - p_redeemed_points
      where id = p_customer_id
      returning points_balance into v_balance;
      insert into loyalty_ledger (shop_id, customer_id, type, points, bill_id, balance_after)
      values (v_shop_id, p_customer_id, 'redeem', -p_redeemed_points, p_id, v_balance);
    end if;
    if v_earned > 0 then
      update customers set points_balance = points_balance + v_earned
      where id = p_customer_id
      returning points_balance into v_balance;
      insert into loyalty_ledger (shop_id, customer_id, type, points, bill_id, balance_after)
      values (v_shop_id, p_customer_id, 'earn', v_earned, p_id, v_balance);
    end if;
    update customers
    set lifetime_spend_paise = lifetime_spend_paise + v_total,
        visit_count = visit_count + 1,
        last_visit_at = now()
    where id = p_customer_id;
  end if;

  return v_bill;
end;
$$;

-- ─── adjust_stock ─────────────────────────────────────────────────

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta integer,
  p_reason public.stock_reason default 'adjustment',
  p_note text default null
) returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_new_stock integer;
  v_movement stock_movements;
begin
  select m.shop_id into v_shop_id
  from shop_members m where m.user_id = auth.uid()
  order by m.created_at limit 1;
  if v_shop_id is null then
    raise exception 'KADAI/no-shop: caller is not a shop member';
  end if;

  update products p set stock_qty = p.stock_qty + p_delta
  where p.id = p_product_id and p.shop_id = v_shop_id
  returning p.stock_qty into v_new_stock;
  if not found then
    raise exception 'KADAI/product-not-found: %', p_product_id;
  end if;
  if v_new_stock < 0 then
    raise exception 'KADAI/insufficient-stock: adjustment would take stock below zero';
  end if;

  insert into stock_movements (shop_id, product_id, delta, reason, note)
  values (v_shop_id, p_product_id, p_delta, p_reason, p_note)
  returning * into v_movement;

  return v_movement;
end;
$$;
