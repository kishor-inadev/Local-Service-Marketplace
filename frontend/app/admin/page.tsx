'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/Badge';
import { adminService } from '@/services/admin-service';
import { formatDate } from '@/utils/helpers';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, requireRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !requireRole(['admin'])) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, requireRole, router]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
    enabled: user?.role === 'admin',
  });

  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => adminService.getDisputes(),
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Loading size="sm" />
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {formatDate(user.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={user.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No users found</p>
              )}
            </CardContent>
          </Card>

          {/* Disputes */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Disputes</h2>
            </CardHeader>
            <CardContent>
              {disputesLoading ? (
                <Loading size="sm" />
              ) : disputes && disputes.length > 0 ? (
                <div className="space-y-3">
                  {disputes.slice(0, 10).map((dispute) => (
                    <div
                      key={dispute.id}
                      className="p-3 border rounded-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          Job #{dispute.job_id.slice(0, 8)}
                        </p>
                        <StatusBadge status={dispute.status} />
                      </div>
                      <p className="text-sm text-gray-600">{dispute.reason}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(dispute.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No disputes found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
