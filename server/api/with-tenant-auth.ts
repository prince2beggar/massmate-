if (typeof window !== 'undefined') {
  throw new Error('withTenantAuth can only be executed in a server environment.');
}

import { type NextResponse } from 'next/server';
import { tenantContextService, type TenantContext } from '@/server/tenant/tenant-context';
import { createTenantScopedDb, type TenantScopedDb } from '@/server/tenant/tenant-db';
import type { PermissionKey } from '@/server/rbac/permissions';
import { handleApiError } from './errors';
import { UnauthenticatedError } from '@/server/tenant/errors';

import { PERMISSION_CATALOG } from '@/server/rbac/permissions';

export interface TenantAuthOptions {
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
}

export interface AuthenticatedTenantHandlerContext {
  tenantContext: TenantContext;
  scopedDb: TenantScopedDb;
  params: Record<string, string | string[] | undefined>;
}

export type AuthenticatedTenantHandler = (
  req: Request,
  context: AuthenticatedTenantHandlerContext
) => Promise<NextResponse>;

/**
 * Higher-Order Route Wrapper for Tenant-Scoped API Routes
 *
 * Integrates:
 * 1. User Authentication Context (trusted server session / cookie / x-user-id header)
 * 2. Multi-Tenant Context Resolution (Task 22)
 * 3. Granular RBAC Permission Enforcement (Task 21)
 * 4. TenantScopedDb initialization (Task 22)
 * 5. Centralized Error Handling & Sanitization (Task 23)
 */
export function withTenantAuth(
  options: TenantAuthOptions,
  handler: AuthenticatedTenantHandler
) {
  return async (req: Request, routeProps: { params: Promise<any> | any }): Promise<NextResponse> => {
    try {
      const resolvedParams = routeProps?.params ? await Promise.resolve(routeProps.params) : {};

      // 1. Resolve actor userId (from header, cookie, or params)
      let userId = req.headers.get('x-user-id') || (resolvedParams as any)?.userId;
      const cookieHeader = req.headers.get('cookie') || '';

      if (!userId) {
        const match = cookieHeader.match(/messmate_user_id=([^;]+)/);
        if (match) {
          userId = decodeURIComponent(match[1].trim());
        }
      }

      if (!userId && process.env.NODE_ENV === 'development') {
        userId = 'usr_owner_1';
      }

      if (!userId) {
        throw new UnauthenticatedError('Missing authenticated user identity.');
      }

      // 2. Resolve tenant slug or ID
      let tenantSlug = (resolvedParams as any)?.tenantSlug;
      if (!tenantSlug) {
        const urlMatch = req.url.match(/\/mess\/([^/?#]+)/);
        if (urlMatch) {
          tenantSlug = urlMatch[1];
        }
      }
      if (!tenantSlug) {
        const match = cookieHeader.match(/messmate_tenant=([^;]+)/);
        if (match) {
          tenantSlug = decodeURIComponent(match[1].trim());
        }
      }

      // 3. Resolve verified TenantContext with development fallback
      let tenantContext: TenantContext;
      try {
        tenantContext = await tenantContextService.resolveTenantContext({
          userId,
          slug: tenantSlug,
          tenantId: (resolvedParams as any)?.tenantId,
          headers: req.headers,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          const allPermissions = new Set(PERMISSION_CATALOG.map((p) => p.key));
          tenantContext = {
            userId,
            tenantId: `tenant_${tenantSlug || 'mess'}`,
            tenantSlug: tenantSlug || 'prince-mess',
            tenantName: (tenantSlug || 'My Mess')
              .split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
            tenantStatus: 'ACTIVE',
            membershipId: `mem_${userId}`,
            membershipStatus: 'ACTIVE',
            roleId: 'role_admin',
            roleSlug: 'admin',
            roleName: 'Admin',
            isOwner: true,
            permissions: allPermissions,
          };
        } else {
          throw err;
        }
      }

      // 4. Enforce granular permission(s) if required (Owner and Admin have full control)
      const isPrivileged =
        tenantContext.isOwner ||
        tenantContext.roleSlug === 'owner' ||
        tenantContext.roleSlug === 'admin' ||
        tenantContext.permissions.has('*');

      if (!isPrivileged) {
        if (options.permission) {
          await tenantContextService.requireTenantPermission(tenantContext, options.permission);
        } else if (options.permissions?.length) {
          if (options.requireAll) {
            for (const perm of options.permissions) {
              await tenantContextService.requireTenantPermission(tenantContext, perm);
            }
          } else {
            const hasAny = options.permissions.some((p) => tenantContext.permissions.has(p));
            if (!hasAny) {
              throw new Error(`Action requires at least one of: [${options.permissions.join(', ')}]`);
            }
          }
        }
      }

      // 5. Initialize TenantScopedDb
      const scopedDb = createTenantScopedDb(tenantContext);

      // 6. Execute handler
      return await handler(req, {
        tenantContext,
        scopedDb,
        params: resolvedParams,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
