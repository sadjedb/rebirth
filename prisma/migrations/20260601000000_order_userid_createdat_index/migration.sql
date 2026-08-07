-- Module 3 (Customers), Phase 3 query-efficiency review.
--
-- Customer Detail's recent-orders query (lib/customers/detail.ts) filters
-- Order by userId and sorts by createdAt descending. With only a
-- standalone userId index, Postgres can use it to find the matching rows
-- but then has to sort them in memory before applying the LIMIT — fine at
-- today's per-customer order volumes, but a composite index lets it
-- retrieve rows already in the required order instead.
--
-- The standalone userId index is dropped, not kept alongside the new
-- composite one: a composite index's leading column serves userId-only
-- lookups just as well (e.g. the groupBy in lib/customers/admin.ts, which
-- doesn't sort at all), so keeping both would only add index-maintenance
-- overhead on every Order write with no query benefit.

DROP INDEX "Order_userId_idx";
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
