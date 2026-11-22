import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const PATCH = withTenantAuth(
  { permission: 'finance.manage' },
  async (req, { tenantContext, params }) => {
    const { id } = await params;
    const categoryId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    const body = await req.json();

    const updated = await financeService.updateCategory(
      tenantContext.tenantSlug,
      categoryId,
      body,
      tenantContext.userId
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  }
);
