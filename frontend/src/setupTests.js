import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream } from 'stream/web';
import { BroadcastChannel } from 'worker_threads';

const serverPromise = (async () => {
  if (!globalThis.TextEncoder) {
    globalThis.TextEncoder = TextEncoder;
  }
  if (!globalThis.TextDecoder) {
    globalThis.TextDecoder = TextDecoder;
  }
  if (!globalThis.ReadableStream) {
    globalThis.ReadableStream = ReadableStream;
  }
  if (!globalThis.WritableStream) {
    globalThis.WritableStream = WritableStream;
  }
  if (!globalThis.BroadcastChannel) {
    globalThis.BroadcastChannel = BroadcastChannel;
  }

  const undici = await import('undici');
  const { fetch, Headers, Request, Response, FormData, File } = undici;
  if (!globalThis.fetch) globalThis.fetch = fetch;
  if (!globalThis.Headers) globalThis.Headers = Headers;
  if (!globalThis.Request) globalThis.Request = Request;
  if (!globalThis.Response) globalThis.Response = Response;
  if (!globalThis.FormData) globalThis.FormData = FormData;
  if (!globalThis.File) globalThis.File = File;

  const { http, HttpResponse } = await import('msw');
  globalThis.mswHttp = http;
  globalThis.mswHttpResponse = HttpResponse;

  const { server } = await import('./mocks/server');
  globalThis.mswServer = server;
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
