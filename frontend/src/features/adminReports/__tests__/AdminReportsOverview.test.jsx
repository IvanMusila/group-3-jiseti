import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import adminReportsReducer from '../adminReportsSlice';
import AdminReportsOverview from '../components/AdminReportsOverview';

const seed = [
  {
    id: 1,
    title: 'Collapsed Bridge',
    description: 'The bridge collapsed due to flooding.',
    status: 'pending',
    type: 'intervention',
    createdBy: 10,
    createdAt: '2024-07-01T10:00:00.000Z',
    updatedAt: '2024-07-01T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'Procurement Fraud',
    description: 'Irregular award of road tender.',
    status: 'resolved',
    type: 'red-flag',
    createdBy: 4,
    createdAt: '2024-06-28T08:00:00.000Z',
    updatedAt: '2024-06-30T09:00:00.000Z',
  },
];

let reports = [...seed];

const server = setupServer(
  http.get('/reports', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const filtered = status ? reports.filter((item) => item.status === status) : reports;
    return HttpResponse.json({ items: filtered, page: 1, totalPages: 1, totalItems: filtered.length });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  reports = [...seed];
});
afterAll(() => server.close());

function renderPage() {
  const store = configureStore({ reducer: { adminReports: adminReportsReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/admin/reports' }] }>
        <AdminReportsOverview />
      </MemoryRouter>
    </Provider>
  );
}

test('renders admin report overview list', async () => {
  renderPage();

  expect(await screen.findByText(/Collapsed Bridge/)).toBeInTheDocument();
  expect(screen.getByText(/Total Reports/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
});

test('applies status filter', async () => {
  renderPage();

  await screen.findByText(/Collapsed Bridge/);

  fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'resolved' } });

  await waitFor(() => {
    expect(screen.getByText(/Procurement Fraud/)).toBeInTheDocument();
    expect(screen.queryByText(/Collapsed Bridge/)).not.toBeInTheDocument();
  });
});
