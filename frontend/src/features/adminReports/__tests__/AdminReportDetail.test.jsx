import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import adminReportsReducer from '../adminReportsSlice';
import AdminReportDetail from '../components/AdminReportDetail';

const server = globalThis.mswServer;
const http = globalThis.mswHttp;
const HttpResponse = globalThis.mswHttpResponse;
const apiPath = (path) => `*/api/v1${path}`;

const baseReport = {
  id: 5,
  title: 'Collapsed Bridge',
  description: 'Bridge collapsed due to flooding.',
  status: 'pending',
  type: 'intervention',
  createdBy: 42,
  createdAt: '2024-07-01T08:00:00.000Z',
  updatedAt: '2024-07-01T08:00:00.000Z',
  attachments: [
    {
      id: 99,
      name: 'bridge.jpg',
      size: 123456,
      type: 'image/jpeg',
      url: '/api/v1/media/bridge.jpg',
    },
  ],
  moderationNotes: [],
  assignedTo: null,
  history: [],
};

let currentReport = { ...baseReport };

function mockHandlers() {
  server.use(
    http.get(apiPath('/reports/:id'), ({ params }) => {
      if (Number(params.id) !== currentReport.id) {
        return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      return HttpResponse.json(currentReport);
    }),
    http.put(apiPath('/reports/:id'), async ({ params, request }) => {
      if (Number(params.id) !== currentReport.id) {
        return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      const body = await request.json();
      currentReport = {
        ...currentReport,
        ...body,
        moderationNotes: body?.note
          ? [
              { id: Date.now(), note: body.note, status: body.status || currentReport.status, createdAt: new Date().toISOString() },
              ...(currentReport.moderationNotes || []),
            ]
          : currentReport.moderationNotes,
      };
      return HttpResponse.json(currentReport);
    })
  );
}

beforeEach(() => {
  localStorage.setItem('accessToken', 'test-token');
  currentReport = { ...baseReport };
  mockHandlers();
});

afterEach(() => {
  localStorage.clear();
});

function renderDetail() {
  const store = configureStore({ reducer: { adminReports: adminReportsReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/admin/reports/${baseReport.id}`]}>
        <Routes>
          <Route path="/admin/reports/:id" element={<AdminReportDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

test('loads report detail information', async () => {
  renderDetail();
  expect(await screen.findByText(/Collapsed Bridge/)).toBeInTheDocument();
  expect(screen.getByText(/Report #5/)).toBeInTheDocument();
  expect(screen.getByText(/Pending/i)).toBeInTheDocument();
});

test('updates report status with moderation note', async () => {
  renderDetail();
  await screen.findByText(/Collapsed Bridge/);

  fireEvent.change(screen.getByPlaceholderText(/Add context/i), { target: { value: 'Investigating with county team' } });
  fireEvent.click(screen.getByText(/Mark Under Investigation/));

  await waitFor(() => {
    expect(screen.getByText(/Investigating with county team/, { selector: 'p' })).toBeInTheDocument();
  });
});

test('updates assignment with optional note', async () => {
  renderDetail();
  await screen.findByText(/Collapsed Bridge/);

  fireEvent.change(screen.getByLabelText(/Assign to/i), { target: { value: 'ops-team' } });
  fireEvent.change(screen.getByPlaceholderText(/Let colleagues know/i), { target: { value: 'Sending to ops' } });
  fireEvent.click(screen.getByText(/Update assignment/i));

  await waitFor(() => {
    expect(screen.getByText(/Operations Team/)).toBeInTheDocument();
  });
});
