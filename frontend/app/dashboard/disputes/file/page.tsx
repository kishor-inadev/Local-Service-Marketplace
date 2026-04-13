'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Permission } from '@/utils/permissions';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { disputeService } from '@/services/dispute-service';
import { jobService } from '@/services/job-service';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const DISPUTE_REASONS = [
  'Work not completed as agreed',
  'Work quality not acceptable',
  'Provider did not show up',
  'Overcharged / billing dispute',
  'Damage caused during service',
  'Communication issues',
  'Safety concern',
  'Other',
];

const schema = z.object({
  job_id: z.string().min(1, 'Job is required'),
  reason: z.string().min(1, 'Please select a reason'),
  description: z.string().min(20, 'Please provide at least 20 characters of detail'),
});

type FormData = z.infer<typeof schema>;

function FileDisputeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const prefillJobId = searchParams.get('jobId') || '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { job_id: prefillJobId, reason: '', description: '' },
  });

  // Load user's completable jobs for selection
  const { data: jobs } = useQuery({
    queryKey: ['my-jobs-for-dispute', user?.id],
    queryFn: () => jobService.getMyJobs(),
    enabled: !!user && !prefillJobId,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => disputeService.createDispute(data),
    onSuccess: () => {
      toast.success('Dispute filed successfully. Our team will review it within 24 hours.');
      router.push('/dashboard/disputes');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to file dispute');
    },
  });

  return (
    <Layout>
      <div className="container-custom py-12 max-w-2xl">
        <Link href="/dashboard/disputes" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to My Disputes
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File a Dispute</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Our team will review your dispute and respond within 24â€“48 hours. Please provide as much detail as possible.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              {/* Job selection (if not pre-filled) */}
              {!prefillJobId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job *
                  </label>
                  <select
                    {...register('job_id')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                    <option value="">Select a job...</option>
                    {(jobs ?? []).map((job: any) => (
                      <option key={job.id} value={job.id}>
                        Job #{job.display_id || job.id.substring(0, 8)} â€” {job.status}
                      </option>
                    ))}
                  </select>
                  {errors.job_id && <p className="text-sm text-red-600 mt-1">{errors.job_id.message}</p>}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason *
                </label>
                <select
                  {...register('reason')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                  <option value="">Select a reason...</option>
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  placeholder="Describe the issue in detail. Include dates, what was agreed, and what actually happened..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> Filing a dispute pauses any pending payments for this job until the dispute is resolved. Please ensure you have tried to resolve the issue directly with the provider first.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="primary" isLoading={mutation.isPending} className="flex-1">
                  Submit Dispute
                </Button>
                <Link href="/dashboard/disputes">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function FileDisputePage() {
  return (
    <ProtectedRoute requiredPermissions={[Permission.DISPUTES_FILE]}>
      <Suspense fallback={<div className="container-custom py-12"><div className="animate-pulse h-96 bg-gray-100 rounded-xl" /></div>}>
        <FileDisputeContent />
      </Suspense>
    </ProtectedRoute>
  );
}
