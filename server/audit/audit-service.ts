if (typeof window !== 'undefined') {
  throw new Error('AuditService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { sanitizeLogData } from '@/server/logging/logger';
import { AppError } from '@/server/api/errors';

export interface AuditEventInput {
  tenantId?: string | null;
  actorUserId?: string | null;
  actorMembershipId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  mandatory?: boolean;
}

export class AuditLogFailedError extends AppError {
  constructor(message = 'Mandatory audit event could not be recorded') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
    this.name = 'AuditLogFailedError';
  }
}

export type AuditDbClient = Pick<PrismaClient, 'auditLog'>;

/**
 * Server-Side Audit Logging Service
 *
 * Implements an append-only audit trail for administrative and financial operations.
 *
 * Security Requirements:
 * - Enforces server-verified actor identities (actorUserId, actorMembershipId).
 * - Automatically redacts passwords, tokens, auth headers, and payment credentials.
 * - Supports transaction-aware database clients to ensure audit logs commit atomically.
 * - Tamper Notice: Application-level append-only operations do not make the database
 *   immutable at the SQL superuser level; dedicated PostgreSQL WORM or immutable triggers
 *   are recommended for strict compliance.
 */
export class AuditService {
  private readonly db: AuditDbClient;

  constructor(customDb?: AuditDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as AuditDbClient);
  }

  /**
   * Records an audit event into the append-only audit_logs ledger.
   */
  async recordAuditEvent(input: AuditEventInput, client?: AuditDbClient) {
    const action = input.action?.trim();
    const entityType = input.entityType?.trim();

    if (!action || !entityType) {
      if (input.mandatory) {
        throw new AuditLogFailedError('Audit action and entityType are required for mandatory audit events.');
      }
      return null;
    }

    const sanitizedBefore = input.beforeData ? (sanitizeLogData(input.beforeData) as any) : undefined;
    const sanitizedAfter = input.afterData ? (sanitizeLogData(input.afterData) as any) : undefined;
    const sanitizedMeta = input.metadata ? (sanitizeLogData(input.metadata) as any) : undefined;

    const dbClient = client ?? this.db;

    try {
      const record = await dbClient.auditLog.create({
        data: {
          tenantId: input.tenantId || null,
          actorUserId: input.actorUserId || null,
          actorMembershipId: input.actorMembershipId || null,
          action,
          entityType,
          entityId: input.entityId || null,
          description: input.description || null,
          beforeData: sanitizedBefore,
          afterData: sanitizedAfter,
          metadata: sanitizedMeta,
          ipAddress: input.ipAddress || null,
        },
      });

      return record;
    } catch (err) {
      console.error('[AUDIT_FAILURE] Failed to record audit log:', err);
      if (input.mandatory) {
        throw new AuditLogFailedError(`Mandatory audit record failed: ${action} on ${entityType}`);
      }
      return null;
    }
  }

  /**
   * Queries audit logs with tenant-scoping and pagination.
   */
  async listTenantAuditLogs(
    tenantId: string,
    options: {
      action?: string;
      entityType?: string;
      skip?: number;
      take?: number;
    } = {}
  ) {
    if (!tenantId) {
      throw new Error('tenantId is required to query tenant audit logs.');
    }

    return this.db.auditLog.findMany({
      where: {
        tenantId,
        ...(options.action ? { action: options.action } : {}),
        ...(options.entityType ? { entityType: options.entityType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip ?? 0,
      take: options.take ?? 20,
    });
  }
}

export const auditService = new AuditService();
