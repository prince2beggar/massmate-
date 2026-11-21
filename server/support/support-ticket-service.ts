import { prisma } from '@/server/db/prisma';
import { inspectDatabaseConfig } from '@/server/db/config';
import { auditService } from '@/server/audit/audit-service';
import { PlatformForbiddenError, PlatformNotFoundError, PlatformValidationError } from '@/server/platform/errors';
import type { PlatformContext } from '@/server/platform/platform-auth';
import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/database';

export interface SupportTicketFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  status?: SupportTicketStatus;
  assignedStaffId?: string | 'UNASSIGNED';
  tenantId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface SupportTicketDto {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  messageCount: number;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessageDto {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorName: string;
  authorEmail: string | null;
  isStaff: boolean;
  message: string;
  isInternal: boolean;
  attachments: any;
  createdAt: string;
}

export interface SupportTicketDetailDto extends SupportTicketDto {
  messages: SupportTicketMessageDto[];
}

export interface CreateTicketInput {
  subject: string;
  description?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  tenantId?: string;
}

export class SupportTicketService {
  private db: any;
  private isCustomDb: boolean;

  constructor(customDb?: any) {
    this.db = customDb || prisma;
    this.isCustomDb = !!customDb;
  }

  /**
   * Generates a unique readable ticket reference.
   */
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TICK-${timestamp}-${rand}`;
  }

  /**
   * Retrieves aggregated KPI counters for the support center.
   */
  async getTicketStats(): Promise<{
    total: number;
    new: number;
    open: number;
    inProgress: number;
    waitingCustomer: number;
    resolved: number;
    closed: number;
  }> {
    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return { total: 0, new: 0, open: 0, inProgress: 0, waitingCustomer: 0, resolved: 0, closed: 0 };
      }
    }

    const [total, newCount, openCount, inProgressCount, waitingCount, resolvedCount, closedCount] =
      await Promise.all([
        this.db.supportTicket.count(),
        this.db.supportTicket.count({ where: { status: 'NEW' } }),
        this.db.supportTicket.count({ where: { status: 'OPEN' } }),
        this.db.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        this.db.supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
        this.db.supportTicket.count({ where: { status: 'RESOLVED' } }),
        this.db.supportTicket.count({ where: { status: 'CLOSED' } }),
      ]);

    return {
      total,
      new: newCount,
      open: openCount,
      inProgress: inProgressCount,
      waitingCustomer: waitingCount,
      resolved: resolvedCount,
      closed: closedCount,
    };
  }

  /**
   * Lists support tickets with server-side pagination, search, and filtering.
   */
  async listTickets(query: SupportTicketFilterQuery = {}): Promise<{
    tickets: SupportTicketDto[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    if (!this.isCustomDb) {
      const config = inspectDatabaseConfig();
      if (!config.configured) {
        return {
          tickets: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };
      }
    }

    const where: any = {};

    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.status) where.status = query.status;
    if (query.tenantId) where.tenantId = query.tenantId;

    if (query.assignedStaffId) {
      if (query.assignedStaffId === 'UNASSIGNED') {
        where.assignedStaffId = null;
      } else {
        where.assignedStaffId = query.assignedStaffId;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { requester: { name: { contains: term, mode: 'insensitive' } } },
        { requester: { email: { contains: term, mode: 'insensitive' } } },
        { tenant: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [totalCount, rawTickets] = await Promise.all([
      this.db.supportTicket.count({ where }),
      this.db.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          description: true,
          category: true,
          priority: true,
          status: true,
          requesterUserId: true,
          requester: {
            select: { name: true, email: true },
          },
          tenantId: true,
          tenant: {
            select: { name: true, slug: true },
          },
          assignedStaffId: true,
          assignedStaff: {
            select: { name: true },
          },
          _count: {
            select: { messages: true },
          },
          resolvedAt: true,
          closedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const tickets: SupportTicketDto[] = rawTickets.map((t: any) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      requesterUserId: t.requesterUserId,
      requesterName: t.requester?.name || 'Unknown',
      requesterEmail: t.requester?.email || null,
      tenantId: t.tenantId,
      tenantName: t.tenant?.name || null,
      tenantSlug: t.tenant?.slug || null,
      assignedStaffId: t.assignedStaffId,
      assignedStaffName: t.assignedStaff?.name || null,
      messageCount: t._count?.messages || 0,
      resolvedAt: t.resolvedAt?.toISOString() || null,
      closedAt: t.closedAt?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return {
      tickets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Retrieves ticket details and messages with strict privacy and access controls.
   */
  async getTicketById(
    id: string,
    options: { includeInternalNotes?: boolean; tenantScope?: string } = {}
  ): Promise<SupportTicketDetailDto> {
    const ticket = await this.db.supportTicket.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, platformRole: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, platformRole: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new PlatformNotFoundError(`Support ticket '${id}' not found`);
    }

    // Tenant Isolation Check: Prevent unrelated tenants from accessing private tickets
    if (options.tenantScope && ticket.tenantId !== options.tenantScope) {
      throw new PlatformForbiddenError('Access denied: ticket does not belong to the requested tenant');
    }

    // Internal Notes Privacy Check: Customers/tenants never see internal notes
    let filteredMessages = ticket.messages || [];
    if (options.includeInternalNotes === false) {
      filteredMessages = filteredMessages.filter((m: any) => !m.isInternal);
    }

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      requesterUserId: ticket.requesterUserId,
      requesterName: ticket.requester?.name || 'Unknown',
      requesterEmail: ticket.requester?.email || null,
      tenantId: ticket.tenantId,
      tenantName: ticket.tenant?.name || null,
      tenantSlug: ticket.tenant?.slug || null,
      assignedStaffId: ticket.assignedStaffId,
      assignedStaffName: ticket.assignedStaff?.name || null,
      messageCount: ticket.messages?.length || 0,
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      closedAt: ticket.closedAt?.toISOString() || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: filteredMessages.map((m: any) => ({
        id: m.id,
        ticketId: m.ticketId,
        authorUserId: m.authorUserId,
        authorName: m.author?.name || 'Unknown',
        authorEmail: m.author?.email || null,
        isStaff: !!m.author?.platformRole,
        message: m.message,
        isInternal: m.isInternal,
        attachments: m.attachments,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Creates a new support ticket.
   */
  async createTicket(
    input: CreateTicketInput,
    actor: { userId: string; tenantId?: string }
  ): Promise<SupportTicketDetailDto> {
    if (!input.subject || input.subject.trim().length < 3) {
      throw new PlatformValidationError('Ticket subject must be at least 3 characters');
    }

    const ticketNumber = this.generateTicketNumber();
    const priority = input.priority || 'NORMAL';
    const category = input.category || 'GENERAL_INQUIRY';
    const tenantId = input.tenantId || actor.tenantId || null;

    const ticket = await this.db.supportTicket.create({
      data: {
        ticketNumber,
        subject: input.subject.trim(),
        description: input.description?.trim() || null,
        category,
        priority,
        status: 'NEW',
        requesterUserId: actor.userId,
        tenantId,
      },
    });

    // Add initial message if description was provided
    if (input.description && input.description.trim()) {
      await this.db.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          authorUserId: actor.userId,
          message: input.description.trim(),
          isInternal: false,
        },
      });
    }

    // System notification
    try {
      await this.db.platformNotification.create({
        data: {
          type: priority === 'URGENT' ? 'SUPPORT_TICKET_URGENT' : 'SUPPORT_TICKET_NEW',
          title: `New Support Ticket [${ticketNumber}]`,
          message: `${priority === 'URGENT' ? '🚨 URGENT: ' : ''}${input.subject.trim()}`,
          link: `/super-admin/support`,
          metadata: { ticketId: ticket.id, ticketNumber, priority },
        },
      });
    } catch {
      // safe fallback
    }

    try {
      await auditService.recordAuditEvent({
        action: 'support_ticket.create',
        entityType: 'support_ticket',
        entityId: ticket.id,
        actorUserId: actor.userId,
        description: `Created support ticket ${ticketNumber}: "${input.subject}"`,
        afterData: { ticketNumber, priority, category, tenantId },
      });
    } catch {
      // safe fallback
    }

    return this.getTicketById(ticket.id, { includeInternalNotes: true });
  }

  /**
   * Assigns a ticket to a platform staff member.
   */
  async assignTicket(
    ticketId: string,
    assignedStaffId: string | null,
    actorContext: PlatformContext
  ): Promise<SupportTicketDetailDto> {
    if (!actorContext.permissions.has('support.manage')) {
      throw new PlatformForbiddenError('Unauthorized: requires "support.manage" permission to assign tickets');
    }

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, status: true, assignedStaffId: true },
    });

    if (!ticket) {
      throw new PlatformNotFoundError(`Ticket '${ticketId}' not found`);
    }

    // Auto move NEW status to OPEN upon assignment
    const nextStatus = ticket.status === 'NEW' && assignedStaffId ? 'OPEN' : ticket.status;

    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedStaffId,
        status: nextStatus,
      },
    });

    try {
      await auditService.recordAuditEvent({
        action: 'support_ticket.assign',
        entityType: 'support_ticket',
        entityId: ticketId,
        actorUserId: actorContext.userId,
        description: `Assigned ticket ${ticket.ticketNumber} to staff ${assignedStaffId || 'UNASSIGNED'}`,
        beforeData: { assignedStaffId: ticket.assignedStaffId, status: ticket.status },
        afterData: { assignedStaffId, status: nextStatus },
      });
    } catch {
      // safe fallback
    }

    return this.getTicketById(ticketId, { includeInternalNotes: true });
  }

  /**
   * Updates ticket lifecycle status.
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicketStatus,
    actorContext: PlatformContext,
    reason?: string
  ): Promise<SupportTicketDetailDto> {
    if (!actorContext.permissions.has('support.manage')) {
      throw new PlatformForbiddenError('Unauthorized: requires "support.manage" permission to update ticket status');
    }

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, status: true },
    });

    if (!ticket) {
      throw new PlatformNotFoundError(`Ticket '${ticketId}' not found`);
    }

    const updateData: any = { status };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    } else if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      // Reopening
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    try {
      await auditService.recordAuditEvent({
        action: 'support_ticket.status_change',
        entityType: 'support_ticket',
        entityId: ticketId,
        actorUserId: actorContext.userId,
        description: `Status for ticket ${ticket.ticketNumber} changed to ${status}${reason ? `. Note: ${reason}` : ''}`,
        beforeData: { status: ticket.status },
        afterData: { status, reason },
      });
    } catch {
      // safe fallback
    }

    return this.getTicketById(ticketId, { includeInternalNotes: true });
  }

  /**
   * Updates ticket priority.
   */
  async updateTicketPriority(
    ticketId: string,
    priority: SupportTicketPriority,
    actorContext: PlatformContext
  ): Promise<SupportTicketDetailDto> {
    if (!actorContext.permissions.has('support.manage')) {
      throw new PlatformForbiddenError('Unauthorized: requires "support.manage" permission to update priority');
    }

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, priority: true, subject: true },
    });

    if (!ticket) {
      throw new PlatformNotFoundError(`Ticket '${ticketId}' not found`);
    }

    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: { priority },
    });

    if (priority === 'URGENT') {
      try {
        await this.db.platformNotification.create({
          data: {
            type: 'SUPPORT_TICKET_URGENT',
            title: `Escalated Ticket [${ticket.ticketNumber}]`,
            message: `Priority escalated to URGENT: ${ticket.subject}`,
            link: `/super-admin/support`,
            metadata: { ticketId, ticketNumber: ticket.ticketNumber, priority },
          },
        });
      } catch {
        // safe fallback
      }
    }

    try {
      await auditService.recordAuditEvent({
        action: 'support_ticket.priority_change',
        entityType: 'support_ticket',
        entityId: ticketId,
        actorUserId: actorContext.userId,
        description: `Priority for ticket ${ticket.ticketNumber} changed from ${ticket.priority} to ${priority}`,
        beforeData: { priority: ticket.priority },
        afterData: { priority },
      });
    } catch {
      // safe fallback
    }

    return this.getTicketById(ticketId, { includeInternalNotes: true });
  }

  /**
   * Adds a message to a ticket (customer reply or internal note).
   * Validates that internal notes are strictly restricted to authorized platform staff.
   */
  async addMessage(
    ticketId: string,
    input: { message: string; isInternal?: boolean; attachments?: any },
    authorUserId: string,
    actorContext?: PlatformContext
  ): Promise<SupportTicketMessageDto> {
    if (!input.message || !input.message.trim()) {
      throw new PlatformValidationError('Message body cannot be empty');
    }

    const ticket = await this.db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, requesterUserId: true, status: true },
    });

    if (!ticket) {
      throw new PlatformNotFoundError(`Ticket '${ticketId}' not found`);
    }

    const isInternal = !!input.isInternal;

    // Strict Security Gate: Internal notes can only be posted by platform staff with support permissions
    if (isInternal) {
      if (!actorContext || !actorContext.permissions.has('support.manage')) {
        throw new PlatformForbiddenError('Only platform staff can post internal notes on support tickets');
      }
    }

    const message = await this.db.supportTicketMessage.create({
      data: {
        ticketId,
        authorUserId,
        message: input.message.trim(),
        isInternal,
        attachments: input.attachments || null,
      },
      include: {
        author: { select: { id: true, name: true, email: true, platformRole: true } },
      },
    });

    // Lifecycle status transition:
    // If staff posts a customer reply, mark as WAITING_CUSTOMER
    // If requester replies, move from WAITING_CUSTOMER to IN_PROGRESS
    let newStatus = ticket.status;
    if (!isInternal && actorContext && actorContext.permissions.has('support.manage')) {
      newStatus = 'WAITING_CUSTOMER';
    } else if (!isInternal && authorUserId === ticket.requesterUserId && ticket.status === 'WAITING_CUSTOMER') {
      newStatus = 'IN_PROGRESS';
    }

    await this.db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Audit log
    try {
      await auditService.recordAuditEvent({
        action: isInternal ? 'support_ticket.internal_note' : 'support_ticket.reply',
        entityType: 'support_ticket',
        entityId: ticketId,
        actorUserId: authorUserId,
        description: `${isInternal ? 'Added internal note to' : 'Sent reply on'} ticket ${ticket.ticketNumber}`,
        metadata: { isInternal, ticketNumber: ticket.ticketNumber },
      });
    } catch {
      // safe fallback
    }

    return {
      id: message.id,
      ticketId: message.ticketId,
      authorUserId: message.authorUserId,
      authorName: message.author?.name || 'Unknown',
      authorEmail: message.author?.email || null,
      isStaff: !!message.author?.platformRole,
      message: message.message,
      isInternal: message.isInternal,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

export const supportTicketService = new SupportTicketService();
