import { useMemo } from 'react';
import { selectCurrentUserRole } from '../../auth/selectors';

export function useIsAdmin() {
  const role = selectCurrentUserRole();
  return useMemo(() => role === 'admin', [role]);
}
