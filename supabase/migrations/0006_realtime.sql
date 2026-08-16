-- Kadai OS realtime (Phase 5): publish shop tables so postgres_changes
-- subscriptions receive INSERT/UPDATE/DELETE for the caller's shop
-- (RLS still scopes every row). No-op on vanilla Postgres — the PGlite
-- harness and any plain-Postgres deployment skip publication setup.

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach t in array array[
    'shops', 'products', 'stock_movements', 'customers',
    'loyalty_ledger', 'rewards', 'bills'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
