import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workoutAPI } from '../services/api';

/**
 * Generate workout plan
 */
export const generateWorkout = createAsyncThunk('workout/generate', async (request, { rejectWithValue }) => {
  try {
    const response = await workoutAPI.generateWorkout(request);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to generate workout');
  }
});

/**
 * Fetch user workouts
 */
export const fetchWorkouts = createAsyncThunk('workout/fetchList', async (params, { rejectWithValue }) => {
  try {
    const response = await workoutAPI.listWorkouts(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch workouts');
  }
});

/**
 * Delete workout
 */
export const deleteWorkout = createAsyncThunk('workout/delete', async (workoutId, { rejectWithValue }) => {
  try {
    await workoutAPI.deleteWorkout(workoutId);
    return workoutId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to delete workout');
  }
});

/**
 * Fetch single workout
 */
export const fetchWorkout = createAsyncThunk('workout/fetchOne', async (workoutId, { rejectWithValue }) => {
  try {
    const response = await workoutAPI.getWorkout(workoutId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch workout');
  }
});

const initialState = {
  workouts: [],
  currentWorkout: null,
  generatedWorkout: null,
  loading: false,
  error: null,
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGenerated: (state) => {
      state.generatedWorkout = null;
    },
  },
  extraReducers: (builder) => {
    // Generate Workout
    builder
      .addCase(generateWorkout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateWorkout.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedWorkout = action.payload;
      })
      .addCase(generateWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Workouts
    builder
      .addCase(fetchWorkouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload.plans || [];
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Workout
    builder
      .addCase(deleteWorkout.fulfilled, (state, action) => {
        state.workouts = state.workouts.filter((w) => w.id !== action.payload);
      });

    // Fetch Single Workout
    builder
      .addCase(fetchWorkout.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkout.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkout = action.payload;
      })
      .addCase(fetchWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearGenerated } = workoutSlice.actions;
export default workoutSlice.reducer;
