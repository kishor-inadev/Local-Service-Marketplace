'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { rbacService, type RolePermission } from '@/services/rbac-service';
import { Permission } from '@/utils/permissions';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/config/constants';
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/utils/helpers';

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleId = params.id as string;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  const { data: role, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['admin-role', roleId],
    queryFn: () => rbacService.getRole(roleId),
    enabled: !!roleId,
  });

  const { data: allPermissions, isLoading: permsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => rbacService.getPermissions(),
  });

  const { data: rolePerms, isLoading: rolePermsLoading } = useQuery({
    queryKey: ['admin-role-permissions', roleId],
    queryFn: () => rbacService.getRolePermissions(roleId),
    enabled: !!roleId,
  });

  // Initialize selected permissions when data loads
  useEffect(() => {
    if (rolePerms) {
      setSelectedIds(new Set(rolePerms.map((p) => p.id)));
      setDirty(false);
    }
  }, [rolePerms]);

  const saveMutation = useMutation({
    mutationFn: () => rbacService.assignPermissions(roleId, { permission_ids: Array.from(selectedIds) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions', roleId] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setDirty(false);
      toast.success('Permissions updated successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save permissions'),
  });

  // Group permissions by resource for the grid
  const permissionGrid = useMemo(() => {
    if (!allPermissions) return { resources: [], actions: new Set<string>(), map: new Map() };

    const resources = new Set<string>();
    const actions = new Set<string>();
    const map = new Map<string, RolePermission>(); // key = "resource:action"

    for (const p of allPermissions) {
      resources.add(p.resource);
      actions.add(p.action);
      map.set(`${p.resource}:${p.action}`, p);
    }

    return {
      resources: Array.from(resources).sort(),
      actions: actions,
      map,
    };
  }, [allPermissions]);

  // Sorted unique actions
  const sortedActions = useMemo(() => {
    const order = ['view', 'list', 'read', 'browse', 'create', 'update', 'delete', 'manage', 'verify', 'accept', 'file', 'send', 'update_status', 'view_stats', 'access', 'contact_view', 'events', 'jobs', 'rate_limits', 'feature_flags'];
    return Array.from(permissionGrid.actions).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 100 : ai) - (bi === -1 ? 100 : bi);
    });
  }, [permissionGrid.actions]);

  const toggle = (permId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
    setDirty(true);
  };

  const toggleResource = (resource: string) => {
    const permsForResource = Array.from(permissionGrid.map.entries())
      .filter(([key]) => key.startsWith(resource + ':'))
      .map(([, p]) => p.id);
    const allSelected = permsForResource.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      permsForResource.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
    setDirty(true);
  };

  const selectAll = () => {
    if (!allPermissions) return;
    setSelectedIds(new Set(allPermissions.map((p) => p.id)));
    setDirty(true);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
    setDirty(true);
  };

  const isLoading = roleLoading || permsLoading || rolePermsLoading;

  return (
    <ProtectedRoute requiredPermissions={[Permission.ROLES_MANAGE]}>
      <Layout>
        <div className="container-custom py-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={ROUTES.DASHBOARD_ADMIN_ROLES}>
                <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-500" />
                  {role?.display_name ?? 'Loading...'}
                </h1>
                {role && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="font-mono">{role.name}</span>
                    {role.is_system && <span className="ml-2 text-amber-500 text-xs">(system role)</span>}
                    {' · '}
                    {selectedIds.size} permission{selectedIds.size !== 1 ? 's' : ''} assigned
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>Clear All</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={!dirty || saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {roleError ? (
            <ErrorState message="Failed to load role" retry={() => router.push(ROUTES.DASHBOARD_ADMIN_ROLES)} />
          ) : isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">Loading permissions grid...</CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Permission Grid</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click cells to toggle. Click resource names to toggle entire rows.</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 min-w-[160px]">Resource</th>
                        {sortedActions.map((action) => (
                          <th key={action} className="text-center px-2 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide min-w-[70px]">
                            {action.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {permissionGrid.resources.map((resource) => {
                        const permsForRow = sortedActions.map((action) => permissionGrid.map.get(`${resource}:${action}`));
                        const assignedCount = permsForRow.filter((p) => p && selectedIds.has(p.id)).length;
                        const totalCount = permsForRow.filter(Boolean).length;

                        return (
                          <tr key={resource} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <button
                                onClick={() => toggleResource(resource)}
                                className="text-left font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title={`Toggle all ${resource} permissions`}
                              >
                                {resource.replace('_', ' ')}
                                <span className="ml-1.5 text-xs text-gray-400">
                                  ({assignedCount}/{totalCount})
                                </span>
                              </button>
                            </td>
                            {sortedActions.map((action) => {
                              const perm = permissionGrid.map.get(`${resource}:${action}`);
                              if (!perm) {
                                return <td key={action} className="px-2 py-2.5 text-center"><span className="text-gray-200 dark:text-gray-800">—</span></td>;
                              }
                              const checked = selectedIds.has(perm.id);
                              return (
                                <td key={action} className="px-2 py-2.5 text-center">
                                  <button
                                    onClick={() => toggle(perm.id)}
                                    className={cn(
                                      'h-7 w-7 rounded-md border-2 inline-flex items-center justify-center transition-all duration-150',
                                      checked
                                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                                    )}
                                    title={`${perm.display_name}: ${perm.description || perm.name}`}
                                  >
                                    {checked && (
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
