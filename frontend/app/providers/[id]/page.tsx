"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { AvailabilitySchedule } from "@/components/features/providers/AvailabilitySchedule";
import { getProviderProfile } from "@/services/user-service";
import { getProviderReviews, getProviderReviewAggregates } from "@/services/review-service";
import { requestService, ServiceCategory } from "@/services/request-service";
import { favoriteService } from "@/services/favorite-service";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, parseRating } from "@/utils/helpers";
import { ArrowLeft, Star, Calendar, Briefcase, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { toast } from "react-hot-toast";

export default function ProviderDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const providerId = params.id as string;
	const [isFavorited, setIsFavorited] = useState(false);
	const [checkingFavorite, setCheckingFavorite] = useState(true);

	const {
		data: provider,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["provider", providerId],
		queryFn: () => getProviderProfile(providerId),
		enabled: !!providerId,
	});

	const providerRating = parseRating(provider?.rating);

	const { data: reviews } = useQuery({
		queryKey: ["provider-reviews", providerId],
		queryFn: () => getProviderReviews(providerId),
		enabled: !!providerId,
	});

	const { data: reviewAggregates } = useQuery({
		queryKey: ["provider-review-aggregates", providerId],
		queryFn: () => getProviderReviewAggregates(providerId),
		enabled: !!providerId,
	});

	const { data: categories } = useQuery({
		queryKey: ["service-categories"],
		queryFn: () => requestService.getCategories(),
	});

	const categoryMap = (categories || []).reduce<Record<string, ServiceCategory>>((acc, cat) => {
		acc[cat.id] = cat;
		return acc;
	}, {});

	// Check if provider is favorited
	useEffect(() => {
		const checkFavorite = async () => {
			if (user?.id && providerId) {
				try {
					const favorited = await favoriteService.isFavorite(providerId);
					setIsFavorited(favorited);
				} catch (error) {
					console.error("Error checking favorite:", error);
				} finally {
					setCheckingFavorite(false);
				}
			} else {
				setCheckingFavorite(false);
			}
		};
		checkFavorite();
	}, [user?.id, providerId]);

	// Toggle favorite mutation
	const toggleFavoriteMutation = useMutation({
		mutationFn: async () => {
			if (!user?.id) {
				throw new Error("Please login to save favorites");
			}
			if (isFavorited) {
				await favoriteService.removeFavorite(providerId);
			} else {
				await favoriteService.addFavorite(providerId);
			}
		},
		onMutate: async () => {
			// Optimistically update UI
			setIsFavorited(!isFavorited);
		},
		onSuccess: () => {
			toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
			// Invalidate favorites query if on favorites page
			queryClient.invalidateQueries({ queryKey: ["favorites"] });
		},
		onError: (error: any) => {
			// Revert optimistic update on error
			setIsFavorited(!isFavorited);
			toast.error(error.message || "Failed to update favorite");
		},
	});

	const handleToggleFavorite = () => {
		if (!user) {
			toast.error("Please login to save favorites");
			router.push(ROUTES.LOGIN);
			return;
		}
		toggleFavoriteMutation.mutate();
	};

	if (isLoading) {
		return (
			<Layout>
				<div className='container-custom py-8'>
					<Loading />
				</div>
			</Layout>
		);
	}

	if (error || !provider) {
		return (
			<Layout>
				<div className='container-custom py-8'>
					<ErrorState
						title='Provider not found'
						message="We couldn't find the provider you're looking for."
						retry={() => refetch()}
					/>
				</div>
			</Layout>
		);
	}

	const serviceCount = provider.services?.length || 0;

	return (
		<Layout>
			<div className='container-custom py-8'>
				{/* Back Button */}
				<div className='mb-6'>
					<Button
						variant='ghost'
						onClick={() => router.back()}>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Providers
					</Button>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Main Info */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Profile Card */}
						<Card>
							<CardHeader>
								<div className='flex items-start gap-4'>
									<Avatar
										name={provider.business_name}
										size='xl'
									/>
									<div className='flex-1'>
										<h1 className='text-3xl font-bold text-gray-900 mb-2'>{provider.business_name}</h1>
										{providerRating !== undefined && (
											<div className='flex items-center gap-2 mb-3'>
												<div className='flex items-center gap-1'>
													<Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
													<span className='text-lg font-semibold text-gray-900'>{providerRating.toFixed(1)}</span>
												</div>
												<span className='text-gray-500'>Rating</span>
											</div>
										)}
										<div className='flex flex-wrap gap-2'>
											<Badge variant='primary'>
												<Briefcase className='h-3 w-3 mr-1' />
												{serviceCount} {serviceCount === 1 ? "Service" : "Services"}
											</Badge>
											<Badge variant='secondary'>
												<Calendar className='h-3 w-3 mr-1' />
												Joined {formatDate(provider.created_at)}
											</Badge>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div>
									<h3 className='text-lg font-semibold text-gray-900 mb-2'>About</h3>
									<p className='text-gray-600 leading-relaxed'>{provider.description || "No description provided."}</p>
								</div>
							</CardContent>
						</Card>

						{/* Services */}
						{serviceCount > 0 && (
							<Card>
								<CardHeader>
									<h3 className='text-lg font-semibold'>Services Offered</h3>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
										{provider.services?.map((service) => {
											const category = categoryMap[service.category_id];
											return (
												<div
													key={service.id}
													className='p-4 border border-gray-200 rounded-lg'>
													<p className='font-medium text-gray-900'>{category?.name || "Service"}</p>
													{category?.description && (
														<p className='text-sm text-gray-500 mt-1'>{category.description}</p>
													)}
												</div>
											);
										})}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Reviews Section */}
						<Card>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold flex items-center gap-2'>
										<MessageSquare className='h-5 w-5' />
										Reviews
										{reviewAggregates && (
											<span className='text-sm font-normal text-gray-500'>({reviewAggregates.total_reviews})</span>
										)}
									</h3>
									{reviewAggregates && reviewAggregates.total_reviews > 0 && (
										<div className='flex items-center gap-1'>
											<Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
											<span className='font-semibold'>{reviewAggregates.average_rating.toFixed(1)}</span>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{/* Star Distribution */}
								{reviewAggregates && reviewAggregates.total_reviews > 0 && (
									<div className='mb-6 space-y-2'>
										{[
											{ stars: 5, count: reviewAggregates.five_star_count },
											{ stars: 4, count: reviewAggregates.four_star_count },
											{ stars: 3, count: reviewAggregates.three_star_count },
											{ stars: 2, count: reviewAggregates.two_star_count },
											{ stars: 1, count: reviewAggregates.one_star_count },
										].map(({ stars, count }) => {
											const pct =
												reviewAggregates.total_reviews > 0 ?
													Math.round((count / reviewAggregates.total_reviews) * 100)
												:	0;
											return (
												<div
													key={stars}
													className='flex items-center gap-2 text-sm'>
													<span className='w-8 text-right text-gray-600'>{stars}★</span>
													<div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
														<div
															className='h-full bg-yellow-400 rounded-full'
															style={{ width: `${pct}%` }}
														/>
													</div>
													<span className='w-8 text-gray-500'>{count}</span>
												</div>
											);
										})}
									</div>
								)}

								{/* Individual Reviews */}
								{reviews && reviews.length > 0 ?
									<div className='space-y-4'>
										{reviews.map((review) => (
											<div
												key={review.id}
												className='border-t border-gray-100 pt-4 first:border-0 first:pt-0'>
												<div className='flex items-center justify-between mb-1'>
													<span className='font-medium text-gray-900'>{review.customer_name || "Anonymous"}</span>
													<span className='text-xs text-gray-400'>{formatDate(review.created_at)}</span>
												</div>
												<div className='flex items-center gap-0.5 mb-2'>
													{Array.from({ length: 5 }).map((_, i) => (
														<Star
															key={i}
															className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
														/>
													))}
												</div>
												<p className='text-sm text-gray-600'>{review.comment}</p>
												{review.response && (
													<div className='mt-2 pl-4 border-l-2 border-primary-200'>
														<p className='text-xs font-medium text-primary-700'>Provider Response</p>
														<p className='text-sm text-gray-600'>{review.response}</p>
													</div>
												)}
											</div>
										))}
									</div>
								:	<p className='text-gray-500 text-sm'>No reviews yet.</p>}
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Availability */}
						<AvailabilitySchedule availability={provider.availability || []} />

						{/* Contact Card */}
						<Card>
							<CardHeader>
								<h3 className='text-lg font-semibold'>Get in Touch</h3>
							</CardHeader>
							<CardContent>
								<div className='space-y-3'>
									<Link href={ROUTES.CREATE_REQUEST}>
										<Button className='w-full'>Request Service</Button>
									</Link>
									<Button
										variant='outline'
										className='w-full'
										onClick={() => router.push(ROUTES.DASHBOARD_MESSAGES)}>
										Send Message
									</Button>
									<Button
										variant={isFavorited ? "primary" : "outline"}
										className='w-full flex items-center justify-center gap-2'
										onClick={handleToggleFavorite}
										disabled={toggleFavoriteMutation.isPending || checkingFavorite}>
										<Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
										{checkingFavorite ?
											"Loading..."
										: isFavorited ?
											"Remove from Favorites"
										:	"Save to Favorites"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</Layout>
	);
}
