'use client';

import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Loading } from '@/components/ui/Loading';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Shield, Monitor } from "lucide-react";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from "react-hot-toast";
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { formatDistanceToNow } from "date-fns";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function formatUserAgent(ua?: string): string {
	if (!ua) return "Unknown device";
	if (ua.includes("Chrome")) return "Chrome Browser";
	if (ua.includes("Firefox")) return "Firefox Browser";
	if (ua.includes("Safari")) return "Safari Browser";
	if (ua.includes("Edge")) return "Edge Browser";
	return ua.slice(0, 60);
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFAFlow, setTwoFAFlow] = useState<null | "enabling" | "disabling">(null);
	const [twoFACode, setTwoFACode] = useState("");
	const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword');

  const { data: twoFAStatus, isLoading: twoFALoading } = useQuery({
		queryKey: ["2fa-status"],
		queryFn: () => authService.get2FAStatus(),
		enabled: isAuthenticated,
	});

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
		queryKey: ["sessions"],
		queryFn: () => authService.getSessions(),
		enabled: isAuthenticated,
	});

  const setup2FAMutation = useMutation({
		mutationFn: () => authService.setup2FA(),
		onError: () => toast.error("Failed to initiate 2FA setup"),
	});

  const enable2FAMutation = useMutation({
		mutationFn: (token: string) => authService.enable2FA(token),
		onSuccess: () => {
			toast.success("Two-factor authentication enabled");
			setTwoFAFlow(null);
			setTwoFACode("");
			queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
		},
		onError: () => toast.error("Invalid verification code. Please try again."),
	});

	const disable2FAMutation = useMutation({
		mutationFn: (token: string) => authService.disable2FA(token),
		onSuccess: () => {
			toast.success("Two-factor authentication disabled");
			setTwoFAFlow(null);
			setTwoFACode("");
			queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
		},
		onError: () => toast.error("Invalid verification code. Please try again."),
	});

  const revokeSessionMutation = useMutation({
		mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
		onSuccess: () => {
			toast.success("Session revoked");
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		},
		onError: () => toast.error("Failed to revoke session"),
	});

	const revokeAllMutation = useMutation({
		mutationFn: () => authService.revokeAllSessions(),
		onSuccess: () => {
			toast.success("All other sessions revoked");
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		},
		onError: () => toast.error("Failed to revoke sessions"),
	});

	const onSubmit = async (data: ChangePasswordFormData) => {
		setIsSubmitting(true);
		try {
			await authService.changePassword(data.currentPassword, data.newPassword);
			toast.success("Password changed successfully");
			reset();
		} catch (error: any) {
			if (error.response?.status === 401) {
				toast.error("Current password is incorrect");
			} else {
				toast.error(error.response?.data?.message || "Failed to change password");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
		<SettingsLayout>
			<div>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-6'>
					{/* Current Password */}
					<div>
						<label
							htmlFor='currentPassword'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
							Current Password
						</label>
						<div className='relative'>
							<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
							<Input
								id='currentPassword'
								type={showCurrentPassword ? "text" : "password"}
								{...register("currentPassword")}
								error={errors.currentPassword?.message}
								placeholder='Enter current password'
								className='pl-10 pr-10'
								autoComplete='current-password'
							/>
							<button
								type='button'
								onClick={() => setShowCurrentPassword(!showCurrentPassword)}
								className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
								{showCurrentPassword ?
									<EyeOff className='w-5 h-5' />
								:	<Eye className='w-5 h-5' />}
							</button>
						</div>
					</div>

					{/* New Password */}
					<div>
						<label
							htmlFor='newPassword'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
							New Password
						</label>
						<div className='relative'>
							<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
							<Input
								id='newPassword'
								type={showNewPassword ? "text" : "password"}
								{...register("newPassword")}
								error={errors.newPassword?.message}
								placeholder='Enter new password'
								className='pl-10 pr-10'
								autoComplete='new-password'
							/>
							<button
								type='button'
								onClick={() => setShowNewPassword(!showNewPassword)}
								className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
								{showNewPassword ?
									<EyeOff className='w-5 h-5' />
								:	<Eye className='w-5 h-5' />}
							</button>
						</div>
						{newPassword && (
							<div className='mt-3 space-y-1'>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Password must contain:</p>
								<ul className='text-xs space-y-1'>
									<li className={newPassword.length >= 8 ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
										✓ At least 8 characters
									</li>
									<li className={/[A-Z]/.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
										✓ One uppercase letter
									</li>
									<li className={/[a-z]/.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
										✓ One lowercase letter
									</li>
									<li className={/[0-9]/.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
										✓ One number
									</li>
								</ul>
							</div>
						)}
					</div>

					{/* Confirm New Password */}
					<div>
						<label
							htmlFor='confirmPassword'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
							Confirm New Password
						</label>
						<div className='relative'>
							<Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
							<Input
								id='confirmPassword'
								type={showConfirmPassword ? "text" : "password"}
								{...register("confirmPassword")}
								error={errors.confirmPassword?.message}
								placeholder='Confirm new password'
								className='pl-10 pr-10'
								autoComplete='new-password'
							/>
							<button
								type='button'
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
								{showConfirmPassword ?
									<EyeOff className='w-5 h-5' />
								:	<Eye className='w-5 h-5' />}
							</button>
						</div>
					</div>

					{/* Actions */}
					<div className='flex gap-4 pt-4'>
						<Button
							type='submit'
							disabled={isSubmitting}
							className='flex-1'>
							{isSubmitting ? "Changing Password..." : "Change Password"}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={() => router.back()}
							disabled={isSubmitting}>
							Cancel
						</Button>
					</div>

					{/* Two-Factor Authentication */}
					<div className='mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
						<div className='flex items-center gap-2 mb-1'>
							<Shield className='w-5 h-5 text-primary-600 dark:text-primary-400' />
							<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Two-Factor Authentication</h2>
							{!twoFALoading && (
								<span
									className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
										twoFAStatus?.enabled ?
											"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										:	"bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
									}`}>
									{twoFAStatus?.enabled ? "Enabled" : "Disabled"}
								</span>
							)}
						</div>
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-4 mt-1'>
							Protect your account with a time-based one-time password (TOTP) authenticator app.
						</p>
						{twoFAFlow === null && (
							<Button
								variant='outline'
								size='sm'
								disabled={twoFALoading || setup2FAMutation.isPending}
								onClick={async () => {
									if (twoFAStatus?.enabled) {
										setTwoFAFlow("disabling");
									} else {
										try {
											await setup2FAMutation.mutateAsync();
											setTwoFAFlow("enabling");
										} catch {
											// handled by onError
										}
									}
								}}>
								{twoFALoading ?
									"Loading..."
								: setup2FAMutation.isPending ?
									"Setting up..."
								: twoFAStatus?.enabled ?
									"Disable 2FA"
								:	"Enable 2FA"}
							</Button>
						)}
						{twoFAFlow === "enabling" && setup2FAMutation.data && (
							<div className='space-y-4 mt-2'>
								<p className='text-sm text-gray-700 dark:text-gray-300'>
									Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
								</p>
								<div className='flex justify-center'>
									<img
										src={setup2FAMutation.data.qr_code_url}
										alt='2FA QR Code'
										className='w-48 h-48 border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-2'
									/>
								</div>
								<div className='bg-gray-100 dark:bg-gray-700 rounded-lg p-3'>
									<p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>Or enter this key manually:</p>
									<code className='text-sm font-mono text-gray-800 dark:text-gray-200 break-all select-all'>
										{setup2FAMutation.data.secret}
									</code>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
										Enter the 6-digit code from your app to confirm:
									</label>
									<input
										type='text'
										inputMode='numeric'
										maxLength={6}
										value={twoFACode}
										onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
										placeholder='000000'
										className='w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-lg tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
									/>
								</div>
								<div className='flex gap-3'>
									<Button
										size='sm'
										disabled={twoFACode.length !== 6 || enable2FAMutation.isPending}
										onClick={() => enable2FAMutation.mutate(twoFACode)}>
										{enable2FAMutation.isPending ? "Verifying..." : "Verify & Enable"}
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => {
											setTwoFAFlow(null);
											setTwoFACode("");
										}}>
										Cancel
									</Button>
								</div>
							</div>
						)}
						{twoFAFlow === "disabling" && (
							<div className='space-y-4 mt-2'>
								<p className='text-sm text-gray-700 dark:text-gray-300'>
									Enter the 6-digit code from your authenticator app to disable 2FA:
								</p>
								<input
									type='text'
									inputMode='numeric'
									maxLength={6}
									value={twoFACode}
									onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
									placeholder='000000'
									className='w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-lg tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
								/>
								<div className='flex gap-3'>
									<Button
										size='sm'
										variant='outline'
										disabled={twoFACode.length !== 6 || disable2FAMutation.isPending}
										onClick={() => disable2FAMutation.mutate(twoFACode)}>
										{disable2FAMutation.isPending ? "Disabling..." : "Confirm Disable"}
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => {
											setTwoFAFlow(null);
											setTwoFACode("");
										}}>
										Cancel
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Active Sessions */}
					<div className='mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
						<div className='flex items-center justify-between mb-1'>
							<div className='flex items-center gap-2'>
								<Monitor className='w-5 h-5 text-primary-600 dark:text-primary-400' />
								<h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Active Sessions</h2>
							</div>
							{sessions && sessions.filter((s) => !s.is_current).length > 0 && (
								<Button
									variant='outline'
									size='sm'
									disabled={revokeAllMutation.isPending}
									onClick={() => revokeAllMutation.mutate()}>
									{revokeAllMutation.isPending ? "Revoking..." : "Revoke All Others"}
								</Button>
							)}
						</div>
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-4 mt-1'>
							Manage devices and browsers where you&apos;re currently logged in.
						</p>
						{sessionsLoading ?
							<div className='space-y-3'>
								{[1, 2].map((i) => (
									<div
										key={i}
										className='h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'
									/>
								))}
							</div>
						: sessions && sessions.length > 0 ?
							<div className='space-y-2'>
								{sessions.map((session) => (
									<div
										key={session.id}
										className='flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'>
										<div className='flex items-center gap-3 min-w-0'>
											<Monitor className='w-4 h-4 text-gray-400 shrink-0' />
											<div className='min-w-0'>
												<div className='flex items-center gap-2 flex-wrap'>
													<p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
														{formatUserAgent(session.user_agent)}
													</p>
													{session.is_current && (
														<span className='shrink-0 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded font-medium'>
															This device
														</span>
													)}
												</div>
												<p className='text-xs text-gray-500 dark:text-gray-400'>
													{session.ip_address ? `${session.ip_address} · ` : ""}
													{session.last_active_at ?
														`Active ${formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}`
													:	`Started ${formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}`}
												</p>
											</div>
										</div>
										{!session.is_current && (
											<Button
												variant='outline'
												size='sm'
												className='ml-3 shrink-0'
												disabled={revokeSessionMutation.isPending}
												onClick={() => revokeSessionMutation.mutate(session.id)}>
												Revoke
											</Button>
										)}
									</div>
								))}
							</div>
						:	<p className='text-sm text-gray-500 dark:text-gray-400 text-center py-4'>No active sessions found.</p>}
					</div>

					{/* Forgot Password Link */}
					<div className='mt-6 text-center'>
						<Link
							href={ROUTES.FORGOT_PASSWORD}
							className='text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'>
							Forgot your password?
						</Link>
					</div>
				</form>
			</div>
		</SettingsLayout>
	);
}
