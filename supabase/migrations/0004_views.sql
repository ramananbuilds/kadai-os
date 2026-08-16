-- Kadai OS reporting views. security_invoker so RLS applies to the
-- querying user (default view behavior would run as owner and leak
-- across shops). These are the SQL surfaces the web back-office reads;
-- clients never aggregate the ledger themselves.

create view public.daily_sales
with (security_invoker = true) as
select
  shop_id,
  created_at::date as date,
  count(*)::int as bill_count,
  sum(total_paise) as revenue_paise,
  round(avg(total_paise)) as avg_bill_paise,
  sum(case tender when 'cash' then total_paise else 0 end) as cash_paise,
  sum(case tender when 'upi'  then total_paise else 0 end) as upi_paise,
  sum(case tender when 'card' then total_paise else 0 end) as card_paise
from public.bills
where status = 'completed'
group by shop_id, created_at::date;

create view public.low_stock_products
with (security_invoker = true) as
select
  p.id,
  p.shop_id,
  p.name,
  p.sku,
  p.stock_qty,
  p.reorder_level,
  p.reorder_level - p.stock_qty as shortfall
from public.products p
where p.is_active and p.stock_qty <= p.reorder_level;

create view public.customer_stats
with (security_invoker = true) as
select
  c.id,
  c.shop_id,
  c.name,
  c.phone,
  c.points_balance,
  c.lifetime_spend_paise,
  c.visit_count,
  c.last_visit_at,
  c.is_blocked,
  case
    when c.points_balance >= s.tier_platinum_points then 'platinum'
    when c.points_balance >= s.tier_gold_points then 'gold'
    else 'silver'
  end as tier
from public.customers c
join public.shops s on s.id = c.shop_id;
