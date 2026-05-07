"""Example requests and responses for API endpoints."""

# ==============================================================================
# AUTHENTICATION ENDPOINTS
# ==============================================================================

# POST /api/v1/auth/register
REGISTER_REQUEST = {
    "email": "john@example.com",
    "username": "johndoe",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
}

REGISTER_RESPONSE = {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe",
    "message": "User registered successfully"
}


# POST /api/v1/auth/login
LOGIN_REQUEST = {
    "email": "john@example.com",
    "password": "SecurePassword123!"
}

LOGIN_RESPONSE = {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 300
}


# POST /api/v1/auth/refresh
REFRESH_REQUEST = {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

REFRESH_RESPONSE = {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}


# ==============================================================================
# USER ENDPOINTS
# ==============================================================================

# POST /api/v1/users/profile
CREATE_PROFILE_REQUEST = {
    "age": 28,
    "weight": 75.5,
    "height": 180,
    "gender": "male",
    "fitness_level": "intermediate",
    "goals": ["muscle_gain", "endurance"],
    "dietary_restrictions": ["vegetarian"],
    "medical_conditions": ["asthma"]
}

CREATE_PROFILE_RESPONSE = {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "age": 28,
    "weight": 75.5,
    "height": 180,
    "gender": "male",
    "fitness_level": "intermediate",
    "goals": ["muscle_gain", "endurance"],
    "dietary_restrictions": ["vegetarian"],
    "medical_conditions": ["asthma"],
    "is_active": True,
    "created_at": "2024-04-25T10:30:00Z"
}


# GET /api/v1/users/metrics
METRICS_RESPONSE = {
    "user_id": 1,
    "total_workouts": 5,
    "total_nutrition_plans": 3,
    "total_progress_logs": 12,
    "current_weight": 75.5,
    "fitness_level": "intermediate"
}


# ==============================================================================
# WORKOUT ENDPOINTS
# ==============================================================================

# POST /api/v1/workouts/generate
GENERATE_WORKOUT_REQUEST = {
    "goal": "muscle_gain",
    "duration_weeks": 12,
    "frequency": 4,
    "equipment": ["dumbbell", "barbell", "bench"],
    "intensity": "high",
    "specific_requirements": "No leg exercises due to knee pain"
}

GENERATE_WORKOUT_RESPONSE = {
    "id": 1,
    "name": "12-Week Muscle Building Program",
    "description": "A comprehensive workout plan designed to maximize muscle gain...",
    "goal": "muscle_gain",
    "duration_weeks": 12,
    "frequency": 4,
    "equipment": ["dumbbell", "barbell", "bench"],
    "intensity": "high",
    "exercises": [
        {
            "name": "Barbell Bench Press",
            "sets": 4,
            "reps": 8,
            "duration_minutes": 5,
            "rest_seconds": 120,
            "notes": "Control the eccentric phase"
        },
        {
            "name": "Dumbbell Incline Press",
            "sets": 3,
            "reps": 10,
            "duration_minutes": 5,
            "rest_seconds": 90,
            "notes": "30-degree angle"
        }
    ],
    "tokens_used": 2500,
    "rag_documents_used": ["doc1", "doc2"],
    "created_at": "2024-04-25T10:30:00Z",
    "updated_at": "2024-04-25T10:30:00Z"
}


# GET /api/v1/workouts/
WORKOUTS_LIST_RESPONSE = {
    "plans": [
        GENERATE_WORKOUT_RESPONSE,
        # ... more workouts
    ],
    "total": 5
}


# ==============================================================================
# NUTRITION ENDPOINTS
# ==============================================================================

# POST /api/v1/nutrition/generate
GENERATE_NUTRITION_REQUEST = {
    "goal": "muscle_gain",
    "duration_days": 30,
    "meals_per_day": 4,
    "daily_calories": 2800,
    "diet_type": "balanced",
    "preferred_foods": ["chicken", "rice", "broccoli"],
    "avoided_foods": ["peanuts"]
}

GENERATE_NUTRITION_RESPONSE = {
    "id": 1,
    "name": "30-Day High-Protein Meal Plan",
    "description": "A balanced nutrition plan optimized for muscle growth with 2800 daily calories...",
    "goal": "muscle_gain",
    "duration_days": 30,
    "meals_per_day": 4,
    "daily_calories": 2800,
    "diet_type": "balanced",
    "protein_grams": 200,
    "carbs_grams": 280,
    "fats_grams": 93,
    "meals": [
        {
            "name": "Breakfast - Protein Pancakes",
            "foods": ["eggs", "oats", "banana"],
            "calories": 450,
            "protein_grams": 25,
            "carbs_grams": 55,
            "fats_grams": 12
        },
        {
            "name": "Lunch - Grilled Chicken with Rice",
            "foods": ["chicken breast", "brown rice", "broccoli"],
            "calories": 650,
            "protein_grams": 50,
            "carbs_grams": 75,
            "fats_grams": 10
        }
    ],
    "tokens_used": 2800,
    "rag_documents_used": ["doc3", "doc4"],
    "created_at": "2024-04-25T10:30:00Z",
    "updated_at": "2024-04-25T10:30:00Z"
}


# GET /api/v1/nutrition/
NUTRITION_LIST_RESPONSE = {
    "plans": [
        GENERATE_NUTRITION_RESPONSE,
        # ... more plans
    ],
    "total": 3
}


# ==============================================================================
# CHAT ENDPOINTS
# ==============================================================================

# POST /api/v1/chat/send
CHAT_MESSAGE_REQUEST = {
    "message": "What should I eat before a workout?"
}

CHAT_MESSAGE_RESPONSE = {
    "id": 1,
    "user_message": "What should I eat before a workout?",
    "ai_response": "For pre-workout nutrition, aim for a meal 1-3 hours before exercise containing...",
    "rag_context_used": ["doc5", "doc6"],
    "tokens_used": 1200,
    "created_at": "2024-04-25T10:35:00Z"
}


# GET /api/v1/chat/history
CHAT_HISTORY_RESPONSE = {
    "messages": [
        CHAT_MESSAGE_RESPONSE,
        # ... more messages
    ],
    "total": 25
}


# ==============================================================================
# PROGRESS ENDPOINTS
# ==============================================================================

# POST /api/v1/progress/log
LOG_PROGRESS_REQUEST = {
    "weight": 75.5,
    "body_fat_percentage": 15.5,
    "muscle_mass": 60,
    "chest": 105,
    "waist": 85,
    "hips": 90,
    "thighs": 60,
    "arms": 35,
    "exercises_completed": 5,
    "meals_logged": 4,
    "notes": "Great workout today! Feeling stronger."
}

LOG_PROGRESS_RESPONSE = {
    "id": 1,
    "weight": 75.5,
    "body_fat_percentage": 15.5,
    "muscle_mass": 60,
    "chest": 105,
    "waist": 85,
    "hips": 90,
    "thighs": 60,
    "arms": 35,
    "exercises_completed": 5,
    "meals_logged": 4,
    "notes": "Great workout today! Feeling stronger.",
    "created_at": "2024-04-25T20:00:00Z"
}


# GET /api/v1/progress/
PROGRESS_LIST_RESPONSE = {
    "logs": [
        LOG_PROGRESS_RESPONSE,
        # ... more logs
    ],
    "total": 12
}


# GET /api/v1/progress/analytics
ANALYTICS_RESPONSE = {
    "total_logs": 12,
    "weight_change": -2.5,
    "avg_exercises_per_log": 4.8,
    "avg_meals_per_log": 3.9,
    "latest_weight": 75.5,
    "weight_history": [78.0, 77.5, 77.0, 76.5, 76.0, 75.5]
}


# ==============================================================================
# ERROR RESPONSES
# ==============================================================================

ERROR_INVALID_CREDENTIALS = {
    "detail": "Invalid credentials"
}

ERROR_MISSING_AUTH = {
    "detail": "Missing authorization header"
}

ERROR_USER_EXISTS = {
    "detail": "Email already registered"
}

ERROR_NOT_FOUND = {
    "detail": "Workout not found"
}

ERROR_VALIDATION = {
    "detail": [
        {
            "loc": ["body", "age"],
            "msg": "ensure this value is greater than 0",
            "type": "value_error.number.not_gt"
        }
    ]
}
