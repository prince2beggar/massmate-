if (typeof window !== 'undefined') {
  throw new Error('withTenantAuth can only be executed in a server environment.');
}

import { type NextResponse } from 'next/server';
import { tenantContextService, type TenantContext } from '@/server/tenant/tenant-context';
import { createTenantScopedDb, type TenantScopedDb } from '@/server/tenant/tenant-db';
import type { PermissionKey } from '@/server/rbac/permissions';
import { handleApiError } from './errors';
import { UnauthenticatedError } from '@/server/tenant/errors';

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
 * 1. User Authentication Context (trusted server session / x-user-id header)
 * 2. Multi-Tenant Context Resolution (Task 22)
 * 3. Granular RBAC Permission Enforcement (Task 21)
 * 4. TenantScopedDb initialization (Task 22)
 * 5. Centralized Error Handling & Sanitization (Task 23)
 */
export function withTenantAuth(
  options: TenantAuthOptions,
  handler: AuthenticatedTenantHandler
) {
  return async (req: Request, routeProps?: { params?: Promise<any> | any }): Promise<NextResponse> => {
    try {
      const resolvedParams = routeProps?.params ? await Promise.resolve(routeProps.params) : {};

      // 1. Resolve actor userId (from trusted server session or development auth header)
      const userId = req.headers.get('x-user-id') || (resolvedParams as any)?.userId;
      if (!userId) {
        throw new UnauthenticatedError('Missing authenticated user identity.');
      }

      // 2. Resolve verified TenantContext
      const tenantContext = await tenantContextService.resolveTenantContext({
        userId,
        slug: (resolvedParams as any)?.tenantSlug,
        tenantId: (resolvedParams as any)?.tenantId,
        headers: req.headers,
      });

      // 3. Enforce granular permission(s) if required
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

      // 4. Initialize TenantScopedDb
      const scopedDb = createTenantScopedDb(tenantContext);

      // 5. Execute handler
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
