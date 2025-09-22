import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from '../features/reports/reportsSlice';
export const store = configureStore({ reducer: { reports: reportsReducer } });
export const AppDispatch = store.dispatch;