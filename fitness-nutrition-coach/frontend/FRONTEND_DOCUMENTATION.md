# Frontend Documentation - Fitness & Nutrition Coach

## Project Overview

This is a React-based frontend for the AI-powered Fitness and Nutrition Coach application. It provides a user-friendly interface for:
- User authentication
- Profile management
- AI-generated workout plans
- AI-generated nutrition/meal plans
- Real-time AI chat assistant
- Progress tracking and analytics

## Tech Stack

- **Framework**: React 18.2.0
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 with CSS Grid/Flexbox
- **Package Manager**: npm

## Folder Structure

```
frontend/
├── public/                      # Static files
│   └── index.html              # Main HTML file
├── src/
│   ├── components/             # React components
│   │   ├── Auth/               # Authentication components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Dashboard/          # Main dashboard
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkoutGenerator.jsx
│   │   │   ├── NutritionGenerator.jsx
│   │   │   └── ProgressLogger.jsx
│   │   ├── Chat/               # Chat interface
│   │   │   └── ChatInterface.jsx
│   │   ├── UserProfile/        # User management
│   │   │   └── ProfileSetup.jsx
│   │   └── styles/             # CSS files
│   ├── services/
│   │   └── api.js              # API client
│   ├── store/                  # Redux store
│   │   ├── store.js            # Store configuration
│   │   ├── authSlice.js        # Auth reducer
│   │   ├── userSlice.js        # User reducer
│   │   ├── workoutSlice.js     # Workout reducer
│   │   └── nutritionSlice.js   # Nutrition reducer
│   ├── App.jsx                 # Main app component
│   └── index.js                # App entry point
├── .env.example                # Environment variables template
├── package.json                # Dependencies
└── README.md                   # Setup guide
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENV=development
```

### 3. Start Development Server

```bash
npm start
```

App will open at `http://localhost:3000`

## Project Structure & Components

### Authentication Flow

#### Login Component
```jsx
// Location: src/components/Auth/Login.jsx
// Page: /login
// Features:
// - Email & password input
// - Form validation
// - Error handling
// - Link to register page
```

#### Register Component
```jsx
// Location: src/components/Auth/Register.jsx
// Page: /register
// Features:
// - First/last name input
// - Email & password validation
// - Password confirmation
// - Auto-redirect to profile setup
```

#### Protected Route
```jsx
// Wraps routes that require authentication
// Redirects to /login if not authenticated
```

### Dashboard

Main hub after login with tabs for:
- **Overview**: Latest workout and meal plan
- **Workouts**: List and manage workout plans
- **Nutrition**: List and manage meal plans
- **Progress**: Track weight, measurements, metrics

### Workout Generator

```jsx
// Component: WorkoutGenerator.jsx
// Generates AI workout plans with:
// - Fitness goal selection
// - Duration (weeks)
// - Frequency (sessions/week)
// - Equipment availability
// - Intensity level
// - Specific requirements
```

### Nutrition Generator

```jsx
// Component: NutritionGenerator.jsx
// Generates AI meal plans with:
// - Nutrition goal
// - Duration
// - Meals per day
// - Calorie target
// - Diet type (omnivore, vegan, keto, etc.)
// - Preferred/avoided foods
```

### Chat Interface

```jsx
// Component: ChatInterface.jsx
// Page: /chat
// Features:
// - ChatGPT-like interface
// - Real-time message display
// - Typing indicator
// - Source attribution
// - Clear history option
// - Error handling
```

### Progress Logger

```jsx
// Component: ProgressLogger.jsx
// Logs fitness progress:
// - Weight
// - Body fat percentage
// - Muscle mass
// - Body measurements (chest, waist, hips, arms)
// - Exercises completed
// - Meals logged
// - Notes
```

## API Integration Examples

### Authentication

```javascript
// Login
import { authAPI } from './services/api';

const response = await authAPI.login('user@example.com', 'password123');
// Returns: { access_token, refresh_token, user }

// Register
const response = await authAPI.register({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
});
// Returns: { access_token, refresh_token, user }

// Logout
await authAPI.logout();
```

