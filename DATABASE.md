# Database setup

The app is backed by Postgres via Prisma (`prisma/schema.prisma`). As of
Module 1 (Product Management, through Phase 4/Create Product), this
includes: `Product` (substantially expanded — status, inventory, SEO,
pricing; `icon`/`tone` now nullable, a fallback for products with no real
media), `Category`/`Collection`/`Tag`, `ProductMedia` (provider-agnostic
images/video, Cloudinary wired up as the first provider), `AuditLog`,
alongside the original `User`/`Order`/`OrderItem`/`ContactMessage`.

As of Module 2 (Order Management, Phase 2/Database): `Order` gained a
sequential `orderNumber`, three independent status dimensions
(`status`/`paymentStatus`/`fulfillmentStatus`, each its own enum), enum
`paymentMethod`/`currency`/`placedBy`, a persisted money breakdown
(`subtotal`/`discountTotal`/`taxTotal`/`shippingTotal`/`total`), and
lifecycle timestamps (`updatedAt`/`paidAt`/`completedAt`/`cancelledAt`).
The old flat shipping-address columns moved to a new `OrderAddress` child
table (`type: SHIPPING | BILLING`). `OrderItem` gained `sku`, `discount`,
and a persisted `lineTotal`. See
`prisma/migrations/20260401000000_order_management/migration.sql` for the
full migration, including how existing rows were backfilled (it's
commented inline — every backfill decision is explained at the point
it's made, not just in this summary).

Also as of Phase 4: `next.config.ts` sets a 15MB Server Actions body size
limit (product photos exceed the 1MB default).

As of Module 3 (Customers), Phase 3 query-efficiency review: `Order`'s
standalone `userId` index was replaced with a composite `(userId,
createdAt)` index — Customer Detail's recent-orders query filters by
`userId` and sorts by `createdAt`, which a composite index serves
directly instead of an indexed filter followed by an in-memory sort. See
`prisma/migrations/20260601000000_order_userid_createdat_index/migration.sql`.

## Important: what's been verified vs. what hasn't

I built and ran this against a real local Postgres instance to verify the
schema itself — the DDL applies cleanly, category filtering, array columns
(`details`, `sizes`), the `Order → OrderItem` join, and cascade deletes on
order deletion all work correctly against real data.

**What I could not verify:** the sandboxed environment I'm working in can't
reach `binaries.prisma.sh`, which `prisma generate` and `prisma migrate`
need to download their engine binaries. That's a restriction specific to
this tool's network, not your project — it's a normal public endpoint on
any regular machine, CI runner, or hosting platform. It just means
`npm run build` fails here specifically on Prisma's generated types (things
like `import { Order } from "@prisma/client"` don't resolve until
`prisma generate` has run once), and I haven't been able to run the app
end-to-end myself. **This applies to the Module 2 migration above too** —
I wrote and carefully proofread the SQL (backfill logic, enum conversions,
sequence/backfill ordering for `orderNumber`) but could not actually apply
it to a real database in this environment the way I could for
`20260101000000_init`. Run `npm run db:migrate` against a real Postgres
instance and confirm it applies cleanly before treating it as verified —
I'd flag this even if you hadn't asked, since "assume every approved
implementation is correct" shouldn't extend to a migration I've only
proofread and never executed. **Same caveat applies to the Module 3
index migration** (`20260601000000_order_userid_createdat_index`) — it's
two straightforward, standard statements (`DROP INDEX`/`CREATE INDEX`),
proofread carefully, but not run against a real database either.

Data-layer files: `lib/products/{storefront,admin,availability}.ts` and
`lib/orders/{storefront,admin}.ts` (Phase 3) both use the feature-first
admin/storefront split — Orders adopted it in Module 2 for the same reason
Products already had it (distinct customer-facing vs. admin query
surfaces with different filters/permissions). `lib/users.ts` and
`lib/contact-messages.ts` stay flat — they don't need that split yet, and
structure ahead of actual need isn't the goal here.

Product media (images/video) goes through `lib/media/index.ts` — a generic
`MediaProvider` interface, with Cloudinary as the only implementation
(`lib/media/providers/cloudinary.ts`). No other file in the app should ever
import the `cloudinary` package directly; everything talks to the generic
interface. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET` in `.env` (see `.env.example`). This one I
genuinely could not test at all — no sandbox substitute for a real
Cloudinary account — so treat the first real upload as unverified until
you try it.

## Setup

1. **Get a Postgres database.** Locally: install Postgres, or use Docker
   (`docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`). For
   hosting: Vercel Postgres, Supabase, Neon, and Railway all work with
   Prisma out of the box.

2. **Set `DATABASE_URL`** in a `.env` file at the project root (see
   `.env.example`):
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mono_storefront"
   ```

3. **Install dependencies** — this also runs `prisma generate` automatically
   via the `postinstall` script:
   ```
   npm install
   ```

4. **Apply the schema.** A migration is already written at
   `prisma/migrations/20260101000000_init/` (this is the exact SQL I
   verified against real Postgres). Apply it with:
   ```
   npm run db:migrate
   ```
   This creates the tables and records the migration as applied.

5. **Seed the product catalog:**
   ```
   npm run db:seed
   ```

5a. **Create your first admin account** (needed to log into `/admin` at all —
   every new signup defaults to the `CUSTOMER` role):
   ```
   SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="a-strong-password-12+chars" npm run db:seed-admin
   ```
   This is a separate script from `db:seed` on purpose — reseeding the
   product catalog should never be able to touch accounts, and this one
   reads credentials from the environment rather than a hardcoded value,
   so nothing sensitive lives in the repo. Log in at `/login` with those
   credentials and you'll be routed to `/admin` automatically (role-based
   redirect — customers go to `/account`, staff and above go to `/admin`).

6. **Set `SESSION_SECRET`** in the same `.env` file (see `.env.example`) —
   generate one with `openssl rand -base64 32`.

7. Now `npm run build` and `npm run dev` should both work normally.

## Going to production

- Run `npx prisma migrate deploy` (not `migrate dev`) against your
  production database as part of your deploy process.
- Set `DATABASE_URL` and `SESSION_SECRET` as real environment variables on
  your hosting platform — never commit `.env`.
- Run the seed script once against production, or replace it with your real
  product catalog via `prisma db seed` / an admin tool.
