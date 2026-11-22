if (typeof window !== 'undefined') {
  throw new Error('DocumentService can only be executed in a server environment.');
}

import crypto from 'crypto';
import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/server/api/errors';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import { tenantNotificationService } from '@/server/notifications/tenant-notification-service';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export const ALLOWED_FILE_TYPES = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'doc',
  'docx',
  'xls',
  'xlsx',
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export type DocumentVisibility =
  | 'OWNER_ADMIN'
  | 'SELECTED_ROLES'
  | 'SPECIFIC_MEMBER'
  | 'MEMBER_VISIBLE';

export type DocumentReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface DocumentCategoryDto {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isArchived: boolean;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessDocumentDto {
  id: string;
  referenceNumber: string;
  tenantId: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  formattedFileSize: string;
  relatedMemberId: string | null;
  relatedMemberName?: string | null;
  relatedRoomId: string | null;
  relatedRoomNumber?: string | null;
  issueDate: string | null;
  formattedIssueDate: string | null;
  expiryDate: string | null;
  formattedExpiryDate: string | null;
  expiryStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  tags: string[];
  visibility: DocumentVisibility | string;
  reviewStatus: DocumentReviewStatus | string;
  uploadedById: string;
  uploaderName?: string | null;
  isArchived: boolean;
  signedUrl?: string;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
}

export interface DocumentActivityDto {
  id: string;
  documentId: string;
  actorUserId: string;
  actorName?: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  formattedCreatedAt: string;
}

export interface DocumentDashboardDto {
  totalDocuments: number;
  totalStorageBytes: number;
  formattedStorageUsed: string;
  addedThisMonthCount: number;
  pendingReviewCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  categories: DocumentCategoryDto[];
  recentDocuments: MessDocumentDto[];
}

export interface CreateDocumentInput {
  title: string;
  description?: string | null;
  categoryId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  fileContentBase64?: string;
  relatedMemberId?: string | null;
  relatedRoomId?: string | null;
  issueDate?: string | Date | null;
  expiryDate?: string | Date | null;
  tags?: string[];
  visibility?: DocumentVisibility | string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string | null;
  categoryId?: string;
  relatedMemberId?: string | null;
  relatedRoomId?: string | null;
  issueDate?: string | Date | null;
  expiryDate?: string | Date | null;
  tags?: string[];
  visibility?: DocumentVisibility | string;
  reviewStatus?: DocumentReviewStatus | string;
}

export const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET || 'messmate-vault-secret-key-32bytes!';

export class DocumentService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing and offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockMemberships: any[] = [];
  public mockRooms: any[] = [];
  public mockCategories: any[] = [];
  public mockDocuments: any[] = [];
  public mockActivities: any[] = [];

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || (defaultPrisma as any);
    this.seedMockData();
  }

  public seedMockData() {
    this.mockTenants = [
      {
        id: 'tenant_prince_mess',
        slug: 'prince-mess',
        name: 'Prince Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_owner_1',
        name: 'Prince Mess Manager',
        email: 'manager@prince-mess.dev',
      },
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
      },
      {
        id: 'usr_resident_2',
        name: 'Sabbir Hossain',
        email: 'sabbir@messmate.dev',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_resident_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        status: 'ACTIVE',
      },
      {
        id: 'mem_resident_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        status: 'ACTIVE',
      },
      {
        id: 'mem_green_1',
        tenantId: 'tenant_green_villa',
        userId: 'usr_resident_1',
        status: 'ACTIVE',
      },
    ];

    this.mockRooms = [
      {
        id: 'room_101',
        tenantId: 'tenant_prince_mess',
        roomNumber: '101',
      },
    ];

    // Seeded Categories
    const defaultCats = [
      { slug: 'rental-agreements', name: 'Rental Agreements', isSystem: true },
      { slug: 'member-documents', name: 'Member Documents', isSystem: true },
      { slug: 'mess-agreements', name: 'Mess Agreements', isSystem: true },
      { slug: 'bills-and-invoices', name: 'Bills and Invoices', isSystem: true },
      { slug: 'utility-bills', name: 'Utility Bills', isSystem: true },
      { slug: 'payment-receipts', name: 'Payment Receipts', isSystem: true },
      { slug: 'legal-documents', name: 'Legal Documents', isSystem: true },
      { slug: 'identity-documents', name: 'Identity Documents', isSystem: true },
      { slug: 'property-documents', name: 'Property Documents', isSystem: true },
      { slug: 'emergency-safety', name: 'Emergency and Safety Documents', isSystem: true },
      { slug: 'other', name: 'Other Documents', isSystem: true },
    ];

    this.mockCategories = defaultCats.map((c, i) => ({
      id: `cat_seed_${i + 1}`,
      tenantId: 'tenant_prince_mess',
      name: c.name,
      slug: c.slug,
      description: `${c.name} archive for Prince Mess`,
      isSystem: c.isSystem,
      isArchived: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    }));

    // Green Villa categories
    this.mockCategories.push({
      id: 'cat_gv_1',
      tenantId: 'tenant_green_villa',
      name: 'Rental Agreements',
      slug: 'rental-agreements',
      description: 'Green Villa rental contracts',
      isSystem: true,
      isArchived: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    // Seeded Documents
    this.mockDocuments = [
      {
        id: 'doc_seed_1',
        referenceNumber: 'DOC-2611-001',
        tenantId: 'tenant_prince_mess',
        title: 'Master Building Lease Agreement 2026',
        description: 'Tenancy agreement signed with building landlord for whole 4th floor.',
        categoryId: 'cat_seed_1',
        fileKey: 'tenants/tenant_prince_mess/documents/doc_seed_1-building_lease_2026.pdf',
        fileName: 'building_lease_2026.pdf',
        fileType: 'pdf',
        fileSizeBytes: 2450000, // ~2.45 MB
        relatedMemberId: null,
        relatedRoomId: null,
        issueDate: new Date('2026-01-01T00:00:00Z'),
        expiryDate: new Date('2026-12-31T23:59:59Z'), // Valid
        tags: ['legal', 'lease', 'landlord'],
        visibility: 'OWNER_ADMIN',
        reviewStatus: 'APPROVED',
        uploadedById: 'usr_owner_1',
        isArchived: false,
        createdAt: new Date('2026-01-02T10:00:00Z'),
        updatedAt: new Date('2026-01-02T10:00:00Z'),
      },
      {
        id: 'doc_seed_2',
        referenceNumber: 'DOC-2611-002',
        tenantId: 'tenant_prince_mess',
        title: 'DESCO Electricity Bill - October 2026',
        description: 'Official monthly power utility voucher paid via bKash.',
        categoryId: 'cat_seed_5', // Utility Bills
        fileKey: 'tenants/tenant_prince_mess/documents/doc_seed_2-desco_oct_2026.pdf',
        fileName: 'desco_oct_2026.pdf',
        fileType: 'pdf',
        fileSizeBytes: 820000, // ~820 KB
        relatedMemberId: null,
        relatedRoomId: null,
        issueDate: new Date('2026-10-15T00:00:00Z'),
        expiryDate: new Date('2026-11-28T00:00:00Z'), // Expiring soon (within 7 days)
        tags: ['utility', 'electricity', 'desco'],
        visibility: 'MEMBER_VISIBLE',
        reviewStatus: 'APPROVED',
        uploadedById: 'usr_owner_1',
        isArchived: false,
        createdAt: new Date('2026-10-16T11:00:00Z'),
        updatedAt: new Date('2026-10-16T11:00:00Z'),
      },
      {
        id: 'doc_seed_3',
        referenceNumber: 'DOC-2611-003',
        tenantId: 'tenant_prince_mess',
        title: 'Resident Tenancy Contract - Tanvir Ahmed',
        description: 'Signed mess admission rules and emergency contact declaration.',
        categoryId: 'cat_seed_2', // Member Documents
        fileKey: 'tenants/tenant_prince_mess/documents/doc_seed_3-tanvir_contract.pdf',
        fileName: 'tanvir_contract.pdf',
        fileType: 'pdf',
        fileSizeBytes: 1200000,
        relatedMemberId: 'mem_resident_1',
        relatedRoomId: 'room_101',
        issueDate: new Date('2026-02-01T00:00:00Z'),
        expiryDate: new Date('2027-01-31T23:59:59Z'),
        tags: ['member', 'admission', 'room_101'],
        visibility: 'SPECIFIC_MEMBER',
        reviewStatus: 'APPROVED',
        uploadedById: 'usr_owner_1',
        isArchived: false,
        createdAt: new Date('2026-02-01T14:00:00Z'),
        updatedAt: new Date('2026-02-01T14:00:00Z'),
      },
      // Green villa seed
      {
        id: 'doc_green_1',
        referenceNumber: 'DOC-GV-001',
        tenantId: 'tenant_green_villa',
        title: 'Green Villa Tenancy Rules 2026',
        description: 'House rules document for Green Villa.',
        categoryId: 'cat_gv_1',
        fileKey: 'tenants/tenant_green_villa/documents/rules.pdf',
        fileName: 'rules.pdf',
        fileType: 'pdf',
        fileSizeBytes: 500000,
        relatedMemberId: null,
        relatedRoomId: null,
        issueDate: new Date('2026-01-01T00:00:00Z'),
        expiryDate: null,
        tags: ['rules'],
        visibility: 'MEMBER_VISIBLE',
        reviewStatus: 'APPROVED',
        uploadedById: 'usr_owner_1',
        isArchived: false,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      },
    ];

    this.mockActivities = [
      {
        id: 'act_1',
        tenantId: 'tenant_prince_mess',
        documentId: 'doc_seed_1',
        actorUserId: 'usr_owner_1',
        action: 'UPLOAD',
        details: 'Initial document upload to vault',
        createdAt: new Date('2026-01-02T10:00:00Z'),
      },
    ];
  }

  private isDbConfigured(): boolean {
    return inspectDatabaseConfig().configured;
  }

  private async resolveTenant(tenantSlug: string): Promise<any> {
    if (this.isDbConfigured()) {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
      }
      return tenant;
    }

    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!mock) {
      throw new NotFoundError(`Mess tenant '${tenantSlug}' not found.`);
    }
    if (mock.status === 'SUSPENDED') {
      throw new ForbiddenError(`Mess tenant '${tenantSlug}' is suspended.`);
    }
    return mock;
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  public calculateExpiryStatus(expiryDate: Date | null): 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY' {
    if (!expiryDate) return 'NO_EXPIRY';
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 30) return 'EXPIRING_SOON';
    return 'VALID';
  }

  public generateSignedToken(documentId: string, expiresAt: number): string {
    const payload = `${documentId}:${expiresAt}`;
    return crypto.createHmac('sha256', SIGNED_URL_SECRET).update(payload).digest('hex');
  }

  public verifySignedToken(documentId: string, token: string, expiresAt: number): boolean {
    if (Date.now() > expiresAt) return false;
    const expected = this.generateSignedToken(documentId, expiresAt);
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  }

  public async recordActivity(
    documentId: string,
    actorUserId: string,
    action: string,
    details?: string
  ): Promise<void> {
    if (this.isDbConfigured()) {
      try {
        const doc = await this.db.messDocument.findUnique({ where: { id: documentId } });
        if (doc) {
          await this.db.documentActivity.create({
            data: {
              tenantId: doc.tenantId,
              documentId,
              actorUserId,
              action,
              details: details || null,
            },
          });
        }
        return;
      } catch { }
    }

    const doc = this.mockDocuments.find((d) => d.id === documentId);
    if (doc) {
      this.mockActivities.push({
        id: "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        tenantId: doc.tenantId,
        documentId,
        actorUserId,
        action,
        details: details || null,
        createdAt: new Date(),
      });
    }
  }

  private mapDocumentToDto(
    doc: any,
    options: {
      isStaff?: boolean;
      requestingUserId?: string;
      categoryMap?: Map<string, string>;
      userMap?: Map<string, string>;
      roomMap?: Map<string, string>;
    } = {}
  ): MessDocumentDto {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity
    const token = this.generateSignedToken(doc.id, expiresAt);
    const signedUrl = `/api/v1/mess/${doc.tenant?.slug || 'mess'}/documents/${doc.id}/file?token=${token}&expires=${expiresAt}`;

    const tags = Array.isArray(doc.tags)
      ? doc.tags
      : typeof doc.tags === 'string'
        ? JSON.parse(doc.tags)
        : [];

    const categoryName =
      doc.category?.name ||
      (options.categoryMap ? options.categoryMap.get(doc.categoryId) : null) ||
      'General';

    const uploaderName =
      doc.uploadedBy?.name ||
      (options.userMap ? options.userMap.get(doc.uploadedById) : null) ||
      'Staff Member';

    const relatedMemberName =
      doc.relatedMember?.user?.name ||
      (doc.relatedMemberId && options.userMap ? options.userMap.get(doc.relatedMemberId) : null) ||
      null;

    const relatedRoomNumber =
      doc.relatedRoom?.roomNumber ||
      (doc.relatedRoomId && options.roomMap ? options.roomMap.get(doc.relatedRoomId) : null) ||
      null;

    return {
      id: doc.id,
      referenceNumber: doc.referenceNumber,
      tenantId: doc.tenantId,
      title: doc.title,
      description: doc.description || null,
      categoryId: doc.categoryId,
      categoryName,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSizeBytes: doc.fileSizeBytes,
      formattedFileSize: this.formatBytes(doc.fileSizeBytes),
      relatedMemberId: doc.relatedMemberId || null,
      relatedMemberName,
      relatedRoomId: doc.relatedRoomId || null,
      relatedRoomNumber,
      issueDate: doc.issueDate ? doc.issueDate.toISOString() : null,
      formattedIssueDate: doc.issueDate ? formatDhakaDateTime(doc.issueDate) : null,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
      formattedExpiryDate: doc.expiryDate ? formatDhakaDateTime(doc.expiryDate) : null,
      expiryStatus: this.calculateExpiryStatus(doc.expiryDate),
      tags,
      visibility: doc.visibility,
      reviewStatus: doc.reviewStatus,
      uploadedById: doc.uploadedById,
      uploaderName,
      isArchived: !!doc.isArchived,
      signedUrl,
      createdAt: doc.createdAt.toISOString(),
      formattedCreatedAt: formatDhakaDateTime(doc.createdAt),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : doc.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  async getDocumentDashboard(
    tenantSlug: string,
    requestingUserId?: string,
    isStaff = true
  ): Promise<DocumentDashboardDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (this.isDbConfigured()) {
      const [categories, documents] = await Promise.all([
        this.db.documentCategory.findMany({
          where: { tenantId: tenant.id, isArchived: false },
          include: { _count: { select: { documents: true } } },
          orderBy: { name: 'asc' },
        }),
        this.db.messDocument.findMany({
          where: { tenantId: tenant.id, isArchived: false },
          include: {
            category: true,
            uploadedBy: { select: { name: true } },
            relatedMember: { include: { user: { select: { name: true } } } },
            relatedRoom: { select: { roomNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      let totalStorageBytes = 0;
      let addedThisMonthCount = 0;
      let pendingReviewCount = 0;
      let expiringSoonCount = 0;
      let expiredCount = 0;

      for (const d of documents) {
        totalStorageBytes += d.fileSizeBytes;
        if (d.createdAt >= startOfMonth) addedThisMonthCount++;
        if (d.reviewStatus === 'PENDING') pendingReviewCount++;

        const expStatus = this.calculateExpiryStatus(d.expiryDate);
        if (expStatus === 'EXPIRING_SOON') expiringSoonCount++;
        if (expStatus === 'EXPIRED') expiredCount++;
      }

      const catDtos: DocumentCategoryDto[] = categories.map((c: any) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        isSystem: c.isSystem,
        isArchived: c.isArchived,
        documentCount: c._count?.documents || 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));

      const dtoList = documents.map((d: any) =>
        this.mapDocumentToDto(d, { isStaff, requestingUserId })
      );

      return {
        totalDocuments: documents.length,
        totalStorageBytes,
        formattedStorageUsed: this.formatBytes(totalStorageBytes),
        addedThisMonthCount,
        pendingReviewCount,
        expiringSoonCount,
        expiredCount,
        categories: catDtos,
        recentDocuments: dtoList.slice(0, 10),
      };
    }

    // In-memory fallback
    const categories = this.mockCategories.filter(
      (c) => c.tenantId === tenant.id && !c.isArchived
    );
    const documents = this.mockDocuments.filter(
      (d) => d.tenantId === tenant.id && !d.isArchived
    );

    let totalStorageBytes = 0;
    let addedThisMonthCount = 0;
    let pendingReviewCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const d of documents) {
      totalStorageBytes += d.fileSizeBytes;
      if (d.createdAt >= startOfMonth) addedThisMonthCount++;
      if (d.reviewStatus === 'PENDING') pendingReviewCount++;

      const expStatus = this.calculateExpiryStatus(d.expiryDate);
      if (expStatus === 'EXPIRING_SOON') expiringSoonCount++;
      if (expStatus === 'EXPIRED') expiredCount++;
    }

    const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    const catDtos: DocumentCategoryDto[] = categories.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      slug: c.slug,
      description: c.description,
      isSystem: c.isSystem,
      isArchived: c.isArchived,
      documentCount: documents.filter((d) => d.categoryId === c.id).length,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    const dtoList = documents.map((d) =>
      this.mapDocumentToDto(d, {
        isStaff,
        requestingUserId,
        categoryMap: catMap,
        userMap,
        roomMap,
      })
    );

    return {
      totalDocuments: documents.length,
      totalStorageBytes,
      formattedStorageUsed: this.formatBytes(totalStorageBytes),
      addedThisMonthCount,
      pendingReviewCount,
      expiringSoonCount,
      expiredCount,
      categories: catDtos,
      recentDocuments: dtoList.slice(0, 10),
    };
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------

  async listCategories(tenantSlug: string): Promise<DocumentCategoryDto[]> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const cats = await this.db.documentCategory.findMany({
        where: { tenantId: tenant.id, isArchived: false },
        include: { _count: { select: { documents: true } } },
        orderBy: { name: 'asc' },
      });

      return cats.map((c: any) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isSystem: c.isSystem,
        isArchived: c.isArchived,
        documentCount: c._count?.documents || 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }

    const docs = this.mockDocuments.filter((d) => d.tenantId === tenant.id && !d.isArchived);
    return this.mockCategories
      .filter((c) => c.tenantId === tenant.id && !c.isArchived)
      .map((c) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isSystem: c.isSystem,
        isArchived: c.isArchived,
        documentCount: docs.filter((d) => d.categoryId === c.id).length,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
  }

  async createCategory(
    tenantSlug: string,
    input: { name: string; description?: string }
  ): Promise<DocumentCategoryDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Category name is required.');
    }

    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (this.isDbConfigured()) {
      const existing = await this.db.documentCategory.findFirst({
        where: { tenantId: tenant.id, slug },
      });
      if (existing) {
        throw new ConflictError(`Document category '${input.name}' already exists in this mess.`);
      }

      const created = await this.db.documentCategory.create({
        data: {
          tenantId: tenant.id,
          name: input.name.trim(),
          slug,
          description: input.description?.trim() || null,
          isSystem: false,
        },
      });

      return {
        id: created.id,
        tenantId: created.tenantId,
        name: created.name,
        slug: created.slug,
        description: created.description,
        isSystem: created.isSystem,
        isArchived: created.isArchived,
        documentCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    // In-memory fallback
    const exists = this.mockCategories.some((c) => c.tenantId === tenant.id && c.slug === slug);
    if (exists) {
      throw new ConflictError(`Document category '${input.name}' already exists in this mess.`);
    }

    const now = new Date();
    const newCat = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      isSystem: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    this.mockCategories.push(newCat);
    return {
      id: newCat.id,
      tenantId: newCat.tenantId,
      name: newCat.name,
      slug: newCat.slug,
      description: newCat.description,
      isSystem: newCat.isSystem,
      isArchived: newCat.isArchived,
      documentCount: 0,
      createdAt: newCat.createdAt.toISOString(),
      updatedAt: newCat.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // LIST DOCUMENTS
  // ---------------------------------------------------------------------------

  async listDocuments(
    tenantSlug: string,
    filters: {
      categoryId?: string;
      fileType?: string;
      search?: string;
      status?: string;
      visibility?: string;
      expiringSoon?: boolean;
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    } = {},
    isStaff = true,
    requestingUserId?: string
  ): Promise<{ documents: MessDocumentDto[]; total: number }> {
    const tenant = await this.resolveTenant(tenantSlug);
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    // Resolve requesting user's membership ID if not staff
    let userMembershipId: string | null = null;
    if (!isStaff && requestingUserId) {
      if (this.isDbConfigured()) {
        const mem = await this.db.membership.findFirst({
          where: { tenantId: tenant.id, userId: requestingUserId, status: 'ACTIVE' },
        });
        userMembershipId = mem ? mem.id : null;
      } else {
        const mem = this.mockMemberships.find(
          (m) => m.tenantId === tenant.id && m.userId === requestingUserId
        );
        userMembershipId = mem ? mem.id : null;
      }
    }

    if (this.isDbConfigured()) {
      const where: any = {
        tenantId: tenant.id,
        isArchived: filters.includeArchived ? undefined : false,
      };

      if (filters.categoryId && filters.categoryId !== 'ALL') {
        where.categoryId = filters.categoryId;
      }
      if (filters.fileType && filters.fileType !== 'ALL') {
        where.fileType = filters.fileType;
      }
      if (filters.status && filters.status !== 'ALL') {
        where.reviewStatus = filters.status;
      }

      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { fileName: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Member privacy boundaries
      if (!isStaff) {
        where.AND = [
          {
            OR: [
              { visibility: 'MEMBER_VISIBLE' },
              { relatedMemberId: userMembershipId || 'none' },
              { uploadedById: requestingUserId || 'none' },
            ],
          },
        ];
      }

      const [total, rawDocs] = await Promise.all([
        this.db.messDocument.count({ where }),
        this.db.messDocument.findMany({
          where,
          include: {
            category: true,
            uploadedBy: { select: { name: true } },
            relatedMember: { include: { user: { select: { name: true } } } },
            relatedRoom: { select: { roomNumber: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const documents = rawDocs.map((d: any) =>
        this.mapDocumentToDto(d, { isStaff, requestingUserId })
      );

      return { documents, total };
    }

    // In-memory fallback
    const catMap = new Map<string, string>(this.mockCategories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    let filtered = this.mockDocuments.filter((d) => d.tenantId === tenant.id);
    if (!filters.includeArchived) {
      filtered = filtered.filter((d) => !d.isArchived);
    }

    if (filters.categoryId && filters.categoryId !== 'ALL') {
      filtered = filtered.filter((d) => d.categoryId === filters.categoryId);
    }
    if (filters.fileType && filters.fileType !== 'ALL') {
      filtered = filtered.filter((d) => d.fileType === filters.fileType);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter((d) => d.reviewStatus === filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.referenceNumber.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q)
      );
    }

    // Member Privacy boundaries
    if (!isStaff) {
      filtered = filtered.filter((d) => {
        if (d.visibility === 'MEMBER_VISIBLE') return true;
        if (d.relatedMemberId && d.relatedMemberId === userMembershipId) return true;
        if (d.uploadedById && d.uploadedById === requestingUserId) return true;
        return false;
      });
    }

    const total = filtered.length;
    const paginated = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    const documents = paginated.map((d) =>
      this.mapDocumentToDto(d, {
        isStaff,
        requestingUserId,
        categoryMap: catMap,
        userMap,
        roomMap,
      })
    );

    return { documents, total };
  }

  // ---------------------------------------------------------------------------
  // GET DOCUMENT BY ID
  // ---------------------------------------------------------------------------

  async getDocumentById(
    tenantSlug: string,
    documentId: string,
    isStaff = true,
    requestingUserId?: string
  ): Promise<MessDocumentDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (this.isDbConfigured()) {
      const doc = await this.db.messDocument.findFirst({
        where: { id: documentId, tenantId: tenant.id },
        include: {
          category: true,
          uploadedBy: { select: { name: true } },
          relatedMember: { include: { user: { select: { name: true } } } },
          relatedRoom: { select: { roomNumber: true } },
        },
      });

      if (!doc) {
        throw new NotFoundError('Document not found in this mess vault.');
      }

      // Member IDOR protection
      if (!isStaff && requestingUserId) {
        const mem = await this.db.membership.findFirst({
          where: { tenantId: tenant.id, userId: requestingUserId, status: 'ACTIVE' },
        });
        const memId = mem ? mem.id : null;

        const isAllowed =
          doc.visibility === 'MEMBER_VISIBLE' ||
          (doc.relatedMemberId && doc.relatedMemberId === memId) ||
          doc.uploadedById === requestingUserId;

        if (!isAllowed) {
          throw new NotFoundError('Document not found in this mess vault.');
        }
      }

      return this.mapDocumentToDto(doc, { isStaff, requestingUserId });
    }

    // In-memory fallback
    const doc = this.mockDocuments.find((d) => d.id === documentId && d.tenantId === tenant.id);
    if (!doc) {
      throw new NotFoundError('Document not found in this mess vault.');
    }

    if (!isStaff && requestingUserId) {
      const mem = this.mockMemberships.find(
        (m) => m.tenantId === tenant.id && m.userId === requestingUserId
      );
      const memId = mem ? mem.id : null;

      const isAllowed =
        doc.visibility === 'MEMBER_VISIBLE' ||
        (doc.relatedMemberId && doc.relatedMemberId === memId) ||
        doc.uploadedById === requestingUserId;

      if (!isAllowed) {
        throw new NotFoundError('Document not found in this mess vault.');
      }
    }

    const catMap = new Map<string, string>(this.mockCategories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    return this.mapDocumentToDto(doc, {
      isStaff,
      requestingUserId,
      categoryMap: catMap,
      userMap,
      roomMap,
    });
  }

  // ---------------------------------------------------------------------------
  // CREATE / UPLOAD DOCUMENT
  // ---------------------------------------------------------------------------

  async createDocument(
    tenantSlug: string,
    uploaderUserId: string,
    input: CreateDocumentInput
  ): Promise<MessDocumentDto> {
    const tenant = await this.resolveTenant(tenantSlug);

    if (!input.title || !input.title.trim()) {
      throw new ValidationError('Document title is required.');
    }
    if (!input.categoryId) {
      throw new ValidationError('Document category is required.');
    }
    if (!input.fileName || !input.fileName.trim()) {
      throw new ValidationError('File name is required.');
    }

    // Validate File Extension & MIME
    const cleanFileName = input.fileName.trim();
    const ext = cleanFileName.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_FILE_TYPES.includes(ext as any)) {
      throw new ValidationError(
        `Unsupported file type '.${ext}'. Allowed formats: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX.`
      );
    }

    // Validate File Size
    const fileSize = input.fileSizeBytes || 1024;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(
        `File size (${this.formatBytes(fileSize)}) exceeds the maximum allowed limit of 15 MB.`
      );
    }

    const issue = input.issueDate ? new Date(input.issueDate) : null;
    const expiry = input.expiryDate ? new Date(input.expiryDate) : null;

    if (issue && expiry && expiry <= issue) {
      throw new ValidationError('Document expiry date must be after the issue date.');
    }

    const refNumber = `DOC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const fileKey = `tenants/${tenant.id}/documents/${Date.now()}-${cleanFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (this.isDbConfigured()) {
      const created = await this.db.messDocument.create({
        data: {
          referenceNumber: refNumber,
          tenantId: tenant.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          categoryId: input.categoryId,
          fileKey,
          fileName: cleanFileName,
          fileType: ext,
          fileSizeBytes: fileSize,
          relatedMemberId: input.relatedMemberId || null,
          relatedRoomId: input.relatedRoomId || null,
          issueDate: issue,
          expiryDate: expiry,
          tags: input.tags || [],
          visibility: input.visibility || 'OWNER_ADMIN',
          reviewStatus: 'APPROVED',
          uploadedById: uploaderUserId,
        },
        include: {
          category: true,
          uploadedBy: { select: { name: true } },
          relatedMember: { include: { user: { select: { name: true } } } },
          relatedRoom: { select: { roomNumber: true } },
        },
      });

      // Record Activity
      await this.db.documentActivity.create({
        data: {
          tenantId: tenant.id,
          documentId: created.id,
          actorUserId: uploaderUserId,
          action: 'UPLOAD',
          details: `Uploaded ${cleanFileName} (${this.formatBytes(fileSize)})`,
        },
      });

      return this.mapDocumentToDto(created, { isStaff: true });
    }

    // In-memory fallback
    const now = new Date();
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDoc = {
      id: docId,
      referenceNumber: refNumber,
      tenantId: tenant.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      categoryId: input.categoryId,
      fileKey,
      fileName: cleanFileName,
      fileType: ext,
      fileSizeBytes: fileSize,
      relatedMemberId: input.relatedMemberId || null,
      relatedRoomId: input.relatedRoomId || null,
      issueDate: issue,
      expiryDate: expiry,
      tags: input.tags || [],
      visibility: input.visibility || 'OWNER_ADMIN',
      reviewStatus: 'APPROVED',
      uploadedById: uploaderUserId,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    this.mockDocuments.unshift(newDoc);
    this.mockActivities.push({
      id: `act_${Date.now()}`,
      tenantId: tenant.id,
      documentId: docId,
      actorUserId: uploaderUserId,
      action: 'UPLOAD',
      details: `Uploaded ${cleanFileName} (${this.formatBytes(fileSize)})`,
      createdAt: now,
    });

    const catMap = new Map<string, string>(this.mockCategories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    return this.mapDocumentToDto(newDoc, {
      isStaff: true,
      categoryMap: catMap,
      userMap,
      roomMap,
    });
  }

  // ---------------------------------------------------------------------------
  // UPDATE METADATA
  // ---------------------------------------------------------------------------

  async updateDocument(
    tenantSlug: string,
    documentId: string,
    staffUserId: string,
    input: UpdateDocumentInput
  ): Promise<MessDocumentDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const doc = await this.getDocumentById(tenantSlug, documentId, true);

    if (this.isDbConfigured()) {
      const updateData: any = {};
      if (input.title) updateData.title = input.title.trim();
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;
      if (input.categoryId) updateData.categoryId = input.categoryId;
      if (input.relatedMemberId !== undefined) updateData.relatedMemberId = input.relatedMemberId || null;
      if (input.relatedRoomId !== undefined) updateData.relatedRoomId = input.relatedRoomId || null;
      if (input.issueDate !== undefined) updateData.issueDate = input.issueDate ? new Date(input.issueDate) : null;
      if (input.expiryDate !== undefined) updateData.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
      if (input.tags) updateData.tags = input.tags;
      if (input.visibility) updateData.visibility = input.visibility;
      if (input.reviewStatus) updateData.reviewStatus = input.reviewStatus;

      const updated = await this.db.messDocument.update({
        where: { id: documentId },
        data: updateData,
        include: {
          category: true,
          uploadedBy: { select: { name: true } },
          relatedMember: { include: { user: { select: { name: true } } } },
          relatedRoom: { select: { roomNumber: true } },
        },
      });

      await this.db.documentActivity.create({
        data: {
          tenantId: tenant.id,
          documentId,
          actorUserId: staffUserId,
          action: 'UPDATE_METADATA',
          details: 'Updated document metadata and visibility settings',
        },
      });

      return this.mapDocumentToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockDocuments.find((d) => d.id === documentId && d.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Document not found.');
    }

    if (input.title) target.title = input.title.trim();
    if (input.description !== undefined) target.description = input.description?.trim() || null;
    if (input.categoryId) target.categoryId = input.categoryId;
    if (input.relatedMemberId !== undefined) target.relatedMemberId = input.relatedMemberId || null;
    if (input.relatedRoomId !== undefined) target.relatedRoomId = input.relatedRoomId || null;
    if (input.issueDate !== undefined) target.issueDate = input.issueDate ? new Date(input.issueDate) : null;
    if (input.expiryDate !== undefined) target.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (input.tags) target.tags = input.tags;
    if (input.visibility) target.visibility = input.visibility;
    if (input.reviewStatus) target.reviewStatus = input.reviewStatus;
    target.updatedAt = new Date();

    this.mockActivities.push({
      id: `act_${Date.now()}`,
      tenantId: tenant.id,
      documentId,
      actorUserId: staffUserId,
      action: 'UPDATE_METADATA',
      details: 'Updated document metadata and visibility settings',
      createdAt: new Date(),
    });

    const catMap = new Map<string, string>(this.mockCategories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    return this.mapDocumentToDto(target, {
      isStaff: true,
      categoryMap: catMap,
      userMap,
      roomMap,
    });
  }

  // ---------------------------------------------------------------------------
  // ARCHIVE & DELETE
  // ---------------------------------------------------------------------------

  async archiveDocument(
    tenantSlug: string,
    documentId: string,
    staffUserId: string
  ): Promise<MessDocumentDto> {
    const tenant = await this.resolveTenant(tenantSlug);
    const doc = await this.getDocumentById(tenantSlug, documentId, true);

    if (this.isDbConfigured()) {
      const updated = await this.db.messDocument.update({
        where: { id: documentId },
        data: { isArchived: true, reviewStatus: 'ARCHIVED' },
        include: {
          category: true,
          uploadedBy: { select: { name: true } },
          relatedMember: { include: { user: { select: { name: true } } } },
          relatedRoom: { select: { roomNumber: true } },
        },
      });

      await this.db.documentActivity.create({
        data: {
          tenantId: tenant.id,
          documentId,
          actorUserId: staffUserId,
          action: 'ARCHIVE',
          details: 'Document archived from active vault',
        },
      });

      return this.mapDocumentToDto(updated, { isStaff: true });
    }

    // In-memory fallback
    const target = this.mockDocuments.find((d) => d.id === documentId && d.tenantId === tenant.id);
    if (!target) {
      throw new NotFoundError('Document not found.');
    }

    target.isArchived = true;
    target.reviewStatus = 'ARCHIVED';
    target.updatedAt = new Date();

    this.mockActivities.push({
      id: `act_${Date.now()}`,
      tenantId: tenant.id,
      documentId,
      actorUserId: staffUserId,
      action: 'ARCHIVE',
      details: 'Document archived from active vault',
      createdAt: new Date(),
    });

    const catMap = new Map<string, string>(this.mockCategories.map((c) => [c.id, c.name]));
    const userMap = new Map<string, string>(this.mockUsers.map((u) => [u.id, u.name]));
    const roomMap = new Map<string, string>(this.mockRooms.map((r) => [r.id, r.roomNumber]));

    return this.mapDocumentToDto(target, {
      isStaff: true,
      categoryMap: catMap,
      userMap,
      roomMap,
    });
  }

  async deleteDocument(
    tenantSlug: string,
    documentId: string,
    staffUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const tenant = await this.resolveTenant(tenantSlug);
    await this.getDocumentById(tenantSlug, documentId, true);

    if (this.isDbConfigured()) {
      await this.db.messDocument.delete({
        where: { id: documentId },
      });
      return { success: true, message: 'Document permanently deleted from vault.' };
    }

    const idx = this.mockDocuments.findIndex((d) => d.id === documentId && d.tenantId === tenant.id);
    if (idx !== -1) {
      this.mockDocuments.splice(idx, 1);
    }
    return { success: true, message: 'Document permanently deleted from vault.' };
  }

  // ---------------------------------------------------------------------------
  // EXPIRY REMINDERS
  // ---------------------------------------------------------------------------

  public dispatchedReminders: Set<string> = new Set();

  async checkAndDispatchExpiryReminders(tenantSlug: string): Promise<string[]> {
    const tenant = await this.resolveTenant(tenantSlug);
    const sentEventRefs = [];

    const docs = this.isDbConfigured()
      ? await this.db.messDocument.findMany({
        where: { tenantId: tenant.id, isArchived: false, expiryDate: { not: null } },
      })
      : this.mockDocuments.filter(
        (d) => d.tenantId === tenant.id && !d.isArchived && d.expiryDate
      );

    for (const d of docs) {
      const status = this.calculateExpiryStatus(d.expiryDate);
      if (status === 'EXPIRING_SOON' || status === 'EXPIRED') {
        const ref = `DOC_EXP_${d.id}_${d.expiryDate.toISOString().slice(0, 10)}`;
        if (this.dispatchedReminders.has(ref)) {
          continue;
        }

        const title =
          status === 'EXPIRED'
            ? `Expired Document: ${d.title}`
            : `Expiring Soon: ${d.title}`;

        const msg =
          status === 'EXPIRED'
            ? `The document "${d.title}" expired on ${formatDhakaDateTime(d.expiryDate)}. Please renew or archive it.`
            : `The document "${d.title}" will expire on ${formatDhakaDateTime(d.expiryDate)}. Action required.`;

        try {
          await tenantNotificationService.createNotification({
            tenantSlug,
            userId: d.uploadedById || tenant.id,
            category: 'GENERAL',
            title,
            message: msg,
            link: `/mess/${tenantSlug}/documents`,
            eventReference: ref,
          });
          this.dispatchedReminders.add(ref);
          sentEventRefs.push(ref);
        } catch (err) {
          console.warn('[DocumentService] Expiry notify warning:', err);
        }
      }
    }

    return sentEventRefs;
  }

  async checkExpiringDocumentsAndNotify(tenantSlug: string): Promise<number> {
    const tenant = await this.resolveTenant(tenantSlug);
    let notifiedCount = 0;

    const docs = this.isDbConfigured()
      ? await this.db.messDocument.findMany({
        where: { tenantId: tenant.id, isArchived: false, expiryDate: { not: null } },
      })
      : this.mockDocuments.filter(
        (d) => d.tenantId === tenant.id && !d.isArchived && d.expiryDate
      );

    for (const d of docs) {
      const status = this.calculateExpiryStatus(d.expiryDate);
      if (status === 'EXPIRING_SOON' || status === 'EXPIRED') {
        const title =
          status === 'EXPIRED'
            ? `Expired Document: ${d.title}`
            : `Expiring Soon: ${d.title}`;

        const msg =
          status === 'EXPIRED'
            ? `The document "${d.title}" expired on ${formatDhakaDateTime(d.expiryDate)}. Please renew or archive it.`
            : `The document "${d.title}" will expire on ${formatDhakaDateTime(d.expiryDate)}. Action required.`;

        try {
          await tenantNotificationService.createNotification({
            tenantSlug,
            userId: d.uploadedById || tenant.id,
            category: 'GENERAL',
            title,
            message: msg,
            link: `/mess/${tenantSlug}/documents`,
            eventReference: `DOC_EXP_${d.id}_${d.expiryDate.toISOString().slice(0, 10)}`,
          });
          notifiedCount++;
        } catch (err: any) {
          console.warn('[DocumentService] Expiry notify warning:', err?.message || err);
        }
      }
    }

    return notifiedCount;
  }
}

export const documentService = new DocumentService();

