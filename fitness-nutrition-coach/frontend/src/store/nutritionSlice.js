import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nutritionAPI } from '../services/api';

/**
 * Generate meal plan
 */
export const generateMealPlan = createAsyncThunk('nutrition/generate', async (request, { rejectWithValue }) => {
  try {
    const response = await nutritionAPI.generateMealPlan(request);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to generate meal plan');
  }
});

/**
 * Fetch meal plans
 */
export const fetchMealPlans = createAsyncThunk('nutrition/fetchList', async (params, { rejectWithValue }) => {
  try {
    const response = await nutritionAPI.listMealPlans(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch meal plans');
  }
});

const initialState = {
  mealPlans: [],
  currentMealPlan: null,
  generatedMealPlan: null,
  loading: false,
  error: null,
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGenerated: (state) => {
      state.generatedMealPlan = null;
    },
  },
  extraReducers: (builder) => {
    // Generate Meal Plan
    builder
      .addCase(generateMealPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedMealPlan = action.payload;
      })
      .addCase(generateMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Meal Plans
    builder
      .addCase(fetchMealPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMealPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.mealPlans = action.payload.plans || [];
      })
      .addCase(fetchMealPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearGenerated } = nutritionSlice.actions;
export default nutritionSlice.reducer;
