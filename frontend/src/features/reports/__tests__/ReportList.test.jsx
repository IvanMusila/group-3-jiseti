import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer from '../reportsSlice.js';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ReportList from '../components/ReportList';

function renderWithStore(ui, { route = '/reports', preloadedState } = {}) {
  const store = configureStore({ reducer: { reports: reducer }, preloadedState });
  window.history.pushState({}, '', route);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );
}

test('renders list with fetched reports', async () => {
  localStorage.setItem('accessToken', 'test-token');
  renderWithStore(<ReportList />);
  expect(await screen.findByText(/Reports submitted/i)).toBeInTheDocument();
  expect(await screen.findByText(/Collapsed Bridge/i)).toBeInTheDocument();
  localStorage.clear();
});
