import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthModal';

export const metadata: Metadata = {
  title: 'Mess Admin Login — MessMate',
  description: 'Sign in to the Mess Admin management portal.',
};

export default function MessAdminLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <AuthCard isStandalone={true} activeTab="login" />
    </div>
  );
}
