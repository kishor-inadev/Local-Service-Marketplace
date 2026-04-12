'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { isNotificationsEnabled } from '@/config/features';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';

import { ErrorState } from "@/components/ui/ErrorState";
import { notificationService } from '@/services/notification-service';
import { useNotificationStore } from '@/store/notificationStore';
import { formatRelativeTime } from '@/utils/helpers';
import { Check, Bell } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated or notifications are disabled
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    } else if (!authLoading && isAuthenticated && !isNotificationsEnabled()) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, router]);

  const {
		data: notifications,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["notifications"],
		queryFn: () => notificationService.getNotifications({ limit: 50 }),
		enabled: isNotificationsEnabled() && isAuthenticated,
	});

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const unread = notifications?.filter((n) => !n.read).length || 0;
      setUnreadCount(Math.max(0, unread - 1));
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  });

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
		<ProtectedRoute>
			<Layout>
				<div className='container-custom py-8'>
					{error ?
						<ErrorState
							title='Failed to load notifications'
							message="We couldn't load your notifications. Please try again."
							retry={() => refetch()}
						/>
					:	<>
							<div className='flex items-center justify-between mb-8'>
								<div>
									<h1 className='text-3xl font-bold text-gray-900'>Notifications</h1>
									<p className='mt-2 text-gray-600'>Stay updated with your latest activities</p>
								</div>
								{notifications && notifications.some((n) => !n.read) && (
									<Button
										variant='outline'
										size='sm'
										onClick={() => markAllAsReadMutation.mutate()}
										isLoading={markAllAsReadMutation.isPending}>
										<Check className='h-4 w-4 mr-2' />
										Mark All as Read
									</Button>
								)}
							</div>

							{isLoading ?
								<Loading />
							: notifications && notifications.length > 0 ?
								<Card>
									<CardContent>
										<div className='divide-y'>
											{notifications.map((notification) => (
												<div
													key={notification.id}
													className={`py-4 ${notification.read ? "opacity-60" : "bg-blue-50"}`}>
													<div className='flex items-start gap-4'>
														<div className='flex-shrink-0'>
															<div
																className={`w-10 h-10 rounded-full flex items-center justify-center ${
																	notification.read ? "bg-gray-200" : "bg-primary-100"
																}`}>
																<Bell className='h-5 w-5 text-primary-600' />
															</div>
														</div>
														<div className='flex-1 min-w-0'>
															<p className='text-sm text-gray-900'>{notification.message}</p>
															<p className='text-xs text-gray-500 mt-2'>
																{formatRelativeTime(notification.created_at)}
															</p>
														</div>
														{!notification.read && (
															<Button
																variant='outline'
																size='sm'
																onClick={() => markAsReadMutation.mutate(notification.id)}>
																Mark as Read
															</Button>
														)}
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							:	<Card>
									<CardContent>
										<div className='text-center py-12'>
											<Bell className='h-12 w-12 text-gray-400 mx-auto mb-4' />
											<p className='text-gray-500'>No notifications</p>
										</div>
									</CardContent>
								</Card>
							}
						</>
					}
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
