import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { ensureTenantRoles } from '@/server/rbac/role-templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role = 'ADMIN', tenantSlug: requestedTenantSlug, isDemo = false } = body;

    // 1. Quick 1-Click Persona Demo Logins (for Prince Mess testing)
    if (isDemo) {
      let userId = 'usr_owner_1';
      let redirectUrl = '/mess/prince-mess';
      let resolvedTenant = 'prince-mess';

      if (role === 'SUPERADMIN' || email?.includes('superadmin')) {
        userId = 'usr_superadmin_1';
        redirectUrl = '/super-admin';
      } else if (role === 'MEMBER' || email?.includes('resident')) {
        userId = 'usr_resident_1';
        redirectUrl = '/portal/prince-mess';
        resolvedTenant = 'prince-mess';
      } else {
        userId = 'usr_owner_1';
        redirectUrl = '/mess/prince-mess';
        resolvedTenant = 'prince-mess';
      }

      const res = NextResponse.json({
        success: true,
        message: 'Demo access granted.',
        redirectUrl,
        user: {
          id: userId,
          email: email || `${role.toLowerCase()}@messmate.dev`,
          role,
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

    // 2. Real User Login
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Prince Mess Official Demo Access (email: 123@gmail.com, pass: 12345 or any)
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

    // Check if user exists
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
    } catch {
      // ignore
    }

    // If user does not exist, seamlessly create user and their trial mess workspace
    if (!user) {
      const userPart = cleanEmail.split('@')[0] || 'user';
      const messName = `${userPart.charAt(0).toUpperCase() + userPart.slice(1)}'s Mess`;
      let cleanSlug = messName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!cleanSlug || cleanSlug === 'prince-mess') {
        cleanSlug = `mess-${Date.now().toString().slice(-4)}`;
      }

      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      try {
        user = await prisma.user.create({
          data: {
            id: newUserId,
            email: cleanEmail,
            name: userPart.charAt(0).toUpperCase() + userPart.slice(1),
            status: 'ACTIVE',
          },
        });
      } catch {
        user = { id: newUserId, email: cleanEmail, name: userPart, status: 'ACTIVE' };
      }

      // Create new tenant
      const tenantId = `tenant_${cleanSlug.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
      let tenant = null;
      try {
        tenant = await prisma.tenant.create({
          data: {
            id: tenantId,
            name: messName,
            slug: cleanSlug,
            status: 'ACTIVE',
            email: cleanEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch {
        tenant = { id: tenantId, name: messName, slug: cleanSlug, status: 'ACTIVE' };
      }

      // Seed all 6 standard roles and attach Owner membership
      const tenantRoles = await ensureTenantRoles(tenant.id);
      const ownerRole = tenantRoles.find((r) => r.slug === 'owner') || { id: `role_owner_${tenant.id}` };

      try {
        await prisma.membership.create({
          data: {
            id: `mem_${user.id}_${tenant.id}`,
            tenantId: tenant.id,
            userId: user.id,
            roleId: ownerRole.id,
            status: 'ACTIVE',
            memberCode: 'MGR-001',
            joinedAt: new Date(),
          },
        });

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
        message: 'Account created and 7-day trial activated! Welcome to MessMate.',
        redirectUrl,
        tenantSlug: cleanSlug,
        user: { id: user.id, email: cleanEmail, role: 'OWNER' },
      });

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
    }

    // User exists: Find their active memberships
    let memberships: any[] = [];
    try {
      memberships = await prisma.membership.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { tenant: true, role: true },
      });
    } catch {
      // ignore
    }

    let tenantSlug = requestedTenantSlug;
    let isResident = false;

    if (memberships.length > 0) {
      // Find matching tenant if specified, or pick first active mess
      const targetMembership =
        (requestedTenantSlug ? memberships.find((m) => m.tenant?.slug === requestedTenantSlug) : null) ||
        memberships[0];

      tenantSlug = targetMembership.tenant?.slug || 'prince-mess';
      isResident =
        targetMembership.role?.slug === 'resident' ||
        targetMembership.role?.slug === 'member';
    } else {
      // If user exists without active membership, check if requested tenant slug is valid or fallback
      tenantSlug = requestedTenantSlug || 'prince-mess';
    }

    const redirectUrl = isResident ? `/portal/${tenantSlug}` : `/mess/${tenantSlug}`;

    const res = NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      redirectUrl,
      tenantSlug,
      user: {
        id: user.id,
        email: cleanEmail,
        role: isResident ? 'MEMBER' : 'ADMIN',
      },
    });

    res.cookies.set('messmate_user_id', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('messmate_tenant', tenantSlug, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
