// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import reportReducer from '../features/reports/reportSlice';

export const store = configureStore({
  reducer: {
    reports: reportReducer,
  },
});

export default store;
