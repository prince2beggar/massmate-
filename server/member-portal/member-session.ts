import { headers, cookies } from 'next/headers';
import { prisma } from '@/server/db/prisma';
import { memberPortalService } from '@/server/member-portal/member-portal-service';
import type { MemberContext } from '@/server/api/with-member-auth';

/**
 * Server-side member session resolver for Member Portal layout and pages.
 * Resolves verified MemberContext for the current actor in this mess.
 */
export async function getMemberPortalSession(tenantSlug: string): Promise<MemberContext | null> {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();

    // 1. Resolve Actor userId from header or cookie
    const headerUserId = headersList.get('x-user-id');
    const cookieUserId = cookieStore.get('messmate_user_id')?.value || cookieStore.get('messmate_member_id')?.value;
    let userId = headerUserId || cookieUserId;

    // 2. Development Mode Persona Fallback:
    // If no explicit user header/cookie in dev, find the first ACTIVE resident member in this tenant
    if (!userId && process.env.NODE_ENV === 'development') {
      try {
        const tenant = await prisma.tenant.findFirst({
          where: { OR: [{ slug: tenantSlug }, { id: tenantSlug }] },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { role: true, user: true },
              take: 10,
            },
          },
        });

        if (tenant && tenant.memberships.length > 0) {
          // Prefer a regular member or border first, otherwise take the first active membership
          const residentMem =
            tenant.memberships.find(
              (m) => m.role.slug === 'member' || m.role.slug === 'border'
            ) || tenant.memberships[0];
          userId = residentMem.userId;
        }
      } catch {
        // DB not available or offline
      }
    }

    // 3. Fallback mock resident for development if no user is discovered
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'usr_resident_1';
    }

    if (!userId) {
      return null;
    }

    // 4. Resolve authoritative MemberContext via memberPortalService
    return await memberPortalService.resolveMemberContext(userId, tenantSlug);
  } catch (error) {
    return null;
  }
}
