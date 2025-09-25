import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import adminReportsReducer from '../adminReportsSlice';
import AdminReportDetail from '../components/AdminReportDetail';

const report = {
  id: 5,
  title: 'Collapsed Bridge',
  description: 'Bridge collapsed due to flooding.',
  status: 'pending',
  type: 'intervention',
  createdBy: 42,
  createdAt: '2024-07-01T08:00:00.000Z',
  updatedAt: '2024-07-01T08:00:00.000Z',
  attachments: [],
  moderationNotes: [],
};

let currentReport = { ...report };

const server = setupServer(
  http.get('/reports/:id', ({ params }) => {
    if (Number(params.id) !== currentReport.id) {
      return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    return HttpResponse.json(currentReport);
  }),
  http.put('/reports/:id', async ({ params, request }) => {
    if (Number(params.id) !== currentReport.id) {
      return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const body = await request.json();
    currentReport = {
      ...currentReport,
      ...body,
      moderationNotes: body.note
        ? [
            { id: Date.now(), note: body.note, status: body.status, createdAt: new Date().toISOString() },
            ...(currentReport.moderationNotes || []),
          ]
        : currentReport.moderationNotes,
    };
    return HttpResponse.json(currentReport);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  currentReport = { ...report };
});
afterAll(() => server.close());

function renderDetail() {
  const store = configureStore({ reducer: { adminReports: adminReportsReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/admin/reports/${report.id}`]}>
        <AdminReportDetail />
      </MemoryRouter>
    </Provider>
  );
}

test('loads report detail information', async () => {
  renderDetail();

  expect(await screen.findByText(/Collapsed Bridge/)).toBeInTheDocument();
  expect(screen.getByText(/Report #5/)).toBeInTheDocument();
  expect(screen.getByText(/pending/i)).toBeInTheDocument();
});

test('updates report status with moderation note', async () => {
  renderDetail();
  await screen.findByText(/Collapsed Bridge/);

  fireEvent.change(screen.getByPlaceholderText(/Add context/i), { target: { value: 'Investigating with county team' } });
  fireEvent.click(screen.getByText(/Mark Under Investigation/));

  await waitFor(() => {
    expect(screen.getByText(/Investigating with county team/)).toBeInTheDocument();
    expect(screen.getAllByText(/under investigation/i).length).toBeGreaterThan(1);
  });
});
