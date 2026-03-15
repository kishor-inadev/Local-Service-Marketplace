'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { requestService } from '@/services/request-service';
import { createRequestSchema, type CreateRequestFormData } from '@/schemas/request.schema';
import { analytics } from '@/utils/analytics';
import toast from 'react-hot-toast';

export default function CreateRequestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [location, setLocation] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      category_id: '',
      description: '',
      budget: 0,
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    analytics.pageview({
      path: '/requests/create',
      title: 'Create Service Request',
    });
  }, []);

  // TODO: Fetch categories from API
  useEffect(() => {
    // Temporary hardcoded categories - replace with API call
    setCategories([
      { value: '550e8400-e29b-41d4-a716-446655440001', label: 'Plumbing' },
      { value: '550e8400-e29b-41d4-a716-446655440002', label: 'Electrical' },
      { value: '550e8400-e29b-41d4-a716-446655440003', label: 'Carpentry' },
      { value: '550e8400-e29b-41d4-a716-446655440004', label: 'Cleaning' },
      { value: '550e8400-e29b-41d4-a716-446655440005', label: 'Painting' },
    ]);
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: CreateRequestFormData) => requestService.createRequest(data),
    onSuccess: (data) => {
      toast.success('Request created successfully!');
      analytics.event({
        action: 'request_created',
        category: 'conversion',
        label: 'Service Request',
      });
      router.push(`/requests/${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Failed to create request';
      toast.error(errorMessage);
      analytics.trackError(errorMessage, 'CreateRequest');
    },
  });

  const onSubmit = (data: any) => {
    // Validate location is provided
    if (!location || location.lat === 0) {
      toast.error('Please select a service location on the map');
      return;
    }

    // Prepare request data with location
    const requestData = {
      ...data,
      location: {
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
        city: location.city,
        state: location.state,
        zip_code: location.zipCode,
        country: location.country,
      },
    };

    createMutation.mutate(requestData as CreateRequestFormData);
  };

  return (
    <Layout>
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Create Service Request
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tell us what you need and get matched with qualified local service providers
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Request Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Provide clear information to attract the best providers
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Select
                    label="Category"
                    {...register('category_id')}
                    options={categories}
                  />
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.category_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Textarea
                    label="Description"
                    {...register('description')}
                    rows={6}
                    placeholder="Describe your service needs in detail (minimum 10 characters)..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Budget (USD)"
                    type="number"
                    {...register('budget', { valueAsNumber: true })}
                    min="0"
                    step="0.01"
                    placeholder="Enter your estimated budget"
                    helperText="This helps providers understand your budget range"
                  />
                  {errors.budget && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.budget.message}
                    </p>
                  )}
                </div>

                {/* Location Picker */}
                <div>
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    label="Service Location"
                    required
                  />
                  {!location && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Click on the map or search for an address where you need the service
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments (Optional)
                  </label>
                  <FileUpload
                    onFilesSelected={setAttachments}
                    accept="image/*,.pdf,.doc,.docx"
                    maxSize={10 * 1024 * 1024}
                    maxFiles={5}
                    multiple
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload images or documents (max 5 files, 10MB each)
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending}
                    disabled={createMutation.isPending}
                  >
                    Create Request
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
