import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../auth/authApi";

export const createReport = createAsyncThunk("reports/create", async (payload) => {
  const r = await API.post("/reports/", payload);
  return r.data;
});
export const fetchReports = createAsyncThunk("reports/fetch", async (params) => {
  const r = await API.get("/reports/", { params });
  return r.data;
});

const slice = createSlice({
  name: "reports",
  initialState: { items: [], meta: null, status: "idle" },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(createReport.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });
    builder.addCase(fetchReports.fulfilled, (state, action) => {
      state.items = action.payload.data;
      state.meta = action.payload.meta;
    });
  }
});
export default slice.reducer;
