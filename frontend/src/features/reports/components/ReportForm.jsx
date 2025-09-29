// ReportForm.jsx - Simplified version without file uploads
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, updateReport } from '../reportsSlice';
import { useNavigate, useParams } from 'react-router-dom';

export default function ReportForm({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { id } = useParams();
  const { items } = useSelector((state) => state.reports);

  const existing = mode === 'edit' ? items.find((report) => String(report.id) === String(id)) : null;

  const [form, setForm] = useState({
    type: existing?.type || 'corruption',
    title: existing?.title || '',
    description: existing?.description || '',
    location: existing?.location || '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

    try {
      setSubmitting(true);
      setError(null);
      
      if (mode === 'edit' && existing) {
        await dispatch(updateReport({ id: existing.id, patch: payload })).unwrap();
      } else {
        await dispatch(createReport(payload)).unwrap();
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