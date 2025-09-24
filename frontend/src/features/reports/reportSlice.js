import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reports: [],   // ✅ match test expectations
};

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    addReport: (state, action) => {
      state.reports.push({
        id: Date.now(),
        ...action.payload,
        status: "pending",
      });
    },
    editReport: (state, action) => {
      const { id, updates } = action.payload;
      const report = state.reports.find((r) => r.id === id);
      if (report && report.status === "pending") {
        Object.assign(report, updates);
      }
    },
    deleteReport: (state, action) => {
      const id = action.payload;
      state.reports = state.reports.filter((r) => r.id !== id);
    },
  },
});

export const { addReport, editReport, deleteReport } = reportSlice.actions;
export default reportSlice.reducer;
