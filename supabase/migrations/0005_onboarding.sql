-- Kadai OS onboarding RPCs (Phase 2).
-- Shop creation is one transaction: shop + bill counter (via trigger) +
-- owner membership. Staff join by phone after installing the app and
-- signing in once (their auth.users row must exist with a phone).

create or replace function public.create_shop_for_owner(
  p_name text,
  p_upi_id text,
  p_gstin text default null
) returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing uuid;
  v_shop shops;
begin
  if v_user is null then
    raise exception 'KADAI/unauthenticated: sign in first';
  end if;

  -- v1: one shop per user.
  select m.shop_id into v_existing
  from shop_members m where m.user_id = v_user
  order by m.created_at limit 1;
  if v_existing is not null then
    raise exception 'KADAI/already-member: this user already belongs to a shop';
  end if;

  insert into shops (name, upi_id, gstin)
  values (p_name, p_upi_id, p_gstin)
  returning * into v_shop;

  insert into shop_members (shop_id, user_id, role)
  values (v_shop.id, v_user, 'owner');

  return v_shop;
end;
$$;

-- Owner invites staff by the phone they signed in with. The 4-digit PIN
-- is stored as-is in v1 (shop-local quick-switch, not a secret that gates
-- server access — every RPC still requires the signed-in session).
create or replace function public.add_staff_member(
  p_phone text,
  p_pin text
) returns public.shop_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_shop uuid;
  v_target uuid;
  v_member shop_members;
begin
  select m.shop_id into v_shop
  from shop_members m
  where m.user_id = v_user and m.role = 'owner'
  order by m.created_at limit 1;
  if v_shop is null then
    raise exception 'KADAI/not-owner: only owners can invite staff';
  end if;

  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'KADAI/bad-pin: PIN must be exactly 4 digits';
  end if;

  select u.id into v_target from auth.users u where u.phone = p_phone limit 1;
  if v_target is null then
    raise exception 'KADAI/user-not-found: staff must install the app and sign in once first';
  end if;

  insert into shop_members (shop_id, user_id, role, pin)
  values (v_shop, v_target, 'staff', p_pin)
  returning * into v_member;

  return v_member;
end;
$$;
