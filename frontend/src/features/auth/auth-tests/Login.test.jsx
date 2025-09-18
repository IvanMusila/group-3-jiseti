import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../../../pages/Login';
import { Provider } from 'react-redux';
import { store } from '../../../app/store';
import { BrowserRouter } from 'react-router-dom';

test('renders login form', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </Provider>
  );

  expect(screen.getByText(/Login/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
});

test('snapshot login', () => {
  const { asFragment } = render(
    <Provider store={store}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </Provider>
  );
  expect(asFragment()).toMatchSnapshot();
});
