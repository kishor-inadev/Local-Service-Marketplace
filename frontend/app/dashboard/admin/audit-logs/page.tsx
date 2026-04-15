'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Permission } from '@/utils/permissions';
import { adminService, AuditLog } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';
import { Scroll, Search, User, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';

const ENTITY_COLORS: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  provider: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  job: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  request: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  payment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  dispute: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  review: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  setting: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function entityColor(entity: string) {
  const key = Object.keys(ENTITY_COLORS).find((k) => entity.toLowerCase().includes(k));
  return key ? ENTITY_COLORS[key] : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

const ACTION_VERBS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  suspend: 'suspended',
  unsuspend: 'unsuspended',
  verify: 'verified',
  reject: 'rejected',
  approve: 'approved',
  resolve: 'resolved',
};

function prettifyAction(action: string) {
  const lower = action.toLowerCase();
  const verb = Object.keys(ACTION_VERBS).find((v) => lower.includes(v));
  return verb ? action.replace(new RegExp(verb, 'i'), ACTION_VERBS[verb]) : action;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const limit = 25;

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, userId, actionFilter],
    queryFn: () => adminService.getAuditLogs({
      user_id: userId || undefined,
      action: actionFilter || undefined,
      limit,
      cursor: undefined,
    }),
    staleTime: 30_000,
  });

  // getAuditLogs returns AuditLog[] directly
  const logs: AuditLog[] = Array.isArray(rawData) ? rawData : (rawData as any)?.data ?? [];
  const total: number = Array.isArray(rawData) ? rawData.length : (rawData as any)?.total ?? logs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = search
    ? logs.filter((l) =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_id.toLowerCase().includes(search.toLowerCase()) ||
        (l.user_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <ProtectedRoute requiredPermissions={[Permission.AUDIT_VIEW]}>
      <Layout>
        <div className="container-custom py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Scroll className="h-7 w-7 text-primary-600" />
                Audit Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Track all administrative and system actions</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-full sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search action, entity, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Filter by User ID..."
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm w-full sm:w-56"
                />
                <input
                  type="text"
                  placeholder="Filter by action..."
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm w-full sm:w-44"
                />
                {(userId || actionFilter || search) && (
                  <Button variant="outline" size="sm" onClick={() => { setUserId(''); setActionFilter(''); setSearch(''); setPage(1); }}>
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {error ? (
            <ErrorState title="Failed to load audit logs" message="Could not load audit logs. Please try again." retry={() => refetch()} />
          ) : isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Scroll className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No audit log entries found.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                {/* Table header */}
                <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <span>Timestamp</span>
                  <span>User</span>
                  <span>Action</span>
                  <span>Entity</span>
                  <span>Entity ID</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-sm">
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 truncate">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-xs truncate">{log.user_id ? log.user_id.slice(0, 12) + '…' : '—'}</span>
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">
                        {prettifyAction(log.action)}
                      </span>
                      <span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${entityColor(log.entity)}`}>
                          {log.entity}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate" title={log.entity_id}>
                        {log.entity_id.slice(0, 12)}…
                      </span>
                    </div>
                  ))}
                </div>
                </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
