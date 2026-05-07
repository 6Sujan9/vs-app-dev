# Frontend API Integration Guide

## API Client Setup

The frontend uses **Axios** as the HTTP client with automatic JWT authentication and token refresh.

### API Base URL

```javascript
// frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = process.env.REACT_APP_API_TIMEOUT || 10000;
```

### Authentication Flow

#### 1. Initial Login
```javascript
// User submits credentials
POST /api/v1/auth/login
Request: {
  email: "user@example.com",
  password: "password123"
}

Response: {
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refresh_token: "refresh_token_here...",
  user: {
    id: "uuid",
    email: "user@example.com",
    first_name: "John",
    last_name: "Doe"
  }
}

// Tokens are stored in localStorage
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);
```

#### 2. Subsequent API Calls
```javascript
// All API calls automatically include JWT token
// Request interceptor adds:
headers: {
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

#### 3. Token Refresh
```javascript
// When 401 Unauthorized is received:
// 1. Automatically call refresh endpoint
POST /api/v1/auth/refresh
Request: {
  refresh_token: "refresh_token_here"
}

Response: {
  access_token: "new_jwt_token"
}

// 2. Update localStorage
// 3. Retry original request
// 4. If refresh fails, redirect to /login
```

---

## Complete API Examples

### Authentication Endpoints

#### Register New User
```javascript
import { authAPI } from './services/api';

const handleRegister = async (formData) => {
  try {
    const response = await authAPI.register({
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      first_name: 'John',
      last_name: 'Doe'
    });

    const { access_token, refresh_token, user } = response.data;

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    // Redirect to profile setup
    navigate('/profile-setup');
  } catch (error) {
    console.error('Registration failed:', error.response.data);
    // Show error message to user
  }
};
```

#### Login
```javascript
import { authAPI } from './services/api';

const handleLogin = async (credentials) => {
  try {
    const response = await authAPI.login(
      credentials.email,
      credentials.password
    );

    const { access_token, refresh_token, user } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    // Dispatch Redux action with user data
    dispatch(loginUser(credentials));
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Invalid credentials');
    } else if (error.response?.status === 404) {
      console.error('User not found');
    }
  }
};
```

#### Logout
```javascript
import { authAPI } from './services/api';

const handleLogout = async () => {
  try {
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Dispatch Redux logout action
    dispatch(logoutUser());

    // Redirect to login
    navigate('/login');
  }
};
```

---

### User Profile Endpoints

#### Get User Profile
```javascript
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from './store/userSlice';

function ProfileComponent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch on component mount
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    // Component JSX
  );
}

// Direct API call example
import { userAPI } from './services/api';

