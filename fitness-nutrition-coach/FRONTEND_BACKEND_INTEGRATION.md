# API Integration Guide for Frontend

This guide shows how to connect the React frontend to the FastAPI backend.

## Backend URL Configuration

Update `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

## API Client Usage

The frontend API client is pre-configured in `src/services/api.js` to match all backend endpoints.

### Authentication Flow

```javascript
// 1. Register
const response = await api.authAPI.register({
  email: "user@example.com",
  username: "username",
  password: "SecurePassword123",
  first_name: "John",
  last_name: "Doe"
});

// 2. Login
const tokens = await api.authAPI.login({
  email: "user@example.com",
  password: "SecurePassword123"
});
// Returns: { access_token, refresh_token, token_type, expires_in }

// 3. Token is automatically stored and used for subsequent requests
```

### User Profile

```javascript
// Create/Update profile
const profile = await api.userAPI.updateProfile({
  age: 28,
  weight: 75.5,
  height: 180,
  gender: "male",
  fitness_level: "intermediate",
  goals: ["muscle_gain", "endurance"],
  dietary_restrictions: ["vegetarian"],
  medical_conditions: ["asthma"]
});

// Get profile
const user = await api.userAPI.getProfile();

// Get metrics
const metrics = await api.userAPI.getMetrics();
```

### Workout Generation

```javascript
// Generate workout plan
const workout = await api.workoutAPI.generate({
  goal: "muscle_gain",
  duration_weeks: 12,
  frequency: 4,
  equipment: ["dumbbell", "barbell", "bench"],
  intensity: "high",
  specific_requirements: "No leg exercises"
});

// List workouts
const workouts = await api.workoutAPI.list(limit, offset);

// Get specific workout
const workout = await api.workoutAPI.get(workoutId);

// Delete workout
await api.workoutAPI.delete(workoutId);
```

### Nutrition Planning

```javascript
// Generate meal plan
const plan = await api.nutritionAPI.generate({
  goal: "muscle_gain",
  duration_days: 30,
  meals_per_day: 4,
  daily_calories: 2800,
  diet_type: "balanced",
  preferred_foods: ["chicken", "rice"],
  avoided_foods: ["peanuts"]
});

// List plans
const plans = await api.nutritionAPI.list(limit, offset);

// Get specific plan
const plan = await api.nutritionAPI.get(planId);

// Delete plan
await api.nutritionAPI.delete(planId);
```

### Chat Interface

```javascript
// Send message
const response = await api.chatAPI.send({
  message: "What should I eat before a workout?"
});
// Returns: { id, user_message, ai_response, rag_context_used, tokens_used, created_at }

// Get history
const history = await api.chatAPI.history(limit);

// Clear history
await api.chatAPI.clear();
```

### Progress Tracking

```javascript
// Log progress
const log = await api.progressAPI.log({
  weight: 75.5,
  body_fat_percentage: 15.5,
  muscle_mass: 60,
  chest: 105,
  waist: 85,
  hips: 90,
  thighs: 60,
  arms: 35,
  exercises_completed: 5,
  meals_logged: 4,
  notes: "Great workout!"
});

// Get progress logs
const logs = await api.progressAPI.get(days, limit);

// Get analytics
const analytics = await api.progressAPI.analytics(days);

// Delete log
await api.progressAPI.delete(logId);
```

## Redux Integration

All API calls are integrated with Redux for state management:

```javascript
// In components
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser } from '../store/authSlice';

function LoginComponent() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.auth);

  const handleLogin = async (email, password) => {
    await dispatch(loginUser({ email, password }));
  };

  return (
    // Component JSX
  );
}
```

## Error Handling

All errors are automatically caught by the API client:

```javascript
try {
  const result = await api.authAPI.login(credentials);
} catch (error) {
  const message = api.getErrorMessage(error);
  // "Invalid credentials" or specific error message
  console.error(message);
}
```

## Running Frontend & Backend Together

### Terminal 1: Backend
```bash
cd backend
python main.py
# Running on http://localhost:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
# Running on http://localhost:3000
```

### Terminal 3: PostgreSQL (if not using Docker)
```bash
# Make sure PostgreSQL is running
# Or use Docker Compose:
docker-compose -f backend/docker-compose.yml up -d
```

## Testing Integration

### Verify Backend is Running
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy", "environment": "development"}
```

### Verify Frontend Connects
1. Open http://localhost:3000
2. Open DevTools (F12)
3. Go to Network tab
4. Try to register
5. Should see POST request to `http://localhost:8000/api/v1/auth/register`

### Check API Response
1. In DevTools Network tab, click the request
2. Go to Response tab
3. Should see successful response with user data

## Debugging Tips

### Check Request/Response in DevTools
```
Network tab → Click request → Response/Headers tabs
```

### Check Redux State
```javascript
// Install Redux DevTools browser extension
// Use Redux DevTools to inspect state changes
```

### Check Backend Logs
```bash
# If using Docker
docker-compose logs -f backend

# If running locally
# Check terminal output from `python main.py`
```

### Common Issues

**CORS Error**
- Issue: `Access to XMLHttpRequest blocked by CORS policy`
- Solution: Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`
  ```
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
  ```

**Connection Refused**
- Issue: `Can't reach http://localhost:8000`
- Solution: Verify backend is running: `curl http://localhost:8000/`

**Token Expired**
- Issue: Get 401 after some time
- Solution: Automatic refresh implemented, but verify in Redux store

**Database Error**
- Issue: "No module named psycopg2"
- Solution: `pip install psycopg2-binary`

## Performance Monitoring

Monitor in frontend:
```javascript
// Check DevTools Network tab for response times
// Look for slow requests > 1000ms
// Optimize Bedrock integration if generation takes > 5 seconds
```

Monitor in backend:
```bash
# View logs for slow queries
# Check `tokens_used` for API costs
# Monitor database connection pool
```

## Next Steps

1. ✅ Start both frontend and backend
2. ✅ Test authentication flow (register → login)
3. ✅ Test profile creation
4. ✅ Test workout generation (requires AWS Bedrock)
5. ✅ Test meal planning
6. ✅ Test chat interface
7. ✅ Test progress logging

---

**Status**: Ready for integration testing
