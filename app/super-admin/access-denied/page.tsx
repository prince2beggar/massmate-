import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Building2, Lock } from 'lucide-react';

export default function SuperAdminAccessDeniedPage() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-5 shadow-xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Platform Administrator Access Required
      </h1>

      <p className="mt-2.5 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
        You do not hold platform-level administrator credentials. Tenant-level roles
        (such as Mess Owner, Mess Admin, or Manager) operate independently and do not
        grant access to the Central Platform Super Admin.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 max-w-md text-left text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Lock className="h-4 w-4 text-slate-500" />
          Multi-Tenant Boundary Policy
        </div>
        <p>
          MessMate enforces strict separation between tenant management and platform governance.
          If you are looking for your mess dashboard, visit your mess portal below.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Public Website
        </Link>
        <Link
          href="/mess-admin-login"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Building2 className="h-4 w-4" />
          Mess Admin Login
        </Link>
      </div>
    </div>
  );
}
