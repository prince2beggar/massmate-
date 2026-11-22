import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, messName = 'Prince Mess' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required to start your free trial.' },
        { status: 400 }
      );
    }

    // Generate or resolve tenant slug
    const cleanSlug = messName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'prince-mess';

    const userId = 'usr_owner_1';
    const redirectUrl = `/mess/${cleanSlug || 'prince-mess'}`;

    const res = NextResponse.json({
      success: true,
      message: '7-Day Free Trial activated successfully! Welcome to MessMate.',
      redirectUrl,
      tenantSlug: cleanSlug,
      trialDays: 7,
      user: {
        id: userId,
        email,
        role: 'OWNER',
        messName,
      },
    });

    // Set authoritative session cookies
    res.cookies.set('messmate_user_id', userId, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set('messmate_tenant', cleanSlug || 'prince-mess', {
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
