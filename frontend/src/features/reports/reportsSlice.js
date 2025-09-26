import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Async thunks (official pattern)
// https://redux-toolkit.js.org/api/createAsyncThunk
export const fetchReports = createAsyncThunk('reports/fetch', async (page = 1) => {
  const { data } = await api.get(`/reports?page=${page}&limit=10`);
  return data; // { items, page, totalPages, totalItems }
});

export const createReport = createAsyncThunk('reports/create', async (payload) => {
  const isMultipart = typeof FormData !== 'undefined' && payload instanceof FormData;
  const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  const { data } = await api.post('/reports', payload, config);
  return data; // Report
});

export const updateReport = createAsyncThunk('reports/update', async ({ id, patch }) => {
  const isMultipart = typeof FormData !== 'undefined' && patch instanceof FormData;
  const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  const { data } = await api.put(`/reports/${id}`, patch, config);
  return data; // Report
});

export const deleteReport = createAsyncThunk('reports/delete', async (id) => {
  await api.delete(`/reports/${id}`);
  return id;
});

const initialState = {
  items: [],
  page: 1,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        const items = payload.items || payload.data || [];
        const meta = payload.meta || {};
        state.items = items;
        state.page = payload.page || meta.currentPage || 1;
        state.totalPages = payload.totalPages || meta.totalPages || 1;
        state.totalItems =
          payload.totalItems ?? meta.total ?? meta.count ?? items.length;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch reports';
      })

      // create
      .addCase(createReport.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.totalItems += 1;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create report';
      })

      // update
      .addCase(updateReport.fulfilled, (state, action) => {
        const idx = state.items.findIndex((report) => report.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update report';
      })

      // delete
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.items = state.items.filter((report) => report.id !== action.payload);
        state.totalItems = Math.max(0, state.totalItems - 1);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete report';
      });
  },
});

export default reportsSlice.reducer;
