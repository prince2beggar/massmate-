if (typeof window !== 'undefined') {
  throw new Error('PlatformAuthService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import type { PlatformRole, UserStatus } from '@/types/database';
import {
  type PlatformPermissionKey,
  getPlatformRolePermissions,
  isPlatformRole,
} from './platform-roles';
import {
  PlatformUnauthenticatedError,
  PlatformAccessDeniedError,
  PlatformForbiddenError,
  PlatformUserInactiveError,
} from './errors';

export interface PlatformContext {
  userId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  platformRole: PlatformRole;
  permissions: Set<PlatformPermissionKey>;
  status: UserStatus;
}

export type PlatformAuthDbClient = Pick<PrismaClient, 'user'>;

/**
 * Server-Side Platform Authorization Service
 *
 * Enforces strict boundary between tenant-level management and central platform governance:
 * - Only users with an explicit `platformRole` are permitted.
 * - Normal Mess Owners, Tenant Admins, and Members have `platformRole = null` and are blocked.
 * - Frontend role claims are never trusted; every check verifies database records.
 * - Granular platform capabilities mapped from PlatformRole.
 */
export class PlatformAuthService {
  private readonly db: PlatformAuthDbClient;

  constructor(customDb?: PlatformAuthDbClient) {
    this.db = customDb ?? (defaultPrisma as unknown as PlatformAuthDbClient);
  }

  /**
   * Resolves and verifies PlatformContext for an authenticated platform user identity.
   * Secure Default-Deny: If user lacks platformRole, access is strictly denied.
   */
  async resolvePlatformContext(userId?: string | null): Promise<PlatformContext> {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new PlatformUnauthenticatedError();
    }

    const cleanUserId = userId.trim();

    const user = await this.db.user.findUnique({
      where: { id: cleanUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        platformRole: true,
      },
    });

    if (!user) {
      throw new PlatformUnauthenticatedError('User identity not found in platform directory.');
    }

    // Guard 1: User Account Lifecycle
    if (user.status !== 'ACTIVE') {
      throw new PlatformUserInactiveError(user.status);
    }

    // Guard 2: Platform Role Assignment
    // Normal mess owners/admins have platformRole === null -> STRICTLY DENIED
    if (!user.platformRole || !isPlatformRole(user.platformRole)) {
      throw new PlatformAccessDeniedError(
        'Access denied. Normal tenant administrator or member credentials cannot access Central Super Admin.'
      );
    }

    const permissions = getPlatformRolePermissions(user.platformRole);

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      platformRole: user.platformRole,
      permissions,
      status: user.status,
    };
  }

  /**
   * Enforces that the platform context holds a specific platform permission.
   */
  requirePlatformPermission(
    context: PlatformContext,
    permission: PlatformPermissionKey
  ): void {
    if (!context.permissions.has(permission)) {
      throw new PlatformForbiddenError(permission);
    }
  }

  /**
   * Resolves platform context and enforces required permission in a single call.
   */
  async validatePlatformAdmin(
    userId?: string | null,
    requiredPermission?: PlatformPermissionKey
  ): Promise<PlatformContext> {
    const context = await this.resolvePlatformContext(userId);
    if (requiredPermission) {
      this.requirePlatformPermission(context, requiredPermission);
    }
    return context;
  }
}

export const platformAuthService = new PlatformAuthService();
