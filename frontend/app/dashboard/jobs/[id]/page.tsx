'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageSquare, Star, IndianRupee, Briefcase, AlertTriangle } from 'lucide-react';
import { notificationService, type NotificationPreferences as NotificationPreferencesType } from '@/services/notification-service';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface PreferenceSetting {
  key: keyof Omit<NotificationPreferencesType, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'channels' | 'activities';
}

const PREFERENCE_SETTINGS: PreferenceSetting[] = [
  // Communication Channels
  {
    key: 'email_notifications',
    label: 'Email Notifications',
    description: 'Receive notifications via email',
    icon: <Mail className="w-5 h-5" />,
    category: 'channels'
  },
  {
    key: 'sms_notifications',
    label: 'SMS Notifications',
    description: 'Receive notifications via text message',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'channels'
  },
  {
    key: 'push_notifications',
    label: 'Push Notifications',
    description: 'Receive browser and mobile push notifications',
    icon: <Bell className="w-5 h-5" />,
    category: 'channels'
  },
  {
    key: 'marketing_emails',
    label: 'Marketing Emails',
    description: 'Receive newsletters, tips, and promotional content',
    icon: <Mail className="w-5 h-5" />,
    category: 'channels'
  },
  // Activity Alerts
  {
    key: 'new_request_alerts',
    label: 'New Service Requests',
    description: 'Get notified when new service requests match your services',
    icon: <Briefcase className="w-5 h-5" />,
    category: 'activities'
  },
  {
    key: 'proposal_alerts',
    label: 'Proposal Updates',
    description: 'Get notified about proposal submissions and responses',
    icon: <AlertTriangle className="w-5 h-5" />,
    category: 'activities'
  },
  {
    key: 'job_updates',
    label: 'Job Updates',
    description: 'Get notified about job status changes and updates',
    icon: <Briefcase className="w-5 h-5" />,
    category: 'activities'
  },
  {
    key: 'payment_alerts',
    label: 'Payment Notifications',
    description: 'Get notified about payments, refunds, and transactions',
    icon: <IndianRupee className="w-5 h-5" />,
    category: 'activities'
  },
  {
    key: 'review_alerts',
    label: 'Review Notifications',
    description: 'Get notified when you receive new reviews',
    icon: <Star className="w-5 h-5" />,
    category: 'activities'
  },
  {
    key: 'message_alerts',
    label: 'Message Notifications',
    description: 'Get notified about new messages',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'activities'
  }
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferencesType>>({});
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await notificationService.getNotificationPreferences();
      setPreferences(data);
      setLocalPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferencesType, value: boolean) => {
    setLocalPreferences((prev: Partial<NotificationPreferencesType>) => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    setSaving(true);

    try {
      const data = await notificationService.updateNotificationPreferences(localPreferences);
      setPreferences(data);
      toast.success('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const enableAll = async () => {
    setSaving(true);

    try {
      const data = await notificationService.enableAllNotifications();
      setPreferences(data);
      setLocalPreferences(data);
      toast.success('All notifications enabled!');
    } catch (error) {
      console.error('Failed to enable all:', error);
      toast.error('Failed to enable all notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAllClick = () => {
    setDisableConfirmOpen(true);
  };

  const disableAll = async () => {
    setSaving(true);
    setDisableConfirmOpen(false);

    try {
      const data = await notificationService.disableAllNotifications();
      setPreferences(data);
      setLocalPreferences(data);
      toast.success('All notifications disabled');
    } catch (error) {
      console.error('Failed to disable all:', error);
      toast.error('Failed to disable all notifications');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return PREFERENCE_SETTINGS.some(setting => 
      localPreferences[setting.key] !== preferences[setting.key]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const channelSettings = PREFERENCE_SETTINGS.filter(s => s.category === 'channels');
  const activitySettings = PREFERENCE_SETTINGS.filter(s => s.category === 'activities');

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notification Preferences
              </h2>
              <p className="text-gray-600 text-sm">
                Choose how and when you want to receive notifications
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={enableAll}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >
                Enable All
              </button>
              <button
                onClick={handleDisableAllClick}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >
                Disable All
              </button>
            </div>
          </div>
        </div>

        {/* Communication Channels Section */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Communication Channels</h3>
          <div className="space-y-4">
            {channelSettings.map((setting) => (
              <div key={setting.key} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1 text-gray-600">
                  {setting.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor={setting.key} className="font-medium text-gray-900 cursor-pointer">
                    {setting.label}
                  </label>
                  <p className="text-sm text-gray-600 mt-0.5">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    id={setting.key}
                    type="checkbox"
                    checked={localPreferences[setting.key] ?? false}
                    onChange={(e) => updatePreference(setting.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Alerts Section */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Alerts</h3>
          <div className="space-y-4">
            {activitySettings.map((setting) => (
              <div key={setting.key} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1 text-gray-600">
                  {setting.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor={setting.key} className="font-medium text-gray-900 cursor-pointer">
                    {setting.label}
                  </label>
                  <p className="text-sm text-gray-600 mt-0.5">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    id={setting.key}
                    type="checkbox"
                    checked={localPreferences[setting.key] ?? false}
                    onChange={(e) => updatePreference(setting.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges() && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                You have unsaved changes
              </p>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-6 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> We recommend keeping payment and job updates enabled 
            to stay informed about important activities on your account.
          </p>
        </div>
      </div>
    </div>
    <ConfirmDialog
      isOpen={disableConfirmOpen}
      onClose={() => setDisableConfirmOpen(false)}
      onConfirm={disableAll}
      title="Disable All Notifications"
      message="Are you sure you want to disable all notifications? You may miss important updates."
      confirmLabel="Disable All"
      variant="warning"
    />
    </>
  );
}
