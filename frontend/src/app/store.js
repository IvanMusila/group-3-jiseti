import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReportsReducer from '../features/adminReports/adminReportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminReports: adminReportsReducer,
  },
});

export const AppDispatch = store.dispatch;
