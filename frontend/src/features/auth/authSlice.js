import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from './authApi';

// read token from localStorage if present
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
const savedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

export const signupAsync = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const res = await authApi.signup(userData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const loginAsync = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authApi.login(credentials); // expects { access_token, user }
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Add logout async thunk
export const logoutAsync = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // Optional: Call backend logout endpoint if you have one
    // await authApi.logout();
    return true;
  } catch (err) {
    // Even if backend call fails, we still want to clear local storage
    console.error('Logout API call failed:', err);
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    accessToken: savedToken,
    user: savedUser,
    loading: false,
    error: null,
    isAuthenticated: !!savedToken
  },
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    setCredentials(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // signup
      .addCase(signupAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signupAsync.fulfilled, (state, action) => {
        state.loading = false;
        // assume backend may return tokens on register, else the user should log in
      })
      .addCase(signupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Signup failed';
      })
      // login
      .addCase(loginAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        // expecting { access_token: '...', user: {...} }
        const { access_token, user } = action.payload;
        state.accessToken = access_token;
        state.user = user;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // logout
      .addCase(logoutAsync.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        // Even if the API call fails, we still clear local state
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload?.message || 'Logout failed';
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      })
  }
});

export const { logout, setCredentials, clearError } = authSlice.actions;
export default authSlice.reducer;