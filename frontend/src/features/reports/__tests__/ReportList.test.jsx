import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer from '../reportsSlice.js';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ReportList from '../components/ReportList';

// Minimal render helper
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

test('renders list and pagination', async () => {
  renderWithStore(<ReportList />);
  expect(await screen.findByText(/Reports/)).toBeInTheDocument();
  expect(await screen.findByText(/Page/)).toBeInTheDocument();
});
