import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

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
