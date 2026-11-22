'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Crown,
  KeyRound,
  Loader2,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function openAuthModal(tab: 'trial' | 'login' = 'trial') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('messmate-open-auth', { detail: { tab } }));
  }
}

interface AuthModalProps {
  initialOpen?: boolean;
  defaultTab?: 'trial' | 'login';
}

export function AuthModal({ initialOpen = false, defaultTab = 'trial' }: AuthModalProps) {
  const [open, setOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<'trial' | 'login'>(defaultTab);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'trial' | 'login' }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setOpen(true);
    };

    window.addEventListener('messmate-open-auth', handleOpen);
    return () => window.removeEventListener('messmate-open-auth', handleOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-slate-200/90 shadow-2xl">
        <AuthCard
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface AuthCardProps {
  activeTab?: 'trial' | 'login';
  onTabChange?: (tab: 'trial' | 'login') => void;
  onSuccess?: () => void;
  isStandalone?: boolean;
}

export function AuthCard({
  activeTab = 'trial',
  onTabChange,
  onSuccess,
  isStandalone = false,
}: AuthCardProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  const [tab, setTab] = useState<'trial' | 'login'>(activeTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messName, setMessName] = useState('');

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  const handleTabSwitch = (newTab: 'trial' | 'login') => {
    setTab(newTab);
    setError(null);
    setSuccessMsg(null);
    if (onTabChange) onTabChange(newTab);
  };

  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          messName: messName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start trial');
      }

      setSuccessMsg(
        isBn
          ? '🎉 ৭ দিনের ফ্রি ট্রায়াল চালু হয়েছে! রিডাইরেক্ট করা হচ্ছে...'
          : '🎉 7-Day Free Trial activated! Redirecting to workspace...'
      );

      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Trial activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      setSuccessMsg(isBn ? 'লগইন সফল! রিডাইরেক্ট হচ্ছে...' : 'Login successful! Redirecting...');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'ADMIN' | 'MEMBER' | 'SUPERADMIN') => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:
            role === 'ADMIN'
              ? 'owner@messmate.dev'
              : role === 'MEMBER'
              ? 'resident@messmate.dev'
              : 'admin@messmate.dev',
          password: 'demo_password',
          role,
          tenantSlug: 'prince-mess',
          isDemo: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Demo login failed');
      }

      setSuccessMsg(isBn ? 'লগইন সফল! রিডাইরেক্ট হচ্ছে...' : 'Demo access granted! Redirecting...');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white ${isStandalone ? 'rounded-2xl border border-slate-200 shadow-xl max-w-md w-full mx-auto' : ''}`}>
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 rounded-t-2xl">
        <button
          type="button"
          onClick={() => handleTabSwitch('trial')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            tab === 'trial'
              ? 'bg-white text-[#324CDD] shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4 text-[#324CDD]" />
          <span>{isBn ? '৭ দিনের ফ্রি ট্রায়াল' : '7-Day Free Trial'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch('login')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            tab === 'login'
              ? 'bg-white text-[#324CDD] shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="h-4 w-4 text-slate-500" />
          <span>{isBn ? 'লগইন করুন' : 'Log In'}</span>
        </button>
      </div>

      <div className="p-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs sm:text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm text-emerald-700 font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ----------------- TAB 1: 7-DAY FREE TRIAL ----------------- */}
        {tab === 'trial' && (
          <form onSubmit={handleTrialSubmit} className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-lg font-bold text-slate-900">
                {isBn ? '৭ দিনের ফ্রি ট্রায়াল শুরু করুন' : 'Start Your 7-Day Free Trial'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isBn
                  ? 'কোনো ক্রেডিট কার্ড লাগবে না · সঙ্গে সঙ্গে মেস ড্যাশবোর্ড চালু করুন'
                  : 'No credit card required · Instant access to your mess workspace'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isBn ? 'আপনার ইমেইল' : 'Your Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#324CDD] focus:ring-2 focus:ring-[#324CDD]/15 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#324CDD] focus:ring-2 focus:ring-[#324CDD]/15 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>{isBn ? 'মেসের নাম (ঐচ্ছিক)' : 'Mess Name (Optional)'}</span>
                <span className="text-[10px] text-slate-400">
                  {isBn ? 'ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে' : 'Auto-generated if left blank'}
                </span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  placeholder={isBn ? 'যেমন: ঢাকা স্টুডেন্ট মেস / Green Valley Mess' : 'e.g. Dhaka Student Mess / Green Valley Mess'}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#324CDD] focus:ring-2 focus:ring-[#324CDD]/15 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#324CDD] hover:bg-[#283DB0] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#324CDD]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isBn ? 'ট্রায়াল চালু করা হচ্ছে...' : 'Activating Trial...'}</span>
                </>
              ) : (
                <>
                  <span>{isBn ? '🚀 ৭ দিনের ফ্রি ট্রায়াল শুরু করুন' : '🚀 Start 7-Day Free Trial'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isBn ? 'কোনো হিডেন চার্জ বা অটো-রিনিউ নেই' : 'No automatic renewal without consent'}</span>
              </p>
            </div>
          </form>
        )}

        {/* ----------------- TAB 2: LOGIN ----------------- */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-lg font-bold text-slate-900">
                {isBn ? 'মেসমেট অ্যাকাউন্টে লগইন করুন' : 'Sign in to MessMate'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isBn
                  ? 'আপনার ইমেইল ও পাসওয়ার্ড দিয়ে ড্যাশবোর্ডে প্রবেশ করুন'
                  : 'Enter your credentials to access your dashboard'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isBn ? 'ইমেইল' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#324CDD] focus:ring-2 focus:ring-[#324CDD]/15 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#324CDD] focus:ring-2 focus:ring-[#324CDD]/15 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#324CDD] hover:bg-[#283DB0] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#324CDD]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isBn ? 'লগইন হচ্ছে...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isBn ? 'লগইন করুন' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Quick 1-Click Persona Demo Logins */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-2.5">
                {isBn ? '⚡ টেস্ট করার জন্য ডেমো একাউন্ট (Prince Mess):' : '⚡ 1-Click Demo Accounts (Prince Mess):'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  className="p-2 bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-800 rounded-xl text-center border border-indigo-200/60 transition-all cursor-pointer flex flex-col items-center justify-center"
                >
                  <Crown className="h-4 w-4 text-indigo-600 mb-1" />
                  <span className="text-[11px] font-bold leading-tight">
                    {isBn ? 'মেস এডমিন' : 'Mess Admin'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('MEMBER')}
                  className="p-2 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 rounded-xl text-center border border-emerald-200/60 transition-all cursor-pointer flex flex-col items-center justify-center"
                >
                  <UserCheck className="h-4 w-4 text-emerald-600 mb-1" />
                  <span className="text-[11px] font-bold leading-tight">
                    {isBn ? 'মেম্বার' : 'Member'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin('SUPERADMIN')}
                  className="p-2 bg-purple-50/80 hover:bg-purple-100/90 text-purple-800 rounded-xl text-center border border-purple-200/60 transition-all cursor-pointer flex flex-col items-center justify-center"
                >
                  <ShieldCheck className="h-4 w-4 text-purple-600 mb-1" />
                  <span className="text-[11px] font-bold leading-tight">
                    {isBn ? 'সুপার এডমিন' : 'Super Admin'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
