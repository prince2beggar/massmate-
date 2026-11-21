import { headers, cookies } from 'next/headers';
import { platformAuthService, type PlatformContext } from './platform-auth';
import type { PlatformRole } from '@/types/database';
import { getPlatformRolePermissions } from './platform-roles';

export async function getPlatformSession(): Promise<PlatformContext | null> {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();

    // 1. Check direct platform user header
    const headerUserId =
      headersList.get('x-platform-user-id') || headersList.get('x-user-id');

    // 2. Check platform session cookie
    const cookieUserId = cookieStore.get('messmate_platform_user_id')?.value;
    const cookieRole = cookieStore.get('messmate_platform_role')?.value as PlatformRole | undefined;

    // Check if role is explicitly set to UNAUTHORIZED for testing
    if (cookieRole === ('UNAUTHORIZED' as any)) {
      return null;
    }

    const userId = headerUserId || cookieUserId;

    if (userId) {
      try {
        return await platformAuthService.resolvePlatformContext(userId);
      } catch (err) {
        // If DB user lookup fails but in dev mode, handle dev override below
        if (process.env.NODE_ENV !== 'development') {
          return null;
        }
      }
    }

    // 3. Development Fallback Persona:
    // In local development, provide a valid Platform Owner session so the Super Admin dashboard
    // can be inspected, navigated, and tested directly without requiring complex manual login state.
    if (process.env.NODE_ENV === 'development') {
      const devRole: PlatformRole = cookieRole && ['PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SUPPORT_STAFF', 'FINANCE_STAFF'].includes(cookieRole)
        ? cookieRole
        : 'PLATFORM_OWNER';

      return {
        userId: 'usr_dev_super_admin',
        userName: 'Platform Owner (Dev)',
        userEmail: 'superadmin@messmate.dev',
        userPhone: '+8801700000000',
        platformRole: devRole,
        permissions: getPlatformRolePermissions(devRole),
        status: 'ACTIVE',
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}
