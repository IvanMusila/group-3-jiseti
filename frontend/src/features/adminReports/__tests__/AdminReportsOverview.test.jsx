import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import adminReportsReducer from '../adminReportsSlice';
import AdminReportsOverview from '../components/AdminReportsOverview';

const server = globalThis.mswServer;
const http = globalThis.mswHttp;
const HttpResponse = globalThis.mswHttpResponse;

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
    assignedTo: 'ops-team',
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
    assignedTo: null,
  },
];

let reports = [...seed];

beforeEach(() => {
  reports = [...seed];
  server.use(
    http.get('/reports', ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const assigned = url.searchParams.get('assigned');
      const filtered = reports.filter((item) => {
        const statusMatch = status ? item.status === status : true;
        const assignedMatch = assigned ? String(item.assignedTo) === assigned : true;
        return statusMatch && assignedMatch;
      });
      return HttpResponse.json({ items: filtered, page: 1, totalPages: 1, totalItems: filtered.length });
    })
  );
});

function renderPage() {
  const store = configureStore({ reducer: { adminReports: adminReportsReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: '/admin/reports' }]}>
        <AdminReportsOverview />
      </MemoryRouter>
    </Provider>
  );
}

test('renders admin report overview list', async () => {
  renderPage();

  await screen.findByText(/Collapsed Bridge/);
  expect(screen.getByText(/Total Reports/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Operations Team/).length).toBeGreaterThan(0);
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

test('filters by assignment', async () => {
  renderPage();

  await screen.findByText(/Collapsed Bridge/);

  fireEvent.change(screen.getByLabelText(/Assigned/i), { target: { value: 'ops-team' } });

  await waitFor(() => {
    expect(screen.getByText(/Collapsed Bridge/)).toBeInTheDocument();
    expect(screen.queryByText(/Procurement Fraud/)).not.toBeInTheDocument();
  });
});
