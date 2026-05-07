"""
Database Models for AI Fitness Coach
SQLAlchemy ORM models with relationships and constraints
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, 
    Enum as SQLEnum, ForeignKey, Text, JSON, UniqueConstraint,
    Index, Table
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import EmailStr, BaseModel

Base = declarative_base()


# ============================================================================
# Enums
# ============================================================================

class FitnessLevel(str, Enum):
    """User fitness levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    ELITE = "elite"


class GoalType(str, Enum):
    """Fitness goal types"""
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"
    GENERAL_FITNESS = "general_fitness"
    STRENGTH = "strength"
    SPORTS_PERFORMANCE = "sports_performance"


class WorkoutIntensity(str, Enum):
    """Workout intensity levels"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class DietType(str, Enum):
    """Diet types"""
    BALANCED = "balanced"
    HIGH_PROTEIN = "high_protein"
    LOW_CARB = "low_carb"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    MEDITERRANEAN = "mediterranean"
    KETO = "keto"
    PALEO = "paleo"


class ExerciseCategory(str, Enum):
    """Exercise categories"""
    CARDIO = "cardio"
    STRENGTH = "strength"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"
    REHABILITATION = "rehabilitation"


class MeasurementUnit(str, Enum):
    """Measurement units"""
    KG = "kg"
    LBS = "lbs"
    CM = "cm"
    INCHES = "inches"
    PERCENT = "percent"


# ============================================================================
# User and Profile Models
# ============================================================================

class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    workout_plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    diet_plans = relationship("DietPlan", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    progress_tracking = relationship("ProgressTracking", back_populates="user", cascade="all, delete-orphan")
    meal_logs = relationship("MealLog", back_populates="user", cascade="all, delete-orphan")
    exercise_logs = relationship("ExerciseLog", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_username', 'username'),
        Index('idx_user_created_at', 'created_at'),
    )


class Profile(Base):
    """User fitness profile"""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic Information
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=True)
    height = Column(Float, nullable=False)  # in cm
    weight = Column(Float, nullable=False)  # in kg
    
    # Fitness Information
    fitness_level = Column(SQLEnum(FitnessLevel), default=FitnessLevel.BEGINNER)
    primary_goal = Column(SQLEnum(GoalType), nullable=False)
    secondary_goals = Column(JSON, default=list)  # List of GoalType
    target_weight = Column(Float, nullable=True)
    years_experience = Column(Integer, default=0)
    
    # Health Information
    dietary_restrictions = Column(JSON, default=list)  # e.g., ["gluten_free", "nut_allergy"]
    medical_conditions = Column(JSON, default=list)  # e.g., ["asthma", "type_2_diabetes"]
    medications = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    injuries = Column(JSON, default=list)
    
    # Preferences
    preferred_diet_type = Column(SQLEnum(DietType), default=DietType.BALANCED)
    preferred_foods = Column(JSON, default=list)
    avoided_foods = Column(JSON, default=list)
    exercises_preference = Column(JSON, default=list)  # Preferred exercise types
    equipment_available = Column(JSON, default=list)  # Available equipment
    
    # Lifestyle
    daily_activity_level = Column(String(50), default="moderate")  # sedentary, light, moderate, active, very_active
    sleep_hours = Column(Float, nullable=True)
    stress_level = Column(String(50), nullable=True)  # low, moderate, high
    working_hours = Column(Integer, nullable=True)  # hours per day
    
    # Targets
    target_daily_calories = Column(Integer, nullable=True)
    target_daily_steps = Column(Integer, nullable=True)
    target_daily_water = Column(Float, nullable=True)  # in liters
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

    @property
    def bmi(self):
        """Calculate BMI from height and weight"""
        height_m = self.height / 100
        return self.weight / (height_m ** 2)

    @property
    def age_category(self):
        """Categorize age"""
        if self.age < 18:
            return "teen"
        elif self.age < 30:
            return "young_adult"
        elif self.age < 50:
            return "adult"
        else:
            return "senior"


# ============================================================================
# Workout Plan Models
# ============================================================================

class WorkoutPlan(Base):
    """AI-generated or user workout plan"""
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Plan Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(SQLEnum(GoalType), nullable=False)
    
    # Plan Details
    duration_weeks = Column(Integer, nullable=False)
    frequency_per_week = Column(Integer, nullable=False)  # e.g., 4 (4 times per week)
    intensity = Column(SQLEnum(WorkoutIntensity), default=WorkoutIntensity.MODERATE)
    session_duration_minutes = Column(Integer, nullable=False)
    
    # Equipment and Preferences
    equipment_needed = Column(JSON, default=list)
    exercise_categories = Column(JSON, default=list)
    
    # AI Generation Details
    ai_model_used = Column(String(100), default="anthropic.claude-3-sonnet-20240229-v1:0")
    ai_generated = Column(Boolean, default=True)
    rag_documents_used = Column(JSON, default=list)  # List of source documents
    
    # Content
    plan_content = Column(JSON, nullable=True)  # Full plan structure
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="workout_plans")
    exercises = relationship("WorkoutExercise", back_populates="plan", cascade="all, delete-orphan")
    logs = relationship("ExerciseLog", back_populates="plan")

    __table_args__ = (
        Index('idx_workout_user_active', 'user_id', 'is_active'),
        Index('idx_workout_created_at', 'created_at'),
    )


class WorkoutExercise(Base):
    """Exercise within a workout plan"""
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    
    # Exercise Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(ExerciseCategory), nullable=False)
    
    # Exercise Details
    sets = Column(Integer, nullable=False)
    reps = Column(String(50), nullable=True)  # e.g., "8-12" or "30 seconds"
    rest_seconds = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    instructions = Column(Text, nullable=True)
    
    # Variations
    alternative_exercises = Column(JSON, default=list)
    modifications = Column(JSON, default=list)
    
    # Ordering
    day_of_week = Column(Integer, nullable=False)  # 0-6 (Mon-Sun)
    order_in_workout = Column(Integer, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plan = relationship("WorkoutPlan", back_populates="exercises")


# ============================================================================
# Diet Plan Models
# ============================================================================

class DietPlan(Base):
    """AI-generated or user diet plan"""
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Plan Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(SQLEnum(GoalType), nullable=False)
    diet_type = Column(SQLEnum(DietType), nullable=False)
    
    # Plan Details
    duration_days = Column(Integer, nullable=False)
    meals_per_day = Column(Integer, default=3)
    daily_calories = Column(Integer, nullable=False)
    
    # Macros
    protein_grams = Column(Float, nullable=False)
    carbs_grams = Column(Float, nullable=False)
    fats_grams = Column(Float, nullable=False)
    
    # Dietary Info
    dietary_restrictions = Column(JSON, default=list)
    preferred_foods = Column(JSON, default=list)
    avoided_foods = Column(JSON, default=list)
    
    # AI Generation Details
    ai_model_used = Column(String(100), default="anthropic.claude-3-sonnet-20240229-v1:0")
    ai_generated = Column(Boolean, default=True)
    rag_documents_used = Column(JSON, default=list)  # List of source documents
    
    # Content
    plan_content = Column(JSON, nullable=True)  # Full plan structure
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="diet_plans")
    meals = relationship("Meal", back_populates="plan", cascade="all, delete-orphan")
    logs = relationship("MealLog", back_populates="plan")

    __table_args__ = (
        Index('idx_diet_user_active', 'user_id', 'is_active'),
        Index('idx_diet_created_at', 'created_at'),
    )


class Meal(Base):
    """Meal within a diet plan"""
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=False)
    
    # Meal Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meal_type = Column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    
    # Nutrition Information
    calories = Column(Integer, nullable=False)
    protein_grams = Column(Float, nullable=False)
    carbs_grams = Column(Float, nullable=False)
    fats_grams = Column(Float, nullable=False)
    fiber_grams = Column(Float, nullable=True)
    
    # Ingredients
    ingredients = Column(JSON, nullable=False)  # List of ingredients with amounts
    
    # Instructions
    preparation_steps = Column(JSON, nullable=True)
    cooking_time_minutes = Column(Integer, nullable=True)
    
    # Dietary Info
    dietary_tags = Column(JSON, default=list)  # e.g., ["gluten_free", "high_protein"]
    
    # Ordering
    day_of_week = Column(Integer, nullable=False)  # 0-6 (Mon-Sun)
    order_in_day = Column(Integer, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    plan = relationship("DietPlan", back_populates="meals")


# ============================================================================
# Chat History Models
# ============================================================================

class ChatMessage(Base):
    """Chat conversation history"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String(100), index=True, nullable=False)  # Group messages by conversation
    
    # Message Content
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    
    # Message Type
    message_type = Column(String(50), default="general")  # general, workout_advice, nutrition_advice, health_question
    
    # AI Details
    ai_model_used = Column(String(100), default="anthropic.claude-3-sonnet-20240229-v1:0")
    rag_documents_used = Column(JSON, default=list)  # List of source documents used
    citations = Column(JSON, default=list)  # Source citations for transparency
    
    # Tokens and Cost
    tokens_used = Column(Integer, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    
    # Feedback
    user_rating = Column(Integer, nullable=True)  # 1-5 star rating
    feedback = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")

    __table_args__ = (
        Index('idx_chat_user_conversation', 'user_id', 'conversation_id'),
        Index('idx_chat_created_at', 'created_at'),
    )


# ============================================================================
# Progress Tracking Models
# ============================================================================

class ProgressTracking(Base):
    """Track user's fitness and health progress"""
    __tablename__ = "progress_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Date
    measurement_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Body Measurements
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    
    # Circumference Measurements
    chest_cm = Column(Float, nullable=True)
    waist_cm = Column(Float, nullable=True)
    hips_cm = Column(Float, nullable=True)
    arm_cm = Column(Float, nullable=True)
    thigh_cm = Column(Float, nullable=True)
    
    # Performance Metrics
    bench_press_max = Column(Float, nullable=True)
    squat_max = Column(Float, nullable=True)
    deadlift_max = Column(Float, nullable=True)
    run_5k_time = Column(String(50), nullable=True)  # e.g., "25:30"
    
    # Health Metrics
    resting_heart_rate = Column(Integer, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    cholesterol = Column(Float, nullable=True)
    
    # Wellness
    sleep_quality = Column(Integer, nullable=True)  # 1-10
    stress_level = Column(Integer, nullable=True)  # 1-10
    energy_level = Column(Integer, nullable=True)  # 1-10
    mood = Column(Integer, nullable=True)  # 1-10
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="progress_tracking")

    __table_args__ = (
        Index('idx_progress_user_date', 'user_id', 'measurement_date'),
    )


# ============================================================================
# Activity Logging Models
# ============================================================================

class ExerciseLog(Base):
    """Log of completed exercises"""
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=True)
    
    # Exercise Info
    exercise_name = Column(String(255), nullable=False)
    category = Column(SQLEnum(ExerciseCategory), nullable=False)
    
    # Performance
    sets_completed = Column(Integer, nullable=False)
    reps_completed = Column(String(50), nullable=True)
    weight_used = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Quality Metrics
    difficulty_rating = Column(Integer, nullable=True)  # 1-10
    notes = Column(Text, nullable=True)
    
    # Timestamps
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)
    duration_minutes = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="exercise_logs")
    plan = relationship("WorkoutPlan", back_populates="logs")

    __table_args__ = (
        Index('idx_exercise_user_date', 'user_id', 'completed_at'),
    )


