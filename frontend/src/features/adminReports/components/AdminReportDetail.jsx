import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  assignReport,
  fetchAdminReportById,
  selectAdminReportById,
  selectAdminReportsState,
  updateReportStatus,
} from '../adminReportsSlice';
import {
  ADMIN_ASSIGNMENT_CHOICES,
  STATUS_ACTIONS,
  allowedStatusTargets,
  assigneeLabel,
  statusLabel,
} from '../config';
import '../styles/adminReports.css';
import { resolveMediaUrl, describeMediaType } from '../../reports/utils/media';
import { selectCurrentUserId } from '../../auth/selectors';

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
  const { currentLoading, loading, error, actionLoading, actionError } = useSelector(selectAdminReportsState);
  const currentUserId = useSelector(selectCurrentUserId);
  const [statusNote, setStatusNote] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!Number.isNaN(numericId) && !report) {
      dispatch(fetchAdminReportById(numericId));
    }
  }, [dispatch, numericId, report]);

  useEffect(() => {
    if (report) {
      setSelectedAssignee(report.assignedTo || '');
    }
  }, [report?.assignedTo]);

  const isLoading = (!report && (loading || currentLoading));

  const ownerId = useMemo(() => {
    if (!report) return null;
    return report.createdBy ?? report.created_by ?? null;
  }, [report]);

  const isOwner = useMemo(() => {
    if (!ownerId || !currentUserId) return false;
    return String(ownerId) === String(currentUserId);
  }, [ownerId, currentUserId]);

  const canModify = Boolean(report && isOwner && report.status === 'pending');

  const attachments = useMemo(() => {
    if (!report?.attachments?.length) return [];
    return report.attachments.map((file, index) => ({
      id: `${report.id}-att-${index}`,
      name: file.name || `Attachment ${index + 1}`,
      size: file.size,
      type: file.type,
      url: resolveMediaUrl(file.url),
      rawUrl: file.url,
      kind: describeMediaType(file.type),
      isImage: file.type?.startsWith('image/'),
      isVideo: file.type?.startsWith('video/'),
      isAudio: file.type?.startsWith('audio/'),
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

  const allowedTargets = useMemo(() => {
    if (!report) return [];
    if (!canModify) return [];
    return allowedStatusTargets(report.status);
  }, [report?.status, canModify]);

  const timeline = useMemo(() => {
    if (report?.history?.length) return report.history;
    if (!report?.moderationNotes) return [];
    return report.moderationNotes.map((entry) => ({
      id: entry.id,
      type: 'note',
      createdAt: entry.createdAt,
      status: entry.status,
      note: entry.note,
    }));
  }, [report]);

  const handleStatusUpdate = async (statusValue) => {
    if (!report || !canModify) return;
    const payloadNote = statusNote.trim();
    try {
      setPendingAction(`status-${statusValue}`);
      await dispatch(
        updateReportStatus({
          id: report.id,
          status: statusValue,
          note: payloadNote || undefined,
        })
      ).unwrap();
      const actionConfig = STATUS_ACTIONS.find((option) => option.value === statusValue);
      if (actionConfig?.requiresNote) {
        setStatusNote('');
      }
    } catch (err) {
      // error handled via slice state
    } finally {
      setPendingAction(null);
    }
  };

  const handleAssignment = async () => {
    if (!report || !canModify) return;
    try {
      setPendingAction('assign');
      await dispatch(
        assignReport({
          id: report.id,
          assignedTo: selectedAssignee || null,
          note: assignmentNote.trim() || undefined,
        })
      ).unwrap();
      setAssignmentNote('');
    } catch (err) {
      // handled in slice
    } finally {
      setPendingAction(null);
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
            {statusLabel(report.status)}
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
              <dd>User #{report.createdBy ?? report.created_by ?? '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(report.createdAt || report.created_at)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDate(report.updatedAt || report.updated_at)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{locationLabel}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{assigneeLabel(report.assignedTo)}</dd>
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
            Moderation note
            <textarea
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Add context for the status update"
              rows={4}
              disabled={!canModify}
            />
          </label>

          <div className="admin-actions">
            {STATUS_ACTIONS.map((option) => {
              const requiresNote = option.requiresNote;
              const allowed = allowedTargets.includes(option.value);
              const noteRequiredMissing = requiresNote && !statusNote.trim();
              const isPending = pendingAction === `status-${option.value}` && actionLoading;
              return (
                <button
                  key={option.value}
                  type="button"
                  className="admin-action admin-action--primary"
                  disabled={!allowed || !canModify || noteRequiredMissing || actionLoading}
                  onClick={() => handleStatusUpdate(option.value)}
                >
                  {isPending ? 'Updating…' : option.label}
                </button>
              );
            })}
          </div>

          {!canModify && (
            <p className="admin-meta">Only the report owner can update pending reports.</p>
          )}

          {canModify && allowedTargets.length === 0 && (
            <p className="admin-meta">Report has reached a final state.</p>
          )}
        </article>

        <article className="admin-detail__card admin-detail__card--actions">
          <h2>Assignment</h2>
          <label className="admin-filter">
            Assign to
            <select
              value={selectedAssignee}
              onChange={(event) => setSelectedAssignee(event.target.value)}
              disabled={!canModify}
            >
              {ADMIN_ASSIGNMENT_CHOICES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter">
            Assignment note (optional)
            <textarea
              value={assignmentNote}
              onChange={(event) => setAssignmentNote(event.target.value)}
              rows={3}
              placeholder="Let colleagues know why you reassigned this report"
              disabled={!canModify}
            />
          </label>

          <div className="admin-actions">
            <button
              type="button"
              className="admin-action admin-action--primary"
              disabled={actionLoading || !canModify}
              onClick={handleAssignment}
            >
              {pendingAction === 'assign' && actionLoading ? 'Saving…' : 'Update assignment'}
            </button>
          </div>

          {!canModify && (
            <p className="admin-meta">Only the report owner can manage assignments while the report is pending.</p>
          )}
        </article>
      </div>

      <article className="admin-detail__card">
        <h2>Attachments & Evidence</h2>
        {attachments.length === 0 ? (
          <p className="admin-empty">No attachments provided.</p>
        ) : (
          <div className="admin-attachments-grid">
            {attachments.map((file) => (
              <a
                key={file.id}
                href={file.url || file.rawUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-attachment-card"
              >
                <div className="admin-attachment-card__preview">
                  {file.isImage && file.url ? (
                    <img src={file.url} alt={file.name} loading="lazy" />
                  ) : file.isVideo && file.url ? (
                    <video src={file.url} controls />
                  ) : file.isAudio && file.url ? (
                    <div className="admin-attachment-card__audio">
                      <span role="img" aria-label="Audio">🎧</span>
                      <audio src={file.url} controls />
                    </div>
                  ) : (
                    <div className="admin-attachment-card__fallback">
                      <span className="admin-attachment-card__badge">{file.kind}</span>
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
                <div className="admin-attachment-card__meta">
                  <span className="admin-attachment-card__name">{file.name}</span>
                  <span className="admin-attachment-card__info">
                    {file.kind}
                    {file.size ? ` • ${Math.round(file.size / 1024)} KB` : ''}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </article>

      <article className="admin-detail__card">
        <h2>Activity Timeline</h2>
        {timeline.length ? (
          <ul className="admin-notes">
            {timeline.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{formatDate(entry.createdAt || entry.created_at)}</strong>
                  <span>{entry.type === 'assignment' ? 'Assignment' : statusLabel(entry.status)}</span>
                </div>
                {entry.note && <p>{entry.note}</p>}
                {entry.assignedTo && (
                  <p className="admin-meta">Assigned to: {assigneeLabel(entry.assignedTo)}</p>
                )}
                {entry.from && (
                  <p className="admin-meta">
                    {statusLabel(entry.from)} → {statusLabel(entry.status)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">No activity yet.</p>
        )}
      </article>

      {actionError && (
        <div className="admin-error" role="alert">
          {actionError}
        </div>
      )}
    </section>
  );
}
