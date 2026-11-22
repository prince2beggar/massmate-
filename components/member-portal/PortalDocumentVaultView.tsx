'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Tag,
  Shield,
  Loader2,
  FileCheck,
  FileSpreadsheet,
  File,
  Lock,
} from 'lucide-react';
import type { MessDocumentDto } from '@/server/documents/document-service';

interface PortalDocumentVaultViewProps {
  tenantSlug: string;
  tenantName: string;
}

export function PortalDocumentVaultView({
  tenantSlug,
  tenantName,
}: PortalDocumentVaultViewProps) {
  const [documents, setDocuments] = useState<MessDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/portal/${tenantSlug}/documents`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && Array.isArray(json.data)) {
          setDocuments(json.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load member documents:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug]);

  const categories = Array.from(new Set(documents.map((d) => d.categoryName || 'General')));

  const filteredDocs = documents.filter((doc) => {
    if (categoryFilter !== 'ALL' && (doc.categoryName || 'General') !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchFile = doc.fileName.toLowerCase().includes(q);
      const matchTag = doc.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchFile && !matchTag) return false;
    }
    return true;
  });

  const getFileIcon = (fileType: string) => {
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FileCheck className="w-7 h-7 text-rose-500" />;
    if (['xls', 'xlsx'].includes(t)) return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
    if (['doc', 'docx'].includes(t)) return <FileText className="w-7 h-7 text-blue-500" />;
    return <File className="w-7 h-7 text-purple-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading your permitted mess documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" />
          My Documents & Agreements
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Access your tenancy agreement, rent vouchers, official mess bylaws, and verified certificates.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by title, file name, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <Lock className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No documents available</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            There are currently no agreements or public documents shared with your resident account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block">{doc.referenceNumber}</span>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                    </div>
                  </div>
                </div>

                {doc.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-2">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{doc.categoryName || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-mono text-[11px] truncate max-w-[150px]">
                      {doc.fileName} ({doc.formattedFileSize})
                    </span>
                  </div>
                  {doc.formattedExpiryDate && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{doc.formattedExpiryDate}</span>
                    </div>
                  )}
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
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-4">
                <span className="text-[10px] text-gray-400">
                  Updated {doc.formattedCreatedAt.split(' ')[0]}
                </span>
                <div className="flex items-center gap-1.5">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
