'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Loading } from '@/components/ui/Loading';
import { createReview } from '@/services/review-service';
import { analytics } from '@/utils/analytics';
import toast from 'react-hot-toast';
import { ArrowLeft, Star } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared";

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

function SubmitReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const jobId = searchParams.get('jobId');
  const providerId = searchParams.get('providerId');
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  useEffect(() => {
    analytics.pageview({
      path: '/reviews/submit',
      title: 'Submit Review',
    });

    if (!jobId || !providerId) {
      toast.error('Missing job or provider information');
      router.push(ROUTES.JOBS);
    }
  }, [jobId, providerId, router]);

  const submitMutation = useMutation({
		mutationFn: (data: ReviewFormData) =>
			createReview({
				job_id: jobId!,
				user_id: user?.id ?? "",
				provider_id: providerId!,
				rating: data.rating,
				comment: data.comment,
			}),
		onSuccess: () => {
			toast.success("Review submitted successfully!");
			analytics.event({ action: "review_submitted", category: "engagement", label: "Job Review", value: rating });
			router.push(`/jobs/${jobId}`);
		},
		onError: (error: any) => {
			const errorMessage = error.response?.data?.message || "Failed to submit review";
			toast.error(errorMessage);
			analytics.trackError(errorMessage, "ReviewSubmit");
		},
	});

  const handleRatingClick = (value: number) => {
    setRating(value);
    setValue('rating', value);
  };

  const onSubmit = (data: ReviewFormData) => {
    submitMutation.mutate(data);
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!jobId || !providerId) {
    return null;
  }

  return (
		<ProtectedRoute requiredRoles={["customer"]}>
			<Layout>
				<div className='container-custom py-8'>
					<div className='max-w-2xl mx-auto'>
						{/* Back Button */}
						<div className='mb-6'>
							<Button
								variant='ghost'
								onClick={() => router.back()}>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Back
							</Button>
						</div>

						<h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8'>Submit Review</h1>

						<Card>
							<CardHeader>
								<h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>Rate Your Experience</h2>
								<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>Help others by sharing your feedback</p>
							</CardHeader>
							<CardContent>
								<form
									onSubmit={handleSubmit(onSubmit)}
									className='space-y-6'>
									{/* Star Rating */}
									<div>
										<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>Rating *</label>
										<div className='flex items-center gap-2'>
											{[1, 2, 3, 4, 5].map((value) => (
												<button
													key={value}
													type='button'
													onClick={() => handleRatingClick(value)}
													onMouseEnter={() => setHoverRating(value)}
													onMouseLeave={() => setHoverRating(0)}
													className='focus:outline-none focus:ring-2 focus:ring-primary-500 rounded'
													aria-label={`Rate ${value} stars`}>
													<Star
														className={`h-10 w-10 transition-colors ${
															value <= (hoverRating || rating) ?
																"fill-yellow-400 text-yellow-400"
															:	"text-gray-300 dark:text-gray-600"
														}`}
													/>
												</button>
											))}
										</div>
										{errors.rating && <p className='mt-2 text-sm text-red-600'>{errors.rating.message}</p>}
									</div>

									{/* Comment */}
									<div>
										<Textarea
											label='Your Review *'
											{...register("comment")}
											rows={6}
											placeholder='Share your experience with this provider. What did you like? What could be improved?'
										/>
										{errors.comment && <p className='mt-1 text-sm text-red-600'>{errors.comment.message}</p>}
										<p className='mt-1 text-sm text-gray-500'>Minimum 10 characters</p>
									</div>

									{/* Guidelines */}
									<div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
										<h3 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>Review Guidelines:</h3>
										<ul className='text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside'>
											<li>Be honest and specific about your experience</li>
											<li>Focus on the provider's professionalism and service quality</li>
											<li>Avoid personal attacks or inappropriate language</li>
											<li>Reviews cannot be edited once submitted</li>
										</ul>
									</div>

									{/* Submit */}
									<div className='flex gap-4 pt-4'>
										<Button
											type='submit'
											isLoading={submitMutation.isPending}
											disabled={submitMutation.isPending || rating === 0}>
											Submit Review
										</Button>
										<Button
											type='button'
											variant='outline'
											onClick={() => router.back()}>
											Cancel
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}

export default function SubmitReviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SubmitReviewContent />
    </Suspense>
  );
}
