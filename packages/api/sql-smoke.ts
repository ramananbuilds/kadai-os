/**
 * Phase 1 harness: applies supabase/migrations to an in-process Postgres
 * (PGlite) and asserts the SQL seams behave like the TypeScript executable
 * spec (smoke.ts). Run with:
 *
 *   pnpm --filter @kadai-os/api sql-smoke
 *
 * Seams under test (pre-agreed in the Phase 1 plan):
 *   1. migrations apply cleanly to a fresh database; seed loads
 *   2. create_bill() RPC — the same worked examples as smoke.ts
 *   3. RLS (shop isolation, append-only ledger) + reporting views
 *
 * Supabase-isms (auth.users, auth.uid()) are shimmed so vanilla Postgres
 * can run the exact migration files a real Supabase project would.
 */

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PGlite } from '@electric-sql/pglite'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../supabase/migrations')
const SEED_FILE = join(import.meta.dirname, '../../supabase/seed.sql')

// Fixture ids — same as the memory driver / smoke.ts.
const SHOP = '00000000-0000-4000-8000-000000000001'
const OWNER = '00000000-0000-4000-8000-0000000000a1'
const JACKET = '00000000-0000-4000-8000-000000000101'
const SHIRT = '00000000-0000-4000-8000-000000000102'
const PRIYA = '00000000-0000-4000-8000-000000000201'
const REWARD_FLAT = '00000000-0000-4000-8000-000000000301'

const FIXTURES = `
  insert into auth.users (id) values ('${OWNER}');
  insert into auth._current_uid (uid) values ('${OWNER}');

  insert into shops (id, name, upi_id) values ('${SHOP}', 'Harness Shop', 'ravi@okhdfcbank');
  insert into shop_members (shop_id, user_id, role) values ('${SHOP}', '${OWNER}', 'owner');
  update bill_counters set next_number = 1088 where shop_id = '${SHOP}';

  insert into products (id, shop_id, name, sku, price_paise, cost_paise, stock_qty, reorder_level) values
    ('${JACKET}', '${SHOP}', 'Blue Denim Jacket', 'BDJ-001', 249900, 140000, 8, 5),
    ('${SHIRT}',  '${SHOP}', 'White Linen Shirt', 'WLS-001',  89900,  42000, 2, 10);

  insert into customers (id, shop_id, name, phone, points_balance, lifetime_spend_paise, visit_count) values
    ('${PRIYA}', '${SHOP}', 'Priya Sharma', '+919876543210', 4820, 14280000, 34);

  insert into rewards (id, shop_id, name, kind, value, min_spend_paise, cost_points) values
    ('${REWARD_FLAT}', '${SHOP}', '₹500 Off Next Purchase', 'flat_off', 50000, 150000, 500);
`

