"""Workout service."""

from sqlalchemy.orm import Session
from app.models import WorkoutPlan
from app.schemas import WorkoutGenerateRequest
from app.services.bedrock import BedrockService
from typing import Optional, List


class WorkoutService:
    """Service for workout management."""

    def __init__(self):
        """Initialize services."""
        self.bedrock = BedrockService()

    def generate_workout(
        self,
        db: Session,
        user_id: int,
        user_profile: dict,
        request: WorkoutGenerateRequest,
    ) -> Optional[WorkoutPlan]:
        """
        Generate a workout plan.
        
        Args:
            db: Database session
            user_id: User ID
            user_profile: User profile data
            request: Generation request
            
        Returns:
            Generated WorkoutPlan or None if failed
        """
        # Call Bedrock to generate
        result = self.bedrock.generate_workout(
            user_profile=user_profile,
            goal=request.goal,
            duration_weeks=request.duration_weeks,
            frequency=request.frequency,
            equipment=request.equipment,
            intensity=request.intensity,
            specific_requirements=request.specific_requirements,
        )
        
        # Create database entry
        workout = WorkoutPlan(
            user_id=user_id,
            name=result["workout"].get("name", f"{request.goal} Plan"),
            description=result["workout"].get("description"),
            goal=request.goal,
            duration_weeks=request.duration_weeks,
            frequency=request.frequency,
            equipment=request.equipment,
            intensity=request.intensity,
            exercises=result["workout"].get("exercises", []),
            bedrock_response=result["bedrock_response"],
            rag_documents_used=result["rag_documents"],
            tokens_used=result["tokens_used"],
        )
        
        db.add(workout)
        db.commit()
        db.refresh(workout)
        
        return workout

    def get_user_workouts(
        self,
        db: Session,
        user_id: int,
        limit: int = 10,
        offset: int = 0,
    ) -> tuple[List[WorkoutPlan], int]:
        """
        Get user's workout plans.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Limit results
            offset: Offset for pagination
            
        Returns:
            Tuple of (workouts list, total count)
        """
        query = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id)
        total = query.count()
        
        workouts = query.order_by(WorkoutPlan.created_at.desc()).limit(limit).offset(offset).all()
        
        return workouts, total

    def get_workout_by_id(
        self,
        db: Session,
        user_id: int,
        workout_id: int,
    ) -> Optional[WorkoutPlan]:
        """
        Get a specific workout plan.
        
        Args:
            db: Database session
            user_id: User ID
            workout_id: Workout ID
            
        Returns:
            WorkoutPlan or None if not found
        """
        return db.query(WorkoutPlan).filter(
            (WorkoutPlan.id == workout_id) & (WorkoutPlan.user_id == user_id)
        ).first()

    def update_workout(
        self,
        db: Session,
        user_id: int,
        workout_id: int,
        name: str = None,
        description: str = None,
    ) -> Optional[WorkoutPlan]:
        workout = self.get_workout_by_id(db, user_id, workout_id)
        if not workout:
            return None
        if name is not None:
            workout.name = name
        if description is not None:
            workout.description = description
        db.commit()
        db.refresh(workout)
        return workout

    def delete_workout(
        self,
        db: Session,
        user_id: int,
        workout_id: int,
    ) -> bool:
        """
        Delete a workout plan.
        
        Args:
            db: Database session
            user_id: User ID
            workout_id: Workout ID
            
        Returns:
            True if deleted, False if not found
        """
        workout = self.get_workout_by_id(db, user_id, workout_id)
        
        if not workout:
            return False
        
        db.delete(workout)
        db.commit()
        return True
