"""
Database Query Examples and Utilities
Comprehensive examples of CRUD operations and complex queries
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from app.models.models import (
    User, Profile, WorkoutPlan, DietPlan, ChatMessage,
    ProgressTracking, ExerciseLog, MealLog, WorkoutExercise,
    Meal, FitnessLevel, GoalType
)


# ============================================================================
# USER CRUD OPERATIONS
# ============================================================================

class UserQueries:
    """User-related database queries"""

    @staticmethod
    def create_user(
        db: Session,
        email: str,
        username: str,
        hashed_password: str,
        full_name: str = None
    ) -> User:
        """Create a new user"""
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """Get user by ID with all related data"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update_last_login(db: Session, user_id: int):
        """Update user's last login timestamp"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_login = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def get_active_users(db: Session, limit: int = 100) -> list:
        """Get all active users"""
        return db.query(User)\
            .filter(User.is_active == True)\
            .limit(limit)\
            .all()

    @staticmethod
    def get_verified_users(db: Session) -> list:
        """Get all verified users"""
        return db.query(User).filter(
            and_(User.is_verified == True, User.is_active == True)
        ).all()


# ============================================================================
# PROFILE CRUD OPERATIONS
# ============================================================================

class ProfileQueries:
    """Profile-related database queries"""

    @staticmethod
    def create_profile(db: Session, user_id: int, **profile_data) -> Profile:
        """Create user profile"""
        profile = Profile(user_id=user_id, **profile_data)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def get_profile(db: Session, user_id: int) -> Profile:
        """Get user profile with all details"""
        return db.query(Profile)\
            .filter(Profile.user_id == user_id)\
            .first()

    @staticmethod
    def update_profile(db: Session, user_id: int, **update_data) -> Profile:
        """Update user profile"""
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if profile:
            for key, value in update_data.items():
                setattr(profile, key, value)
            profile.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(profile)
        return profile

    @staticmethod
    def get_profiles_by_goal(db: Session, goal: GoalType) -> list:
        """Get all profiles with specific goal"""
        return db.query(Profile)\
            .filter(Profile.primary_goal == goal)\
            .all()

    @staticmethod
    def get_profiles_by_fitness_level(
        db: Session, 
        fitness_level: FitnessLevel
    ) -> list:
        """Get all profiles with specific fitness level"""
        return db.query(Profile)\
            .filter(Profile.fitness_level == fitness_level)\
            .all()

    @staticmethod
    def get_profiles_with_medical_condition(
        db: Session, 
        condition: str
    ) -> list:
        """Get profiles with specific medical condition"""
        return db.query(Profile)\
            .filter(Profile.medical_conditions.contains(condition))\
            .all()

    @staticmethod
    def calculate_avg_bmi_by_goal(db: Session, goal: GoalType) -> float:
        """Calculate average BMI for users with specific goal"""
        profiles = db.query(Profile)\
            .filter(Profile.primary_goal == goal)\
            .all()
        
        if not profiles:
            return 0
        
        total_bmi = sum(p.bmi for p in profiles)
        return total_bmi / len(profiles)


# ============================================================================
# WORKOUT PLAN QUERIES
# ============================================================================

class WorkoutQueries:
    """Workout plan-related queries"""

    @staticmethod
    def create_workout_plan(db: Session, user_id: int, **plan_data) -> WorkoutPlan:
        """Create a new workout plan"""
        plan = WorkoutPlan(user_id=user_id, **plan_data)
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def get_active_workout_plan(db: Session, user_id: int) -> WorkoutPlan:
        """Get user's current active workout plan"""
        return db.query(WorkoutPlan)\
            .filter(
                and_(
                    WorkoutPlan.user_id == user_id,
                    WorkoutPlan.is_active == True
                )
            )\
            .order_by(desc(WorkoutPlan.created_at))\
            .first()

    @staticmethod
    def get_all_workout_plans(db: Session, user_id: int) -> list:
        """Get all workout plans for a user"""
        return db.query(WorkoutPlan)\
            .filter(WorkoutPlan.user_id == user_id)\
            .order_by(desc(WorkoutPlan.created_at))\
            .all()

    @staticmethod
    def get_completed_workout_plans(db: Session, user_id: int) -> list:
        """Get completed workout plans"""
        return db.query(WorkoutPlan)\
            .filter(
                and_(
                    WorkoutPlan.user_id == user_id,
                    WorkoutPlan.is_active == False
                )
            )\
            .all()

    @staticmethod
    def get_plans_by_goal(db: Session, user_id: int, goal: GoalType) -> list:
        """Get workout plans for specific goal"""
        return db.query(WorkoutPlan)\
            .filter(
                and_(
                    WorkoutPlan.user_id == user_id,
                    WorkoutPlan.goal == goal
                )
            )\
            .all()

    @staticmethod
    def update_workout_plan(
        db: Session,
        plan_id: int,
        **update_data
    ) -> WorkoutPlan:
        """Update workout plan"""
        plan = db.query(WorkoutPlan).filter(WorkoutPlan.id == plan_id).first()
        if plan:
            for key, value in update_data.items():
                setattr(plan, key, value)
            plan.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan

    @staticmethod
    def deactivate_plan(db: Session, plan_id: int):
        """Mark plan as inactive (completed)"""
        plan = db.query(WorkoutPlan).filter(WorkoutPlan.id == plan_id).first()
        if plan:
            plan.is_active = False
            plan.end_date = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan


