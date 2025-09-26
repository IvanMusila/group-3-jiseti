import { configureStore } from '@reduxjs/toolkit';
import adminReportsReducer, {
  assignReport,
  fetchAdminReportById,
  fetchAdminReports,
  updateReportStatus,
} from '../adminReportsSlice';

const seedReports = [
  {
    id: 1,
    title: 'Collapsed Bridge',
    description: 'Bridge collapsed after heavy rain.',
    status: 'pending',
    type: 'intervention',
    createdAt: '2024-07-10T08:00:00.000Z',
    updatedAt: '2024-07-10T08:00:00.000Z',
    createdBy: 12,
    assignedTo: null,
    history: [],
  },
  {
    id: 2,
    title: 'Procurement Fraud',
    description: 'Irregularities in tendering.',
    status: 'under-investigation',
    type: 'red-flag',
    createdAt: '2024-07-09T08:00:00.000Z',
    updatedAt: '2024-07-09T08:00:00.000Z',
    createdBy: 8,
    assignedTo: 'ops-team',
    history: [],
  },
];

const server = globalThis.mswServer;
const http = globalThis.mswHttp;
const HttpResponse = globalThis.mswHttpResponse;

let mockReports = seedReports.map((report) => ({ ...report }));

beforeEach(() => {
  mockReports = seedReports.map((report) => ({ ...report }));
  server.use(
    http.get('/reports', ({ request }) => {
      const url = new URL(request.url);
      const queryStatus = url.searchParams.get('status');
      const assigned = url.searchParams.get('assigned');
      const responseItems = mockReports.filter((report) => {
        const statusMatch = queryStatus ? report.status === queryStatus : true;
        const assignedMatch = assigned ? String(report.assignedTo) === assigned : true;
        return statusMatch && assignedMatch;
      });
      return HttpResponse.json({
        items: responseItems,
        page: Number(url.searchParams.get('page') || 1),
        totalPages: 1,
        totalItems: responseItems.length,
      });
    }),
    http.get('/reports/:id', ({ params }) => {
      const report = mockReports.find((item) => item.id === Number(params.id));
      if (!report) {
        return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      return HttpResponse.json(report);
    }),
    http.put('/reports/:id', async ({ params, request }) => {
      const body = await request.json();
      const idx = mockReports.findIndex((item) => item.id === Number(params.id));
      if (idx === -1) {
        return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      const current = mockReports[idx];
      if (body.status === 'resolved' && !body.note) {
        return HttpResponse.json({ error: 'NOTE_REQUIRED' }, { status: 400 });
      }
      mockReports[idx] = { ...current, ...body };
      return HttpResponse.json(mockReports[idx]);
    })
  );
});

function makeStore() {
  return configureStore({ reducer: { adminReports: adminReportsReducer } });
}

test('fetchAdminReports populates state', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReports({ page: 1 }));
  const state = store.getState().adminReports;
  expect(state.items).toHaveLength(mockReports.length);
  expect(state.page).toBe(1);
  expect(state.totalItems).toBe(mockReports.length);
});

test('fetchAdminReports handles API errors', async () => {
  server.use(http.get('/reports', () => HttpResponse.error()));
  const store = makeStore();
  await store.dispatch(fetchAdminReports({ page: 1 }));
  const state = store.getState().adminReports;
  expect(state.error).toBeTruthy();
  expect(state.loading).toBe(false);
});

test('updateReportStatus updates item in state', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReports({ page: 1 }));
  await store.dispatch(
    updateReportStatus({ id: 1, status: 'resolved', note: 'Issue fixed' })
  );
  const state = store.getState().adminReports;
  expect(state.items.find((item) => item.id === 1)?.status).toBe('resolved');
  expect(state.actionLoading).toBe(false);
});

test('fetchAdminReportById stores current report', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReportById(2));
  const state = store.getState().adminReports;
  expect(state.current?.id).toBe(2);
  expect(state.items.find((item) => item.id === 2)).toBeDefined();
});

test('assignReport updates assignment in state', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReports({ page: 1 }));
  await store.dispatch(assignReport({ id: 1, assignedTo: 'ops-team', note: 'Routing to ops' }));
  const state = store.getState().adminReports;
  expect(state.items.find((item) => item.id === 1)?.assignedTo).toBe('ops-team');
});

test('updateReportStatus surfaces errors when backend rejects', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReports({ page: 1 }));
  await store.dispatch(updateReportStatus({ id: 1, status: 'resolved' }));
  const state = store.getState().adminReports;
  expect(state.actionError).toBeTruthy();
});