### User Profile

```javascript
import { userAPI } from './services/api';

// Get profile
const profile = await userAPI.getProfile();
// Returns: { id, email, age, weight, height, fitness_level, goals, ... }

// Update profile
const updated = await userAPI.updateProfile({
  age: 30,
  weight: 75,
  height: 180,
  fitness_level: 'intermediate',
  goals: ['muscle_gain', 'strength']
});

// Get metrics
const metrics = await userAPI.getMetrics();
// Returns: { weight, body_fat, muscle_mass, measurements, ... }
```

### Workouts

```javascript
import { workoutAPI } from './services/api';

// Generate workout
const workout = await workoutAPI.generateWorkout({
  goal: 'muscle_gain',
  duration_weeks: 4,
  frequency_per_week: 4,
  equipment: ['dumbbells', 'barbell'],
  intensity: 'moderate',
  specific_requirements: 'Focus on upper body'
});
// Returns: { id, plan_name, description, exercises, rag_documents_used, ... }

// Get workouts list
const workouts = await workoutAPI.listWorkouts({ limit: 10 });
// Returns: { workouts: [...] }

// Get specific workout
const workout = await workoutAPI.getWorkout('workout_id');

// Update workout
const updated = await workoutAPI.updateWorkout('workout_id', { plan_name: 'New Name' });

// Delete workout
await workoutAPI.deleteWorkout('workout_id');

// Log exercise completion
await workoutAPI.completeExercise('workout_id', 'exercise_id');
```

### Nutrition Plans

```javascript
import { nutritionAPI } from './services/api';

// Generate meal plan
const mealPlan = await nutritionAPI.generateMealPlan({
  goal: 'weight_loss',
  duration_days: 28,
  meals_per_day: 3,
  calorie_target: 'deficit',
  diet_type: 'omnivore',
  preferred_foods: ['chicken', 'rice', 'broccoli'],
  foods_to_avoid: ['dairy', 'processed']
});
// Returns: { id, plan_name, daily_calories, macros, meals, ... }

// Get meal plans list
const plans = await nutritionAPI.listMealPlans({ limit: 10 });

// Get specific plan
const plan = await nutritionAPI.getMealPlan('plan_id');

// Update plan
const updated = await nutritionAPI.updateMealPlan('plan_id', { plan_name: 'New Name' });

// Log meal
await nutritionAPI.logMeal({
  meal_type: 'breakfast',
  foods: ['eggs', 'toast', 'juice'],
  calories: 400
});
```

### Chat

```javascript
import { chatAPI } from './services/api';

// Send message
const response = await chatAPI.sendMessage('Create a workout for beginners');
// Returns: { response: "...", metadata: { sources: [...] } }

// Get chat history
const history = await chatAPI.getChatHistory({ limit: 50 });
// Returns: { messages: [...] }

// Clear history
await chatAPI.clearHistory();

// Send feedback
await chatAPI.getFeedback('message_id', 'helpful');
```

### Progress Tracking

```javascript
import { progressAPI } from './services/api';

// Log progress
const entry = await progressAPI.logProgress({
  date: '2024-01-15',
  weight: 75.5,
  exercises_completed: 3,
  meals_logged: 3,
  notes: 'Great workout today!',
  metrics: {
    body_fat: 22.5,
    muscle_mass: 58,
    measurements: {
      chest: 100,
      waist: 85,
      hips: 95,
      thighs: 60,
      arms: 35
    }
  }
});

// Get progress history
const history = await progressAPI.getProgress({ limit: 30 });

// Get analytics
const analytics = await progressAPI.getAnalytics({ days: 90 });
// Returns: { avg_weight, weight_trend, calories_avg, ... }

// Delete entry
await progressAPI.deleteProgressEntry('entry_id');
```

## Redux State Management

