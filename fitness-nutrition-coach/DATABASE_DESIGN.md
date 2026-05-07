# Database Design - AI Fitness Coach

## Overview

Complete relational database design for AI Fitness Coach supporting:
- User management and authentication
- Fitness profiles and personalization
- AI-generated workout and diet plans
- Chat history with RAG document tracking
- Progress tracking and activity logging
- Nutrition and exercise analytics

## Database Architecture

### Technology Stack

- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: SQLAlchemy
- **Schema Version Control**: Alembic
- **Connection Pool**: SQLAlchemy Pool
- **Type Safety**: Pydantic models

### Design Principles

1. **Normalization**: Follows 3NF to minimize redundancy
2. **Relationships**: Proper foreign keys with cascading deletes
3. **Indexing**: Strategic indexes for common queries
4. **Extensibility**: JSON fields for flexible data storage
5. **Audit Trail**: Timestamps on all modifications
6. **Personalization**: Multiple relationship levels for AI context

---

## 📊 Entity-Relationship Diagram

```
┌─────────────┐
│    Users    │
├─────────────┤
│ id (PK)     │
│ email       │
│ username    │
│ password    │
│ full_name   │
│ is_active   │
│ is_verified │
│ created_at  │
│ updated_at  │
│ last_login  │
└────┬────────┘
     │
     │ 1:1
     │
     └─────────────────┐
                       │
          ┌────────────▼──────────────┐
          │      Profiles             │
          ├───────────────────────────┤
          │ id (PK)                   │
          │ user_id (FK)              │
          │ age, weight, height       │
          │ fitness_level             │
          │ primary_goal              │
          │ medical_conditions (JSON) │
          │ dietary_restrictions      │
          │ preferred_foods (JSON)    │
          │ equipment_available       │
          │ created_at, updated_at    │
          └─────────────────────────────┘

                       │
                       │ 1:N
                       │
          ┌────────────┴───────────────────┬──────────────────┐
          │                                │                  │
     ┌────▼──────────────┐   ┌────────────▼───┐   ┌──────────▼────────┐
     │  WorkoutPlans     │   │   DietPlans    │   │  ChatMessages     │
     ├───────────────────┤   ├────────────────┤   ├───────────────────┤
     │ id (PK)           │   │ id (PK)        │   │ id (PK)           │
     │ user_id (FK)      │   │ user_id (FK)   │   │ user_id (FK)      │
     │ name              │   │ name           │   │ conversation_id   │
     │ goal              │   │ diet_type      │   │ user_message      │
     │ duration_weeks    │   │ duration_days  │   │ ai_response       │
     │ frequency         │   │ daily_calories │   │ message_type      │
     │ intensity         │   │ protein_grams  │   │ rag_documents     │
     │ ai_generated      │   │ carbs_grams    │   │ citations (JSON)  │
     │ rag_documents     │   │ fats_grams     │   │ tokens_used       │
     │ plan_content      │   │ rag_documents  │   │ user_rating       │
     │ is_active         │   │ plan_content   │   │ created_at        │
     │ created_at        │   │ created_at     │   └───────────────────┘
     └────┬──────────────┘   └────┬───────────┘
          │ 1:N                    │ 1:N
          │                        │
     ┌────▼───────────────┐  ┌────▼──────────┐
     │WorkoutExercises    │  │  Meals        │
     ├────────────────────┤  ├───────────────┤
     │ id (PK)            │  │ id (PK)       │
     │ plan_id (FK)       │  │ plan_id (FK)  │
     │ name               │  │ name          │
     │ category           │  │ meal_type     │
     │ sets, reps, weight │  │ calories      │
     │ instructions       │  │ protein_grams │
     │ day_of_week        │  │ ingredients   │
     │ order_in_workout   │  │ created_at    │
     └────────────────────┘  └───────────────┘

                       │
                       │ 1:N (activity logging)
                       │
          ┌────────────┼──────────────────┬──────────────────┐
          │            │                  │                  │
     ┌────▼─────────────────┐  ┌─────────▼──────────┐  ┌────▼──────────────┐
     │  ExerciseLogs        │  │  MealLogs          │  │ProgressTracking   │
     ├──────────────────────┤  ├────────────────────┤  ├───────────────────┤
     │ id (PK)              │  │ id (PK)            │  │ id (PK)           │
     │ user_id (FK)         │  │ user_id (FK)       │  │ user_id (FK)      │
     │ plan_id (FK)         │  │ plan_id (FK)       │  │ measurement_date  │
     │ exercise_name        │  │ meal_name          │  │ weight            │
     │ category             │  │ meal_type          │  │ body_fat_%        │
     │ sets_completed       │  │ calories           │  │ muscle_mass       │
     │ reps_completed       │  │ protein_grams      │  │ blood_pressure    │
     │ weight_used          │  │ taste_rating       │  │ resting_hr        │
     │ difficulty_rating    │  │ satisfaction_rating│  │ sleep_quality     │
     │ completed_at         │  │ eaten_at           │  │ stress_level      │
     │ notes                │  │ logged_at          │  │ energy_level      │
     └──────────────────────┘  └────────────────────┘  │ mood              │
                                                        │ created_at        │
                                                        └───────────────────┘
```

