'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  MoreVertical,
  Edit,
  Eye,
  Shield,
  ShieldCheck,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Crown,
  Utensils,
  Coins,
  User,
} from 'lucide-react';
import type { MemberDto } from '@/server/members/member-service';
import { STANDARD_MESS_ROLES } from '@/server/rbac/role-templates';
import { AddMemberModal } from './AddMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { ChangeStatusModal } from './ChangeStatusModal';
import { QuickRoleModal } from './QuickRoleModal';

interface MemberDirectoryViewProps {
  tenantSlug: string;
  initialData: {
    members: MemberDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
    counts: {
      total: number;
      active: number;
      pending: number;
      suspended: number;
      left: number;
    };
  };
  roles?: Array<{ id: string; name: string; slug: string }>;
  canCreate?: boolean;
}

export function MemberDirectoryView({
  tenantSlug,
  initialData,
  roles = [],
  canCreate = true,
}: MemberDirectoryViewProps) {
  const effectiveRoles = roles && roles.length > 0 ? roles : STANDARD_MESS_ROLES;
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'joinedAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(data.pagination.page);

  const [isPending, startTransition] = useTransition();

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null);
  const [quickRoleMember, setQuickRoleMember] = useState<MemberDto | null>(null);
  const [statusTargetMember, setStatusTargetMember] = useState<MemberDto | null>(null);

  // Active dropdown action menu
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const fetchMembers = (
    newPage = currentPage,
    newStatus = statusFilter,
    newSearch = search,
    newSort = sortBy,
    newOrder = sortOrder
  ) => {
    startTransition(async () => {
      try {
        let url = `/api/v1/mess/${tenantSlug}/members?page=${newPage}&limit=15&sortBy=${newSort}&sortOrder=${newOrder}`;
        if (newStatus && newStatus !== 'ALL') {
          url += `&status=${newStatus}`;
        }
        if (newSearch.trim()) {
          url += `&search=${encodeURIComponent(newSearch.trim())}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setData(json.data);
            setCurrentPage(newPage);
          }
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1, statusFilter, search, sortBy, sortOrder);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchMembers(1, status, search, sortBy, sortOrder);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as any;
    setSortBy(val);
    fetchMembers(1, statusFilter, search, val, sortOrder);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Suspended</span>
          </span>
        );
      case 'LEFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
            <LogOut className="h-3 w-3" />
            <span>Left</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            {status}
          </span>
        );
    }
  };

  const renderRoleBadges = (member: MemberDto) => {
    const rolesToRender: Array<{ slug: string; label: string; color: string; icon: string }> = [];
    const assigned =
      member.assignedRoles && member.assignedRoles.length > 0
        ? member.assignedRoles
        : [member.roleSlug || 'member'];

    for (const slug of assigned) {
      if (slug === 'owner') {
        rolesToRender.push({
          slug,
          label: 'মেস ওনার (Owner)',
          color: 'bg-rose-50 text-rose-700 border-rose-200 group-hover:border-rose-300',
          icon: 'crown',
        });
      } else if (slug === 'admin') {
        rolesToRender.push({
          slug,
          label: 'সহ-এডমিন (Admin)',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:border-indigo-300',
          icon: 'shield',
        });
      } else if (slug === 'meal-manager') {
        rolesToRender.push({
          slug,
          label: 'মিলের দায়িত্ব (Meal)',
          color: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:border-amber-300',
          icon: 'meal',
        });
      } else if (slug === 'accountant') {
        rolesToRender.push({
          slug,
          label: 'হিসাবের দায়িত্ব (Finance)',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:border-emerald-300',
          icon: 'finance',
        });
      } else if (slug === 'moderator') {
        rolesToRender.push({
          slug,
          label: 'সমন্বয়ক (Moderator)',
          color: 'bg-purple-50 text-purple-700 border-purple-200 group-hover:border-purple-300',
          icon: 'mod',
        });
      } else if (slug === 'member') {
        rolesToRender.push({
          slug,
          label: 'সাধারণ সদস্য (Member)',
          color: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:border-blue-300',
          icon: 'user',
        });
      }
    }

    if (rolesToRender.length === 0) {
      rolesToRender.push({
        slug: 'member',
        label: member.roleName || 'Member',
        color: 'bg-slate-100 text-slate-700 border-slate-200 group-hover:border-slate-300',
        icon: 'user',
      });
    }

    return (
      <button
        type="button"
        onClick={() => setQuickRoleMember(member)}
        className="group flex flex-wrap items-center gap-1.5 p-1 -m-1 rounded-xl text-left hover:bg-slate-100/90 transition-all border border-transparent hover:border-slate-200/60 cursor-pointer"
        title="রোল ও দায়িত্ব পরিবর্তন করতে ক্লিক করুন (Click to change role)"
      >
        <div className="flex flex-wrap items-center gap-1">
          {rolesToRender.map((r, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${r.color} transition-colors shadow-2xs hover:shadow-xs`}
            >
              {r.icon === 'crown' && <Crown className="h-3 w-3 shrink-0" />}
              {r.icon === 'shield' && <Shield className="h-3 w-3 shrink-0" />}
              {r.icon === 'meal' && <Utensils className="h-3 w-3 shrink-0" />}
              {r.icon === 'finance' && <Coins className="h-3 w-3 shrink-0" />}
              {r.icon === 'mod' && <ShieldCheck className="h-3 w-3 shrink-0" />}
              {r.icon === 'user' && <User className="h-3 w-3 shrink-0" />}
              <span>{r.label}</span>
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs">
          <Edit className="h-3 w-3" />
          <span>রোল পরিবর্তন</span>
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600" />
            <span>Member Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage residents, onboard new members, assign roles, and monitor status.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* 2. Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => handleStatusFilterChange('ALL')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === 'ALL'
              ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Members
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {data.counts.total}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('ACTIVE')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Active</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-emerald-900">
            {data.counts.active}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('PENDING')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Pending</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">
            {data.counts.pending}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('SUSPENDED')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === 'SUSPENDED'
              ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Suspended</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-rose-900">
            {data.counts.suspended}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleStatusFilterChange('LEFT')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === 'LEFT'
              ? 'border-slate-500 bg-slate-100 ring-1 ring-slate-400 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Left / Archived</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-700">
            {data.counts.left}
          </p>
        </button>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or member code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-20 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="LEFT">Left</option>
            </select>
          </div>

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="joinedAt">Join Date</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* 4. Members Table & Card Layout */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {data.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Member Code</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Join Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.members.map((member) => {
                  const joinDateFormatted = member.joinedAt
                    ? new Date(member.joinedAt).toLocaleDateString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Pending';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 border border-emerald-200">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/mess/${tenantSlug}/members/${member.id}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors truncate block"
                            >
                              {member.name}
                            </Link>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {member.email || 'No email registered'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        {renderRoleBadges(member)}
                      </td>

                      {/* Member Code */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 font-semibold">
                        {member.memberCode || '—'}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 text-slate-600">
                          {member.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.emergencyContactPhone && (
                            <div className="text-[10px] text-slate-400">
                              Emergency: {member.emergencyContactPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {joinDateFormatted}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(member.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/mess/${tenantSlug}/members/${member.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingMember(member)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit Member"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusTargetMember(member)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                            title="Change Status"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              No members found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'No residents match your current search or status filter. Try clearing filters.'
                : 'No members have been added to this mess yet. Click below to add your first resident.'}
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add First Member</span>
              </button>
            )}
          </div>
        )}

        {/* 5. Pagination Footer */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-600">
            <span>
              Showing Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!data.pagination.hasPreviousPage}
                onClick={() => fetchMembers(data.pagination.page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={!data.pagination.hasNextPage}
                onClick={() => fetchMembers(data.pagination.page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        tenantSlug={tenantSlug}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        roles={effectiveRoles}
        onMemberAdded={(newMem) => {
          fetchMembers(1);
        }}
      />

      <EditMemberModal
        tenantSlug={tenantSlug}
        member={editingMember}
        roles={effectiveRoles}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onMemberUpdated={(updated) => {
          setData((prev) => ({
            ...prev,
            members: prev.members.map((m) =>
              m.id === updated.id ? updated : m
            ),
          }));
        }}
      />

      <QuickRoleModal
        tenantSlug={tenantSlug}
        member={quickRoleMember}
        roles={effectiveRoles}
        isOpen={!!quickRoleMember}
        onClose={() => setQuickRoleMember(null)}
        onRoleUpdated={(updated) => {
          setData((prev) => ({
            ...prev,
            members: prev.members.map((m) =>
              m.id === updated.id ? updated : m
            ),
          }));
        }}
      />

      <ChangeStatusModal
        tenantSlug={tenantSlug}
        member={statusTargetMember}
        isOpen={!!statusTargetMember}
        onClose={() => setStatusTargetMember(null)}
        onStatusChanged={(updated) => {
          fetchMembers(currentPage);
        }}
      />
    </div>
  );
}
