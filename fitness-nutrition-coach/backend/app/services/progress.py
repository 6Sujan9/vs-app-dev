"""Progress service."""

from sqlalchemy.orm import Session
from app.models import ProgressLog
from app.schemas import ProgressLogRequest
from datetime import datetime, timedelta
from typing import Optional, List


class ProgressService:
    """Service for progress tracking."""

    @staticmethod
    def log_progress(
        db: Session,
        user_id: int,
        request: ProgressLogRequest,
    ) -> Optional[ProgressLog]:
        """
        Log progress for user.
        
        Args:
            db: Database session
            user_id: User ID
            request: Progress log request
            
        Returns:
            ProgressLog or None if failed
        """
        log = ProgressLog(
            user_id=user_id,
            weight=request.weight,
            body_fat_percentage=request.body_fat_percentage,
            muscle_mass=request.muscle_mass,
            chest=request.chest,
            waist=request.waist,
            hips=request.hips,
            thighs=request.thighs,
            arms=request.arms,
            exercises_completed=request.exercises_completed or 0,
            meals_logged=request.meals_logged or 0,
            notes=request.notes,
        )
        
        db.add(log)
        db.commit()
        db.refresh(log)
        
        return log

    @staticmethod
    def get_user_progress(
        db: Session,
        user_id: int,
        days: int = 30,
        limit: int = 100,
    ) -> tuple[List[ProgressLog], int]:
        """
        Get user's progress logs.
        
        Args:
            db: Database session
            user_id: User ID
            days: Get logs from last N days
            limit: Limit results
            
        Returns:
            Tuple of (logs list, total count)
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.query(ProgressLog).filter(
            (ProgressLog.user_id == user_id) &
            (ProgressLog.created_at >= cutoff_date)
        )
        
        total = query.count()
        logs = query.order_by(ProgressLog.created_at.desc()).limit(limit).all()
        
        return logs, total

    @staticmethod
    def get_progress_analytics(
        db: Session,
        user_id: int,
        days: int = 30,
    ) -> dict:
        """
        Get progress analytics.
        
        Args:
            db: Database session
            user_id: User ID
            days: Analyze last N days
            
        Returns:
            Dict with analytics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        logs = db.query(ProgressLog).filter(
            (ProgressLog.user_id == user_id) &
            (ProgressLog.created_at >= cutoff_date)
        ).order_by(ProgressLog.created_at).all()
        
        if not logs:
            return {
                "total_logs": 0,
                "weight_change": None,
                "avg_exercises": 0,
                "avg_meals": 0,
            }
        
        # Calculate metrics
        weights = [log.weight for log in logs if log.weight]
        weight_change = None
        
        if len(weights) >= 2:
            weight_change = weights[-1] - weights[0]
        
        avg_exercises = sum(log.exercises_completed for log in logs) / len(logs)
        avg_meals = sum(log.meals_logged for log in logs) / len(logs)
        
        return {
            "total_logs": len(logs),
            "weight_change": weight_change,
            "avg_exercises_per_log": round(avg_exercises, 2),
            "avg_meals_per_log": round(avg_meals, 2),
            "latest_weight": weights[-1] if weights else None,
            "weight_history": weights,
        }

    @staticmethod
    def delete_progress_log(
        db: Session,
        user_id: int,
        log_id: int,
    ) -> bool:
        """
        Delete a progress log.
        
        Args:
            db: Database session
            user_id: User ID
            log_id: Log ID
            
        Returns:
            True if deleted, False if not found
        """
        log = db.query(ProgressLog).filter(
            (ProgressLog.id == log_id) & (ProgressLog.user_id == user_id)
        ).first()
        
        if not log:
            return False
        
        db.delete(log)
        db.commit()
        return True
"""Chat service."""

from sqlalchemy.orm import Session
from app.models import ChatMessage
from app.schemas import ChatMessageRequest
from app.services.bedrock import BedrockService
from typing import Optional, List


class ChatService:
    """Service for chat management."""

    def __init__(self):
        """Initialize services."""
        self.bedrock = BedrockService()

    def send_message(
        self,
        db: Session,
        user_id: int,
        user_profile: dict,
        request: ChatMessageRequest,
    ) -> Optional[ChatMessage]:
        """
        Send a message and get AI response.
        
        Args:
            db: Database session
            user_id: User ID
            user_profile: User profile data
            request: Chat message request
            
        Returns:
            ChatMessage or None if failed
        """
        # Get conversation history
        history = self.get_chat_history(db, user_id, limit=10)
        
        # Call Bedrock to get response
        result = self.bedrock.chat_with_coach(
            user_message=request.message,
            user_profile=user_profile,
            conversation_history=[
                {
                    "user_message": msg.user_message,
                    "ai_response": msg.ai_response,
                }
                for msg in history
            ],
        )
        
        # Create database entry
        message = ChatMessage(
            user_id=user_id,
            user_message=request.message,
            ai_response=result["ai_response"],
            rag_context_used=result["rag_context"],
            bedrock_model=result.get("model", "claude-3-sonnet"),
            tokens_used=result["tokens_used"],
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return message

    def get_chat_history(
        self,
        db: Session,
        user_id: int,
        limit: int = 50,
    ) -> List[ChatMessage]:
        """
        Get user's chat history.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Limit results
            
        Returns:
            List of ChatMessages
        """
        return db.query(ChatMessage).filter(
            ChatMessage.user_id == user_id
        ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

    def delete_chat_history(
        self,
        db: Session,
        user_id: int,
    ) -> int:
        """
        Delete all chat history for user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Number of messages deleted
        """
        messages = db.query(ChatMessage).filter(ChatMessage.user_id == user_id)
        count = messages.count()
        messages.delete()
        db.commit()
        return count
