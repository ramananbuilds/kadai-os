# Changelog

All notable changes to Kadai OS. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
phase-scoped until first store release.

## [Unreleased]

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
