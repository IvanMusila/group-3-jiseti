import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReportsReducer from '../features/adminReports/adminReportsSlice';
import reportsReducer from '../features/reports/reportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminReports: adminReportsReducer,
    reports: reportsReducer,
  },
});

export const AppDispatch = store.dispatch;
