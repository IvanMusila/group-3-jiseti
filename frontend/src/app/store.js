import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from '../features/reports/reportsSlice';

export const store = configureStore({
  reducer: { reports: reportsReducer }
});

// Plain JS app: export store; dispatch is accessible via hooks where needed.
export const AppDispatch = store.dispatch;