# ============================================================================
# DIET PLAN QUERIES
# ============================================================================

class DietQueries:
    """Diet plan-related queries"""

    @staticmethod
    def create_diet_plan(db: Session, user_id: int, **plan_data) -> DietPlan:
        """Create a new diet plan"""
        plan = DietPlan(user_id=user_id, **plan_data)
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def get_active_diet_plan(db: Session, user_id: int) -> DietPlan:
        """Get user's current active diet plan"""
        return db.query(DietPlan)\
            .filter(
                and_(
                    DietPlan.user_id == user_id,
                    DietPlan.is_active == True
                )
            )\
            .order_by(desc(DietPlan.created_at))\
            .first()

    @staticmethod
    def get_all_diet_plans(db: Session, user_id: int) -> list:
        """Get all diet plans for a user"""
        return db.query(DietPlan)\
            .filter(DietPlan.user_id == user_id)\
            .order_by(desc(DietPlan.created_at))\
            .all()

    @staticmethod
    def deactivate_diet_plan(db: Session, plan_id: int):
        """Mark diet plan as inactive"""
        plan = db.query(DietPlan).filter(DietPlan.id == plan_id).first()
        if plan:
            plan.is_active = False
            plan.end_date = datetime.utcnow()
            db.commit()
            db.refresh(plan)
        return plan


# ============================================================================
# CHAT HISTORY QUERIES
# ============================================================================

