import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://3.26.116.247:8000/api/v1';

// Called by AuthContext to inject the logout function so api.js can trigger it
let _onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => { _onSessionExpired = handler; };

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await AsyncStorage.getItem('access_token');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const config = {
    method: options.method || 'GET',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        const isAuthEndpoint = endpoint.includes('/auth/');
        if (!isAuthEndpoint && _onSessionExpired) {
          // Auto-logout and redirect to login screen
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('user_data');
          _onSessionExpired();
          return;
        }
        throw new Error(isAuthEndpoint ? 'Invalid email or password' : 'Session expired. Please login again.');
      }
      // FastAPI validation errors return detail as an array
      const detail = data.detail;
      if (Array.isArray(detail)) {
        const msg = detail.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ');
        throw new Error(msg);
      }
      throw new Error(detail || data.message || 'Request failed');
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(
        `Cannot connect to server at ${API_BASE_URL}.\n\nCheck:\n1. EC2 instance is running\n2. Port 8000 is open in the security group\n3. Backend service is started on EC2`
      );
    }
    throw err;
  }
};

export const authAPI = {
  register: (userData) => makeRequest('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => makeRequest('/auth/login', { method: 'POST', body: credentials }),
};

export const userAPI = {
  getProfile: () => makeRequest('/users/profile'),
  updateProfile: (data) => makeRequest('/users/profile', { method: 'POST', body: data }),
};

export const workoutAPI = {
  getWorkouts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return makeRequest(`/workouts/${q ? '?' + q : ''}`);
  },
  generateWorkout: (data) => makeRequest('/workouts/generate', { method: 'POST', body: data }),
  updateWorkout: (id, data) => makeRequest(`/workouts/${id}`, { method: 'PATCH', body: data }),
  deleteWorkout: (id) => makeRequest(`/workouts/${id}`, { method: 'DELETE' }),
};

export const nutritionAPI = {
  getMealPlans: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return makeRequest(`/nutrition/${q ? '?' + q : ''}`);
  },
  generateMealPlan: (data) => makeRequest('/nutrition/generate', { method: 'POST', body: data }),
  updateMealPlan: (id, data) => makeRequest(`/nutrition/${id}`, { method: 'PATCH', body: data }),
  deleteMealPlan: (id) => makeRequest(`/nutrition/${id}`, { method: 'DELETE' }),
};

export const chatAPI = {
  sendMessage: (message) => makeRequest('/chat/send', { method: 'POST', body: { message } }),
  getChatHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return makeRequest(`/chat/history${q ? '?' + q : ''}`);
  },
};

export const progressAPI = {
  logProgress: (data) => makeRequest('/progress/log', { method: 'POST', body: data }),
  getProgress: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return makeRequest(`/progress/${q ? '?' + q : ''}`);
  },
  updateProgress: (id, data) => makeRequest(`/progress/${id}`, { method: 'PATCH', body: data }),
  deleteProgress: (id) => makeRequest(`/progress/${id}`, { method: 'DELETE' }),
  getAnalytics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return makeRequest(`/progress/analytics${q ? '?' + q : ''}`);
  },
};

export const getErrorMessage = (error) => error?.message || 'An error occurred. Please try again.';
