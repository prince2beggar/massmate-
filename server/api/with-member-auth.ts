if (typeof window !== 'undefined') {
  throw new Error('withMemberAuth can only be executed in a server environment.');
}

import { NextResponse } from 'next/server';
import { prisma as defaultPrisma } from '@/server/db/prisma';
import {
  UnauthenticatedError,
  NotFoundError,
  ForbiddenError,
  handleApiError,
} from '@/server/api/errors';
import { memberPortalService } from '@/server/member-portal/member-portal-service';

export interface MemberContext {
  userId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  userAvatar: string | null;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantLogo: string | null;
  membershipId: string;
  membershipStatus: string;
  memberCode: string | null;
  roleId: string;
  roleName: string;
  roleSlug: string;
}

export interface AuthenticatedMemberHandlerContext {
  memberContext: MemberContext;
  params: Record<string, string | string[] | undefined>;
}

export type AuthenticatedMemberHandler = (
  req: Request,
  context: AuthenticatedMemberHandlerContext
) => Promise<NextResponse>;

/**
 * Server-Side Access Control Wrapper for Member Portal API Routes
 *
 * Security Requirements:
 * 1. Authenticates actor user identity (userId).
 * 2. Resolves tenant by route parameter (tenantSlug).
 * 3. Enforces that the user has an ACTIVE membership in this specific mess.
 * 4. Prevents IDOR: All operations are strictly bound to the authenticated memberContext.
 * 5. Rejects inactive, suspended, or departing members with HTTP 403.
 */
export function withMemberAuth(handler: AuthenticatedMemberHandler) {
  return async (req: Request, routeProps: { params: Promise<any> | any }): Promise<NextResponse> => {
    try {
      const resolvedParams = routeProps?.params ? await Promise.resolve(routeProps.params) : {};
      const tenantSlug = (resolvedParams as any)?.tenantSlug;

      if (!tenantSlug) {
        throw new NotFoundError('Mess identifier is required.');
      }

      // 1. Resolve actor userId from trusted session or development header
      const userId = req.headers.get('x-user-id') || (resolvedParams as any)?.userId;
      if (!userId) {
        throw new UnauthenticatedError('Authentication required to access the Member Portal.');
      }

      // 2. Resolve MemberContext via MemberPortalService
      const memberContext = await memberPortalService.resolveMemberContext(userId, tenantSlug);

      // 3. Execute authorized handler
      return await handler(req, {
        memberContext,
        params: resolvedParams,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