class ChatQueries:
    """Chat message-related queries"""

    @staticmethod
    def create_chat_message(
        db: Session,
        user_id: int,
        conversation_id: str,
        user_message: str,
        ai_response: str,
        **additional_data
    ) -> ChatMessage:
        """Create a chat message"""
        message = ChatMessage(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=user_message,
            ai_response=ai_response,
            **additional_data
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def get_conversation_history(
        db: Session,
        user_id: int,
        conversation_id: str,
        limit: int = 50
    ) -> list:
        """Get chat history for a conversation"""
        return db.query(ChatMessage)\
            .filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.conversation_id == conversation_id
                )
            )\
            .order_by(desc(ChatMessage.created_at))\
            .limit(limit)\
            .all()

    @staticmethod
    def get_recent_messages(
        db: Session,
        user_id: int,
        days: int = 7,
        limit: int = 50
    ) -> list:
        """Get recent chat messages"""
        since_date = datetime.utcnow() - timedelta(days=days)
        return db.query(ChatMessage)\
            .filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.created_at >= since_date
                )
            )\
            .order_by(desc(ChatMessage.created_at))\
            .limit(limit)\
            .all()

    @staticmethod
    def rate_message(db: Session, message_id: int, rating: int):
        """Rate a chat message (1-5 stars)"""
        message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
        if message and 1 <= rating <= 5:
            message.user_rating = rating
            db.commit()
            db.refresh(message)
        return message

    @staticmethod
    def get_messages_by_type(
        db: Session,
        user_id: int,
        message_type: str
    ) -> list:
        """Get messages of specific type"""
        return db.query(ChatMessage)\
            .filter(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.message_type == message_type
                )
            )\
            .all()

    @staticmethod
    def get_rag_usage_stats(db: Session, user_id: int) -> dict:
        """Get RAG document usage statistics"""
        messages = db.query(ChatMessage)\
            .filter(ChatMessage.user_id == user_id)\
            .all()
        
        total_messages = len(messages)
        messages_with_rag = sum(1 for m in messages if m.rag_documents_used)
        total_tokens = sum(m.tokens_used or 0 for m in messages)
        total_cost = sum(m.estimated_cost or 0 for m in messages)
        
        return {
            "total_messages": total_messages,
            "messages_with_rag": messages_with_rag,
            "rag_usage_percentage": (messages_with_rag / total_messages * 100) if total_messages > 0 else 0,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "avg_tokens_per_message": total_tokens / total_messages if total_messages > 0 else 0
        }


# ============================================================================
# PROGRESS TRACKING QUERIES
# ============================================================================

class ProgressQueries:
    """Progress tracking queries"""

    @staticmethod
    def create_progress_entry(
        db: Session,
        user_id: int,
        **measurement_data
    ) -> ProgressTracking:
        """Create progress tracking entry"""
        entry = ProgressTracking(user_id=user_id, **measurement_data)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def get_progress_entries(
        db: Session,
        user_id: int,
        days: int = 90,
        limit: int = 100
    ) -> list:
        """Get progress entries for last N days"""
        since_date = datetime.utcnow() - timedelta(days=days)
        return db.query(ProgressTracking)\
            .filter(
                and_(
                    ProgressTracking.user_id == user_id,
                    ProgressTracking.measurement_date >= since_date
                )
            )\
            .order_by(desc(ProgressTracking.measurement_date))\
            .limit(limit)\
            .all()

    @staticmethod
    def get_weight_progress(db: Session, user_id: int) -> list:
        """Get weight tracking history"""
        return db.query(
            ProgressTracking.measurement_date,
            ProgressTracking.weight
        )\
            .filter(
                and_(
                    ProgressTracking.user_id == user_id,
                    ProgressTracking.weight != None
                )
            )\
            .order_by(ProgressTracking.measurement_date)\
            .all()

    @staticmethod
    def calculate_weight_loss(db: Session, user_id: int) -> dict:
        """Calculate weight loss progress"""
        entries = db.query(ProgressTracking)\
            .filter(
                and_(
                    ProgressTracking.user_id == user_id,
                    ProgressTracking.weight != None
                )
            )\
            .order_by(ProgressTracking.measurement_date)\
            .all()
        
        if len(entries) < 2:
            return {"start_weight": None, "current_weight": None, "loss": None}
        
        start_weight = entries[0].weight
        current_weight = entries[-1].weight
        loss = start_weight - current_weight
        
        return {
            "start_weight": start_weight,
            "current_weight": current_weight,
            "loss": loss,
            "loss_percentage": (loss / start_weight * 100) if start_weight > 0 else 0,
            "days_tracked": (entries[-1].measurement_date - entries[0].measurement_date).days
        }

    @staticmethod
    def get_latest_progress(db: Session, user_id: int) -> ProgressTracking:
        """Get latest progress entry"""
        return db.query(ProgressTracking)\
            .filter(ProgressTracking.user_id == user_id)\
            .order_by(desc(ProgressTracking.measurement_date))\
            .first()


# ============================================================================
# EXERCISE LOG QUERIES
# ============================================================================

