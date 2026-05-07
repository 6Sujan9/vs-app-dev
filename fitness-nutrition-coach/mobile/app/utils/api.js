// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
  },
  users: {
    profile: '/users/profile',
    metrics: '/users/metrics',
  },
  workouts: {
    generate: '/workouts/generate',
    list: '/workouts/',
    detail: (id) => `/workouts/${id}`,
  },
  nutrition: {
    generate: '/nutrition/generate',
    list: '/nutrition/',
    detail: (id) => `/nutrition/${id}`,
  },
  chat: {
    send: '/chat/send',
    history: '/chat/history',
  },
  progress: {
    log: '/progress/log',
    list: '/progress/',
    analytics: '/progress/analytics',
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Helper function to get auth token
const getAuthToken = () => {
  // In a real app, this would come from secure storage
  return null; // TODO: Implement secure token storage
};

// Helper function to make API requests
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  register: async (userData) => {
    return makeRequest(endpoints.auth.register, {
      method: 'POST',
      body: userData,
    });
  },

  login: async (credentials) => {
    return makeRequest(endpoints.auth.login, {
      method: 'POST',
      body: credentials,
    });
  },

  refreshToken: async (refreshToken) => {
    return makeRequest(endpoints.auth.refresh, {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  },
};

// ============================================================================
// USER API
// ============================================================================

export const userAPI = {
  getProfile: async () => {
    return makeRequest(endpoints.users.profile);
  },

  updateProfile: async (profileData) => {
    return makeRequest(endpoints.users.profile, {
      method: 'PUT',
      body: profileData,
    });
  },

  updateMetrics: async (metricsData) => {
    return makeRequest(endpoints.users.metrics, {
      method: 'PUT',
      body: metricsData,
    });
  },
};

// ============================================================================
// WORKOUT API
// ============================================================================

export const workoutAPI = {
  generateWorkout: async (workoutRequest) => {
    return makeRequest(endpoints.workouts.generate, {
      method: 'POST',
      body: workoutRequest,
    });
  },

  getWorkouts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${endpoints.workouts.list}?${queryString}` : endpoints.workouts.list;
    return makeRequest(endpoint);
  },

  getWorkout: async (id) => {
    return makeRequest(endpoints.workouts.detail(id));
  },
};

// ============================================================================
// NUTRITION API
// ============================================================================

export const nutritionAPI = {
  generateNutrition: async (nutritionRequest) => {
    return makeRequest(endpoints.nutrition.generate, {
      method: 'POST',
      body: nutritionRequest,
    });
  },

  getNutritionPlans: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${endpoints.nutrition.list}?${queryString}` : endpoints.nutrition.list;
    return makeRequest(endpoint);
  },

  getNutritionPlan: async (id) => {
    return makeRequest(endpoints.nutrition.detail(id));
  },
};

// ============================================================================
// CHAT API
// ============================================================================

export const chatAPI = {
  sendMessage: async (message) => {
    return makeRequest(endpoints.chat.send, {
      method: 'POST',
      body: { message },
    });
  },

  getChatHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${endpoints.chat.history}?${queryString}` : endpoints.chat.history;
    return makeRequest(endpoint);
  },
};

// ============================================================================
// PROGRESS API
// ============================================================================

export const progressAPI = {
  logProgress: async (progressData) => {
    return makeRequest(endpoints.progress.log, {
      method: 'POST',
      body: progressData,
    });
  },

  getProgress: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${endpoints.progress.list}?${queryString}` : endpoints.progress.list;
    return makeRequest(endpoint);
  },

  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${endpoints.progress.analytics}?${queryString}` : endpoints.progress.analytics;
    return makeRequest(endpoint);
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getErrorMessage = (error) => {
  if (error.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};
