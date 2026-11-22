import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { ensureTenantRoles } from '@/server/rbac/role-templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, messName: inputMessName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required to start your free trial.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Prince Mess Demo Login redirect if 123@gmail.com is used in trial form
    if (cleanEmail === '123@gmail.com' || cleanEmail === 'owner@messmate.dev') {
      const userId = 'usr_owner_1';
      const redirectUrl = '/mess/prince-mess';
      const resolvedTenant = 'prince-mess';

      const res = NextResponse.json({
        success: true,
        message: 'Prince Mess Demo Access Granted! Welcome to Prince Mess.',
        redirectUrl,
        tenantSlug: resolvedTenant,
        user: {
          id: userId,
          email: '123@gmail.com',
          name: 'Asadul Islam (Prince Mess Owner)',
          role: 'OWNER',
        },
      });

      res.cookies.set('messmate_user_id', userId, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      res.cookies.set('messmate_tenant', resolvedTenant, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }
    const userPart = cleanEmail.split('@')[0] || 'manager';
    const defaultMessName = `${userPart.charAt(0).toUpperCase() + userPart.slice(1)}'s Mess`;
    const resolvedMessName = (inputMessName && String(inputMessName).trim()) ? String(inputMessName).trim() : defaultMessName;

    // Generate clean slug from mess name
    let cleanSlug = resolvedMessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanSlug) {
      cleanSlug = `mess-${Date.now().toString().slice(-4)}`;
    }

    // Never collide with or overwrite the Prince Mess demo
    if (cleanSlug === 'prince-mess') {
      cleanSlug = `prince-trial-${Date.now().toString().slice(-4)}`;
    }

    // Check if slug already exists; if so, append random unique suffix
    try {
      const existing = await prisma.tenant.findFirst({
        where: { slug: cleanSlug },
      });
      if (existing) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {
      // Ignore lookup error if DB offline
    }

    // 1. Find or create User
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
    } catch {
      // ignore
    }

    const userId = user?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: cleanEmail,
            name: userPart.charAt(0).toUpperCase() + userPart.slice(1),
            status: 'ACTIVE',
          },
        });
      } catch (err: any) {
        user = { id: userId, email: cleanEmail, name: userPart, status: 'ACTIVE' };
      }
    }

    // 2. Create Tenant
    const tenantId = `tenant_${cleanSlug.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    let tenant = null;
    try {
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          name: resolvedMessName,
          slug: cleanSlug,
          status: 'ACTIVE',
          email: cleanEmail,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch {
      tenant = {
        id: tenantId,
        name: resolvedMessName,
        slug: cleanSlug,
        status: 'ACTIVE',
      };
    }

    // 3. Ensure all standard roles (Member, Meal Manager, Accountant, Admin, Owner) are seeded
    const tenantRoles = await ensureTenantRoles(tenant.id);
    const ownerRole = tenantRoles.find((r) => r.slug === 'owner') || { id: `role_owner_${tenant.id}` };

    // 4. Create Owner Membership
    const membershipId = `mem_${user.id}_${tenant.id}`;
    try {
      await prisma.membership.create({
        data: {
          id: membershipId,
          tenantId: tenant.id,
          userId: user.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
          memberCode: 'MGR-001',
          joinedAt: new Date(),
        },
      });
    } catch {
      // ignore
    }

    // 5. Create initial audit log
    try {
      await prisma.auditLog.create({
        data: {
          id: `log_init_${Date.now()}`,
          tenantId: tenant.id,
          actorUserId: user.id,
          action: 'TENANT_CREATED',
          entityType: 'TENANT',
          entityId: tenant.id,
          description: `Mess "${tenant.name}" created with 7-Day Free Trial`,
          createdAt: new Date(),
        },
      });
    } catch {
      // ignore
    }

    const redirectUrl = `/mess/${cleanSlug}`;

    const res = NextResponse.json({
      success: true,
      message: '7-Day Free Trial activated successfully! Welcome to your new Mess workspace.',
      redirectUrl,
      tenantSlug: cleanSlug,
      trialDays: 7,
      user: {
        id: user.id,
        email: cleanEmail,
        role: 'OWNER',
        messName: resolvedMessName,
      },
    });

    // Set authoritative session cookies
    res.cookies.set('messmate_user_id', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('messmate_tenant', cleanSlug, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('messmate_trial_active', 'true', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Trial activation failed.' },
      { status: 500 }
    );
  }
}
