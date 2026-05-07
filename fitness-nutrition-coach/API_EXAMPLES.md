# API Request/Response Examples

Complete, copy-paste ready examples for all endpoints.

---

## Authentication Endpoints

### Register New User

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "SecurePassword123!"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T14:30:00Z",
  "message": "User registered successfully. Check your email for verification."
}
```

---

### Login User

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNjA0NzU4NDAwfQ.G4V-q4TjgzZiLoLNLCJdvDZSKI7pPkQjbYCo4XvqAEA",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe"
  }
}
```

**Save the token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Profile Endpoints

### Create Profile

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "age": 28,
    "weight": 180,
    "height": 510,
    "gender": "male",
    "fitness_level": "intermediate",
    "primary_goal": "muscle_gain",
    "secondary_goals": ["strength", "endurance"],
    "medical_conditions": [],
    "dietary_restrictions": [],
    "equipment_available": ["dumbbells", "barbell", "kettlebells", "cable_machine"],
    "preferred_foods": ["chicken", "rice", "broccoli", "eggs", "salmon"],
    "avoided_foods": ["pork", "shellfish", "processed_foods"]
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "age": 28,
  "weight": 180,
  "height": 510,
  "gender": "male",
  "fitness_level": "intermediate",
  "primary_goal": "muscle_gain",
  "secondary_goals": ["strength", "endurance"],
  "bmi": 25.1,
  "age_category": "25-35",
  "medical_conditions": [],
  "dietary_restrictions": [],
  "equipment_available": ["dumbbells", "barbell", "kettlebells", "cable_machine"],
  "preferred_foods": ["chicken", "rice", "broccoli", "eggs", "salmon"],
  "avoided_foods": ["pork", "shellfish", "processed_foods"],
  "created_at": "2024-01-15T14:35:00Z",
  "updated_at": "2024-01-15T14:35:00Z"
}
```

---

### Get Profile

**Request:**
```bash
curl -X GET http://localhost:8000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "user_id": 1,
  "age": 28,
  "weight": 180,
  "height": 510,
  "gender": "male",
  "fitness_level": "intermediate",
  "primary_goal": "muscle_gain",
  "secondary_goals": ["strength", "endurance"],
  "bmi": 25.1,
  "age_category": "25-35",
  "medical_conditions": [],
  "dietary_restrictions": [],
  "equipment_available": ["dumbbells", "barbell", "kettlebells", "cable_machine"],
  "preferred_foods": ["chicken", "rice", "broccoli", "eggs", "salmon"],
  "avoided_foods": ["pork", "shellfish", "processed_foods"],
  "created_at": "2024-01-15T14:35:00Z",
  "updated_at": "2024-01-15T14:35:00Z"
}
```

---

## AI Endpoints

### Generate Workout Plan

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/workout/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain" \
  --data-urlencode "duration_weeks=12" \
  --data-urlencode "frequency=4" \
  --data-urlencode "intensity=high" \
  --data-urlencode "equipment=dumbbells" \
  --data-urlencode "equipment=barbell"
```

