import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthModal';

export const metadata: Metadata = {
  title: 'Sign In — MessMate',
  description: 'Log in to your Mess Admin or Member Portal account.',
};

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
      <AuthCard isStandalone={true} activeTab="login" />
    </div>
  );
}