---

## 📋 Table Definitions

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
);
```

**Purpose**: Core user account management
**Key Fields**:
- `email`: Unique identifier for login and communication
- `username`: User-friendly identifier
- `is_active`: Soft delete flag
- `is_verified`: Email verification status
- `last_login`: Last authentication timestamp

---

### Profiles Table

```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    
    -- Basic Info
    age INTEGER NOT NULL,
    gender VARCHAR(50),
    height FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    
    -- Fitness Info
    fitness_level VARCHAR(50),
    primary_goal VARCHAR(50) NOT NULL,
    secondary_goals JSONB DEFAULT '[]',
    target_weight FLOAT,
    years_experience INTEGER DEFAULT 0,
    
    -- Health Info
    dietary_restrictions JSONB DEFAULT '[]',
    medical_conditions JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    injuries JSONB DEFAULT '[]',
    
    -- Preferences
    preferred_diet_type VARCHAR(50),
    preferred_foods JSONB DEFAULT '[]',
    avoided_foods JSONB DEFAULT '[]',
    exercises_preference JSONB DEFAULT '[]',
    equipment_available JSONB DEFAULT '[]',
    
    -- Lifestyle
    daily_activity_level VARCHAR(50),
    sleep_hours FLOAT,
    stress_level VARCHAR(50),
    working_hours INTEGER,
    
    -- Targets
    target_daily_calories INTEGER,
    target_daily_steps INTEGER,
    target_daily_water FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Extended user fitness profile for personalization
**Key Features**:
- 1:1 relationship with Users
- JSON fields for flexible array storage
- Calculated properties (BMI, age_category)
- Medical history for safety recommendations

---

### WorkoutPlans Table

```sql
CREATE TABLE workout_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal VARCHAR(50) NOT NULL,
    
    -- Plan Details
    duration_weeks INTEGER NOT NULL,
    frequency_per_week INTEGER NOT NULL,
    intensity VARCHAR(50),
    session_duration_minutes INTEGER NOT NULL,
    
    -- Configuration
    equipment_needed JSONB DEFAULT '[]',
    exercise_categories JSONB DEFAULT '[]',
    
    -- AI Metadata
    ai_model_used VARCHAR(100),
    ai_generated BOOLEAN DEFAULT TRUE,
    rag_documents_used JSONB DEFAULT '[]',
    
    -- Content
    plan_content JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_created_at (created_at)
);
```

**Purpose**: Store AI-generated workout plans
**Key Features**:
- Tracks RAG documents used for generation
- Stores complete plan structure as JSON
- Active/inactive status for plan tracking
- Duration and frequency for schedule management

---

### WorkoutExercises Table

