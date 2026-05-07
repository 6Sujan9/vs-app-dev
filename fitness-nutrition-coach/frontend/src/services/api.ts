"""
Frontend API Client Service
Handles all communication with backend API
Demonstrates proper error handling, loading states, and response handling
"""

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Interceptors
// ============================================================================

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response] ${response.status} | ` +
      `Duration: ${response.config.metadata?.duration}ms`
    );
    return response;
  },
  (error: AxiosError) => {
    console.error('[API Response Error]', error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Track request duration
apiClient.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    response.config.metadata.duration = Date.now() - response.config.metadata.startTime;
    return response;
  },
  (error) => {
    if (error.config?.metadata) {
      error.config.metadata.duration = Date.now() - error.config.metadata.startTime;
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API Response Types
// ============================================================================

interface APIResponse<T> {
  success: boolean;
  request_id: string;
  data: T;
  error?: string;
  metadata?: Record<string, any>;
  rag_context?: {
    documents_retrieved: number;
    citations: Array<{ source: string; score: string }>;
  };
  metrics?: {
    processing_time_seconds: number;
    tokens_used: number;
    cost_estimate: string;
  };
}

interface WorkoutPlanResponse {
  plan_id: number;
  plan_name: string;
  goal: string;
  duration_weeks: number;
  frequency: number;
  workout: Record<string, any>;
}

interface NutritionPlanResponse {
  plan_id: number;
  plan_name: string;
  goal: string;
  diet_type: string;
  daily_calories: number;
  meal_plan: Record<string, any>;
}

interface ChatResponse {
  message_id: number;
  conversation_id: string;
  response: string;
  message_type: string;
}

// ============================================================================
// Error Handling
// ============================================================================

class APIError extends Error {
  requestId: string;
  statusCode: number;
  originalError: AxiosError;

  constructor(
    message: string,
    requestId: string,
    statusCode: number,
    originalError: AxiosError
  ) {
    super(message);
    this.name = 'APIError';
    this.requestId = requestId;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

function handleAPIError(error: any): never {
  const statusCode = error.response?.status || 500;
  const data = error.response?.data;
  const requestId = data?.request_id || 'unknown';
  const message = data?.detail || data?.error || error.message || 'Unknown error';

  console.error(`[API Error] ${statusCode} | ID: ${requestId} | ${message}`);

  throw new APIError(message, requestId, statusCode, error);
}

// ============================================================================
// Workout API
// ============================================================================

export const WorkoutAPI = {
  /**
   * Generate personalized workout plan
   * Flow: Frontend → Backend → RAG → Bedrock → Database → Response
   */
  async generateWorkout(params: {
    goal: string;
    duration_weeks?: number;
    frequency?: number;
    intensity?: string;
    equipment?: string[];
  }) {
    try {
      console.log('[Workout] Generating workout plan...', params);
      
      const response = await apiClient.post<APIResponse<WorkoutPlanResponse>>(
        '/ai/workout/generate',
        null,
        { params }
      );

      console.log('[Workout] Generation successful', {
        planId: response.data.data.plan_id,
        processingTime: response.data.metrics?.processing_time_seconds,
        tokensUsed: response.data.metrics?.tokens_used,
        documentsRetrieved: response.data.rag_context?.documents_retrieved,
      });

      return {
        success: true,
        requestId: response.data.request_id,
        plan: response.data.data,
        citations: response.data.rag_context?.citations || [],
        metrics: response.data.metrics,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Get active workout plan
   */
  async getActiveWorkout() {
    try {
      console.log('[Workout] Fetching active workout...');
      
      const response = await apiClient.get('/workouts/active');
      
      return {
        success: true,
        plan: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Get all workout plans
   */
  async getAllWorkouts() {
    try {
      console.log('[Workout] Fetching all workouts...');
      
      const response = await apiClient.get('/workouts');
      
      return {
        success: true,
        plans: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },
};

// ============================================================================
// Nutrition API
// ============================================================================

export const NutritionAPI = {
  /**
   * Generate personalized nutrition plan
   * Flow: Frontend → Backend → RAG → Bedrock → Database → Response
   */
  async generateNutritionPlan(params: {
    goal: string;
    diet_type?: string;
    duration_days?: number;
    meals_per_day?: number;
    daily_calories?: number;
  }) {
    try {
      console.log('[Nutrition] Generating meal plan...', params);
      
      const response = await apiClient.post<APIResponse<NutritionPlanResponse>>(
        '/ai/nutrition/generate',
        null,
        { params }
      );

      console.log('[Nutrition] Generation successful', {
        planId: response.data.data.plan_id,
        processingTime: response.data.metrics?.processing_time_seconds,
        tokensUsed: response.data.metrics?.tokens_used,
        documentsRetrieved: response.data.rag_context?.documents_retrieved,
      });

      return {
        success: true,
        requestId: response.data.request_id,
        plan: response.data.data,
        citations: response.data.rag_context?.citations || [],
        metrics: response.data.metrics,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Get active diet plan
   */
  async getActiveDietPlan() {
    try {
      console.log('[Nutrition] Fetching active diet plan...');
      
      const response = await apiClient.get('/diet/active');
      
      return {
        success: true,
        plan: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },
};

// ============================================================================
// Chat API
// ============================================================================

export const ChatAPI = {
  /**
   * Send message to AI coach
   * Flow: Frontend → Backend → RAG → Bedrock → Database → Response
   */
  async sendMessage(params: {
    message: string;
    conversation_id?: string;
    message_type?: string;
  }) {
    try {
      console.log('[Chat] Sending message...', { message: params.message.substring(0, 50) });
      
      const response = await apiClient.post<APIResponse<ChatResponse>>(
        '/ai/chat',
        null,
        { params }
      );

      console.log('[Chat] Response received', {
        messageId: response.data.data.message_id,
        processingTime: response.data.metrics?.processing_time_seconds,
        tokensUsed: response.data.metrics?.tokens_used,
        documentsRetrieved: response.data.rag_context?.documents_retrieved,
      });

      return {
        success: true,
        requestId: response.data.request_id,
        message: response.data.data,
        citations: response.data.rag_context?.citations || [],
        metrics: response.data.metrics,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string) {
    try {
      console.log('[Chat] Fetching conversation...', { conversationId });
      
      const response = await apiClient.get(`/chat/conversations/${conversationId}`);
      
      return {
        success: true,
        messages: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Rate a message
   */
  async rateMessage(messageId: number, rating: number) {
    try {
      console.log('[Chat] Rating message...', { messageId, rating });
      
      await apiClient.post(`/chat/${messageId}/rate`, { rating });
      
      return { success: true };
    } catch (error) {
      handleAPIError(error);
    }
  },
};

// ============================================================================
// Dashboard API
// ============================================================================

export const DashboardAPI = {
  /**
   * Get complete dashboard with insights
   */
  async getDashboard() {
    try {
      console.log('[Dashboard] Fetching dashboard...');
      
      const response = await apiClient.get('/ai/dashboard');
      
      console.log('[Dashboard] Loaded', {
        processingTime: response.data.metrics?.processing_time_seconds,
      });

      return {
        success: true,
        dashboard: response.data.data.dashboard,
        insights: response.data.data.insights,
        metrics: response.data.metrics,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },
};

// ============================================================================
// Profile API
// ============================================================================

export const ProfileAPI = {
  /**
   * Create user profile
   */
  async createProfile(profileData: Record<string, any>) {
    try {
      console.log('[Profile] Creating profile...');
      
      const response = await apiClient.post('/profile', profileData);
      
      return {
        success: true,
        profile: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      console.log('[Profile] Fetching profile...');
      
      const response = await apiClient.get('/profile');
      
      return {
        success: true,
        profile: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: Record<string, any>) {
    try {
      console.log('[Profile] Updating profile...');
      
      const response = await apiClient.put('/profile', profileData);
      
      return {
        success: true,
        profile: response.data,
      };
    } catch (error) {
      handleAPIError(error);
    }
  },
};

// ============================================================================
// Export API Client
// ============================================================================

export const APIClient = {
  workout: WorkoutAPI,
  nutrition: NutritionAPI,
  chat: ChatAPI,
  dashboard: DashboardAPI,
  profile: ProfileAPI,
  client: apiClient,
};

export default APIClient;
