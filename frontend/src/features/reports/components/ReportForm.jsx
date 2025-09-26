import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, updateReport } from '../reportsSlice';
import { useNavigate, useParams } from 'react-router-dom';

// Geolocation API per MDN
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition

export default function ReportForm({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { id } = useParams();
  const { items } = useSelector((state) => state.reports);
  const fileInputRef = useRef(null);

  const existing = mode === 'edit' ? items.find((report) => String(report.id) === String(id)) : null;

  const [form, setForm] = useState({
    type: existing?.type || 'red-flag',
    title: existing?.title || '',
    description: existing?.description || '',
    lat: existing?.location?.lat || '',
    lng: existing?.location?.lng || '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && existing) {
      setForm({
        type: existing.type || 'red-flag',
        title: existing.title || '',
        description: existing.description || '',
        lat: existing.location?.lat || '',
        lng: existing.location?.lng || '',
      });
    }
  }, [mode, existing]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onMediaChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setMediaFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    } else {
      event.target.value = '';
    }
  };

  const removeMediaAt = (index) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const triggerMediaDialog = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (size) => {
    if (!size && size !== 0) return '';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(position.coords.latitude).toFixed(5),
          lng: Number(position.coords.longitude).toFixed(5),
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

    const basePayload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
    };

    if (form.lat && form.lng) {
      basePayload.location = { lat: Number(form.lat), lng: Number(form.lng) };
    }

    const buildMultipart = (payload) => {
      const data = new FormData();
      data.append('payload', JSON.stringify(payload));
      mediaFiles.forEach((file) => data.append('attachment', file));
      return data;
    };

    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'edit' && existing) {
        const patchPayload = { ...basePayload };
        let patchToSend = patchPayload;
        if (mediaFiles.length) {
          patchToSend = buildMultipart(patchPayload);
        }
        await dispatch(updateReport({ id: existing.id, patch: patchToSend })).unwrap();
      } else {
        let createPayload = { ...basePayload };
        if (mediaFiles.length) {
          createPayload = buildMultipart(basePayload);
        }
        await dispatch(createReport(createPayload)).unwrap();
      }
      nav('/reports');
    } catch (err) {
      setError(err?.message || 'Failed to save report');
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
          Share issues impacting your community. Accurate descriptions and locations help
          administrators act faster.
        </p>
      </header>

      <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-orange-200/30">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
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
                <option value="red-flag">Red Flag</option>
                <option value="intervention">Intervention</option>
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

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Latitude
              <input
                name="lat"
                value={form.lat}
                onChange={onChange}
                type="number"
                step="0.00001"
                min="-90"
                max="90"
                placeholder="e.g. -1.286389"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Longitude
              <input
                name="lng"
                value={form.lng}
                onChange={onChange}
                type="number"
                step="0.00001"
                min="-180"
                max="180"
                placeholder="e.g. 36.817223"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 shadow-sm focus:border-yellow-900 focus:outline-none focus:ring-4 focus:ring-yellow-900/20"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-yellow-900/40 bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Supporting media</p>
                  <p className="text-xs text-gray-500">
                    Add photos or short videos (max 10MB each) to strengthen your report.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerMediaDialog}
                  className="inline-flex items-center justify-center rounded-xl border border-yellow-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-900 transition hover:bg-yellow-900 hover:text-white"
                >
                  Upload media
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={onMediaChange}
              />
            </div>

            {mediaFiles.length > 0 && (
              <ul className="space-y-2">
                {mediaFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-gray-700"
                  >
                    <span className="flex-1 truncate pr-3">
                      {file.name}
                      <span className="pl-2 text-xs text-gray-500">{formatSize(file.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMediaAt(index)}
                      className="text-xs font-semibold text-red-600 transition hover:text-red-700"
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
