import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchReports, createReport, updateReport, deleteReport } from '../reportsSlice.js';
function makeStore() {
  return configureStore({ reducer: { reports: reducer } });
}

test('fetchReports loads items', async () => {
  const store = makeStore();
  await store.dispatch(fetchReports(1));
  const { items, page, totalPages } = store.getState().reports;
  expect(items.length).toBeGreaterThan(0);
  expect(page).toBe(1);
  expect(totalPages).toBeGreaterThan(0);
});

test('create/update/delete cycle', async () => {
  const store = makeStore();
  const created = await store.dispatch(createReport({
    type: 'red-flag', title: 'New', description: 'desc', location: { lat: -1.2, lng: 36.8 }
  })).unwrap();

  expect(created.id).toBeDefined();
  let { items } = store.getState().reports;
  expect(items.find(r => r.id === created.id)).toBeTruthy();

  const updated = await store.dispatch(updateReport({
    id: created.id, patch: { title: 'Updated' }
  })).unwrap();
  ({ items } = store.getState().reports);
  expect(items.find(r => r.id === created.id).title).toBe('Updated');

  await store.dispatch(deleteReport(created.id)).unwrap();
  ({ items } = store.getState().reports);
  expect(items.find(r => r.id === created.id)).toBeFalsy();
});

test('update blocked when status not pending', async () => {
  const server = globalThis.mswServer;
  const http = globalThis.mswHttp;
  const HttpResponse = globalThis.mswHttpResponse;
  if (!server) throw new Error('MSW server not initialized');
  if (!http || !HttpResponse) throw new Error('MSW helpers not initialized');
  server.use(
    http.put('/reports/:id', async () => HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 }))
  );
  const store = makeStore();
  await store.dispatch(fetchReports(1));
  const result = await store.dispatch(updateReport({ id: 1, patch: { title: 'x' } }));
  expect(result.meta.requestStatus).toBe('rejected');
});
