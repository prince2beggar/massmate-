import { NextResponse } from 'next/server';
import { withTenantAuth } from '@/server/api/with-tenant-auth';
import { financeService } from '@/server/finance/finance-service';

export const GET = withTenantAuth(
  { permission: 'finance.view' },
  async (req, { tenantContext }) => {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');

    if (month) {
      const overview = await financeService.getFinancialOverview(
        tenantContext.tenantSlug,
        month
      );
      return NextResponse.json({
        success: true,
        data: overview,
      });
    }

    const periods = await financeService.listBillingPeriods(tenantContext.tenantSlug);
    return NextResponse.json({
      success: true,
      data: periods,
    });
  }
);

export const POST = withTenantAuth(
  { permission: 'finance.manage_bills' },
  async (req, { tenantContext }) => {
    const body = await req.json();

    const bills = await financeService.generateMonthlyBills(
      tenantContext.tenantSlug,
      body,
      tenantContext.userId
    );

    return NextResponse.json(
      {
        success: true,
        data: bills,
      },
      { status: 201 }
    );
  }
);
