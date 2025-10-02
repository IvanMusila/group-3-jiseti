import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../lib/api';

const initialFilters = {
  status: '',
  type: '',
  search: '',
  sort: 'newest',
  assigned: '',
  dateFrom: '',
  dateTo: '',
  limit: 10,
};

const initialState = {
  items: [],
  page: 1,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  error: null,
  filters: initialFilters,
  current: null,
  currentLoading: false,
  actionError: null,
  actionLoading: false,
};

function buildQuery({ page = 1, filters = {} }) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', filters.limit ?? initialFilters.limit);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.assigned) params.set('assigned', filters.assigned);
  if (filters.dateFrom) params.set('from', filters.dateFrom);
  if (filters.dateTo) params.set('to', filters.dateTo);
  return params.toString();
}

function resolveCreatedAt(value) {
  const timestamp = value?.createdAt ?? value?.created_at;
  if (!timestamp) return 0;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function applyClientSort(items, sort) {
  if (!Array.isArray(items) || !items.length) return items;
  if (sort === 'oldest') {
    return [...items].sort((a, b) => resolveCreatedAt(a) - resolveCreatedAt(b));
  }

  return [...items].sort((a, b) => resolveCreatedAt(b) - resolveCreatedAt(a));
}

export const fetchAdminReports = createAsyncThunk(
  'adminReports/fetch',
  async ({ page = 1, filters = {} } = {}) => {
    const query = buildQuery({ page, filters });
    const { data } = await api.get(`/reports?${query}`);
    return { data, page, filters };
  }
);

export const updateReportStatus = createAsyncThunk(
  'adminReports/updateStatus',
  async ({ id, status, note }) => {
    const payload = note ? { status, note } : { status };
    const { data } = await api.put(`/reports/${id}`, payload);
    return data;
  }
);

export const assignReport = createAsyncThunk(
  'adminReports/assignReport',
  async ({ id, assignedTo, note }) => {
    const payload = note ? { assignedTo, note } : { assignedTo };
    const { data } = await api.put(`/reports/${id}`, payload);
    return data;
  }
);

export const fetchAdminReportById = createAsyncThunk(
  'adminReports/fetchById',
  async (id) => {
    const { data } = await api.get(`/reports/${id}`);
    return data;
  }
);

const adminReportsSlice = createSlice({
  name: 'adminReports',
  initialState,
  reducers: {
    setAdminFilters(state, action) {
      const { page, ...rest } = action.payload;
      state.filters = { ...state.filters, ...rest };
      if (typeof page === 'number') {
        state.page = page;
      } else {
        state.page = 1;
      }
    },
    resetAdminFilters(state) {
      state.filters = { ...initialFilters };
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReports.fulfilled, (state, action) => {
        state.loading = false;
        const { data, page, filters } = action.payload;
        const mergedFilters = { ...state.filters, ...filters };
        const incoming = data.items || [];
        state.items = applyClientSort(incoming, mergedFilters.sort);
        state.page = data.page || page;
        state.totalPages = data.totalPages || 1;
        state.totalItems = data.totalItems ?? state.items.length;
        state.filters = mergedFilters;
      })
      .addCase(fetchAdminReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load reports';
      })
      .addCase(updateReportStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.current && state.current.id === action.payload.id) {
          state.current = action.payload;
        }
        state.actionLoading = false;
      })
      .addCase(updateReportStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.error.message || 'Failed to update report';
      })
      .addCase(assignReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(assignReport.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.current && state.current.id === action.payload.id) {
          state.current = action.payload;
        }
        state.actionLoading = false;
      })
      .addCase(assignReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.error.message || 'Failed to assign report';
      })
      .addCase(fetchAdminReportById.pending, (state) => {
        state.currentLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminReportById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx === -1) {
          state.items = applyClientSort([...state.items, action.payload], state.filters.sort);
        } else {
          state.items[idx] = action.payload;
        }
      })
      .addCase(fetchAdminReportById.rejected, (state, action) => {
        state.currentLoading = false;
        state.error = action.error.message || 'Failed to load report';
      });
  }
});

export const { setAdminFilters, resetAdminFilters } = adminReportsSlice.actions;
export const selectAdminReportsState = (state) => state.adminReports;
export const selectAdminReportById = (state, id) =>
  state.adminReports.items.find((item) => String(item.id) === String(id)) ||
  (state.adminReports.current && String(state.adminReports.current.id) === String(id)
    ? state.adminReports.current
    : undefined);

export default adminReportsSlice.reducer;
