if (typeof window !== 'undefined') {
  throw new Error('withPlatformAuth can only be executed in a server environment.');
}

import { type NextResponse } from 'next/server';
import { platformAuthService, type PlatformContext } from './platform-auth';
import type { PlatformRole } from '@/types/database';
import type { PlatformPermissionKey } from './platform-roles';
import { handleApiError } from '@/server/api/errors';
import { PlatformUnauthenticatedError, PlatformForbiddenError } from './errors';

export interface PlatformAuthOptions {
  permission?: PlatformPermissionKey;
  permissions?: PlatformPermissionKey[];
  allowedRoles?: PlatformRole[];
  requireAll?: boolean;
}

export interface AuthenticatedPlatformHandlerContext {
  platformContext: PlatformContext;
  params: Record<string, string | string[] | undefined>;
}

export type AuthenticatedPlatformHandler = (
  req: Request,
  context: AuthenticatedPlatformHandlerContext
) => Promise<NextResponse>;

/**
 * Higher-Order Route Wrapper for Central Super Admin API Routes
 *
 * Integrates:
 * 1. Platform administrator authentication verification
 * 2. Database platformRole resolution (rejects normal tenant users)
 * 3. Granular platform capability checks
 * 4. Centralized API error handling
 */
export function withPlatformAuth(
  options: PlatformAuthOptions = {},
  handler: AuthenticatedPlatformHandler
) {
  return async (
    req: Request,
    routeProps: { params: Promise<any> | any }
  ): Promise<NextResponse> => {
    try {
      const resolvedParams = routeProps?.params ? await Promise.resolve(routeProps.params) : {};

      // 1. Resolve actor userId
      // Checks x-platform-user-id, x-user-id, or dev platform header
      const userId =
        req.headers.get('x-platform-user-id') ||
        req.headers.get('x-user-id') ||
        (process.env.NODE_ENV === 'development'
          ? req.headers.get('x-dev-platform-user') || process.env.DEV_SUPER_ADMIN_USER_ID || 'dev_super_admin_owner'
          : null);

      if (!userId) {
        throw new PlatformUnauthenticatedError('Missing platform administrator session.');
      }

      // 2. Resolve verified PlatformContext (throws PlatformAccessDeniedError if not platform admin)
      // In dev fallback mode if mock DB user:
      let platformContext: PlatformContext;
      try {
        platformContext = await platformAuthService.resolvePlatformContext(userId);
      } catch (err) {
        // In local development before Neon DB credentials are set, allow default dev owner if requested
        if (
          process.env.NODE_ENV === 'development' &&
          (userId === 'dev_super_admin_owner' || userId.startsWith('dev_platform_'))
        ) {
          const devRole: PlatformRole =
            (req.headers.get('x-dev-platform-role') as PlatformRole) || 'PLATFORM_OWNER';
          const { getPlatformRolePermissions } = await import('./platform-roles');
          platformContext = {
            userId: 'usr_dev_super_admin',
            userName: 'Platform Owner (Dev)',
            userEmail: 'superadmin@messmate.dev',
            userPhone: '+8801700000000',
            platformRole: devRole,
            permissions: getPlatformRolePermissions(devRole),
            status: 'ACTIVE',
          };
        } else {
          throw err;
        }
      }

      // 3. Enforce Role restrictions if specified
      if (options.allowedRoles?.length && !options.allowedRoles.includes(platformContext.platformRole)) {
        throw new PlatformForbiddenError();
      }

      // 4. Enforce Granular Permission(s)
      if (options.permission) {
        platformAuthService.requirePlatformPermission(platformContext, options.permission);
      } else if (options.permissions?.length) {
        if (options.requireAll) {
          for (const perm of options.permissions) {
            platformAuthService.requirePlatformPermission(platformContext, perm);
          }
        } else {
          const hasAny = options.permissions.some((p) => platformContext.permissions.has(p));
          if (!hasAny) {
            throw new PlatformForbiddenError(options.permissions.join(', '));
          }
        }
      }

      // 5. Execute Handler
      return await handler(req, {
        platformContext,
        params: resolvedParams,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
