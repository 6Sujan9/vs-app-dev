import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import workoutReducer from './workoutSlice';
import nutritionReducer from './nutritionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    workout: workoutReducer,
    nutrition: nutritionReducer,
  },
});

export default store;