**Response (200 OK):**
```json
{
  "success": true,
  "request_id": "f7a2c9e1",
  "data": {
    "plan_id": 1,
    "plan_name": "AI-Generated Workout - Muscle Gain",
    "goal": "muscle_gain",
    "duration_weeks": 12,
    "frequency": 4,
    "workout": {
      "program_name": "12-Week Muscle Building Program",
      "overview": "Progressive hypertrophy-focused program combining compound lifts with accessory work",
      "weekly_schedule": {
        "week": 1,
        "focus": "Foundation & Hypertrophy",
        "workouts": [
          {
            "day": "Monday",
            "focus": "Chest & Triceps",
            "exercises": [
              {
                "name": "Barbell Bench Press",
                "sets": 4,
                "reps": "6-8",
                "rest_seconds": 90,
                "notes": "Warm up with 2 light sets first"
              },
              {
                "name": "Incline Dumbbell Press",
                "sets": 3,
                "reps": "8-10",
                "rest_seconds": 75,
                "notes": "30-degree incline"
              },
              {
                "name": "Cable Tricep Pushdown",
                "sets": 3,
                "reps": "10-12",
                "rest_seconds": 60,
                "notes": "Full range of motion"
              },
              {
                "name": "Close-Grip Bench Press",
                "sets": 3,
                "reps": "8-10",
                "rest_seconds": 75
              }
            ],
            "duration_minutes": 60,
            "notes": "Focus on controlled movements, 2-second pause at bottom of press"
          },
          {
            "day": "Tuesday",
            "focus": "Back & Biceps",
            "exercises": [
              {
                "name": "Deadlift",
                "sets": 4,
                "reps": "4-6",
                "rest_seconds": 120,
                "notes": "Power movement, prioritize form"
              },
              {
                "name": "Barbell Rows",
                "sets": 4,
                "reps": "6-8",
                "rest_seconds": 90
              },
              {
                "name": "Barbell Curl",
                "sets": 3,
                "reps": "8-10",
                "rest_seconds": 75
              }
            ],
            "duration_minutes": 60
          }
        ]
      },
      "nutrition_guidelines": {
        "daily_caloric_surplus": 300,
        "protein_grams": 180,
        "carbs_grams": 300,
        "fats_grams": 80,
        "meal_timing": "Eat every 3-4 hours"
      },
      "progression_scheme": {
        "week_1_4": "Foundation phase - establish baseline strength",
        "week_5_8": "Increase volume - add reps or sets",
        "week_9_12": "Peak phase - attempt personal records"
      }
    }
  },
  "rag_context": {
    "documents_retrieved": 3,
    "citations": [
      {
        "source": "s3://fitness-docs/muscle-gain-guide.pdf",
        "score": "0.95"
      },
      {
        "source": "s3://fitness-docs/compound-exercises.pdf",
        "score": "0.87"
      },
      {
        "source": "s3://fitness-docs/progressive-overload.pdf",
        "score": "0.82"
      }
    ]
  },
  "metrics": {
    "processing_time_seconds": 2.34,
    "tokens_used": 1842,
    "cost_estimate": "$0.0184"
  }
}
```

---

### Generate Nutrition Plan

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/nutrition/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain" \
  --data-urlencode "diet_type=high_protein" \
  --data-urlencode "duration_days=30" \
  --data-urlencode "meals_per_day=4" \
  --data-urlencode "daily_calories=3000"
```

**Response (200 OK):**
```json
{
  "success": true,
  "request_id": "a8d1e2f9",
  "data": {
    "plan_id": 1,
    "plan_name": "AI-Generated Meal Plan - High Protein",
    "goal": "muscle_gain",
    "diet_type": "high_protein",
    "daily_calories": 3000,
    "meal_plan": {
      "daily_macros": {
        "calories": 3000,
        "protein_grams": 225,
        "carbs_grams": 337,
        "fats_grams": 83
      },
      "daily_meals": [
        {
          "meal_number": 1,
          "name": "Breakfast",
          "time": "7:00 AM",
          "foods": [
            {
              "name": "Oatmeal",
              "amount": "1 cup cooked",
              "calories": 150,
              "protein": 5
            },
            {
              "name": "Whole Eggs",
              "amount": 3,
              "calories": 210,
              "protein": 18
            },
            {
              "name": "Banana",
              "amount": 1,
              "calories": 105,
              "protein": 1
            }
          ],
          "meal_calories": 465,
          "meal_protein": 24
        },
        {
          "meal_number": 2,
          "name": "Mid-Morning Snack",
          "time": "10:00 AM",
          "foods": [
            {
              "name": "Greek Yogurt",
              "amount": "1 cup",
              "calories": 150,
              "protein": 20
            },
            {
              "name": "Granola",
              "amount": "1/4 cup",
              "calories": 130,
              "protein": 4
            }
          ],
          "meal_calories": 280,
          "meal_protein": 24
        },
        {
          "meal_number": 3,
          "name": "Lunch",
          "time": "1:00 PM",
          "foods": [
            {
              "name": "Grilled Chicken Breast",
              "amount": "200g",
              "calories": 330,
              "protein": 62
            },
            {
              "name": "Brown Rice",
              "amount": "1 cup cooked",
              "calories": 215,
              "protein": 5
            },
            {
              "name": "Broccoli",
              "amount": "150g",
              "calories": 50,
              "protein": 3
            }
          ],
          "meal_calories": 595,
          "meal_protein": 70
        },
        {
          "meal_number": 4,
          "name": "Dinner",
          "time": "6:00 PM",
          "foods": [
            {
              "name": "Salmon",
              "amount": "150g",
              "calories": 280,
              "protein": 35
            },
            {
              "name": "Sweet Potato",
              "amount": "150g",
              "calories": 130,
              "protein": 2
            },
            {
              "name": "Mixed Vegetables",
              "amount": "200g",
              "calories": 60,
              "protein": 3
            }
          ],
          "meal_calories": 470,
          "meal_protein": 40
        }
      ]
    }
  },
  "rag_context": {
    "documents_retrieved": 2,
    "citations": [
      {
        "source": "s3://fitness-docs/nutrition-guide.pdf",
        "score": "0.92"
      },
      {
        "source": "s3://fitness-docs/meal-planning.pdf",
        "score": "0.88"
      }
    ]
  },
  "metrics": {
    "processing_time_seconds": 2.12,
    "tokens_used": 1567,
    "cost_estimate": "$0.0157"
  }
}
```

---

### Chat with Coach

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "message=How can I improve my bench press strength?" \
  --data-urlencode "message_type=strength_advice"
```

