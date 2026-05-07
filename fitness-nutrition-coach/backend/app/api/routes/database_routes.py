"""
FastAPI Endpoint Examples
Integration of database models with API routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.models.models import (
    User, Profile, WorkoutPlan, DietPlan, ChatMessage,
    ProgressTracking, ExerciseLog, MealLog,
    ProfileCreate, ProfileUpdate, WorkoutPlanCreate, DietPlanCreate,
    ChatMessageCreate, ExerciseLogCreate, MealLogCreate,
    ProgressTrackingCreate
)
from app.crud.queries import (
    UserQueries, ProfileQueries, WorkoutQueries, DietQueries,
    ChatQueries, ProgressQueries, ExerciseLogQueries, MealLogQueries,
    ComplexQueries
)
from app.services.auth import AuthService

logger = logging.getLogger(__name__)


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    logger.info(f"🔵 [database_routes:get_current_user] Authorization: {authorization}")
    
    if not authorization:
        logger.error("❌ [database_routes:get_current_user] Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    try:
        scheme, token = authorization.split()
        logger.info(f"🔵 [database_routes:get_current_user] Scheme: {scheme}, Token: {token[:20]}...")
        
        if scheme.lower() != "bearer":
            logger.error(f"❌ [database_routes:get_current_user] Invalid scheme: {scheme}")
            raise ValueError()
    except Exception as e:
        logger.error(f"❌ [database_routes:get_current_user] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )

    user = AuthService.get_current_user(db, token)

    if not user:
        logger.error("❌ [database_routes:get_current_user] Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    return user


# ============================================================================
# PROFILE ENDPOINTS
# ============================================================================

profile_router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@profile_router.get("/", response_model=dict)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    profile = ProfileQueries.get_profile(db, user_id=current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return {
        "id": profile.id,
        "age": profile.age,
        "weight": profile.weight,
        "height": profile.height,
        "bmi": profile.bmi,
        "fitness_level": profile.fitness_level.value,
        "primary_goal": profile.primary_goal.value,
        "medical_conditions": profile.medical_conditions,
        "dietary_restrictions": profile.dietary_restrictions,
        "target_weight": profile.target_weight,
        "target_daily_calories": profile.target_daily_calories
    }


@profile_router.post("/", response_model=dict)
async def create_user_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create user profile"""
    existing = ProfileQueries.get_profile(db, user_id=current_user.id)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists"
        )
    
    profile = ProfileQueries.create_profile(
        db,
        user_id=current_user.id,
        **profile_data.dict()
    )
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "bmi": profile.bmi,
        "created_at": profile.created_at.isoformat()
    }


@profile_router.put("/", response_model=dict)
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    profile = ProfileQueries.update_profile(
        db,
        user_id=current_user.id,
        **profile_data.dict(exclude_unset=True)
    )
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return {
        "id": profile.id,
        "updated_at": profile.updated_at.isoformat(),
        "bmi": profile.bmi
    }


# ============================================================================
# WORKOUT PLAN ENDPOINTS
# ============================================================================

workout_router = APIRouter(prefix="/api/v1/workouts", tags=["Workouts"])


@workout_router.get("/active", response_model=dict)
async def get_active_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active workout plan"""
    plan = WorkoutQueries.get_active_workout_plan(db, user_id=current_user.id)
    
    if not plan:
        return {"message": "No active workout plan"}
    
    return {
        "id": plan.id,
        "name": plan.name,
        "goal": plan.goal.value,
        "duration_weeks": plan.duration_weeks,
        "frequency_per_week": plan.frequency_per_week,
        "intensity": plan.intensity.value,
        "progress": {
            "start_date": plan.start_date.isoformat(),
            "expected_end_date": plan.end_date.isoformat() if plan.end_date else None
        },
        "exercises_count": len(plan.exercises),
        "ai_generated": plan.ai_generated,
        "rag_documents": plan.rag_documents_used
    }


@workout_router.get("/", response_model=List[dict])
async def get_all_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all user's workout plans"""
    plans = WorkoutQueries.get_all_workout_plans(db, user_id=current_user.id)
    
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "goal": plan.goal.value,
            "duration_weeks": plan.duration_weeks,
            "is_active": plan.is_active,
            "created_at": plan.created_at.isoformat()
        }
        for plan in plans
    ]


