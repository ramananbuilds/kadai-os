# Kadai OS — pnpm monorepo

Retail OS for small Indian shops: fast billing, stock, and a loyalty program
(points → tiers → rewards). Extracted from the Figma Make prototype into a
standalone multi-platform project.

## Development Server (Figma Make sandbox)

A Vite dev server serves the preview on `$PORT` (default 8443) using the
repo-root `vite.config.ts` shim, which points at `apps/web`. Hot reload works
as before — changes under `apps/web/src` are reflected immediately.

## Layout

- `apps/web` — Vite + React 19 + Tailwind v4 app (full parity + owner
  back-office). Currently holds the prototype screens; they are the design
  reference for the Phase 4 responsive rebuild.
- `apps/mobile` — Expo (React Native) app. Has its own `AGENTS.md` with
  Expo SDK 57 specifics — read it before touching mobile/native code.
- `packages/core` — the domain: types, paise/points integer math, zod wire
  schemas, id/phone helpers. No framework imports here.
- `packages/api` — the backend seam. `KadaiDriver` interface + memory driver
  (dev/demo) + supabase driver (billing/catalog/stock wired; auth in Phase
  2). **The ONLY package that may import `@supabase/supabase-js`.** Apps call
  `createKadaiApi(driver)`, never a driver directly.
- `packages/ui` — design tokens: `tokens.css` (web) and `src/tokens.ts`
  (React Native mirror). Keep the two in sync — same names, same values.
- `supabase/` — the database: `migrations/*.sql` (schema, RLS, `create_bill`
  RPC, reporting views) and `seed.sql`. Append-only journals are enforced by
  RLS policy, not convention. Domain language lives in `CONTEXT.md`;
  hard-to-reverse decisions in `docs/adr/`.
- Repo root `vite.config.ts` — the Figma Make shim described above. The real
  web config is `apps/web/vite.config.ts`.

## Commands

- `pnpm install` — install everything (node-linker=hoisted per `.npmrc`,
  required by Expo/Metro)
- `pnpm dev` — root Vite dev server on $PORT (8443), Figma Make entrypoint
- `pnpm dev:web` / `pnpm dev:mobile` — standalone app dev servers
- `pnpm typecheck` / `pnpm build` — turbo across all packages
- `pnpm --filter @kadai-os/api smoke` — executable spec of the billing
  transaction (money math, ledger, idempotency, stock guards)
- `pnpm --filter @kadai-os/api sql-smoke` — applies supabase/migrations to
  in-process Postgres (PGlite) and asserts the SQL seams (RPC behavior,
  RLS isolation, append-only enforcement, views)

## Invariants

- Money is **integer paise**, points are integers. Use `@kadai-os/core`
  helpers (`rupeesToPaise`, `formatINR`, `discountPaise`,
  `computeEarnedPoints`); never do float arithmetic on rupees.
- The loyalty ledger is append-only and server-authoritative.
- Bill ids are client-generated UUIDs and double as sync idempotency keys.
- Bills snapshot product name/sku/price; catalog edits never rewrite history.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to
  help"`), or escape them in single-quoted strings. An unescaped apostrophe
  in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
