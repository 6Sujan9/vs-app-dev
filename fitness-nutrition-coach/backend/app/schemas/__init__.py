"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============ Auth Schemas ============

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[Dict[str, Any]] = None


class TokenRefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request."""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


# ============ User Schemas ============

class UserProfile(BaseModel):
    """User profile data."""
    age: Optional[int] = None
    weight: Optional[float] = None  # kg
    height: Optional[float] = None  # cm
    gender: Optional[str] = None  # male/female/other
    fitness_level: Optional[str] = None  # beginner/intermediate/advanced
    goals: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None


class UserResponse(BaseModel):
    """User response."""
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    age: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    gender: Optional[str]
    fitness_level: Optional[str]
    goals: Optional[List[str]]
    dietary_restrictions: Optional[List[str]]
    medical_conditions: Optional[List[str]]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Workout Schemas ============

class ExerciseDetail(BaseModel):
    """Exercise detail."""
    name: str
    sets: int
    reps: int
    duration_minutes: Optional[int] = None
    rest_seconds: int
    notes: Optional[str] = None


class WorkoutGenerateRequest(BaseModel):
    """Request to generate workout plan."""
    goal: str  # muscle_gain, weight_loss, endurance
    duration_weeks: int = Field(..., ge=1, le=52)
    frequency: int = Field(..., ge=1, le=7)  # sessions per week
    equipment: List[str]
    intensity: str  # low, medium, high
    specific_requirements: Optional[str] = None


class WorkoutPlanResponse(BaseModel):
    """Workout plan response."""
    id: int
    name: str
    description: Optional[str] = None
    goal: str
    duration_weeks: int
    frequency: int
    equipment: Optional[List[str]] = []
    intensity: str
    exercises: Optional[List[Dict[str, Any]]] = []
    tokens_used: Optional[int] = 0
    rag_documents_used: Optional[List[str]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkoutListResponse(BaseModel):
    """List of workout plans."""
    plans: List[WorkoutPlanResponse]
    total: int


# ============ Nutrition Schemas ============

class MealDetail(BaseModel):
    """Meal detail."""
    name: str
    foods: List[str]
    calories: int
    protein_grams: float
    carbs_grams: float
    fats_grams: float


class NutritionGenerateRequest(BaseModel):
    """Request to generate meal plan."""
    goal: str  # muscle_gain, weight_loss, maintenance
    duration_days: int = Field(..., ge=1, le=90)
    meals_per_day: int = Field(..., ge=1, le=6)
    daily_calories: int = Field(..., ge=1000, le=5000)
    diet_type: str  # vegan, keto, balanced, etc.
    preferred_foods: Optional[List[str]] = None
    avoided_foods: Optional[List[str]] = None


class NutritionPlanResponse(BaseModel):
    """Nutrition plan response."""
    id: int
    name: str
    description: Optional[str] = None
    goal: str
    duration_days: int
    meals_per_day: int
    daily_calories: int
    diet_type: str
    protein_grams: Optional[float] = 0
    carbs_grams: Optional[float] = 0
    fats_grams: Optional[float] = 0
    meals: Optional[List[Dict[str, Any]]] = []
    tokens_used: Optional[int] = 0
    rag_documents_used: Optional[List[str]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NutritionListResponse(BaseModel):
    """List of nutrition plans."""
    plans: List[NutritionPlanResponse]
    total: int


# ============ Chat Schemas ============

class ChatMessageRequest(BaseModel):
    """Chat message request."""
    message: str = Field(..., min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    """Chat message response."""
    id: int
    user_message: str
    ai_response: str
    rag_context_used: Optional[List[str]]
    tokens_used: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Chat history response."""
    messages: List[ChatMessageResponse]
    total: int


# ============ Progress Schemas ============

class ProgressLogRequest(BaseModel):
    """Progress log request."""
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    thighs: Optional[float] = None
    arms: Optional[float] = None
    exercises_completed: Optional[int] = None
    meals_logged: Optional[int] = None
    notes: Optional[str] = None


class ProgressLogResponse(BaseModel):
    """Progress log response."""
    id: int
    weight: Optional[float]
    body_fat_percentage: Optional[float]
    muscle_mass: Optional[float]
    chest: Optional[float]
    waist: Optional[float]
    hips: Optional[float]
    thighs: Optional[float]
    arms: Optional[float]
    exercises_completed: int
    meals_logged: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressListResponse(BaseModel):
    """Progress list response."""
    logs: List[ProgressLogResponse]
    total: int


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    """Error response."""
    detail: str
    status_code: int