const getProfile = async () => {
  try {
    const response = await userAPI.getProfile();
    console.log(response.data); // { id, email, age, weight, height, ... }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};
```

#### Update User Profile
```javascript
import { useDispatch } from 'react-redux';
import { updateUserProfile } from './store/userSlice';

const handleProfileUpdate = async (formData) => {
  const dispatch = useDispatch();

  try {
    const payload = {
      age: 30,
      weight: 75.5,
      height: 180,
      gender: 'male',
      fitness_level: 'intermediate',
      goals: ['muscle_gain', 'strength'],
      dietary_restrictions: ['gluten_free'],
      medical_conditions: 'None',
      profile_completed: true
    };

    const result = await dispatch(updateUserProfile(payload));

    if (result.payload) {
      console.log('Profile updated successfully');
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Profile update failed:', error);
  }
};
```

#### Get User Metrics
```javascript
import { userAPI } from './services/api';

const getMetrics = async () => {
  try {
    const response = await userAPI.getMetrics();
    console.log(response.data);
    // {
    //   weight: 75.5,
    //   body_fat: 22.5,
    //   muscle_mass: 58.3,
    //   measurements: {
    //     chest: 100,
    //     waist: 85,
    //     hips: 95
    //   }
    // }
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
};
```

---

### Workout Endpoints

#### Generate Workout Plan
```javascript
import { workoutAPI } from './services/api';

const generateWorkout = async () => {
  try {
    const response = await workoutAPI.generateWorkout({
      goal: 'muscle_gain',                    // Required
      duration_weeks: 4,                      // Required
      frequency_per_week: 4,                  // Required
      equipment: ['dumbbells', 'barbell'],    // Required
      intensity: 'moderate',                  // 'light', 'moderate', 'high', 'very_high'
      specific_requirements: 'Focus on chest and back' // Optional
    });

    const generatedWorkout = response.data;
    console.log(generatedWorkout);
    // {
    //   id: 'workout_uuid',
    //   user_id: 'user_uuid',
    //   plan_name: 'AI Generated Muscle Gain Program',
    //   description: '4-week intensive muscle building...',
    //   duration_weeks: 4,
    //   exercises: [
    //     {
    //       name: 'Barbell Bench Press',
    //       reps: 8,
    //       sets: 4,
    //       rest_seconds: 90,
    //       difficulty: 'hard'
    //     },
    //     // ... more exercises
    //   ],
    //   difficulty_level: 'hard',
    //   rag_documents_used: ['exercise_form_guide', 'periodization_principles'],
    //   bedrock_tokens_used: 2150,
    //   created_at: '2024-01-15T10:30:00Z'
    // }
  } catch (error) {
    console.error('Workout generation failed:', error.response?.data?.detail);
  }
};
```

#### Get Workouts List
```javascript
import { workoutAPI } from './services/api';

const getWorkouts = async () => {
  try {
    // With pagination
    const response = await workoutAPI.listWorkouts({
      limit: 10,
      offset: 0,
      sort_by: 'created_at',
      order: 'desc'
    });

    console.log(response.data);
    // {
    //   workouts: [...],
    //   total: 5,
    //   limit: 10,
    //   offset: 0
    // }
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
  }
};
```

#### Get Single Workout
```javascript
import { workoutAPI } from './services/api';

const getWorkout = async (workoutId) => {
  try {
    const response = await workoutAPI.getWorkout(workoutId);
    console.log(response.data); // Full workout details
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Workout not found');
    }
  }
};
```

#### Update Workout
```javascript
import { workoutAPI } from './services/api';

const updateWorkout = async (workoutId) => {
  try {
    const response = await workoutAPI.updateWorkout(workoutId, {
      plan_name: 'Modified Workout Plan',
      notes: 'Updated based on feedback'
    });

    console.log('Workout updated:', response.data);
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

#### Log Exercise Completion
```javascript
import { workoutAPI } from './services/api';

const completeExercise = async (workoutId, exerciseId) => {
  try {
    await workoutAPI.completeExercise(workoutId, exerciseId);
    console.log('Exercise marked as complete');
  } catch (error) {
    console.error('Failed to mark exercise complete:', error);
  }
};
```

---

### Nutrition Endpoints

#### Generate Meal Plan
```javascript
import { nutritionAPI } from './services/api';

const generateMealPlan = async () => {
  try {
    const response = await nutritionAPI.generateMealPlan({
      goal: 'weight_loss',                    // Required
      duration_days: 28,                      // Required
      meals_per_day: 3,                       // Required
      calorie_target: 'deficit',              // 'deficit', 'maintenance', 'surplus'
      diet_type: 'omnivore',                  // 'omnivore', 'vegetarian', 'vegan', 'keto', 'paleo'
      preferred_foods: ['chicken', 'rice', 'broccoli'],
      foods_to_avoid: ['dairy', 'nuts']
    });

    const mealPlan = response.data;
    console.log(mealPlan);
    // {
    //   id: 'plan_uuid',
    //   user_id: 'user_uuid',
    //   plan_name: 'AI Weight Loss Meal Plan',
    //   description: '28-day calorie deficit meal plan...',
    //   daily_calories: 2000,
    //   macros: {
    //     proteins: 150,
    //     carbs: 200,
    //     fats: 65
    //   },
    //   meals: [
    //     {
    //       meal_type: 'breakfast',
    //       foods: ['Oatmeal', 'Berries', 'Almonds'],
    //       calories: 400,
    //       macros: { proteins: 12, carbs: 60, fats: 10 }
    //     },
    //     // ... more meals
    //   ],
    //   rag_documents_used: ['macro_nutrition_guide', 'food_database'],
    //   bedrock_tokens_used: 1800,
    //   created_at: '2024-01-15T11:00:00Z'
    // }
  } catch (error) {
    console.error('Meal plan generation failed:', error);
  }
};
```

#### Get Meal Plans
```javascript
import { nutritionAPI } from './services/api';

const getMealPlans = async () => {
  try {
    const response = await nutritionAPI.listMealPlans({
      limit: 10,
      offset: 0
    });

    console.log(response.data.mealPlans);
  } catch (error) {
    console.error('Failed to fetch meal plans:', error);
  }
};
```

#### Log Meal
```javascript
import { nutritionAPI } from './services/api';

const logMeal = async (mealData) => {
  try {
    await nutritionAPI.logMeal({
      date: '2024-01-15',
      meal_type: 'breakfast',      // 'breakfast', 'lunch', 'dinner', 'snack'
      foods: ['Eggs', 'Toast', 'Juice'],
      calories: 450,
      macros: {
        proteins: 15,
        carbs: 50,
        fats: 18
      },
      notes: 'Felt good after this meal'
    });

    console.log('Meal logged successfully');
  } catch (error) {
    console.error('Failed to log meal:', error);
  }
};
```

---

### Chat Endpoints

#### Send Chat Message
```javascript
import { chatAPI } from './services/api';

const sendChatMessage = async (userMessage) => {
  try {
    const response = await chatAPI.sendMessage(userMessage);

    console.log(response.data);
    // {
    //   message_id: 'msg_uuid',
    //   response: 'Here is a workout plan for beginners...',
    //   metadata: {
    //     sources: ['exercise_guide.pdf', 'training_principles.md'],
    //     model_used: 'claude-3-sonnet',
    //     tokens_used: 450,
    //     context_retrieved: true
    //   }
    // }
  } catch (error) {
    console.error('Chat failed:', error);
  }
};

// Example in React component
function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (userInput) => {
    setLoading(true);
    try {
      const response = await chatAPI.sendMessage(userInput);

      setMessages(prev => [
        ...prev,
        { type: 'user', content: userInput },
        { type: 'ai', content: response.data.response }
      ]);
    } catch (error) {
      // Show error
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX
  );
}
```

#### Get Chat History
```javascript
import { chatAPI } from './services/api';

const getChatHistory = async () => {
  try {
    const response = await chatAPI.getChatHistory({
      limit: 50,
      offset: 0
    });

    console.log(response.data.messages);
    // [
    //   {
    //     id: 'msg_uuid',
    //     user_message: 'Create a workout for beginners',
    //     ai_response: 'Here is a beginner-friendly workout...',
    //     timestamp: '2024-01-15T10:30:00Z'
    //   },
    //   // ... more messages
    // ]
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
  }
};
```

---

### Progress Tracking Endpoints

#### Log Progress Entry
```javascript
import { progressAPI } from './services/api';

const logProgress = async () => {
  try {
    const response = await progressAPI.logProgress({
      date: new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'
      weight: 75.5,                                   // kg
      exercises_completed: 3,
      meals_logged: 3,
      notes: 'Great workout today! Felt strong.',
      metrics: {
        body_fat: 22.5,                              // percentage
        muscle_mass: 58.3,                           // kg
        measurements: {
          chest: 100,                                // cm
          waist: 85,
          hips: 95,
          thighs: 60,
          arms: 35
        }
      }
    });

    console.log('Progress logged:', response.data);
  } catch (error) {
    console.error('Failed to log progress:', error);
  }
};
```

#### Get Progress History
```javascript
import { progressAPI } from './services/api';

const getProgressHistory = async () => {
  try {
    const response = await progressAPI.getProgress({
      limit: 30,
      offset: 0,
      sort_by: 'date',
      order: 'desc'
    });

    console.log(response.data);
    // {
    //   entries: [
    //     {
    //       id: 'entry_uuid',
    //       date: '2024-01-15',
    //       weight: 75.5,
    //       metrics: { ... }
    //     },
    //     // ... more entries
    //   ],
    //   total: 30
    // }
  } catch (error) {
    console.error('Failed to fetch progress:', error);
  }
};
```

#### Get Progress Analytics
```javascript
import { progressAPI } from './services/api';

const getAnalytics = async () => {
  try {
    const response = await progressAPI.getAnalytics({
      days: 90  // Last 90 days
    });

    console.log(response.data);
    // {
    //   period: '90 days',
    //   weight_loss: 5.5,
    //   avg_weight: 74.2,
    //   weight_trend: 'down',
    //   body_fat_change: -2.5,
    //   muscle_mass_change: 1.2,
    //   avg_daily_calories: 2100,
    //   workouts_completed: 45,
    //   meals_logged: 87
    // }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
  }
};
```

---

## Error Handling Best Practices

```javascript
import { getErrorMessage } from './services/api';

// Generic error handler
const handleApiError = (error) => {
  const message = getErrorMessage(error);

  if (error.response?.status === 401) {
    // Unauthorized - token invalid or expired
    localStorage.clear();
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Forbidden
    console.error('Access denied');
  } else if (error.response?.status === 404) {
    // Not found
    console.error('Resource not found');
  } else if (error.response?.status === 500) {
    // Server error
    console.error('Server error - please try again later');
  } else if (error.code === 'ECONNABORTED') {
    // Timeout
    console.error('Request timeout - please check your connection');
  } else {
    // Generic error
    console.error(message);
  }
};
```

## Request/Response Examples

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Success Response (200)
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Error Response (400/401/500)
```json
{
  "detail": "Invalid credentials",
  "error_code": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

This comprehensive guide covers all API integration scenarios for the fitness coach application.
