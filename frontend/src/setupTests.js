import '@testing-library/jest-dom';
import { server } from './mocks/server';

// RTL/Jest setup
// https://testing-library.com/docs/react-testing-library/setup/
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());