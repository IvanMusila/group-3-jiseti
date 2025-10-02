// ReportForm handles creating/updating reports with optional attachment uploads
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, updateReport } from '../reportsSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/media';

export default function ReportForm({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { id } = useParams();
  const { items } = useSelector((state) => state.reports);

  const existing = mode === 'edit' ? items.find((report) => String(report.id) === String(id)) : null;
  const existingAttachments = (existing?.media?.length ? existing.media : existing?.attachments) ?? [];

  const [form, setForm] = useState({
    type: existing?.type || 'corruption',
    title: existing?.title || '',
    description: existing?.description || '',
    location: existing?.location || '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const fileInputRef = useRef(null);

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

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onFilesChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) {
      setMediaFiles([]);
      return;
    }

    setMediaFiles((prev) => {
      const next = [...prev];
      selected.forEach((file) => {
        const exists = next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );
        if (!exists) next.push(file);
      });
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index) => {
    setMediaFiles((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return next;
    });
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

    const shouldUseFormData = mediaFiles.length > 0 && mode !== 'edit';
    let submissionPayload = payload;

    if (shouldUseFormData) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });
      submissionPayload = formData;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (mode === 'edit' && existing) {
        await dispatch(updateReport({ id: existing.id, patch: payload })).unwrap();
      } else {
        await dispatch(createReport(submissionPayload)).unwrap();
      }

      if (shouldUseFormData) {
        setMediaFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
              disabled={mode === 'edit'}
              className="block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:border-gray-400 focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {mode === 'edit' && (
              <p className="text-xs text-gray-500">
                Attachments can be added when creating a new report. Existing files remain available below.
              </p>
            )}

            {existingAttachments.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Existing attachments</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {existingAttachments.map((media) => (
                    <li key={media.id || media.url}>
                      <a
                        href={resolveMediaUrl(media.url) || media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-900 underline decoration-dotted underline-offset-2 hover:text-black"
                      >
                        {media.original_filename || media.name || 'Attachment'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mediaFiles.length > 0 && mode !== 'edit' && (
              <ul className="space-y-2 text-sm text-gray-700">
                {mediaFiles.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2">
                    <span className="truncate pr-3" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
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
