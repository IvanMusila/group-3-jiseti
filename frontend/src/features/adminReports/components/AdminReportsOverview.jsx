import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchAdminReports,
  resetAdminFilters,
  selectAdminReportsState,
  setAdminFilters,
} from '../adminReportsSlice';
import {
  ADMIN_ASSIGNEE_OPTIONS,
  STATUS_LABELS,
  assigneeLabel,
  statusLabel,
} from '../config';
import '../styles/adminReports.css';

const statusOptions = [
  { label: 'All statuses', value: '' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
];

const typeOptions = [
  { label: 'All types', value: '' },
  { label: 'Red-flag', value: 'red-flag' },
  { label: 'Intervention', value: 'intervention' },
];

const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminReportsOverview() {
  const dispatch = useDispatch();
  const { items, page, totalPages, totalItems, loading, error, filters } = useSelector(selectAdminReportsState);
  const { status, type, search, sort, assigned, dateFrom, dateTo } = filters;

  useEffect(() => {
    dispatch(fetchAdminReports({ page, filters }));
  }, [dispatch, page, status, type, search, sort, filters.limit, assigned, dateFrom, dateTo]);

  const summary = useMemo(() => ({
    pending: items.filter((r) => r.status === 'pending').length,
    investigation: items.filter((r) => r.status === 'under-investigation').length,
    resolved: items.filter((r) => r.status === 'resolved').length,
  }), [items]);

  const updateFilter = (name, value) => {
    dispatch(setAdminFilters({ [name]: value }));
  };

  const changePage = (next) => {
    dispatch(setAdminFilters({ page: next }));
  };

  const onSubmit = (event) => event.preventDefault();

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">Moderation Suite</span>
          <h1>Reports Dashboard</h1>
          <p>Monitor citizen submissions, triage their status, and keep communities informed.</p>
        </div>
        <div className="admin-summary">
          <div className="admin-summary__card">
            <span>Total Reports</span>
            <strong>{totalItems}</strong>
          </div>
          <div className="admin-summary__card">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
          <div className="admin-summary__card">
            <span>Under Investigation</span>
            <strong>{summary.investigation}</strong>
          </div>
          <div className="admin-summary__card">
            <span>Resolved</span>
            <strong>{summary.resolved}</strong>
          </div>
        </div>
      </header>

      <form className="admin-filters" onSubmit={onSubmit}>
        <div className="admin-filter">
          <label htmlFor="admin-search">Search</label>
          <input
            id="admin-search"
            name="search"
            value={search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search by title or keyword"
          />
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-status">Status</label>
          <select
            id="admin-status"
            value={status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-type">Type</label>
          <select
            id="admin-type"
            value={type}
            onChange={(event) => updateFilter('type', event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-assigned">Assigned</label>
          <select
            id="admin-assigned"
            value={assigned}
            onChange={(event) => updateFilter('assigned', event.target.value)}
          >
            {ADMIN_ASSIGNEE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-sort">Sort</label>
          <select
            id="admin-sort"
            value={sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-from">From</label>
          <input
            id="admin-from"
            type="date"
            value={dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
        </div>
        <div className="admin-filter">
          <label htmlFor="admin-to">To</label>
          <input
            id="admin-to"
            type="date"
            value={dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
        </div>
        <div className="admin-filter admin-filter--actions">
          <button type="submit" className="admin-action admin-action--primary">
            Apply
          </button>
          <button
            type="button"
            className="admin-action"
            onClick={() => dispatch(resetAdminFilters())}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="admin-table-card">
        {loading && <p className="admin-empty">Loading reports…</p>}
        {error && (
          <div role="alert" className="admin-error">
            {error}
          </div>
        )}
        {!loading && !items.length && !error && (
          <p className="admin-empty">No reports match the selected filters.</p>
        )}

        {!loading && items.length > 0 && (
          <div className="admin-table">
            <div className="admin-table__head">
              <span>Report</span>
              <span>Status</span>
              <span>Type</span>
              <span>Reporter</span>
              <span>Assigned</span>
              <span>Submitted</span>
            </div>
            <div className="admin-table__body">
              {items.map((report) => (
                <Link
                  key={report.id}
                  to={`/admin/reports/${report.id}`}
                  className="admin-row"
                >
                  <div className="admin-row__title">
                    <h3>{report.title}</h3>
                    <p>
                      #{report.id} · {report.description?.slice(0, 80) || 'No description provided.'}
                    </p>
                  </div>
                  <span className={`admin-status admin-status--${report.status}`}>
                    {statusLabel(report.status)}
                  </span>
                  <span className="admin-badge">{report.type}</span>
                  <span className="admin-meta">User #{report.createdBy ?? '—'}</span>
                  <span className="admin-meta">{assigneeLabel(report.assignedTo)}</span>
                  <span className="admin-meta">{formatDate(report.createdAt)}</span>
                  <span className="admin-row__chevron" aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <footer className="admin-pagination">
          <button
            type="button"
            onClick={() => changePage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => changePage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </footer>
      </div>
    </section>
  );
}