class ExerciseLogQueries:
    """Exercise logging queries"""

    @staticmethod
    def log_exercise(
        db: Session,
        user_id: int,
        **exercise_data
    ) -> ExerciseLog:
        """Log completed exercise"""
        log = ExerciseLog(user_id=user_id, **exercise_data)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_exercise_logs(
        db: Session,
        user_id: int,
        days: int = 30,
        limit: int = 100
    ) -> list:
        """Get exercise logs for recent period"""
        since_date = datetime.utcnow() - timedelta(days=days)
        return db.query(ExerciseLog)\
            .filter(
                and_(
                    ExerciseLog.user_id == user_id,
                    ExerciseLog.completed_at >= since_date
                )
            )\
            .order_by(desc(ExerciseLog.completed_at))\
            .limit(limit)\
            .all()

    @staticmethod
    def get_exercise_stats(db: Session, user_id: int, days: int = 30) -> dict:
        """Get exercise statistics"""
        since_date = datetime.utcnow() - timedelta(days=days)
        logs = db.query(ExerciseLog)\
            .filter(
                and_(
                    ExerciseLog.user_id == user_id,
                    ExerciseLog.completed_at >= since_date
                )
            )\
            .all()
        
        total_exercises = len(logs)
        total_duration = sum(log.duration_minutes or 0 for log in logs)
        avg_duration = total_duration / total_exercises if total_exercises > 0 else 0
        
        exercises_by_category = {}
        for log in logs:
            category = log.category.value
            exercises_by_category[category] = exercises_by_category.get(category, 0) + 1
        
        return {
            "total_exercises": total_exercises,
            "total_duration_minutes": total_duration,
            "avg_duration_minutes": avg_duration,
            "exercises_per_week": total_exercises / (days / 7) if days > 0 else 0,
            "by_category": exercises_by_category
        }


# ============================================================================
# MEAL LOG QUERIES
# ============================================================================

class MealLogQueries:
    """Meal logging queries"""

    @staticmethod
    def log_meal(
        db: Session,
        user_id: int,
        **meal_data
    ) -> MealLog:
        """Log consumed meal"""
        log = MealLog(user_id=user_id, **meal_data)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_meal_logs(
        db: Session,
        user_id: int,
        days: int = 30,
        limit: int = 100
    ) -> list:
        """Get meal logs for recent period"""
        since_date = datetime.utcnow() - timedelta(days=days)
        return db.query(MealLog)\
            .filter(
                and_(
                    MealLog.user_id == user_id,
                    MealLog.eaten_at >= since_date
                )
            )\
            .order_by(desc(MealLog.eaten_at))\
            .limit(limit)\
            .all()

    @staticmethod
    def get_daily_calories(
        db: Session,
        user_id: int,
        date: datetime = None
    ) -> int:
        """Get total calories consumed on specific date"""
        if date is None:
            date = datetime.utcnow()
        
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        
        result = db.query(func.sum(MealLog.calories))\
            .filter(
                and_(
                    MealLog.user_id == user_id,
                    MealLog.eaten_at >= start,
                    MealLog.eaten_at < end
                )
            )\
            .scalar()
        
        return result or 0

    @staticmethod
    def get_nutrition_stats(db: Session, user_id: int, days: int = 30) -> dict:
        """Get nutrition statistics"""
        since_date = datetime.utcnow() - timedelta(days=days)
        logs = db.query(MealLog)\
            .filter(
                and_(
                    MealLog.user_id == user_id,
                    MealLog.eaten_at >= since_date
                )
            )\
            .all()
        
        total_calories = sum(log.calories or 0 for log in logs)
        total_protein = sum(log.protein_grams or 0 for log in logs)
        total_carbs = sum(log.carbs_grams or 0 for log in logs)
        total_fats = sum(log.fats_grams or 0 for log in logs)
        num_days = len(set(log.eaten_at.date() for log in logs))
        
        return {
            "total_calories": total_calories,
            "avg_daily_calories": total_calories / num_days if num_days > 0 else 0,
            "total_protein_grams": total_protein,
            "total_carbs_grams": total_carbs,
            "total_fats_grams": total_fats,
            "days_logged": num_days,
            "meals_logged": len(logs)
        }