@workout_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_data: WorkoutPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new workout plan"""
    plan = WorkoutQueries.create_workout_plan(
        db,
        user_id=current_user.id,
        **workout_data.dict()
    )
    
    return {
        "id": plan.id,
        "name": plan.name,
        "created_at": plan.created_at.isoformat(),
        "message": "Workout plan created successfully"
    }


@workout_router.post("/{plan_id}/complete")
async def complete_workout(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark workout plan as completed"""
    plan = WorkoutQueries.deactivate_plan(db, plan_id=plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout plan not found"
        )
    
    return {
        "id": plan.id,
        "status": "completed",
        "ended_at": plan.end_date.isoformat()
    }


# ============================================================================
# DIET PLAN ENDPOINTS
# ============================================================================

diet_router = APIRouter(prefix="/api/v1/diet", tags=["Diet"])


@diet_router.get("/active", response_model=dict)
async def get_active_diet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active diet plan"""
    plan = DietQueries.get_active_diet_plan(db, user_id=current_user.id)
    
    if not plan:
        return {"message": "No active diet plan"}
    
    return {
        "id": plan.id,
        "name": plan.name,
        "diet_type": plan.diet_type.value,
        "daily_calories": plan.daily_calories,
        "macros": {
            "protein": plan.protein_grams,
            "carbs": plan.carbs_grams,
            "fats": plan.fats_grams
        },
        "meals_per_day": plan.meals_per_day,
        "duration_days": plan.duration_days,
        "ai_generated": plan.ai_generated,
        "meals_count": len(plan.meals)
    }


@diet_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_diet_plan(
    diet_data: DietPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new diet plan"""
    plan = DietQueries.create_diet_plan(
        db,
        user_id=current_user.id,
        **diet_data.dict()
    )
    
    return {
        "id": plan.id,
        "name": plan.name,
        "created_at": plan.created_at.isoformat()
    }


# ============================================================================
# CHAT ENDPOINTS
# ============================================================================

chat_router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


