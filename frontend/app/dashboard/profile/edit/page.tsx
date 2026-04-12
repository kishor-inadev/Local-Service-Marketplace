'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Loading } from '@/components/ui/Loading';
import { getUserProfile, updateUserProfile, uploadUserProfilePicture } from '@/services/user-service';
import { analytics } from '@/utils/analytics';
import toast from 'react-hot-toast';
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowLeft, Save } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profileImage, setProfileImage] = useState<File[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, router]);

  const {
		data: profile,
		isLoading,
		error,
		refetch,
	} = useQuery({ queryKey: ["user-profile"], queryFn: getUserProfile, enabled: isAuthenticated });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
    values: {
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      await updateUserProfile(data);
      if (profileImage.length > 0) {
        await uploadUserProfilePicture(profileImage[0]);
      }
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      analytics.event({
        action: 'profile_updated',
        category: 'engagement',
        label: 'Profile Edit',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      analytics.trackError(errorMessage, 'ProfileEdit');
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (error) {
		return (
			<Layout>
				<div className='container-custom py-8'>
					<ErrorState
						title='Failed to load profile'
						message="We couldn't load your profile data. Please try again."
						retry={() => refetch()}
					/>
				</div>
			</Layout>
		);
	}

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Edit Profile
          </h1>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Personal Information
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Picture
                  </label>
                  <FileUpload
                    onFilesSelected={setProfileImage}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    maxFiles={1}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a profile picture (max 5MB)
                  </p>
                </div>

                {/* Email */}
                <div>
                  <Input
                    label="Email"
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Input
                    label="Phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Role Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Type
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-gray-900 dark:text-gray-100 capitalize">
                      {profile?.role}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    isLoading={updateMutation.isPending}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