# ============================================================================
# COMPLEX QUERIES
# ============================================================================

class ComplexQueries:
    """Complex cross-table queries"""

    @staticmethod
    def get_user_dashboard_summary(db: Session, user_id: int) -> dict:
        """Get complete user dashboard summary"""
        user = db.query(User).filter(User.id == user_id).first()
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        active_workout = WorkoutQueries.get_active_workout_plan(db, user_id)
        active_diet = DietQueries.get_active_diet_plan(db, user_id)
        latest_progress = ProgressQueries.get_latest_progress(db, user_id)
        
        recent_exercises = db.query(ExerciseLog)\
            .filter(ExerciseLog.user_id == user_id)\
            .order_by(desc(ExerciseLog.completed_at))\
            .limit(5)\
            .all()
        
        recent_meals = db.query(MealLog)\
            .filter(MealLog.user_id == user_id)\
            .order_by(desc(MealLog.eaten_at))\
            .limit(5)\
            .all()
        
        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name
            },
            "profile": {
                "age": profile.age,
                "weight": profile.weight,
                "height": profile.height,
                "bmi": profile.bmi,
                "fitness_level": profile.fitness_level.value,
                "primary_goal": profile.primary_goal.value
            },
            "active_plans": {
                "workout": {
                    "id": active_workout.id if active_workout else None,
                    "name": active_workout.name if active_workout else None
                },
                "diet": {
                    "id": active_diet.id if active_diet else None,
                    "name": active_diet.name if active_diet else None
                }
            },
            "latest_progress": {
                "weight": latest_progress.weight if latest_progress else None,
                "body_fat_percentage": latest_progress.body_fat_percentage if latest_progress else None,
                "date": latest_progress.measurement_date if latest_progress else None
            },
            "recent_activity": {
                "exercises": len(recent_exercises),
                "meals": len(recent_meals)
            }
        }

    @staticmethod
    def get_user_insights(db: Session, user_id: int) -> dict:
        """Generate user insights from data"""
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        exercise_stats = ExerciseLogQueries.get_exercise_stats(db, user_id)
        nutrition_stats = MealLogQueries.get_nutrition_stats(db, user_id)
        weight_progress = ProgressQueries.calculate_weight_loss(db, user_id)
        
        return {
            "fitness_profile": {
                "age": profile.age,
                "bmi": round(profile.bmi, 1),
                "fitness_level": profile.fitness_level.value,
                "goal": profile.primary_goal.value
            },
            "exercise_insights": exercise_stats,
            "nutrition_insights": nutrition_stats,
            "progress_insights": weight_progress,
            "recommendations": ComplexQueries._generate_recommendations(
                profile, exercise_stats, nutrition_stats, weight_progress
            )
        }

    @staticmethod
    def _generate_recommendations(profile, exercise_stats, nutrition_stats, weight_progress) -> list:
        """Generate personalized recommendations based on data"""
        recommendations = []
        
        if exercise_stats["exercises_per_week"] < 3:
            recommendations.append("Increase exercise frequency to 3-4 times per week")
        
        if nutrition_stats["avg_daily_calories"] == 0:
            recommendations.append("Start logging meals to track nutrition")
        
        if weight_progress["loss"] is None:
            recommendations.append("Log body weight measurements to track progress")
        
        if exercise_stats["total_exercises"] > 0:
            recommendations.append("Great consistency! Keep up the workout routine")
        
        return recommendations

    @staticmethod
    def get_similar_users(
        db: Session,
        user_id: int,
        limit: int = 5
    ) -> list:
        """Find similar users based on profile"""
        user_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        
        similar_users = db.query(User, Profile)\
            .join(Profile, User.id == Profile.user_id)\
            .filter(
                and_(
                    Profile.user_id != user_id,
                    Profile.primary_goal == user_profile.primary_goal,
                    Profile.fitness_level == user_profile.fitness_level
                )
            )\
            .limit(limit)\
            .all()
        
        return similar_users
