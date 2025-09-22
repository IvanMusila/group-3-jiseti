import { configureStore } from '@reduxjs/toolkit';
import reducer, { fetchReports, createReport, updateReport, deleteReport } from '../../reportsSlice';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

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
  // Force server to return INVALID_STATUS
  server.use(
    http.put('/reports/:id', async () => HttpResponse.json({ error: 'INVALID_STATUS' }, { status: 400 }))
  );
  const store = makeStore();
  await store.dispatch(fetchReports(1));
  await expect(store.dispatch(updateReport({ id: 1, patch: { title: 'x' } })).unwrap())
    .rejects.toThrow();
});