import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const initialState = {
  items: [],
  page: 1,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null,
};

function toFormData(body) {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(body.payload));
  if (body.attachment) {
    formData.append('attachment', body.attachment);
  }
  return formData;
}

export const fetchReports = createAsyncThunk('reports/fetch', async (page = 1) => {
  const { data } = await api.get(`/reports?page=${page}&limit=10`);
  return data;
});

export const createReport = createAsyncThunk('reports/create', async (payload) => {
  const { attachment, ...rest } = payload;
  if (attachment) {
    const { data } = await api.post('/reports', toFormData({ payload: rest, attachment }));
    return data;
  }
  const { data } = await api.post('/reports', rest);
  return data;
});

export const updateReport = createAsyncThunk('reports/update', async ({ id, patch }) => {
  const { attachment, ...rest } = patch;
  if (attachment) {
    const { data } = await api.put(`/reports/${id}`, toFormData({ payload: rest, attachment }));
    return data;
  }
  const { data } = await api.put(`/reports/${id}`, rest);
  return data;
});

export const deleteReport = createAsyncThunk('reports/delete', async (id) => {
  await api.delete(`/reports/${id}`);
  return id;
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.totalItems = action.payload.totalItems ?? state.items.length;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.totalItems += 1;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.error = action.error.message || 'Create failed';
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        const idx = state.items.findIndex((report) => report.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.error = action.error.message || 'Update failed';
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.items = state.items.filter((report) => report.id !== action.payload);
        state.totalItems = Math.max(0, state.totalItems - 1);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.error = action.error.message || 'Delete failed';
      });
  },
});

export default reportsSlice.reducer;
