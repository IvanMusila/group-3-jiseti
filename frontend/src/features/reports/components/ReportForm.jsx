import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createReport, updateReport } from '../reportsSlice';
import { useNavigate, useParams } from 'react-router-dom';

// Geolocation API per MDN
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition

export default function ReportForm({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { id } = useParams();
  const { items } = useSelector(s => s.reports);

  const existing = mode === 'edit' ? items.find(r => String(r.id) === String(id)) : null;

  const [form, setForm] = useState({
    type: existing?.type || 'red-flag',
    title: existing?.title || '',
    description: existing?.description || '',
    lat: existing?.location?.lat || '',
    lng: existing?.location?.lng || ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && !existing) {
      // If direct-navigating to /edit and item not loaded, you'd fetch it here.
    }
  }, [mode, existing]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const geoMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm(f => ({
          ...f,
          lat: Number(pos.coords.latitude).toFixed(5),
          lng: Number(pos.coords.longitude).toFixed(5)
        })),
      () => setError('Geolocation permission denied')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return setError('Title and description are required');

    const payload = {
      type: form.type,
      title: form.title,
      description: form.description,
      location: (form.lat && form.lng) ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined
    };

    try {
      if (mode === 'edit' && existing) {
        await dispatch(updateReport({ id: existing.id, patch: payload })).unwrap();
      } else {
        await dispatch(createReport(payload)).unwrap();
      }
      nav('/reports');
    } catch (err) {
      setError(String(err?.message || 'Failed to save'));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>{mode === 'edit' ? 'Edit Report' : 'New Report'}</h2>
      {error && <div role="alert">Error: {error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <label>
          Type
          <select name="type" value={form.type} onChange={onChange}>
            <option value="red-flag">Red Flag</option>
            <option value="intervention">Intervention</option>
          </select>
        </label>

        <label>
          Title
          <input name="title" value={form.title} onChange={onChange} />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={onChange} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>
            Lat
            <input name="lat" value={form.lat} onChange={onChange} type="number" step="0.00001" min="-90" max="90" />
          </label>
          <label>
            Lng
            <input name="lng" value={form.lng} onChange={onChange} type="number" step="0.00001" min="-180" max="180" />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={geoMe}>Use my location</button>
          <button type="submit">{mode === 'edit' ? 'Save Changes' : 'Create Report'}</button>
        </div>
      </form>
    </div>
  );
}