**Response (200 OK):**
```json
{
  "success": true,
  "request_id": "c3b7d1e4",
  "data": {
    "message_id": 1,
    "conversation_id": "conv_1_1705334400",
    "response": "Great question! Here are the top 5 ways to improve your bench press:\n\n1. **Progressive Overload**: Gradually increase weight each week (aim for 5 lbs per session on upper body). This is the #1 driver of strength gains.\n\n2. **Lower Rep Ranges**: Train primarily in the 4-8 rep range for raw strength. Complement with 8-12 rep accessory work.\n\n3. **Bar Path**: Keep the bar path vertical (directly above your chest). A straighter path reduces range of motion and increases mechanical advantage.\n\n4. **Leg Drive**: Drive your legs into the bench to create a stable platform. This transfers force from your lower body into the press.\n\n5. **Frequency**: Bench press 2-3x per week with different intensity schemes (heavy/heavy/moderate works well).\n\n**Quick Tips**:\n- Pause at the bottom for 2 seconds to eliminate bounce\n- Use a spotter for form feedback and safety\n- Deload every 4-6 weeks (reduce volume/intensity by 40%)\n- Include chest accessory work (incline press, flyes)\n\nBased on your profile (28y, intermediate lifter), I'd recommend starting with our 12-week strength focus program which emphasizes this progression. Would you like me to generate that for you?",
    "message_type": "strength_advice"
  },
  "rag_context": {
    "documents_retrieved": 4,
    "citations": [
      {
        "source": "s3://fitness-docs/strength-training.pdf",
        "score": "0.96"
      },
      {
        "source": "s3://fitness-docs/bench-press-guide.pdf",
        "score": "0.94"
      },
      {
        "source": "s3://fitness-docs/progressive-overload.pdf",
        "score": "0.89"
      },
      {
        "source": "s3://fitness-docs/form-technique.pdf",
        "score": "0.85"
      }
    ]
  },
  "metrics": {
    "processing_time_seconds": 1.87,
    "tokens_used": 1024,
    "cost_estimate": "$0.0102"
  }
}
```

---

## Activity Tracking Endpoints

### Log Exercise

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/activity/exercise \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "exercise_name": "Barbell Bench Press",
    "category": "strength",
    "sets_completed": 4,
    "reps_completed": 8,
    "weight_used": 225,
    "difficulty_rating": 7,
    "duration_minutes": 45
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "exercise_name": "Barbell Bench Press",
  "category": "strength",
  "sets_completed": 4,
  "reps_completed": 8,
  "weight_used": 225,
  "difficulty_rating": 7,
  "completed_at": "2024-01-15T15:00:00Z",
  "duration_minutes": 45,
  "volume": 7200,
  "notes": "Felt strong today, good form throughout"
}
```

---

### Log Meal

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/activity/meal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "meal_name": "Chicken & Rice",
    "meal_type": "lunch",
    "calories": 600,
    "protein_grams": 45,
    "carbs_grams": 60,
    "fats_grams": 15,
    "tastiness_rating": 8,
    "satisfaction_rating": 9
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "meal_name": "Chicken & Rice",
  "meal_type": "lunch",
  "calories": 600,
  "protein_grams": 45,
  "carbs_grams": 60,
  "fats_grams": 15,
  "eaten_at": "2024-01-15T13:00:00Z",
  "logged_at": "2024-01-15T13:05:00Z",
  "tastiness_rating": 8,
  "satisfaction_rating": 9
}
```

---

## Progress Tracking Endpoints

