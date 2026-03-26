'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api-client';
import { ErrorState } from "@/components/ui/ErrorState";
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import toast from "react-hot-toast";

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

/**
 * PROVIDER AVAILABILITY PAGE
 * 
 * STATUS: ✅ BACKEND API AVAILABLE
 * 
 * BACKEND ENDPOINTS:
 * - ✅ GET /providers/:id - Returns provider with availability
 * - ✅ PATCH /providers/:id/availability - Updates availability schedule
 * 
 * IMPLEMENTATION: Complete
 */

export default function AvailabilityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user's provider profile to get current availability
  const {
		data: provider,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["provider-profile", user?.id],
		queryFn: async () => {
			try {
				// First, get the provider record for this user
				const response = await apiClient.get(`/providers?user_id=${user?.id}`);
				if (response.data?.data && response.data.data.length > 0) {
					return response.data.data[0];
				}
				return null;
			} catch (error) {
				console.error("Error fetching provider:", error);
				return null;
			}
		},
		enabled: isAuthenticated && user?.role === "provider" && !!user?.id,
	});

  // Load existing availability when provider data is fetched
  useEffect(() => {
    if (provider?.availability) {
      setSlots(provider.availability);
    }
  }, [provider]);

  // Update availability mutation
  const updateMutation = useMutation({
    mutationFn: async (availability: AvailabilitySlot[]) => {
      if (!provider?.id) {
        throw new Error('Provider ID not found');
      }
      const response = await apiClient.patch(`/providers/${provider.id}/availability`, {
        availability,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      setHasChanges(false);
      toast.success("Availability updated successfully!");
    },
    onError: (error) => {
      console.error('Error updating availability:', error);
      toast.error("Failed to update availability. Please try again.");
    },
  });

  const addSlot = () => {
    setSlots([...slots, { day_of_week: 1, start_time: '09:00', end_time: '17:00' }]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate slots
    for (const slot of slots) {
      if (slot.start_time >= slot.end_time) {
        toast.error("End time must be after start time");
        return;
      }
    }
    updateMutation.mutate(slots);
  };

  const setQuickSchedule = (type: 'weekdays' | 'weekends' | 'full_week') => {
    let newSlots: AvailabilitySlot[] = [];
    
    if (type === 'weekdays') {
      // Monday to Friday, 9 AM to 5 PM
      for (let day = 1; day <= 5; day++) {
        newSlots.push({ day_of_week: day, start_time: '09:00', end_time: '17:00' });
      }
    } else if (type === 'weekends') {
      // Saturday and Sunday, 10 AM to 4 PM
      newSlots.push({ day_of_week: 0, start_time: '10:00', end_time: '16:00' });
      newSlots.push({ day_of_week: 6, start_time: '10:00', end_time: '16:00' });
    } else if (type === 'full_week') {
      // All days, 9 AM to 5 PM
      for (let day = 0; day <= 6; day++) {
        newSlots.push({ day_of_week: day, start_time: '09:00', end_time: '17:00' });
      }
    }
    
    setSlots(newSlots);
    setHasChanges(true);
  };

  if (!isAuthenticated || user?.role !== 'provider') {
    router.push(ROUTES.DASHBOARD);
    return null;
  }

  if (!provider) {
    return (
			<Layout>
				<div className='container-custom py-12'>
					{error ?
						<ErrorState
							title='Failed to load availability'
							message="We couldn't load your provider data. Please try again."
							retry={() => refetch()}
						/>
					:	<Card>
							<CardContent className='text-center py-12'>
								<AlertCircle className='h-12 w-12 text-yellow-600 mx-auto mb-4' />
								<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Provider Profile Not Found</h3>
								<p className='text-gray-600 dark:text-gray-400'>Please complete your provider profile setup first</p>
							</CardContent>
						</Card>
					}
				</div>
			</Layout>
		);
  }

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Availability Schedule
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Set your working hours to let customers know when you're available
          </p>
        </div>

        {/* Quick Schedule Templates */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Schedule Templates
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => setQuickSchedule('weekdays')}>
                <Calendar className="h-4 w-4 mr-2" />
                Weekdays (Mon-Fri)
              </Button>
              <Button variant="outline" onClick={() => setQuickSchedule('weekends')}>
                <Calendar className="h-4 w-4 mr-2" />
                Weekends Only
              </Button>
              <Button variant="outline" onClick={() => setQuickSchedule('full_week')}>
                <Calendar className="h-4 w-4 mr-2" />
                Full Week (7 days)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Availability Slots */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Time Slots
              </h2>
              <Button size="sm" onClick={addSlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading size="sm" />
            ) : slots.length > 0 ? (
              <div className="space-y-4">
                {slots.map((slot, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    {/* Day of Week */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        value={slot.day_of_week}
                        onChange={(e) => updateSlot(index, 'day_of_week', parseInt(e.target.value))}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSlot(index)}
                        className="w-full text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No availability slots set</p>
                <p className="text-sm mt-1">Click "Add Slot" or choose a quick schedule template</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSlots(provider?.availability || []);
                setHasChanges(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Preview */}
        {slots.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Schedule Preview
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = slots.filter((s) => s.day_of_week === day.value);
                  return (
                    <div
                      key={day.value}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {day.label.substring(0, 3)}
                      </h4>
                      {daySlots.length > 0 ? (
                        <div className="space-y-1">
                          {daySlots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                            >
                              {slot.start_time} - {slot.end_time}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Unavailable</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
