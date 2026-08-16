# Launch checklist — Kadai OS

Everything here needs accounts or hardware this repo can't create for
you. Each step is otherwise wired and ready.

## Backend (Supabase project)

1. Follow [`supabase/SETUP.md`](../supabase/SETUP.md) — project, migrations
   (`supabase db push`), phone auth. **OTP costs nothing to start:** demo
   backend (code `123456`) → local CLI test provider (OTPs in logs) →
   Firebase Phone Auth bridge (10K free verifications/month, no DLT
   paperwork — Supabase accepts Firebase tokens natively). Paid MSG91 /
   Twilio only if volume ever demands it.
2. **Backups**: Database → Backups → enable daily backups + PITR (Pro).
3. **Environments**: create `kadai-os-staging` and `kadai-os-prod` projects;
   push migrations to both; keep `.env.local` pointed at staging until
   cutover.
4. **Points expiry** (optional): schedule the nightly job in the SQL editor:
   ```sql
   select cron.schedule('kadai-expire-points', '30 2 * * *',
     $$ select public.expire_stale_points() $$);
   ```
   (pg_cron extension; only after shops set `points_expiry_days`.)

## Mobile (Play Store first)

1. `pnpm --filter @kadai-os/mobile exec eas build --profile preview --platform android`
   → install the APK on the counter phone; smoke-test the offline loop.
2. Set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS
   secrets (`eas secret:create`) before the production build.
3. Play Console: create the app, upload the
   `eas build --profile production --platform android` AAB, store listing.
   Android first — it dominates Indian retail counters.
4. iOS later: Apple Developer account, `eas build -p ios`, TestFlight,
   then App Store. ESC/POS Bluetooth transport rides the dev-client build
   (`eas build --profile development`).

## Web

1. Deploy `apps/web` (any static host; build is `pnpm --filter @kadai-os/web build`).
2. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for the target env.

## Observability (accounts needed — code entry points are `lib/api.ts`)

- **Sentry**: create a project per app; `pnpm --filter @kadai-os/web add @sentry/react`,
  initialize in `main.tsx` behind `VITE_SENTRY_DSN`; mobile: `sentry-expo`.
- **PostHog**: `posthog-js` on web behind `VITE_POSTHOG_KEY`; the checkout
  and loyalty events to track are `bill_created`, `reward_redeemed`,
  `points_expired`.

## Verification before flipping the switch

```bash
pnpm typecheck && pnpm --filter @kadai-os/api smoke && pnpm --filter @kadai-os/api sql-smoke
```

Then one real bill on the staging project end-to-end: offline → sync →
dashboard → receipt.
