import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

const serverPromise = (async () => {
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = TextEncoder;
  }
  if (!globalThis.TextDecoder) {
    globalThis.TextDecoder = TextDecoder;
  }

  const undici = await import('undici');
  const { fetch, Headers, Request, Response, FormData, File } = undici;
  if (!globalThis.fetch) globalThis.fetch = fetch;
  if (!globalThis.Headers) globalThis.Headers = Headers;
  if (!globalThis.Request) globalThis.Request = Request;
  if (!globalThis.Response) globalThis.Response = Response;
  if (!globalThis.FormData) globalThis.FormData = FormData;
  if (!globalThis.File) globalThis.File = File;

  const { server } = await import('./mocks/server');
  return server;
})();

let server;

beforeAll(async () => {
  server = await serverPromise;
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(async () => {
  const srv = server || (server = await serverPromise);
  srv.resetHandlers();
});

afterAll(async () => {
  const srv = server || (server = await serverPromise);
  srv.close();
});
