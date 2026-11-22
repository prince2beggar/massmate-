'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  HardDrive,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Archive,
  Edit,
  Tag,
  Shield,
  History,
  X,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  FileCode,
  File,
} from 'lucide-react';
import type {
  MessDocumentDto,
  DocumentDashboardDto,
  DocumentCategoryDto,
} from '@/server/documents/document-service';

interface MessDocumentVaultViewProps {
  tenantSlug: string;
  tenantName: string;
}

export function MessDocumentVaultView({
  tenantSlug,
  tenantName,
}: MessDocumentVaultViewProps) {
  const [dashboard, setDashboard] = useState<DocumentDashboardDto | null>(null);
  const [documents, setDocuments] = useState<MessDocumentDto[]>([]);
  const [categories, setCategories] = useState<DocumentCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileType, setUploadFileType] = useState('pdf');
  const [uploadFileSize, setUploadFileSize] = useState(1024 * 500); // 500 KB default
  const [uploadVisibility, setUploadVisibility] = useState('OWNER_ADMIN');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadTags, setUploadTags] = useState('');

  // Selected Document for Activity / Edit
  const [selectedDoc, setSelectedDoc] = useState<MessDocumentDto | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Action status message
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    let isMounted = true;
    Promise.all([
      fetch(`/api/v1/mess/${tenantSlug}/documents/dashboard`).then((r) => r.json()),
      fetch(`/api/v1/mess/${tenantSlug}/documents/categories`).then((r) => r.json()),
      fetch(`/api/v1/mess/${tenantSlug}/documents`).then((r) => r.json()),
    ])
      .then(([dashRes, catRes, docRes]) => {
        if (!isMounted) return;
        if (dashRes.success && dashRes.data) setDashboard(dashRes.data);
        if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
        if (docRes.success && Array.isArray(docRes.data)) setDocuments(docRes.data);
      })
      .catch((err) => {
        console.error('Failed to load document vault data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadCategoryId || !uploadFileName.trim()) {
      setUploadError('Please fill out the title, category, and select a file.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const payload = {
        title: uploadTitle.trim(),
        categoryId: uploadCategoryId,
        description: uploadDescription.trim() || undefined,
        fileName: uploadFileName.trim(),
        fileType: uploadFileType,
        fileSizeBytes: uploadFileSize,
        visibility: uploadVisibility,
        issueDate: uploadIssueDate || undefined,
        expiryDate: uploadExpiryDate || undefined,
        tags: uploadTags
          ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch(`/api/v1/mess/${tenantSlug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to upload document');
      }

      setBannerMessage({ text: 'Document successfully stored in secure vault.', type: 'success' });
      setShowUploadModal(false);
      resetUploadForm();
      loadData();
    } catch (err: any) {
      setUploadError(err.message || 'Document upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadCategoryId('');
    setUploadDescription('');
    setUploadFileName('');
    setUploadFileType('pdf');
    setUploadFileSize(1024 * 500);
    setUploadVisibility('OWNER_ADMIN');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setUploadTags('');
    setUploadError(null);
  };

  const handleArchive = async (doc: MessDocumentDto) => {
    if (!confirm(`Are you sure you want to archive "${doc.title}"?`)) return;

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Archival failed');

      setBannerMessage({ text: `Document "${doc.title}" archived successfully.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setBannerMessage({ text: err.message || 'Failed to archive document', type: 'error' });
    }
  };

  const handleDelete = async (doc: MessDocumentDto) => {
    if (!confirm(`PERMANENT DELETE: Are you sure you want to permanently delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed');

      setBannerMessage({ text: `Document "${doc.title}" permanently removed.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setBannerMessage({ text: err.message || 'Failed to delete document', type: 'error' });
    }
  };

  const openEditModal = (doc: MessDocumentDto) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditVisibility(doc.visibility);
    setEditExpiryDate(doc.expiryDate ? doc.expiryDate.split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/v1/mess/${tenantSlug}/documents/${selectedDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          visibility: editVisibility,
          expiryDate: editExpiryDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Update failed');

      setBannerMessage({ text: 'Document metadata updated successfully.', type: 'success' });
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    if (categoryFilter !== 'ALL' && doc.categoryId !== categoryFilter) return false;
    if (fileTypeFilter !== 'ALL' && doc.fileType.toLowerCase() !== fileTypeFilter.toLowerCase()) return false;
    if (statusFilter === 'EXPIRING' && doc.expiryStatus !== 'EXPIRING_SOON') return false;
    if (statusFilter === 'EXPIRED' && doc.expiryStatus !== 'EXPIRED') return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchRef = doc.referenceNumber.toLowerCase().includes(q);
      const matchFile = doc.fileName.toLowerCase().includes(q);
      const matchTag = doc.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchRef && !matchFile && !matchTag) return false;
    }
    return true;
  });

  const getFileIcon = (fileType: string) => {
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FileCheck className="w-8 h-8 text-rose-500" />;
    if (['xls', 'xlsx'].includes(t)) return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (['doc', 'docx'].includes(t)) return <FileText className="w-8 h-8 text-blue-500" />;
    if (['jpg', 'jpeg', 'png'].includes(t)) return <Eye className="w-8 h-8 text-purple-500" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Loading secure Document Vault for {tenantName}...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-teal-600" />
            Document Vault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Secure, encrypted document repository for rental contracts, invoices, member IDs, and legal agreements.
          </p>
        </div>
        <button
          onClick={() => {
            resetUploadForm();
            setShowUploadModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Banner */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-900/40 text-teal-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Documents</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {dashboard.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-lg">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Storage Used</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {dashboard.formattedStorageUsed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Added This Month</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {dashboard.addedThisMonthCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending Review</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {dashboard.pendingReviewCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Expiring Soon</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {dashboard.expiringSoonCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & View Toggle Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by title, ref #, file name, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'GRID'
                  ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-2 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'LIST'
                  ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="jpg">JPG Images</option>
            <option value="png">PNG Images</option>
            <option value="docx">Word (DOCX)</option>
            <option value="xlsx">Excel (XLSX)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Expiry States</option>
            <option value="EXPIRING">Expiring Soon (≤30 Days)</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {(categoryFilter !== 'ALL' || fileTypeFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setFileTypeFilter('ALL');
                setStatusFilter('ALL');
                setSearch('');
              }}
              className="px-2 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Document Content List / Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">No documents found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            No vault documents match your current filter criteria or none have been uploaded yet.
          </p>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-gray-400 block">{doc.referenceNumber}</span>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      doc.expiryStatus === 'EXPIRED'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        : doc.expiryStatus === 'EXPIRING_SOON'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}
                  >
                    {doc.expiryStatus === 'EXPIRING_SOON' ? 'Expiring Soon' : doc.expiryStatus}
                  </span>
                </div>

                {doc.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-2.5">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{doc.categoryName || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px] text-gray-600 dark:text-gray-400">
                      {doc.fileName} ({doc.formattedFileSize})
                    </span>
                  </div>
                  {doc.formattedExpiryDate && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className={`font-medium ${doc.expiryStatus === 'EXPIRING_SOON' ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {doc.formattedExpiryDate}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span className="font-mono text-[10px] uppercase bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {doc.visibility}
                    </span>
                  </div>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/40">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/80 pt-3 mt-4">
                <div className="flex items-center gap-1">
                  {doc.signedUrl && (
                    <>
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Secure Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={`${doc.signedUrl}&download=true`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(doc)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Edit Metadata"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoc(doc);
                      setShowHistoryModal(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Activity History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleArchive(doc)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">File / Size</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(doc.fileType)}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{doc.title}</p>
                          <span className="text-[10px] font-mono text-gray-400">{doc.referenceNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {doc.categoryName || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-600 dark:text-gray-400 block">{doc.fileName}</span>
                      <span className="text-[10px] text-gray-400">{doc.formattedFileSize}</span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.formattedExpiryDate ? (
                        <span
                          className={`font-medium ${
                            doc.expiryStatus === 'EXPIRED'
                              ? 'text-rose-600'
                              : doc.expiryStatus === 'EXPIRING_SOON'
                              ? 'text-amber-600 font-semibold'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {doc.formattedExpiryDate}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {doc.visibility}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.signedUrl && (
                          <>
                            <a
                              href={doc.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-teal-600 rounded"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <a
                              href={`${doc.signedUrl}&download=true`}
                              className="p-1.5 text-gray-500 hover:text-blue-600 rounded"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload Vault Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg border border-rose-200 dark:border-rose-800">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Building Tenancy Agreement 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={uploadCategoryId}
                    onChange={(e) => setUploadCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Visibility *
                  </label>
                  <select
                    value={uploadVisibility}
                    onChange={(e) => setUploadVisibility(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="OWNER_ADMIN">Owner & Admin Only</option>
                    <option value="MEMBER_VISIBLE">All Mess Members</option>
                    <option value="SPECIFIC_MEMBER">Specific Member</option>
                  </select>
                </div>
              </div>

              {/* File details */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Select File (PDF, Images, Word, Excel - Max 15MB) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="File name (e.g. lease_contract.pdf)"
                    value={uploadFileName}
                    onChange={(e) => {
                      setUploadFileName(e.target.value);
                      const ext = e.target.value.split('.').pop()?.toLowerCase();
                      if (ext) setUploadFileType(ext);
                    }}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="jpg">JPEG Image (.jpg)</option>
                    <option value="png">PNG Image (.png)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={uploadIssueDate}
                    onChange={(e) => setUploadIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="rental, contract, legal, year2026"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or contract clauses..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {showEditModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-600" />
                Edit Metadata: {selectedDoc.referenceNumber}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="OWNER_ADMIN">Owner & Admin Only</option>
                  <option value="MEMBER_VISIBLE">All Mess Members</option>
                  <option value="SPECIFIC_MEMBER">Specific Member</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1"
                >
                  {editLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Audit Trail: {selectedDoc.title}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="border-l-2 border-teal-500 pl-3 py-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">Document Registered</span>
                  <span className="text-[10px] text-gray-400">{selectedDoc.formattedCreatedAt}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Uploaded by {selectedDoc.uploaderName || 'Admin'} ({selectedDoc.formattedFileSize})
                </p>
              </div>

              <div className="border-l-2 border-blue-500 pl-3 py-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">Signed Token Generated</span>
                  <span className="text-[10px] text-gray-400">Active</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  HMAC-SHA256 time-limited access URL active for preview and download.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
