import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔵 [REQUEST] URL:', config.url);
    console.log('🔵 [REQUEST] Token exists:', !!token);
    if (token) {
      console.log('🔵 [REQUEST] Token value (first 30 chars):', token.substring(0, 30) + '...');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔵 [REQUEST] Authorization header SET:', `Bearer ${token.substring(0, 30)}...`);
      console.log('🔵 [REQUEST] All headers:', JSON.stringify(config.headers));
    } else {
      console.log('⚠️  [REQUEST] NO TOKEN FOUND - Request will fail if endpoint requires auth');
      console.log('⚠️  [REQUEST] Headers:', JSON.stringify(config.headers));
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ [RESPONSE] Success:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    console.error('❌ [RESPONSE] ERROR:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      isAuthEndpoint,
      requestHeaders: error.config?.headers,
    });
    
    if (error.response?.status === 401) {
      // TEMPORARY: Do NOT clear tokens during debugging
      // This helps us see if the token exists but backend rejects it
      console.log('🔴 [401-DEBUG] 401 Unauthorized received');
      console.log('🔴 [401-DEBUG] Endpoint:', error.config?.url);
      console.log('🔴 [401-DEBUG] Auth endpoint?:', isAuthEndpoint);
      console.log('🔴 [401-DEBUG] Token in localStorage:', localStorage.getItem('access_token') ? 'YES' : 'NO');
      console.log('🔴 [401-DEBUG] Token first 30 chars:', localStorage.getItem('access_token')?.substring(0, 30) || 'N/A');
      
      // TEMPORARILY DISABLED: Don't clear tokens to debug the issue
      // Uncomment this after debugging is complete
      // if (!isAuthEndpoint) {
      //   console.log('🔴 Clearing tokens due to 401');
      //   localStorage.removeItem('access_token');
      //   localStorage.removeItem('refresh_token');
      // }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyToken: () => apiClient.get('/auth/verify'),
};

export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (profileData) => apiClient.put('/users/profile', profileData),
  getMetrics: () => apiClient.get('/users/metrics'),
  updateGoals: (goals) => apiClient.put('/users/goals', { goals }),
};

export const workoutAPI = {
  generateWorkout: (request) => apiClient.post('/workouts/generate', request),
  listWorkouts: (params = {}) => apiClient.get('/workouts', { params }),
  getWorkout: (workoutId) => apiClient.get(`/workouts/${workoutId}`),
  updateWorkout: (workoutId, data) => apiClient.put(`/workouts/${workoutId}`, data),
  deleteWorkout: (workoutId) => apiClient.delete(`/workouts/${workoutId}`),
  completeExercise: (workoutId, exerciseId) => apiClient.post(`/workouts/${workoutId}/exercises/${exerciseId}/complete`),
};

export const nutritionAPI = {
  generateMealPlan: (request) => apiClient.post('/nutrition/generate', request),
  listMealPlans: (params = {}) => apiClient.get('/nutrition', { params }),
  getMealPlan: (planId) => apiClient.get(`/nutrition/${planId}`),
  updateMealPlan: (planId, data) => apiClient.put(`/nutrition/${planId}`, data),
  deleteMealPlan: (planId) => apiClient.delete(`/nutrition/${planId}`),
  logMeal: (mealData) => apiClient.post('/nutrition/log-meal', mealData),
};

export const chatAPI = {
  sendMessage: (message) => apiClient.post('/chat/send', { message }),
  getChatHistory: (params = {}) => apiClient.get('/chat/history', { params }),
  clearHistory: () => apiClient.post('/chat/clear-history'),
  sendFeedback: (messageId, feedback) => apiClient.post(`/chat/${messageId}/feedback`, { feedback }),
};

export const progressAPI = {
  logProgress: (progressData) => apiClient.post('/progress/log', progressData),
  getProgress: (params = {}) => apiClient.get('/progress', { params }),
  getAnalytics: (params = {}) => apiClient.get('/progress/analytics', { params }),
  deleteProgressEntry: (entryId) => apiClient.delete(`/progress/${entryId}`),
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};

export const getUserFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (err) {
    return null;
  }
};

export default apiClient;
