import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import reportsReducer from "../features/reports/reportsSlice";

export default configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer
  }
});
