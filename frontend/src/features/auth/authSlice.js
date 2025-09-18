import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { setAuthToken } from "../../api/api";

export const signup = createAsyncThunk("auth/signup", async (payload) => {
  const r = await API.post("/auth/signup", payload);
  return r.data;
});
export const login = createAsyncThunk("auth/login", async (payload) => {
  const r = await API.post("/auth/login", payload);
  return r.data;
});

const token = localStorage.getItem("token");
if (token) setAuthToken(token);

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, token: token || null, status: "idle", error: null },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      setAuthToken(null);
    }
  },
  extraReducers: builder => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
      setAuthToken(action.payload.token);
    });
    builder.addCase(signup.fulfilled, (state) => {
      state.status = "signedup";
    });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
