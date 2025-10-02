// ReportForm handles creating/updating reports with optional attachment uploads
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, updateReport } from '../reportsSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/media';
import { selectCurrentUserId } from '../../auth/selectors';

export default function ReportForm({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { id } = useParams();
  const { items } = useSelector((state) => state.reports);
  const currentUserId = useSelector(selectCurrentUserId);

  const existing = mode === 'edit' ? items.find((report) => String(report.id) === String(id)) : null;
  const initialAttachments = useMemo(() => {
    if (!existing) return [];
    return (existing.media?.length ? existing.media : existing?.attachments) ?? [];
  }, [existing]);
  const ownerId = existing ? existing.createdBy ?? existing.created_by ?? null : null;
  const isOwner = ownerId && currentUserId
    ? String(ownerId) === String(currentUserId)
    : false;
  const isPending = existing?.status === 'pending';
  const canEditExisting = mode !== 'edit' || (existing && isOwner && isPending);

  const [form, setForm] = useState({
    type: existing?.type || 'corruption',
    title: existing?.title || '',
    description: existing?.description || '',
    location: existing?.location || '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const deriveAttachmentId = (attachment) => {
    if (!attachment) return null;
    return (
      attachment.id ??
      attachment.mediaId ??
      attachment.attachmentId ??
      attachment.media_id ??
      attachment.attachment_id ??
      null
    );
  };

  const normaliseAttachments = (list) =>
    (list || []).map((attachment) => ({
      original: attachment,
      id: deriveAttachmentId(attachment),
      status: 'keep',
      replacementFile: null,
    }));

  const [attachments, setAttachments] = useState(() => normaliseAttachments(initialAttachments));
  const [newUploads, setNewUploads] = useState([]);
  const fileInputRef = useRef(null);
  const replacementInputRefs = useRef({});

  const getAttachmentName = (attachment) =>
    attachment.original?.original_filename ||
    attachment.original?.name ||
    attachment.original?.filename ||
    `Attachment ${attachment.id ?? ''}`;

  const getAttachmentUrl = (attachment) =>
    resolveMediaUrl(attachment.original?.url) || attachment.original?.url || '#';

  const markAttachmentStatus = (attachmentId, status, replacementFile = null) => {
    setAttachments((prev) =>
      prev.map((entry) =>
        entry.id === attachmentId
          ? { ...entry, status, replacementFile: status === 'replace' ? replacementFile : null }
          : entry
      )
    );
  };

  const handleAttachmentRemoval = (attachmentId) => {
    if (!attachmentId) return;
    markAttachmentStatus(attachmentId, 'remove');
  };

  const undoAttachmentChanges = (attachmentId) => {
    if (!attachmentId) return;
    markAttachmentStatus(attachmentId, 'keep');
  };

  const openReplacementDialog = (attachmentId) => {
    if (!attachmentId) return;
    const node = replacementInputRefs.current[attachmentId];
    if (node) node.click();
  };

  const handleReplacementSelected = (attachment, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const file = files[0];
    markAttachmentStatus(attachment.id, 'replace', file);
    if (event.target) {
      event.target.value = '';
    }
  };

  if (mode === 'edit' && (!existing || !canEditExisting)) {
    const restrictionMessage = !existing
      ? 'We could not find the report you want to edit.'
      : !isOwner
        ? 'You can only edit reports you created.'
        : 'Only pending reports can be edited.';

    return (
      <section className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-gray-500">Citizen Reports</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Update existing report</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            {restrictionMessage}
          </p>
        </header>
      </section>
    );
  }

  useEffect(() => {
    if (mode === 'edit' && existing) {
      setForm({
        type: existing.type || 'corruption',
        title: existing.title || '',
        description: existing.description || '',
        location: existing.location || '',
      });
    }
  }, [mode, existing]);

  useEffect(() => {
    if (mode === 'edit') {
      setAttachments(normaliseAttachments(initialAttachments));
    } else {
      setAttachments([]);
    }
    setNewUploads([]);
  }, [initialAttachments, mode]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onFilesChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setNewUploads((prev) => {
      const next = [...prev];
      selected.forEach((file) => {
        const exists = next.some(
          (entry) =>
            entry.file.name === file.name &&
            entry.file.size === file.size &&
            entry.file.lastModified === file.lastModified
        );
        if (!exists) {
          next.push({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            file,
          });
        }
      });
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadEntry = (entryId) => {
    setNewUploads((prev) => prev.filter((item) => item.id !== entryId));
  };

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude).toFixed(5);
        const lng = Number(position.coords.longitude).toFixed(5);
        setForm((prev) => ({
          ...prev,
          location: `${lat}, ${lng}`
        }));
        setError(null);
      },
      () => setError('Geolocation permission denied')
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === 'edit') {
      if (!existing) {
        setError('Report not available for editing.');
        return;
      }
      if (!isOwner) {
        setError('You can only edit your own pending reports.');
        return;
      }
      if (!isPending) {
        setError('Only pending reports can be edited.');
        return;
      }
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location || 'Unknown location'
    };

    const attachmentsMarked = attachments.filter((attachment) => attachment.status === 'remove' || attachment.status === 'replace');
    const replacementFiles = attachments
      .filter((attachment) => attachment.status === 'replace' && attachment.replacementFile)
      .map((attachment) => attachment.replacementFile);

    const removalIds = attachmentsMarked
      .map((attachment) => attachment.id)
      .filter((value) => value !== null && value !== undefined);

    const shouldUseFormData = replacementFiles.length > 0 || newUploads.length > 0;
    let submissionPayload = payload;

    if (shouldUseFormData) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      replacementFiles.forEach((file) => {
        formData.append('media', file);
      });
      newUploads.forEach((entry) => {
        formData.append('media', entry.file);
      });
      if (mode === 'edit' && removalIds.length > 0) {
        formData.append('remove_media_ids', JSON.stringify(removalIds));
      }
      submissionPayload = formData;
    } else if (mode === 'edit' && removalIds.length > 0) {
      submissionPayload = {
        ...payload,
        remove_media_ids: removalIds,
      };
    }

    try {
      setSubmitting(true);
      setError(null);

      if (mode === 'edit' && existing) {
        await dispatch(updateReport({ id: existing.id, patch: submissionPayload })).unwrap();
      } else {
        await dispatch(createReport(submissionPayload)).unwrap();
      }

      setAttachments(normaliseAttachments(initialAttachments));
      setNewUploads([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      nav('/reports');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save report';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-gray-500">Citizen Reports</p>
        <h1 className="text-3xl font-extrabold text-gray-900">
          {mode === 'edit' ? 'Update existing report' : 'Submit a new report'}
        </h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Share issues impacting your community. Accurate descriptions and locations help administrators act faster.
        </p>
      </header>

      <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-orange-200/30">
        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Issue category
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
              >
                <option value="corruption">Corruption</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="sanitation">Sanitation</option>
                <option value="safety">Safety</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Title
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Concise summary of the issue"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={5}
              placeholder="Describe what happened and who is affected"
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Location
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="e.g. -1.286389, 36.817223 or 'Main Street, Downtown'"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Supporting media (optional)</p>
            <p className="text-xs text-gray-500">
          Attach photos, videos, audio, or documents that help verify the report. Maximum size 16 MB per file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          name="media"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          onChange={onFilesChange}
          className="block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:border-gray-400 focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {mode === 'edit' && attachments.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Existing attachments
            </p>
            <p className="mb-3 text-xs text-gray-500">
              Click a file name to choose a replacement or use the buttons to remove/undo changes.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              {attachments.map((attachment) => {
                const attachmentId = attachment.id;
                const isRemoved = attachment.status === 'remove';
                const isReplaced = attachment.status === 'replace';
                const replacementName = isReplaced && attachment.replacementFile ? attachment.replacementFile.name : null;
                return (
                  <li
                    key={attachmentId || attachment.original?.url}
                    className={`flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm transition ${
                      isRemoved ? 'border border-red-100 bg-red-50/60 text-red-700' : isReplaced ? 'border border-yellow-200 bg-yellow-50/60' : 'border border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!isRemoved && attachmentId) {
                          openReplacementDialog(attachmentId);
                        }
                      }}
                      disabled={isRemoved || !attachmentId}
                      className={`flex-1 truncate text-left text-yellow-900 underline decoration-dotted underline-offset-2 transition hover:text-black disabled:cursor-not-allowed disabled:text-gray-400 ${
                        isRemoved ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {getAttachmentName(attachment)}
                      {isRemoved && <span className="ml-2 text-xs uppercase text-red-600">(will be removed)</span>}
                      {isReplaced && replacementName && (
                        <span className="ml-2 text-xs uppercase text-yellow-900">
                          (replacing with {replacementName})
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <a
                        href={getAttachmentUrl(attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="text-xs font-medium text-yellow-900 transition hover:text-black"
                      >
                        View
                      </a>
                      {attachmentId && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (isRemoved || isReplaced) {
                              undoAttachmentChanges(attachmentId);
                            } else {
                              handleAttachmentRemoval(attachmentId);
                            }
                          }}
                          className={`text-xs font-medium transition ${
                            isRemoved || isReplaced ? 'text-gray-600 hover:text-gray-800' : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          {isRemoved || isReplaced ? 'Undo' : 'Remove'}
                        </button>
                      )}
                    </div>
                    <input
                      ref={(node) => {
                        if (!attachmentId) return;
                        if (node) {
                          replacementInputRefs.current[attachmentId] = node;
                        } else {
                          delete replacementInputRefs.current[attachmentId];
                        }
                      }}
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      className="hidden"
                      onChange={(event) => handleReplacementSelected(attachment, event)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {newUploads.length > 0 && (
          <ul className="space-y-2 text-sm text-gray-700">
            {newUploads.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2"
              >
                <span className="truncate pr-3" title={entry.file.name}>
                  {entry.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeUploadEntry(entry.id)}
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={useGeolocation}
              className="inline-flex items-center justify-center rounded-xl border border-yellow-900 px-5 py-3 text-sm font-semibold text-yellow-900 transition hover:bg-yellow-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-yellow-900/30"
            >
              Use my location
            </button>

            <div className="flex gap-3">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-yellow-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-yellow-950/30 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
