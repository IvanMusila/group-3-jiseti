import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import adminReportsReducer, {
  fetchAdminReports,
  updateReportStatus,
  fetchAdminReportById,
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
  },
];

let mockReports = seedReports.map((report) => ({ ...report }));

const server = setupServer(
  http.get('/reports', ({ request }) => {
    const url = new URL(request.url);
    const queryStatus = url.searchParams.get('status');
    const responseItems = queryStatus
      ? mockReports.filter((report) => report.status === queryStatus)
      : mockReports;
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
    mockReports[idx] = { ...mockReports[idx], ...body };
    return HttpResponse.json(mockReports[idx]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  mockReports = seedReports.map((report) => ({ ...report }));
});
afterAll(() => server.close());

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
});

test('fetchAdminReportById stores current report', async () => {
  const store = makeStore();
  await store.dispatch(fetchAdminReportById(2));
  const state = store.getState().adminReports;
  expect(state.current?.id).toBe(2);
  expect(state.items.find((item) => item.id === 2)).toBeDefined();
});
