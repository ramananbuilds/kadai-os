-- Kadai OS dev seed — mirrors the memory driver's demo data so every
-- environment (memory driver, local Supabase, PGlite harness) shows the
-- same shop. Run with `supabase db reset` on a fresh project.
--
-- The auth.users insert works on a local/fresh project where the service
-- role can write auth schema; on hosted projects create the owner via
-- the auth API instead and keep the rest of this file.

insert into auth.users (id) values
  ('00000000-0000-4000-8000-0000000000a1')
on conflict (id) do nothing;

insert into shops (id, name, upi_id) values
  ('00000000-0000-4000-8000-000000000001', 'Ravi''s Boutique', 'ravi@okhdfcbank')
on conflict (id) do nothing;

insert into shop_members (shop_id, user_id, role) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', 'owner')
on conflict (shop_id, user_id) do nothing;

-- Bill numbering continues the prototype's counter.
update bill_counters set next_number = 1088
where shop_id = '00000000-0000-4000-8000-000000000001';

insert into products (id, shop_id, name, sku, barcode, category, price_paise, cost_paise, stock_qty, reorder_level) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Blue Denim Jacket',   'BDJ-001', '8901234500011', 'Jackets',     249900, 140000,  8,  5),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'White Linen Shirt',   'WLS-001', '8901234500028', 'Shirts',       89900,  42000,  2, 10),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Nike Air Max 270',    'NAM-270', '8901234500035', 'Footwear',    899900, 580000,  5,  3),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Floral Summer Dress', 'FSD-022', null,           'Dresses',     185000,  90000, 11,  8),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'Black Slim Joggers',  'BSJ-044', null,           'Bottoms',     129900,  62000,  1, 10),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', 'Canvas Tote Bag',     'CTB-012', null,           'Accessories',  59900,  22000,  3, 15),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001', 'Oversized Hoodie',    'OVH-009', null,           'Tops',        199900,  98000, 14,  5),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001', 'Leather Belt Brown',  'LBB-003', null,           'Accessories',  54900,  20000,  7,  8)
on conflict (id) do nothing;

insert into customers (id, shop_id, name, phone, points_balance, lifetime_spend_paise, visit_count, last_visit_at) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Priya Sharma', '+919876543210', 4820, 14280000, 34, now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Rohan Verma',  '+918765432109', 2140,  6840000, 18, now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Aisha Khan',   '+917654321098',  890,  2460000,  8, now() - interval '1 day')
on conflict (id) do nothing;

insert into rewards (id, shop_id, name, kind, value, min_spend_paise, cost_points, expiry_days) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '₹500 Off Next Purchase', 'flat_off',    50000, 150000, 500, 30),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '10% Off Footwear',       'percent_off',    10, null,   200, 60)
on conflict (id) do nothing;
