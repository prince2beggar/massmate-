'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Shield,
  Tag,
  Calendar,
  HeartHandshake,
  FileText,
  BedDouble,
  UtensilsCrossed,
  CreditCard,
  History,
  Lock,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
} from 'lucide-react';
import type { MemberDetailDto, MemberDto } from '@/server/members/member-service';
import { EditMemberModal } from './EditMemberModal';
import { ChangeStatusModal } from './ChangeStatusModal';

interface MemberProfileViewProps {
  tenantSlug: string;
  member: MemberDetailDto;
  roles?: Array<{ id: string; name: string; slug: string }>;
  canEdit?: boolean;
}

export function MemberProfileView({
  tenantSlug,
  member: initialMember,
  roles = [],
  canEdit = true,
}: MemberProfileViewProps) {
  const [member, setMember] = useState<MemberDetailDto>(initialMember);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'room' | 'meals' | 'finance' | 'history'
  >('overview');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active Resident</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Activation</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Suspended</span>
          </span>
        );
      case 'LEFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            <LogOut className="h-3.5 w-3.5" />
            <span>Archived / Departed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  const joinDateStr = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString('en-US', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not yet active';

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          href={`/mess/${tenantSlug}/members`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Member Directory</span>
        </Link>
      </div>

      {/* Member Profile Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-sm">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {member.name}
                </h1>
                {getStatusBadge(member.status)}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{member.roleName}</span>
                </span>
                <span>•</span>
                <span className="font-mono text-slate-600">
                  Code: {member.memberCode || '—'}
                </span>
                <span>•</span>
                <span>Joined: {joinDateStr}</span>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 shadow-2xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Change Status</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Personal & Contact Info' },
            { id: 'room', label: 'Room & Bed' },
            { id: 'meals', label: 'Meal Summary' },
            { id: 'finance', label: 'Financial Statement' },
            { id: 'history', label: 'Audit Timeline' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-3 py-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="h-4 w-4 text-emerald-600" />
              <span>Contact Information</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Phone Number
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {member.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Email Address
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {member.email || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Member ID
                </p>
                <p className="font-mono text-slate-600 mt-0.5">{member.id}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact & Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HeartHandshake className="h-4 w-4 text-emerald-600" />
              <span>Emergency Contact & Notes</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Emergency Contact Name
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {member.emergencyContactName || 'None recorded'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Emergency Phone
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {member.emergencyContactPhone || 'None recorded'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">
                  Staff Administrative Notes
                </p>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-0.5 leading-relaxed">
                  {member.notes || 'No administrative notes recorded for this member.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'room' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-3">
          <BedDouble className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">
            Room & Bed Assignment
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {member.roomAssignment.note}
          </p>
        </div>
      )}

      {activeTab === 'meals' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs space-y-3">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">
            Meal Subscription
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {member.mealSummary.note}
          </p>
        </div>
      )}

      {activeTab === 'finance' && (
        <div>
          {member.financialSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Member Billing & Payment Ledger</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Total Billed
                  </p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    ৳{member.financialSummary.totalBilled}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">
                    Confirmed Payments
                  </p>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">
                    ৳{member.financialSummary.confirmedPayments}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5">
                  <p className="text-[10px] font-bold uppercase text-amber-700">
                    Outstanding Balance
                  </p>
                  <p className="text-xl font-extrabold text-amber-900 mt-1">
                    ৳{member.financialSummary.outstandingBalance}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Itemized member billing statements will populate in Task 35.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 text-center text-xs text-amber-800 space-y-2">
              <Lock className="mx-auto h-6 w-6 text-amber-600" />
              <p className="font-bold">Access Restricted</p>
              <p className="max-w-md mx-auto">
                Member financial summaries and payment records are protected. You do
                not hold the <code className="font-mono">finance.view</code> permission
                required to inspect private resident accounts.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="h-4 w-4 text-emerald-600" />
            <span>Member Audit Timeline</span>
          </h3>

          {member.recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {member.recentActivities.map((act) => (
                <div key={act.id} className="py-2.5 text-xs flex justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {act.description}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Action: {act.action}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(act.createdAt).toLocaleString('en-US', {
                      timeZone: 'Asia/Dhaka',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">
              No recent audit records found for this member.
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      <EditMemberModal
        tenantSlug={tenantSlug}
        member={member}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onMemberUpdated={(updated) => {
          setMember({ ...member, ...updated });
        }}
      />

      <ChangeStatusModal
        tenantSlug={tenantSlug}
        member={member}
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onStatusChanged={(updated) => {
          setMember({ ...member, ...updated });
        }}
      />
    </div>
  );
}
