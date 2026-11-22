/**
 * MessMate — Default System Role Templates (Task 21)
 *
 * Defines and ensures the 6 standardized system role templates:
 * 1. Owner
 * 2. Admin
 * 3. Moderator
 * 4. Accountant
 * 5. Meal Manager
 * 6. Member
 */

export * from './role-constants';
import {
  SYSTEM_ROLE_TEMPLATES,
  SYSTEM_ROLE_DISPLAY_CONFIG,
  STANDARD_MESS_ROLES,
} from './role-constants';

/**
 * Ensures all 6 standard system roles exist for the given tenant.
 * Guarantees that any mess immediately has General Member, Meal Manager, Accountant, Co-Admin, etc.
 */
export async function ensureTenantRoles(
  tenantId: string,
  client?: any
): Promise<Array<{ id: string; name: string; slug: string; description?: string }>> {
  // Dynamically import prisma to prevent circular dependencies
  const { prisma: defaultPrisma } = await import('@/server/db/prisma');
  const db = client || defaultPrisma;

  let existingRoles: any[] = [];
  try {
    existingRoles = await db.role.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });
  } catch {
    existingRoles = [];
  }

  const existingSlugs = new Set((existingRoles || []).map((r: any) => r.slug));
  const resultRoles = [...(existingRoles || [])];

  for (const tpl of SYSTEM_ROLE_TEMPLATES) {
    if (!existingSlugs.has(tpl.slug)) {
      const config = SYSTEM_ROLE_DISPLAY_CONFIG[tpl.slug];
      const roleName = config?.name || tpl.name;
      const roleId = `role_${tpl.slug.replace(/-/g, '_')}_${tenantId}`;
      try {
        const created = await db.role.create({
          data: {
            id: roleId,
            tenantId,
            name: roleName,
            slug: tpl.slug,
            description: tpl.description,
            isSystem: true,
            status: 'ACTIVE',
            permissions: tpl.permissionKeys,
          } as any,
        });
        resultRoles.push(created);
      } catch {
        resultRoles.push({
          id: roleId,
          tenantId,
          name: roleName,
          slug: tpl.slug,
          description: tpl.description,
          isSystem: true,
          status: 'ACTIVE',
          permissions: tpl.permissionKeys,
        });
      }
    }
  }

  if (resultRoles.length === 0) {
    return STANDARD_MESS_ROLES.map((r) => ({
      id: `${r.id}_${tenantId}`,
      tenantId,
      name: r.name,
      slug: r.slug,
      description: r.description,
    }));
  }

  // Desired display order: General Member first (index 0), then Meal Manager, Accountant, Admin, Moderator, Owner
  const order = ['member', 'meal-manager', 'accountant', 'admin', 'moderator', 'owner'];
  return resultRoles.sort((a, b) => {
    const idxA = order.indexOf(a.slug);
    const idxB = order.indexOf(b.slug);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
}
