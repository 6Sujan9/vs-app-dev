"""
End-to-End Integration Service
Orchestrates the complete flow: Frontend → Backend → RAG → Bedrock → Database → Frontend
"""

import logging
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
import traceback

import boto3
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.rag_retrieval import RAGRetrievalService
from app.services.bedrock import BedrockService
from app.models import WorkoutPlan, NutritionPlan, ChatMessage, User
from app.schemas import WorkoutGenerateRequest, NutritionGenerateRequest

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
)
logger = logging.getLogger(__name__)


class RequestStatus(str, Enum):
    """Status of the integration request."""
    INITIATED = "initiated"
    VALIDATING = "validating"
    RETRIEVING_CONTEXT = "retrieving_context"
    CALLING_AI = "calling_ai"
    STORING_RESULT = "storing_result"
    COMPLETED = "completed"
    FAILED = "failed"


class IntegrationRequest:
    """Tracks a single request through the entire workflow."""
    
    def __init__(self, user_id: int, request_type: str, data: Dict[str, Any]):
        self.request_id = str(uuid.uuid4())
        self.user_id = user_id
        self.request_type = request_type  # 'workout', 'nutrition', 'chat'
        self.data = data
        self.status = RequestStatus.INITIATED
        self.start_time = datetime.utcnow()
        self.timeline = {}
        self.errors = []
        self.rag_documents = []
        self.ai_response = None
        self.stored_result = None
        self.tokens_used = 0
    
    def log_status(self, status: RequestStatus, metadata: Dict[str, Any] = None):
        """Log status change with timestamp."""
        self.status = status
        self.timeline[status] = {
            'timestamp': datetime.utcnow().isoformat(),
            'duration_ms': (datetime.utcnow() - self.start_time).total_seconds() * 1000,
            'metadata': metadata or {}
        }
        logger.info(
            f"Request status: {status}",
            extra={'request_id': self.request_id}
        )
    
    def add_error(self, error: Exception, context: str = ""):
        """Log an error during processing."""
        error_info = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': type(error).__name__,
            'message': str(error),
            'context': context,
            'traceback': traceback.format_exc()
        }
        self.errors.append(error_info)
        logger.error(
            f"Error in {context}: {str(error)}",
            extra={'request_id': self.request_id}
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert request to dictionary for database storage."""
        return {
            'request_id': self.request_id,
            'user_id': self.user_id,
            'request_type': self.request_type,
            'status': self.status.value,
            'input_data': self.data,
            'rag_documents': [
                {
                    'source': doc.get('source'),
                    'score': doc.get('score'),
                    'content_preview': doc.get('content', '')[:200]
                }
                for doc in self.rag_documents
            ],
            'ai_response': self.ai_response,
            'stored_result': self.stored_result,
            'tokens_used': self.tokens_used,
            'errors': self.errors,
            'timeline': self.timeline,
            'total_duration_ms': (datetime.utcnow() - self.start_time).total_seconds() * 1000,
            'timestamp': datetime.utcnow().isoformat()
        }


class EndToEndIntegrationService:
    """
    Orchestrates complete request-response flow:
    1. Validate request
    2. Retrieve context from S3/Knowledge Base (RAG)
    3. Call Bedrock for AI response
    4. Store result in database
    5. Return to frontend
    """
    
    def __init__(self):
        self.rag_service = RAGRetrievalService()
        self.bedrock_service = BedrockService()
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
    
    def process_workout_generation(
        self,
        db: Session,
        user_id: int,
        user_profile: Dict[str, Any],
        request: WorkoutGenerateRequest
    ) -> Dict[str, Any]:
        """
        End-to-end workflow for workout generation.
        
        Flow:
        1. Create tracking request
        2. Validate inputs
        3. Retrieve fitness documents from S3/KB
        4. Call Bedrock to generate workout
        5. Store in database
        6. Log metrics
        7. Return to frontend
        """
        integration_req = IntegrationRequest(
            user_id=user_id,
            request_type='workout',
            data=request.dict()
        )
        
        try:
            # Step 1: Validate request
            integration_req.log_status(RequestStatus.VALIDATING)
            self._validate_workout_request(request)
            
            # Step 2: Retrieve context from S3 via RAG
            integration_req.log_status(RequestStatus.RETRIEVING_CONTEXT)
            rag_context = self._retrieve_fitness_context(
                goal=request.goal,
                intensity=request.intensity,
                fitness_level=user_profile.get('fitness_level')
            )
            integration_req.rag_documents = rag_context
            
            # Step 3: Call Bedrock AI
            integration_req.log_status(RequestStatus.CALLING_AI)
            ai_response = self.bedrock_service.generate_workout(
                user_profile=user_profile,
                goal=request.goal,
                duration_weeks=request.duration_weeks,
                frequency=request.frequency,
                equipment=request.equipment,
                intensity=request.intensity,
                specific_requirements=request.specific_requirements
            )
            integration_req.ai_response = ai_response
            integration_req.tokens_used = ai_response.get('tokens_used', 0)
            
            # Step 4: Store in database
            integration_req.log_status(RequestStatus.STORING_RESULT)
            stored_workout = self._store_workout_in_db(
                db=db,
                user_id=user_id,
                request=request,
                ai_response=ai_response,
                rag_documents=rag_context
            )
            integration_req.stored_result = {
                'id': stored_workout.id,
                'name': stored_workout.name,
                'status': 'stored'
            }
            
            # Step 5: Complete
            integration_req.log_status(RequestStatus.COMPLETED)
            
            # Log metrics
            self._log_integration_metrics(integration_req)
            
            return {
                'success': True,
                'request_id': integration_req.request_id,
                'workout': self._format_workout_response(stored_workout),
                'metadata': {
                    'rag_documents': len(rag_context),
                    'tokens_used': integration_req.tokens_used,
                    'processing_time_ms': (datetime.utcnow() - integration_req.start_time).total_seconds() * 1000,
                    'status_timeline': integration_req.timeline
                }
            }
        
        except Exception as e:
            integration_req.add_error(e, "workout_generation")
            integration_req.log_status(RequestStatus.FAILED)
            logger.error(
                f"Workout generation failed: {str(e)}",
                extra={'request_id': integration_req.request_id}
            )
            
            return {
                'success': False,
                'request_id': integration_req.request_id,
                'error': str(e),
                'error_type': type(e).__name__,
                'metadata': {
                    'status': integration_req.status.value,
                    'processing_time_ms': (datetime.utcnow() - integration_req.start_time).total_seconds() * 1000,
                    'errors': integration_req.errors
                }
            }
    
    def process_nutrition_generation(
        self,
        db: Session,
        user_id: int,
        user_profile: Dict[str, Any],
        request: NutritionGenerateRequest
    ) -> Dict[str, Any]:
        """
        End-to-end workflow for meal plan generation.
        
        Similar flow to workout generation with nutrition-specific context.
        """
        integration_req = IntegrationRequest(
            user_id=user_id,
            request_type='nutrition',
            data=request.dict()
        )
        
        try:
            # Step 1: Validate
            integration_req.log_status(RequestStatus.VALIDATING)
            self._validate_nutrition_request(request)
            
            # Step 2: Retrieve nutrition context from S3/KB
            integration_req.log_status(RequestStatus.RETRIEVING_CONTEXT)
            rag_context = self._retrieve_nutrition_context(
                goal=request.goal,
                diet_type=request.diet_type,
                calories=request.daily_calories
            )
            integration_req.rag_documents = rag_context
            
            # Step 3: Call Bedrock
            integration_req.log_status(RequestStatus.CALLING_AI)
            ai_response = self.bedrock_service.generate_meal_plan(
                user_profile=user_profile,
                goal=request.goal,
                duration_days=request.duration_days,
                meals_per_day=request.meals_per_day,
                daily_calories=request.daily_calories,
                diet_type=request.diet_type,
                preferred_foods=request.preferred_foods,
                avoided_foods=request.avoided_foods
            )
            integration_req.ai_response = ai_response
            integration_req.tokens_used = ai_response.get('tokens_used', 0)
            
            # Step 4: Store in database
            integration_req.log_status(RequestStatus.STORING_RESULT)
            stored_plan = self._store_nutrition_in_db(
                db=db,
                user_id=user_id,
                request=request,
                ai_response=ai_response,
                rag_documents=rag_context
            )
            integration_req.stored_result = {
                'id': stored_plan.id,
                'name': stored_plan.name,
                'status': 'stored'
            }
            
            # Step 5: Complete
            integration_req.log_status(RequestStatus.COMPLETED)
            
            # Log metrics
            self._log_integration_metrics(integration_req)
            
            return {
                'success': True,
                'request_id': integration_req.request_id,
                'nutrition_plan': self._format_nutrition_response(stored_plan),
                'metadata': {
                    'rag_documents': len(rag_context),
                    'tokens_used': integration_req.tokens_used,
                    'processing_time_ms': (datetime.utcnow() - integration_req.start_time).total_seconds() * 1000,
                    'status_timeline': integration_req.timeline
                }
            }
        
        except Exception as e:
            integration_req.add_error(e, "nutrition_generation")
            integration_req.log_status(RequestStatus.FAILED)
            logger.error(
                f"Nutrition generation failed: {str(e)}",
                extra={'request_id': integration_req.request_id}
            )
            
            return {
                'success': False,
                'request_id': integration_req.request_id,
                'error': str(e),
                'error_type': type(e).__name__,
                'metadata': {
                    'status': integration_req.status.value,
                    'processing_time_ms': (datetime.utcnow() - integration_req.start_time).total_seconds() * 1000,
                    'errors': integration_req.errors
                }
            }
    
    # ==================== STEP 1: VALIDATION ====================
    
    def _validate_workout_request(self, request: WorkoutGenerateRequest):
        """Validate workout request parameters."""
        if not request.goal:
            raise ValueError("Workout goal is required")
        
        if request.duration_weeks < 1 or request.duration_weeks > 52:
            raise ValueError("Duration must be between 1-52 weeks")
        
        if request.frequency < 1 or request.frequency > 7:
            raise ValueError("Frequency must be between 1-7 sessions per week")
        
        if request.intensity not in ['low', 'medium', 'high']:
            raise ValueError("Intensity must be low, medium, or high")
        
        logger.info(f"Validated workout request: {request.goal} for {request.duration_weeks} weeks")
    
    def _validate_nutrition_request(self, request: NutritionGenerateRequest):
        """Validate nutrition request parameters."""
        if not request.goal:
            raise ValueError("Nutrition goal is required")
        
        if request.duration_days < 1 or request.duration_days > 365:
            raise ValueError("Duration must be between 1-365 days")
        
        if request.meals_per_day < 1 or request.meals_per_day > 6:
            raise ValueError("Meals per day must be between 1-6")
        
        if request.daily_calories < 1000 or request.daily_calories > 5000:
            raise ValueError("Daily calories must be between 1000-5000")
        
        logger.info(f"Validated nutrition request: {request.goal} with {request.daily_calories} cal/day")
    
    # ==================== STEP 2: RAG RETRIEVAL ====================
    
    def _retrieve_fitness_context(
        self,
        goal: str,
        intensity: str,
        fitness_level: str
    ) -> List[Dict[str, Any]]:
        """Retrieve fitness-related documents from S3/Knowledge Base."""
        query = f"fitness workout {goal} {intensity} intensity {fitness_level} level"
        
        try:
            # Try Knowledge Base first
            if settings.BEDROCK_KNOWLEDGE_BASE_ID:
                documents = self.rag_service.retrieve_documents_from_knowledge_base(
                    query=query,
                    knowledge_base_id=settings.BEDROCK_KNOWLEDGE_BASE_ID,
                    max_results=3
                )
                if documents:
                    logger.info(f"Retrieved {len(documents)} documents from Knowledge Base")
                    return documents
            
            # Fall back to S3
            if settings.DOCUMENT_BUCKET_NAME:
                documents = self.rag_service.retrieve_documents_from_s3(
                    bucket_name=settings.DOCUMENT_BUCKET_NAME,
                    prefix="fitness-documents/",
                    query_keywords=['workout', goal, intensity]
                )
                logger.info(f"Retrieved {len(documents)} documents from S3")
                return documents
            
            logger.warning("No RAG documents retrieved - using default context")
            return []
        
        except Exception as e:
            logger.warning(f"Error retrieving fitness context: {str(e)}")
            return []
    
    def _retrieve_nutrition_context(
        self,
        goal: str,
        diet_type: str,
        calories: int
    ) -> List[Dict[str, Any]]:
        """Retrieve nutrition-related documents from S3/Knowledge Base."""
        query = f"nutrition diet meal plan {goal} {diet_type} {calories} calories"
        
        try:
            # Try Knowledge Base first
            if settings.BEDROCK_KNOWLEDGE_BASE_ID:
                documents = self.rag_service.retrieve_documents_from_knowledge_base(
                    query=query,
                    knowledge_base_id=settings.BEDROCK_KNOWLEDGE_BASE_ID,
                    max_results=3
                )
                if documents:
                    logger.info(f"Retrieved {len(documents)} nutrition documents from Knowledge Base")
                    return documents
            
            # Fall back to S3
            if settings.DOCUMENT_BUCKET_NAME:
                documents = self.rag_service.retrieve_documents_from_s3(
                    bucket_name=settings.DOCUMENT_BUCKET_NAME,
                    prefix="nutrition-documents/",
                    query_keywords=['nutrition', goal, diet_type]
                )
                logger.info(f"Retrieved {len(documents)} nutrition documents from S3")
                return documents
            
            logger.warning("No nutrition RAG documents retrieved")
            return []
        
        except Exception as e:
            logger.warning(f"Error retrieving nutrition context: {str(e)}")
            return []
    
    # ==================== STEP 4: DATABASE STORAGE ====================
    
    def _store_workout_in_db(
        self,
        db: Session,
        user_id: int,
        request: WorkoutGenerateRequest,
        ai_response: Dict[str, Any],
        rag_documents: List[Dict[str, Any]]
    ) -> WorkoutPlan:
        """Store generated workout in database."""
        try:
            workout_data = ai_response.get('workout', {})
            
            workout = WorkoutPlan(
                user_id=user_id,
                name=workout_data.get('name', f"{request.goal.replace('_', ' ').title()} Plan"),
                description=workout_data.get('description', ''),
                goal=request.goal,
                duration_weeks=request.duration_weeks,
                frequency=request.frequency,
                intensity=request.intensity,
                equipment=request.equipment,
                exercises=json.dumps(workout_data.get('exercises', [])),
                ai_model='claude-3-sonnet',
                tokens_used=ai_response.get('tokens_used', 0),
                rag_sources=json.dumps([
                    {
                        'source': doc.get('source'),
                        'score': doc.get('score')
                    }
                    for doc in rag_documents
                ]),
                raw_response=json.dumps(ai_response),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(workout)
            db.commit()
            db.refresh(workout)
            
            logger.info(
                f"Stored workout in database",
                extra={'user_id': user_id, 'workout_id': workout.id}
            )
            
            return workout
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error storing workout: {str(e)}")
            raise
    
    def _store_nutrition_in_db(
        self,
        db: Session,
        user_id: int,
        request: NutritionGenerateRequest,
        ai_response: Dict[str, Any],
        rag_documents: List[Dict[str, Any]]
    ) -> NutritionPlan:
        """Store generated nutrition plan in database."""
        try:
            nutrition_data = ai_response.get('meal_plan', {})
            
            plan = NutritionPlan(
                user_id=user_id,
                name=nutrition_data.get('name', f"{request.diet_type.title()} Plan"),
                description=nutrition_data.get('description', ''),
                goal=request.goal,
                diet_type=request.diet_type,
                duration_days=request.duration_days,
                meals_per_day=request.meals_per_day,
                daily_calories=request.daily_calories,
                meals=json.dumps(nutrition_data.get('meals', [])),
                ai_model='claude-3-sonnet',
                tokens_used=ai_response.get('tokens_used', 0),
                rag_sources=json.dumps([
                    {
                        'source': doc.get('source'),
                        'score': doc.get('score')
                    }
                    for doc in rag_documents
                ]),
                raw_response=json.dumps(ai_response),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(plan)
            db.commit()
            db.refresh(plan)
            
            logger.info(
                f"Stored nutrition plan in database",
                extra={'user_id': user_id, 'plan_id': plan.id}
            )
            
            return plan
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error storing nutrition plan: {str(e)}")
            raise
    
    # ==================== RESPONSE FORMATTING ====================
    
    def _format_workout_response(self, workout: WorkoutPlan) -> Dict[str, Any]:
        """Format workout for API response."""
        try:
            exercises = json.loads(workout.exercises) if workout.exercises else []
            rag_sources = json.loads(workout.rag_sources) if workout.rag_sources else []
        except:
            exercises = []
            rag_sources = []
        
        return {
            'id': workout.id,
            'name': workout.name,
            'description': workout.description,
            'goal': workout.goal,
            'duration_weeks': workout.duration_weeks,
            'frequency': workout.frequency,
            'intensity': workout.intensity,
            'equipment': workout.equipment,
            'exercises': exercises,
            'ai_model': workout.ai_model,
            'tokens_used': workout.tokens_used,
            'rag_sources': rag_sources,
            'created_at': workout.created_at.isoformat() if workout.created_at else None,
            'updated_at': workout.updated_at.isoformat() if workout.updated_at else None
        }
    
    def _format_nutrition_response(self, plan: NutritionPlan) -> Dict[str, Any]:
        """Format nutrition plan for API response."""
        try:
            meals = json.loads(plan.meals) if plan.meals else []
            rag_sources = json.loads(plan.rag_sources) if plan.rag_sources else []
        except:
            meals = []
            rag_sources = []
        
        return {
            'id': plan.id,
            'name': plan.name,
            'description': plan.description,
            'goal': plan.goal,
            'diet_type': plan.diet_type,
            'duration_days': plan.duration_days,
            'meals_per_day': plan.meals_per_day,
            'daily_calories': plan.daily_calories,
            'meals': meals,
            'ai_model': plan.ai_model,
            'tokens_used': plan.tokens_used,
            'rag_sources': rag_sources,
            'created_at': plan.created_at.isoformat() if plan.created_at else None,
            'updated_at': plan.updated_at.isoformat() if plan.updated_at else None
        }
    
    # ==================== METRICS & MONITORING ====================
    
    def _log_integration_metrics(self, integration_req: IntegrationRequest):
        """Log detailed metrics about the integration request."""
        metrics = {
            'request_id': integration_req.request_id,
            'request_type': integration_req.request_type,
            'user_id': integration_req.user_id,
            'status': integration_req.status.value,
            'total_duration_ms': (datetime.utcnow() - integration_req.start_time).total_seconds() * 1000,
            'rag_documents_retrieved': len(integration_req.rag_documents),
            'tokens_used': integration_req.tokens_used,
            'errors_count': len(integration_req.errors),
            'timeline': integration_req.timeline
        }
        
        logger.info(
            f"Integration metrics: {json.dumps(metrics, indent=2)}",
            extra={'request_id': integration_req.request_id}
        )
