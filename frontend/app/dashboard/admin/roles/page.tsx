'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { rbacService, type Role } from '@/services/rbac-service';
import { Permission } from '@/utils/permissions';
import { formatDate } from '@/utils/helpers';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '' });

  const { data: roles, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => rbacService.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; display_name: string; description?: string }) =>
      rbacService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setShowCreateForm(false);
      setNewRole({ name: '', display_name: '', description: '' });
      toast.success('Role created successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Role deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete role'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name || !newRole.display_name) return;
    createMutation.mutate({
      name: newRole.name.toLowerCase().replace(/\s+/g, '_'),
      display_name: newRole.display_name,
      description: newRole.description || undefined,
    });
  };

  const handleDelete = (role: Role) => {
    if (role.is_system) return;
    if (!confirm(`Delete role "${role.display_name}"? Users with this role will need to be reassigned.`)) return;
    deleteMutation.mutate(role.id);
  };

  return (
    <ProtectedRoute requiredPermissions={[Permission.ROLES_MANAGE]}>
      <Layout>
        <div className="container-custom py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage roles and assign permissions dynamically</p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Role
            </Button>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Create New Role</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (slug)</label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      placeholder="e.g. editor"
                      pattern="[a-z0-9_]+"
                      title="Lowercase letters, numbers, underscores only"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={newRole.display_name}
                      onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                      placeholder="e.g. Editor"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2 justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create Role'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Roles list */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6"><SkeletonTable rows={4} /></div>
              ) : error ? (
                <div className="p-6"><ErrorState message="Failed to load roles" retry={refetch} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Role</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Description</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">System</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Created</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(roles ?? []).map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary-500" />
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{role.display_name}</span>
                                <span className="ml-2 text-xs text-gray-400 font-mono">{role.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{role.description || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={role.is_active ? 'active' : 'inactive'} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {role.is_system && <span title="System role — cannot be deleted"><Lock className="h-4 w-4 text-amber-500 inline" /></span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(role.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`${ROUTES.DASHBOARD_ADMIN_ROLES}/${role.id}`}>
                                <Button variant="ghost" size="sm" title="Edit permissions">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              {!role.is_system && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(role)}
                                  disabled={deleteMutation.isPending}
                                  title="Delete role"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(roles ?? []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No roles found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
