import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from '../features/reports/reportsSlice';

export const store = configureStore({
  reducer: { reports: reportsReducer }
});

// In plain JS apps we don't export types; just export store & dispatch if needed
export const AppDispatch = store.dispatch;