```sql
CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES workout_plans(id),
    
    -- Exercise Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    
    -- Exercise Details
    sets INTEGER NOT NULL,
    reps VARCHAR(50),
    rest_seconds INTEGER,
    weight FLOAT,
    instructions TEXT,
    
    -- Variations
    alternative_exercises JSONB DEFAULT '[]',
    modifications JSONB DEFAULT '[]',
    
    -- Scheduling
    day_of_week INTEGER NOT NULL,
    order_in_workout INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Individual exercises within workout plans
**Key Features**:
- 1:N relationship with WorkoutPlans
- Day and order for schedule organization
- Alternative exercises for flexibility
- Modifications for different fitness levels

---

### DietPlans Table

```sql
CREATE TABLE diet_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal VARCHAR(50) NOT NULL,
    diet_type VARCHAR(50) NOT NULL,
    
    -- Plan Details
    duration_days INTEGER NOT NULL,
    meals_per_day INTEGER DEFAULT 3,
    daily_calories INTEGER NOT NULL,
    
    -- Macros
    protein_grams FLOAT NOT NULL,
    carbs_grams FLOAT NOT NULL,
    fats_grams FLOAT NOT NULL,
    
    -- Dietary Info
    dietary_restrictions JSONB DEFAULT '[]',
    preferred_foods JSONB DEFAULT '[]',
    avoided_foods JSONB DEFAULT '[]',
    
    -- AI Metadata
    ai_model_used VARCHAR(100),
    ai_generated BOOLEAN DEFAULT TRUE,
    rag_documents_used JSONB DEFAULT '[]',
    
    -- Content
    plan_content JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_created_at (created_at)
);
```

**Purpose**: Store AI-generated diet/nutrition plans
**Key Features**:
- Tracks RAG documents for nutrition generation
- Macro targets aligned with goals
- Dietary restrictions and preferences
- Multiple plans per user with active tracking

---

### Meals Table

```sql
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES diet_plans(id),
    
    -- Meal Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meal_type VARCHAR(50) NOT NULL,
    
    -- Nutrition
    calories INTEGER NOT NULL,
    protein_grams FLOAT NOT NULL,
    carbs_grams FLOAT NOT NULL,
    fats_grams FLOAT NOT NULL,
    fiber_grams FLOAT,
    
    -- Details
    ingredients JSONB NOT NULL,
    preparation_steps JSONB,
    cooking_time_minutes INTEGER,
    
    -- Dietary Tags
    dietary_tags JSONB DEFAULT '[]',
    
    -- Scheduling
    day_of_week INTEGER NOT NULL,
    order_in_day INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Individual meals within diet plans
**Key Features**:
- Detailed ingredient lists as JSON
- Preparation steps for cooking
- Scheduled by day and meal order
- Dietary tags for filtering

---

### ChatMessages Table

```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    conversation_id VARCHAR(100) NOT NULL,
    
    -- Content
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    
    -- Classification
    message_type VARCHAR(50) DEFAULT 'general',
    
    -- AI Metadata
    ai_model_used VARCHAR(100),
    rag_documents_used JSONB DEFAULT '[]',
    citations JSONB DEFAULT '[]',
    
    -- Metrics
    tokens_used INTEGER,
    estimated_cost FLOAT,
    
    -- Feedback
    user_rating INTEGER,
    feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_conversation (user_id, conversation_id),
    INDEX idx_created_at (created_at)
);
```

**Purpose**: Chat history with RAG document tracking
**Key Features**:
- Conversation grouping for context
- Citation tracking for transparency
- Token usage for cost tracking
- User rating for response quality
- Multiple message types for categorization

---

### ProgressTracking Table

```sql
CREATE TABLE progress_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Date
    measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Body Measurements
    weight FLOAT,
    height FLOAT,
    body_fat_percentage FLOAT,
    muscle_mass FLOAT,
    
    -- Circumferences
    chest_cm FLOAT,
    waist_cm FLOAT,
    hips_cm FLOAT,
    arm_cm FLOAT,
    thigh_cm FLOAT,
    
    -- Performance
    bench_press_max FLOAT,
    squat_max FLOAT,
    deadlift_max FLOAT,
    run_5k_time VARCHAR(50),
    
    -- Health Metrics
    resting_heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    cholesterol FLOAT,
    
    -- Wellness
    sleep_quality INTEGER,
    stress_level INTEGER,
    energy_level INTEGER,
    mood INTEGER,
    
    notes TEXT,
    
    INDEX idx_user_date (user_id, measurement_date)
);
```

**Purpose**: Track user's fitness and health metrics over time
**Key Features**:
- Comprehensive body measurements
- Performance metrics (strength, endurance)
- Health indicators
- Wellness tracking (sleep, stress, mood)
- Time-series data for progress analysis

---

### ExerciseLogs Table

```sql
CREATE TABLE exercise_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_id INTEGER REFERENCES workout_plans(id),
    
    -- Exercise Info
    exercise_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- Performance
    sets_completed INTEGER NOT NULL,
    reps_completed VARCHAR(50),
    weight_used FLOAT,
    duration_seconds INTEGER,
    
    -- Quality
    difficulty_rating INTEGER,
    notes TEXT,
    
    -- Timestamps
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes FLOAT,
    
    INDEX idx_user_date (user_id, completed_at)
);
```

**Purpose**: Log completed exercises for tracking adherence
**Key Features**:
- Links to workout plan for context
- Actual performance data
- Difficulty ratings for feedback
- Timestamps for activity history

---

### MealLogs Table

```sql
CREATE TABLE meal_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_id INTEGER REFERENCES diet_plans(id),
    
    -- Meal Info
    meal_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    
    -- Nutrition
    calories INTEGER NOT NULL,
    protein_grams FLOAT,
    carbs_grams FLOAT,
    fats_grams FLOAT,
    
    -- Details
    ingredients JSONB,
    
    -- Ratings
    tastiness_rating INTEGER,
    satisfaction_rating INTEGER,
    notes TEXT,
    
    -- Timestamps
    eaten_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_date (user_id, eaten_at)
);
```

