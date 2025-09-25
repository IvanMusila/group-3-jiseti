import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchAdminReportById,
  selectAdminReportById,
  selectAdminReportsState,
  updateReportStatus,
} from '../adminReportsSlice';
import '../styles/adminReports.css';

const STATUS_OPTIONS = [
  { value: 'under-investigation', label: 'Mark Under Investigation' },
  { value: 'rejected', label: 'Reject Report' },
  { value: 'resolved', label: 'Mark as Resolved' },
];

function prettyStatus(status) {
  return status ? status.replace(/-/g, ' ') : 'unknown';
}

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

export default function AdminReportDetail() {
  const { id } = useParams();
  const numericId = Number(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const report = useSelector((state) => selectAdminReportById(state, numericId));
  const { currentLoading, loading, error } = useSelector(selectAdminReportsState);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!Number.isNaN(numericId) && !report) {
      dispatch(fetchAdminReportById(numericId));
    }
  }, [dispatch, numericId, report]);

  const isLoading = (!report && (loading || currentLoading));

  const attachments = useMemo(() => {
    if (!report?.attachments?.length) return [];
    return report.attachments.map((file, index) => ({
      id: `${report.id}-att-${index}`,
      name: file.name || `Attachment ${index + 1}`,
      size: file.size,
      type: file.type,
      url: file.url,
    }));
  }, [report]);

  const locationLabel = useMemo(() => {
    if (!report?.location) return 'Not provided';
    if (typeof report.location === 'string') return report.location;
    if (typeof report.location === 'object') {
      const { lat, lng } = report.location;
      if (lat && lng) return `${lat}, ${lng}`;
    }
    return 'Not provided';
  }, [report]);

  const handleStatusUpdate = async (statusValue) => {
    if (!report) return;
    try {
      setSaving(true);
      await dispatch(updateReportStatus({ id: report.id, status: statusValue, note })).unwrap();
      setNote('');
    } catch (err) {
      // error handled via slice state
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <p className="admin-empty">Loading report details…</p>;
  }

  if (error && !report) {
    return (
      <section className="admin-detail">
        <div className="admin-error" role="alert">
          {error}
        </div>
        <button type="button" className="admin-action" onClick={() => navigate('/admin/reports')}>
          Back to reports
        </button>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="admin-detail">
        <div className="admin-empty">Report not found.</div>
        <button type="button" className="admin-action" onClick={() => navigate('/admin/reports')}>
          Back to reports
        </button>
      </section>
    );
  }

  return (
    <section className="admin-detail">
      <div className="admin-detail__crumb">
        <Link to="/admin/reports">← Back to reports</Link>
      </div>

      <header className="admin-detail__header">
        <div>
          <span className="admin-eyebrow">Report #{report.id}</span>
          <h1>{report.title}</h1>
          <p>{report.description || 'No detailed description provided.'}</p>
        </div>
        <div className="admin-detail__status">
          <span className={`admin-status admin-status--${report.status}`}>
            {prettyStatus(report.status)}
          </span>
          <span className="admin-badge">{report.type}</span>
        </div>
      </header>

      <div className="admin-detail__grid">
        <article className="admin-detail__card">
          <h2>Report Metadata</h2>
          <dl>
            <div>
              <dt>Submitted by</dt>
              <dd>User #{report.createdBy ?? '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(report.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDate(report.updatedAt)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{locationLabel}</dd>
            </div>
          </dl>

          <div className="admin-map-preview">
            <span className="map-preview__title">Map Preview</span>
            <p>{locationLabel}</p>
            <small>Map integration coming soon.</small>
          </div>
        </article>

        <article className="admin-detail__card admin-detail__card--actions">
          <h2>Moderation</h2>
          <label className="admin-filter">
            Moderation note (optional)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for the status update"
              rows={4}
            />
          </label>

          <div className="admin-actions">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="admin-action admin-action--primary"
                disabled={saving}
                onClick={() => handleStatusUpdate(option.value)}
              >
                {saving ? 'Updating…' : option.label}
              </button>
            ))}
          </div>
          {error && (
            <div className="admin-error" role="alert">
              {error}
            </div>
          )}
        </article>
      </div>

      <article className="admin-detail__card">
        <h2>Attachments & Evidence</h2>
        {attachments.length === 0 ? (
          <p className="admin-empty">No attachments provided.</p>
        ) : (
          <ul className="admin-attachments">
            {attachments.map((file) => (
              <li key={file.id}>
                <div>
                  <strong>{file.name}</strong>
                  <span>{file.type || 'File'}</span>
                </div>
                <span>{file.size ? `${Math.round(file.size / 1024)} KB` : '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="admin-detail__card">
        <h2>Moderation Notes</h2>
        {report.moderationNotes?.length ? (
          <ul className="admin-notes">
            {report.moderationNotes.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{formatDate(entry.createdAt)}</strong>
                  <span>Status: {prettyStatus(entry.status)}</span>
                </div>
                <p>{entry.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">No moderation notes yet.</p>
        )}
      </article>
    </section>
  );
}
