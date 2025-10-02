import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Async thunks (official pattern)
// https://redux-toolkit.js.org/api/createAsyncThunk
export const fetchReports = createAsyncThunk('reports/fetch', async (page = 1) => {
  const { data } = await api.get(`/reports?page=${page}&limit=10`);
  return data; // { items, page, totalPages, totalItems }
});

export const createReport = createAsyncThunk('reports/create', async (payload) => {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  const config = isFormData ? {} : { headers: { 'Content-Type': 'application/json' } };
  const { data } = await api.post('/reports', payload, config);
  return data;
});

export const updateReport = createAsyncThunk('reports/update', async ({ id, patch }) => {
  const { data } = await api.put(`/reports/${id}`, patch, {
    headers: { 'Content-Type': 'application/json' }
  });
  return data;
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
  reducers: {
    // Add a clearError reducer to handle error state
    clearError: (state) => {
      state.error = null;
    }
  },
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
      .addCase(createReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
        state.totalItems += 1;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to create report';
      })

      // update
      .addCase(updateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((report) => report.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to update report';
      })

      // delete
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((report) => report.id !== action.payload);
        state.totalItems = Math.max(0, state.totalItems - 1);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Failed to delete report';
      });
  },
});

export const { clearError } = reportsSlice.actions;
export default reportsSlice.reducer;
