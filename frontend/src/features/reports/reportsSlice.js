import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const initialState = {
  items: [],
  page: 1,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null
};

export const fetchReports = createAsyncThunk('reports/fetch', async (page = 1) => {
  const { data } = await api.get(`/reports?page=${page}&limit=10`);
  return data; // { items, page, totalPages, totalItems }
});

export const createReport = createAsyncThunk('reports/create', async (payload) => {
  const { data } = await api.post('/reports', payload);
  return data; // Report
});

export const updateReport = createAsyncThunk('reports/update', async ({ id, patch }) => {
  const { data } = await api.put(`/reports/${id}`, patch);
  return data; // Report
});

export const deleteReport = createAsyncThunk('reports/delete', async (id) => {
  await api.delete(`/reports/${id}`);
  return id;
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b
      // fetch
      .addCase(fetchReports.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchReports.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items || [];
        s.page = a.payload.page || 1;
        s.totalPages = a.payload.totalPages || 1;
        s.totalItems = a.payload.totalItems || s.items.length;
      })
      .addCase(fetchReports.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed to fetch'; })
      // create
      .addCase(createReport.fulfilled, (s, a) => {
        s.items = [a.payload, ...s.items];
        s.totalItems += 1;
      })
      .addCase(createReport.rejected, (s, a) => { s.error = a.error.message || 'Create failed'; })
      // update
      .addCase(updateReport.fulfilled, (s, a) => {
        const idx = s.items.findIndex(r => r.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(updateReport.rejected, (s, a) => { s.error = a.error.message || 'Update failed'; })
      // delete
      .addCase(deleteReport.fulfilled, (s, a) => {
        s.items = s.items.filter(r => r.id !== a.payload);
        s.totalItems = Math.max(0, s.totalItems - 1);
      })
      .addCase(deleteReport.rejected, (s, a) => { s.error = a.error.message || 'Delete failed'; });
  }
});

export default reportsSlice.reducer;