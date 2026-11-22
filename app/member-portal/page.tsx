import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Shield, ArrowRight, Home, Building2, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resident Member Portal | MessMate',
  description:
    'Dedicated portal for mess residents to monitor daily meal counts, room rent, payment receipts, and mess notices.',
};

export default function MemberPortalLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold tracking-wide border border-emerald-500/20">
            <Users className="h-4 w-4" />
            <span>Resident Access Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            MessMate Resident Member Portal
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Welcome to your personal mess workspace. Review your daily meal status, manage meal-off requests,
            track bed rent, view financial ledgers, and stay updated with official mess notices.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-slate-900 text-base">Daily Dining & Meals</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time daily meal tracking, breakfast/lunch/dinner menus, and advance meal-off submission before cutoff.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-slate-900 text-base">Room & Bed Details</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify your room number, assigned bed slot, monthly bed rent, and room-change requests in one place.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-slate-900 text-base">Transparent Ledger</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Zero discrepancy ledger showing opening balance, meal charges, utilities, payments, and net closing dues.
            </p>
          </div>
        </div>

        {/* Access Demo Portals */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Your Mess Portal</h2>
          <p className="text-xs text-slate-600 mb-6">
            Resident access is scoped to each individual mess tenant. Enter directly through your mess subdomain or URL:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/portal/prince-mess"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all group"
            >
              <div>
                <p className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">
                  Prince Mess Portal
                </p>
                <p className="text-xs text-slate-500">/portal/prince-mess</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/portal/green-villa-mess"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all group"
            >
              <div>
                <p className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">
                  Green Villa Mess Portal
                </p>
                <p className="text-xs text-slate-500">/portal/green-villa-mess</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} MessMate Multi-Tenant SaaS. All rights reserved.</span>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-slate-800">
            <Home className="h-3.5 w-3.5" />
            <span>Return to Main Website</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
