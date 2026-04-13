'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { requestService } from '@/services/request-service';
import { cn } from '@/utils/helpers';
import {
  ClipboardList,
  IndianRupee,
  MapPin,
  Calendar,
  AlertTriangle,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

// Extended schema for the form (superset of API schema)
const createRequestFormSchema = z.object({
  category_id: z.string().min(1, 'Please select a service category'),
  description: z
    .string()
    .min(10, 'Please describe your need in at least 10 characters')
    .max(1000, 'Keep description under 1000 characters'),
  budget: z.coerce
    .number()
    .positive('Budget must be greater than 0')
    .max(10_000_000, 'Budget cannot exceed \u20b910,00,000'),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  preferred_date: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
});

type RequestFormData = z.infer<typeof createRequestFormSchema>;

const STEPS = [
  { id: 1, label: 'Service', icon: ClipboardList },
  { id: 2, label: 'Details', icon: IndianRupee },
  { id: 3, label: 'Location', icon: MapPin },
  { id: 4, label: 'Review', icon: Check },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Flexible', desc: 'Anytime in the next few weeks', color: 'text-accent-600 dark:text-accent-400' },
  { value: 'medium', label: 'Soon', desc: 'Within the next week', color: 'text-primary-600 dark:text-primary-400' },
  { value: 'high', label: 'This week', desc: 'Within 2–3 days', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'urgent', label: 'ASAP', desc: 'Within 24 hours if possible', color: 'text-red-600 dark:text-red-400' },
];

interface Props {
  initialQuery?: string;
  onSuccess?: (_requestId: string) => void;
}

export function CreateRequestForm({ initialQuery = '', onSuccess }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => requestService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories = (categoriesData as any)?.data ?? (categoriesData as any) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue: _setValue,
    trigger,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(createRequestFormSchema) as any,
    defaultValues: {
      urgency: 'medium',
      description: initialQuery ? `I need help with: ${initialQuery}` : '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RequestFormData) =>
      requestService.createRequest({
        category_id: data.category_id,
        description: data.description,
        budget: data.budget,
        urgency: data.urgency,
        preferred_date: data.preferred_date,
        location:
          data.address || data.city
            ? {
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.pincode,
                country: 'IN',
                latitude: 0,
                longitude: 0,
              }
            : undefined,
      }),
    onSuccess: (request) => {
      toast.success('Request posted! Providers will reach out soon.');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      if (onSuccess) {
        onSuccess(request.id);
      } else {
        router.push(`/dashboard/requests/${request.id}`);
      }
    },
    onError: () => {
      toast.error('Failed to post request. Please try again.');
    },
  });

  const watchedValues = watch();
  const selectedCategory = categories.find((c: any) => c.id === watchedValues.category_id);

  const nextStep = async () => {
    const fields: (keyof RequestFormData)[][] = [
      ['category_id'],
      ['description', 'budget', 'urgency'],
      ['address'],
    ];
    const valid = await trigger(fields[step - 1]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = (data: RequestFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 text-sm font-semibold',
                    isDone
                      ? 'bg-accent-500 text-white shadow-sm'
                      : isActive
                      ? 'bg-primary-600 text-white shadow-primary'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3 rounded-full transition-all duration-300',
                    step > s.id ? 'bg-accent-400' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Category */}
        {step === 1 && (
          <Card elevated>
            <CardHeader>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">What service do you need?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select the category that best matches your project</p>
            </CardHeader>
            <CardContent className="p-6">
              {categories.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {(categories as any[]).filter((c) => c.active !== false).map((cat) => (
                    <label
                      key={cat.id}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 text-center',
                        watchedValues.category_id === cat.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                      )}
                    >
                      <input
                        type="radio"
                        value={cat.id}
                        className="sr-only"
                        {...register('category_id')}
                      />
                      {watchedValues.category_id === cat.id && (
                        <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary-600 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                      <span className="text-2xl">{cat.icon || '🔧'}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.category_id && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />{errors.category_id.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Description, Budget, Urgency */}
        {step === 2 && (
          <Card elevated>
            <CardHeader>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Describe your project</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                More detail = better proposals from providers
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Describe what you need <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="E.g., I need a licensed plumber to fix a leaking pipe under my kitchen sink. The leak started 2 days ago..."
                  className={cn(
                    'w-full px-3.5 py-2.5 border rounded-xl text-sm shadow-sm resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-primary-400 transition-colors',
                    errors.description
                      ? 'border-red-400 focus:ring-red-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">{watchedValues.description?.length ?? 0}/1000</p>
              </div>

              <Input
                label="Your budget (\u20b9)"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                error={errors.budget?.message}
                required
                {...register('budget')}
              />

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  How soon do you need this? <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {URGENCY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150',
                        watchedValues.urgency === opt.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <input type="radio" value={opt.value} className="sr-only" {...register('urgency')} />
                      {opt.value === 'urgent' && <Zap className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className={cn('text-sm font-semibold', opt.color)}>{opt.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                  Preferred date (optional)
                </label>
                <input
                  type="date"
                  {...register('preferred_date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <Card elevated>
            <CardHeader>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Where is the job?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Help providers know if they serve your area</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input label="Street address" placeholder="e.g. 45, MG Road" {...register('address')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" placeholder="Mumbai" {...register('city')} />
                <Input label="State" placeholder="Maharashtra" {...register('state')} />
              </div>
              <Input label="Pincode" placeholder="400001" {...register('pincode')} />
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Location is only shared with providers you contact. You can skip this step.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card elevated>
            <CardHeader>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Review your request</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Confirm everything looks good before posting</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                <ReviewRow label="Category" value={selectedCategory?.name ?? '—'} />
                <ReviewRow label="Description" value={watchedValues.description} multiline />
                <ReviewRow label="Budget" value={`\u20b9${watchedValues.budget ?? 0}`} />
                <ReviewRow
                  label="Urgency"
                  value={URGENCY_OPTIONS.find((o) => o.value === watchedValues.urgency)?.label ?? '—'}
                />
                {watchedValues.preferred_date && (
                  <ReviewRow label="Preferred date" value={watchedValues.preferred_date} />
                )}
                {(watchedValues.city || watchedValues.address) && (
                  <ReviewRow
                    label="Location"
                    value={[watchedValues.address, watchedValues.city, watchedValues.state, watchedValues.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="h-4 w-4" />Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button type="button" onClick={nextStep} className="gap-2 ml-auto">
              Continue<ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="gradient"
              isLoading={createMutation.isPending}
              className="gap-2 ml-auto px-8"
            >
              Post Request<Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className={cn('text-sm font-medium text-gray-900 dark:text-gray-100', multiline && 'whitespace-pre-wrap break-words')}>
        {value || '—'}
      </span>
    </div>
  );
}
