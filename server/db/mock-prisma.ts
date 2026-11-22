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
        name: 'Prince Mess',
        type: 'BACHELOR_MESS',
        status: 'ACTIVE',
        subscriptionStatus: 'ACTIVE',
        contactEmail: 'owner@messmate.dev',
        contactPhone: '+8801700000000',
        address: 'House 12, Road 4, Dhanmondi, Dhaka',
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
        email: 'owner@messmate.dev',
        name: 'Prince Mess Owner',
        phone: '+8801711000001',
        platformRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_manager_1',
        email: 'manager@messmate.dev',
        name: 'Mess Manager (Prince)',
        phone: '+8801711000002',
        platformRole: 'SUPPORT_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_resident_1',
        email: 'rahat@example.com',
        name: 'Rahat Chowdhury',
        phone: '+8801711223344',
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
        name: 'Tanvir Ahmed',
        phone: '+8801811223344',
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
        name: 'Hasan Mahmud',
        phone: '+8801911223344',
        platformRole: 'TENANT_USER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'usr_superadmin_1',
        email: 'admin@messmate.dev',
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
        name: 'Mess Owner',
        description: 'Full administrative control of the mess',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['*'],
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
      {
        id: 'role_accountant',
        tenantId: 'tenant_prince_mess',
        slug: 'accountant',
        name: 'Accountant',
        description: 'Financial auditor and budget keeper',
        isSystem: true,
        status: 'ACTIVE',
        permissions: ['finance.view', 'finance.manage', 'budget.manage'],
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
        memberCode: 'PRINCE-001',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_manager_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_manager_1',
        roleId: 'role_manager',
        status: 'ACTIVE',
        memberCode: 'PRINCE-002',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_1',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_1',
        roleId: 'role_resident',
        status: 'ACTIVE',
        memberCode: 'PRINCE-003',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
        emergencyContactName: 'Karim Chowdhury',
        emergencyContactPhone: '+8801711998877',
        notes: 'Room 101, Bed A',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_2',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_2',
        roleId: 'role_resident',
        status: 'ACTIVE',
        memberCode: 'PRINCE-004',
        joinedAt: new Date('2026-01-05T00:00:00Z'),
        emergencyContactName: 'Rezaul Ahmed',
        emergencyContactPhone: '+8801811998877',
        notes: 'Room 101, Bed B',
        createdAt: new Date('2026-01-05T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'mem_resident_3',
        tenantId: 'tenant_prince_mess',
        userId: 'usr_resident_3',
        roleId: 'role_resident',
        status: 'ACTIVE',
        memberCode: 'PRINCE-005',
        joinedAt: new Date('2026-01-10T00:00:00Z'),
        notes: 'Room 102, Bed A',
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    room: [
      {
        id: 'room_101',
        tenantId: 'tenant_prince_mess',
        roomNumber: '101',
        floor: 1,
        capacity: 2,
        defaultRent: 5000,
        status: 'OCCUPIED',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'room_102',
        tenantId: 'tenant_prince_mess',
        roomNumber: '102',
        floor: 1,
        capacity: 2,
        defaultRent: 5000,
        status: 'AVAILABLE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'room_201',
        tenantId: 'tenant_prince_mess',
        roomNumber: '201',
        floor: 2,
        capacity: 3,
        defaultRent: 4500,
        status: 'AVAILABLE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date(),
      },
    ],

    bed: [
      { id: 'bed_101_a', roomId: 'room_101', bedNumber: 'Bed A', status: 'OCCUPIED' },
      { id: 'bed_101_b', roomId: 'room_101', bedNumber: 'Bed B', status: 'OCCUPIED' },
      { id: 'bed_102_a', roomId: 'room_102', bedNumber: 'Bed A', status: 'OCCUPIED' },
      { id: 'bed_102_b', roomId: 'room_102', bedNumber: 'Bed B', status: 'AVAILABLE' },
    ],

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
  return new Proxy(
    {
      $connect: async () => {},
      $disconnect: async () => {},
      $queryRawUnsafe: async () => [{ now: new Date(), db: 'mock_memory', ver: 'Mock Engine 1.0' }],
    },
    {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
          return createModelProxy(prop);
        }
        return undefined;
      },
    }
  );
}
