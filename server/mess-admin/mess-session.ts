import { headers, cookies } from 'next/headers';
import { prisma } from '@/server/db/prisma';
import { tenantContextService, type TenantContext } from '@/server/tenant/tenant-context';
import { PERMISSION_CATALOG } from '@/server/rbac/permissions';

export interface AccessibleMess {
  id: string;
  name: string;
  slug: string;
  roleName: string;
  isCurrent: boolean;
}

export interface MessAdminSession {
  tenantContext: TenantContext;
  accessibleMesses: AccessibleMess[];
  userName: string;
  userEmail?: string | null;
}

/**
 * Server-side session resolver for Mess Admin layout and pages.
 * Resolves verified TenantContext and multi-mess switcher memberships.
 */
export async function getMessAdminSession(tenantSlug: string): Promise<MessAdminSession | null> {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();

    // 1. Resolve Actor userId from header or cookie
    const headerUserId = headersList.get('x-user-id');
    const cookieUserId = cookieStore.get('messmate_user_id')?.value;
    let userId = headerUserId || cookieUserId;

    // 2. Development Mode Persona Fallback:
    // If no explicit user header/cookie is passed in dev, find the tenant's Owner or Admin
    if (!userId && process.env.NODE_ENV === 'development') {
      try {
        const tenant = await prisma.tenant.findFirst({
          where: { OR: [{ slug: tenantSlug }, { id: tenantSlug }] },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { role: true, user: true },
              take: 5,
            },
          },
        });

        if (tenant && tenant.memberships.length > 0) {
          // Prefer Owner or Admin role if available
          const ownerMem =
            tenant.memberships.find(
              (m) => m.role.slug === 'owner' || m.role.slug === 'admin'
            ) || tenant.memberships[0];
          userId = ownerMem.userId;
        }
      } catch {
        // DB not available or offline
      }
    }

    // 3. Resolve Tenant Context
    let tenantContext: TenantContext | null = null;
    let userName = 'Mess Administrator';
    let userEmail: string | null = null;

    if (userId) {
      try {
        tenantContext = await tenantContextService.resolveTenantContext({
          userId,
          slug: tenantSlug,
        });

        // Fetch user profile info for header
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        if (user) {
          userName = user.name;
          userEmail = user.email;
        }
      } catch (err) {
        // If DB resolve fails in development, fallback to mock context below
        if (process.env.NODE_ENV !== 'development') {
          return null;
        }
      }
    }

    // 4. In development fallback if tenant or user isn't in DB yet
    if (!tenantContext && process.env.NODE_ENV === 'development') {
      const allPermissions = new Set(PERMISSION_CATALOG.map((p) => p.key));
      tenantContext = {
        userId: userId || 'usr_dev_mess_owner',
        tenantId: `tenant_${tenantSlug}`,
        tenantSlug,
        tenantName:
          tenantSlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ') || 'Prince Mess',
        tenantStatus: 'ACTIVE',
        membershipId: `mem_dev_${tenantSlug}`,
        membershipStatus: 'ACTIVE',
        roleId: 'role_dev_owner',
        roleSlug: 'owner',
        roleName: 'Owner',
        isOwner: true,
        permissions: allPermissions,
      };
      userName = 'Mess Owner';
      userEmail = userEmail || 'owner@messmate.dev';
    }

    if (!tenantContext) {
      return null;
    }

    // 5. Query user's accessible messes for the Mess Switcher
    let accessibleMesses: AccessibleMess[] = [];
    if (tenantContext.userId && tenantContext.userId !== 'usr_dev_mess_owner') {
      try {
        const memberships = await prisma.membership.findMany({
          where: {
            userId: tenantContext.userId,
            status: 'ACTIVE',
            tenant: { status: 'ACTIVE' },
          },
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
            role: { select: { name: true } },
          },
        });

        accessibleMesses = memberships.map((m) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
          roleName: m.role.name,
          isCurrent: m.tenant.slug === tenantSlug || m.tenant.id === tenantContext.tenantId,
        }));
      } catch {
        // Fallback to current
        accessibleMesses = [
          {
            id: tenantContext.tenantId,
            name: tenantContext.tenantName,
            slug: tenantContext.tenantSlug,
            roleName: tenantContext.roleName,
            isCurrent: true,
          },
        ];
      }
    } else {
      accessibleMesses = [
        {
          id: tenantContext.tenantId,
          name: tenantContext.tenantName,
          slug: tenantContext.tenantSlug,
          roleName: tenantContext.roleName,
          isCurrent: true,
        },
      ];
    }

    return {
      tenantContext,
      accessibleMesses,
      userName,
      userEmail,
    };
  } catch (error) {
    return null;
  }
}
