"""Nutrition service."""

from sqlalchemy.orm import Session
from app.models import NutritionPlan
from app.schemas import NutritionGenerateRequest
from app.services.bedrock import BedrockService
from typing import Optional, List


class NutritionService:
    """Service for nutrition management."""

    def __init__(self):
        """Initialize services."""
        self.bedrock = BedrockService()

    def generate_meal_plan(
        self,
        db: Session,
        user_id: int,
        user_profile: dict,
        request: NutritionGenerateRequest,
    ) -> Optional[NutritionPlan]:
        """
        Generate a meal plan.
        
        Args:
            db: Database session
            user_id: User ID
            user_profile: User profile data
            request: Generation request
            
        Returns:
            Generated NutritionPlan or None if failed
        """
        # Call Bedrock to generate
        result = self.bedrock.generate_meal_plan(
            user_profile=user_profile,
            goal=request.goal,
            duration_days=request.duration_days,
            meals_per_day=request.meals_per_day,
            daily_calories=request.daily_calories,
            diet_type=request.diet_type,
            preferred_foods=request.preferred_foods,
            avoided_foods=request.avoided_foods,
        )
        
        # Calculate macros
        meals = result["meal_plan"].get("meals", [])
        total_protein = sum(m.get("protein_grams", 0) for m in meals)
        total_carbs = sum(m.get("carbs_grams", 0) for m in meals)
        total_fats = sum(m.get("fats_grams", 0) for m in meals)
        
        # Create database entry
        nutrition = NutritionPlan(
            user_id=user_id,
            name=result["meal_plan"].get("name", f"{request.diet_type} Meal Plan"),
            description=result["meal_plan"].get("description"),
            goal=request.goal,
            duration_days=request.duration_days,
            meals_per_day=request.meals_per_day,
            daily_calories=request.daily_calories,
            diet_type=request.diet_type,
            protein_grams=total_protein,
            carbs_grams=total_carbs,
            fats_grams=total_fats,
            meals=meals,
            bedrock_response=result["bedrock_response"],
            rag_documents_used=result["rag_documents"],
            tokens_used=result["tokens_used"],
        )
        
        db.add(nutrition)
        db.commit()
        db.refresh(nutrition)
        
        return nutrition

    def get_user_nutrition_plans(
        self,
        db: Session,
        user_id: int,
        limit: int = 10,
        offset: int = 0,
    ) -> tuple[List[NutritionPlan], int]:
        """
        Get user's nutrition plans.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Limit results
            offset: Offset for pagination
            
        Returns:
            Tuple of (plans list, total count)
        """
        query = db.query(NutritionPlan).filter(NutritionPlan.user_id == user_id)
        total = query.count()
        
        plans = query.order_by(NutritionPlan.created_at.desc()).limit(limit).offset(offset).all()
        
        return plans, total

    def get_nutrition_plan_by_id(
        self,
        db: Session,
        user_id: int,
        plan_id: int,
    ) -> Optional[NutritionPlan]:
        """
        Get a specific nutrition plan.
        
        Args:
            db: Database session
            user_id: User ID
            plan_id: Plan ID
            
        Returns:
            NutritionPlan or None if not found
        """
        return db.query(NutritionPlan).filter(
            (NutritionPlan.id == plan_id) & (NutritionPlan.user_id == user_id)
        ).first()

    def update_nutrition_plan(
        self,
        db: Session,
        user_id: int,
        plan_id: int,
        name: str = None,
        description: str = None,
        goal: str = None,
        diet_type: str = None,
        daily_calories: int = None,
        meals_per_day: int = None,
        duration_days: int = None,
    ) -> Optional[NutritionPlan]:
        plan = self.get_nutrition_plan_by_id(db, user_id, plan_id)
        if not plan:
            return None
        if name is not None:
            plan.name = name
        if description is not None:
            plan.description = description
        if goal is not None:
            plan.goal = goal
        if diet_type is not None:
            plan.diet_type = diet_type
        if daily_calories is not None:
            plan.daily_calories = daily_calories
        if meals_per_day is not None:
            plan.meals_per_day = meals_per_day
        if duration_days is not None:
            plan.duration_days = duration_days
        db.commit()
        db.refresh(plan)
        return plan

    def delete_nutrition_plan(
        self,
        db: Session,
        user_id: int,
        plan_id: int,
    ) -> bool:
        """
        Delete a nutrition plan.
        
        Args:
            db: Database session
            user_id: User ID
            plan_id: Plan ID
            
        Returns:
            True if deleted, False if not found
        """
        plan = self.get_nutrition_plan_by_id(db, user_id, plan_id)
        
        if not plan:
            return False
        
        db.delete(plan)
        db.commit()
        return True
