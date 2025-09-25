import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import reportsReducer from '../features/reports/reportsSlice';
import adminReportsReducer from '../features/adminReports/adminReportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer,
    adminReports: adminReportsReducer,
  },
});

export const AppDispatch = store.dispatch;
