'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/utils/permissions';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import reviewService from '@/services/review-service';
import { formatDate } from '@/utils/helpers';
import { Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rating}/5</span>
    </div>
  );
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-reviews', page],
    queryFn: () => reviewService.getMyReviews({ page, limit }),
    enabled: !!user,
  });

  const reviews = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute requiredPermissions={[Permission.REVIEWS_READ]}>
      <Layout>
        <div className="container-custom py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              My Reviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Reviews you have submitted for completed jobs
            </p>
          </div>

          {error ? (
            <ErrorState
              title="Failed to load reviews"
              message="We couldn't load your reviews. Please try again."
              retry={() => refetch()}
            />
          ) : isLoading ? (
            <Loading />
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Complete a job and leave a review to share your experience.
                </p>
                <Link href="/dashboard/jobs">
                  <Button variant="primary">View My Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} review{total !== 1 ? 's' : ''} submitted</p>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                      {review.response && (
                        <div className="mt-3 pl-4 border-l-2 border-primary-300 dark:border-primary-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Provider response
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.response}</p>
                        </div>
                      )}
                      <div className="mt-3 flex gap-3">
                        <Link href={`/dashboard/jobs/${review.job_id}`}>
                          <Button variant="outline" size="sm">View Job</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
