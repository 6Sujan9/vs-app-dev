"""Nutrition routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NutritionGenerateRequest, NutritionPlanResponse, NutritionListResponse
from app.services.auth import AuthService
from app.services.nutrition import NutritionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/nutrition", tags=["nutrition"])
nutrition_service = NutritionService()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    logger.info(f"🔵 [nutrition:get_current_user] Authorization: {authorization}")
    
    if not authorization:
        logger.error("❌ [nutrition:get_current_user] Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        scheme, token = authorization.split()
        logger.info(f"🔵 [nutrition:get_current_user] Scheme: {scheme}, Token: {token[:20]}...")
        
        if scheme.lower() != "bearer":
            logger.error(f"❌ [nutrition:get_current_user] Invalid scheme: {scheme}")
            raise ValueError()
    except Exception as e:
        logger.error(f"❌ [nutrition:get_current_user] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    user = AuthService.get_current_user(db, token)
    
    if not user:
        logger.error("❌ [nutrition:get_current_user] Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    logger.info(f"✅ [nutrition:get_current_user] User: {user.email}")
    return user


@router.post("/generate", response_model=NutritionPlanResponse)
async def generate_meal_plan(
    request: NutritionGenerateRequest,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI meal plan.
    
    Example request:
    ```json
    {
        "goal": "muscle_gain",
        "duration_days": 30,
        "meals_per_day": 4,
        "daily_calories": 2800,
        "diet_type": "balanced",
        "preferred_foods": ["chicken", "rice", "broccoli"],
        "avoided_foods": ["peanuts"]
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
        "dietary_restrictions": user.dietary_restrictions or [],
        "medical_conditions": user.medical_conditions or [],
    }
    
    # Generate meal plan
    nutrition = nutrition_service.generate_meal_plan(
        db=db,
        user_id=user.id,
        user_profile=user_profile,
        request=request
    )
    
    if not nutrition:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate meal plan"
        )
    
    return nutrition


@router.get("/", response_model=NutritionListResponse)
async def list_nutrition_plans(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's nutrition plans.
    
    Query parameters:
    - limit: Number of results (default: 10, max: 100)
    - offset: Number of results to skip (default: 0)
    """
    plans, total = nutrition_service.get_user_nutrition_plans(
        db=db,
        user_id=user.id,
        limit=limit,
        offset=offset
    )
    
    return NutritionListResponse(plans=plans, total=total)


@router.get("/{plan_id}", response_model=NutritionPlanResponse)
async def get_nutrition_plan(
    plan_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific nutrition plan."""
    plan = nutrition_service.get_nutrition_plan_by_id(db, user.id, plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrition plan not found"
        )
    
    return plan


@router.patch("/{plan_id}", response_model=NutritionPlanResponse)
async def update_nutrition_plan(
    plan_id: int,
    body: dict,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update nutrition plan name or description."""
    plan = nutrition_service.update_nutrition_plan(
        db, user.id, plan_id,
        name=body.get("name"),
        description=body.get("description"),
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.delete("/{plan_id}")
async def delete_nutrition_plan(
    plan_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a nutrition plan."""
    deleted = nutrition_service.delete_nutrition_plan(db, user.id, plan_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nutrition plan not found"
        )
    
    return {"message": "Nutrition plan deleted successfully"}
