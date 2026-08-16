# Changelog

All notable changes to Kadai OS. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
phase-scoped until first store release.

## [Unreleased]

### Changed
- The counter at `/` now renders the **actual Figma-generated screens**
  restored verbatim from the prototype commit — original markup, tab bar
  with the elevated Bill pill, dark mode via More → Settings — in a
  mobile-width column, auth-gated. (Screens had been re-interpreted in
  Phase 4; the originals are the source of truth again.)

## [0.6.1] — 2026-08-17 — Branding, themes, icon packs

### Changed
- "Kadai OS" branding everywhere: login screens, headers, member tier
  cards, HTML/site titles (was "Shop OS" in several spots).
- Manual theme control on both apps — system / light / dark — persisted
  (localStorage on web, SQLite kv on mobile) via a shared ThemeProvider
  pattern; web header cycles modes, mobile More screen has a selector.
- Zero emoji icons: web uses lucide-react, mobile uses
  @expo/vector-icons (Feather + Ionicons) — tab bars, nav, quick
  actions, login logo, scanner, print, rewards, theme selector.

## [0.6.0] — 2026-08-17 — Phase 6: loyalty engine + launch scaffolding

### Added
- Reward redemption is now fully server-side and atomic: redeeming a
  reward applies its discount **and** charges its `cost_points` inside
  `create_bill` (v2 in `0007_loyalty.sql`), recorded as the bill's
  `redeemed_points` with a single ledger entry.
- Points expiry: `shops.points_expiry_days` (null = never) plus
  `expire_stale_points()` — a FIFO replay where redeems consume the
  oldest points first and only never-spent aged earns expire, as
  append-only `expire` entries. Mirrored on the memory driver via
  `expireStalePoints()`; pg_cron scheduling documented in LAUNCH.md.
- EAS build profiles (`eas.json`: development/preview/production) and
  `docs/LAUNCH.md` — the launch checklist for everything needing
  accounts: PITR backups, staging/prod projects, Play-first submission,
  Sentry/PostHog wiring points.

### Fixed
- `create_bill` walk-in guard now also covers reward redemption
  (rewards always require a customer).

## [0.5.0] — 2026-08-17 — Phase 5: live sync

### Added
- `subscribe(shopId, onChange)` on the driver seam: invalidation signals
  (not payloads) so clients refetch through the driver and rows are
  mapped exactly once.
- Supabase Realtime channel per shop — one `postgres_changes`
  registration per table, RLS-scoped — plus `0006_realtime.sql`
  publishing the shop tables (a no-op on vanilla Postgres, so the PGlite
  harness still applies it).
- Memory driver emits the same signals from an in-process emitter on
  every mutation, so demo mode is realtime too — and the seam is
  smoke-tested (bill → bills/stock/ledger/customers signals,
  unsubscribe stops delivery).
- Session `version` counters on web and mobile: every page/screen
  refetches when a remote change lands — a bill on the counter phone
  appears on the owner's dashboard and staff devices without polling.

## [0.4.0] — 2026-08-17 — Phase 4: web rebuild + back-office

### Added
- Responsive web app (React Router): phone frame stripped; sidebar on
  desktop, bottom tabs on small screens; OS-preference dark mode via the
  shared tokens.
- Auth flow on web: phone-OTP login, first-run shop creation, session
  gate that routes no-shop users to onboarding.
- Keyboard-first billing page — type/↑↓/Enter to build the cart, customer
  pick, % discount, tender — checking out straight through `create_bill`
  (web is online-first), with receipt preview and 58 mm print-CSS.
- Owner back-office: Reports (7-day revenue chart, tender split, top
  products), Rewards & loyalty editor (points per ₹100, tier thresholds,
  reward catalog with retire), Settings (shop profile incl. UPI/GSTIN,
  staff list, backend indicator).
- Customers CRM: searchable list, tier cards, profile with tier-progress
  and the append-only loyalty ledger.
- Inventory CRUD: add-product form (paise-safe inputs), low-stock filter,
  counter adjustments via `adjust_stock`.
- `createReward` / `setRewardActive` on the driver seam (all three
  drivers in lockstep).

### Removed
- The Figma Make prototype screens (`apps/web/src/screens`) — the design
  reference served its purpose and lives in git history; the mobile app
  and shared tokens carry the visual system forward.

## [0.3.0] — 2026-08-17 — Phase 3: mobile app

### Added
- Expo Router screen stack: splash → onboarding → phone-OTP login → shop
  creation → tabs, with the prototype's elevated-Bill tab bar.
- Tab screens on `@kadai-os/ui` tokens with dark mode: Home (today's
  revenue, low stock, recent bills, pending-sync badge), Members (tier
  cards + progress), Stock (value/units/low stats, counter adjustments),
  More (backend info, sign out).
- The counter loop: catalog search, real barcode scanning (expo-camera),
  cart sheet with customer pick / % discount / tender, checkout into the
  SQLite outbox, receipt preview, print via the system dialog.
- Offline outbox (expo-sqlite) with a NetInfo reconnect worker draining
  through the idempotent `create_bill` RPC; failures stay queued with an
  attempts counter instead of vanishing.
- Receipt model + ESC/POS byte encoder in `@kadai-os/core` — pure,
  tested, 58 mm width-safe; HTML print sheet + `receiptBytes()` ready for
  the Bluetooth/USB transport in the native build.

### Notes
- Runtime verification on a device (Expo Go) is pending — this sandbox
  has no emulator; the app typechecks and the domain layer is suite-proven.

## [0.2.0] — 2026-08-17 — Phase 2: auth & onboarding

### Added
- `create_shop_for_owner()` and `add_staff_member()` RPCs — shop, bill
  counter, and owner membership commit as one transaction; staff join by
  phone after signing in once.
- Full driver surface on the Supabase driver: phone-OTP auth (`signInWithOtp`
  / `verifyOtp`), sessions with null-shop-until-onboarding semantics, shop
  CRUD, staff listing, catalog and customer CRUD.
- `buildUpiDeepLink()` in core — v1 payments: QR payload carrying the shop
  VPA, pre-filled amount, and bill note.
- Env-driven backend composition for web (`apps/web/src/lib/api.ts`) and
  `supabase/SETUP.md` — the ~15-minute live-project walkthrough.

### Changed
- Session type now carries `shopId: string | null` so the app can route
  first-time users to onboarding.

## [0.1.0] — 2026-08-16 — Phases 0–1: foundation

### Added
- pnpm + Turborepo monorepo: `apps/web` (the Figma Make prototype, still
  previewable through a root Vite shim), `apps/mobile` (Expo SDK 57),
  `packages/core`, `packages/api`, `packages/ui`.
- Domain model with integer-paise money, points/tier rules, and zod wire
  schemas; design tokens extracted once, consumed by web (CSS) and
  React Native (TS).
- `KadaiDriver` seam: in-memory driver seeded with the prototype's data is
  the executable spec; Supabase stays isolated to one file by design.
- Postgres schema (10 tables), RLS (append-only journals enforced by absent
  policies), `create_bill()` / `adjust_stock()` RPCs, `security_invoker`
  reporting views, demo seed.
- Two verification suites that must agree: TS `smoke` and PGlite `sql-smoke`
  (runs the real migrations on in-process Postgres with auth shimmed).
- Domain glossary (`CONTEXT.md`) and four ADRs.
