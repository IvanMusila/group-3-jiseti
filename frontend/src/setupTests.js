import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

process.env.VITE_API_URL = process.env.VITE_API_URL || 'http://localhost/api/v1';

globalThis.mswServer = server;
globalThis.mswHttp = http;
globalThis.mswHttpResponse = HttpResponse;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