class MealLog(Base):
    """Log of meals consumed"""
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("diet_plans.id"), nullable=True)
    
    # Meal Info
    meal_name = Column(String(255), nullable=False)
    meal_type = Column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    
    # Nutrition
    calories = Column(Integer, nullable=False)
    protein_grams = Column(Float, nullable=True)
    carbs_grams = Column(Float, nullable=True)
    fats_grams = Column(Float, nullable=True)
    
    # Ingredients Logged
    ingredients = Column(JSON, nullable=True)
    
    # Ratings
    tastiness_rating = Column(Integer, nullable=True)  # 1-10
    satisfaction_rating = Column(Integer, nullable=True)  # 1-10
    notes = Column(Text, nullable=True)
    
    # Timestamps
    eaten_at = Column(DateTime, default=datetime.utcnow, index=True)
    logged_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="meal_logs")
    plan = relationship("DietPlan", back_populates="logs")

    __table_args__ = (
        Index('idx_meal_user_date', 'user_id', 'eaten_at'),
    )


# ============================================================================
# Pydantic Schemas (for API requests/responses)
# ============================================================================

class ProfileCreate(BaseModel):
    """Schema for creating a profile"""
    age: int
    height: float
    weight: float
    gender: Optional[str] = None
    fitness_level: FitnessLevel = FitnessLevel.BEGINNER
    primary_goal: GoalType
    target_weight: Optional[float] = None
    dietary_restrictions: Optional[List[str]] = []
    medical_conditions: Optional[List[str]] = []


