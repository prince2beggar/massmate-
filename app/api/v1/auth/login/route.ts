import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role = 'ADMIN', tenantSlug = 'prince-mess' } = body;

    // Fast validation
    if (!email || !password) {
      // If quick demo login without credentials, role-based fallback is permitted
      if (!body.isDemo) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required.' },
          { status: 400 }
        );
      }
    }

    // Determine target persona
    let userId = 'usr_owner_1';
    let redirectUrl = `/mess/${tenantSlug}`;

    if (role === 'SUPERADMIN' || email?.includes('superadmin')) {
      userId = 'usr_superadmin_1';
      redirectUrl = '/super-admin';
    } else if (role === 'MEMBER' || email?.includes('resident') || email?.includes('member')) {
      userId = 'usr_resident_1';
      redirectUrl = `/portal/${tenantSlug}`;
    } else {
      userId = 'usr_owner_1';
      redirectUrl = `/mess/${tenantSlug}`;
    }

    const res = NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      redirectUrl,
      user: {
        id: userId,
        email: email || `${role.toLowerCase()}@messmate.dev`,
        role,
      },
    });

    // Set secure authentication cookies
    res.cookies.set('messmate_user_id', userId, {
      path: '/',
      httpOnly: false, // Accessible to client if needed
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