@chat_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create chat message with AI response"""
    # In real implementation, this would call RAG-enabled Bedrock service
    # For now, showing database structure
    
    message = ChatQueries.create_chat_message(
        db,
        user_id=current_user.id,
        user_message=message_data.user_message,
        conversation_id=message_data.conversation_id,
        ai_response="AI response would go here",  # From Bedrock
        message_type=message_data.message_type,
        rag_documents_used=[],  # From RAG retrieval
        citations=[]  # From citation extraction
    )
    
    return {
        "id": message.id,
        "user_message": message.user_message,
        "ai_response": message.ai_response,
        "created_at": message.created_at.isoformat()
    }


@chat_router.get("/conversations/{conversation_id}", response_model=List[dict])
async def get_conversation_history(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat conversation history"""
    messages = ChatQueries.get_conversation_history(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id
    )
    
    return [
        {
            "id": msg.id,
            "user_message": msg.user_message,
            "ai_response": msg.ai_response,
            "citations": msg.citations,
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ]


@chat_router.post("/{message_id}/rate")
async def rate_message(
    message_id: int,
    rating: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a chat message"""
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    message = ChatQueries.rate_message(db, message_id=message_id, rating=rating)
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {"message_id": message_id, "rating": rating}


# ============================================================================
# PROGRESS TRACKING ENDPOINTS
# ============================================================================

progress_router = APIRouter(prefix="/api/v1/progress", tags=["Progress"])


@progress_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_progress_entry(
    progress_data: ProgressTrackingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log progress tracking entry"""
    entry = ProgressQueries.create_progress_entry(
        db,
        user_id=current_user.id,
        **progress_data.dict()
    )
    
    return {
        "id": entry.id,
        "measurement_date": entry.measurement_date.isoformat(),
        "weight": entry.weight,
        "body_fat_percentage": entry.body_fat_percentage
    }


@progress_router.get("/history", response_model=dict)
async def get_progress_history(
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress tracking history"""
    entries = ProgressQueries.get_progress_entries(
        db,
        user_id=current_user.id,
        days=days
    )
    
    weight_progress = ProgressQueries.calculate_weight_loss(
        db,
        user_id=current_user.id
    )
    
    return {
        "entries": len(entries),
        "weight_progress": weight_progress,
        "entries_data": [
            {
                "date": entry.measurement_date.isoformat(),
                "weight": entry.weight,
                "body_fat": entry.body_fat_percentage
            }
            for entry in entries
        ]
    }


@progress_router.get("/latest", response_model=dict)
async def get_latest_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get latest progress entry"""
    entry = ProgressQueries.get_latest_progress(db, user_id=current_user.id)
    
    if not entry:
        return {"message": "No progress entries yet"}
    
    return {
        "date": entry.measurement_date.isoformat(),
        "weight": entry.weight,
        "body_fat_percentage": entry.body_fat_percentage,
        "muscle_mass": entry.muscle_mass,
        "resting_heart_rate": entry.resting_heart_rate,
        "sleep_quality": entry.sleep_quality,
        "stress_level": entry.stress_level,
        "energy_level": entry.energy_level,
        "mood": entry.mood
    }


# ============================================================================
# ACTIVITY LOGGING ENDPOINTS
# ============================================================================

activity_router = APIRouter(prefix="/api/v1/activity", tags=["Activity"])


@activity_router.post("/exercise", response_model=dict, status_code=status.HTTP_201_CREATED)
async def log_exercise(
    exercise_data: ExerciseLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log completed exercise"""
    log = ExerciseLogQueries.log_exercise(
        db,
        user_id=current_user.id,
        **exercise_data.dict()
    )
    
    return {
        "id": log.id,
        "exercise_name": log.exercise_name,
        "sets_completed": log.sets_completed,
        "logged_at": log.completed_at.isoformat()
    }


@activity_router.post("/meal", response_model=dict, status_code=status.HTTP_201_CREATED)
async def log_meal(
    meal_data: MealLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log consumed meal"""
    log = MealLogQueries.log_meal(
        db,
        user_id=current_user.id,
        **meal_data.dict()
    )
    
    return {
        "id": log.id,
        "meal_name": log.meal_name,
        "calories": log.calories,
        "logged_at": log.logged_at.isoformat()
    }


@activity_router.get("/exercises/today", response_model=dict)
async def get_today_exercises(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's exercises"""
    logs = ExerciseLogQueries.get_exercise_logs(
        db,
        user_id=current_user.id,
        days=1
    )
    
    return {
        "date": datetime.utcnow().date().isoformat(),
        "exercises_completed": len(logs),
        "total_duration_minutes": sum(log.duration_minutes or 0 for log in logs)
    }


@activity_router.get("/meals/today", response_model=dict)
async def get_today_meals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's meals"""
    total_calories = MealLogQueries.get_daily_calories(
        db,
        user_id=current_user.id
    )
    
    logs = MealLogQueries.get_meal_logs(
        db,
        user_id=current_user.id,
        days=1
    )
    
    return {
        "date": datetime.utcnow().date().isoformat(),
        "meals_logged": len(logs),
        "total_calories": total_calories
    }


# ============================================================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ============================================================================

dashboard_router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@dashboard_router.get("/summary", response_model=dict)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete user dashboard"""
    summary = ComplexQueries.get_user_dashboard_summary(db, current_user.id)
    return summary


@dashboard_router.get("/insights", response_model=dict)
async def get_user_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized user insights"""
    insights = ComplexQueries.get_user_insights(db, current_user.id)
    return insights


@dashboard_router.get("/stats/exercise", response_model=dict)
async def get_exercise_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get exercise statistics"""
    stats = ExerciseLogQueries.get_exercise_stats(db, current_user.id, days=days)
    return stats


@dashboard_router.get("/stats/nutrition", response_model=dict)
async def get_nutrition_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get nutrition statistics"""
    stats = MealLogQueries.get_nutrition_stats(db, current_user.id, days=days)
    return stats


@dashboard_router.get("/stats/rag-usage", response_model=dict)
async def get_rag_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get RAG document usage statistics"""
    stats = ChatQueries.get_rag_usage_stats(db, current_user.id)
    return stats


# ============================================================================
# ROUTE REGISTRATION
# ============================================================================

# Create main router and include all sub-routers
router = APIRouter()
router.include_router(profile_router)
router.include_router(workout_router)
router.include_router(diet_router)
router.include_router(chat_router)
router.include_router(progress_router)
router.include_router(activity_router)
router.include_router(dashboard_router)


def register_database_routes(app):
    """Register all database-related routes to FastAPI app"""
    app.include_router(profile_router)
    app.include_router(workout_router)
    app.include_router(diet_router)
    app.include_router(chat_router)
    app.include_router(progress_router)
    app.include_router(activity_router)
    app.include_router(dashboard_router)