**Purpose**: Log consumed meals for nutrition tracking
**Key Features**:
- Nutrition data logging
- Meal satisfaction ratings
- Eaten vs logged timestamps
- Links to diet plan

---

## 🔑 Key Relationships

### User → Profile (1:1)
- One user has exactly one profile
- Cascade delete: User deletion removes profile

### User → WorkoutPlans (1:N)
- One user can have multiple workout plans
- Cascade delete: User deletion removes all plans

### User → DietPlans (1:N)
- One user can have multiple diet plans
- Cascade delete: User deletion removes all plans

### User → ChatMessages (1:N)
- One user can have many chat conversations
- Cascade delete: User deletion removes all messages

### User → ProgressTracking (1:N)
- One user has multiple progress entries
- One entry per measurement session

### User → ExerciseLogs (1:N)
- One user logs many exercises
- Links to specific workout plan

### User → MealLogs (1:N)
- One user logs many meals
- Links to specific diet plan

### WorkoutPlan → WorkoutExercises (1:N)
- One plan contains multiple exercises
- Cascade delete: Plan deletion removes exercises

### DietPlan → Meals (1:N)
- One plan contains multiple meals
- Cascade delete: Plan deletion removes meals

---

## 📈 Indexing Strategy

### Performance Optimization

**Primary Lookup Indexes**:
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_profile_user ON profiles(user_id);
```

**Temporal Queries**:
```sql
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_workout_created_at ON workout_plans(created_at);
CREATE INDEX idx_diet_created_at ON diet_plans(created_at);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at);
CREATE INDEX idx_progress_date ON progress_tracking(measurement_date);
```

**User Activity Queries**:
```sql
CREATE INDEX idx_exercise_user_date ON exercise_logs(user_id, completed_at);
CREATE INDEX idx_meal_user_date ON meal_logs(user_id, eaten_at);
CREATE INDEX idx_chat_user_conversation ON chat_messages(user_id, conversation_id);
```

**Active Plans**:
```sql
CREATE INDEX idx_workout_user_active ON workout_plans(user_id, is_active);
CREATE INDEX idx_diet_user_active ON diet_plans(user_id, is_active);
```

---

## 🔐 Security & Data Protection

### Password Storage
- Never store plaintext passwords
- Use Argon2 or bcrypt hashing
- Minimum 12-character hash

### Sensitive Data
- Encrypt medical conditions and allergies
- Audit trail for medical data access
- HIPAA compliance considerations

### Access Control
- Row-level security by user_id
- No cross-user data access
- Authentication required for all endpoints

### Data Retention
- Archive old plans (> 2 years)
- Keep logs indefinitely (analytics)
- GDPR deletion support

---

## 🚀 Scaling Considerations

### Partitioning Strategy

**Time-based Partitioning**:
```sql
-- Partition chat_messages by month
-- Partition exercise_logs by month
-- Partition meal_logs by month
-- Partition progress_tracking by quarter
```

### Archival Strategy

```sql
-- Move completed plans to archive tables
-- Archive old chat conversations
-- Keep active user data in hot storage
-- Use cold storage for historical data
```

### Read Replicas

```
Master (write)
  ├─ Replica 1 (analytics)
  ├─ Replica 2 (reporting)
  └─ Replica 3 (backup)
```

---

## 📊 Example Queries

### Get User's Complete Profile

```python
from app.crud.queries import UserQueries, ProfileQueries

user = UserQueries.get_user_by_id(db, user_id=1)
profile = ProfileQueries.get_profile(db, user_id=1)

# Access profile data
print(f"BMI: {profile.bmi}")
print(f"Age Category: {profile.age_category}")
```

### Get Active Workout Plan with Exercises

```python
from app.crud.queries import WorkoutQueries
from sqlalchemy.orm import Session

plan = WorkoutQueries.get_active_workout_plan(db, user_id=1)

if plan:
    for exercise in plan.exercises:
        print(f"{exercise.name}: {exercise.sets}x{exercise.reps}")
```

### Log Exercise and Get Stats

```python
from app.crud.queries import ExerciseLogQueries

# Log exercise
log = ExerciseLogQueries.log_exercise(
    db,
    user_id=1,
    exercise_name="Bench Press",
    category="strength",
    sets_completed=4,
    reps_completed="8-10",
    weight_used=185.0
)

