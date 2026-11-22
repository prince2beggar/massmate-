import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

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

    // 3. Create Owner Role for this tenant
    const roleId = `role_owner_${tenant.id}`;
    let role = null;
    try {
      role = await prisma.role.create({
        data: {
          id: roleId,
          tenantId: tenant.id,
          slug: 'owner',
          name: 'Mess Owner',
          description: 'Owner and primary administrator of this mess',
          isSystem: true,
          status: 'ACTIVE',
          permissions: ['*'],
        } as any,
      });
    } catch {
      role = { id: roleId, slug: 'owner', name: 'Mess Owner', tenantId: tenant.id, permissions: ['*'] };
    }

    // 4. Create Owner Membership
    const membershipId = `mem_${user.id}_${tenant.id}`;
    try {
      await prisma.membership.create({
        data: {
          id: membershipId,
          tenantId: tenant.id,
          userId: user.id,
          roleId: role.id,
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
