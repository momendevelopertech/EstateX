-- EstateX nullable-pair invariant constraints.
-- Enforces "exactly one of userId/guestSessionId is set" on Favorite and Comparison
-- (03-database-schema.md §8.4), and "at least one of projectId/unitId" on PaymentPlan.
-- These are application-independent DB guards backed by integration tests.

ALTER TABLE "Favorite"
  ADD CONSTRAINT "favorite_xor_owner"
  CHECK (("userId" IS NOT NULL)::int + ("guestSessionId" IS NOT NULL)::int = 1);

ALTER TABLE "Comparison"
  ADD CONSTRAINT "comparison_xor_owner"
  CHECK (("userId" IS NOT NULL)::int + ("guestSessionId" IS NOT NULL)::int = 1);

ALTER TABLE "PaymentPlan"
  ADD CONSTRAINT "payment_plan_owner"
  CHECK (("projectId" IS NOT NULL)::int + ("unitId" IS NOT NULL)::int >= 1);
