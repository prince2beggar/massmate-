-- MessMate: Enable PostgreSQL Row-Level Security (RLS) for Tenant Isolation
-- Task 22 Migration

-- Enable Row-Level Security on tenant-scoped tables
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;

-- Policy for roles table
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "roles";
CREATE POLICY "tenant_isolation_policy" ON "roles"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  );

-- Policy for memberships table
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "memberships";
CREATE POLICY "tenant_isolation_policy" ON "memberships"
  FOR ALL
  USING (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  )
  WITH CHECK (
    "tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')
  );
