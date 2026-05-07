import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../services/api';

/**
 * Fetch user profile
 */
export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await userAPI.getProfile();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch profile');
  }
});

/**
 * Update user profile
 */
export const updateUserProfile = createAsyncThunk('user/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const response = await userAPI.updateProfile(profileData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to update profile');
  }
});

/**
 * Fetch user metrics
 */
export const fetchUserMetrics = createAsyncThunk('user/fetchMetrics', async (_, { rejectWithValue }) => {
  try {
    const response = await userAPI.getMetrics();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch metrics');
  }
});

const initialState = {
  profile: null,
  metrics: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Metrics
    builder
      .addCase(fetchUserMetrics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchUserMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
