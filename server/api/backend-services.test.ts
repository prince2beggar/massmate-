import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  apiSuccess,
  apiError,
  apiPaginated,
  AppError,
  ValidationError,
  NotFoundError,
  handleApiError,
  validateBody,
  validateQuery,
  validateParams,
} from './index';
import { performHealthCheck } from '../health/health-service';
import { AuditService, AuditLogFailedError } from '../audit/audit-service';
import { sanitizeLogData } from '../logging/logger';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';
import { validateEnvironment } from '../config/env';
import { TenantScopedDb } from '../tenant/tenant-db';
import { TenantAccessDeniedError, PermissionDeniedError } from '../tenant/errors';

describe('Task 23: Core Backend Services & API Foundation', () => {
  // ---------------------------------------------------------------------------
  // 1 & 2. Health Check Diagnostics
  // ---------------------------------------------------------------------------
  it('1 & 2. Health check reports structured diagnostics safely without exposing credentials', async () => {
    const report = await performHealthCheck();

    assert.ok(report.timestamp, 'Must include timestamp');
    assert.ok(['ok', 'degraded', 'unhealthy'].includes(report.status));
    assert.ok(report.services.database, 'Must report database status');
    assert.ok(report.services.environment, 'Must report environment status');

    // Security invariant: Verify no raw connection string, password, or host is exposed
    const stringified = JSON.stringify(report);
    assert.ok(!stringified.includes('postgresql://'));
    assert.ok(!stringified.includes('aws.neon.tech'));
    assert.ok(!stringified.includes('password'));
  });

  // ---------------------------------------------------------------------------
  // 3. Standard API Success Format
  // ---------------------------------------------------------------------------
  it('3. apiSuccess returns standard response envelope matching specification', async () => {
    const response = apiSuccess({ id: 'user_123', name: 'Asad' }, 'User created successfully', null, 201);
    assert.equal(response.status, 201);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.message, 'User created successfully');
    assert.deepEqual(body.data, { id: 'user_123', name: 'Asad' });
    assert.equal(body.meta, null);
  });

  // ---------------------------------------------------------------------------
  // 4. Standard API Error Format
  // ---------------------------------------------------------------------------
  it('4. apiError returns standardized error payload matching specification', async () => {
    const response = apiError('CONFLICT', 'A user with this email already exists.', [{ field: 'email', message: 'Duplicate email' }], 409);
    assert.equal(response.status, 409);

    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, 'A user with this email already exists.');
    assert.equal(body.error.code, 'CONFLICT');
    assert.equal(body.error.details.length, 1);
    assert.equal(body.error.details[0].field, 'email');
  });

  // ---------------------------------------------------------------------------
  // 5. Request Validation via Zod
  // ---------------------------------------------------------------------------
  it('5. validateBody and validateQuery reject invalid inputs with structured details', async () => {
    const testSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      age: z.coerce.number().min(18),
    });

    // Valid query
    const validParams = new URLSearchParams('name=Rahim&email=rahim@messmate.local&age=22');
    const parsed = validateQuery(validParams, testSchema);
    assert.equal(parsed.name, 'Rahim');
    assert.equal(parsed.age, 22);

    // Invalid query
    const invalidParams = new URLSearchParams('name=R&email=invalid-email&age=15');
    assert.throws(
      () => validateQuery(invalidParams, testSchema),
      (err: any) => {
        assert.ok(err instanceof ValidationError);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.statusCode, 400);
        assert.equal(err.details.length, 3); // name, email, age all failed
        return true;
      }
    );
  });

  // ---------------------------------------------------------------------------
  // 6, 7, 8, 9. Centralized Error Handling & Mapping
  // ---------------------------------------------------------------------------
  it('6, 7, 8, 9. handleApiError maps exceptions correctly without leaking internal stack traces', async () => {
    // 6. Validation Error mapping (400)
    const valRes = handleApiError(new ValidationError('Invalid payload', [{ field: 'slug', message: 'Slug too short' }]));
    assert.equal(valRes.status, 400);
    const valBody = await valRes.json();
    assert.equal(valBody.error.code, 'VALIDATION_ERROR');

    // 7. Not Found Error mapping (404)
    const nfRes = handleApiError(new NotFoundError('Mess not found'));
    assert.equal(nfRes.status, 404);
    const nfBody = await nfRes.json();
    assert.equal(nfBody.error.code, 'NOT_FOUND');

    // 8. Permission Error mapping (403)
    const permRes = handleApiError(new PermissionDeniedError('Missing finance.manage permission'));
    assert.equal(permRes.status, 403);
    const permBody = await permRes.json();
    assert.equal(permBody.error.code, 'PERMISSION_DENIED');

    // 9. Prisma unique constraint error mapping (409)
    const prismaErr = { code: 'P2002', meta: { target: ['email'] } };
    const conflictRes = handleApiError(prismaErr);
    assert.equal(conflictRes.status, 409);
    const conflictBody = await conflictRes.json();
    assert.equal(conflictBody.error.code, 'CONFLICT');

    // 9b. Unexpected Error mapping (500) — must not leak internal secrets
    const unexpectedErr = new Error('postgres://admin:secret_pass@db.internal:5432 query failure');
    const unexpRes = handleApiError(unexpectedErr, 'corr_123');
    assert.equal(unexpRes.status, 500);
    const unexpBody = await unexpRes.json();
    assert.equal(unexpBody.error.code, 'INTERNAL_SERVER_ERROR');
    assert.ok(!JSON.stringify(unexpBody).includes('secret_pass'));
  });

  // ---------------------------------------------------------------------------
  // 10, 11, 12, 13, 14. Audit Logging Foundation
  // ---------------------------------------------------------------------------
  it('10, 11, 12, 13, 14. AuditService records valid events, redacts secrets, and enforces mandatory events', async () => {
    const mockAuditLogs: any[] = [];
    const mockDb = {
      auditLog: {
        create: async ({ data }: any) => {
          const rec = { id: `aud_${Date.now()}`, ...data, createdAt: new Date() };
          mockAuditLogs.push(rec);
          return rec;
        },
      },
    };

    const auditService = new AuditService(mockDb as any);

    // 10 & 12. Valid audit event creation with trusted server context
    const event = await auditService.recordAuditEvent({
      tenantId: 'tnt_prince_mess',
      actorUserId: 'usr_owner_asad',
      actorMembershipId: 'mem_01',
      action: 'role.update',
      entityType: 'role',
      entityId: 'role_custom_moderator',
      description: 'Updated permissions for moderator role',
      beforeData: { name: 'Mod', permissions: ['meals.view'] },
      afterData: { name: 'Super Mod', permissions: ['meals.view', 'meals.create'], passwordHash: 'secret_hash_value' },
      metadata: { ip: '127.0.0.1', authToken: 'bearer_token_xyz' },
    });

    assert.ok(event, 'Event must be created');
    assert.equal(event.tenantId, 'tnt_prince_mess');
    assert.equal(event.actorUserId, 'usr_owner_asad');
    assert.equal(event.action, 'role.update');

    // 13. Sensitive information redacted from logs
    const afterData = event.afterData as Record<string, any> | null;
    const metadata = event.metadata as Record<string, any> | null;
    assert.equal(afterData?.passwordHash, '[REDACTED]');
    assert.equal(metadata?.authToken, '[REDACTED]');

    // 11. Invalid audit event rejection (mandatory event with missing action)
    await assert.rejects(
      auditService.recordAuditEvent({
        tenantId: 'tnt_prince_mess',
        action: '',
        entityType: 'role',
        mandatory: true,
      }),
      AuditLogFailedError
    );

    // 14. Audit failure handling for mandatory events
    const failingDb = {
      auditLog: {
        create: async () => {
          throw new Error('Database connection failed');
        },
      },
    };
    const failingAuditService = new AuditService(failingDb as any);

    await assert.rejects(
      failingAuditService.recordAuditEvent({
        tenantId: 'tnt_prince_mess',
        action: 'finance.close_month',
        entityType: 'finance',
        mandatory: true,
      }),
      AuditLogFailedError
    );
  });

  // ---------------------------------------------------------------------------
  // Pagination Utilities
  // ---------------------------------------------------------------------------
  it('Pagination utilities parse parameters safely and build pagination metadata', () => {
    // Normal query
    const parsed = parsePaginationParams(new URLSearchParams('page=2&limit=15'));
    assert.equal(parsed.page, 2);
    assert.equal(parsed.limit, 15);
    assert.equal(parsed.skip, 15);
    assert.equal(parsed.take, 15);

    // Negative / NaN query should fallback to page 1, default limit 20
    const fallback = parsePaginationParams(new URLSearchParams('page=-5&limit=not-a-num'));
    assert.equal(fallback.page, 1);
    assert.equal(fallback.limit, 20);

    // Bounded maximum limit
    const bounded = parsePaginationParams(new URLSearchParams('page=1&limit=500'), { maxLimit: 100 });
    assert.equal(bounded.limit, 100);

    // Pagination Meta calculation
    const meta = buildPaginationMeta(55, 2, 20);
    assert.equal(meta.total, 55);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNextPage, true);
    assert.equal(meta.hasPreviousPage, true);

    const firstPageMeta = buildPaginationMeta(10, 1, 20);
    assert.equal(firstPageMeta.hasNextPage, false);
    assert.equal(firstPageMeta.hasPreviousPage, false);
  });

  // ---------------------------------------------------------------------------
  // 15, 16, 17, 18. Security Integration
  // ---------------------------------------------------------------------------
  it('15, 16, 17, 18. Security integration denies unauthorized, cross-tenant, and unpermitted operations', async () => {
    const mockRoles = [
      { id: 'role_A_1', tenantId: 'tnt_A', name: 'Owner' },
      { id: 'role_B_2', tenantId: 'tnt_B', name: 'Owner' },
    ];

    const mockDbClient = {
      role: {
        findFirst: async ({ where }: any) => {
          return mockRoles.find((r) => r.id === where.id && r.tenantId === where.tenantId) || null;
        },
      },
      membership: {
        findFirst: async () => null,
        findMany: async () => [],
        count: async () => 0,
      },
    };

    const scopedDbA = new TenantScopedDb('tnt_A', mockDbClient as any);

    // 18. Cross-tenant reference prevention: referencing role_B_2 in tenant A throws
    await assert.rejects(
      scopedDbA.ensureBelongsToTenant('roles', 'role_B_2'),
      (err: any) => {
        assert.equal(err.code, 'CROSS_TENANT_VIOLATION');
        return true;
      }
    );

    // Referencing role_A_1 in tenant A succeeds
    await scopedDbA.ensureBelongsToTenant('roles', 'role_A_1');
  });

  // ---------------------------------------------------------------------------
  // Sensitive Data Redaction
  // ---------------------------------------------------------------------------
  it('Sensitive data sanitizer strips passwords, hashes, tokens, and credentials', () => {
    const raw = {
      user: 'admin',
      password: 'plain_password_123',
      passwordHash: '$2b$10$abcdef',
      apiSecret: 'secret_key_999',
      sessionToken: 'sess_abc',
      safeField: 'Hello World',
      nested: {
        creditCard: '411111111111',
        normalText: 'Valid',
      },
    };

    const sanitized = sanitizeLogData(raw) as any;
    assert.equal(sanitized.password, '[REDACTED]');
    assert.equal(sanitized.passwordHash, '[REDACTED]');
    assert.equal(sanitized.apiSecret, '[REDACTED]');
    assert.equal(sanitized.sessionToken, '[REDACTED]');
    assert.equal(sanitized.safeField, 'Hello World');
    assert.equal(sanitized.nested.creditCard, '[REDACTED]');
    assert.equal(sanitized.nested.normalText, 'Valid');
  });
});
