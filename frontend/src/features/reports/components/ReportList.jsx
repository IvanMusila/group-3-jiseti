import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, deleteReport } from '../reportsSlice';
import { Link, useSearchParams } from 'react-router-dom';

export default function ReportList() {
  const dispatch = useDispatch();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') || 1);
  const { items, totalPages, loading, error } = useSelector(s => s.reports);

  useEffect(() => { dispatch(fetchReports(page)); }, [dispatch, page]);

  const onPrev = () => setSp({ page: String(Math.max(1, page - 1)) });
  const onNext = () => setSp({ page: String(Math.min(totalPages, page + 1)) });

  return (
    <div style={{ padding: 16 }}>
      <h2>Reports</h2>
      {loading && <p>Loading…</p>}
      {error && <div role="alert">Error: {error}</div>}
      {!loading && items.length === 0 && <p>No reports yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(r => (
          <li key={r.id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 8 }}>
            <div><strong>{r.title}</strong> — <em>{r.type}</em></div>
            <div style={{ fontSize: 13, color: '#666' }}>{r.description}</div>
            <div style={{ fontSize: 13 }}>Status: <b>{r.status}</b></div>
            {r.location && <div style={{ fontSize: 12 }}>
              Loc: {typeof r.location === 'string' ? r.location : `${r.location.lat}, ${r.location.lng}`}
            </div>}
            <div style={{ marginTop: 8 }}>
              {/* Later: guard by owner/admin; for now just pending */}
              {r.status === 'pending' && (
                <>
                  <Link to={`/reports/${r.id}/edit`} style={{ marginRight: 8 }}>Edit</Link>
                  <button onClick={() => dispatch(deleteReport(r.id))}>Delete</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={page <= 1} onClick={onPrev}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}