"""User service."""

from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserProfile
from typing import Optional


class UserService:
    """Service for user management."""

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def update_user_profile(
        db: Session,
        user_id: int,
        profile: UserProfile
    ) -> Optional[User]:
        """
        Update user profile.
        
        Args:
            db: Database session
            user_id: User ID
            profile: User profile data
            
        Returns:
            Updated user or None if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        # Update fields if provided
        update_data = profile.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_metrics(db: Session, user_id: int) -> dict:
        """
        Get user metrics and statistics.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with metrics
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return {}
        
        # Count workouts and nutrition plans
        from app.models import WorkoutPlan, NutritionPlan, ProgressLog
        
        workout_count = db.query(WorkoutPlan).filter(
            WorkoutPlan.user_id == user_id
        ).count()
        
        nutrition_count = db.query(NutritionPlan).filter(
            NutritionPlan.user_id == user_id
        ).count()
        
        progress_count = db.query(ProgressLog).filter(
            ProgressLog.user_id == user_id
        ).count()
        
        return {
            "user_id": user_id,
            "total_workouts": workout_count,
            "total_nutrition_plans": nutrition_count,
            "total_progress_logs": progress_count,
            "current_weight": user.weight,
            "fitness_level": user.fitness_level,
        }