async function freshDb(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key);
    create table if not exists auth._current_uid (uid uuid);
    create or replace function auth.uid() returns uuid language sql stable
      as $$ select uid from auth._current_uid $$;
  `)
  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    if (!file.endsWith('.sql')) continue
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  }
  return db
}

async function q(db: PGlite, sql: string): Promise<Record<string, unknown>[]> {
  return (await db.query(sql)).rows as Record<string, unknown>[]
}

const n = (v: unknown): number => Number(v)

async function createBill(db: PGlite, overrides: Record<string, unknown> = {}) {
  const params = {
    p_id: crypto.randomUUID(),
    p_customer_id: PRIYA,
    p_items: JSON.stringify([
      { product_id: JACKET, qty: 1 },
      { product_id: SHIRT, qty: 1 },
    ]),
    p_discount_percent: 10,
    p_redeemed_points: 0,
    p_redeemed_reward_id: null,
    p_tender: 'upi',
    ...overrides,
  }
  const row = (
    await q(
      db,
      `select * from create_bill(
         '${params.p_id}'::uuid,
         ${params.p_customer_id ? `'${params.p_customer_id}'::uuid` : 'null'},
         '${params.p_items}'::jsonb,
         ${params.p_discount_percent}::smallint,
         ${params.p_redeemed_points}::int,
         ${params.p_redeemed_reward_id ? `'${params.p_redeemed_reward_id}'::uuid` : 'null'},
         '${params.p_tender}'::public.tender)`,
    )
  )[0]
  return { row, id: params.p_id as string }
}

// ── Seam 1: migrations apply; seed loads ─────────────────────────

const seedDb = await freshDb()
await seedDb.exec(readFileSync(SEED_FILE, 'utf8'))
assert.equal((await q(seedDb, 'select count(*)::int c from shops'))[0].c, 1)
assert.equal((await q(seedDb, 'select count(*)::int c from products'))[0].c, 8)
assert.equal((await q(seedDb, 'select count(*)::int c from customers'))[0].c, 3)
console.log('✓ seam 1: migrations apply cleanly, seed loads')

// ── Seam 2: create_bill RPC (mirrors smoke.ts worked examples) ───

const db = await freshDb()
await db.exec(FIXTURES)

// Happy path — the exact bill from smoke.ts.
const { row: bill, id: billId } = await createBill(db)
assert.equal(n(bill.subtotal_paise), 339800)
assert.equal(n(bill.discount_paise), 33980)
assert.equal(n(bill.total_paise), 305820)
assert.equal(n(bill.earned_points), 30)
assert.equal(n(bill.number), 1088)
assert.equal(bill.status, 'completed')

// Stock decremented exactly once.
assert.equal(
  (await q(db, `select stock_qty::int s from products where id = '${JACKET}'`))[0].s,
  7,
)

// Customer aggregates + append-only ledger.
const priya = (await q(db, `select * from customers where id = '${PRIYA}'`))[0]
assert.equal(n(priya.points_balance), 4850) // 4820 + 30
assert.equal(n(priya.visit_count), 35)
assert.equal(n(priya.lifetime_spend_paise), 14280000 + 305820)
const ledger = await q(db, `select * from loyalty_ledger where customer_id = '${PRIYA}' order by created_at`)
assert.equal(ledger.length, 1)
assert.equal(ledger[0].type, 'earn')
assert.equal(n(ledger[0].points), 30)
assert.equal(n(ledger[0].balance_after), 4850)
console.log('✓ seam 2a: happy-path bill — totals, stock, ledger, aggregates')

// Idempotent replay returns the original bill, double-nothing.
const { row: replay } = await createBill(db, { p_id: billId })
assert.equal(n(replay.number), 1088)
assert.equal(
  (await q(db, `select stock_qty::int s from products where id = '${JACKET}'`))[0].s,
  7,
)
assert.equal((await q(db, `select count(*)::int c from loyalty_ledger`))[0].c, 1)
assert.equal((await q(db, `select count(*)::int c from bills`))[0].c, 1)
console.log('✓ seam 2b: replay is idempotent')

// Insufficient stock rejects (shirt has 1 left).
await assert.rejects(
  () => createBill(db, { p_items: JSON.stringify([{ product_id: SHIRT, qty: 5 }]) }),
  /insufficient-stock/i,
)
// Insufficient points rejects.
await assert.rejects(
  () => createBill(db, { p_redeemed_points: 999999 }),
  /insufficient-points/i,
)
// Walk-in cannot redeem.
await assert.rejects(
  () => createBill(db, { p_customer_id: null, p_redeemed_points: 100 }),
  /walk-in/i,
)
// Non-members cannot bill at all.
await db.exec(`update auth._current_uid set uid = null`)
await assert.rejects(() => createBill(db, { p_customer_id: null }), /not a shop member/i)
await db.exec(`update auth._current_uid set uid = '${OWNER}'`)
console.log('✓ seam 2c: stock, points, walk-in, membership guards all reject')

// ── Seam 3: RLS + append-only + views ────────────────────────────

// A second shop, invisible to the first.
const SHOP_B = '00000000-0000-4000-8000-000000000002'
const OWNER_B = '00000000-0000-4000-8000-0000000000a2'
const PRODUCT_B = '00000000-0000-4000-8000-000000000110'
await db.exec(`
  insert into auth.users (id) values ('${OWNER_B}');
  insert into shops (id, name, upi_id) values ('${SHOP_B}', 'Other Shop', 'other@upi');
  insert into shop_members (shop_id, user_id, role) values ('${SHOP_B}', '${OWNER_B}', 'owner');
  insert into products (id, shop_id, name, sku, price_paise, stock_qty) values
    ('${PRODUCT_B}', '${SHOP_B}', 'Alien Product', 'AP-999', 10000, 9);
`)

await db.exec(`
  create role kadai_app nologin;
  grant usage on schema public to kadai_app;
  grant select, insert, update, delete on all tables in schema public to kadai_app;
`)

// As shop A's owner: sees only shop A.
await db.exec(`set role kadai_app`)
assert.equal((await q(db, 'select count(*)::int c from products'))[0].c, 2)
assert.equal(
  (await q(db, `select count(*)::int c from products where id = '${PRODUCT_B}'`))[0].c,
  0,
)
// Append-only enforcement: no update/delete path exists for journal tables.
await db.exec(`update loyalty_ledger set points = 999999`)
assert.equal(
  (await q(db, 'select count(*)::int c from loyalty_ledger where points = 999999'))[0].c,
  0,
)
await db.exec(`delete from stock_movements`)
assert.equal((await q(db, 'select count(*)::int c from stock_movements'))[0].c, 2)
await db.exec(`reset role`)
console.log('✓ seam 3a: shop isolation + append-only enforcement')

// Views aggregate the fixture correctly.
const today = (await q(db, `select (created_at::date)::text d from bills where id = '${billId}'`))[0].d as string
const day = (await q(db, `select * from daily_sales where date = '${today}'`))[0]
assert.equal(n(day.bill_count), 1)
assert.equal(n(day.revenue_paise), 305820)
assert.equal(n(day.upi_paise), 305820)
assert.equal(n(day.cash_paise), 0)

const low = await q(db, 'select sku from low_stock_products order by sku')
assert.deepEqual(low.map((r) => r.sku), ['WLS-001'])

const stats = (await q(db, `select * from customer_stats where id = '${PRIYA}'`))[0]
assert.equal(stats.tier, 'gold') // 4850 pts: gold (2000) ≤ x < platinum (5000)
console.log('✓ seam 3b: daily_sales, low_stock, customer_stats views')

console.log('✓ sql-smoke: all seams passing')
