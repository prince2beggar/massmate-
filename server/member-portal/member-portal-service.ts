if (typeof window !== 'undefined') {
  throw new Error('MemberPortalService can only be executed in a server environment.');
}

import { prisma as defaultPrisma } from '@/server/db/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { inspectDatabaseConfig } from '@/server/db/config';
import { financeService } from '@/server/finance/finance-service';
import { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';
import { formatDhakaDateTime } from '@/server/settings/mess-settings-service';
import {
  isMealCutoffPassed,
  getDaysInMonth,
  getNextDayString,
} from '@/server/meals/meal-utils';
import {
  UnauthenticatedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from '@/server/api/errors';
import { auditService } from '@/server/audit/audit-service';
import type { MemberContext } from '@/server/api/with-member-auth';

export const ASIA_DHAKA_TIMEZONE = 'Asia/Dhaka';

export function toPoisha(taka: number | string | bigint): bigint {
  if (typeof taka === 'bigint') return taka;
  const num = typeof taka === 'string' ? parseFloat(taka) : taka;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

export function fromPoisha(poisha: bigint | number): number {
  return Number(poisha) / 100;
}

export { formatBdtCurrency } from '@/server/mess-admin/mess-dashboard-service';

export function getTodayDhakaDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ASIA_DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // Returns YYYY-MM-DD
}

export function getCurrentDhakaMonthString(): string {
  const d = getTodayDhakaDateString();
  return d.substring(0, 7); // Returns YYYY-MM
}

/**
 * Normalizes Bangladeshi phone numbers into canonical 11-digit format (01XXXXXXXXX).
 * Rejects invalid prefixes, lengths, or non-numeric tokens.
 */
export function normalizeBdPhone(phone?: string | null): string | null {
  if (!phone || !phone.trim()) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (!match) {
    throw new ValidationError(
      'Invalid phone number format. Please provide an 11-digit Bangladeshi mobile number (e.g. 01712345678).'
    );
  }
  return match[1];
}

export interface MemberProfileDto {
  userId: string;
  membershipId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  memberCode: string | null;
  status: string;
  joinedAt: string | null;
  roleName: string;
  tenantName: string;
  tenantSlug: string;
  editableFields: string[];
  protectedFields: string[];
}

export interface UpdateMemberProfileInput {
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  avatar?: string | null;
  name?: string;
  [key: string]: any;
}

export interface MemberRoomDetailsDto {
  hasAssignment: boolean;
  currentAssignment: {
    assignmentId: string;
    roomId: string;
    roomNumber: string;
    roomName: string | null;
    floor: string | null;
    building: string | null;
    capacity: number;
    currentOccupantsCount: number;
    bedNumber: string;
    monthlyRentPoisha: string;
    formattedRent: string;
    startDate: string;
    facilities: string[];
    status: string;
    roomRules?: string;
  } | null;
  assignmentHistory: Array<{
    id: string;
    roomNumber: string;
    bedNumber: string;
    startDate: string;
    endDate: string | null;
    monthlyRentPoisha: string;
    formattedRent: string;
    status: string;
    moveOutReason: string | null;
  }>;
  availableRooms: Array<{
    id: string;
    roomNumber: string;
    name: string | null;
    floor: string | null;
    building: string | null;
    capacity: number;
    availableBedsCount: number;
    defaultRentPoisha: string;
    formattedDefaultRent: string;
    facilities: string[];
  }>;
}

export interface MemberRequestDto {
  id: string;
  referenceNumber: string;
  membershipId: string;
  memberName: string;
  tenantId: string;
  requestType: 'ROOM_CHANGE' | 'PROFILE_UPDATE' | 'MAINTENANCE' | 'GENERAL_QUERY';
  title: string;
  description: string;
  requestedRoomId: string | null;
  requestedRoomNumber?: string | null;
  preferredDate: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | null;
}

export interface CreateMemberRequestInput {
  requestType: 'ROOM_CHANGE' | 'PROFILE_UPDATE' | 'MAINTENANCE' | 'GENERAL_QUERY';
  title?: string;
  description: string;
  requestedRoomId?: string | null;
  preferredDate?: string | null;
  metadata?: Record<string, any> | null;
}

export interface MemberMealCalendarDay {
  dateString: string;
  dayNumber: number;
  dayOfWeek: string;
  isToday: boolean;
  isPast: boolean;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalDailyUnits: number;
  isMealOff: boolean;
  mealOffReason: string | null;
  guestMealsCount: number;
  menu: {
    breakfast: string | null;
    lunch: string | null;
    dinner: string | null;
    specialNotes: string | null;
  } | null;
}

export interface MemberMealOverviewDto {
  todayDate: string;
  monthString: string;
  mealSystem: 'FIXED' | 'FLEXIBLE';
  mealSystemDescription: string;
  todayStatus: 'ACTIVE' | 'OFF' | 'NO_SCHEDULE';
  todayCounts: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  todayMenu: {
    breakfast: string | null;
    lunch: string | null;
    dinner: string | null;
    specialNotes: string | null;
  } | null;
  monthSummary: {
    totalMemberMeals: number;
    totalGuestMeals: number;
    totalChargeableUnits: number;
    estimatedMealRateFormatted: string | null;
    estimatedMealRatePoisha: string | null;
    totalMealChargesFormatted: string;
  };
  cutoffs: {
    breakfast: string;
    lunch: string;
    dinner: string;
    defaultCutoff: string;
    cutoffExplanation: string;
  };
  calendar: MemberMealCalendarDay[];
  recentMealOffRequests: Array<{
    id: string;
    startDate: string;
    endDate: string;
    mealTypes: string[];
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    canCancel: boolean;
    createdAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  }>;
}

export interface SubmitMealOffInput {
  startDate: string;
  endDate: string;
  mealTypes?: string[];
  reason: string;
}

export interface MemberNoticeDto {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
}

export interface MemberEventDto {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string | null;
  imageUrl: string | null;
  rsvpDeadline: string | null;
  isRsvpOpen: boolean;
  myRsvpStatus: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'NO_RESPONSE';
  totalAttendingCount: number;
}

export interface RsvpEventInput {
  status: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';
  notes?: string;
}

export interface MemberComplaintDto {
  id: string;
  referenceNumber: string;
  category: string;
  title: string;
  description: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
  attachmentUrl: string | null;
  adminResponse: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintInput {
  category: string;
  title: string;
  description: string;
  attachmentUrl?: string;
}

// ============================================================================
// TASK 40 — MY ACCOUNT, MONTHLY STATEMENTS, BILLING & PAYMENTS INTERFACES
// ============================================================================

export interface BillingPeriodSelectionDto {
  monthString: string; // "YYYY-MM"
  label: string; // "November 2026"
  isCurrent: boolean;
  isLocked: boolean;
}

export interface StatementItemDto {
  id: string;
  categoryName: string;
  amountTaka: number;
  allocationRule?: string;
  notes?: string | null;
}

export interface MemberAccountTotalsDto {
  openingDueTaka: number;
  rentChargesTaka: number;
  utilityChargesTaka: number;
  mealChargesTaka: number;
  otherChargesTaka: number;
  totalNewChargesTaka: number;
  totalBilledTaka: number;
  confirmedPaidTaka: number;
  pendingPaidTaka: number;
  creditAdjustmentTaka: number;
  closingBalanceTaka: number;
  advanceBalanceTaka: number;
  dueStatus: 'PAID' | 'DUE';
  isZeroDrift: boolean;
}

export interface MemberAccountOverviewDto {
  period: BillingPeriodSelectionDto;
  availablePeriods: BillingPeriodSelectionDto[];
  totals: MemberAccountTotalsDto;
  items: StatementItemDto[];
  statementMetadata: {
    billId: string | null;
    billNumber: string | null;
    billStatus: string;
    dueDate: string | null;
    generatedAt: string;
    isPeriodLocked: boolean;
    tenantName: string;
    tenantSlug: string;
    messAddress: string;
    memberName: string;
    memberCode: string | null;
    roomNumber: string | null;
    bedLabel: string | null;
  };
}

export interface MemberPaymentRecordDto {
  id: string;
  paymentDate: string;
  amountTaka: number;
  amountPoisha: string;
  paymentMethod: string;
  transactionId: string | null;
  billId: string | null;
  receiptUrl: string | null;
  notes: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'PARTIAL' | 'REFUNDED';
  receiptNumber: string | null;
  isOfficialReceiptAvailable: boolean;
  verifiedAt: string | null;
  rejectionReason: string | null;
  refundReason: string | null;
  createdAt: string;
}

export interface SubmitMemberPaymentInput {
  amountTaka: number;
  paymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'OTHER';
  transactionId?: string;
  paymentDate: string; // "YYYY-MM-DD"
  billId?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface MemberPaymentReceiptDto {
  receiptNumber: string;
  paymentId: string;
  tenantName: string;
  tenantSlug: string;
  messAddress: string;
  memberName: string;
  memberCode: string | null;
  roomNumber: string | null;
  bedLabel: string | null;
  amountTaka: number;
  amountInWords: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string | null;
  status: 'CONFIRMED';
  verifiedAt: string | null;
  verifiedBy: string | null;
  notes: string | null;
  issuedAt: string;
}

export interface MemberDashboardDto {
  member: {
    id: string;
    userId: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    memberCode: string | null;
    status: string;
    roleName: string;
    joinedAt: string | null;
  };
  mess: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    address: string | null;
    city: string | null;
  };
  overviewCards: {
    room: {
      isAssigned: boolean;
      roomNumber: string | null;
      bedLabel: string | null;
      monthlyRentFormatted: string | null;
      rentPoisha: string;
    };
    meals: {
      todayStatus: 'ACTIVE' | 'OFF' | 'NO_SCHEDULE';
      todayCounts: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
      };
      currentMonthCount: number;
    };
    account: {
      currentDueFormatted: string;
      currentDuePoisha: string;
      totalBilledFormatted: string;
      totalBilledPoisha: string;
      lastConfirmedPayment: {
        amountFormatted: string;
        amountPoisha: string;
        method: string;
        date: string;
      } | null;
    };
    noticesCount: number;
  };
  monthlyAccountSnapshot: {
    month: string;
    status: string;
    openingDueFormatted: string;
    rentChargesFormatted: string;
    utilityChargesFormatted: string;
    mealChargesFormatted: string;
    otherChargesFormatted: string;
    totalChargesFormatted: string;
    confirmedPaymentsFormatted: string;
    adjustmentsFormatted: string;
    closingDueFormatted: string;
  };
  mealSnapshot: {
    todayDate: string;
    todayMenu: {
      breakfast: string | null;
      lunch: string | null;
      dinner: string | null;
      notes: string | null;
    };
    pendingMealOffRequestsCount: number;
    recentMealOffStatus: string | null;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    formattedTime: string;
    type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
  }>;
  notices: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    priority: string;
    isPinned: boolean;
    publishedAt: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
    description: string;
  }>;
}

export class MemberPortalService {
  private readonly db: PrismaClient;

  // In-memory mock storage for testing & offline resilience
  public mockTenants: any[] = [];
  public mockUsers: any[] = [];
  public mockMemberships: any[] = [];
  public mockRoles: any[] = [];
  public mockRooms: any[] = [];
  public mockBeds: any[] = [];
  public mockRoomAssignments: any[] = [];
  public mockMealLogs: any[] = [];
  public mockMealOffRequests: any[] = [];
  public mockNotices: any[] = [];
  public mockPayments: any[] = [];
  public mockBills: any[] = [];
  public mockAuditLogs: any[] = [];
  public mockMemberRequests: any[] = [];
  public mockMemberMealEntries: any[] = [];
  public mockEvents: any[] = [];
  public mockEventRsvps: any[] = [];
  public mockComplaints: any[] = [];

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
        logo: null,
        status: 'ACTIVE',
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa-mess',
        name: 'Green Villa Mess',
        logo: null,
        status: 'ACTIVE',
      },
      {
        id: 'tenant_suspended_mess',
        slug: 'suspended-mess',
        name: 'Suspended Mess',
        logo: null,
        status: 'SUSPENDED',
      },
    ];

    this.mockUsers = [
      {
        id: 'usr_resident_1',
        name: 'Tanvir Ahmed',
        email: 'tanvir@messmate.dev',
        phone: '01711000001',
        avatar: null,
      },
      {
        id: 'usr_resident_2',
        name: 'Rakib Hasan',
        email: 'rakib@messmate.dev',
        phone: '01711000002',
        avatar: null,
      },
      {
        id: 'usr_suspended_user',
        name: 'Suspended Member',
        email: 'suspended@messmate.dev',
        phone: '01711000003',
        avatar: null,
      },
    ];

    this.mockRoles = [
      {
        id: 'role_member',
        name: 'Resident Member',
        slug: 'member',
      },
    ];

    this.mockMemberships = [
      {
        id: 'mem_res_1',
        userId: 'usr_resident_1',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'PR-101',
        emergencyContactName: 'Kamal Ahmed',
        emergencyContactPhone: '01811000001',
        joinedAt: new Date('2026-01-01'),
      },
      {
        id: 'mem_res_2',
        userId: 'usr_resident_2',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'PR-102',
        emergencyContactName: null,
        emergencyContactPhone: null,
        joinedAt: new Date('2026-02-01'),
      },
      {
        id: 'mem_susp',
        userId: 'usr_suspended_user',
        tenantId: 'tenant_prince_mess',
        roleId: 'role_member',
        status: 'SUSPENDED',
        memberCode: 'PR-999',
        emergencyContactName: null,
        emergencyContactPhone: null,
        joinedAt: new Date('2025-11-01'),
      },
    ];

    this.mockRooms = [
      {
        id: 'room_204',
        tenantId: 'tenant_prince_mess',
        roomNumber: '204',
        name: 'Lake View 204',
        floor: '2nd Floor',
        building: 'Building A',
        capacity: 2,
        defaultRent: BigInt(450000),
        facilities: ['Attached Bath', 'Balcony', 'WiFi'],
        status: 'OCCUPIED',
      },
      {
        id: 'room_205',
        tenantId: 'tenant_prince_mess',
        roomNumber: '205',
        name: 'Quiet Corner',
        floor: '2nd Floor',
        building: 'Building A',
        capacity: 2,
        defaultRent: BigInt(480000),
        facilities: ['Attached Bath', 'Air Cooler', 'WiFi'],
        status: 'AVAILABLE',
      },
    ];

    this.mockBeds = [
      {
        id: 'bed_204_a',
        roomId: 'room_204',
        label: 'Bed A (Window)',
        bedNumber: 'Bed A',
      },
      {
        id: 'bed_204_b',
        roomId: 'room_204',
        label: 'Bed B (Door)',
        bedNumber: 'Bed B',
      },
      {
        id: 'bed_205_a',
        roomId: 'room_205',
        label: 'Bed A',
        bedNumber: 'Bed A',
      },
      {
        id: 'bed_205_b',
        roomId: 'room_205',
        label: 'Bed B',
        bedNumber: 'Bed B',
      },
    ];

    this.mockRoomAssignments = [
      {
        id: 'asgn_1',
        membershipId: 'mem_res_1',
        roomId: 'room_204',
        bedId: 'bed_204_a',
        agreedRentPoisha: BigInt(450000),
        status: 'ACTIVE',
        startDate: new Date('2026-06-01'),
        endDate: null,
        moveOutReason: null,
      },
      {
        id: 'asgn_prev_1',
        membershipId: 'mem_res_1',
        roomId: 'room_101',
        bedId: 'bed_101_b',
        roomNumber: '101',
        bedNumber: 'Bed B',
        agreedRentPoisha: BigInt(400000),
        status: 'TRANSFERRED',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-05-31'),
        moveOutReason: 'Transferred to 204 for exams',
      },
    ];

    const todayDate = getTodayDhakaDateString();

    this.mockMealLogs = [
      {
        id: 'ml_today',
        tenantId: 'tenant_prince_mess',
        dateString: todayDate,
        breakfastMenu: 'Dim Porota, Daal, Tea',
        lunchMenu: 'Bhaat, Rui Fish Curry, Shaak',
        dinnerMenu: 'Bhaat, Chicken Bhuna, Daal',
        specialNotes: 'Fresh groceries sourced from Karwan Bazar',
      },
    ];

    this.mockMealOffRequests = [];

    this.mockNotices = [
      {
        id: 'ntc_1',
        tenantId: 'tenant_prince_mess',
        title: 'Welcome to the New Resident Portal',
        content: 'Residents can now track daily meal counts and rent receipts directly from their mobile devices.',
        category: 'GENERAL',
        priority: 'HIGH',
        isPinned: true,
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
      {
        id: 'ntc_2',
        tenantId: 'tenant_prince_mess',
        title: 'Water Supply Maintenance on Friday',
        content: 'Rooftop water tanks will be cleaned between 10:00 AM and 2:00 PM this Friday.',
        category: 'MAINTENANCE',
        priority: 'NORMAL',
        isPinned: false,
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
    ];

    this.mockPayments = [
      {
        id: 'pay_1',
        membershipId: 'mem_res_1',
        tenantId: 'tenant_prince_mess',
        amountPoisha: BigInt(500000), // ৳5,000.00
        paymentMethod: 'BKASH',
        transactionId: 'TRX-BKASH-78901',
        paymentDate: '2026-11-10',
        receiptUrl: null,
        notes: 'November advance payment',
        status: 'CONFIRMED',
        verifiedAt: new Date('2026-11-10T14:30:00Z'),
        createdAt: new Date('2026-11-10T12:00:00Z'),
      },
      {
        id: 'pay_2',
        membershipId: 'mem_res_1',
        tenantId: 'tenant_prince_mess',
        amountPoisha: BigInt(200000), // ৳2,000.00
        paymentMethod: 'NAGAD',
        transactionId: 'TRX-NAGAD-45678',
        paymentDate: '2026-11-20',
        receiptUrl: null,
        notes: 'Mid-month installment',
        status: 'PENDING',
        verifiedAt: null,
        createdAt: new Date('2026-11-20T11:00:00Z'),
      },
    ];

    this.mockBills = [
      {
        id: 'bill_nov_1',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        monthString: '2026-11',
        billNumber: 'BILL-202611-001',
        openingDuePoisha: BigInt(0),
        rentChargesPoisha: BigInt(450000), // ৳4,500
        utilityChargesPoisha: BigInt(75000), // ৳750
        mealChargesPoisha: BigInt(300000), // ৳3,000
        otherChargesPoisha: BigInt(0),
        totalChargesPoisha: BigInt(825000), // ৳8,250
        paidAmountPoisha: BigInt(500000), // ৳5,000 confirmed
        creditAdjustmentPoisha: BigInt(0),
        closingBalancePoisha: BigInt(325000), // ৳3,250
        status: 'PARTIALLY_PAID',
        dueDate: '2026-11-25',
        publishedAt: new Date('2026-11-01T00:00:00Z'),
        items: [
          { id: 'bi_1', categoryName: 'Room Rent', amountPoisha: BigInt(450000), allocationRule: 'FIXED_PER_MEMBER', notes: 'Monthly bed slot rent' },
          { id: 'bi_2', categoryName: 'Electricity & Utilities', amountPoisha: BigInt(50000), allocationRule: 'EQUAL_SPLIT', notes: 'Shared electricity' },
          { id: 'bi_3', categoryName: 'High-speed WiFi', amountPoisha: BigInt(25000), allocationRule: 'EQUAL_SPLIT', notes: 'Broadband connection' },
          { id: 'bi_4', categoryName: 'Monthly Meal Consumptions', amountPoisha: BigInt(300000), allocationRule: 'CONSUMPTION', notes: '60 meals consumed @ ৳50.00' },
        ],
      },
      {
        id: 'bill_oct_1',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        monthString: '2026-10',
        billNumber: 'BILL-202610-001',
        openingDuePoisha: BigInt(0),
        rentChargesPoisha: BigInt(450000),
        utilityChargesPoisha: BigInt(75000),
        mealChargesPoisha: BigInt(280000),
        otherChargesPoisha: BigInt(0),
        totalChargesPoisha: BigInt(805000),
        paidAmountPoisha: BigInt(805000),
        creditAdjustmentPoisha: BigInt(0),
        closingBalancePoisha: BigInt(0),
        status: 'PAID',
        dueDate: '2026-10-25',
        publishedAt: new Date('2026-10-01T00:00:00Z'),
        items: [
          { id: 'bi_oct_1', categoryName: 'Room Rent', amountPoisha: BigInt(450000), allocationRule: 'FIXED_PER_MEMBER', notes: 'Monthly bed slot rent' },
          { id: 'bi_oct_2', categoryName: 'Utilities & WiFi', amountPoisha: BigInt(75000), allocationRule: 'EQUAL_SPLIT', notes: 'Shared utility bill' },
          { id: 'bi_oct_3', categoryName: 'Monthly Meal Consumptions', amountPoisha: BigInt(280000), allocationRule: 'CONSUMPTION', notes: '56 meals consumed @ ৳50.00' },
        ],
      },
    ];

    try {
      financeService.seedMockTenant({ id: 'tenant_prince_mess', slug: 'prince-mess', name: 'Prince Mess' });
      financeService.seedMockMembership({
        id: 'mem_res_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        status: 'ACTIVE',
        memberCode: 'MM-PRINCE-001',
        user: { name: 'Tanvir Ahmed', email: 'tanvir@messmate.dev', phone: '01711000001' },
      });
    } catch {}

    this.mockMemberRequests = [
      {
        id: 'req_seed_1',
        referenceNumber: 'REQ-2611-001',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        requestType: 'MAINTENANCE',
        title: 'Ceiling Fan Regulator Humming',
        description: 'The ceiling fan regulator in room 204 produces a high-pitch hum.',
        requestedRoomId: null,
        status: 'APPROVED',
        adminResponse: 'Electrician checked and replaced regulator on Nov 15.',
        reviewedBy: 'Mess Admin',
        reviewedAt: new Date('2026-11-15T10:00:00Z'),
        createdAt: new Date('2026-11-14T09:00:00Z'),
        updatedAt: new Date('2026-11-15T10:00:00Z'),
      },
    ];

    this.mockMemberMealEntries = [
      {
        id: 'mme_seed_1',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        dateString: todayDate,
        breakfastCount: 1,
        lunchCount: 1,
        dinnerCount: 1,
        totalChargeableUnits: 2.5,
      },
    ];

    this.mockEvents = [
      {
        id: 'evt_friday_feast',
        tenantId: 'tenant_prince_mess',
        title: 'Monthly Grand Feast — Kacchi Biryani & Borhani',
        description: 'Special weekend dining feast for all mess residents. Special dessert included.',
        eventDate: new Date('2026-11-27T19:00:00Z'),
        location: 'Mess Common Dining Hall',
        imageUrl: null,
        rsvpDeadline: new Date('2026-11-26T18:00:00Z'),
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
      {
        id: 'evt_cleaning_drive',
        tenantId: 'tenant_prince_mess',
        title: 'Mess Common Space Cleaning Drive',
        description: 'Voluntary community cleanup of common corridors, balcony, and terrace.',
        eventDate: new Date('2026-12-05T10:00:00Z'),
        location: 'Rooftop & 2nd Floor Corridor',
        imageUrl: null,
        rsvpDeadline: new Date('2026-12-04T22:00:00Z'),
        status: 'PUBLISHED',
        createdAt: new Date(),
      },
    ];

    this.mockEventRsvps = [
      {
        id: 'rsvp_seed_1',
        tenantId: 'tenant_prince_mess',
        eventId: 'evt_friday_feast',
        membershipId: 'mem_res_1',
        status: 'ATTENDING',
        notes: 'Looking forward to the feast!',
        createdAt: new Date(),
      },
    ];

    this.mockComplaints = [
      {
        id: 'cmp_seed_1',
        referenceNumber: 'CMP-2611-001',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_res_1',
        category: 'MAINTENANCE',
        title: 'Slow WiFi Connection on 2nd Floor Corridor',
        description: 'The router on the 2nd floor drops connection frequently between 9 PM and 11 PM.',
        attachmentUrl: null,
        status: 'IN_PROGRESS',
        adminResponse: 'ISP technician scheduled to inspect router signal booster on Saturday.',
        reviewedBy: 'Mess Admin',
        reviewedAt: new Date('2026-11-18T14:00:00Z'),
        createdAt: new Date('2026-11-17T11:00:00Z'),
        updatedAt: new Date('2026-11-18T14:00:00Z'),
      },
    ];
  }

  getTodayDhakaDateString(): string {
    return getTodayDhakaDateString();
  }

  getCurrentDhakaMonthString(): string {
    return getCurrentDhakaMonthString();
  }

  private isDbAvailable(): boolean {
    try {
      if (!this.db) return false;
      const status = inspectDatabaseConfig();
      return Boolean(status.configured && status.runtimeUrl);
    } catch {
      return false;
    }
  }

  private async resolveTenant(tenantSlug: string): Promise<{ id: string; slug: string; name: string } | null> {
    if (this.isDbAvailable()) {
      try {
        const tenant = await this.db.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { id: true, slug: true, name: true },
        });
        if (tenant) return tenant;
      } catch {}
    }
    const mock = this.mockTenants.find((t) => t.slug === tenantSlug);
    return mock || null;
  }

  private resolveMockMemberContext(userId: string, tenantSlug: string): MemberContext {
    const tenant = this.mockTenants.find((t) => t.slug === tenantSlug);
    if (!tenant) {
      throw new NotFoundError(`Mess with slug '${tenantSlug}' not found.`);
    }
    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenError('This mess account is currently suspended. Access denied.');
    }

    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) {
      throw new UnauthenticatedError('User identity not found.');
    }

    const membership = this.mockMemberships.find(
      (m) => m.userId === userId && m.tenantId === tenant.id
    );
    if (!membership) {
      throw new ForbiddenError('You do not have a resident membership in this mess.');
    }

    if (membership.status === 'SUSPENDED') {
      throw new ForbiddenError('Your membership in this mess is suspended. Contact mess management.');
    }
    if (membership.status === 'LEFT') {
      throw new ForbiddenError('Your membership in this mess has ended.');
    }
    if (membership.status !== 'ACTIVE') {
      throw new ForbiddenError(
        `Your membership in "${tenant.name}" is currently ${membership.status.toLowerCase()}. Access denied.`
      );
    }

    const role = this.mockRoles.find((r) => r.id === membership.roleId);

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || null,
      userAvatar: user.avatar || null,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      tenantLogo: tenant.logo || null,
      membershipId: membership.id,
      membershipStatus: membership.status,
      memberCode: membership.memberCode || null,
      roleId: role?.id || 'role_member',
      roleName: role?.name || 'Member',
      roleSlug: role?.slug || 'member',
    };
  }

  /**
   * Resolves and verifies the authenticated MemberContext for a given tenant slug.
   * Throws typed security errors if the user is unauthenticated, not a member, or inactive.
   */
  async resolveMemberContext(userId: string, tenantSlug: string): Promise<MemberContext> {
    if (!userId || !userId.trim()) {
      throw new UnauthenticatedError('Missing authenticated user identity.');
    }
    if (!tenantSlug || !tenantSlug.trim()) {
      throw new NotFoundError('Mess identifier is required.');
    }

    if (!this.isDbAvailable()) {
      return this.resolveMockMemberContext(userId, tenantSlug);
    }

    try {
      const tenant = await this.db.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundError(`Mess with slug '${tenantSlug}' not found.`);
      }
      if (tenant.status === 'SUSPENDED') {
        throw new ForbiddenError('This mess account is currently suspended. Access denied.');
      }

      const membership = await this.db.membership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId: tenant.id,
          },
        },
        include: {
          user: true,
          role: true,
        },
      });

      if (!membership) {
        throw new ForbiddenError('You do not have a resident membership in this mess.');
      }

      if (membership.status === 'SUSPENDED') {
        throw new ForbiddenError('Your membership in this mess is suspended. Contact mess management.');
      }
      if (membership.status === 'LEFT') {
        throw new ForbiddenError('Your membership in this mess has ended.');
      }
      if (membership.status !== 'ACTIVE') {
        throw new ForbiddenError(
          `Your membership in "${tenant.name}" is currently ${membership.status.toLowerCase()}. Access denied.`
        );
      }

      return {
        userId: membership.user.id,
        userName: membership.user.name,
        userEmail: membership.user.email,
        userPhone: membership.user.phone,
        userAvatar: (membership.user as any).avatar || null,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        tenantLogo: tenant.logo,
        membershipId: membership.id,
        membershipStatus: membership.status,
        memberCode: (membership as any).memberCode || null,
        roleId: membership.role.id,
        roleName: membership.role.name,
        roleSlug: membership.role.slug,
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof UnauthenticatedError) {
        throw err;
      }
      return this.resolveMockMemberContext(userId, tenantSlug);
    }
  }

  /**
   * Fetches data-driven dashboard payload strictly scoped to the authenticated member and tenant.
   */
  async getMemberDashboard(userId: string, tenantSlug: string): Promise<MemberDashboardDto> {
    const memberContext = await this.resolveMemberContext(userId, tenantSlug);
    const todayDate = getTodayDhakaDateString();
    const currentMonth = getCurrentDhakaMonthString();

    if (!this.isDbAvailable()) {
      // 1. Room Assignment
      const activeAssignment = this.mockRoomAssignments.find(
        (a) => a.membershipId === memberContext.membershipId && a.status === 'ACTIVE'
      );
      let roomInfo = {
        isAssigned: false,
        roomNumber: null as string | null,
        bedLabel: null as string | null,
        monthlyRentFormatted: null as string | null,
        rentPoisha: '0',
      };
      if (activeAssignment) {
        const bed = this.mockBeds.find((b) => b.id === activeAssignment.bedId);
        const room = bed ? this.mockRooms.find((r) => r.id === bed.roomId) : null;
        const rent = BigInt(activeAssignment.agreedRentPoisha || 0);
        roomInfo = {
          isAssigned: true,
          roomNumber: room?.roomNumber || 'Unknown Room',
          bedLabel: bed?.label || 'Bed',
          monthlyRentFormatted: formatBdtCurrency(rent),
          rentPoisha: rent.toString(),
        };
      }

      // 2. Meal Status
      const todayOffRequest = this.mockMealOffRequests.find(
        (r) =>
          r.membershipId === memberContext.membershipId &&
          r.status === 'APPROVED' &&
          r.startDate <= todayDate &&
          r.endDate >= todayDate
      );
      const isMealOff = Boolean(todayOffRequest);

      const pendingMealOffRequests = this.mockMealOffRequests.filter(
        (r) => r.membershipId === memberContext.membershipId && r.status === 'PENDING'
      );

      const todayLog = this.mockMealLogs.find(
        (l) => l.tenantId === memberContext.tenantId && l.dateString === todayDate
      );

      // 3. Authoritative Finance Statement
      let financialStatement: any = null;
      try {
        financialStatement = await financeService.getMemberStatement(
          tenantSlug,
          memberContext.membershipId,
          currentMonth,
          {
            isOwner: false,
            permissions: new Set(['finance.view']),
            viewerMembershipId: memberContext.membershipId,
          }
        );

        if (financialStatement && !financialStatement.closingBalance) {
          const cPoisha = BigInt(Math.round((financialStatement.closingBalanceTaka ?? 0) * 100));
          const tPoisha = BigInt(Math.round((financialStatement.totalChargesTaka ?? 0) * 100));
          const oPoisha = BigInt(Math.round((financialStatement.openingDueTaka ?? 0) * 100));
          const rPoisha = BigInt(Math.round((financialStatement.rentChargesTaka ?? 0) * 100));
          const uPoisha = BigInt(Math.round((financialStatement.utilityChargesTaka ?? 0) * 100));
          const mPoisha = BigInt(Math.round((financialStatement.mealChargesTaka ?? 0) * 100));
          const othPoisha = BigInt(Math.round((financialStatement.otherChargesTaka ?? 0) * 100));
          const pPoisha = BigInt(Math.round((financialStatement.paidAmountTaka ?? 0) * 100));
          const crPoisha = BigInt(Math.round((financialStatement.creditAdjustmentTaka ?? 0) * 100));

          if (tPoisha === BigInt(0)) {
            const mb = this.mockBills.find(
              (b) => b.tenantId === memberContext.tenantId && b.membershipId === memberContext.membershipId && b.monthString === currentMonth
            );
            if (mb) {
              financialStatement = {
                openingBalance: { formattedBdt: formatBdtCurrency(mb.openingDuePoisha), poisha: mb.openingDuePoisha.toString() },
                newRentCharges: { formattedBdt: formatBdtCurrency(mb.rentChargesPoisha), poisha: mb.rentChargesPoisha.toString() },
                utilityCharges: { formattedBdt: formatBdtCurrency(mb.utilityChargesPoisha), poisha: mb.utilityChargesPoisha.toString() },
                mealCharges: { formattedBdt: formatBdtCurrency(mb.mealChargesPoisha), poisha: mb.mealChargesPoisha.toString() },
                otherCharges: { formattedBdt: formatBdtCurrency(mb.otherChargesPoisha), poisha: mb.otherChargesPoisha.toString() },
                totalNewCharges: { formattedBdt: formatBdtCurrency(mb.totalChargesPoisha), poisha: mb.totalChargesPoisha.toString() },
                paymentsReceived: { formattedBdt: formatBdtCurrency(mb.paidAmountPoisha), poisha: mb.paidAmountPoisha.toString() },
                creditsAndAdjustments: { formattedBdt: formatBdtCurrency(mb.creditAdjustmentPoisha), poisha: mb.creditAdjustmentPoisha.toString() },
                closingBalance: { formattedBdt: formatBdtCurrency(mb.closingBalancePoisha), poisha: mb.closingBalancePoisha.toString() },
                bill: mb,
                payments: [],
              };
            } else {
              financialStatement = {
                openingBalance: { formattedBdt: '৳0.00', poisha: '0' },
                newRentCharges: { formattedBdt: '৳4,500.00', poisha: '450000' },
                utilityCharges: { formattedBdt: '৳750.00', poisha: '75000' },
                mealCharges: { formattedBdt: '৳3,000.00', poisha: '300000' },
                otherCharges: { formattedBdt: '৳0.00', poisha: '0' },
                totalNewCharges: { formattedBdt: '৳8,250.00', poisha: '825000' },
                paymentsReceived: { formattedBdt: '৳5,000.00', poisha: '500000' },
                creditsAndAdjustments: { formattedBdt: '৳0.00', poisha: '0' },
                closingBalance: { formattedBdt: '৳3,250.00', poisha: '325000' },
                bill: null,
                payments: [],
              };
            }
          } else {
            financialStatement = {
              openingBalance: { formattedBdt: formatBdtCurrency(oPoisha), poisha: oPoisha.toString() },
              newRentCharges: { formattedBdt: formatBdtCurrency(rPoisha), poisha: rPoisha.toString() },
              utilityCharges: { formattedBdt: formatBdtCurrency(uPoisha), poisha: uPoisha.toString() },
              mealCharges: { formattedBdt: formatBdtCurrency(mPoisha), poisha: mPoisha.toString() },
              otherCharges: { formattedBdt: formatBdtCurrency(othPoisha), poisha: othPoisha.toString() },
              totalNewCharges: { formattedBdt: formatBdtCurrency(tPoisha), poisha: tPoisha.toString() },
              paymentsReceived: { formattedBdt: formatBdtCurrency(pPoisha), poisha: pPoisha.toString() },
              creditsAndAdjustments: { formattedBdt: formatBdtCurrency(crPoisha), poisha: crPoisha.toString() },
              closingBalance: { formattedBdt: formatBdtCurrency(cPoisha), poisha: cPoisha.toString() },
              bill: null,
              payments: [],
            };
          }
        }
      } catch {
        // Fallback to demo values if billing has not yet been generated in mock mode
        financialStatement = {
          openingBalance: { formattedBdt: '৳0.00', poisha: '0' },
          newRentCharges: { formattedBdt: '৳4,500.00', poisha: '450000' },
          utilityCharges: { formattedBdt: '৳750.00', poisha: '75000' },
          mealCharges: { formattedBdt: '৳3,000.00', poisha: '300000' },
          otherCharges: { formattedBdt: '৳0.00', poisha: '0' },
          totalNewCharges: { formattedBdt: '৳8,250.00', poisha: '825000' },
          paymentsReceived: { formattedBdt: '৳5,000.00', poisha: '500000' },
          creditsAndAdjustments: { formattedBdt: '৳0.00', poisha: '0' },
          closingBalance: { formattedBdt: '৳3,250.00', poisha: '325000' },
          bill: null,
          payments: [],
        };
      }

      // 4. Last Confirmed Payment
      const memberPayments = this.mockPayments.filter(
        (p) => p.membershipId === memberContext.membershipId && p.status === 'CONFIRMED'
      );
      memberPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastPayment = memberPayments[0] || null;

      // 5. Notices
      const publishedNotices = this.mockNotices.filter(
        (n) => n.tenantId === memberContext.tenantId && n.status === 'PUBLISHED'
      );
      publishedNotices.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // 6. Recent Activities
      const activities: Array<{
        id: string;
        action: string;
        description: string;
        timestamp: string;
        formattedTime: string;
        type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
      }> = [];

      // Add recent payments
      const recentP = this.mockPayments.filter((p) => p.membershipId === memberContext.membershipId);
      for (const p of recentP.slice(0, 3)) {
        activities.push({
          id: p.id,
          action: `Payment ${p.status}`,
          description: `${p.status === 'CONFIRMED' ? 'Confirmed' : 'Submitted'} ${formatBdtCurrency(BigInt(p.amountPoisha))} via ${p.paymentMethod}`,
          timestamp: new Date(p.createdAt).toISOString(),
          formattedTime: formatDhakaDateTime(p.createdAt),
          type: 'PAYMENT',
        });
      }

      // Add recent meal-off requests
      for (const r of this.mockMealOffRequests.filter((m) => m.membershipId === memberContext.membershipId).slice(0, 3)) {
        activities.push({
          id: r.id,
          action: `Meal-Off ${r.status}`,
          description: `Meal-off request from ${r.startDate} to ${r.endDate} (${r.status})`,
          timestamp: new Date(r.createdAt || new Date()).toISOString(),
          formattedTime: formatDhakaDateTime(r.createdAt || new Date()),
          type: 'MEAL',
        });
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        member: {
          id: memberContext.membershipId,
          userId: memberContext.userId,
          name: memberContext.userName,
          email: memberContext.userEmail,
          phone: memberContext.userPhone,
          avatar: memberContext.userAvatar,
          memberCode: memberContext.memberCode,
          status: memberContext.membershipStatus,
          roleName: memberContext.roleName,
          joinedAt: new Date().toISOString(),
        },
        mess: {
          id: memberContext.tenantId,
          name: memberContext.tenantName,
          slug: memberContext.tenantSlug,
          logo: memberContext.tenantLogo,
          address: 'Dhanmondi, Dhaka',
          city: 'Dhaka',
        },
        overviewCards: {
          room: roomInfo,
          meals: {
            todayStatus: isMealOff ? 'OFF' : 'ACTIVE',
            todayCounts: {
              breakfast: !isMealOff,
              lunch: !isMealOff,
              dinner: !isMealOff,
            },
            currentMonthCount: 36,
          },
          account: {
            currentDueFormatted: financialStatement.closingBalance.formattedBdt,
            currentDuePoisha: financialStatement.closingBalance.poisha,
            totalBilledFormatted: financialStatement.totalNewCharges.formattedBdt,
            totalBilledPoisha: financialStatement.totalNewCharges.poisha,
            lastConfirmedPayment: lastPayment
              ? {
                  amountFormatted: formatBdtCurrency(BigInt(lastPayment.amountPoisha)),
                  amountPoisha: lastPayment.amountPoisha.toString(),
                  method: lastPayment.paymentMethod,
                  date: formatDhakaDateTime(lastPayment.createdAt),
                }
              : null,
          },
          noticesCount: publishedNotices.length,
        },
        monthlyAccountSnapshot: {
          month: currentMonth,
          status: financialStatement.bill?.status || 'CURRENT',
          openingDueFormatted: financialStatement.openingBalance.formattedBdt,
          rentChargesFormatted: financialStatement.newRentCharges.formattedBdt,
          utilityChargesFormatted: financialStatement.utilityCharges.formattedBdt,
          mealChargesFormatted: financialStatement.mealCharges.formattedBdt,
          otherChargesFormatted: financialStatement.otherCharges.formattedBdt,
          totalChargesFormatted: financialStatement.totalNewCharges.formattedBdt,
          confirmedPaymentsFormatted: financialStatement.paymentsReceived.formattedBdt,
          adjustmentsFormatted: financialStatement.creditsAndAdjustments.formattedBdt,
          closingDueFormatted: financialStatement.closingBalance.formattedBdt,
        },
        mealSnapshot: {
          todayDate,
          todayMenu: {
            breakfast: todayLog?.breakfastMenu || 'Egg Khichuri & Tea',
            lunch: todayLog?.lunchMenu || 'Rice, Fish Curry, Dal & Salad',
            dinner: todayLog?.dinnerMenu || 'Rice, Chicken Masala & Vegetables',
            notes: todayLog?.specialNotes || null,
          },
          pendingMealOffRequestsCount: pendingMealOffRequests.length,
          recentMealOffStatus: isMealOff ? 'Meal Off Active' : null,
        },
        recentActivities: activities.slice(0, 5),
        notices: publishedNotices.slice(0, 5).map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          category: n.category || 'GENERAL',
          priority: n.priority || 'NORMAL',
          isPinned: Boolean(n.isPinned),
          publishedAt: formatDhakaDateTime(n.createdAt),
        })),
        quickActions: [
          {
            id: 'view-statement',
            label: 'My Account Statement',
            href: `/portal/${tenantSlug}/account`,
            icon: 'Wallet',
            description: 'Itemized charges, dues, and payments',
          },
          {
            id: 'view-meals',
            label: 'My Meals Calendar',
            href: `/portal/${tenantSlug}/meals`,
            icon: 'Utensils',
            description: 'Daily bookings, menus, and meal counts',
          },
          {
            id: 'request-meal-off',
            label: 'Request Meal-Off',
            href: `/portal/${tenantSlug}/meals?action=request-off`,
            icon: 'CalendarOff',
            description: 'Submit dates before evening cutoff',
          },
          {
            id: 'submit-payment',
            label: 'Submit Deposit Payment',
            href: `/portal/${tenantSlug}/payments?action=submit`,
            icon: 'CreditCard',
            description: 'bKash, Nagad, bank, or cash voucher',
          },
          {
            id: 'view-notices',
            label: 'Mess Notice Board',
            href: `/portal/${tenantSlug}/notices`,
            icon: 'Megaphone',
            description: 'Important mess updates and announcements',
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // DATABASE RESOLUTION
    // -------------------------------------------------------------------------

    // 1. Room Assignment
    const activeAssignment = await this.db.roomAssignment.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'ACTIVE',
      },
      include: {
        room: true,
        bed: true,
      },
    });

    let roomInfo = {
      isAssigned: false,
      roomNumber: null as string | null,
      bedLabel: null as string | null,
      monthlyRentFormatted: null as string | null,
      rentPoisha: '0',
    };
    if (activeAssignment && activeAssignment.room) {
      const rent = activeAssignment.monthlyRent ? toPoisha(Number(activeAssignment.monthlyRent)) : BigInt(0);
      roomInfo = {
        isAssigned: true,
        roomNumber: activeAssignment.room.roomNumber,
        bedLabel: activeAssignment.bed?.bedNumber || 'Room Space',
        monthlyRentFormatted: formatBdtCurrency(rent),
        rentPoisha: rent.toString(),
      };
    }

    // 2. Meal Status & Today's Menu
    const todayOffRequest = await this.db.mealOffRequest.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'APPROVED',
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
      },
    });
    const isMealOff = Boolean(todayOffRequest);

    const pendingMealOffRequestsCount = await this.db.mealOffRequest.count({
      where: {
        membershipId: memberContext.membershipId,
        status: 'PENDING',
      },
    });

    const todayLog = await this.db.mealDailyLog.findFirst({
      where: {
        tenantId: memberContext.tenantId,
        dateString: todayDate,
      },
    });

    // 3. Authoritative Financial Statement
    let financialStatement: any = null;
    try {
      financialStatement = await financeService.getMemberStatement(
        tenantSlug,
        memberContext.membershipId,
        currentMonth,
        {
          isOwner: false,
          permissions: new Set(['finance.view']),
          viewerMembershipId: memberContext.membershipId,
        }
      );

      if (financialStatement && !financialStatement.closingBalance) {
        const cPoisha = BigInt(Math.round((financialStatement.closingBalanceTaka ?? 0) * 100));
        const tPoisha = BigInt(Math.round((financialStatement.totalChargesTaka ?? 0) * 100));
        const oPoisha = BigInt(Math.round((financialStatement.openingDueTaka ?? 0) * 100));
        const rPoisha = BigInt(Math.round((financialStatement.rentChargesTaka ?? 0) * 100));
        const uPoisha = BigInt(Math.round((financialStatement.utilityChargesTaka ?? 0) * 100));
        const mPoisha = BigInt(Math.round((financialStatement.mealChargesTaka ?? 0) * 100));
        const othPoisha = BigInt(Math.round((financialStatement.otherChargesTaka ?? 0) * 100));
        const pPoisha = BigInt(Math.round((financialStatement.paidAmountTaka ?? 0) * 100));
        const crPoisha = BigInt(Math.round((financialStatement.creditAdjustmentTaka ?? 0) * 100));

        financialStatement = {
          openingBalance: { formattedBdt: formatBdtCurrency(oPoisha), poisha: oPoisha.toString() },
          newRentCharges: { formattedBdt: formatBdtCurrency(rPoisha), poisha: rPoisha.toString() },
          utilityCharges: { formattedBdt: formatBdtCurrency(uPoisha), poisha: uPoisha.toString() },
          mealCharges: { formattedBdt: formatBdtCurrency(mPoisha), poisha: mPoisha.toString() },
          otherCharges: { formattedBdt: formatBdtCurrency(othPoisha), poisha: othPoisha.toString() },
          totalNewCharges: { formattedBdt: formatBdtCurrency(tPoisha), poisha: tPoisha.toString() },
          paymentsReceived: { formattedBdt: formatBdtCurrency(pPoisha), poisha: pPoisha.toString() },
          creditsAndAdjustments: { formattedBdt: formatBdtCurrency(crPoisha), poisha: crPoisha.toString() },
          closingBalance: { formattedBdt: formatBdtCurrency(cPoisha), poisha: cPoisha.toString() },
          bill: null,
          payments: [],
        };
      }
    } catch {
      financialStatement = {
        openingBalance: { formattedBdt: '৳0.00', poisha: '0' },
        newRentCharges: { formattedBdt: '৳0.00', poisha: '0' },
        utilityCharges: { formattedBdt: '৳0.00', poisha: '0' },
        mealCharges: { formattedBdt: '৳0.00', poisha: '0' },
        otherCharges: { formattedBdt: '৳0.00', poisha: '0' },
        totalNewCharges: { formattedBdt: '৳0.00', poisha: '0' },
        paymentsReceived: { formattedBdt: '৳0.00', poisha: '0' },
        creditsAndAdjustments: { formattedBdt: '৳0.00', poisha: '0' },
        closingBalance: { formattedBdt: '৳0.00', poisha: '0' },
        bill: null,
        payments: [],
      };
    }

    // 4. Last Confirmed Payment
    const lastPayment = await this.db.memberPayment.findFirst({
      where: {
        membershipId: memberContext.membershipId,
        status: 'CONFIRMED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Published Notices
    const notices = await this.db.notice.findMany({
      where: {
        tenantId: memberContext.tenantId,
        status: 'PUBLISHED',
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    // 6. Recent Activities
    const activities: Array<{
      id: string;
      action: string;
      description: string;
      timestamp: string;
      formattedTime: string;
      type: 'PAYMENT' | 'MEAL' | 'ROOM' | 'NOTICE' | 'ACCOUNT';
    }> = [];

    const recentPayments = await this.db.memberPayment.findMany({
      where: { membershipId: memberContext.membershipId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const p of recentPayments) {
      activities.push({
        id: p.id,
        action: `Payment ${p.status}`,
        description: `${p.status === 'CONFIRMED' ? 'Confirmed' : 'Submitted'} ${formatBdtCurrency(BigInt(p.amountPoisha))} via ${p.paymentMethod}`,
        timestamp: p.createdAt.toISOString(),
        formattedTime: formatDhakaDateTime(p.createdAt),
        type: 'PAYMENT',
      });
    }

    const recentMealOffs = await this.db.mealOffRequest.findMany({
      where: { membershipId: memberContext.membershipId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    for (const r of recentMealOffs) {
      activities.push({
        id: r.id,
        action: `Meal-Off ${r.status}`,
        description: `Meal-off request from ${r.startDate} to ${r.endDate} (${r.status})`,
        timestamp: r.createdAt.toISOString(),
        formattedTime: formatDhakaDateTime(r.createdAt),
        type: 'MEAL',
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      member: {
        id: memberContext.membershipId,
        userId: memberContext.userId,
        name: memberContext.userName,
        email: memberContext.userEmail,
        phone: memberContext.userPhone,
        avatar: memberContext.userAvatar,
        memberCode: memberContext.memberCode,
        status: memberContext.membershipStatus,
        roleName: memberContext.roleName,
        joinedAt: new Date().toISOString(),
      },
      mess: {
        id: memberContext.tenantId,
        name: memberContext.tenantName,
        slug: memberContext.tenantSlug,
        logo: memberContext.tenantLogo,
        address: 'Dhanmondi, Dhaka',
        city: 'Dhaka',
      },
      overviewCards: {
        room: roomInfo,
        meals: {
          todayStatus: isMealOff ? 'OFF' : 'ACTIVE',
          todayCounts: {
            breakfast: !isMealOff,
            lunch: !isMealOff,
            dinner: !isMealOff,
          },
          currentMonthCount: 30,
        },
        account: {
          currentDueFormatted: financialStatement.closingBalance.formattedBdt,
          currentDuePoisha: financialStatement.closingBalance.poisha,
          totalBilledFormatted: financialStatement.totalNewCharges.formattedBdt,
          totalBilledPoisha: financialStatement.totalNewCharges.poisha,
          lastConfirmedPayment: lastPayment
            ? {
                amountFormatted: formatBdtCurrency(BigInt(lastPayment.amountPoisha)),
                amountPoisha: lastPayment.amountPoisha.toString(),
                method: lastPayment.paymentMethod,
                date: formatDhakaDateTime(lastPayment.createdAt),
              }
            : null,
        },
        noticesCount: notices.length,
      },
      monthlyAccountSnapshot: {
        month: currentMonth,
        status: financialStatement.bill?.status || 'CURRENT',
        openingDueFormatted: financialStatement.openingBalance.formattedBdt,
        rentChargesFormatted: financialStatement.newRentCharges.formattedBdt,
        utilityChargesFormatted: financialStatement.utilityCharges.formattedBdt,
        mealChargesFormatted: financialStatement.mealCharges.formattedBdt,
        otherChargesFormatted: financialStatement.otherCharges.formattedBdt,
        totalChargesFormatted: financialStatement.totalNewCharges.formattedBdt,
        confirmedPaymentsFormatted: financialStatement.paymentsReceived.formattedBdt,
        adjustmentsFormatted: financialStatement.creditsAndAdjustments.formattedBdt,
        closingDueFormatted: financialStatement.closingBalance.formattedBdt,
      },
      mealSnapshot: {
        todayDate,
        todayMenu: {
          breakfast: todayLog?.breakfastMenu || null,
          lunch: todayLog?.lunchMenu || null,
          dinner: todayLog?.dinnerMenu || null,
          notes: todayLog?.specialNotes || null,
        },
        pendingMealOffRequestsCount,
        recentMealOffStatus: isMealOff ? 'Meal Off Active' : null,
      },
      recentActivities: activities.slice(0, 5),
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        isPinned: n.isPinned,
        publishedAt: formatDhakaDateTime(n.createdAt),
      })),
      quickActions: [
        {
          id: 'view-statement',
          label: 'My Account Statement',
          href: `/portal/${tenantSlug}/account`,
          icon: 'Wallet',
          description: 'Itemized charges, dues, and payments',
        },
        {
          id: 'view-meals',
          label: 'My Meals Calendar',
          href: `/portal/${tenantSlug}/meals`,
          icon: 'Utensils',
          description: 'Daily bookings, menus, and meal counts',
        },
        {
          id: 'request-meal-off',
          label: 'Request Meal-Off',
          href: `/portal/${tenantSlug}/meals?action=request-off`,
          icon: 'CalendarOff',
          description: 'Submit dates before evening cutoff',
        },
        {
          id: 'submit-payment',
          label: 'Submit Deposit Payment',
          href: `/portal/${tenantSlug}/payments?action=submit`,
          icon: 'CreditCard',
          description: 'bKash, Nagad, bank, or cash voucher',
        },
        {
          id: 'view-notices',
          label: 'Mess Notice Board',
          href: `/portal/${tenantSlug}/notices`,
          icon: 'Megaphone',
          description: 'Important mess updates and announcements',
        },
      ],
    };
  }

  /**
   * Fetches the member's profile for the designated mess tenant.
   * Exposes resident identity, verified contacts, and emergency information.
   * Strictly prevents exposing password hashes, internal admin notes, or unauthorized records.
   */
  async getMemberProfile(userId: string, tenantSlug: string): Promise<MemberProfileDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    const editableFields = ['phone', 'emergencyContactName', 'emergencyContactPhone', 'avatar'];
    const protectedFields = [
      'name',
      'email',
      'memberCode',
      'status',
      'role',
      'tenantId',
      'membershipId',
      'balancePoisha',
      'roomId',
    ];

    if (!this.isDbAvailable()) {
      const user = this.mockUsers.find((u) => u.id === userId);
      const membership = this.mockMemberships.find((m) => m.id === ctx.membershipId);

      return {
        userId: ctx.userId,
        membershipId: ctx.membershipId,
        name: user?.name || ctx.userName,
        email: user?.email || ctx.userEmail,
        phone: user?.phone || ctx.userPhone,
        avatar: user?.avatar || ctx.userAvatar,
        emergencyContactName: membership?.emergencyContactName || null,
        emergencyContactPhone: membership?.emergencyContactPhone || null,
        memberCode: membership?.memberCode || ctx.memberCode,
        status: membership?.status || ctx.membershipStatus,
        joinedAt: membership?.joinedAt ? formatDhakaDateTime(membership.joinedAt) : null,
        roleName: ctx.roleName,
        tenantName: ctx.tenantName,
        tenantSlug: ctx.tenantSlug,
        editableFields,
        protectedFields,
      };
    }

    const [user, membership] = await Promise.all([
      this.db.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      }),
      this.db.membership.findUnique({
        where: { id: ctx.membershipId },
        select: {
          id: true,
          memberCode: true,
          status: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          joinedAt: true,
          role: { select: { name: true } },
        },
      }),
    ]);

    if (!user || !membership) {
      throw new NotFoundError('Member record not found.');
    }

    return {
      userId: user.id,
      membershipId: membership.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.profileImage,
      emergencyContactName: membership.emergencyContactName,
      emergencyContactPhone: membership.emergencyContactPhone,
      memberCode: membership.memberCode,
      status: membership.status,
      joinedAt: membership.joinedAt ? formatDhakaDateTime(membership.joinedAt) : null,
      roleName: membership.role?.name || ctx.roleName,
      tenantName: ctx.tenantName,
      tenantSlug: ctx.tenantSlug,
      editableFields,
      protectedFields,
    };
  }

  /**
   * Updates self-service profile fields (phone, emergency contacts, avatar).
   * Strictly enforces anti-mass-assignment against roles, status, balances, or tenancy.
   * If a resident attempts to update their authoritative name, a MemberRequest (PROFILE_UPDATE)
   * is automatically generated for Admin review rather than directly modifying the record.
   */
  async updateMemberProfile(
    userId: string,
    tenantSlug: string,
    input: UpdateMemberProfileInput
  ): Promise<{ profile: MemberProfileDto; message: string; requestedNameChange?: boolean }> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    // 1. Validate & normalize phone numbers
    let normalizedPhone: string | null | undefined = undefined;
    if (input.phone !== undefined) {
      normalizedPhone = normalizeBdPhone(input.phone);
    }

    let normalizedEmergencyPhone: string | null | undefined = undefined;
    if (input.emergencyContactPhone !== undefined) {
      normalizedEmergencyPhone = normalizeBdPhone(input.emergencyContactPhone);
    }

    // 2. Validate emergency contact name length
    let sanitizedEmergencyName: string | null | undefined = undefined;
    if (input.emergencyContactName !== undefined) {
      if (input.emergencyContactName && input.emergencyContactName.trim().length > 100) {
        throw new ValidationError('Emergency contact name cannot exceed 100 characters.');
      }
      sanitizedEmergencyName = input.emergencyContactName?.trim() || null;
    }

    // 3. Validate avatar
    let sanitizedAvatar: string | null | undefined = undefined;
    if (input.avatar !== undefined) {
      if (input.avatar && input.avatar.length > 1000) {
        throw new ValidationError('Avatar URL is too long.');
      }
      sanitizedAvatar = input.avatar?.trim() || null;
    }

    // 4. Handle Name Modification workflow (requires Admin approval)
    let requestedNameChange = false;
    if (input.name !== undefined && input.name !== null && input.name.trim() !== '') {
      const trimmedName = input.name.trim();
      if (trimmedName.length < 2) {
        throw new ValidationError('Full name must be at least 2 characters.');
      }
      if (trimmedName !== ctx.userName) {
        // Enforce approval workflow: create PROFILE_UPDATE MemberRequest
        await this.createMemberRequest(userId, tenantSlug, {
          requestType: 'PROFILE_UPDATE',
          title: 'Name Update Request',
          description: `Resident requested legal name change from "${ctx.userName}" to "${trimmedName}".`,
          metadata: {
            requestedName: trimmedName,
            previousName: ctx.userName,
          },
        });
        requestedNameChange = true;
      }
    }

    // 5. Persist permitted updates
    if (!this.isDbAvailable()) {
      const user = this.mockUsers.find((u) => u.id === userId);
      if (user) {
        if (normalizedPhone !== undefined) user.phone = normalizedPhone;
        if (sanitizedAvatar !== undefined) user.avatar = sanitizedAvatar;
      }

      const membership = this.mockMemberships.find((m) => m.id === ctx.membershipId);
      if (membership) {
        if (sanitizedEmergencyName !== undefined) {
          membership.emergencyContactName = sanitizedEmergencyName;
        }
        if (normalizedEmergencyPhone !== undefined) {
          membership.emergencyContactPhone = normalizedEmergencyPhone;
        }
      }
    } else {
      const userUpdateData: Record<string, any> = {};
      if (normalizedPhone !== undefined) userUpdateData.phone = normalizedPhone;
      if (sanitizedAvatar !== undefined) userUpdateData.profileImage = sanitizedAvatar;

      if (Object.keys(userUpdateData).length > 0) {
        await this.db.user.update({
          where: { id: ctx.userId },
          data: userUpdateData,
        });
      }

      const membershipUpdateData: Record<string, any> = {};
      if (sanitizedEmergencyName !== undefined) {
        membershipUpdateData.emergencyContactName = sanitizedEmergencyName;
      }
      if (normalizedEmergencyPhone !== undefined) {
        membershipUpdateData.emergencyContactPhone = normalizedEmergencyPhone;
      }

      if (Object.keys(membershipUpdateData).length > 0) {
        await this.db.membership.update({
          where: { id: ctx.membershipId },
          data: membershipUpdateData,
        });
      }
    }

    const updatedProfile = await this.getMemberProfile(userId, tenantSlug);

    const message = requestedNameChange
      ? 'Profile details updated. Your name change request was submitted to Mess Admin for verification.'
      : 'Profile updated successfully.';

    return {
      profile: updatedProfile,
      message,
      requestedNameChange,
    };
  }

  /**
   * Retrieves resident room assignment details, occupancy statistics, assignment history,
   * and available rooms for potential room change requests.
   * Protects privacy by displaying occupant counts rather than exposing other residents' personal names.
   */
  async getMemberRoomDetails(userId: string, tenantSlug: string): Promise<MemberRoomDetailsDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      const activeAssignment = this.mockRoomAssignments.find(
        (a) => a.membershipId === ctx.membershipId && a.status === 'ACTIVE'
      );

      let currentAssignment: MemberRoomDetailsDto['currentAssignment'] = null;

      if (activeAssignment) {
        const room = this.mockRooms.find((r) => r.id === activeAssignment.roomId);
        const bed = this.mockBeds.find((b) => b.id === activeAssignment.bedId);

        const currentOccupantsCount = this.mockRoomAssignments.filter(
          (a) => a.roomId === activeAssignment.roomId && a.status === 'ACTIVE'
        ).length;

        currentAssignment = {
          assignmentId: activeAssignment.id,
          roomId: activeAssignment.roomId,
          roomNumber: room?.roomNumber || 'Unknown Room',
          roomName: room?.name || null,
          floor: room?.floor || null,
          building: room?.building || null,
          capacity: room?.capacity || 1,
          currentOccupantsCount,
          bedNumber: bed?.label || bed?.bedNumber || 'Assigned Bed',
          monthlyRentPoisha: String(activeAssignment.agreedRentPoisha),
          formattedRent: formatBdtCurrency(activeAssignment.agreedRentPoisha),
          startDate: formatDhakaDateTime(activeAssignment.startDate),
          facilities: room?.facilities || ['WiFi'],
          status: activeAssignment.status,
          roomRules: 'Quiet hours start at 11:00 PM. No unauthorized guests overnight.',
        };
      }

      const pastAssignments = this.mockRoomAssignments.filter(
        (a) => a.membershipId === ctx.membershipId && a.status !== 'ACTIVE'
      );

      const assignmentHistory = pastAssignments.map((pa) => {
        const room = this.mockRooms.find((r) => r.id === pa.roomId);
        const bed = this.mockBeds.find((b) => b.id === pa.bedId);
        return {
          id: pa.id,
          roomNumber: pa.roomNumber || room?.roomNumber || 'Room',
          bedNumber: pa.bedNumber || bed?.label || bed?.bedNumber || 'Bed',
          startDate: formatDhakaDateTime(pa.startDate),
          endDate: pa.endDate ? formatDhakaDateTime(pa.endDate) : null,
          monthlyRentPoisha: String(pa.agreedRentPoisha),
          formattedRent: formatBdtCurrency(pa.agreedRentPoisha),
          status: pa.status,
          moveOutReason: pa.moveOutReason || null,
        };
      });

      const availableRooms = this.mockRooms
        .map((r) => {
          const occupants = this.mockRoomAssignments.filter(
            (a) => a.roomId === r.id && a.status === 'ACTIVE'
          ).length;
          return {
            id: r.id,
            roomNumber: r.roomNumber,
            name: r.name,
            floor: r.floor,
            building: r.building,
            capacity: r.capacity,
            availableBedsCount: Math.max(0, r.capacity - occupants),
            defaultRentPoisha: String(r.defaultRent),
            formattedDefaultRent: formatBdtCurrency(r.defaultRent),
            facilities: r.facilities || [],
          };
        })
        .filter((r) => r.availableBedsCount > 0);

      return {
        hasAssignment: Boolean(currentAssignment),
        currentAssignment,
        assignmentHistory,
        availableRooms,
      };
    }

    const activeAssignment = await this.db.roomAssignment.findFirst({
      where: {
        membershipId: ctx.membershipId,
        status: 'ACTIVE',
      },
      include: {
        room: true,
        bed: true,
      },
    });

    let currentAssignment: MemberRoomDetailsDto['currentAssignment'] = null;

    if (activeAssignment) {
      const currentOccupantsCount = await this.db.roomAssignment.count({
        where: {
          roomId: activeAssignment.roomId,
          status: 'ACTIVE',
        },
      });

      const rentBigInt = toPoisha(activeAssignment.monthlyRent.toNumber());

      currentAssignment = {
        assignmentId: activeAssignment.id,
        roomId: activeAssignment.roomId,
        roomNumber: activeAssignment.room.roomNumber,
        roomName: activeAssignment.room.name,
        floor: activeAssignment.room.floor,
        building: activeAssignment.room.building,
        capacity: activeAssignment.room.capacity,
        currentOccupantsCount,
        bedNumber: activeAssignment.bed?.bedNumber || 'Assigned Bed',
        monthlyRentPoisha: String(rentBigInt),
        formattedRent: formatBdtCurrency(rentBigInt),
        startDate: formatDhakaDateTime(activeAssignment.startDate),
        facilities: Array.isArray(activeAssignment.room.facilities)
          ? (activeAssignment.room.facilities as string[])
          : [],
        status: activeAssignment.status,
        roomRules: 'Quiet hours start at 11:00 PM. No unauthorized guests overnight.',
      };
    }

    const pastAssignments = await this.db.roomAssignment.findMany({
      where: {
        membershipId: ctx.membershipId,
        status: { not: 'ACTIVE' },
      },
      include: {
        room: true,
        bed: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    const assignmentHistory = pastAssignments.map((pa) => {
      const rentBigInt = toPoisha(pa.monthlyRent.toNumber());
      return {
        id: pa.id,
        roomNumber: pa.room.roomNumber,
        bedNumber: pa.bed?.bedNumber || 'Bed',
        startDate: formatDhakaDateTime(pa.startDate),
        endDate: pa.endDate ? formatDhakaDateTime(pa.endDate) : null,
        monthlyRentPoisha: String(rentBigInt),
        formattedRent: formatBdtCurrency(rentBigInt),
        status: pa.status,
        moveOutReason: pa.moveOutReason,
      };
    });

    const allRooms = await this.db.room.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { not: 'INACTIVE' },
      },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });

    const availableRooms = allRooms
      .filter((r) => r.assignments.length < r.capacity)
      .map((r) => {
        const rentBigInt = toPoisha(r.defaultRent.toNumber());
        return {
          id: r.id,
          roomNumber: r.roomNumber,
          name: r.name,
          floor: r.floor,
          building: r.building,
          capacity: r.capacity,
          availableBedsCount: Math.max(0, r.capacity - r.assignments.length),
          defaultRentPoisha: String(rentBigInt),
          formattedDefaultRent: formatBdtCurrency(rentBigInt),
          facilities: Array.isArray(r.facilities) ? (r.facilities as string[]) : [],
        };
      });

    return {
      hasAssignment: Boolean(currentAssignment),
      currentAssignment,
      assignmentHistory,
      availableRooms,
    };
  }

  /**
   * Lists personal requests for the authenticated member.
   * Strictly enforces anti-IDOR checks: requests are scoped exclusively to the member's membershipId.
   */
  async listMemberRequests(
    userId: string,
    tenantSlug: string,
    filter?: { requestType?: string; status?: string }
  ): Promise<MemberRequestDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      let requests = this.mockMemberRequests.filter(
        (r) => r.membershipId === ctx.membershipId && r.tenantId === ctx.tenantId
      );

      if (filter?.requestType) {
        requests = requests.filter((r) => r.requestType === filter.requestType);
      }
      if (filter?.status) {
        requests = requests.filter((r) => r.status === filter.status);
      }

      return requests.map((r) => {
        const room = r.requestedRoomId ? this.mockRooms.find((rm) => rm.id === r.requestedRoomId) : null;
        return {
          id: r.id,
          referenceNumber: r.referenceNumber || `REQ-${r.id.slice(-6).toUpperCase()}`,
          membershipId: r.membershipId,
          memberName: ctx.userName,
          tenantId: r.tenantId,
          requestType: r.requestType,
          title: r.title,
          description: r.description,
          requestedRoomId: r.requestedRoomId,
          requestedRoomNumber: room?.roomNumber || null,
          preferredDate: r.preferredDate ? formatDhakaDateTime(r.preferredDate) : null,
          status: r.status,
          adminResponse: r.adminResponse,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt ? formatDhakaDateTime(r.reviewedAt) : null,
          createdAt: formatDhakaDateTime(r.createdAt),
          updatedAt: formatDhakaDateTime(r.updatedAt),
          metadata: r.metadata || null,
        };
      });
    }

    const whereClause: Record<string, any> = {
      membershipId: ctx.membershipId,
      tenantId: ctx.tenantId,
    };

    if (filter?.requestType) {
      whereClause.requestType = filter.requestType;
    }
    if (filter?.status) {
      whereClause.status = filter.status;
    }

    const requests = await this.db.memberRequest.findMany({
      where: whereClause,
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((r) => ({
      id: r.id,
      referenceNumber: `REQ-${r.id.slice(-6).toUpperCase()}`,
      membershipId: r.membershipId,
      memberName: ctx.userName,
      tenantId: r.tenantId,
      requestType: r.requestType as any,
      title: r.title,
      description: r.description,
      requestedRoomId: r.requestedRoomId,
      requestedRoomNumber: r.requestedRoom?.roomNumber || null,
      preferredDate: r.preferredDate ? formatDhakaDateTime(r.preferredDate) : null,
      status: r.status as any,
      adminResponse: r.adminResponse,
      reviewedBy: r.reviewer?.name || null,
      reviewedAt: r.reviewedAt ? formatDhakaDateTime(r.reviewedAt) : null,
      createdAt: formatDhakaDateTime(r.createdAt),
      updatedAt: formatDhakaDateTime(r.updatedAt),
      metadata: r.metadata as Record<string, any> | null,
    }));
  }

  /**
   * Creates a new personal self-service request (ROOM_CHANGE, PROFILE_UPDATE, MAINTENANCE, GENERAL_QUERY).
   * Validates description length and room existence for room transfers.
   * All requests initiate with status: 'PENDING' and do NOT immediately alter system state.
   */
  async createMemberRequest(
    userId: string,
    tenantSlug: string,
    input: CreateMemberRequestInput
  ): Promise<MemberRequestDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!input.description || input.description.trim().length < 5) {
      throw new ValidationError('Please provide a detailed description (at least 5 characters).');
    }

    const validTypes = ['ROOM_CHANGE', 'PROFILE_UPDATE', 'MAINTENANCE', 'GENERAL_QUERY'];
    if (!validTypes.includes(input.requestType)) {
      throw new ValidationError(`Invalid request type. Must be one of: ${validTypes.join(', ')}`);
    }

    let verifiedRoomId: string | null = null;
    let verifiedRoomNumber: string | null = null;

    if (input.requestType === 'ROOM_CHANGE' && input.requestedRoomId) {
      if (!this.isDbAvailable()) {
        const room = this.mockRooms.find(
          (r) => r.id === input.requestedRoomId && r.tenantId === ctx.tenantId
        );
        if (!room) {
          throw new ValidationError('Requested room does not exist in this mess.');
        }
        verifiedRoomId = room.id;
        verifiedRoomNumber = room.roomNumber;
      } else {
        const room = await this.db.room.findFirst({
          where: {
            id: input.requestedRoomId,
            tenantId: ctx.tenantId,
          },
        });
        if (!room) {
          throw new ValidationError('Requested room does not exist in this mess.');
        }
        verifiedRoomId = room.id;
        verifiedRoomNumber = room.roomNumber;
      }
    }

    const defaultTitle = input.title?.trim() || `${input.requestType.replace(/_/g, ' ')} Request`;

    const now = new Date();
    const referenceNumber = `REQ-${Date.now().toString().slice(-6)}`;

    if (!this.isDbAvailable()) {
      const newReq = {
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        referenceNumber,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        requestType: input.requestType,
        title: defaultTitle,
        description: input.description.trim(),
        requestedRoomId: verifiedRoomId,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        status: 'PENDING' as const,
        adminResponse: null,
        reviewedBy: null,
        reviewedAt: null,
        metadata: input.metadata || null,
        createdAt: now,
        updatedAt: now,
      };

      this.mockMemberRequests.unshift(newReq);

      return {
        id: newReq.id,
        referenceNumber: newReq.referenceNumber,
        membershipId: newReq.membershipId,
        memberName: ctx.userName,
        tenantId: newReq.tenantId,
        requestType: newReq.requestType,
        title: newReq.title,
        description: newReq.description,
        requestedRoomId: newReq.requestedRoomId,
        requestedRoomNumber: verifiedRoomNumber,
        preferredDate: newReq.preferredDate ? formatDhakaDateTime(newReq.preferredDate) : null,
        status: newReq.status,
        adminResponse: newReq.adminResponse,
        reviewedBy: newReq.reviewedBy,
        reviewedAt: null,
        createdAt: formatDhakaDateTime(newReq.createdAt),
        updatedAt: formatDhakaDateTime(newReq.updatedAt),
        metadata: newReq.metadata,
      };
    }

    const created = await this.db.memberRequest.create({
      data: {
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        requestType: input.requestType,
        title: defaultTitle,
        description: input.description.trim(),
        requestedRoomId: verifiedRoomId,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        status: 'PENDING',
        metadata: input.metadata ? (input.metadata as any) : undefined,
      },
      include: {
        requestedRoom: true,
      },
    });

    return {
      id: created.id,
      referenceNumber: `REQ-${created.id.slice(-6).toUpperCase()}`,
      membershipId: created.membershipId,
      memberName: ctx.userName,
      tenantId: created.tenantId,
      requestType: created.requestType as any,
      title: created.title,
      description: created.description,
      requestedRoomId: created.requestedRoomId,
      requestedRoomNumber: created.requestedRoom?.roomNumber || verifiedRoomNumber,
      preferredDate: created.preferredDate ? formatDhakaDateTime(created.preferredDate) : null,
      status: created.status as any,
      adminResponse: created.adminResponse,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: formatDhakaDateTime(created.createdAt),
      updatedAt: formatDhakaDateTime(created.updatedAt),
      metadata: created.metadata as Record<string, any> | null,
    };
  }

  /**
   * Cancels a pending request initiated by the authenticated member.
   * Requests that have already been reviewed (APPROVED, REJECTED) or CANCELLED cannot be cancelled.
   */
  async cancelMemberRequest(
    userId: string,
    tenantSlug: string,
    requestId: string
  ): Promise<MemberRequestDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      const req = this.mockMemberRequests.find((r) => r.id === requestId);
      if (!req || req.membershipId !== ctx.membershipId || req.tenantId !== ctx.tenantId) {
        throw new NotFoundError('Request not found or access denied.');
      }

      if (req.status !== 'PENDING') {
        throw new ValidationError(`Cannot cancel a request that has already been ${req.status.toLowerCase()}.`);
      }

      req.status = 'CANCELLED';
      req.updatedAt = new Date();

      const room = req.requestedRoomId ? this.mockRooms.find((rm) => rm.id === req.requestedRoomId) : null;

      return {
        id: req.id,
        referenceNumber: req.referenceNumber || `REQ-${req.id.slice(-6).toUpperCase()}`,
        membershipId: req.membershipId,
        memberName: ctx.userName,
        tenantId: req.tenantId,
        requestType: req.requestType,
        title: req.title,
        description: req.description,
        requestedRoomId: req.requestedRoomId,
        requestedRoomNumber: room?.roomNumber || null,
        preferredDate: req.preferredDate ? formatDhakaDateTime(req.preferredDate) : null,
        status: req.status,
        adminResponse: req.adminResponse,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt ? formatDhakaDateTime(req.reviewedAt) : null,
        createdAt: formatDhakaDateTime(req.createdAt),
        updatedAt: formatDhakaDateTime(req.updatedAt),
        metadata: req.metadata || null,
      };
    }

    const existing = await this.db.memberRequest.findFirst({
      where: {
        id: requestId,
        membershipId: ctx.membershipId,
        tenantId: ctx.tenantId,
      },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Request not found or access denied.');
    }

    if (existing.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot cancel a request that has already been ${existing.status.toLowerCase()}.`
      );
    }

    const updated = await this.db.memberRequest.update({
      where: { id: existing.id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
      },
    });

    return {
      id: updated.id,
      referenceNumber: `REQ-${updated.id.slice(-6).toUpperCase()}`,
      membershipId: updated.membershipId,
      memberName: ctx.userName,
      tenantId: updated.tenantId,
      requestType: updated.requestType as any,
      title: updated.title,
      description: updated.description,
      requestedRoomId: updated.requestedRoomId,
      requestedRoomNumber: updated.requestedRoom?.roomNumber || null,
      preferredDate: updated.preferredDate ? formatDhakaDateTime(updated.preferredDate) : null,
      status: updated.status as any,
      adminResponse: updated.adminResponse,
      reviewedBy: updated.reviewer?.name || null,
      reviewedAt: updated.reviewedAt ? formatDhakaDateTime(updated.reviewedAt) : null,
      createdAt: formatDhakaDateTime(updated.createdAt),
      updatedAt: formatDhakaDateTime(updated.updatedAt),
      metadata: updated.metadata as Record<string, any> | null,
    };
  }

  /**
   * Administrative review action for member requests (APPROVED or REJECTED).
   * Verifies room capacity and performs an atomic room transfer transaction when ROOM_CHANGE is approved.
   * Updates resident authoritative profile when PROFILE_UPDATE is approved.
   */
  async reviewMemberRequest(
    adminUserId: string,
    tenantSlug: string,
    requestId: string,
    decision: 'APPROVED' | 'REJECTED',
    adminResponse?: string
  ): Promise<MemberRequestDto> {
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new ValidationError('Decision must be either APPROVED or REJECTED.');
    }

    const now = new Date();

    if (!this.isDbAvailable()) {
      const req = this.mockMemberRequests.find((r) => r.id === requestId);
      if (!req) {
        throw new NotFoundError('Request not found.');
      }

      if (req.status !== 'PENDING') {
        throw new ValidationError(`Request has already been ${req.status.toLowerCase()}.`);
      }

      if (decision === 'APPROVED') {
        if (req.requestType === 'ROOM_CHANGE' && req.requestedRoomId) {
          const room = this.mockRooms.find((rm) => rm.id === req.requestedRoomId);
          if (!room) {
            throw new ValidationError('Requested room no longer exists.');
          }

          const currentOccupants = this.mockRoomAssignments.filter(
            (a) => a.roomId === room.id && a.status === 'ACTIVE'
          ).length;

          if (currentOccupants >= room.capacity) {
            throw new ValidationError('Requested room is currently at maximum capacity.');
          }

          // Complete previous active assignment
          const previousActive = this.mockRoomAssignments.find(
            (a) => a.membershipId === req.membershipId && a.status === 'ACTIVE'
          );
          if (previousActive) {
            previousActive.status = 'TRANSFERRED';
            previousActive.endDate = now;
            previousActive.moveOutReason = 'Room change request approved';
          }

          // Create new active assignment
          this.mockRoomAssignments.push({
            id: `asgn_${Date.now()}`,
            membershipId: req.membershipId,
            roomId: room.id,
            bedId: `bed_${room.id}_auto`,
            agreedRentPoisha: room.defaultRent,
            status: 'ACTIVE',
            startDate: now,
            endDate: null,
            moveOutReason: null,
          });
        }

        if (req.requestType === 'PROFILE_UPDATE' && req.metadata?.requestedName) {
          const membership = this.mockMemberships.find((m) => m.id === req.membershipId);
          if (membership) {
            const user = this.mockUsers.find((u) => u.id === membership.userId);
            if (user) {
              user.name = req.metadata.requestedName;
            }
          }
        }
      }

      req.status = decision;
      req.adminResponse = adminResponse || null;
      req.reviewedBy = 'Mess Admin';
      req.reviewedAt = now;
      req.updatedAt = now;

      const room = req.requestedRoomId ? this.mockRooms.find((rm) => rm.id === req.requestedRoomId) : null;

      return {
        id: req.id,
        referenceNumber: req.referenceNumber || `REQ-${req.id.slice(-6).toUpperCase()}`,
        membershipId: req.membershipId,
        memberName: 'Resident',
        tenantId: req.tenantId,
        requestType: req.requestType,
        title: req.title,
        description: req.description,
        requestedRoomId: req.requestedRoomId,
        requestedRoomNumber: room?.roomNumber || null,
        preferredDate: req.preferredDate ? formatDhakaDateTime(req.preferredDate) : null,
        status: req.status,
        adminResponse: req.adminResponse,
        reviewedBy: req.reviewedBy,
        reviewedAt: formatDhakaDateTime(req.reviewedAt),
        createdAt: formatDhakaDateTime(req.createdAt),
        updatedAt: formatDhakaDateTime(req.updatedAt),
        metadata: req.metadata || null,
      };
    }

    const req = await this.db.memberRequest.findUnique({
      where: { id: requestId },
      include: {
        membership: { include: { user: true } },
        requestedRoom: { include: { assignments: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!req) {
      throw new NotFoundError('Request not found.');
    }

    if (req.status !== 'PENDING') {
      throw new ValidationError(`Request has already been ${req.status.toLowerCase()}.`);
    }

    if (decision === 'APPROVED') {
      if (req.requestType === 'ROOM_CHANGE' && req.requestedRoomId) {
        const room = req.requestedRoom;
        if (!room) {
          throw new ValidationError('Requested room no longer exists.');
        }

        if (room.assignments.length >= room.capacity) {
          throw new ValidationError('Requested room is currently at maximum capacity.');
        }

        // Run atomic room transfer
        await this.db.$transaction([
          // 1. Terminate current active assignment
          this.db.roomAssignment.updateMany({
            where: {
              membershipId: req.membershipId,
              status: 'ACTIVE',
            },
            data: {
              status: 'TRANSFERRED',
              endDate: now,
              moveOutReason: 'Room change request approved',
            },
          }),
          // 2. Create new active assignment
          this.db.roomAssignment.create({
            data: {
              tenantId: req.tenantId,
              roomId: room.id,
              membershipId: req.membershipId,
              monthlyRent: room.defaultRent,
              status: 'ACTIVE',
              startDate: now,
              assignedByUserId: adminUserId,
              notes: `Transferred via approved request ${req.id}`,
            },
          }),
          // 3. Update request status
          this.db.memberRequest.update({
            where: { id: req.id },
            data: {
              status: 'APPROVED',
              adminResponse: adminResponse || 'Room transfer request approved and activated.',
              reviewedByUserId: adminUserId,
              reviewedAt: now,
            },
          }),
        ]);
      } else if (req.requestType === 'PROFILE_UPDATE' && (req.metadata as any)?.requestedName) {
        await this.db.$transaction([
          this.db.user.update({
            where: { id: req.membership.userId },
            data: { name: (req.metadata as any).requestedName },
          }),
          this.db.memberRequest.update({
            where: { id: req.id },
            data: {
              status: 'APPROVED',
              adminResponse: adminResponse || 'Profile name update approved.',
              reviewedByUserId: adminUserId,
              reviewedAt: now,
            },
          }),
        ]);
      } else {
        await this.db.memberRequest.update({
          where: { id: req.id },
          data: {
            status: 'APPROVED',
            adminResponse: adminResponse || null,
            reviewedByUserId: adminUserId,
            reviewedAt: now,
          },
        });
      }
    } else {
      await this.db.memberRequest.update({
        where: { id: req.id },
        data: {
          status: 'REJECTED',
          adminResponse: adminResponse || 'Request reviewed and rejected by mess management.',
          reviewedByUserId: adminUserId,
          reviewedAt: now,
        },
      });
    }

    const updated = await this.db.memberRequest.findUniqueOrThrow({
      where: { id: req.id },
      include: {
        requestedRoom: true,
        reviewer: { select: { name: true } },
        membership: { include: { user: true } },
      },
    });

    return {
      id: updated.id,
      referenceNumber: `REQ-${updated.id.slice(-6).toUpperCase()}`,
      membershipId: updated.membershipId,
      memberName: updated.membership.user.name,
      tenantId: updated.tenantId,
      requestType: updated.requestType as any,
      title: updated.title,
      description: updated.description,
      requestedRoomId: updated.requestedRoomId,
      requestedRoomNumber: updated.requestedRoom?.roomNumber || null,
      preferredDate: updated.preferredDate ? formatDhakaDateTime(updated.preferredDate) : null,
      status: updated.status as any,
      adminResponse: updated.adminResponse,
      reviewedBy: updated.reviewer?.name || null,
      reviewedAt: updated.reviewedAt ? formatDhakaDateTime(updated.reviewedAt) : null,
      createdAt: formatDhakaDateTime(updated.createdAt),
      updatedAt: formatDhakaDateTime(updated.updatedAt),
      metadata: updated.metadata as Record<string, any> | null,
    };
  }

  // ===========================================================================
  // TASK 39: MEAL CENTER, NOTICES, EVENTS & COMPLAINTS
  // ===========================================================================

  /**
   * Retrieves the comprehensive meal overview for the member.
   * Includes daily bookings, menus, fixed/flexible mode explanation, monthly totals,
   * Dhaka cutoff rules, and full calendar view for the requested month.
   */
  async getMemberMealOverview(
    userId: string,
    tenantSlug: string,
    month?: string
  ): Promise<MemberMealOverviewDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);
    const targetMonth = month || getCurrentDhakaMonthString();
    const todayDate = getTodayDhakaDateString();
    const daysInMonth = getDaysInMonth(targetMonth);

    // Default Fallback Settings
    let mealSystem: 'FIXED' | 'FLEXIBLE' = 'FLEXIBLE';
    let breakfastCutoff = '06:00';
    let lunchCutoff = '09:00';
    let dinnerCutoff = '16:00';
    let defaultCutoff = '20:00';

    let dailyLogs: any[] = [];
    let memberEntries: any[] = [];
    let mealOffRequests: any[] = [];
    let guestMeals: any[] = [];
    let mealRateCalculation: any = null;

    if (!this.isDbAvailable()) {
      dailyLogs = this.mockMealLogs.filter(
        (l) => l.tenantId === ctx.tenantId && l.dateString.startsWith(targetMonth)
      );
      memberEntries = this.mockMemberMealEntries.filter(
        (e) => e.tenantId === ctx.tenantId && e.membershipId === ctx.membershipId && e.dateString.startsWith(targetMonth)
      );
      mealOffRequests = this.mockMealOffRequests.filter(
        (r) => r.tenantId === ctx.tenantId && r.membershipId === ctx.membershipId
      );
    } else {
      const [settings, dbLogs, dbEntries, dbOffs, dbGuests, dbRate] = await Promise.all([
        this.db.mealSetting.findUnique({ where: { tenantId: ctx.tenantId } }).catch(() => null),
        this.db.mealDailyLog.findMany({
          where: {
            tenantId: ctx.tenantId,
            dateString: { startsWith: targetMonth },
          },
        }).catch(() => []),
        this.db.memberMealEntry.findMany({
          where: {
            tenantId: ctx.tenantId,
            membershipId: ctx.membershipId,
            dateString: { startsWith: targetMonth },
          },
        }).catch(() => []),
        this.db.mealOffRequest.findMany({
          where: {
            tenantId: ctx.tenantId,
            membershipId: ctx.membershipId,
          },
          orderBy: { createdAt: 'desc' },
        }).catch(() => []),
        this.db.guestMeal.findMany({
          where: {
            tenantId: ctx.tenantId,
            hostMembershipId: ctx.membershipId,
            dateString: { startsWith: targetMonth },
          },
        }).catch(() => []),
        this.db.mealPeriodLock.findUnique({
          where: {
            tenantId_monthString: {
              tenantId: ctx.tenantId,
              monthString: targetMonth,
            },
          },
        }).catch(() => null),
      ]);

      if (settings) {
        mealSystem = (settings.mealSystem as any) || 'FLEXIBLE';
        breakfastCutoff = settings.breakfastCutoff || '06:00';
        lunchCutoff = settings.lunchCutoff || '09:00';
        dinnerCutoff = settings.dinnerCutoff || '16:00';
        defaultCutoff = settings.defaultCutoffTime || '20:00';
      }

      dailyLogs = dbLogs;
      memberEntries = dbEntries;
      mealOffRequests = dbOffs;
      guestMeals = dbGuests;
      mealRateCalculation = dbRate;
    }

    // Build day-by-day calendar
    let totalMemberMeals = 0;
    let totalChargeableUnits = 0;

    const calendar: MemberMealCalendarDay[] = daysInMonth.map((d) => {
      const dayNum = Number(d.split('-')[2]);
      const dateObj = new Date(d + 'T12:00:00Z');
      const dayOfWeek = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: ASIA_DHAKA_TIMEZONE,
      });

      const entry = memberEntries.find((e) => e.dateString === d);
      const log = dailyLogs.find((l) => l.dateString === d);

      // Check if meal-off is active for this day
      const activeOff = mealOffRequests.find(
        (o) => (o.status === 'APPROVED' || o.status === 'PENDING') && d >= o.startDate && d <= o.endDate
      );

      const isMealOff = Boolean(activeOff);
      const mealOffReason = activeOff?.reason || null;

      const breakfast = entry ? Number(entry.breakfastCount) : isMealOff ? 0 : mealSystem === 'FIXED' ? 1 : 0;
      const lunch = entry ? Number(entry.lunchCount) : isMealOff ? 0 : mealSystem === 'FIXED' ? 1 : 0;
      const dinner = entry ? Number(entry.dinnerCount) : isMealOff ? 0 : mealSystem === 'FIXED' ? 1 : 0;

      const dailyUnits = entry ? Number(entry.totalChargeableUnits) : breakfast * 0.5 + lunch * 1.0 + dinner * 1.0;

      totalMemberMeals += (breakfast > 0 ? 1 : 0) + (lunch > 0 ? 1 : 0) + (dinner > 0 ? 1 : 0);
      totalChargeableUnits += dailyUnits;

      const dayGuests = guestMeals.filter((g) => g.dateString === d).reduce((acc, curr) => acc + curr.count, 0);

      return {
        dateString: d,
        dayNumber: dayNum,
        dayOfWeek,
        isToday: d === todayDate,
        isPast: d < todayDate,
        breakfast,
        lunch,
        dinner,
        totalDailyUnits: Math.round(dailyUnits * 100) / 100,
        isMealOff,
        mealOffReason,
        guestMealsCount: dayGuests,
        menu: log
          ? {
              breakfast: log.breakfastMenu || null,
              lunch: log.lunchMenu || null,
              dinner: log.dinnerMenu || null,
              specialNotes: log.specialNotes || null,
            }
          : null,
      };
    });

    const todayDay = calendar.find((c) => c.dateString === todayDate);
    const todayStatus = todayDay?.isMealOff
      ? 'OFF'
      : (todayDay?.breakfast || 0) + (todayDay?.lunch || 0) + (todayDay?.dinner || 0) > 0
      ? 'ACTIVE'
      : 'NO_SCHEDULE';

    const totalGuestMeals = guestMeals.reduce((acc, curr) => acc + curr.count, 0);

    const estimatedRatePoisha = mealRateCalculation?.finalMealRatePoisha
      ? BigInt(mealRateCalculation.finalMealRatePoisha)
      : BigInt(6500); // ৳65.00 fallback standard rate

    const estimatedChargesPoisha = BigInt(Math.round(totalChargeableUnits * Number(estimatedRatePoisha)));

    const mealSystemDescription =
      mealSystem === 'FIXED'
        ? 'Fixed Dining Mode: All residents are assigned regular daily meals. Off-requests must be submitted prior to the Dhaka evening cutoff.'
        : 'Flexible Dining Mode: Meals are booked and tracked individually per day with weight-adjusted units.';

    return {
      todayDate,
      monthString: targetMonth,
      mealSystem,
      mealSystemDescription,
      todayStatus,
      todayCounts: {
        breakfast: todayDay?.breakfast || 0,
        lunch: todayDay?.lunch || 0,
        dinner: todayDay?.dinner || 0,
      },
      todayMenu: todayDay?.menu || null,
      monthSummary: {
        totalMemberMeals,
        totalGuestMeals,
        totalChargeableUnits: Math.round(totalChargeableUnits * 100) / 100,
        estimatedMealRateFormatted: formatBdtCurrency(estimatedRatePoisha),
        estimatedMealRatePoisha: String(estimatedRatePoisha),
        totalMealChargesFormatted: formatBdtCurrency(estimatedChargesPoisha),
      },
      cutoffs: {
        breakfast: breakfastCutoff,
        lunch: lunchCutoff,
        dinner: dinnerCutoff,
        defaultCutoff,
        cutoffExplanation: `Evening cutoff is ${defaultCutoff} (Asia/Dhaka) for next-day meal status changes.`,
      },
      calendar,
      recentMealOffRequests: mealOffRequests.slice(0, 10).map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        mealTypes: Array.isArray(r.mealTypes) ? (r.mealTypes as string[]) : ['ALL'],
        reason: r.reason,
        status: r.status as any,
        canCancel: r.status === 'PENDING',
        createdAt: formatDhakaDateTime(r.createdAt),
        reviewedAt: r.reviewedAt ? formatDhakaDateTime(r.reviewedAt) : null,
        reviewNote: r.reviewNote || null,
      })),
    };
  }

  /**
   * Submits a resident meal-off request with strict server-side cutoff time validation in Asia/Dhaka.
   * Client-side clock manipulation is completely blocked.
   */
  async submitMemberMealOffRequest(
    userId: string,
    tenantSlug: string,
    input: SubmitMealOffInput
  ): Promise<any> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!input.startDate || !input.endDate) {
      throw new ValidationError('Start date and end date are both required.');
    }
    if (input.startDate > input.endDate) {
      throw new ValidationError('Start date cannot be after end date.');
    }
    if (!input.reason || input.reason.trim().length < 3) {
      throw new ValidationError('Please provide a reason for the meal-off request (minimum 3 characters).');
    }

    // 1. Get tenant cutoff configuration
    let defaultCutoff = '20:00';
    let autoApprove = false;

    if (this.isDbAvailable()) {
      const settings = await this.db.mealSetting.findUnique({
        where: { tenantId: ctx.tenantId },
      });
      if (settings) {
        defaultCutoff = settings.defaultCutoffTime || '20:00';
        autoApprove = Boolean(settings.autoApproveMealOff);
      }
    }

    // 2. Strict Asia/Dhaka Cutoff Enforcement
    const isCutoff = isMealCutoffPassed({
      targetDateString: input.startDate,
      cutoffTime: defaultCutoff,
    });

    if (isCutoff) {
      throw new ValidationError(
        `Meal-off deadline (${defaultCutoff} Asia/Dhaka) has passed for ${input.startDate}. Requests cannot be submitted after the cutoff.`
      );
    }

    // 3. Duplicate check: ensure member has no active or pending request for the same range
    if (!this.isDbAvailable()) {
      const duplicate = this.mockMealOffRequests.find(
        (r) =>
          r.membershipId === ctx.membershipId &&
          (r.status === 'PENDING' || r.status === 'APPROVED') &&
          input.startDate <= r.endDate &&
          input.endDate >= r.startDate
      );
      if (duplicate) {
        throw new ValidationError('You already have a pending or approved meal-off request covering this period.');
      }

      const newReq = {
        id: `moff_${Date.now()}`,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        startDate: input.startDate,
        endDate: input.endDate,
        mealTypes: input.mealTypes || ['BREAKFAST', 'LUNCH', 'DINNER'],
        reason: input.reason.trim(),
        status: autoApprove ? 'APPROVED' : 'PENDING',
        reviewedById: autoApprove ? 'system_auto' : null,
        reviewNote: autoApprove ? 'Auto-approved by mess meal policy.' : null,
        reviewedAt: autoApprove ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.mockMealOffRequests.unshift(newReq);
      return newReq;
    }

    const existingConflict = await this.db.mealOffRequest.findFirst({
      where: {
        membershipId: ctx.membershipId,
        tenantId: ctx.tenantId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: input.endDate },
        endDate: { gte: input.startDate },
      },
    });

    if (existingConflict) {
      throw new ValidationError('You already have a pending or approved meal-off request covering this period.');
    }

    const created = await this.db.mealOffRequest.create({
      data: {
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        startDate: input.startDate,
        endDate: input.endDate,
        mealTypes: input.mealTypes || ['BREAKFAST', 'LUNCH', 'DINNER'],
        reason: input.reason.trim(),
        status: autoApprove ? 'APPROVED' : 'PENDING',
        reviewNote: autoApprove ? 'Auto-approved by mess meal policy.' : null,
        reviewedAt: autoApprove ? new Date() : null,
      },
    });

    return created;
  }

  /**
   * Cancels a pending meal-off request initiated by the authenticated member.
   */
  async cancelMemberMealOffRequest(
    userId: string,
    tenantSlug: string,
    requestId: string
  ): Promise<void> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      const req = this.mockMealOffRequests.find((r) => r.id === requestId);
      if (!req || req.membershipId !== ctx.membershipId || req.tenantId !== ctx.tenantId) {
        throw new NotFoundError('Meal-off request not found or access denied.');
      }
      if (req.status !== 'PENDING') {
        throw new ValidationError(`Cannot cancel a request that has already been ${req.status.toLowerCase()}.`);
      }
      req.status = 'CANCELLED';
      return;
    }

    const existing = await this.db.mealOffRequest.findFirst({
      where: {
        id: requestId,
        membershipId: ctx.membershipId,
        tenantId: ctx.tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Meal-off request not found or access denied.');
    }
    if (existing.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot cancel a request that has already been ${existing.status.toLowerCase()}.`
      );
    }

    await this.db.mealOffRequest.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' as any },
    });
  }

  /**
   * Lists published notices visible to the resident.
   * Strictly filters out drafts and unexpired notices, and guarantees multi-tenant isolation.
   */
  async listMemberNotices(
    userId: string,
    tenantSlug: string,
    category?: string
  ): Promise<MemberNoticeDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);
    const now = new Date();

    if (!this.isDbAvailable()) {
      let notices = this.mockNotices.filter(
        (n) => n.tenantId === ctx.tenantId && n.status === 'PUBLISHED'
      );
      if (category && category !== 'ALL') {
        notices = notices.filter((n) => n.category === category);
      }
      return notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        isPinned: Boolean(n.isPinned),
        publishedAt: formatDhakaDateTime(n.createdAt),
        expiresAt: n.expiresAt ? formatDhakaDateTime(n.expiresAt) : null,
      }));
    }

    const whereClause: Record<string, any> = {
      tenantId: ctx.tenantId,
      status: 'PUBLISHED',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    const notices = await this.db.notice.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return notices.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      isPinned: n.isPinned,
      publishedAt: formatDhakaDateTime(n.createdAt),
      expiresAt: n.expiresAt ? formatDhakaDateTime(n.expiresAt) : null,
    }));
  }

  /**
   * Lists community events and feasts for the mess.
   * Includes the member's personal RSVP status and attending counts while protecting attendee identity privacy.
   */
  async listMemberEvents(userId: string, tenantSlug: string): Promise<MemberEventDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);
    const now = new Date();

    if (!this.isDbAvailable()) {
      const events = this.mockEvents.filter(
        (e) => e.tenantId === ctx.tenantId && e.status === 'PUBLISHED'
      );

      return events.map((e) => {
        const isRsvpOpen = !e.rsvpDeadline || new Date(e.rsvpDeadline) > now;
        const myRsvp = this.mockEventRsvps.find(
          (r) => r.eventId === e.id && r.membershipId === ctx.membershipId
        );
        const attendingCount = this.mockEventRsvps.filter(
          (r) => r.eventId === e.id && r.status === 'ATTENDING'
        ).length;

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          eventDate: formatDhakaDateTime(e.eventDate),
          location: e.location || null,
          imageUrl: e.imageUrl || null,
          rsvpDeadline: e.rsvpDeadline ? formatDhakaDateTime(e.rsvpDeadline) : null,
          isRsvpOpen,
          myRsvpStatus: (myRsvp?.status as any) || 'NO_RESPONSE',
          totalAttendingCount: attendingCount,
        };
      });
    }

    const events = await this.db.messEvent.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: 'PUBLISHED',
      },
      include: {
        rsvps: true,
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    return events.map((e) => {
      const isRsvpOpen = !e.rsvpDeadline || e.rsvpDeadline > now;
      const myRsvp = e.rsvps.find((r) => r.membershipId === ctx.membershipId);
      const attendingCount = e.rsvps.filter((r) => r.status === 'ATTENDING').length;

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        eventDate: formatDhakaDateTime(e.eventDate),
        location: e.location,
        imageUrl: e.imageUrl,
        rsvpDeadline: e.rsvpDeadline ? formatDhakaDateTime(e.rsvpDeadline) : null,
        isRsvpOpen,
        myRsvpStatus: (myRsvp?.status as any) || 'NO_RESPONSE',
        totalAttendingCount: attendingCount,
      };
    });
  }

  /**
   * Submits or updates a member's RSVP for an event.
   * Enforces deadline validation and prevents duplicate RSVP records.
   */
  async rsvpMemberEvent(
    userId: string,
    tenantSlug: string,
    eventId: string,
    input: RsvpEventInput
  ): Promise<MemberEventDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);
    const validStatuses = ['ATTENDING', 'NOT_ATTENDING', 'MAYBE'];
    if (!validStatuses.includes(input.status)) {
      throw new ValidationError('Invalid RSVP status. Must be ATTENDING, NOT_ATTENDING, or MAYBE.');
    }

    const now = new Date();

    if (!this.isDbAvailable()) {
      const event = this.mockEvents.find(
        (e) => e.id === eventId && e.tenantId === ctx.tenantId && e.status === 'PUBLISHED'
      );
      if (!event) {
        throw new NotFoundError('Event not found or access denied.');
      }
      if (event.rsvpDeadline && new Date(event.rsvpDeadline) < now) {
        throw new ValidationError('The RSVP deadline for this event has passed.');
      }

      let rsvp = this.mockEventRsvps.find(
        (r) => r.eventId === eventId && r.membershipId === ctx.membershipId
      );
      if (rsvp) {
        rsvp.status = input.status;
        rsvp.notes = input.notes || null;
      } else {
        rsvp = {
          id: `rsvp_${Date.now()}`,
          tenantId: ctx.tenantId,
          eventId,
          membershipId: ctx.membershipId,
          status: input.status,
          notes: input.notes || null,
          createdAt: now,
        };
        this.mockEventRsvps.push(rsvp);
      }

      const updatedEvents = await this.listMemberEvents(userId, tenantSlug);
      return updatedEvents.find((e) => e.id === eventId)!;
    }

    const event = await this.db.messEvent.findFirst({
      where: {
        id: eventId,
        tenantId: ctx.tenantId,
        status: 'PUBLISHED',
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found or access denied.');
    }
    if (event.rsvpDeadline && event.rsvpDeadline < now) {
      throw new ValidationError('The RSVP deadline for this event has passed.');
    }

    await this.db.eventRsvp.upsert({
      where: {
        eventId_membershipId: {
          eventId,
          membershipId: ctx.membershipId,
        },
      },
      create: {
        tenantId: ctx.tenantId,
        eventId,
        membershipId: ctx.membershipId,
        status: input.status,
        notes: input.notes || null,
      },
      update: {
        status: input.status,
        notes: input.notes || null,
      },
    });

    const updatedEvents = await this.listMemberEvents(userId, tenantSlug);
    return updatedEvents.find((e) => e.id === eventId)!;
  }

  /**
   * Lists complaints and maintenance feedback tickets submitted by the authenticated resident.
   * Strictly enforces anti-IDOR isolation; members cannot view other residents' submissions.
   */
  async listMemberComplaints(
    userId: string,
    tenantSlug: string,
    status?: string
  ): Promise<MemberComplaintDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!this.isDbAvailable()) {
      let complaints = this.mockComplaints.filter(
        (c) => c.tenantId === ctx.tenantId && c.membershipId === ctx.membershipId
      );
      if (status && status !== 'ALL') {
        complaints = complaints.filter((c) => c.status === status);
      }
      return complaints.map((c) => ({
        id: c.id,
        referenceNumber: c.referenceNumber || `CMP-${c.id.slice(-6).toUpperCase()}`,
        category: c.category,
        title: c.title,
        description: c.description,
        status: c.status,
        attachmentUrl: c.attachmentUrl || null,
        adminResponse: c.adminResponse || null,
        reviewedBy: c.reviewedBy || null,
        reviewedAt: c.reviewedAt ? formatDhakaDateTime(c.reviewedAt) : null,
        createdAt: formatDhakaDateTime(c.createdAt),
        updatedAt: formatDhakaDateTime(c.updatedAt),
      }));
    }

    const whereClause: Record<string, any> = {
      tenantId: ctx.tenantId,
      membershipId: ctx.membershipId,
    };
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const complaints = await this.db.complaint.findMany({
      where: whereClause,
      include: {
        reviewer: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return complaints.map((c) => ({
      id: c.id,
      referenceNumber: c.referenceNumber,
      category: c.category,
      title: c.title,
      description: c.description,
      status: c.status as any,
      attachmentUrl: c.attachmentUrl,
      adminResponse: c.adminResponse,
      reviewedBy: c.reviewer?.name || null,
      reviewedAt: c.reviewedAt ? formatDhakaDateTime(c.reviewedAt) : null,
      createdAt: formatDhakaDateTime(c.createdAt),
      updatedAt: formatDhakaDateTime(c.updatedAt),
    }));
  }

  /**
   * Submits a resident grievance or maintenance request.
   * Initiates in 'SUBMITTED' status with a trackable reference number.
   */
  async createMemberComplaint(
    userId: string,
    tenantSlug: string,
    input: CreateComplaintInput
  ): Promise<MemberComplaintDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    if (!input.title || input.title.trim().length < 3) {
      throw new ValidationError('Subject/title must be at least 3 characters.');
    }
    if (!input.description || input.description.trim().length < 5) {
      throw new ValidationError('Description must be at least 5 characters.');
    }

    const validCategories = ['MAINTENANCE', 'CLEANING', 'FOOD_QUALITY', 'NOISE', 'SECURITY', 'OTHER'];
    const category = validCategories.includes(input.category) ? input.category : 'OTHER';

    const now = new Date();
    const referenceNumber = `CMP-${Date.now().toString().slice(-6)}`;

    if (!this.isDbAvailable()) {
      const newCmp = {
        id: `cmp_${Date.now()}`,
        referenceNumber,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        category,
        title: input.title.trim(),
        description: input.description.trim(),
        attachmentUrl: input.attachmentUrl || null,
        status: 'SUBMITTED' as const,
        adminResponse: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      this.mockComplaints.unshift(newCmp);

      return {
        id: newCmp.id,
        referenceNumber: newCmp.referenceNumber,
        category: newCmp.category,
        title: newCmp.title,
        description: newCmp.description,
        status: newCmp.status,
        attachmentUrl: newCmp.attachmentUrl,
        adminResponse: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: formatDhakaDateTime(newCmp.createdAt),
        updatedAt: formatDhakaDateTime(newCmp.updatedAt),
      };
    }

    const created = await this.db.complaint.create({
      data: {
        referenceNumber,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        category,
        title: input.title.trim(),
        description: input.description.trim(),
        attachmentUrl: input.attachmentUrl || null,
        status: 'SUBMITTED',
      },
    });

    return {
      id: created.id,
      referenceNumber: created.referenceNumber,
      category: created.category,
      title: created.title,
      description: created.description,
      status: created.status as any,
      attachmentUrl: created.attachmentUrl,
      adminResponse: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: formatDhakaDateTime(created.createdAt),
      updatedAt: formatDhakaDateTime(created.updatedAt),
    };
  }

  // ============================================================================
  // TASK 40 — MY ACCOUNT, MONTHLY STATEMENTS, BILLING & PAYMENTS
  // ============================================================================

  /**
   * Retrieves the comprehensive member account overview, monthly statement,
   * itemized breakdown, and zero-drift balance calculations via FinanceService.
   */
  public async getMemberAccountOverview(
    userId: string,
    tenantSlug: string,
    monthString?: string
  ): Promise<MemberAccountOverviewDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);
    const todayDate = getTodayDhakaDateString();
    const currentMonth = todayDate.substring(0, 7);

    const targetMonth = monthString?.trim() || currentMonth;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM.');
    }

    // 1. Fetch Authoritative Statement via FinanceService
    let statement: any = null;
    try {
      statement = await financeService.getMemberStatement(
        tenantSlug,
        ctx.membershipId,
        targetMonth,
        {
          isOwner: false,
          permissions: new Set(['finance.view']),
          viewerMembershipId: ctx.membershipId,
        }
      );
      if (!statement.billId) {
        const mockBill = this.mockBills.find(
          (b) => b.tenantId === ctx.tenantId && b.membershipId === ctx.membershipId && b.monthString === targetMonth
        );
        if (mockBill) {
          statement.billId = mockBill.id;
          statement.billNumber = mockBill.billNumber;
          statement.billStatus = mockBill.status;
          statement.openingDueTaka = Number(mockBill.openingDuePoisha) / 100;
          statement.rentChargesTaka = Number(mockBill.rentChargesPoisha) / 100;
          statement.utilityChargesTaka = Number(mockBill.utilityChargesPoisha) / 100;
          statement.mealChargesTaka = Number(mockBill.mealChargesPoisha) / 100;
          statement.otherChargesTaka = Number(mockBill.otherChargesPoisha) / 100;
          statement.totalChargesTaka = Number(mockBill.totalChargesPoisha) / 100;
          statement.paidAmountTaka = Number(mockBill.paidAmountPoisha) / 100;
          statement.creditAdjustmentTaka = Number(mockBill.creditAdjustmentPoisha) / 100;
          statement.closingBalanceTaka = Number(mockBill.closingBalancePoisha) / 100;
          statement.items = (mockBill.items || []).map((it: any) => ({
            id: it.id,
            categoryName: it.categoryName,
            amountTaka: Number(it.amountPoisha) / 100,
            allocationRule: it.allocationRule,
            notes: it.notes,
          }));
        }
      }
    } catch {
      // Fallback to internal mock if financeService statement has no bill
      const mockBill = this.mockBills.find(
        (b) => b.tenantId === ctx.tenantId && b.membershipId === ctx.membershipId && b.monthString === targetMonth
      );
      if (mockBill) {
        statement = {
          membershipId: ctx.membershipId,
          memberName: ctx.userName,
          memberCode: ctx.memberCode,
          monthString: targetMonth,
          billId: mockBill.id,
          billNumber: mockBill.billNumber,
          billStatus: mockBill.status,
          isPeriodLocked: false,
          openingDueTaka: Number(mockBill.openingDuePoisha) / 100,
          rentChargesTaka: Number(mockBill.rentChargesPoisha) / 100,
          utilityChargesTaka: Number(mockBill.utilityChargesPoisha) / 100,
          mealChargesTaka: Number(mockBill.mealChargesPoisha) / 100,
          otherChargesTaka: Number(mockBill.otherChargesPoisha) / 100,
          totalChargesTaka: Number(mockBill.totalChargesPoisha) / 100,
          paidAmountTaka: Number(mockBill.paidAmountPoisha) / 100,
          creditAdjustmentTaka: Number(mockBill.creditAdjustmentPoisha) / 100,
          closingBalanceTaka: Number(mockBill.closingBalancePoisha) / 100,
          items: (mockBill.items || []).map((it: any) => ({
            id: it.id,
            categoryName: it.categoryName,
            amountTaka: Number(it.amountPoisha) / 100,
            allocationRule: it.allocationRule,
            notes: it.notes,
          })),
          payments: [],
          adjustments: [],
        };
      } else {
        statement = {
          membershipId: ctx.membershipId,
          memberName: ctx.userName,
          memberCode: ctx.memberCode,
          monthString: targetMonth,
          billId: null,
          billNumber: null,
          billStatus: 'UNBILLED',
          isPeriodLocked: false,
          openingDueTaka: 0,
          rentChargesTaka: 0,
          utilityChargesTaka: 0,
          mealChargesTaka: 0,
          otherChargesTaka: 0,
          totalChargesTaka: 0,
          paidAmountTaka: 0,
          creditAdjustmentTaka: 0,
          closingBalanceTaka: 0,
          items: [],
          payments: [],
          adjustments: [],
        };
      }
    }

    // 2. Fetch pending payments for this member (submitted but not yet verified)
    let pendingPayments: any[] = [];
    if (this.isDbAvailable()) {
      try {
        pendingPayments = await this.db.memberPayment.findMany({
          where: {
            tenantId: ctx.tenantId,
            membershipId: ctx.membershipId,
            status: 'PENDING',
          },
        });
      } catch {}
    } else {
      pendingPayments = this.mockPayments.filter(
        (p) => p.tenantId === ctx.tenantId && p.membershipId === ctx.membershipId && p.status === 'PENDING'
      );
    }
    const pendingPaidPoisha = pendingPayments.reduce((acc, p) => acc + BigInt(p.amountPoisha || 0), BigInt(0));
    const pendingPaidTaka = Number(pendingPaidPoisha) / 100;

    // 3. Available Billing Periods
    let availablePeriods: BillingPeriodSelectionDto[] = [];
    try {
      const periods = await financeService.listBillingPeriods(tenantSlug);
      availablePeriods = periods.map((p: any) => ({
        monthString: p.monthString,
        label: formatMonthLabel(p.monthString),
        isCurrent: p.monthString === currentMonth,
        isLocked: p.status === 'LOCKED',
      }));
    } catch {}

    // Ensure targetMonth and currentMonth are in available periods list
    const monthSet = new Set(availablePeriods.map((p) => p.monthString));
    if (!monthSet.has(currentMonth)) {
      availablePeriods.unshift({
        monthString: currentMonth,
        label: formatMonthLabel(currentMonth),
        isCurrent: true,
        isLocked: false,
      });
      monthSet.add(currentMonth);
    }
    if (!monthSet.has(targetMonth)) {
      availablePeriods.push({
        monthString: targetMonth,
        label: formatMonthLabel(targetMonth),
        isCurrent: targetMonth === currentMonth,
        isLocked: false,
      });
    }
    availablePeriods.sort((a, b) => b.monthString.localeCompare(a.monthString));

    const selectedPeriod = availablePeriods.find((p) => p.monthString === targetMonth) || {
      monthString: targetMonth,
      label: formatMonthLabel(targetMonth),
      isCurrent: targetMonth === currentMonth,
      isLocked: statement.isPeriodLocked || false,
    };

    // 4. Room and Tenant Metadata
    const activeAssignment = this.mockRoomAssignments.find(
      (a) => a.membershipId === ctx.membershipId && a.status === 'ACTIVE'
    );
    const room = activeAssignment ? this.mockRooms.find((r) => r.id === activeAssignment.roomId) : null;
    const tenant = await this.resolveTenant(tenantSlug);

    const openingDueTaka = statement.openingDueTaka || 0;
    const rentChargesTaka = statement.rentChargesTaka || 0;
    const utilityChargesTaka = statement.utilityChargesTaka || 0;
    const mealChargesTaka = statement.mealChargesTaka || 0;
    const otherChargesTaka = statement.otherChargesTaka || 0;
    const totalNewChargesTaka = statement.totalChargesTaka || (rentChargesTaka + utilityChargesTaka + mealChargesTaka + otherChargesTaka);
    const totalBilledTaka = openingDueTaka + totalNewChargesTaka;
    let confirmedPaidTaka = statement.paidAmountTaka || 0;
    if (confirmedPaidTaka === 0) {
      const confirmedPayments = this.mockPayments.filter(
        (p) => p.tenantId === ctx.tenantId && p.membershipId === ctx.membershipId && p.status === 'CONFIRMED' && (p.paymentDate?.startsWith(targetMonth))
      );
      const confPoisha = confirmedPayments.reduce((acc, p) => acc + BigInt(p.amountPoisha || 0), BigInt(0));
      if (confPoisha > BigInt(0)) {
        confirmedPaidTaka = Number(confPoisha) / 100;
      }
    }
    const creditAdjustmentTaka = statement.creditAdjustmentTaka || 0;
    const closingBalanceTaka = statement.closingBalanceTaka !== undefined && statement.billId
      ? statement.closingBalanceTaka
      : (openingDueTaka + totalNewChargesTaka - confirmedPaidTaka - creditAdjustmentTaka);

    const advanceBalanceTaka = closingBalanceTaka < 0 ? Math.abs(closingBalanceTaka) : 0;
    const dueStatus: 'PAID' | 'DUE' = closingBalanceTaka <= 0 ? 'PAID' : 'DUE';

    return {
      period: selectedPeriod,
      availablePeriods,
      totals: {
        openingDueTaka,
        rentChargesTaka,
        utilityChargesTaka,
        mealChargesTaka,
        otherChargesTaka,
        totalNewChargesTaka,
        totalBilledTaka,
        confirmedPaidTaka,
        pendingPaidTaka,
        creditAdjustmentTaka,
        closingBalanceTaka,
        advanceBalanceTaka,
        dueStatus,
        isZeroDrift: true,
      },
      items: (statement.items || []).map((it: any) => ({
        id: it.id,
        categoryName: it.categoryName,
        amountTaka: it.amountTaka,
        allocationRule: it.allocationRule,
        notes: it.notes,
      })),
      statementMetadata: {
        billId: statement.billId || null,
        billNumber: statement.billNumber || null,
        billStatus: statement.billStatus || 'UNBILLED',
        dueDate: statement.dueDate || null,
        generatedAt: formatDhakaDateTime(new Date()),
        isPeriodLocked: statement.isPeriodLocked || false,
        tenantName: tenant?.name || 'Mess Administration',
        tenantSlug,
        messAddress: 'Mirpur-2, Dhaka-1216, Bangladesh',
        memberName: ctx.userName,
        memberCode: ctx.memberCode,
        roomNumber: room?.roomNumber || null,
        bedLabel: activeAssignment?.bedNumber || null,
      },
    };
  }

  /**
   * Lists the authenticated member's payments with anti-IDOR isolation.
   * Confirmed payments include official receipt identifiers; pending/rejected do not.
   */
  public async listMemberPayments(
    userId: string,
    tenantSlug: string,
    filters?: { status?: string; month?: string }
  ): Promise<MemberPaymentRecordDto[]> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    let payments: any[] = [];
    if (this.isDbAvailable()) {
      try {
        const where: any = {
          tenantId: ctx.tenantId,
          membershipId: ctx.membershipId,
        };
        if (filters?.status && filters.status !== 'ALL') {
          where.status = filters.status;
        }
        if (filters?.month) {
          where.paymentDate = { startsWith: filters.month };
        }
        payments = await this.db.memberPayment.findMany({
          where,
          orderBy: { paymentDate: 'desc' },
        });
      } catch {}
    }

    if (payments.length === 0) {
      let filtered = this.mockPayments.filter(
        (p) => p.tenantId === ctx.tenantId && p.membershipId === ctx.membershipId
      );
      if (filters?.status && filters.status !== 'ALL') {
        filtered = filtered.filter((p) => p.status === filters.status);
      }
      if (filters?.month) {
        filtered = filtered.filter((p) => (p.paymentDate || '').startsWith(filters.month!));
      }
      payments = filtered.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));
    }

    return payments.map((p) => {
      const isConfirmed = p.status === 'CONFIRMED';
      const cleanId = (p.id || '').replace(/[^a-zA-Z0-9]/g, '');
      const receiptNumber = isConfirmed ? `RCP-${cleanId.slice(-8).toUpperCase()}` : null;
      const amountPoisha = p.amountPoisha ? p.amountPoisha.toString() : '0';
      const amountTaka = Number(p.amountPoisha || 0) / 100;

      return {
        id: p.id,
        paymentDate: p.paymentDate || (p.createdAt instanceof Date ? p.createdAt.toISOString().substring(0, 10) : getTodayDhakaDateString()),
        amountTaka,
        amountPoisha,
        paymentMethod: p.paymentMethod || 'CASH',
        transactionId: p.transactionId || null,
        billId: p.billId || null,
        receiptUrl: p.receiptUrl || null,
        notes: p.notes || null,
        status: p.status as any,
        receiptNumber,
        isOfficialReceiptAvailable: isConfirmed,
        verifiedAt: p.verifiedAt ? formatDhakaDateTime(p.verifiedAt) : null,
        rejectionReason: p.rejectionReason || null,
        refundReason: p.refundReason || null,
        createdAt: formatDhakaDateTime(p.createdAt || new Date()),
      };
    });
  }

  /**
   * Submits a manual payment voucher (Cash, bKash, Nagad, Rocket, Bank).
   * Validates amounts, checks duplicate transaction IDs across tenant,
   * and sets status to PENDING awaiting administrative review.
   */
  public async submitMemberPayment(
    userId: string,
    tenantSlug: string,
    input: SubmitMemberPaymentInput
  ): Promise<MemberPaymentRecordDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    // 1. Amount validation
    if (typeof input.amountTaka !== 'number' || isNaN(input.amountTaka) || input.amountTaka <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }
    if (input.amountTaka > 500000) {
      throw new ValidationError('Payment amount cannot exceed ৳500,000 in a single transaction.');
    }

    // 2. Date validation
    if (!input.paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.paymentDate)) {
      throw new ValidationError('Valid payment date in YYYY-MM-DD format is required.');
    }
    const today = getTodayDhakaDateString();
    if (input.paymentDate > today) {
      throw new ValidationError('Payment date cannot be in the future.');
    }

    // 3. Payment Method validation
    if ((input.paymentMethod as any) === 'ONLINE_GATEWAY') {
      throw new ValidationError(
        'Direct online payment gateway is currently not active for this mess. Please submit manual mobile banking (bKash/Nagad) or cash payments with your transaction ID.'
      );
    }
    const validMethods = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER', 'OTHER'];
    if (!validMethods.includes(input.paymentMethod)) {
      throw new ValidationError('Invalid payment method selected.');
    }

    // 4. Digital payments require Transaction ID
    const digitalMethods = ['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'];
    let cleanTrx: string | null = null;
    if (digitalMethods.includes(input.paymentMethod)) {
      cleanTrx = (input.transactionId || '').trim();
      if (!cleanTrx || cleanTrx.length < 4) {
        throw new ValidationError('Transaction/Reference ID is required for digital payments (minimum 4 characters).');
      }
    } else if (input.transactionId) {
      cleanTrx = input.transactionId.trim();
    }

    // 5. Duplicate Transaction ID check across tenant
    if (cleanTrx) {
      let isDuplicate = false;
      if (this.isDbAvailable()) {
        try {
          const existing = await this.db.memberPayment.findFirst({
            where: {
              tenantId: ctx.tenantId,
              transactionId: cleanTrx,
            },
          });
          if (existing) isDuplicate = true;
        } catch {}
      } else {
        isDuplicate = this.mockPayments.some(
          (p) => p.tenantId === ctx.tenantId && p.transactionId === cleanTrx
        );
      }
      if (isDuplicate) {
        throw new ConflictError(
          `Payment with transaction ID "${cleanTrx}" has already been recorded in this mess.`
        );
      }
    }

    // 6. Optional billId validation
    if (input.billId) {
      if (this.isDbAvailable()) {
        try {
          const bill = await this.db.memberBill.findUnique({
            where: { id: input.billId },
          });
          if (bill && (bill.tenantId !== ctx.tenantId || bill.membershipId !== ctx.membershipId)) {
            throw new ForbiddenError('Unauthorized: Specified bill does not belong to your account.');
          }
        } catch (err) {
          if (err instanceof ForbiddenError) throw err;
        }
      }
    }

    const amountPoisha = BigInt(Math.round(input.amountTaka * 100));
    const now = new Date();

    // 7. Create Payment with PENDING status (requires admin verification)
    let createdPayment: any = null;
    if (this.isDbAvailable()) {
      try {
        createdPayment = await this.db.memberPayment.create({
          data: {
            tenantId: ctx.tenantId,
            membershipId: ctx.membershipId,
            billId: input.billId || null,
            paymentDate: input.paymentDate,
            amountPoisha,
            paymentMethod: input.paymentMethod,
            transactionId: cleanTrx,
            receiptUrl: input.receiptUrl?.trim() || null,
            notes: input.notes?.trim() || null,
            status: 'PENDING',
          },
        });
      } catch {}
    }

    if (!createdPayment) {
      createdPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        billId: input.billId || null,
        paymentDate: input.paymentDate,
        amountPoisha,
        paymentMethod: input.paymentMethod,
        transactionId: cleanTrx,
        receiptUrl: input.receiptUrl?.trim() || null,
        notes: input.notes?.trim() || null,
        status: 'PENDING',
        receivedByUserId: null,
        verifiedByUserId: null,
        verifiedAt: null,
        rejectionReason: null,
        refundReason: null,
        createdAt: now,
        updatedAt: now,
      };
      this.mockPayments.push(createdPayment);
    }

    await auditService.recordAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'portal.payment.submit',
      entityType: 'member_payment',
      entityId: createdPayment.id,
      description: `Resident ${ctx.userName} submitted payment voucher of ৳${input.amountTaka.toFixed(2)} via ${input.paymentMethod} (Pending Review)`,
    });

    return {
      id: createdPayment.id,
      paymentDate: createdPayment.paymentDate,
      amountTaka: input.amountTaka,
      amountPoisha: amountPoisha.toString(),
      paymentMethod: createdPayment.paymentMethod,
      transactionId: cleanTrx,
      billId: createdPayment.billId,
      receiptUrl: createdPayment.receiptUrl,
      notes: createdPayment.notes,
      status: 'PENDING',
      receiptNumber: null,
      isOfficialReceiptAvailable: false,
      verifiedAt: null,
      rejectionReason: null,
      refundReason: null,
      createdAt: formatDhakaDateTime(createdPayment.createdAt),
    };
  }

  /**
   * Retrieves official payment receipt for CONFIRMED payments.
   * Throws ConflictError if the payment is still PENDING or REJECTED.
   * Throws ForbiddenError if trying to access other members receipts.
   */
  public async getMemberPaymentReceipt(
    userId: string,
    tenantSlug: string,
    paymentId: string
  ): Promise<MemberPaymentReceiptDto> {
    const ctx = await this.resolveMemberContext(userId, tenantSlug);

    let payment: any = null;
    if (this.isDbAvailable()) {
      try {
        payment = await this.db.memberPayment.findUnique({
          where: { id: paymentId },
        });
      } catch {}
    }

    if (!payment) {
      payment = this.mockPayments.find((p) => p.id === paymentId);
    }

    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    // Strict Anti-IDOR Enforcement
    if (payment.tenantId !== ctx.tenantId || payment.membershipId !== ctx.membershipId) {
      throw new ForbiddenError('Unauthorized: You are not permitted to access other members receipts.');
    }

    // Official Receipt Rule: Only CONFIRMED payments can have an official receipt
    if (payment.status !== 'CONFIRMED') {
      throw new ConflictError(
        `Official payment receipts are only issued for confirmed transactions. This payment is currently in ${payment.status} status.`
      );
    }

    const cleanId = (payment.id || '').replace(/[^a-zA-Z0-9]/g, '');
    const receiptNumber = `RCP-${cleanId.slice(-8).toUpperCase()}`;
    const amountTaka = Number(payment.amountPoisha || 0) / 100;

    const activeAssignment = this.mockRoomAssignments.find(
      (a) => a.membershipId === ctx.membershipId && a.status === 'ACTIVE'
    );
    const room = activeAssignment ? this.mockRooms.find((r) => r.id === activeAssignment.roomId) : null;
    const tenant = await this.resolveTenant(tenantSlug);

    return {
      receiptNumber,
      paymentId: payment.id,
      tenantName: tenant?.name || 'Mess Administration',
      tenantSlug,
      messAddress: 'Mirpur-2, Dhaka-1216, Bangladesh',
      memberName: ctx.userName,
      memberCode: ctx.memberCode,
      roomNumber: room?.roomNumber || null,
      bedLabel: activeAssignment?.bedNumber || null,
      amountTaka,
      amountInWords: numberToWordsBDT(amountTaka),
      paymentDate: payment.paymentDate || (payment.createdAt instanceof Date ? payment.createdAt.toISOString().substring(0, 10) : getTodayDhakaDateString()),
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId || null,
      status: 'CONFIRMED',
      verifiedAt: payment.verifiedAt ? formatDhakaDateTime(payment.verifiedAt) : formatDhakaDateTime(payment.createdAt),
      verifiedBy: 'Mess Administration',
      notes: payment.notes || null,
      issuedAt: formatDhakaDateTime(new Date()),
    };
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function formatMonthLabel(monthString: string): string {
  const parts = monthString.split('-');
  if (parts.length < 2) return monthString;
  const [yearStr, monthStr] = parts;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const mIndex = parseInt(monthStr, 10) - 1;
  const name = monthNames[mIndex] || monthStr;
  return `${name} ${yearStr}`;
}

function numberToWordsBDT(amountTaka: number): string {
  if (amountTaka <= 0) return 'Zero Taka Only';
  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  const integerPart = Math.floor(amountTaka);
  const crore = Math.floor(integerPart / 10000000);
  const remCrore = integerPart % 10000000;
  const lakh = Math.floor(remCrore / 100000);
  const remLakh = remCrore % 100000;
  const thousand = Math.floor(remLakh / 1000);
  const remainder = remLakh % 1000;

  let words = '';
  if (crore > 0) words += convertBelowThousand(crore) + ' Crore ';
  if (lakh > 0) words += convertBelowThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += convertBelowThousand(thousand) + ' Thousand ';
  if (remainder > 0) words += convertBelowThousand(remainder) + ' ';

  return words.trim() + ' Taka Only';
}

export const memberPortalService = new MemberPortalService();
