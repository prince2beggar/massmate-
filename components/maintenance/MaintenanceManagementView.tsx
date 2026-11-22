'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  CheckSquare,
  FileText,
  DollarSign,
  Loader2,
  X,
  Building2,
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import type {
  MaintenanceDashboardDto,
  WorkOrderDto,
  OperationalTaskDto,
  WorkOrderCategory,
  WorkOrderPriority,
  WorkOrderStatus,
  TaskCategory,
  TaskPriority,
  RecurrenceRule,
} from '@/server/maintenance/maintenance-service';

interface MaintenanceManagementViewProps {
  tenantSlug: string;
  tenantName: string;
}

const WO_CATEGORIES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'ELECTRICAL', label: 'Electrical & Wiring' },
  { key: 'PLUMBING', label: 'Plumbing & Drainage' },
  { key: 'APPLIANCE', label: 'Appliance Repair' },
  { key: 'FURNITURE', label: 'Furniture & Carpentry' },
  { key: 'CLEANING', label: 'Cleaning & Sanitation' },
  { key: 'PEST_CONTROL', label: 'Pest Control' },
  { key: 'BUILDING_REPAIR', label: 'Building & Room Repair' },
  { key: 'INTERNET_NETWORK', label: 'Internet & Network' },
  { key: 'OTHER', label: 'Other Work' },
];

