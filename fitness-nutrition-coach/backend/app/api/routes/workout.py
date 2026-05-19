"""Workout routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import WorkoutGenerateRequest, WorkoutPlanResponse, WorkoutListResponse
from app.services.auth import AuthService
from app.services.workout import WorkoutService
from app.services.user import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])
workout_service = WorkoutService()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    logger.info(f"🔵 [workout:get_current_user] Authorization: {authorization}")
    
    if not authorization:
        logger.error("❌ [workout:get_current_user] Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        scheme, token = authorization.split()
        logger.info(f"🔵 [workout:get_current_user] Scheme: {scheme}, Token: {token[:20]}...")
        
        if scheme.lower() != "bearer":
            logger.error(f"❌ [workout:get_current_user] Invalid scheme: {scheme}")
            raise ValueError()
    except Exception as e:
        logger.error(f"❌ [workout:get_current_user] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    user = AuthService.get_current_user(db, token)
    
    if not user:
        logger.error("❌ [workout:get_current_user] Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    logger.info(f"✅ [workout:get_current_user] User: {user.email}")
    return user


@router.post("/generate", response_model=WorkoutPlanResponse)
async def generate_workout(
    request: WorkoutGenerateRequest,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI workout plan.
    
    Example request:
    ```json
    {
        "goal": "muscle_gain",
        "duration_weeks": 12,
        "frequency": 4,
        "equipment": ["dumbbell", "barbell", "bench"],
        "intensity": "high",
        "specific_requirements": "No leg exercises due to knee pain"
    }
    ```
    """
    # Get user profile
    user_profile = {
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "fitness_level": user.fitness_level,
        "goals": user.goals or [],
        "medical_conditions": user.medical_conditions or [],
    }
    
    # Generate workout
    workout = workout_service.generate_workout(
        db=db,
        user_id=user.id,
        user_profile=user_profile,
        request=request
    )
    
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate workout"
        )
    
    return workout


@router.get("/", response_model=WorkoutListResponse)
async def list_workouts(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's workout plans.
    
    Query parameters:
    - limit: Number of results (default: 10, max: 100)
    - offset: Number of results to skip (default: 0)
    """
    workouts, total = workout_service.get_user_workouts(
        db=db,
        user_id=user.id,
        limit=limit,
        offset=offset
    )
    
    return WorkoutListResponse(plans=workouts, total=total)


@router.get("/{workout_id}", response_model=WorkoutPlanResponse)
async def get_workout(
    workout_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific workout plan."""
    workout = workout_service.get_workout_by_id(db, user.id, workout_id)
    
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    return workout


@router.patch("/{workout_id}", response_model=WorkoutPlanResponse)
async def update_workout(
    workout_id: int,
    body: dict,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workout plan name or description."""
    from fastapi import Body
    workout = workout_service.update_workout(
        db, user.id, workout_id,
        name=body.get("name"),
        description=body.get("description"),
        goal=body.get("goal"),
        duration_weeks=body.get("duration_weeks"),
        frequency=body.get("frequency"),
        intensity=body.get("intensity"),
        equipment=body.get("equipment"),
    )
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout


@router.delete("/{workout_id}")
async def delete_workout(
    workout_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a workout plan."""
    deleted = workout_service.delete_workout(db, user.id, workout_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    return {"message": "Workout deleted successfully"}
