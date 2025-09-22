import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node server for Jest tests
// https://mswjs.io/docs/api/setup-server
export const server = setupServer(...handlers);