### Log Progress

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "weight": 182,
    "body_fat_percentage": 18.5,
    "muscle_mass": 148,
    "blood_pressure": "120/80",
    "resting_heart_rate": 62,
    "sleep_quality": 8,
    "stress_level": 4,
    "energy_level": "high",
    "mood": "excellent"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "weight": 182,
  "body_fat_percentage": 18.5,
  "muscle_mass": 148,
  "blood_pressure": "120/80",
  "resting_heart_rate": 62,
  "sleep_quality": 8,
  "stress_level": 4,
  "energy_level": "high",
  "mood": "excellent",
  "recorded_at": "2024-01-15T20:00:00Z",
  "weight_change": 2,
  "fat_loss": 0.7,
  "muscle_gain": 2.7
}
```

---

## Dashboard Endpoint

### Get Dashboard

**Request:**
```bash
curl -X GET http://localhost:8000/api/v1/ai/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**
```json
{
  "success": true,
  "request_id": "e2a4f8c1",
  "data": {
    "dashboard": {
      "user_summary": {
        "name": "John Doe",
        "age": 28,
        "fitness_level": "intermediate",
        "primary_goal": "muscle_gain",
        "account_created": "2024-01-10T10:00:00Z"
      },
      "current_stats": {
        "weight": 182,
        "weight_change_7d": 2,
        "weight_change_30d": 5,
        "body_fat": 18.5,
        "muscle_mass": 148,
        "bmi": 25.4,
        "resting_heart_rate": 62,
        "blood_pressure": "120/80"
      },
      "activity_summary": {
        "workouts_this_week": 3,
        "total_exercise_minutes": 180,
        "exercises_logged": 12,
        "meals_logged": 18,
        "average_daily_calories": 2950,
        "average_daily_protein": 220
      },
      "active_plans": {
        "workout_plan": {
          "name": "12-Week Muscle Building Program",
          "progress": 33,
          "weeks_remaining": 8
        },
        "diet_plan": {
          "name": "High-Protein Meal Plan",
          "progress": 50,
          "days_remaining": 15
        }
      },
      "recent_activity": {
        "last_workout": "2024-01-15T15:00:00Z",
        "last_meal_logged": "2024-01-15T19:00:00Z",
        "last_weight_check": "2024-01-15T20:00:00Z"
      }
    },
    "insights": [
      {
        "category": "progress",
        "message": "Excellent work! You've gained 2 lbs in the last week. Keep your protein intake consistent.",
        "priority": "high"
      },
      {
        "category": "nutrition",
        "message": "Your average daily protein is 220g - right on track for muscle gain. Maintain this for best results.",
        "priority": "medium"
      },
      {
        "category": "training",
        "message": "You've completed 3 workouts this week. Consider adding one more for optimal muscle growth.",
        "priority": "medium"
      },
      {
        "category": "recovery",
        "message": "Your sleep quality has been excellent (avg 8/10). This is crucial for muscle recovery and growth.",
        "priority": "low"
      },
      {
        "category": "recommendation",
        "message": "Based on your progress, you may want to increase your lifts by 5 lbs next week.",
        "priority": "high"
      }
    ]
  },
  "metrics": {
    "processing_time_seconds": 0.82,
    "tokens_used": 0,
    "cost_estimate": "$0.00"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid parameters: duration_weeks must be greater than 0"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired authentication credentials"
}
```

### 404 Not Found
```json
{
  "detail": "User profile not found. Please create a profile first."
}
```

### 500 Internal Server Error
```json
{
  "detail": "An error occurred while generating the workout plan",
  "request_id": "abc12345"
}
```

---

## Testing Commands

Copy-paste these complete commands to test the system:

### Full Workflow Test
```bash
#!/bin/bash

# 1. Register
REGISTER=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$RANDOM'@example.com",
    "username": "testuser'$RANDOM'",
    "password": "TestPassword123!"
  }')

echo "Registered: $(echo $REGISTER | jq '.username')"

# 2. Login
LOGIN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$RANDOM'@example.com",
    "password": "TestPassword123!"
  }')

TOKEN=$(echo $LOGIN | jq -r '.access_token')
echo "Token: ${TOKEN:0:20}..."

# 3. Create Profile
curl -s -X POST http://localhost:8000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "weight": 180,
    "height": 510,
    "gender": "male",
    "fitness_level": "intermediate",
    "primary_goal": "muscle_gain",
    "equipment_available": ["dumbbells", "barbell"]
  }' | jq '.id'

# 4. Generate Workout
curl -s -X POST http://localhost:8000/api/v1/ai/workout/generate \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain" \
  --data-urlencode "duration_weeks=12" \
  --data-urlencode "frequency=4" \
  --data-urlencode "intensity=high" | jq '.data.plan_id'

echo "✓ Full workflow test completed!"
```

Save as `test.sh`, then run:
```bash
chmod +x test.sh
./test.sh
```

---

Happy testing! 🚀
