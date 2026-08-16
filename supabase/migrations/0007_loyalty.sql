-- Kadai OS loyalty engine completion (Phase 6).
-- 1) Redeeming a reward charges its point cost inside create_bill —
--    discount and deduction are one transaction.
-- 2) Points expire FIFO: shops.points_expiry_days (null = never);
--    expire_stale_points() appends 'expire' entries for consumed-stale
--    balances. Schedule with pg_cron or call from the back-office.

alter table public.shops
  add column if not exists points_expiry_days integer
    check (points_expiry_days is null or points_expiry_days > 0);

-- ─── create_bill v2: reward redemption charges cost_points ───────

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
  v_redeem_total integer := p_redeemed_points;
  v_subtotal bigint := 0;
  v_discount bigint;
  v_total bigint;
  v_earned integer := 0;
  v_number bigint;
  v_balance integer;
begin
  select m.shop_id into v_shop_id
  from shop_members m where m.user_id = auth.uid()
  order by m.created_at limit 1;

  if v_shop_id is null then
    raise exception 'KADAI/no-shop: caller is not a shop member';
  end if;

  select * into v_bill from bills where id = p_id;
  if found then
    if v_bill.shop_id <> v_shop_id then
      raise exception 'KADAI/forbidden: bill belongs to another shop';
    end if;
    return v_bill;
  end if;

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
  end if;

  -- Reward: flat off reduces the total; percent off stacks onto the
  -- discount; either way its cost_points are charged on redemption.
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
    if not v_has_customer then
      raise exception 'KADAI/walk-in-cannot-redeem: rewards require a customer';
    end if;
    v_redeem_total := v_redeem_total + v_reward.cost_points;
  end if;

  if v_redeem_total > 0 and not v_has_customer then
    raise exception 'KADAI/walk-in-cannot-redeem: points require a customer';
  end if;

  if v_redeem_total > coalesce(v_customer.points_balance, 0) then
    raise exception 'KADAI/insufficient-points: balance %, tried %',
      coalesce(v_customer.points_balance, 0), v_redeem_total;
  end if;

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
    v_earned, v_redeem_total, p_redeemed_reward_id,
    p_tender, 'completed', p_created_at
  ) returning * into v_bill;

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

  if v_has_customer then
    if v_redeem_total > 0 then
      update customers set points_balance = points_balance - v_redeem_total
      where id = p_customer_id
      returning points_balance into v_balance;
      insert into loyalty_ledger (shop_id, customer_id, type, points, bill_id, note, balance_after)
      values (v_shop_id, p_customer_id, 'redeem', -v_redeem_total, p_id,
              case when p_redeemed_reward_id is not null then 'reward redemption'
                   else 'bill redemption' end, v_balance);
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

-- ─── expire_stale_points: FIFO consumption, stale remainder expires ──

create or replace function public.expire_stale_points()
returns table (customers_checked bigint, points_expired bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid;
  v_expiry_days integer;
  v_customer record;
  v_entry record;
  v_aged bigint := 0;   -- alive points from earns past the cutoff
  v_fresh bigint := 0;  -- alive points from earns inside the window
  v_burn bigint;
  v_from_aged bigint;
  v_stale bigint;
  v_stale_total bigint := 0;
  v_checked bigint := 0;
  v_new_balance integer;
begin
  select m.shop_id into v_shop
  from shop_members m where m.user_id = auth.uid()
  order by m.created_at limit 1;
  if v_shop is null then
    raise exception 'KADAI/no-shop: caller is not a shop member';
  end if;

  select points_expiry_days into v_expiry_days from shops where id = v_shop;
  if v_expiry_days is null then
    return query select 0::bigint, 0::bigint;
    return;
  end if;

  for v_customer in
    select c.id, c.points_balance
    from customers c
    where c.shop_id = v_shop and c.points_balance > 0
  loop
    v_aged := 0;
    v_fresh := 0;
    v_checked := v_checked + 1;

    -- FIFO replay: earns split into aged/fresh by the cutoff; redeems
    -- and expiries consume aged points first (oldest spent first).
    for v_entry in
      select type, points, created_at
      from loyalty_ledger
      where customer_id = v_customer.id
      order by created_at, id
    loop
      if v_entry.type = 'earn' then
        if v_entry.created_at < now() - make_interval(days => v_expiry_days) then
          v_aged := v_aged + v_entry.points;
        else
          v_fresh := v_fresh + v_entry.points;
        end if;
      elsif v_entry.type in ('redeem', 'expire') then
        v_burn := -v_entry.points;
        v_from_aged := least(v_aged, v_burn);
        v_aged := v_aged - v_from_aged;
        v_fresh := greatest(0, v_fresh - (v_burn - v_from_aged));
      else -- adjust: direct delta on the fresh bucket
        v_fresh := greatest(0, v_fresh + v_entry.points);
      end if;
    end loop;

    -- Only ledger-attributed points can age; never below real balance.
    v_stale := least(v_aged, v_customer.points_balance);

    if v_stale > 0 then
      update customers set points_balance = points_balance - v_stale
      where id = v_customer.id
      returning points_balance into v_new_balance;
      insert into loyalty_ledger (shop_id, customer_id, type, points, note, balance_after)
      values (v_shop, v_customer.id, 'expire', -v_stale,
              'expired after ' || v_expiry_days || ' days', v_new_balance);
      v_stale_total := v_stale_total + v_stale;
    end if;
  end loop;

  return query select v_checked, v_stale_total;
end;
$$;
