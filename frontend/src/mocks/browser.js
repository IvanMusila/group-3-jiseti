import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Browser worker for dev time mocking
// https://mswjs.io/docs/api/setup-worker
export const worker = setupWorker(...handlers);