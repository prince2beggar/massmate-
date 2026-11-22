import {
  LayoutDashboard,
  User,
  BedDouble,
  FileQuestion,
  UtensilsCrossed,
  Megaphone,
  Calendar,
  AlertCircle,
  Wallet,
  CreditCard,
  Bell,
  UserCheck,
  Vote,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface MemberNavItem {
  id: string;
  name: string;
  path: string; // relative to `/portal/[tenantSlug]`
  icon: LucideIcon;
  isImplemented: boolean;
  upcomingTask?: string;
  description: string;
}

export const MEMBER_NAV_ITEMS: MemberNavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '',
    icon: LayoutDashboard,
    isImplemented: true,
    description: 'Overview of your room, meals, balances, notices, and activity.',
  },
  {
    id: 'profile',
    name: 'My Profile',
    path: 'profile',
    icon: User,
    isImplemented: true,
    description: 'Personal details, contact numbers, and profile settings.',
  },
  {
    id: 'room',
    name: 'My Room',
    path: 'room',
    icon: BedDouble,
    isImplemented: true,
    description: 'Current room seat, bed assignment, and room rules.',
  },
  {
    id: 'requests',
    name: 'Personal Requests',
    path: 'requests',
    icon: FileQuestion,
    isImplemented: true,
    description: 'Track profile updates and room transfer requests.',
  },
  {
    id: 'meals',
    name: 'My Meals',
    path: 'meals',
    icon: UtensilsCrossed,
    isImplemented: true,
    description: 'Daily dining schedule, meal counts, menus, and meal-off.',
  },
  {
    id: 'notices',
    name: 'Notices',
    path: 'notices',
    icon: Megaphone,
    isImplemented: true,
    description: 'Official announcements and notices from mess management.',
  },
  {
    id: 'events',
    name: 'Events & Feasts',
    path: 'events',
    icon: Calendar,
    isImplemented: true,
    description: 'Special dining feasts, cleaning drives, and mess meetings.',
  },
  {
    id: 'complaints',
    name: 'Complaints & Requests',
    path: 'complaints',
    icon: AlertCircle,
    isImplemented: true,
    description: 'Submit maintenance issues and grievances to management.',
  },
  {
    id: 'account',
    name: 'My Account & Bills',
    path: 'account',
    icon: Wallet,
    isImplemented: true,
    description: 'Monthly statement, rent, utilities, and meal charges breakdown.',
  },
  {
    id: 'payments',
    name: 'Payments',
    path: 'payments',
    icon: CreditCard,
    isImplemented: true,
    description: 'Payment history, submission of vouchers, and receipts.',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    path: 'notifications',
    icon: Bell,
    isImplemented: true,
    description: 'Personal alerts, meal reminders, and delivery settings.',
  },
  {
    id: 'visitors',
    name: 'Expected Visitors',
    path: 'visitors',
    icon: UserCheck,
    isImplemented: true,
    description: 'Pre-register expected guests and track visitor check-in status.',
  },
  {
    id: 'polls',
    name: 'Community Polls',
    path: 'polls',
    icon: Vote,
    isImplemented: true,
    description: 'Vote on meal preferences, facility decisions, and submit ideas.',
  },
  {
    id: 'documents',
    name: 'My Documents',
    path: 'documents',
    icon: FileText,
    isImplemented: true,
    description: 'Rental contracts, mess agreements, receipts, and permitted private documents.',
  },
];
