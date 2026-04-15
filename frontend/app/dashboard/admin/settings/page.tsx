'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Permission } from "@/utils/permissions";
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import {
  Settings, Mail, Shield, Save, RefreshCw, Plus, X,
  Clock, Database, Globe, Zap, DollarSign, Users, MessageSquare,
} from 'lucide-react';
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { adminService } from '@/services/admin-service';
import toast from "react-hot-toast";

type SettingRow = { key: string; value: string; description?: string };

// ─── Type inference per key ─────────────────────────────────────────────────

const BOOLEAN_KEYS = new Set([
  'maintenance_mode', 'registration_enabled', 'provider_registration_enabled',
  'guest_requests_enabled', 'provider_verification_required',
]);

const NUMBER_KEYS = new Set([
  'platform_fee_percentage', 'gst_rate', 'max_proposal_count', 'request_expiry_days',
  'max_login_attempts', 'session_timeout_minutes', 'otp_expiry_minutes',
  'max_providers_per_category', 'max_services_per_provider', 'review_auto_approve_days',
  'min_review_length', 'max_file_upload_size_mb', 'min_payout_amount',
  'max_active_requests_per_customer', 'refund_window_days', 'dispute_window_days',
  'proposal_withdrawal_window_hours', 'max_coupon_discount_percentage', 'job_auto_complete_days',
  'email_verification_expiry_hours', 'password_reset_expiry_hours', 'magic_link_expiry_hours',
  'session_ttl_days', 'auto_generated_password_length', 'notification_retention_days',
  'failed_delivery_retention_days', 'provider_cache_ttl_seconds', 'request_cache_ttl_seconds',
  'job_cache_ttl_seconds', 'default_page_limit', 'rate_limit_max_requests',
  'auth_rate_limit_max_requests',
]);

const TEXTAREA_KEYS = new Set([
  'maintenance_message', 'contact_address', 'allowed_file_types',
]);

function inferType(key: string): 'boolean' | 'number' | 'textarea' | 'text' {
  if (BOOLEAN_KEYS.has(key)) return 'boolean';
  if (NUMBER_KEYS.has(key)) return 'number';
  if (TEXTAREA_KEYS.has(key)) return 'textarea';
  return 'text';
}

// ─── Group configuration ────────────────────────────────────────────────────

const GROUP_CONFIG: Record<string, { label: string; icon: any; keys: string[] }> = {
  platform: {
    label: 'Platform & Fees',
    icon: DollarSign,
    keys: ['platform_fee_percentage', 'gst_rate', 'min_payout_amount', 'default_currency', 'default_timezone'],
  },
  maintenance: {
    label: 'Maintenance',
    icon: Zap,
    keys: ['maintenance_mode', 'maintenance_message'],
  },
  registration: {
    label: 'Registration & Access',
    icon: Users,
    keys: ['registration_enabled', 'provider_registration_enabled', 'guest_requests_enabled',
      'provider_verification_required', 'max_active_requests_per_customer'],
  },
  marketplace: {
    label: 'Marketplace Rules',
    icon: Globe,
    keys: ['max_proposal_count', 'max_services_per_provider', 'max_providers_per_category',
      'request_expiry_days', 'proposal_withdrawal_window_hours', 'job_auto_complete_days',
      'max_coupon_discount_percentage'],
  },
  reviews: {
    label: 'Reviews & Disputes',
    icon: MessageSquare,
    keys: ['min_review_length', 'review_auto_approve_days', 'dispute_window_days', 'refund_window_days'],
  },
  security: {
    label: 'Security & Auth',
    icon: Shield,
    keys: ['max_login_attempts', 'session_timeout_minutes', 'otp_expiry_minutes',
      'email_verification_expiry_hours', 'password_reset_expiry_hours',
      'magic_link_expiry_hours', 'session_ttl_days', 'auto_generated_password_length'],
  },
  ratelimit: {
    label: 'Rate Limits',
    icon: Zap,
    keys: ['rate_limit_max_requests', 'auth_rate_limit_max_requests'],
  },
  cache: {
    label: 'Cache & Performance',
    icon: Database,
    keys: ['provider_cache_ttl_seconds', 'request_cache_ttl_seconds', 'job_cache_ttl_seconds', 'default_page_limit'],
  },
  retention: {
    label: 'Data Retention',
    icon: Clock,
    keys: ['notification_retention_days', 'failed_delivery_retention_days'],
  },
  upload: {
    label: 'File Uploads',
    icon: Database,
    keys: ['max_file_upload_size_mb', 'allowed_file_types'],
  },
  contact: {
    label: 'Contact & Legal',
    icon: Mail,
    keys: ['support_email', 'contact_phone', 'contact_address', 'terms_version', 'privacy_version'],
  },
};

