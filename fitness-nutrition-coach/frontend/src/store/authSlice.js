import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, getUserFromToken } from '../services/api';

/**
 * Login async thunk
 */
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    console.log('🔵 Login thunk called with:', credentials.email);
    const response = await authAPI.login(credentials.email, credentials.password);
    console.log('🔵 Login API response received');
    const { access_token, refresh_token, user } = response.data;

    // Store tokens in localStorage
    console.log('💾 Storing tokens in localStorage');
    console.log('💾 access_token:', access_token ? `${access_token.substring(0, 20)}...` : 'MISSING');
    console.log('💾 refresh_token:', refresh_token ? `${refresh_token.substring(0, 20)}...` : 'MISSING');
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    // Verify tokens were stored
    const verifyToken = localStorage.getItem('access_token');
    console.log('✅ Verification - access_token in localStorage:', verifyToken ? `${verifyToken.substring(0, 20)}...` : 'FAILED');

    const payload = {
      user,
      access_token,
      refresh_token,
      isAuthenticated: true,
    };
    console.log('🔵 Login thunk returning authenticated payload');
    return payload;
  } catch (error) {
    console.error('❌ Login thunk error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

/**
 * Register async thunk
 */
export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    console.log('Register thunk called with:', userData);
    const response = await authAPI.register(userData);
    console.log('Register API response:', response);
    const { access_token, refresh_token, user } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    console.log('Tokens stored in localStorage');

    const payload = {
      user,
      access_token,
      refresh_token,
      isAuthenticated: true,
    };
    console.log('Register thunk returning:', payload);
    return payload;
  } catch (error) {
    console.error('Register thunk error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Registration failed');
  }
});

/**
 * Logout async thunk
 */
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authAPI.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  }
});

/**
 * Check auth status on app load
 */
export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('access_token');
    console.log('checkAuthStatus: token from localStorage:', token ? 'present' : 'null');
    if (!token) {
      console.log('checkAuthStatus: No token, returning null');
      return null;
    }

    console.log('checkAuthStatus: Verifying token with API');
    const response = await authAPI.verifyToken();
    console.log('checkAuthStatus: API response:', response);
    const result = {
      user: response.data.user,
      isAuthenticated: true,
    };
    console.log('checkAuthStatus: Returning:', result);
    return result;
  } catch (error) {
    console.error('checkAuthStatus: Error verifying token:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return null;
  }
});

const initialState = {
  user: null,
  access_token: localStorage.getItem('access_token'),
  refresh_token: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    handleUnauthorized: (state) => {
      // Called when 401 is received from API
      state.user = null;
      state.access_token = null;
      state.refresh_token = null;
      state.isAuthenticated = false;
      state.error = 'Session expired. Please login again.';
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.access_token = null;
        state.refresh_token = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Check Auth Status
    builder
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      });
  },
});

export const { clearError, handleUnauthorized } = authSlice.actions;
export default authSlice.reducer;
