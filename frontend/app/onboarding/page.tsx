'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/constants';
import { createProviderProfile, getProviderProfileByUserId } from '@/services/user-service';
import { requestService } from '@/services/request-service';
import { apiClient } from '@/services/api-client';
import { toast } from 'react-hot-toast';
import { CheckCircle, User, Briefcase, ArrowRight, ArrowLeft, Clock } from 'lucide-react';

const PROVIDER_STEPS = ['welcome', 'profile', 'services', 'availability', 'complete'] as const;
const CUSTOMER_STEPS = ['welcome', 'complete'] as const;
type ProviderStep = (typeof PROVIDER_STEPS)[number];
type CustomerStep = (typeof CUSTOMER_STEPS)[number];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AvailabilitySlot { day: string; start_time: string; end_time: string }

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<ProviderStep | CustomerStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step: Profile
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');

  // Step: Services
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step: Availability
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { day: 'Monday', start_time: '09:00', end_time: '17:00' },
    { day: 'Tuesday', start_time: '09:00', end_time: '17:00' },
    { day: 'Wednesday', start_time: '09:00', end_time: '17:00' },
    { day: 'Thursday', start_time: '09:00', end_time: '17:00' },
    { day: 'Friday', start_time: '09:00', end_time: '17:00' },
  ]);

  const isProvider = user?.role === 'provider';
  const steps = isProvider ? PROVIDER_STEPS : CUSTOMER_STEPS;
  const currentIndex = steps.indexOf(step as any);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => requestService.getCategories(),
    enabled: isProvider,
  });

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const handleProfileSubmit = async () => {
    if (isProvider) {
      if (!businessName.trim() || !description.trim()) {
        toast.error('Please fill in business name and description');
        return;
      }
      setIsSubmitting(true);
      try {
        await createProviderProfile({ business_name: businessName.trim(), description: description.trim() });
        toast.success('Profile created!');
        goNext();
      } catch {
        toast.error('Failed to create profile. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      goNext();
    }
  };

  const handleServicesSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    setIsSubmitting(true);
    try {
      const provider = await getProviderProfileByUserId(user!.id);
      if (!provider) { toast.error('Provider profile not found.'); return; }
      await Promise.all(
        selectedCategories.map((catId) =>
          apiClient.post(`/providers/${provider.id}/services`, { category_id: catId }).catch(() => null)
        )
      );
      toast.success('Services saved!');
      goNext();
    } catch {
      toast.error('Failed to save services.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilitySubmit = async () => {
    setIsSubmitting(true);
    try {
      const provider = await getProviderProfileByUserId(user!.id);
      if (!provider) { toast.error('Provider profile not found.'); return; }
      await Promise.all(
        availability.map((slot) =>
          apiClient.post(`/providers/${provider.id}/availability`, {
            day_of_week: DAYS.indexOf(slot.day),
            start_time: slot.start_time,
            end_time: slot.end_time,
          }).catch(() => null)
        )
      );
      toast.success('Availability saved!');
      goNext();
    } catch {
      toast.error('Failed to save availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => {
      if (prev.find(s => s.day === day)) return prev.filter(s => s.day !== day);
      return [...prev, { day, start_time: '09:00', end_time: '17:00' }];
    });
  };

  const updateSlot = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s));
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i <= currentIndex
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                  {i < currentIndex ? <CheckCircle className="h-5 w-5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-10 h-0.5 ${i < currentIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step: Welcome */}
          {step === 'welcome' && (
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                    {isProvider ? <Briefcase className="h-8 w-8 text-primary-600" /> : <User className="h-8 w-8 text-primary-600" />}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome, {user?.name || 'there'}!
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isProvider
                      ? "Let's set up your provider profile in a few quick steps so customers can find and hire you."
                      : "Let's get you started finding great local services."}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {isProvider && (
                  <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                    {['Business profile', 'Services offered', 'Availability', 'Start earning'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <Button className="w-full" onClick={goNext}>
                  Get Started <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <button onClick={() => router.push(ROUTES.DASHBOARD)} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center">
                  Skip for now
                </button>
              </CardContent>
            </Card>
          )}

          {/* Step: Profile (Provider) */}
          {step === 'profile' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set Up Your Business Profile</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">This is what customers will see when they browse providers</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Joe's Plumbing Services"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe your services, experience, and what makes you stand out..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={goBack} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  <Button onClick={handleProfileSubmit} isLoading={isSubmitting} className="flex-1">
                    Save & Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Services */}
          {step === 'services' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">What Services Do You Offer?</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select all that apply â€” you can change these later</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
                  {(categories ?? []).map((cat: any) => {
                    const selected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategories(prev =>
                          selected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                        )}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
                          selected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                        }`}>
                        {selected && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mb-4">{selectedCategories.length} service{selectedCategories.length !== 1 ? 's' : ''} selected</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  <Button onClick={handleServicesSubmit} isLoading={isSubmitting} className="flex-1" disabled={selectedCategories.length === 0}>
                    Save & Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Availability */}
          {step === 'availability' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-600" /> Set Your Availability
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle days on/off and set your working hours</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {DAYS.map((day) => {
                    const slot = availability.find(s => s.day === day);
                    const active = !!slot;
                    return (
                      <div key={day} className={`flex items-center gap-3 p-3 rounded-lg border ${active ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                        <button onClick={() => toggleDay(day)} className={`w-10 h-5 rounded-full transition-colors relative ${active ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span className={`w-24 text-sm font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{day}</span>
                        {active && (
                          <div className="flex items-center gap-2 text-sm">
                            <input type="time" value={slot.start_time} onChange={(e) => updateSlot(day, 'start_time', e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white text-xs" />
                            <span className="text-gray-400">to</span>
                            <input type="time" value={slot.end_time} onChange={(e) => updateSlot(day, 'end_time', e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white text-xs" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  <Button onClick={handleAvailabilitySubmit} isLoading={isSubmitting} className="flex-1" disabled={availability.length === 0}>
                    Save & Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <button onClick={goNext} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  Skip for now
                </button>
              </CardContent>
            </Card>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isProvider ? 'Profile Complete!' : "You're All Set!"}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isProvider
                      ? 'Your provider profile is live. Start browsing open service requests to find your first job.'
                      : 'Your account is ready. Browse available services or create a request.'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {isProvider ? (
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => router.push('/dashboard/browse-requests')}>
                      Browse Service Requests <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/provider')}>
                      Go to Provider Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => router.push(ROUTES.DASHBOARD)}>
                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
