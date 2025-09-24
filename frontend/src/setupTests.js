import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { fetch, Headers, Request, Response, FormData, File } from 'undici';
import { server } from './mocks/server';

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
if (!globalThis.Headers) {
  globalThis.Headers = Headers;
}
if (!globalThis.Request) {
  globalThis.Request = Request;
}
if (!globalThis.Response) {
  globalThis.Response = Response;
}
if (!globalThis.FormData) {
  globalThis.FormData = FormData;
}
if (!globalThis.File) {
  globalThis.File = File;
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
