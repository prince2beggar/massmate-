/**
 * In-Memory Mock Prisma Client
 *
 * Provides a resilient, fully functional mock database for local development, demo mode,
 * and review testing when an external PostgreSQL or MySQL database is not configured.
 * Automatically seeds standard tenant, user, membership, role, room, and financial records.
 */

interface StoreRecord {
  id: string;
  [key: string]: any;
}

export function createMockPrismaClient(): any {
  // Master In-Memory Data Collections
  const collections: Record<string, StoreRecord[]> = {
    tenant: [
      {
        id: 'tenant_prince_mess',
        slug: 'prince-mess',
        name: 'Prince Mess (প্রিন্স মেস)',
        type: 'BACHELOR_MESS',
        status: 'ACTIVE',
        subscriptionStatus: 'ACTIVE',
        contactEmail: '123@gmail.com',
        contactPhone: '+8801711000001',
        address: 'বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা-১২০৫',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'tenant_green_villa',
        slug: 'green-villa',
        name: 'Green Villa',
        type: 'STUDENT_MESS',
        status: 'ACTIVE',
        subscriptionStatus: 'ACTIVE',
        contactEmail: 'green@example.com',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    user: [
      {
        id: 'usr_owner_1',
        email: '123@gmail.com',
        name: 'Asadul Islam (Prince Mess Owner)',
        phone: '+8801711000001',
        platformRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_owner_alt',
        email: 'owner@messmate.dev',
        name: 'Prince Mess Owner (Alt)',
        phone: '+8801711000001',
        platformRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_manager_1',
        email: 'admin@messmate.dev',
        name: 'Tariqul Islam (সহ-ম্যানেজার)',
        phone: '+8801712000002',
        platformRole: 'SUPPORT_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_1',
        email: 'rahat@example.com',
        name: 'Rahat Chowdhury (মিলের দায়িত্ব)',
        phone: '+8801713000003',
        emergencyContactName: 'Karim Chowdhury',
        emergencyContactPhone: '+8801711998877',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_2',
        email: 'tanvir@example.com',
        name: 'Tanvir Ahmed (হিসাবের দায়িত্ব)',
        phone: '+8801714000004',
        emergencyContactName: 'Rezaul Ahmed',
        emergencyContactPhone: '+8801811998877',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-05T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_3',
        email: 'hasan@example.com',
        name: 'Hasan Mahmud (সমন্বয়ক)',
        phone: '+8801715000005',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_4',
        email: 'akash@example.com',
        name: 'Akash Shikder (সাধারণ সদস্য)',
        phone: '+8801716000006',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_5',
        email: 'sabbir@example.com',
        name: 'Sabbir Hossain (সাধারণ সদস্য)',
        phone: '+8801717000007',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-20T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_6',
        email: 'fahim@example.com',
        name: 'Fahim Rayhan (সাধারণ সদস্য)',
        phone: '+8801718000008',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_superadmin_1',
        email: 'superadmin@messmate.dev',
        name: 'Platform Super Admin',
        phone: '+8801611000000',
        platformRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    role: [
      {
        id: 'role_owner',
        tenantId: 'tenant_prince_mess',
        slug: 'owner',
        name: 'মেস ওনার (Mess Owner)',
        description: 'Full administrative control of the mess',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['*'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_admin',
        tenantId: 'tenant_prince_mess',
        slug: 'admin',
        name: 'কো-এডমিন / সহ-ম্যানেজার (Co-Admin)',
        description: 'Operational manager alongside mess owner (1+ admins allowed)',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['*'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_meal_manager',
        tenantId: 'tenant_prince_mess',
        slug: 'meal-manager',
        name: 'মিলের দায়িত্ব (Meal Manager)',
        description: 'Dining manager for daily meals, menus, and meal-off reviews',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['meals.manage', 'meals.view', 'bazar.view', 'members.view'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_accountant',
        tenantId: 'tenant_prince_mess',
        slug: 'accountant',
        name: 'হিসাবের দায়িত্ব (Accountant / Finance)',
        description: 'Financial auditor for bazar expenses, bills, and payments',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['finance.manage', 'finance.view', 'expenses.manage', 'expenses.view', 'members.view'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_moderator',
        tenantId: 'tenant_prince_mess',
        slug: 'moderator',
        name: 'মেস সমন্বয়ক (Moderator)',
        description: 'Coordinator assisting in meal tracking, bazar inputs, and complaints',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['meals.record', 'meals.view', 'bazar.record', 'bazar.view', 'members.view'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_member',
        tenantId: 'tenant_prince_mess',
        slug: 'member',
        name: 'সাধারণ সদস্য (General Member)',
        description: 'Standard resident with view access to daily meals, bazar summary, and personal bills',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['portal.view', 'meals.view', 'bazar.view'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_manager',
        tenantId: 'tenant_prince_mess',
        slug: 'manager',
        name: 'Mess Manager',
        description: 'Operations manager for members, meals, and expenses',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['members.manage', 'meals.manage', 'expenses.manage'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'role_resident',
        tenantId: 'tenant_prince_mess',
        slug: 'resident',
        name: 'Resident Member',
        description: 'Regular resident of the mess',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['portal.view'],
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    membership: [
      {
        id: 'mem_owner_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_owner_1',
        roleId: 'role_owner',
        status: 'ACTIVE',
        memberCode: 'MGR-001',
        assignedRoles: ['owner', 'admin'],
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_manager_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_manager_1',
        roleId: 'role_admin',
        status: 'ACTIVE',
        memberCode: 'MM-001',
        assignedRoles: ['admin', 'moderator'],
        notes: 'Room 201, Bed-1',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        roleId: 'role_meal_manager',
        status: 'ACTIVE',
        memberCode: 'MM-002',
        assignedRoles: ['meal-manager', 'member'],
        emergencyContactName: 'Karim Chowdhury',
        emergencyContactPhone: '+8801711998877',
        notes: 'Room 101, Bed-1',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        roleId: 'role_accountant',
        status: 'ACTIVE',
        memberCode: 'MM-003',
        assignedRoles: ['accountant', 'member'],
        emergencyContactName: 'Rezaul Ahmed',
        emergencyContactPhone: '+8801811998877',
        notes: 'Room 101, Bed-2',
        joinedAt: new Date('2026-01-05T00:00:00Z'),
        createdAt: new Date('2026-01-05T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_3',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_3',
        roleId: 'role_moderator',
        status: 'ACTIVE',
        memberCode: 'MM-004',
        assignedRoles: ['moderator', 'member'],
        notes: 'Room 102, Bed-1',
        joinedAt: new Date('2026-01-10T00:00:00Z'),
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_4',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_4',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'MM-005',
        assignedRoles: ['member'],
        notes: 'Room 102, Bed-2',
        joinedAt: new Date('2026-01-15T00:00:00Z'),
        createdAt: new Date('2026-01-15T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_5',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_5',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'MM-006',
        assignedRoles: ['member'],
        notes: 'Room 201, Bed-2',
        joinedAt: new Date('2026-01-20T00:00:00Z'),
        createdAt: new Date('2026-01-20T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_6',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_6',
        roleId: 'role_member',
        status: 'ACTIVE',
        memberCode: 'MM-007',
        assignedRoles: ['member'],
        notes: 'Room 202, Bed-1',
        joinedAt: new Date('2026-02-01T00:00:00Z'),
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    room: [
      {
        id: 'room_101',
        tenantId: 'tenant_prince_mess',
        roomNumber: '101',
        name: 'Deluxe Double (রুম ১০১)',
        floor: '1st',
        building: 'মেইন ইউনিট',
        capacity: 2,
        defaultRent: 3500,
        facilities: ['Attached Bath', 'Balcony', 'High-Speed Wi-Fi', 'Study Desk & Chair'],
        status: 'OCCUPIED',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'room_102',
        tenantId: 'tenant_prince_mess',
        roomNumber: '102',
        name: 'Standard Triple (রুম ১০২)',
        floor: '1st',
        building: 'মেইন ইউনিট',
        capacity: 3,
        defaultRent: 3200,
        facilities: ['High-Speed Wi-Fi', 'Geyser / Hot Water', 'Daily Room Cleaning'],
        status: 'AVAILABLE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'room_201',
        tenantId: 'tenant_prince_mess',
        roomNumber: '201',
        name: 'Executive AC Room (রুম ২০১)',
        floor: '2nd',
        building: 'মেইন ইউনিট',
        capacity: 2,
        defaultRent: 4500,
        facilities: ['Air Conditioning (AC)', 'Balcony', 'High-Speed Wi-Fi', 'Attached Bath'],
        status: 'OCCUPIED',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'room_202',
        tenantId: 'tenant_prince_mess',
        roomNumber: '202',
        name: 'Master Balcony (রুম ২০২)',
        floor: '2nd',
        building: 'মেইন ইউনিট',
        capacity: 2,
        defaultRent: 3800,
        facilities: ['Attached Bath', 'Balcony', 'High-Speed Wi-Fi', 'Wardrobe / Closet'],
        status: 'AVAILABLE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    bed: [
      { id: 'bed_101_1', roomId: 'room_101', bedNumber: 'Bed-1', status: 'OCCUPIED' },
      { id: 'bed_101_2', roomId: 'room_101', bedNumber: 'Bed-2', status: 'OCCUPIED' },
      { id: 'bed_102_1', roomId: 'room_102', bedNumber: 'Bed-1', status: 'OCCUPIED' },
      { id: 'bed_102_2', roomId: 'room_102', bedNumber: 'Bed-2', status: 'OCCUPIED' },
      { id: 'bed_102_3', roomId: 'room_102', bedNumber: 'Bed-3', status: 'AVAILABLE' },
      { id: 'bed_201_1', roomId: 'room_201', bedNumber: 'Bed-1', status: 'OCCUPIED' },
      { id: 'bed_201_2', roomId: 'room_201', bedNumber: 'Bed-2', status: 'OCCUPIED' },
      { id: 'bed_202_1', roomId: 'room_202', bedNumber: 'Bed-1', status: 'OCCUPIED' },
      { id: 'bed_202_2', roomId: 'room_202', bedNumber: 'Bed-2', status: 'AVAILABLE' },
    ],

    roomAssignment: [
      {
        id: 'asgn_1',
        roomId: 'room_101',
        bedId: 'bed_101_1',
        membershipId: 'mem_resident_1',
        status: 'ACTIVE',
        monthlyRent: 3500,
        startDate: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'asgn_2',
        roomId: 'room_101',
        bedId: 'bed_101_2',
        membershipId: 'mem_resident_2',
        status: 'ACTIVE',
        monthlyRent: 3500,
        startDate: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'asgn_3',
        roomId: 'room_102',
        bedId: 'bed_102_1',
        membershipId: 'mem_resident_3',
        status: 'ACTIVE',
        monthlyRent: 3200,
        startDate: new Date('2026-01-05'),
        createdAt: new Date('2026-01-05'),
      },
      {
        id: 'asgn_4',
        roomId: 'room_102',
        bedId: 'bed_102_2',
        membershipId: 'mem_resident_4',
        status: 'ACTIVE',
        monthlyRent: 3200,
        startDate: new Date('2026-01-10'),
        createdAt: new Date('2026-01-10'),
      },
      {
        id: 'asgn_5',
        roomId: 'room_201',
        bedId: 'bed_201_1',
        membershipId: 'mem_manager_1',
        status: 'ACTIVE',
        monthlyRent: 4500,
        startDate: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'asgn_6',
        roomId: 'room_201',
        bedId: 'bed_201_2',
        membershipId: 'mem_resident_5',
        status: 'ACTIVE',
        monthlyRent: 4500,
        startDate: new Date('2026-01-15'),
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 'asgn_7',
        roomId: 'room_202',
        bedId: 'bed_202_1',
        membershipId: 'mem_resident_6',
        status: 'ACTIVE',
        monthlyRent: 3800,
        startDate: new Date('2026-02-01'),
        createdAt: new Date('2026-02-01'),
      },
    ],

    bazarCategory: [
      {
        id: 'cat_meat_fish',
        tenantId: 'tenant_prince_mess',
        name: 'মাছ ও মাংস (Fish, Meat & Eggs)',
        slug: 'meat-fish',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_grocery',
        tenantId: 'tenant_prince_mess',
        name: 'মুদি ও প্রধান খাদ্যদ্রব্য (Rice, Oil & Lentils)',
        slug: 'grocery',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_vegetables',
        tenantId: 'tenant_prince_mess',
        name: 'কাঁচা সবজি ও আলু (Vegetables & Spices)',
        slug: 'vegetables',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_utilities',
        tenantId: 'tenant_prince_mess',
        name: 'গ্যাস, পানি ও বিদ্যুৎ (Utilities)',
        slug: 'utilities',
        isEligibleForMealRate: false,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_cleaning',
        tenantId: 'tenant_prince_mess',
        name: 'মেস পরিচ্ছন্নতা ও বিবিধ সামগ্রী',
        slug: 'cleaning',
        isEligibleForMealRate: false,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
    ],

    expenseCategory: [
      {
        id: 'cat_meat_fish',
        tenantId: 'tenant_prince_mess',
        name: 'মাছ ও মাংস (Fish, Meat & Eggs)',
        slug: 'meat-fish',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_grocery',
        tenantId: 'tenant_prince_mess',
        name: 'মুদি ও প্রধান খাদ্যদ্রব্য (Rice, Oil & Lentils)',
        slug: 'grocery',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_vegetables',
        tenantId: 'tenant_prince_mess',
        name: 'কাঁচা সবজি ও আলু (Vegetables & Spices)',
        slug: 'vegetables',
        isEligibleForMealRate: true,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_utilities',
        tenantId: 'tenant_prince_mess',
        name: 'গ্যাস, পানি ও বিদ্যুৎ (Utilities)',
        slug: 'utilities',
        isEligibleForMealRate: false,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 'cat_cleaning',
        tenantId: 'tenant_prince_mess',
        name: 'মেস পরিচ্ছন্নতা ও বিবিধ সামগ্রী',
        slug: 'cleaning',
        isEligibleForMealRate: false,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
      },
    ],

    expense: [
      {
        id: 'exp_1',
        tenantId: 'tenant_prince_mess',
        categoryId: 'cat_meat_fish',
        purchaserMembershipId: 'mem_resident_1',
        dateString: '2026-11-20',
        purchaseDate: new Date('2026-11-20'),
        description: 'সাপ্তাহিক মাছ ও ব্রয়লার মুরগি বাজার',
        vendor: 'কাওরান বাজার কাঁচামাল আড়ৎ',
        paymentMethod: 'CASH',
        totalAmountPoisha: BigInt(345000),
        totalAmountTaka: 3450,
        status: 'APPROVED',
        receiptUrl: '/receipts/memo-kwr-20261120.jpg',
        receiptFileName: 'কাওরান_বাজার_ক্যাশ_মেমো_২০_নভেম্বর.jpg',
        receiptMimeType: 'image/jpeg',
        periodType: 'weekly',
        startDate: '2026-11-20',
        endDate: '2026-11-26',
        notes: 'সাপ্তাহিক ৭ দিনের যৌথ বাজার',
        reviewedById: 'usr_owner_1',
        reviewedAt: new Date('2026-11-20T18:00:00Z'),
        createdAt: new Date('2026-11-20T14:30:00Z'),
        updatedAt: new Date('2026-11-20T18:00:00Z'),
      },
      {
        id: 'exp_2',
        tenantId: 'tenant_prince_mess',
        categoryId: 'cat_grocery',
        purchaserMembershipId: 'mem_resident_2',
        dateString: '2026-11-16',
        purchaseDate: new Date('2026-11-16'),
        description: 'মাসের প্রধান মুদি বাজার (মিনিকেট চাল, তীর সয়াবিন তেল, মসুর ডাল)',
        vendor: 'মেসার্স বিসমিল্লাহ জেনারেল স্টোর',
        paymentMethod: 'BKASH',
        totalAmountPoisha: BigInt(585000),
        totalAmountTaka: 5850,
        status: 'APPROVED',
        receiptUrl: '/receipts/memo-bismillah-nov16.jpg',
        receiptFileName: 'বিসমিল্লাহ_স্টোর_চাল_ডাল_তেল_মেমো.jpg',
        receiptMimeType: 'image/jpeg',
        periodType: 'weekly',
        startDate: '2026-11-16',
        endDate: '2026-11-30',
        notes: '১৫ দিনের জন্য ৫০ কেজি চাল ও তেল সংগ্রহ',
        reviewedById: 'usr_owner_1',
        reviewedAt: new Date('2026-11-16T20:00:00Z'),
        createdAt: new Date('2026-11-16T17:15:00Z'),
        updatedAt: new Date('2026-11-16T20:00:00Z'),
      },
      {
        id: 'exp_3',
        tenantId: 'tenant_prince_mess',
        categoryId: 'cat_vegetables',
        purchaserMembershipId: 'mem_resident_3',
        dateString: '2026-11-18',
        purchaseDate: new Date('2026-11-18'),
        description: 'তাজা কাঁচা সবজি ও আলু-পেঁয়াজ বাজার',
        vendor: 'ধানমন্ডি লেক কাঁচাবাজার',
        paymentMethod: 'CASH',
        totalAmountPoisha: BigInt(168000),
        totalAmountTaka: 1680,
        status: 'APPROVED',
        receiptUrl: '/receipts/memo-lake-nov18.jpg',
        receiptFileName: 'সবজি_আলু_পেঁয়াজ_স্লিপ.jpg',
        receiptMimeType: 'image/jpeg',
        periodType: 'single',
        notes: 'আলু ১০ কেজি ও পেঁয়াজ ৫ কেজি কেনা হয়েছে',
        reviewedById: 'usr_owner_1',
        reviewedAt: new Date('2026-11-18T19:00:00Z'),
        createdAt: new Date('2026-11-18T11:00:00Z'),
        updatedAt: new Date('2026-11-18T19:00:00Z'),
      },
      {
        id: 'exp_4',
        tenantId: 'tenant_prince_mess',
        categoryId: 'cat_utilities',
        purchaserMembershipId: 'mem_resident_4',
        dateString: '2026-11-21',
        purchaseDate: new Date('2026-11-21'),
        description: 'রান্নার গ্যাস সিলিন্ডার ও ডিশ ওয়াশ',
        vendor: 'ওমেরা এলপিজি ডিলার',
        paymentMethod: 'NAGAD',
        totalAmountPoisha: BigInt(152000),
        totalAmountTaka: 1520,
        status: 'APPROVED',
        receiptUrl: '/receipts/memo-omera-nov21.jpg',
        receiptFileName: 'গ্যাস_সিলিন্ডার_ভাউচার.jpg',
        receiptMimeType: 'image/jpeg',
        periodType: 'single',
        notes: '১২ কেজি রিফিল সিলিন্ডার',
        reviewedById: 'usr_owner_1',
        reviewedAt: new Date('2026-11-21T16:00:00Z'),
        createdAt: new Date('2026-11-21T12:00:00Z'),
        updatedAt: new Date('2026-11-21T16:00:00Z'),
      },
      {
        id: 'exp_5',
        tenantId: 'tenant_prince_mess',
        categoryId: 'cat_meat_fish',
        purchaserMembershipId: 'mem_resident_5',
        dateString: '2026-11-22',
        purchaseDate: new Date('2026-11-22'),
        description: 'বিকেলের নাস্তা ও রাতের ডিম-সবজি',
        vendor: 'ধানমন্ডি লোকাল বাজার',
        paymentMethod: 'CASH',
        totalAmountPoisha: BigInt(85000),
        totalAmountTaka: 850,
        status: 'PENDING',
        receiptUrl: '/receipts/slip-nov22-pending.jpg',
        receiptFileName: 'ডিম_সবজি_বাজার_স্লিপ.jpg',
        receiptMimeType: 'image/jpeg',
        periodType: 'single',
        notes: 'অনুমোদনের অপেক্ষায়',
        createdAt: new Date('2026-11-22T19:30:00Z'),
        updatedAt: new Date('2026-11-22T19:30:00Z'),
      },
    ],

    expenseItem: [
      { id: 'item_1_1', expenseId: 'exp_1', itemName: 'ব্রয়লার মুরগি (Chicken)', quantity: 4, unit: 'kg', unitPriceTaka: 210, totalPriceTaka: 840 },
      { id: 'item_1_2', expenseId: 'exp_1', itemName: 'রুই মাছ (Rui Fish)', quantity: 3.5, unit: 'kg', unitPriceTaka: 380, totalPriceTaka: 1330 },
      { id: 'item_1_3', expenseId: 'exp_1', itemName: 'ফার্মের লাল ডিম (Eggs)', quantity: 60, unit: 'pcs', unitPriceTaka: 13.5, totalPriceTaka: 810 },
      { id: 'item_1_4', expenseId: 'exp_1', itemName: 'আদা ও রসুন (Ginger & Garlic)', quantity: 1.5, unit: 'kg', unitPriceTaka: 313.33, totalPriceTaka: 470 },

      { id: 'item_2_1', expenseId: 'exp_2', itemName: 'রশিদ মিনিকেট চাল (৫০ কেজি)', quantity: 1, unit: 'বস্তা', unitPriceTaka: 3650, totalPriceTaka: 3650 },
      { id: 'item_2_2', expenseId: 'exp_2', itemName: 'তীর সয়াবিন তেল (৫ লিটার)', quantity: 2, unit: 'ক্যান', unitPriceTaka: 810, totalPriceTaka: 1620 },
      { id: 'item_2_3', expenseId: 'exp_2', itemName: 'দেশি মসুর ডাল', quantity: 4, unit: 'kg', unitPriceTaka: 145, totalPriceTaka: 580 },

      { id: 'item_3_1', expenseId: 'exp_3', itemName: 'নতুন আলু (Potato)', quantity: 10, unit: 'kg', unitPriceTaka: 55, totalPriceTaka: 550 },
      { id: 'item_3_2', expenseId: 'exp_3', itemName: 'দেশি পেঁয়াজ (Onion)', quantity: 5, unit: 'kg', unitPriceTaka: 110, totalPriceTaka: 550 },
      { id: 'item_3_3', expenseId: 'exp_3', itemName: 'ফুলকপি ও বাঁধাকপি', quantity: 4, unit: 'pcs', unitPriceTaka: 40, totalPriceTaka: 160 },
      { id: 'item_3_4', expenseId: 'exp_3', itemName: 'কাঁচামরিচ ও ধনেপাতা', quantity: 1, unit: 'kg', unitPriceTaka: 220, totalPriceTaka: 220 },
      { id: 'item_3_5', expenseId: 'exp_3', itemName: 'টমেটো ও বেগুন', quantity: 2, unit: 'kg', unitPriceTaka: 100, totalPriceTaka: 200 },

      { id: 'item_4_1', expenseId: 'exp_4', itemName: 'ওমেরা ১২ কেজি এলপিজি রিফিল', quantity: 1, unit: 'সিলিন্ডার', unitPriceTaka: 1400, totalPriceTaka: 1400 },
      { id: 'item_4_2', expenseId: 'exp_4', itemName: 'ভিমবার লিকুইড ও স্ক্রাবার', quantity: 1, unit: 'প্যাক', unitPriceTaka: 120, totalPriceTaka: 120 },

      { id: 'item_5_1', expenseId: 'exp_5', itemName: 'ফার্মের ডিম (Eggs)', quantity: 30, unit: 'pcs', unitPriceTaka: 13, totalPriceTaka: 390 },
      { id: 'item_5_2', expenseId: 'exp_5', itemName: 'আলু ও পেঁপে', quantity: 4, unit: 'kg', unitPriceTaka: 65, totalPriceTaka: 260 },
      { id: 'item_5_3', expenseId: 'exp_5', itemName: 'টোস্ট বিস্কুট ও চা পাতা', quantity: 1, unit: 'প্যাক', unitPriceTaka: 200, totalPriceTaka: 200 },
    ],

    bazarSchedule: [
      {
        id: 'sch_1',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_5',
        scheduledDate: '2026-11-22',
        dateString: '2026-11-22',
        status: 'COMPLETED',
        estimatedBudgetTaka: 1000,
        notes: 'বিকেলের বাজার সম্পন্ন',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_2',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_manager_1',
        scheduledDate: '2026-11-23',
        dateString: '2026-11-23',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 2500,
        notes: 'আজকের তাজা সবজি ও মাছের বাজার',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_3',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_1',
        scheduledDate: '2026-11-24',
        dateString: '2026-11-24',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 1500,
        notes: 'মঙ্গলবার মুরগি ও ডিম',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_4',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_2',
        scheduledDate: '2026-11-25',
        dateString: '2026-11-25',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 2000,
        notes: 'বুধবার ডাল, মসলা ও পেঁয়াজ',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_5',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_3',
        scheduledDate: '2026-11-26',
        dateString: '2026-11-26',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 1800,
        notes: 'বৃহস্পতিবার সবজি ও মাছ',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_6',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_4',
        scheduledDate: '2026-11-27',
        dateString: '2026-11-27',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 3500,
        notes: 'শুক্রবার স্পেশাল মিলের জন্য খাসি/গরুর মাংস',
        createdAt: new Date('2026-11-20'),
      },
      {
        id: 'sch_7',
        tenantId: 'tenant_prince_mess',
        assignedMembershipId: 'mem_resident_6',
        scheduledDate: '2026-11-28',
        dateString: '2026-11-28',
        status: 'ASSIGNED',
        estimatedBudgetTaka: 1500,
        notes: 'শনিবার নাস্তা ও হালকা বাজার',
        createdAt: new Date('2026-11-20'),
      },
    ],

    mealSetting: [
      {
        id: 'mset_prince_mess',
        tenantId: 'tenant_prince_mess',
        mealSystem: 'FLEXIBLE',
        breakfastEnabled: true,
        lunchEnabled: true,
        dinnerEnabled: true,
        breakfastWeight: 0.5,
        lunchWeight: 1.0,
        dinnerWeight: 1.0,
        breakfastCutoff: '06:00',
        lunchCutoff: '09:00',
        dinnerCutoff: '17:00',
        defaultCutoffTime: '22:00',
        autoApproveMealOff: false,
        guestMealChargeType: 'FIXED_PER_MEAL',
        guestMealFixedRatePoisha: BigInt(6500),
        guestMealMultiplier: 1.2,
        eligibleExpenseCategories: [
          'মাছ ও মাংস (Fish, Meat & Eggs)',
          'মুদি ও প্রধান খাদ্যদ্রব্য (Rice, Oil & Lentils)',
          'কাঁচা সবজি ও আলু (Vegetables & Spices)',
        ],
        allowLateMealOffWithReason: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    mealDailyLog: [
      {
        id: 'mdl_nov22',
        tenantId: 'tenant_prince_mess',
        dateString: '2026-11-22',
        breakfastMenu: 'ডিম ভুনা, লাল আটার গরম পরোটা ও স্পেশাল চা',
        lunchMenu: 'তাজা রুই মাছের ঝোল, পাতলা মসুর ডাল ও সুগন্ধি গরম ভাত',
        dinnerMenu: 'দেশি ব্রয়লার মুরগির তরকারি, আলুভর্তা ও ডাল ভাত',
        specialNotes: 'শুক্রবার রাতে বিশেষ ভুনা খিচুড়ির আয়োজন থাকবে',
        createdAt: new Date('2026-11-22T06:00:00Z'),
        updatedAt: new Date('2026-11-22T06:00:00Z'),
      },
      {
        id: 'mdl_nov23',
        tenantId: 'tenant_prince_mess',
        dateString: '2026-11-23',
        breakfastMenu: 'ভুনা খিচুড়ি, ডিম অমলেট ও আচার',
        lunchMenu: 'পাবদা মাছ ভুনা, সবজি ও ঘন মসুর ডাল',
        dinnerMenu: 'ডিম কারি, বেগুনভাজা ও গরম ভাত',
        specialNotes: 'সকল সদস্যকে সময়মতো মিল গ্রহণের অনুরোধ করা হচ্ছে',
        createdAt: new Date('2026-11-23T06:00:00Z'),
        updatedAt: new Date('2026-11-23T06:00:00Z'),
      },
    ],

    memberMealEntry: (() => {
      const entries: StoreRecord[] = [];
      const memberIds = [
        'mem_resident_1',
        'mem_resident_2',
        'mem_resident_3',
        'mem_resident_4',
        'mem_resident_5',
        'mem_resident_6',
        'mem_manager_1',
      ];
      let idCounter = 1;
      for (let day = 1; day <= 23; day++) {
        const dateString = `2026-11-${String(day).padStart(2, '0')}`;
        for (const mId of memberIds) {
          // Occasional realistic meal-off on certain days
          const isOff =
            (day % 6 === 0 && mId === 'mem_resident_4') ||
            (day === 14 && mId === 'mem_resident_2') ||
            (day === 22 && mId === 'mem_resident_4');
          const bf = isOff ? 0 : 1;
          const lunch = isOff ? 0 : 1;
          const dinner = isOff ? 0 : 1;
          const units = isOff ? 0 : 2.5;
          entries.push({
            id: `mme_${idCounter++}`,
            tenantId: 'tenant_prince_mess',
            dateString,
            membershipId: mId,
            breakfastCount: bf,
            lunchCount: lunch,
            dinnerCount: dinner,
            customCount: 0,
            totalChargeableUnits: units,
            isFixedParticipating: true,
          });
        }
      }
      return entries;
    })(),

    mealOffRequest: [
      {
        id: 'moff_1',
        tenantId: 'tenant_prince_mess',
        membershipId: 'mem_resident_4',
        startDate: '2026-11-22',
        endDate: '2026-11-22',
        mealTypes: ['BREAKFAST'],
        reason: 'সকালে অফিসিয়াল কাজের জন্য বাইরে নাস্তা করব',
        status: 'APPROVED',
        reviewedById: 'usr_owner_1',
        reviewedAt: new Date('2026-11-21T21:00:00Z'),
        createdAt: new Date('2026-11-21T20:00:00Z'),
      },
    ],

    guestMeal: [
      {
        id: 'gm_1',
        tenantId: 'tenant_prince_mess',
        hostMembershipId: 'mem_resident_2',
        guestName: 'আরিফুল ইসলাম (কাজিন)',
        dateString: '2026-11-20',
        mealType: 'DINNER',
        count: 1,
        totalAmountPoisha: BigInt(6500),
        unitRatePoisha: BigInt(6500),
        isPaid: true,
        paymentNote: 'ক্যাশ পরিশোধিত',
        createdAt: new Date('2026-11-20T19:00:00Z'),
      },
    ],

    notice: [
      {
        id: 'not_1',
        tenantId: 'tenant_prince_mess',
        title: '📢 মেসের মাসিক হিসাব ও সাধারণ সভা — আগামী শুক্রবার রাত ৯:০০ টায়',
        content: 'সকল সদস্যকে জানানো যাচ্ছে যে চলতি মাসের মিল ও খরচের হিসাব পর্যালোচনার জন্য শুক্রবার রাত ৯টায় ডাইনিং রুমে সাধারণ সভা অনুষ্ঠিত হবে। সবার উপস্থিতি বাধ্যতামূলক। মেস ম্যানেজার ও কোষাধ্যক্ষকে প্রস্তুত থাকার অনুরোধ করা হচ্ছে। - প্রিন্স মেস এডমিন',
        priority: 'HIGH',
        status: 'ACTIVE',
        authorUserId: 'usr_owner_1',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'not_2',
        tenantId: 'tenant_prince_mess',
        title: '⚡ বিদ্যুৎ ও পানির অপচয় রোধে রুম থেকে বের হওয়ার সময় সুইচ অফ করুন',
        content: 'গ্রীষ্মের কারণে বিদ্যুৎ বিল নিয়ন্ত্রণে রাখার স্বার্থে রুম থেকে বের হওয়ার সময় লাইট, ফ্যান ও এসির সুইচ অবশ্যই বন্ধ রাখুন। বাথরুমের পানির কল ভালোভাবে বন্ধ করুন।',
        priority: 'NORMAL',
        status: 'ACTIVE',
        authorUserId: 'usr_manager_1',
        createdAt: new Date(Date.now() - 172800000),
      },
      {
        id: 'not_3',
        tenantId: 'tenant_prince_mess',
        title: '🍽️ মিল অফ করার সময়সীমা: সকালের মিল রাত ১০টার মধ্যে এবং দুপুরের মিল সকাল ৮টার মধ্যে দিন',
        content: 'বাজার ও রান্না ব্যবস্থাপনা সুশৃঙ্খল রাখতে নির্ধারিত সময়ের পর মিল অফের আবেদন গ্রহণযোগ্য হবে না। জরুরি প্রয়োজনে মিল ম্যানেজারের সাথে সরাসরি যোগাযোগ করুন।',
        priority: 'HIGH',
        status: 'ACTIVE',
        authorUserId: 'usr_resident_1',
        createdAt: new Date(Date.now() - 259200000),
      },
    ],

    complaint: [
      {
        id: 'cmp_1',
        tenantId: 'tenant_prince_mess',
        title: '২য় তলার ওয়াইফাই স্পিড স্লো এবং রাউটার মাঝে মাঝে ডিসকানেক্ট হচ্ছে',
        description: 'গত দুই দিন ধরে রাতের বেলা ওয়াইফাই স্পিড কমে যায় এবং রাউটার রিবুট না দিলে ঠিক হয় না।',
        priority: 'HIGH',
        status: 'RESOLVED',
        membershipId: 'mem_resident_5',
        category: 'INTERNET',
        resolutionNotes: 'রাউটার রিস্টার্ট ও ফার্মওয়্যার আপডেট করা হয়েছে এবং চ্যানেল ফ্রিকোয়েন্সি অপ্টিমাইজ করা হয়েছে। এখন ফুল স্পিড পাওয়া যাচ্ছে।',
        resolvedAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'cmp_2',
        tenantId: 'tenant_prince_mess',
        title: 'রুম ১০১ এর বেসিন পাইপ সামান্য লিকেজ',
        description: 'বেসিনের নিচের পাইপ দিয়ে হালকা পানি চুইয়ে পড়ছে, ফ্লোর ভিজে যায়।',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        membershipId: 'mem_resident_1',
        category: 'PLUMBING',
        resolutionNotes: 'প্লাম্বারকে কল দেওয়া হয়েছে, আজ বিকেলে এসে ঠিক করে যাবে।',
        createdAt: new Date(Date.now() - 14400000),
      },
    ],

    rentalListing: [],

    subscriptionInvoice: [
      {
        id: 'inv_seed_1',
        tenantId: 'tenant_prince_mess',
        amount: 25000,
        paymentStatus: 'CONFIRMED',
        paidAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'inv_seed_2',
        tenantId: 'tenant_prince_mess',
        amount: 5000,
        paymentStatus: 'PENDING',
        createdAt: new Date(),
      },
    ],

    auditLog: [
      {
        id: 'log_seed_1',
        tenantId: 'tenant_prince_mess',
        action: 'MEMBER_JOINED',
        entityType: 'MEMBERSHIP',
        entityId: 'mem_resident_1',
        actorUserId: 'usr_manager_1',
        description: 'Resident Rahat Chowdhury joined Prince Mess',
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'log_seed_2',
        tenantId: 'tenant_prince_mess',
        action: 'MEAL_RECORDED',
        entityType: 'MEALS',
        actorUserId: 'usr_manager_1',
        description: 'Daily lunch meal count recorded',
        createdAt: new Date(Date.now() - 7200000),
      },
    ],
  };

  function matchCondition(item: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      if (key === 'AND' && Array.isArray(where.AND)) {
        if (!where.AND.every((cond: any) => matchCondition(item, cond))) return false;
        continue;
      }
      if (key === 'OR' && Array.isArray(where.OR)) {
        if (!where.OR.some((cond: any) => matchCondition(item, cond))) return false;
        continue;
      }
      if (key === 'NOT') {
        if (matchCondition(item, where.NOT)) return false;
        continue;
      }

      const expected = where[key];
      const actual = item[key];

      if (expected === undefined) continue;

      // Handle Compound unique keys (e.g. userId_tenantId: { userId, tenantId }) or relation filters
      if (item[key] === undefined && typeof expected === 'object' && expected !== null && !(expected instanceof Date)) {
        const subKeys = Object.keys(expected);
        const isCompound = subKeys.length > 0 && subKeys.every((k) => k in item);
        if (isCompound) {
          if (!subKeys.every((k) => item[k] === expected[k])) return false;
          continue;
        }

        // Relation filter e.g. tenant: { status: 'ACTIVE' }
        if (key === 'tenant' && item.tenantId && collections.tenant) {
          const rel = collections.tenant.find((t) => t.id === item.tenantId);
          if (!rel || !matchCondition(rel, expected)) return false;
          continue;
        }
        if (key === 'user' && item.userId && collections.user) {
          const rel = collections.user.find((u) => u.id === item.userId);
          if (!rel || !matchCondition(rel, expected)) return false;
          continue;
        }
        if (key === 'role' && item.roleId && collections.role) {
          const rel = collections.role.find((r) => r.id === item.roleId);
          if (!rel || !matchCondition(rel, expected)) return false;
          continue;
        }
      }

      if (typeof expected === 'object' && expected !== null && !(expected instanceof Date)) {
        if ('equals' in expected && actual !== expected.equals) return false;
        if ('in' in expected && Array.isArray(expected.in) && !expected.in.includes(actual)) return false;
        if ('not' in expected && actual === expected.not) return false;
        if ('contains' in expected) {
          const mode = expected.mode || 'default';
          const needle = mode === 'insensitive' ? expected.contains.toLowerCase() : expected.contains;
          const haystack = mode === 'insensitive' ? String(actual || '').toLowerCase() : String(actual || '');
          if (!haystack.includes(needle)) return false;
        }
        if ('gte' in expected && actual < expected.gte) return false;
        if ('lte' in expected && actual > expected.lte) return false;
        if ('gt' in expected && actual <= expected.gt) return false;
        if ('lt' in expected && actual >= expected.lt) return false;
        continue;
      }

      // Exact match
      if (actual !== expected) {
        // Also check if where is for tenant slug match on tenant relation
        return false;
      }
    }
    return true;
  }

  function resolveRelations(item: any, modelName: string, include?: any): any {
    if (!item || !include) return item;
    const resolved = { ...item };

    if (modelName === 'role') {
      if (include.rolePermissions) {
        resolved.rolePermissions = (resolved.permissions || []).map((p: string) => ({
          permission: { key: p },
        }));
      }
    }

    if (modelName === 'membership') {
      if (include.user) {
        const user = collections.user?.find((u) => u.id === item.userId);
        resolved.user = user ? { ...user } : null;
      }
      if (include.role) {
        const role = collections.role?.find((r) => r.id === item.roleId);
        if (role) {
          resolved.role = {
            ...role,
            rolePermissions: (role.permissions || []).map((p: string) => ({
              permission: { key: p },
            })),
          };
        } else {
          resolved.role = null;
        }
      }
      if (include.tenant) {
        const tenant = collections.tenant?.find((t) => t.id === item.tenantId);
        resolved.tenant = tenant ? { ...tenant } : null;
      }
    }

    if (modelName === 'auditLog') {
      if (include.actorUser) {
        const user = collections.user?.find((u) => u.id === item.actorUserId);
        resolved.actorUser = user ? { ...user } : null;
      }
    }

    if (modelName === 'tenant') {
      if (include.memberships) {
        resolved.memberships = collections.membership?.filter((m) => m.tenantId === item.id) || [];
      }
    }

    if (modelName === 'room') {
      if (include.beds) {
        resolved.beds = (collections.bed || []).filter((b) => b.roomId === item.id);
      }
      if (include.assignments) {
        let assignments = (collections.roomAssignment || []).filter((a) => a.roomId === item.id);
        if (include.assignments.where) {
          assignments = assignments.filter((a) => matchCondition(a, include.assignments.where));
        }
        resolved.assignments = assignments.map((a) =>
          resolveRelations(a, 'roomAssignment', include.assignments.include)
        );
      }
      if (include.rentalListings) {
        resolved.rentalListings = (collections.rentalListing || []).filter((l) => l.roomId === item.id);
      }
    }

    if (modelName === 'roomAssignment') {
      if (include.membership) {
        const mem = (collections.membership || []).find((m) => m.id === item.membershipId);
        resolved.membership = mem ? resolveRelations(mem, 'membership', include.membership.include) : null;
      }
      if (include.room) {
        const rm = (collections.room || []).find((r) => r.id === item.roomId);
        resolved.room = rm ? { ...rm } : null;
      }
      if (include.bed) {
        const b = (collections.bed || []).find((bd) => bd.id === item.bedId);
        resolved.bed = b ? { ...b } : null;
      }
    }

    if (modelName === 'bed') {
      if (include.room) {
        const rm = (collections.room || []).find((r) => r.id === item.roomId);
        resolved.room = rm ? { ...rm } : null;
      }
    }

    if (modelName === 'expense') {
      if (include.category) {
        const cat = (collections.bazarCategory || collections.expenseCategory || []).find((c) => c.id === item.categoryId);
        resolved.category = cat ? { ...cat } : null;
      }
      if (include.purchaserMembership) {
        const mem = (collections.membership || []).find((m) => m.id === item.purchaserMembershipId);
        resolved.purchaserMembership = mem ? resolveRelations(mem, 'membership', include.purchaserMembership.include) : null;
      }
      if (include.reviewedByUser) {
        const user = (collections.user || []).find((u) => u.id === item.reviewedById);
        resolved.reviewedByUser = user ? { ...user } : null;
      }
      if (include.items) {
        resolved.items = (collections.expenseItem || []).filter((it) => it.expenseId === item.id);
      }
    }

    if (modelName === 'bazarSchedule') {
      if (include.assignedMembership) {
        const mem = (collections.membership || []).find((m) => m.id === item.assignedMembershipId);
        resolved.assignedMembership = mem ? resolveRelations(mem, 'membership', include.assignedMembership.include) : null;
      }
    }

    if (modelName === 'memberMealEntry') {
      if (include.membership) {
        const mem = (collections.membership || []).find((m) => m.id === item.membershipId);
        resolved.membership = mem ? resolveRelations(mem, 'membership', include.membership.include) : null;
      }
    }

    if (modelName === 'notice') {
      if (include.authorUser) {
        const user = (collections.user || []).find((u) => u.id === item.authorUserId);
        resolved.authorUser = user ? { ...user } : null;
      }
    }

    if (modelName === 'complaint') {
      if (include.membership) {
        const mem = (collections.membership || []).find((m) => m.id === item.membershipId);
        resolved.membership = mem ? resolveRelations(mem, 'membership', include.membership.include) : null;
      }
    }

    return resolved;
  }

  function createModelProxy(modelName: string) {
    if (!collections[modelName]) {
      collections[modelName] = [];
    }
    const store = collections[modelName];

    return {
      async findMany(args?: any) {
        const { where, skip = 0, take = 100, include, orderBy } = args || {};

        // Auto-seed all 6 standard roles for tenant if role model is queried
        if (modelName === 'role' && where?.tenantId) {
          const tId = where.tenantId;
          const standardRoles = [
            { slug: 'member', name: 'General Member (সাধারণ সদস্য)', desc: 'Standard resident with view access to personal meals and bills' },
            { slug: 'meal-manager', name: 'Meal Manager (মিল ম্যানেজার)', desc: 'Dining manager for meal count, entry, and off requests' },
            { slug: 'accountant', name: 'Finance & Accountant (হিসাবরক্ষক)', desc: 'Finance manager for bazar expenses, bills, and payments' },
            { slug: 'admin', name: 'Co-Admin / Manager (সহ-এডমিন)', desc: 'Operational manager alongside mess owner (1+ admins allowed)' },
            { slug: 'moderator', name: 'Moderator (সমন্বয়ক)', desc: 'Community coordinator for notices, events, and complaints' },
            { slug: 'owner', name: 'Mess Owner (মেস ওনার)', desc: 'Owner with full administrative and legal control' },
          ];
          for (const s of standardRoles) {
            if (!store.some((r) => r.tenantId === tId && r.slug === s.slug)) {
              store.push({
                id: `role_${s.slug.replace(/-/g, '_')}_${tId}`,
                tenantId: tId,
                slug: s.slug,
                name: s.name,
                description: s.desc,
                isSystem: true,
                status: 'ACTIVE',
                permissions: ['*'],
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }

        let filtered = store.filter((item) => matchCondition(item, where));
        if (orderBy && typeof orderBy === 'object') {
          const sortKey = Object.keys(orderBy)[0];
          const sortDir = orderBy[sortKey];
          if (sortKey) {
            filtered = [...filtered].sort((a, b) => {
              const valA = a[sortKey];
              const valB = b[sortKey];
              if (valA instanceof Date && valB instanceof Date) {
                return sortDir === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
              }
              if (valA < valB) return sortDir === 'asc' ? -1 : 1;
              if (valA > valB) return sortDir === 'asc' ? 1 : -1;
              return 0;
            });
          }
        }
        const paginated = filtered.slice(skip, take ? skip + take : undefined);
        return paginated.map((item) => resolveRelations(item, modelName, include));
      },

      async findFirst(args?: any) {
        const { where, include } = args || {};
        const found = store.find((item) => matchCondition(item, where));
        return found ? resolveRelations(found, modelName, include) : null;
      },

      async findUnique(args?: any) {
        const { where, include } = args || {};
        const found = store.find((item) => matchCondition(item, where));
        return found ? resolveRelations(found, modelName, include) : null;
      },

      async count(args?: any) {
        const { where } = args || {};
        return store.filter((item) => matchCondition(item, where)).length;
      },

      async create(args: any) {
        const data = args?.data || {};
        const newItem: StoreRecord = {
          id: data.id || `${modelName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.unshift(newItem);
        return resolveRelations(newItem, modelName, args?.include);
      },

      async update(args: any) {
        const { where, data, include } = args || {};
        const index = store.findIndex((item) => matchCondition(item, where));
        if (index === -1) {
          throw new Error(`Record to update not found in mock ${modelName}`);
        }
        store[index] = {
          ...store[index],
          ...data,
          updatedAt: new Date(),
        };
        return resolveRelations(store[index], modelName, include);
      },

      async delete(args: any) {
        const { where } = args || {};
        const index = store.findIndex((item) => matchCondition(item, where));
        if (index !== -1) {
          const removed = store.splice(index, 1)[0];
          return removed;
        }
        return null;
      },

      async deleteMany(args?: any) {
        const { where } = args || {};
        let count = 0;
        for (let i = store.length - 1; i >= 0; i--) {
          if (matchCondition(store[i], where)) {
            store.splice(i, 1);
            count++;
          }
        }
        return { count };
      },

      async upsert(args: any) {
        const { where, create, update, include } = args || {};
        const existing = store.find((item) => matchCondition(item, where));
        if (existing) {
          return this.update({ where, data: update, include });
        } else {
          return this.create({ data: create, include });
        }
      },
    };
  }

  // Root Client Proxy that intercepts model calls
  let clientProxy: any = null;
  const rootTarget: any = {
    $connect: async () => {},
    $disconnect: async () => {},
    $queryRawUnsafe: async () => [{ now: new Date(), db: 'mock_memory', ver: 'Mock Engine 1.0' }],
    $transaction: async (input: any) => {
      if (typeof input === 'function') {
        return await input(clientProxy);
      }
      if (Array.isArray(input)) {
        return await Promise.all(input);
      }
      return input;
    },
  };

  clientProxy = new Proxy(rootTarget, {
    get(target: any, prop: string) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        return createModelProxy(prop);
      }
      return undefined;
    },
  });

  return clientProxy;
}
