import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, deleteReport } from '../reportsSlice';
import { Link, useSearchParams } from 'react-router-dom';
import { selectCurrentUserId } from '../../auth/selectors';
import { resolveMediaUrl, describeMediaType } from '../utils/media';

export default function ReportList() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get('page') || 1);
  const { items, totalPages, totalItems, loading, error } = useSelector((state) => state.reports || {});

  const currentUserId = useSelector(selectCurrentUserId);
  const canEditDelete = (report) => {
    const ownerId = report?.createdBy ?? report?.created_by ?? null;
    if (!ownerId) return false;
    return report?.status === 'pending' && String(ownerId) === String(currentUserId);
  };

  useEffect(() => {
    dispatch(fetchReports(requestedPage));
  }, [dispatch, requestedPage]);

  const handlePrev = () => setSearchParams({ page: String(Math.max(1, requestedPage - 1)) });
  const handleNext = () => setSearchParams({ page: String(Math.min(totalPages, requestedPage + 1)) });

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-gray-500">Community timeline</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Reports submitted</h1>
            <p className="max-w-2xl text-sm text-gray-600">
              Track progress on community concerns. You can update or withdraw your own pending
              reports directly from here.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-yellow-950 shadow-md shadow-orange-200/40">
            {totalItems} total
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {loading && (
          <div className="rounded-2xl border border-dashed border-yellow-900/30 bg-white p-6 text-sm text-gray-600">
            Loading reports…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
            No reports yet. Be the first to raise an issue in your neighbourhood.
          </div>
        )}

        <ul className="space-y-3">
          {items?.map((report) => (
            <li
              key={report?.id}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-gray-900">{report?.title}</h2>
                  <p className="text-sm text-gray-600">{report?.description}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-900">
                  {report.type?.replace('-', ' ') || 'Unknown type'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-widest text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Status: {report.status || 'pending'}
                </span>
                {report.location && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                    {typeof report.location === 'string'
                      ? report.location
                      : `${report.location.lat}, ${report.location.lng}`}
                  </span>
                )}
                {report.attachments?.length > 0 && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-900">
                    {report.attachments.length} attachment{report.attachments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {canEditDelete(report) && (
                <div className="mt-6 flex gap-3">
                  <Link
                    to={`/reports/${report.id}/edit`}
                    className="inline-flex items-center justify-center rounded-xl border border-yellow-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-900 transition hover:bg-yellow-900 hover:text-white"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => dispatch(deleteReport(report.id))}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              )}

              {report.attachments?.length > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {report.attachments.map((file, idx) => {
                    const mediaUrl = resolveMediaUrl(file.url);
                    const mediaType = describeMediaType(file.type);
                    const label = file.name || `Attachment ${idx + 1}`;
                    const isImage = file.type?.startsWith('image/');
                    const isVideo = file.type?.startsWith('video/');
                    const isAudio = file.type?.startsWith('audio/');

                    return (
                      <a
                        key={`${file.url || file.name || idx}-${idx}`}
                        href={mediaUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition hover:border-yellow-900"
                      >
                        <div className="aspect-video w-full bg-gray-100">
                          {isImage && mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={label}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : isVideo && mediaUrl ? (
                            <video src={mediaUrl} controls className="h-full w-full object-cover" />
                          ) : isAudio && mediaUrl ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white px-4 text-sm text-gray-600">
                              <span className="text-3xl">🎧</span>
                              <audio src={mediaUrl} controls className="w-full" />
                            </div>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white px-4 text-sm text-gray-600">
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-900">
                                {mediaType}
                              </span>
                              <span className="truncate text-center text-xs text-gray-500">
                                {label}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-600">
                          <span className="truncate pr-2 font-medium text-gray-700">{label}</span>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400">
                            {mediaType}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-lg shadow-slate-900/5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={requestedPage <= 1}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span>
            Page {requestedPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={requestedPage >= totalPages}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