class ProfileUpdate(BaseModel):
    """Schema for updating a profile"""
    age: Optional[int] = None
    weight: Optional[float] = None
    fitness_level: Optional[FitnessLevel] = None
    primary_goal: Optional[GoalType] = None


class WorkoutPlanCreate(BaseModel):
    """Schema for creating a workout plan"""
    name: str
    description: Optional[str] = None
    goal: GoalType
    duration_weeks: int
    frequency_per_week: int
    intensity: WorkoutIntensity
    session_duration_minutes: int
    equipment_needed: Optional[List[str]] = []


class DietPlanCreate(BaseModel):
    """Schema for creating a diet plan"""
    name: str
    description: Optional[str] = None
    goal: GoalType
    diet_type: DietType
    duration_days: int
    daily_calories: int
    protein_grams: float
    carbs_grams: float
    fats_grams: float


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message"""
    user_message: str
    conversation_id: str
    message_type: str = "general"


class ExerciseLogCreate(BaseModel):
    """Schema for logging an exercise"""
    exercise_name: str
    category: ExerciseCategory
    sets_completed: int
    reps_completed: Optional[str] = None
    weight_used: Optional[float] = None


class MealLogCreate(BaseModel):
    """Schema for logging a meal"""
    meal_name: str
    meal_type: str
    calories: int
    protein_grams: Optional[float] = None


class ProgressTrackingCreate(BaseModel):
    """Schema for creating a progress tracking entry"""
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    notes: Optional[str] = None
