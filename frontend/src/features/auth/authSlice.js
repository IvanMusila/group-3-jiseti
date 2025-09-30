import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from './authApi';

// read token from localStorage if present
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
const savedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;


export const signupAsync = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch('https://jiseti-backend-zt8g.onrender.com/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        
        return rejectWithValue(data.error || data.message || 'Registration failed');
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('https://jiseti-backend-zt8g.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || data.message || 'Login failed');
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

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

// In your authSlice.js - add this async thunk
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


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
      
    .addCase(updateUser.fulfilled, (state, action) => {
      state.user = action.payload;
      
      localStorage.setItem('user', JSON.stringify(action.payload));
    })
    .addCase(updateUser.rejected, (state, action) => {
      state.error = action.payload;
    });
  }
});

export const { logout, setCredentials, clearError } = authSlice.actions;
export default authSlice.reducer;