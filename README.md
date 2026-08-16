# Kadai OS

The counter operating system for small Indian retail shops — fast billing,
stock, and a loyalty program that brings customers back. One domain, three
clients (iOS, Android, web), one backend.

Points are the product's flywheel: every bill earns points, points climb
customers through Silver → Gold → Platinum tiers, tiers unlock rewards at
checkout. Because points behave like store credit, the backend treats them
like money — append-only ledger, integer math, server-authoritative.

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | Monorepo scaffold (apps + packages) | ✅ done |
| 1 | Postgres schema, RLS, `create_bill` RPC, views | ✅ done |
| 2 | Phone-OTP auth, shop onboarding, staff invites, driver surface | ✅ done |
| 3 | Mobile app: screen stack, barcode scanning, offline outbox, receipts | ✅ core loop (Bluetooth ESC/POS transport awaits the native build) |
| 4 | Web full-parity rebuild + owner back-office | ✅ done |
| 5 | Realtime sync across all clients | ✅ done (live-project verification pending) |
| 6 | Loyalty engine completion + launch scaffolding | ✅ done — see [docs/LAUNCH.md](docs/LAUNCH.md) for the account-dependent steps |

## Layout

```
apps/
  web/        Vite + React 19 + Tailwind v4 (prototype screens; Phase 4 rebuild)
  mobile/     Expo (React Native) app — iOS + Android from one codebase
packages/
  core/       Domain: types, integer-paise/points math, zod wire schemas, UPI links
  api/        KadaiDriver seam: memory driver (dev) + supabase driver (prod)
  ui/         Design tokens: tokens.css (web) + TS mirror (React Native)
supabase/
  migrations/ Schema, RLS policies, create_bill & onboarding RPCs, views
  seed.sql    Demo shop (mirrors the memory driver)
  SETUP.md    Stand up the live backend in ~15 minutes
docs/adr/     Decisions worth keeping (paise integers, append-only ledger, …)
CONTEXT.md    The project's domain language
```

## Getting started

```bash
pnpm install

pnpm dev               # web preview (Figma Make sandbox entrypoint, port 8443)
pnpm dev:web           # standalone web dev server
pnpm dev:mobile        # Expo dev server (scan the QR with Expo Go)

pnpm typecheck         # all packages
pnpm build             # turbo build

# The billing transaction, proven twice (TypeScript + real Postgres):
pnpm --filter @kadai-os/api smoke
pnpm --filter @kadai-os/api sql-smoke
```

Web runs on the seeded in-memory backend until you add
`apps/web/.env.local` (see `apps/web/.env.example`). To go live with auth,
sync, and persistence, follow [`supabase/SETUP.md`](supabase/SETUP.md).

## Why it looks like this

- **Money is integer paise, everywhere** — no float ever touches a rupee
  ([ADR 0001](docs/adr/0001-integer-paise-money.md)).
- **The loyalty ledger is append-only** — balances are derived; RLS has no
  update/delete path for it ([ADR 0002](docs/adr/0002-append-only-loyalty-ledger.md)).
- **Bills work offline** — client-generated bill ids are idempotency keys;
  the server re-prices from the live catalog
  ([ADR 0003](docs/adr/0003-offline-bills-with-idempotent-client-ids.md)).
- **Domain logic lives in Postgres RPCs** — one COMMIT boundary per bill,
  and the schema is portable off Supabase
  ([ADR 0004](docs/adr/0004-domain-logic-in-postgres-rpcs.md)).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
