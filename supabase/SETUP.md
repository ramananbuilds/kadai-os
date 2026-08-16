# Standing up the Kadai OS backend

The database is plain Postgres (see `docs/adr/0004-domain-logic-in-postgres-rpcs.md`)
wrapped in Supabase for auth, realtime, and hosting. Everything below takes
about fifteen minutes.

## 1. Create the project

1. Create a project at supabase.com (any region close to your users;
   Mumbai `ap-south-1` for India).
2. Project Settings → API: copy the **Project URL** and **anon public key**.

## 2. Apply the schema

With the Supabase CLI:

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push          # applies supabase/migrations/*.sql in order
supabase db reset         # local dev alternative; also runs seed.sql
```

No CLI? Paste each file in `supabase/migrations/` (in filename order) into
the SQL Editor and run them. Optionally run `supabase/seed.sql` afterwards
for the demo shop.

Verify from the SQL Editor:

```sql
select count(*) from products;   -- 8 after seed
select * from daily_sales limit 5;
```

Or from the repo — this runs the exact same migrations on in-process
Postgres with Supabase auth shimmed:

```bash
pnpm --filter @kadai-os/api sql-smoke
```

## 3. Enable phone auth

Authentication → Providers → Phone:
- pick an SMS provider (Twilio, Vonage, or MSG91 for India)
- enter the provider's credentials
- keep "Confirm phone" ON (OTP flow)

For local testing without an SMS provider, enable the built-in test
provider — it logs OTPs to the server console.

## 4. Point the apps at it

```bash
cp apps/web/.env.example apps/web/.env.local   # fill in URL + anon key
```

Mobile uses `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(wired in Phase 3).

## 5. First sign-in flow

1. App sends OTP → user enters phone + code → Supabase returns a session
   with **no shop** (`session.shopId === null`).
2. App routes to onboarding → `createShopForOwner({ name, upiId })` →
   shop + bill counter + owner membership in one transaction.
3. Staff: they install the app and sign in once (creates their auth user),
   then the owner calls `addStaffMember(phone, '4321')`.
