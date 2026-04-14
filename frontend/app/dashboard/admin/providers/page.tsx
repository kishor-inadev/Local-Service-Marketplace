'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';
import { ShieldCheck, ShieldX, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Permission } from '@/utils/permissions';

function ProviderVerificationCard({ provider, onAction }: { provider: any; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['provider-docs', provider.id],
    queryFn: () => adminService.getProviderDocuments(provider.id),
    enabled: expanded,
  });

  const verifyMutation = useMutation({
    mutationFn: () => adminService.verifyProvider(provider.id),
    onSuccess: () => { toast.success(`${provider.business_name} verified`); onAction(); },
    onError: () => toast.error('Failed to verify provider'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminService.rejectProvider(provider.id, rejectReason),
    onSuccess: () => { toast.success('Provider rejected'); setShowRejectInput(false); onAction(); },
    onError: () => toast.error('Failed to reject provider'),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {provider.business_name || 'Unnamed Business'}
              </h3>
              <StatusBadge status={provider.verification_status ?? 'pending'} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Provider ID: {provider.display_id || provider.id.substring(0, 8)} &middot; Joined {formatDate(provider.created_at)}
            </p>
            {provider.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{provider.description}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Submitted Documents
            </h4>
            {docsLoading ? (
              <p className="text-sm text-gray-500">Loading documents...</p>
            ) : !documents?.length ? (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            ) : (
              <div className="space-y-2 mb-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.document_name}</p>
                      <p className="text-xs text-gray-500">{doc.document_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.verified ? 'verified' : doc.rejected ? 'rejected' : 'pending'} />
                      {doc.document_url && (
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> View
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {provider.verification_status === 'pending' && (
          <div className="mt-4 flex flex-col gap-3">
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Rejection reason (required)..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={rejectMutation.isPending}
                    disabled={!rejectReason.trim()}
                    onClick={() => rejectMutation.mutate()}>
                    Confirm Rejection
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate()}
                  className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50">
                  <ShieldX className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderVerificationPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-providers', statusFilter, page],
    queryFn: () => adminService.getProviders({ page, limit, status: statusFilter }),
    refetchOnWindowFocus: false,
  });

  const providers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute requiredPermissions={[Permission.PROVIDERS_MANAGE]}>
      <Layout>
        <div className="container-custom py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Provider Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review provider applications, verify identities, and approve service listings
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {['pending', 'verified', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                      statusFilter === s
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {error ? (
            <ErrorState title="Failed to load providers" message="Please try again." retry={() => refetch()} />
          ) : isLoading ? (
            <Loading />
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No {statusFilter} providers
                </h3>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{total} provider{total !== 1 ? 's' : ''}</p>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <ProviderVerificationCard
                    key={provider.id}
                    provider={provider}
                    onAction={refetch}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
