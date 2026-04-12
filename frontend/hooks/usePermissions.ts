'use client';

import { useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/utils/permissions';

/**
 * Hook for checking user permissions in components.
 *
 * @example
 * const { can, canAny, canAll } = usePermissions();
 *
 * if (can('users.create')) { ... }
 * if (canAny(['users.create', 'users.manage'])) { ... }
 */
export function usePermissions() {
  const { data: session } = useSession();

  const permissions = useMemo<string[]>(
    () => session?.user?.permissions ?? [],
    [session?.user?.permissions],
  );

  const role = session?.user?.role ?? '';

  const can = useCallback(
    (permission: string) => hasPermission(permissions, permission),
    [permissions],
  );

  const canAny = useCallback(
    (required: string[]) => hasAnyPermission(permissions, required),
    [permissions],
  );

  const canAll = useCallback(
    (required: string[]) => hasAllPermissions(permissions, required),
    [permissions],
  );

  return { permissions, role, can, canAny, canAll };
}
