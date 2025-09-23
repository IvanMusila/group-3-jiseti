<<<<<<< HEAD
import { configureStore } from '@reduxjs/toolkit';
import reportsReducer from '../features/reports/reportsSlice';

export const store = configureStore({
  reducer: { reports: reportsReducer }
});

// Plain JS app: export store; dispatch is accessible via hooks where needed.
export const AppDispatch = store.dispatch;
=======
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import reportsReducer from "../features/reports/reportsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer
  }
});
>>>>>>> develop
