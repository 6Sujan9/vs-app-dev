"""User routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserProfile, UserResponse
from app.services.auth import AuthService
from app.services.user import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    logger.info(f"🔵 [user:get_current_user] Authorization header received: {authorization}")
    
    if not authorization:
        logger.error("❌ [user:get_current_user] Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    # Extract token from "Bearer token"
    try:
        scheme, token = authorization.split()
        logger.info(f"🔵 [user:get_current_user] Scheme: {scheme}, Token first 20 chars: {token[:20]}...")
        
        if scheme.lower() != "bearer":
            logger.error(f"❌ [user:get_current_user] Invalid scheme: {scheme}")
            raise ValueError()
    except Exception as e:
        logger.error(f"❌ [user:get_current_user] Error parsing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    user = AuthService.get_current_user(db, token)
    
    if not user:
        logger.error("❌ [user:get_current_user] Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    logger.info(f"✅ [user:get_current_user] User authenticated: {user.email}")
    return user


@router.post("/profile", response_model=UserResponse)
async def create_or_update_profile(
    profile: UserProfile,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update user profile.
    
    Example request:
    ```json
    {
        "age": 25,
        "weight": 75,
        "height": 180,
        "gender": "male",
        "fitness_level": "intermediate",
        "goals": ["muscle_gain", "endurance"],
        "dietary_restrictions": ["vegetarian"],
        "medical_conditions": ["asthma"]
    }
    ```
    """
    updated_user = UserService.update_user_profile(db, user.id, profile)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile."""
    return user


@router.get("/metrics", response_model=dict)
async def get_user_metrics(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user metrics and statistics.
    
    Returns information about total workouts, nutrition plans, and progress logs.
    """
    metrics = UserService.get_user_metrics(db, user.id)
    return metrics