function groupSettings(settings: SettingRow[]) {
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));
  const placed = new Set<string>();
  const result: Array<{ groupId: string; label: string; icon: any; rows: SettingRow[] }> = [];

  for (const [groupId, cfg] of Object.entries(GROUP_CONFIG)) {
    const rows = cfg.keys.map((k) => byKey[k]).filter(Boolean);
    if (rows.length > 0) {
      rows.forEach((r) => placed.add(r.key));
      result.push({ groupId, label: cfg.label, icon: cfg.icon, rows });
    }
  }

  // Anything not in a predefined group → "Other"
  const other = settings.filter((s) => !placed.has(s.key));
  if (other.length > 0) result.push({ groupId: 'other', label: 'Other', icon: Settings, rows: other });
  return result;
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (_v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Single setting row ──────────────────────────────────────────────────────

function SettingItem({ setting, onSave, isSaving }: {
  setting: SettingRow;
  onSave: (_k: string, _v: string) => void;
  isSaving: boolean;
}) {
  const type = inferType(setting.key);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(setting.value);

  const handleSave = () => {
    onSave(setting.key, val);
    setEditing(false);
  };

  const handleCancel = () => {
    setVal(setting.value);
    setEditing(false);
  };

  // Boolean: always-visible toggle (no Edit mode needed)
  if (type === 'boolean') {
    const isOn = val === 'true';
    return (
      <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="flex-1 mr-4">
          <p className="font-medium text-gray-900 dark:text-white text-sm font-mono">{setting.key}</p>
          {setting.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOn ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            {isOn ? 'ON' : 'OFF'}
          </span>
          <Toggle
            checked={isOn}
            onChange={(newVal) => {
              const strVal = String(newVal);
              setVal(strVal);
              onSave(setting.key, strVal);
            }}
          />
        </div>
      </div>
    );
  }

  // Number / text / textarea: inline edit
  const isTextarea = type === 'textarea';
  return (
    <div className={`py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${isTextarea ? 'block' : 'flex items-start justify-between'}`}>
      <div className={isTextarea ? 'w-full' : 'flex-1 mr-4 min-w-0'}>
        <div className={`flex items-start ${isTextarea ? 'justify-between mb-1' : ''}`}>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm font-mono">{setting.key}</p>
            {setting.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{setting.description}</p>
            )}
          </div>
          {isTextarea && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="ml-3 flex-shrink-0">Edit</Button>
          )}
        </div>
        {isTextarea && !editing && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1">{setting.value}</p>
        )}
        {editing && (
          <div className="mt-2">
            {isTextarea ? (
              <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-y font-mono"
                autoFocus
              />
            ) : (
              <input
                type={type === 'number' ? 'number' : 'text'}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            )}
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving} className="flex items-center gap-1">
                {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
      {!isTextarea && !editing && (
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono max-w-[180px] truncate" title={setting.value}>
            {setting.value}
          </span>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      )}
    </div>
  );
}

// ─── "Add new setting" form ──────────────────────────────────────────────────

const EMPTY_FORM = { key: '', value: '', description: '' };
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

function AddSettingForm({ onSubmit, isPending, onCancel }: {
  onSubmit: (_data: { key: string; value: string; description?: string }) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!KEY_PATTERN.test(form.key)) {
      setError('Key must start with a lowercase letter and use only lowercase letters, digits, and underscores.');
      return;
    }
    if (!form.value.trim()) { setError('Value is required.'); return; }
    setError('');
    onSubmit({ key: form.key, value: form.value, description: form.description || undefined });
  };

  return (
    <Card className="mb-6 border-primary-300 dark:border-primary-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Setting</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. max_upload_size"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Setting value"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Brief description of what this setting controls"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2">
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Setting
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminService.getSystemSettings(),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminService.updateSystemSetting(key, value),
    onMutate: ({ key }) => setSavingKey(key),
    onSuccess: (_, { key }) => {
      toast.success(`"${key}" saved`);
      setSavingKey(null);
      refetch();
    },
    onError: (err: any, { key }) => {
      toast.error(err?.response?.data?.message || `Failed to save "${key}"`);
      setSavingKey(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      adminService.createSystemSetting(key, value, description),
    onSuccess: () => {
      toast.success('Setting created');
      setShowAddForm(false);
      refetch();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create setting'),
  });

  const groups = groupSettings(settings ?? []);

  return (
    <ProtectedRoute requiredPermissions={[Permission.SETTINGS_MANAGE]}>
      <Layout>
        <div className="container-custom py-12">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">System Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Changes take effect immediately — boolean settings update on toggle, others on Save.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-2"
              >
                {showAddForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Setting</>}
              </Button>
            </div>
          </div>

          {showAddForm && (
            <AddSettingForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {isLoading ? (
            <Loading />
          ) : !settings?.length ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No settings found</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Run the database migrations to seed the default system settings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map(({ groupId, label, icon: Icon, rows }) => (
                <Card key={groupId}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h2>
                      <span className="ml-auto text-xs text-gray-400">{rows.length} setting{rows.length !== 1 ? 's' : ''}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rows.map((s) => (
                      <SettingItem
                        key={s.key}
                        setting={s}
                        onSave={(key, value) => saveMutation.mutate({ key, value })}
                        isSaving={savingKey === s.key}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
