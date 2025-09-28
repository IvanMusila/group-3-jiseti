import { useSelector } from 'react-redux';
import { selectCurrentUserRole } from '../../auth/selectors';

export function useIsAdmin() {
  const role = useSelector(selectCurrentUserRole);
  return role === 'admin';
}