# Get stats
stats = ExerciseLogQueries.get_exercise_stats(db, user_id=1, days=30)
print(f"Total exercises this month: {stats['total_exercises']}")
print(f"Average duration: {stats['avg_duration_minutes']} min")
```

### Get User Dashboard

```python
from app.crud.queries import ComplexQueries

dashboard = ComplexQueries.get_user_dashboard_summary(db, user_id=1)

print(dashboard["user"])
print(dashboard["profile"])
print(dashboard["active_plans"])
print(dashboard["latest_progress"])
```

### Analyze Nutrition Progress

```python
from app.crud.queries import MealLogQueries

# Get daily calories
daily_calories = MealLogQueries.get_daily_calories(db, user_id=1)

# Get nutrition stats
stats = MealLogQueries.get_nutrition_stats(db, user_id=1, days=30)
print(f"Average daily calories: {stats['avg_daily_calories']}")
print(f"Total protein: {stats['total_protein_grams']}g")
```

### Generate User Insights

```python
from app.crud.queries import ComplexQueries

insights = ComplexQueries.get_user_insights(db, user_id=1)

print(f"BMI: {insights['fitness_profile']['bmi']}")
print(f"Exercises this month: {insights['exercise_insights']['total_exercises']}")
print(f"Weight loss: {insights['progress_insights']['loss']}kg")
print(f"Recommendations: {insights['recommendations']}")
```

---

## 🗄️ MongoDB Alternative Schema

If using MongoDB instead of SQL:

```javascript
// Users Collection
db.users.insertOne({
  _id: ObjectId(),
  email: "user@example.com",
  username: "johndoe",
  hashedPassword: "...",
  fullName: "John Doe",
  isActive: true,
  isVerified: false,
  createdAt: ISODate(),
  updatedAt: ISODate(),
  lastLogin: ISODate()
})

// Profiles Collection
db.profiles.insertOne({
  _id: ObjectId(),
  userId: ObjectId(),
  age: 28,
  weight: 75,
  height: 180,
  fitnessLevel: "intermediate",
  primaryGoal: "muscle_gain",
  medicalConditions: ["asthma"],
  dietaryRestrictions: [],
  preferences: {
    preferredFoods: ["chicken", "rice"],
    avoidedFoods: [],
    equipment: ["dumbbell", "barbell"]
  },
  lifestyle: {
    dailyActivityLevel: "moderate",
    sleepHours: 7.5,
    stressLevel: "medium"
  },
  createdAt: ISODate()
})

// WorkoutPlans Collection
db.workoutPlans.insertOne({
  _id: ObjectId(),
  userId: ObjectId(),
  name: "12-Week Strength",
  goal: "muscle_gain",
  durationWeeks: 12,
  frequencyPerWeek: 4,
  intensity: "high",
  exercises: [
    {
      name: "Bench Press",
      category: "strength",
      sets: 4,
      reps: "8-10",
      weight: 185,
      dayOfWeek: 0,
      order: 1
    }
  ],
  aiGenerated: true,
  ragDocumentsUsed: ["strength_training.txt"],
  isActive: true,
  startDate: ISODate(),
  createdAt: ISODate()
})

// ChatMessages Collection
db.chatMessages.insertOne({
  _id: ObjectId(),
  userId: ObjectId(),
  conversationId: "conv_123",
  userMessage: "Create a workout for muscle gain",
  aiResponse: "Here's a 12-week plan...",
  messageType: "workout_advice",
  ragDocumentsUsed: ["strength_training.txt"],
  citations: [
    { source: "s3://bucket/strength.txt", score: 0.95 }
  ],
  tokensUsed: 1500,
  estimatedCost: 0.015,
  userRating: 5,
  createdAt: ISODate()
})
```

---

## ✅ Database Migration Strategy

### Using Alembic

```bash
# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Version Control
- Keep migrations in git
- One file per change
- Tag releases with migration version

---

## 📋 Summary

| Aspect | Details |
|--------|---------|
| **Total Tables** | 10 core + 2 logging |
| **Relationships** | 1:1 (User-Profile), 1:N (11 relationships) |
| **JSON Columns** | 8 (for flexible data) |
| **Indexes** | 15+ performance indexes |
| **Foreign Keys** | Cascading deletes enabled |
| **Timestamps** | All tables tracked |
| **Archive Tables** | Recommended for historical data |
| **Partitioning** | By user_id and date |
| **Scaling Approach** | Master-replica with archives |

This database design provides a solid foundation for the AI Fitness Coach with proper normalization, performance optimization, and scalability considerations.
