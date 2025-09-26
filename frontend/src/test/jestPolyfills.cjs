const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
const { BroadcastChannel } = require('worker_threads');

if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
if (!global.ReadableStream) global.ReadableStream = ReadableStream;
if (!global.WritableStream) global.WritableStream = WritableStream;
if (!global.TransformStream) global.TransformStream = TransformStream;
if (!global.BroadcastChannel) global.BroadcastChannel = BroadcastChannel;

const {
  fetch: undiciFetch,
  Headers: UndiciHeaders,
  Request: UndiciRequest,
  Response: UndiciResponse,
  FormData: UndiciFormData,
  File: UndiciFile,
} = require('undici');

if (!global.fetch) global.fetch = undiciFetch;
if (!global.Headers) global.Headers = UndiciHeaders;
if (!global.Request) global.Request = UndiciRequest;
if (!global.Response) global.Response = UndiciResponse;
if (!global.FormData) global.FormData = UndiciFormData;
if (!global.File) global.File = UndiciFile;