const WO_STATUSES: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Statuses' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'VERIFIED', label: 'Verified & Closed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function MaintenanceManagementView({
  tenantSlug,
  tenantName,
}: MaintenanceManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'WORK_ORDERS' | 'TASKS' | 'REPORTS'>('DASHBOARD');

  // Dashboard state
  const [dashboard, setDashboard] = useState<MaintenanceDashboardDto | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [woTotal, setWoTotal] = useState(0);
  const [woLoading, setWoLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Operational Tasks state
  const [tasks, setTasks] = useState<OperationalTaskDto[]>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('ALL');

  // Reports state
  const [reports, setReports] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Modals state
  const [showCreateWoModal, setShowCreateWoModal] = useState(false);
  const [showUpdateWoModal, setShowUpdateWoModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedWo, setSelectedWo] = useState<WorkOrderDto | null>(null);

  // Modal feedback
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Create Work Order Form State
  const [formWoTitle, setFormWoTitle] = useState('');
  const [formWoDesc, setFormWoDesc] = useState('');
  const [formWoCategory, setFormWoCategory] = useState<WorkOrderCategory>('ELECTRICAL');
  const [formWoPriority, setFormWoPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [formWoRoomId, setFormWoRoomId] = useState('');
  const [formWoDueDate, setFormWoDueDate] = useState('');
  const [formWoEstTaka, setFormWoEstTaka] = useState('');
  const [formWoInternalNotes, setFormWoInternalNotes] = useState('');
  const [formWoMemberUpdates, setFormWoMemberUpdates] = useState('');

  // Update Work Order Form State
  const [formUpdateStatus, setFormUpdateStatus] = useState<WorkOrderStatus>('IN_PROGRESS');
  const [formUpdateActualTaka, setFormUpdateActualTaka] = useState('');
  const [formUpdateCompletionNotes, setFormUpdateCompletionNotes] = useState('');
  const [formUpdateMemberUpdates, setFormUpdateMemberUpdates] = useState('');
  const [formUpdateInternalNotes, setFormUpdateInternalNotes] = useState('');
  const [formUpdateReason, setFormUpdateReason] = useState('');

  // Create Task Form State
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formTaskDesc, setFormTaskDesc] = useState('');
  const [formTaskCategory, setFormTaskCategory] = useState<TaskCategory>('CLEANING');
  const [formTaskPriority, setFormTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [formTaskRecurrence, setFormTaskRecurrence] = useState<RecurrenceRule>('WEEKLY');
  const [formTaskDueDate, setFormTaskDueDate] = useState('');
  const [formTaskChecklistText, setFormTaskChecklistText] = useState('');

  // Load Dashboard Data
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/mess/${tenantSlug}/maintenance/dashboard`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setDashboard(json.data);
        }
      })
      .catch((err) => console.error('[MaintenanceView] Dashboard fetch error:', err))
      .finally(() => {
        if (isMounted) setDashLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  // Load Work Orders when WORK_ORDERS tab active
  useEffect(() => {
    if (activeTab !== 'WORK_ORDERS') return;

    let isMounted = true;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
    if (overdueOnly) params.set('overdueOnly', 'true');
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/maintenance?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setWorkOrders(json.data);
          setWoTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => console.error('[MaintenanceView] Work orders fetch error:', err))
      .finally(() => {
        if (isMounted) setWoLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab, searchQuery, categoryFilter, statusFilter, priorityFilter, overdueOnly]);

  // Load Operational Tasks when TASKS tab active
  useEffect(() => {
    if (activeTab !== 'TASKS') return;

    let isMounted = true;
    const params = new URLSearchParams();
    if (taskCategoryFilter !== 'ALL') params.set('category', taskCategoryFilter);
    params.set('limit', '50');

    fetch(`/api/v1/mess/${tenantSlug}/maintenance/tasks?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setTasks(json.data);
          setTasksTotal(json.meta?.total || 0);
        }
      })
      .catch((err) => console.error('[MaintenanceView] Tasks fetch error:', err))
      .finally(() => {
        if (isMounted) setTasksLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab, taskCategoryFilter]);

  // Load Reports when REPORTS tab active
  useEffect(() => {
    if (activeTab !== 'REPORTS') return;

    let isMounted = true;
    fetch(`/api/v1/mess/${tenantSlug}/maintenance/reports`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.success && json.data) {
          setReports(json.data);
        }
      })
      .catch((err) => console.error('[MaintenanceView] Reports fetch error:', err))
      .finally(() => {
        if (isMounted) setReportsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, activeTab]);

  const handleRefresh = async () => {
    if (activeTab === 'DASHBOARD') {
      setDashLoading(true);
      try {
        const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance/dashboard`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setDashboard(json.data);
        }
      } finally {
        setDashLoading(false);
      }
    } else if (activeTab === 'WORK_ORDERS') {
      setWoLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
        if (overdueOnly) params.set('overdueOnly', 'true');
        const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setWorkOrders(json.data);
            setWoTotal(json.meta?.total || 0);
          }
        }
      } finally {
        setWoLoading(false);
      }
    } else if (activeTab === 'TASKS') {
      setTasksLoading(true);
      try {
        const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance/tasks`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setTasks(json.data);
            setTasksTotal(json.meta?.total || 0);
          }
        }
      } finally {
        setTasksLoading(false);
      }
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formWoTitle,
          description: formWoDesc,
          category: formWoCategory,
          priority: formWoPriority,
          roomId: formWoRoomId.trim() || undefined,
          dueDate: formWoDueDate ? new Date(formWoDueDate).toISOString() : undefined,
          estimatedCostTaka: formWoEstTaka ? parseFloat(formWoEstTaka) : undefined,
          internalNotes: formWoInternalNotes.trim() || undefined,
          memberUpdates: formWoMemberUpdates.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to create work order.');
      }

      setShowCreateWoModal(false);
      setFormWoTitle('');
      setFormWoDesc('');
      setFormWoRoomId('');
      setFormWoDueDate('');
      setFormWoEstTaka('');
      setFormWoInternalNotes('');
      setFormWoMemberUpdates('');
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Error creating work order.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWo) return;
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance/work-orders/${selectedWo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formUpdateStatus,
          actualCostTaka: formUpdateActualTaka ? parseFloat(formUpdateActualTaka) : undefined,
          completionNotes: formUpdateCompletionNotes.trim() || undefined,
          memberUpdates: formUpdateMemberUpdates.trim() || undefined,
          internalNotes: formUpdateInternalNotes.trim() || undefined,
          statusChangeReason: formUpdateReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to update work order.');
      }

      setShowUpdateWoModal(false);
      setSelectedWo(null);
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Error updating work order.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const checklistLines = formTaskChecklistText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const checklist = checklistLines.map((text, idx) => ({
        id: `c_${idx + 1}`,
        text,
        completed: false,
      }));

      const res = await fetch(`/api/v1/mess/${tenantSlug}/maintenance/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTaskTitle,
          description: formTaskDesc.trim() || undefined,
          category: formTaskCategory,
          priority: formTaskPriority,
          recurrenceRule: formTaskRecurrence,
          dueDate: formTaskDueDate ? new Date(formTaskDueDate).toISOString() : undefined,
          checklist: checklist.length > 0 ? checklist : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to create operational task.');
      }

      setShowCreateTaskModal(false);
      setFormTaskTitle('');
      setFormTaskDesc('');
      setFormTaskDueDate('');
      setFormTaskChecklistText('');
      handleRefresh();
    } catch (err: any) {
      setModalError(err?.message || 'Error creating operational task.');
    } finally {
      setModalLoading(false);
    }
  };

  const openUpdateModal = (wo: WorkOrderDto) => {
    setSelectedWo(wo);
    setFormUpdateStatus(wo.status as WorkOrderStatus);
    setFormUpdateActualTaka(wo.actualCostTaka ? wo.actualCostTaka.toString() : '');
    setFormUpdateCompletionNotes(wo.completionNotes || '');
    setFormUpdateMemberUpdates(wo.memberUpdates || '');
    setFormUpdateInternalNotes(wo.internalNotes || '');
    setFormUpdateReason('');
    setModalError(null);
    setShowUpdateWoModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Open</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">In Progress</span>;
      case 'WAITING_FOR_PARTS':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Waiting Parts</span>;
      case 'COMPLETED':
      case 'VERIFIED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Urgent</span>;
      case 'HIGH':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">High</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Medium</span>;
      case 'LOW':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-normal bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">Low</span>;
      default:
        return <span>{priority}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance & Work Orders</h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tenantName} · Work order lifecycle, staff assignments, operational task checklists, and repairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${dashLoading || woLoading || tasksLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setShowCreateWoModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setShowCreateTaskModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <CheckSquare className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'DASHBOARD'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('WORK_ORDERS')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'WORK_ORDERS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Work Orders Roster
          {dashboard?.overdueWorkOrdersCount ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {dashboard.overdueWorkOrdersCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('TASKS')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'TASKS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Operational Tasks
        </button>
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'REPORTS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Workload & Audits
        </button>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="py-12 flex justify-center items-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : dashboard ? (
            <>
              {/* Overdue Alert Banner */}
              {dashboard.overdueWorkOrdersCount > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                        {dashboard.overdueWorkOrdersCount} Overdue Maintenance Orders Require Attention
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-400">
                        Work orders have passed their target completion deadline. Review technician assignments.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOverdueOnly(true);
                      setActiveTab('WORK_ORDERS');
                    }}
                    className="text-xs font-medium text-rose-700 dark:text-rose-300 hover:underline shrink-0"
                  >
                    View Overdue Orders →
                  </button>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-xs font-medium">Total Orders</span>
                    <Wrench className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-bold">{dashboard.totalWorkOrders}</div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-xs font-medium">Open / Assigned</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboard.openCount + dashboard.assignedCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-amber-600 mb-1">
                    <span className="text-xs font-medium">In Progress</span>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {dashboard.inProgressCount + dashboard.waitingPartsCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-xs font-medium">Completed</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{dashboard.completedCount}</div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-purple-600 mb-1">
                    <span className="text-xs font-medium">Active Tasks</span>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{dashboard.pendingTasksCount}</div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between text-zinc-500 mb-1">
                    <span className="text-xs font-medium">Total Cost</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-emerald-600">
                    {dashboard.formattedTotalMaintenanceCost}
                  </div>
                </div>
              </div>

              {/* Category Breakdown & Recent Orders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                    <span>Work Orders by Category</span>
                    <span className="text-xs text-zinc-400 font-normal">Expense sum</span>
                  </h3>
                  <div className="space-y-3">
                    {dashboard.categoryBreakdown.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs"
                      >
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">
                          {cat.category.replace('_', ' ')}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 font-semibold">
                            {cat.count} orders
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {cat.formattedTotalCost}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dashboard.categoryBreakdown.length === 0 && (
                      <p className="text-xs text-zinc-400 py-4 text-center">No categories recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Recent Work Orders</h3>
                    <button
                      onClick={() => setActiveTab('WORK_ORDERS')}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View All Roster →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {dashboard.recentWorkOrders.slice(0, 5).map((wo) => (
                      <div
                        key={wo.id}
                        className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-500 font-semibold">{wo.referenceNumber}</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{wo.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                            <span>Category: {wo.category}</span>
                            {wo.roomNumber && <span>Room: {wo.roomNumber}</span>}
                            {wo.assignedUserName && <span>Technician: {wo.assignedUserName}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getPriorityBadge(wo.priority)}
                          {getStatusBadge(wo.status)}
                          <button
                            onClick={() => openUpdateModal(wo)}
                            className="p-1 text-zinc-400 hover:text-blue-600"
                            title="Update"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: WORK ORDERS ROSTER */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search reference, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              >
                {WO_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              >
                {WO_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap pl-2">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-0"
                />
                <span>Overdue Only</span>
              </label>
            </div>
          </div>

          {/* Table / Cards */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {woLoading ? (
              <div className="py-16 flex justify-center items-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : workOrders.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 space-y-2">
                <Wrench className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-medium">No maintenance work orders found matching filters.</p>
                <p className="text-xs text-zinc-400">Create a work order or adjust search parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                    <tr>
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Title & Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Technician / Assignee</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Cost (BDT)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {workOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition ${
                          wo.isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-zinc-600 dark:text-zinc-400">
                          {wo.referenceNumber}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{wo.title}</div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1">{wo.description}</div>
                          {wo.roomNumber && (
                            <span className="inline-block mt-1 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                              Room {wo.roomNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                          {wo.category.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(wo.priority)}</td>
                        <td className="py-3 px-4">{getStatusBadge(wo.status)}</td>
                        <td className="py-3 px-4">
                          {wo.assignedUserName ? (
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {wo.assignedUserName}
                            </span>
                          ) : wo.assignedVendorName ? (
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                              {wo.assignedVendorName}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {wo.formattedDueDate ? (
                            <div className={wo.isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}>
                              {wo.formattedDueDate}
                              {wo.isOverdue && <span className="block text-[10px] text-rose-500">Overdue</span>}
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600 whitespace-nowrap">
                          {wo.formattedActualCost !== '৳0.00' ? wo.formattedActualCost : wo.formattedEstimatedCost}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openUpdateModal(wo)}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL TASKS */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Filter Category:</span>
              <select
                value={taskCategoryFilter}
                onChange={(e) => setTaskCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CLEANING">Cleaning & Sanitation</option>
                <option value="INSPECTION">Inspection & Safety</option>
                <option value="MAINTENANCE">Equipment Maintenance</option>
                <option value="UTILITY">Utility & Meters</option>
                <option value="ADMINISTRATIVE">Administrative</option>
              </select>
            </div>

            <span className="text-xs text-zinc-500">{tasksTotal} total operational tasks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasksLoading ? (
              <div className="col-span-full py-16 flex justify-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-500">
                <CheckSquare className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-sm font-medium">No operational tasks found.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">{task.referenceNumber}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>
                    )}

                    {/* Checklist */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                        <span className="text-[11px] font-semibold text-zinc-400">Checklist Items:</span>
                        {task.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              readOnly
                              className="rounded text-blue-600 w-3.5 h-3.5 pointer-events-none"
                            />
                            <span className={item.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{task.formattedDueDate || 'No due date'}</span>
                    </div>
                    {task.recurrenceRule !== 'NONE' && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                        {task.recurrenceRule}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {reportsLoading ? (
            <div className="py-16 flex justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : reports ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Expenditure by Category</h3>
                <div className="space-y-3">
                  {reports.categoryDistribution?.map((cat: any) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {cat.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">{cat.count} orders</span>
                        <span className="font-bold text-emerald-600">{cat.formattedCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Workload */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Staff & Technician Workload</h3>
                <div className="space-y-3">
                  {reports.staffWorkload?.map((s: any) => (
                    <div
                      key={s.staffId}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{s.staffName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-amber-600 font-medium">{s.openOrders} Open</span>
                        <span className="text-emerald-600 font-medium">{s.completedOrders} Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {showCreateWoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold">Create Maintenance Work Order</h3>
              <button
                onClick={() => setShowCreateWoModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateWorkOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Work Order Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Repair Kitchen Exhaust Chimney"
                  value={formWoTitle}
                  onChange={(e) => setFormWoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise details of the maintenance issue..."
                  value={formWoDesc}
                  onChange={(e) => setFormWoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Category</label>
                  <select
                    value={formWoCategory}
                    onChange={(e) => setFormWoCategory(e.target.value as WorkOrderCategory)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="ELECTRICAL">Electrical & Wiring</option>
                    <option value="PLUMBING">Plumbing & Drainage</option>
                    <option value="APPLIANCE">Appliance Repair</option>
                    <option value="FURNITURE">Furniture & Carpentry</option>
                    <option value="CLEANING">Cleaning & Sanitation</option>
                    <option value="PEST_CONTROL">Pest Control</option>
                    <option value="BUILDING_REPAIR">Building/Room Repair</option>
                    <option value="INTERNET_NETWORK">Internet & Network</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Priority</label>
                  <select
                    value={formWoPriority}
                    onChange={(e) => setFormWoPriority(e.target.value as WorkOrderPriority)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={formWoDueDate}
                    onChange={(e) => setFormWoDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Estimated Cost (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formWoEstTaka}
                    onChange={(e) => setFormWoEstTaka(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Internal Staff Notes</label>
                <input
                  type="text"
                  placeholder="Technician details, parts to order (hidden from members)"
                  value={formWoInternalNotes}
                  onChange={(e) => setFormWoInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateWoModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Work Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE WORK ORDER MODAL */}
      {showUpdateWoModal && selectedWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold">Manage Work Order</h3>
                <p className="text-xs text-zinc-500 font-mono">{selectedWo.referenceNumber} · {selectedWo.title}</p>
              </div>
              <button
                onClick={() => setShowUpdateWoModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateWorkOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Status Lifecycle *</label>
                  <select
                    value={formUpdateStatus}
                    onChange={(e) => setFormUpdateStatus(e.target.value as WorkOrderStatus)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="VERIFIED">Verified & Closed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Actual Incurred Cost (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formUpdateActualTaka}
                    onChange={(e) => setFormUpdateActualTaka(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Status Change Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Technician arrived on-site with replacement capacitor"
                  value={formUpdateReason}
                  onChange={(e) => setFormUpdateReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Completion Notes</label>
                <textarea
                  rows={2}
                  placeholder="Technician resolution summary, test results..."
                  value={formUpdateCompletionNotes}
                  onChange={(e) => setFormUpdateCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Member-Visible Update</label>
                <input
                  type="text"
                  placeholder="Status update displayed to resident"
                  value={formUpdateMemberUpdates}
                  onChange={(e) => setFormUpdateMemberUpdates(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowUpdateWoModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold">New Operational Task</h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect Water Purifier Filter"
                  value={formTaskTitle}
                  onChange={(e) => setFormTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Category</label>
                  <select
                    value={formTaskCategory}
                    onChange={(e) => setFormTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="CLEANING">Cleaning & Sanitation</option>
                    <option value="INSPECTION">Inspection & Safety</option>
                    <option value="MAINTENANCE">Equipment Maintenance</option>
                    <option value="UTILITY">Utility & Meters</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Recurrence Schedule</label>
                  <select
                    value={formTaskRecurrence}
                    onChange={(e) => setFormTaskRecurrence(e.target.value as RecurrenceRule)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                  >
                    <option value="NONE">One-time Task</option>
                    <option value="DAILY">Daily Recurring</option>
                    <option value="WEEKLY">Weekly Recurring</option>
                    <option value="MONTHLY">Monthly Recurring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={formTaskDueDate}
                  onChange={(e) => setFormTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Checklist Items (one per line)</label>
                <textarea
                  rows={3}
                  placeholder={"Check water pressure\nReplace sediment filter\nRecord TDS reading"}
                  value={formTaskChecklistText}
                  onChange={(e) => setFormTaskChecklistText(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
