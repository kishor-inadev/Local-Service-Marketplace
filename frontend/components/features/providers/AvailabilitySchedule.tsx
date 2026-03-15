import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DAYS_OF_WEEK } from '@/config/constants';
import { Clock } from 'lucide-react';

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface AvailabilityScheduleProps {
  availability: Availability[];
}

export function AvailabilitySchedule({ availability }: AvailabilityScheduleProps) {
  if (!availability || availability.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No availability schedule set</p>
        </CardContent>
      </Card>
    );
  }

  // Group availability by day
  const scheduleByDay = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, Availability[]>);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability Schedule
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const slots = scheduleByDay[day.value];
            return (
              <div key={day.value} className="flex justify-between items-start">
                <span className="font-medium text-gray-700 w-24">{day.label}</span>
                <div className="flex-1">
                  {slots ? (
                    <div className="space-y-1">
                      {slots.map((slot) => (
                        <div key={slot.id} className="text-sm text-gray-600">
                          {slot.start_time} - {slot.end_time}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
