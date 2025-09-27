export const STATUS_LABELS = {
  pending: 'Pending',
  'under-investigation': 'Under Investigation',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_TRANSITIONS = {
  pending: ['under-investigation', 'resolved', 'rejected'],
  'under-investigation': ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

export const STATUS_ACTIONS = [
  {
    value: 'under-investigation',
    label: 'Mark Under Investigation',
    requiresNote: false,
  },
  {
    value: 'resolved',
    label: 'Mark as Resolved',
    requiresNote: true,
  },
  {
    value: 'rejected',
    label: 'Reject Report',
    requiresNote: true,
  },
];

export const ADMIN_ASSIGNEE_OPTIONS = [
  { value: '', label: 'All assignees' },
  { value: 'ops-team', label: 'Operations Team' },
  { value: 'invest-unit', label: 'Investigations Unit' },
  { value: 'gov-comms', label: 'Gov Comms' },
];

export const ADMIN_ASSIGNMENT_CHOICES = [
  { value: '', label: 'Unassigned' },
  { value: 'ops-team', label: 'Operations Team' },
  { value: 'invest-unit', label: 'Investigations Unit' },
  { value: 'gov-comms', label: 'Gov Comms' },
];

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Unknown';
}

export function allowedStatusTargets(current) {
  return STATUS_TRANSITIONS[current] || [];
}

export function assigneeLabel(value) {
  const match = ADMIN_ASSIGNMENT_CHOICES.find((option) => option.value === value);
  return match ? match.label : value || 'Unassigned';
}