### Auth State
```javascript
// State structure
{
  auth: {
    user: { id, email, first_name, last_name },
    access_token: 'jwt_token',
    refresh_token: 'refresh_token',
    isAuthenticated: true,
    loading: false,
    error: null
  }
}

// Usage
const { isAuthenticated, user, loading } = useSelector(state => state.auth);
const dispatch = useDispatch();
dispatch(loginUser({ email, password }));
dispatch(registerUser({ email, password, first_name, last_name }));
dispatch(logoutUser());
```

### User State
```javascript
{
  user: {
    profile: { id, age, weight, height, fitness_level, goals, ... },
    metrics: { weight, body_fat, muscle_mass, ... },
    loading: false,
    error: null
  }
}

// Usage
const { profile, metrics } = useSelector(state => state.user);
dispatch(fetchUserProfile());
dispatch(updateUserProfile(profileData));
dispatch(fetchUserMetrics());
```

### Workout State
```javascript
{
  workout: {
    workouts: [...],
    currentWorkout: { ... },
    generatedWorkout: { ... },
    loading: false,
    error: null
  }
}

// Usage
dispatch(generateWorkout(request));
dispatch(fetchWorkouts({ limit: 10 }));
dispatch(fetchWorkout(workoutId));
```

### Nutrition State
```javascript
{
  nutrition: {
    mealPlans: [...],
    currentMealPlan: { ... },
    generatedMealPlan: { ... },
    loading: false,
    error: null
  }
}

// Usage
dispatch(generateMealPlan(request));
dispatch(fetchMealPlans({ limit: 10 }));
```

## Styling Approach

### CSS Architecture
- **Global Styles**: `components/styles/index.css`
- **Auth Styles**: `components/styles/auth.css`
- **Chat Styles**: `components/styles/chat.css`
- **Dashboard Styles**: `components/styles/dashboard.css`
- **Form Styles**: `components/styles/forms.css`
- **Generator Styles**: `components/styles/generators.css`

### Design System
```css
/* Color Palette */
--primary-color: #6366f1 (Indigo)
--secondary-color: #8b5cf6 (Purple)
--success-color: #10b981 (Green)
--danger-color: #ef4444 (Red)
--text-dark: #1e293b
--text-light: #64748b
--border-color: #e2e8f0
```

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- CSS Grid and Flexbox for layouts
- Touch-friendly buttons and inputs

## Error Handling

```javascript
import { getErrorMessage } from './services/api';

try {
  const response = await workoutAPI.generateWorkout(request);
} catch (error) {
  const message = getErrorMessage(error);
  // Shows user-friendly error messages
  // Examples:
  // - "Invalid input"
  // - "Unauthorized access"
  // - "Server error"
  // - Network error messages
}
```

## Authentication Flow

1. User visits `/login` or `/register`
2. Credentials submitted to backend
3. Backend returns `access_token` and `refresh_token`
4. Tokens stored in localStorage
5. API client adds token to all requests (`Authorization: Bearer token`)
6. If 401 received, automatically refresh token
7. Protected routes use `ProtectedRoute` component
8. Redirect to `/login` if not authenticated

## Building for Production

```bash
npm run build
```

This creates optimized production build in `build/` folder.

### Build Output
- Minified JavaScript
- CSS optimization
- Asset optimization
- Source maps for debugging

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Single run (CI mode)
npm test -- --watchAll=false
```

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- CSS minification
- JWT token refresh
- Redux state optimization
- Debounced API calls

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=build
```

### Traditional Hosting
```bash
npm run build
# Upload 'build' folder to web server
```

## Troubleshooting

### CORS Errors
```
Ensure backend is running on correct port
Check CORS_ORIGINS in backend config
```

### Token Expiry
```
Tokens auto-refresh when expired
If still unauthorized, clear localStorage and re-login
```

### API Connection Failed
```
Check REACT_APP_API_URL in .env
Ensure backend server is running
Check network tab in DevTools
```

## Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com)

## Support

For issues or questions:
1. Check browser console for errors
2. Check network tab for API responses
3. Review Redux DevTools for state changes
4. Check backend logs for API errors
