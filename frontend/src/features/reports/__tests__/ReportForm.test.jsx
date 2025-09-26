import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer from '../reportsSlice.js';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportForm from '../components/ReportForm';

function renderForm(mode='create') {
  const store = configureStore({ reducer: { reports: reducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/reports/new']}>
        <ReportForm mode={mode} />
      </MemoryRouter>
    </Provider>
  );
}

test('validates required fields', async () => {
  renderForm();
  fireEvent.click(screen.getByText(/Create Report/));
  expect(await screen.findByRole('alert')).toHaveTextContent(/Title and description are required/);
});
