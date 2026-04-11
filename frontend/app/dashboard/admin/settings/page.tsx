'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Settings, Mail, Shield, Save, RefreshCw } from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { adminService } from '@/services/admin-service';
import toast from "react-hot-toast";

type SettingRow = { key: string; value: string; description?: string };

function SettingItem({ setting, onSave }: { setting: SettingRow; onSave: (key: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(setting.value);

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 mr-4">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{setting.key}</p>
        {setting.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{setting.description}</p>
        )}
        {editing && (
          <div className="mt-2 flex gap-2">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <Button size="sm" variant="primary" onClick={() => { onSave(setting.key, val); setEditing(false); }} className="flex items-center gap-1">
              <Save className="h-3 w-3" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setVal(setting.value); setEditing(false); }}>Cancel</Button>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono max-w-[160px] truncate" title={setting.value}>
            {setting.value}
          </span>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  useAuth();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminService.getSystemSettings(),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminService.updateSystemSetting(key, value),
    onSuccess: () => { toast.success('Setting saved'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save setting'),
  });

  // Group settings by prefix
  const grouped: Record<string, SettingRow[]> = {};
  (settings ?? []).forEach((s: SettingRow) => {
    const group = s.key.includes('.') ? s.key.split('.')[0] : 'general';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(s);
  });

  const GROUP_ICONS: Record<string, any> = {
    general: Settings, email: Mail, security: Shield, platform: Settings,
  };

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <Layout>
        <div className='container-custom py-12'>
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>System Settings</h1>
              <p className='text-gray-600 dark:text-gray-400'>Configure platform-wide settings</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {isLoading ? (
            <Loading />
          ) : !settings?.length ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No configurable settings</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  System settings are managed via environment variables. Settings stored in the database will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([group, rows]) => {
                const Icon = GROUP_ICONS[group] ?? Settings;
                return (
                  <Card key={group}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary-600" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{group} Settings</h2>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {rows.map((s) => (
                        <SettingItem
                          key={s.key}
                          setting={s}
                          onSave={(key, value) => saveMutation.mutate({ key, value })}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

