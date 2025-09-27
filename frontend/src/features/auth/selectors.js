// Replace this later to read from Member 2's auth slice.
// For now, read from localStorage; fallback matches MSW seed "createdBy: 7".
export function selectCurrentUserId() {
  const raw = localStorage.getItem('userId');
  return raw ? Number(raw) : 7;
}

export function selectCurrentUserRole() {
  return localStorage.getItem('role') || 'user';
}