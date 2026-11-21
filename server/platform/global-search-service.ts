import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import type { PlatformContext } from './platform-auth';

export interface GlobalSearchResult {
  query: string;
  tenants: Array<{ id: string; name: string; slug: string; city: string | null; status: string; link: string }>;
  users: Array<{ id: string; name: string; email: string | null; phone: string | null; status: string; link: string }>;
  subscriptions: Array<{ id: string; tenantName: string; planName: string; status: string; link: string }>;
  tickets: Array<{ id: string; ticketNumber: string; subject: string; status: string; priority: string; link: string }>;
  domains: Array<{ id: string; domainName: string; tenantName: string; domainType: string; status: string; link: string }>;
}

export class GlobalSearchService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Performs an authorized global platform search across entities.
   */
  async search(query: string, actorContext: PlatformContext): Promise<GlobalSearchResult> {
    const term = (query || '').trim();
    const emptyResult: GlobalSearchResult = {
      query: term,
      tenants: [],
      users: [],
      subscriptions: [],
      tickets: [],
      domains: [],
    };

    if (!term || term.length < 2) {
      return emptyResult;
    }

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return emptyResult;
      }
    }

    const permissions = actorContext.permissions;
    const limit = 5;

    const [tenants, users, subscriptions, tickets, domains] = await Promise.all([
      // Tenants search (requires tenants.view)
      permissions && permissions.has('tenants.view')
        ? this.db.tenant.findMany({
            where: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term, mode: 'insensitive' } },
                { city: { contains: term, mode: 'insensitive' } },
                { id: { equals: term } },
              ],
            },
            take: limit,
            select: { id: true, name: true, slug: true, city: true, status: true },
          })
        : [],

      // Users search (requires users.view)
      permissions && permissions.has('users.view')
        ? this.db.user.findMany({
            where: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
                { id: { equals: term } },
              ],
            },
            take: limit,
            select: { id: true, name: true, email: true, phone: true, status: true },
          })
        : [],

      // Subscriptions search (requires subscriptions.view)
      permissions && permissions.has('subscriptions.view')
        ? this.db.subscription.findMany({
            where: {
              OR: [
                { tenant: { name: { contains: term, mode: 'insensitive' } } },
                { plan: { name: { contains: term, mode: 'insensitive' } } },
              ],
            },
            take: limit,
            select: {
              id: true,
              status: true,
              tenant: { select: { name: true } },
              plan: { select: { name: true } },
            },
          })
        : [],

      // Tickets search (requires support.view)
      permissions && permissions.has('support.view')
        ? this.db.supportTicket.findMany({
            where: {
              OR: [
                { ticketNumber: { contains: term, mode: 'insensitive' } },
                { subject: { contains: term, mode: 'insensitive' } },
                { requester: { name: { contains: term, mode: 'insensitive' } } },
              ],
            },
            take: limit,
            select: { id: true, ticketNumber: true, subject: true, status: true, priority: true },
          })
        : [],

      // Domains search (requires domains.view)
      permissions && permissions.has('domains.view')
        ? this.db.domain.findMany({
            where: {
              OR: [
                { domainName: { contains: term, mode: 'insensitive' } },
                { tenant: { name: { contains: term, mode: 'insensitive' } } },
              ],
            },
            take: limit,
            select: {
              id: true,
              domainName: true,
              domainType: true,
              status: true,
              tenant: { select: { name: true } },
            },
          })
        : [],
    ]);

    return {
      query: term,
      tenants: (tenants || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        city: t.city,
        status: t.status,
        link: `/super-admin/tenants/${t.id}`,
      })),
      users: (users || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        link: `/super-admin/users?search=${encodeURIComponent(u.id)}`,
      })),
      subscriptions: (subscriptions || []).map((s: any) => ({
        id: s.id,
        tenantName: s.tenant?.name || 'Unknown',
        planName: s.plan?.name || 'Starter',
        status: s.status,
        link: `/super-admin/subscriptions`,
      })),
      tickets: (tickets || []).map((tk: any) => ({
        id: tk.id,
        ticketNumber: tk.ticketNumber,
        subject: tk.subject,
        status: tk.status,
        priority: tk.priority,
        link: `/super-admin/support`,
      })),
      domains: (domains || []).map((d: any) => ({
        id: d.id,
        domainName: d.domainName,
        tenantName: d.tenant?.name || 'Unknown',
        domainType: d.domainType,
        status: d.status,
        link: `/super-admin/domains?search=${encodeURIComponent(d.domainName)}`,
      })),
    };
  }
}

export const globalSearchService = new GlobalSearchService();
