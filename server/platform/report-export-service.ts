import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import { auditService } from '@/server/audit/audit-service';
import { PlatformForbiddenError, PlatformValidationError } from './errors';
import type { PlatformContext } from './platform-auth';

export type ReportType = 'tenants' | 'subscriptions' | 'payments' | 'users' | 'domains' | 'tickets';

export class ReportExportService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Exports an authorized CSV report with strict permissions and audit logging.
   */
  async exportReport(
    reportType: ReportType,
    actorContext: PlatformContext
  ): Promise<{ filename: string; csvContent: string; rowCount: number }> {
    // Permission Verification
    if (!actorContext.permissions.has('reports.export')) {
      throw new PlatformForbiddenError('Unauthorized: requires "reports.export" permission to download platform reports');
    }

    let headers: string[] = [];
    let rows: string[][] = [];
    const timestamp = new Date().toISOString().split('T')[0];

    switch (reportType) {
      case 'tenants': {
        if (!actorContext.permissions.has('tenants.view')) {
          throw new PlatformForbiddenError('Unauthorized to export tenant records');
        }
        headers = ['Tenant ID', 'Tenant Name', 'Slug', 'Tenant Type', 'Status', 'Verification Status', 'City', 'Country', 'Created Date'];
        const tenants = await this.db.tenant.findMany({
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, slug: true, tenantType: true, status: true, verificationStatus: true, city: true, country: true, createdAt: true },
        });
        rows = tenants.map((t: any) => [
          t.id,
          t.name,
          t.slug,
          t.tenantType,
          t.status,
          t.verificationStatus,
          t.city || '',
          t.country,
          t.createdAt.toISOString(),
        ]);
        break;
      }

      case 'subscriptions': {
        if (!actorContext.permissions.has('subscriptions.view')) {
          throw new PlatformForbiddenError('Unauthorized to export subscription records');
        }
        headers = ['Tenant Name', 'Plan Name', 'Plan Type', 'Subscription Status', 'Trial Status', 'Locked Price BDT', 'Auto Renew', 'Created Date'];
        const subs = await this.db.subscription.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            tenant: { select: { name: true } },
            plan: { select: { name: true, planType: true } },
            status: true,
            trialStatus: true,
            priceLocked: true,
            autoRenewConsent: true,
            createdAt: true,
          },
        });
        rows = subs.map((s: any) => [
          s.tenant?.name || 'Unknown',
          s.plan?.name || 'Starter',
          s.plan?.planType || 'STARTER',
          s.status,
          s.trialStatus,
          Number(s.priceLocked || 0).toFixed(2),
          s.autoRenewConsent ? 'YES' : 'NO',
          s.createdAt.toISOString(),
        ]);
        break;
      }

      case 'payments': {
        if (!actorContext.permissions.has('revenue.view')) {
          throw new PlatformForbiddenError('Unauthorized to export payment records');
        }
        headers = ['Invoice Number', 'Tenant Name', 'Amount BDT', 'Payment Status', 'Payment Method', 'Transaction Ref', 'Period Start', 'Period End', 'Created Date'];
        const invoices = await this.db.subscriptionInvoice.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            invoiceNumber: true,
            tenant: { select: { name: true } },
            amount: true,
            paymentStatus: true,
            paymentMethod: true,
            transactionReference: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
          },
        });
        rows = invoices.map((inv: any) => [
          inv.invoiceNumber,
          inv.tenant?.name || 'Unknown',
          Number(inv.amount || 0).toFixed(2),
          inv.paymentStatus,
          inv.paymentMethod || 'N/A',
          inv.transactionReference || 'N/A',
          inv.periodStart ? inv.periodStart.toISOString() : '',
          inv.periodEnd ? inv.periodEnd.toISOString() : '',
          inv.createdAt.toISOString(),
        ]);
        break;
      }

      case 'users': {
        if (!actorContext.permissions.has('users.view')) {
          throw new PlatformForbiddenError('Unauthorized to export user records');
        }
        headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Account Status', 'Platform Role', 'Memberships Count', 'Registered Date'];
        const users = await this.db.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            platformRole: true,
            _count: { select: { memberships: true } },
            createdAt: true,
          },
        });
        rows = users.map((u: any) => [
          u.id,
          u.name,
          u.email || '',
          u.phone || '',
          u.status,
          u.platformRole || 'NONE',
          String(u._count?.memberships || 0),
          u.createdAt.toISOString(),
        ]);
        break;
      }

      case 'domains': {
        if (!actorContext.permissions.has('domains.view')) {
          throw new PlatformForbiddenError('Unauthorized to export domain records');
        }
        headers = ['Domain Name', 'Tenant Name', 'Domain Type', 'Primary', 'Verification Status', 'DNS Status', 'SSL Status', 'Operational Status', 'Created Date'];
        const domains = await this.db.domain.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            domainName: true,
            tenant: { select: { name: true } },
            domainType: true,
            isPrimary: true,
            verificationStatus: true,
            dnsStatus: true,
            sslStatus: true,
            status: true,
            createdAt: true,
          },
        });
        rows = domains.map((d: any) => [
          d.domainName,
          d.tenant?.name || 'Unknown',
          d.domainType,
          d.isPrimary ? 'YES' : 'NO',
          d.verificationStatus,
          d.dnsStatus,
          d.sslStatus,
          d.status,
          d.createdAt.toISOString(),
        ]);
        break;
      }

      case 'tickets': {
        if (!actorContext.permissions.has('support.view')) {
          throw new PlatformForbiddenError('Unauthorized to export support ticket records');
        }
        headers = ['Ticket Number', 'Subject', 'Category', 'Priority', 'Status', 'Requester Name', 'Tenant Name', 'Created Date', 'Resolved Date'];
        const tickets = await this.db.supportTicket.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            ticketNumber: true,
            subject: true,
            category: true,
            priority: true,
            status: true,
            requester: { select: { name: true } },
            tenant: { select: { name: true } },
            createdAt: true,
            resolvedAt: true,
          },
        });
        rows = tickets.map((t: any) => [
          t.ticketNumber,
          t.subject,
          t.category,
          t.priority,
          t.status,
          t.requester?.name || 'Unknown',
          t.tenant?.name || 'N/A',
          t.createdAt.toISOString(),
          t.resolvedAt ? t.resolvedAt.toISOString() : '',
        ]);
        break;
      }

      default:
        throw new PlatformValidationError(`Unknown report type: ${reportType}`);
    }

    const csvLines = [
      headers.map(this.escapeCsv).join(','),
      ...rows.map((row) => row.map(this.escapeCsv).join(',')),
    ];
    const csvContent = csvLines.join('\n');
    const filename = `messmate-report-${reportType}-${timestamp}.csv`;

    try {
      await auditService.recordAuditEvent({
        action: 'report.export',
        entityType: 'report',
        entityId: reportType,
        actorUserId: actorContext.userId,
        description: `Exported ${reportType} CSV report (${rows.length} rows)`,
        metadata: { reportType, rowCount: rows.length, filename },
      });
    } catch {
      // safe fallback
    }

    return { filename, csvContent, rowCount: rows.length };
  }
}

export const reportExportService = new ReportExportService();
