"""
End-to-End API Endpoints
Demonstrates full integration of Frontend → Backend → RAG → Bedrock → Database
"""

import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.services.auth import AuthService
from app.services.bedrock_enhanced import EnhancedBedrockService
from app.services.rag_retrieval import FitnessDocumentRetriever
from app.crud.queries import (
    WorkoutQueries, DietQueries, ChatQueries, ProfileQueries,
    ComplexQueries
)


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )

    user = AuthService.get_current_user(db, token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    return user


logger = logging.getLogger(__name__)

integration_router = APIRouter(
    prefix="/api/v1/ai",
    tags=["AI Integration"]
)


# ============================================================================
# Request/Response Models
# ============================================================================

class GenerateWorkoutRequest:
    """Workout generation request"""
    def __init__(
        self,
        goal: str,
        duration_weeks: int = 12,
        frequency: int = 4,
        intensity: str = "moderate",
        equipment: list = None,
        session_duration: int = 60
    ):
        self.goal = goal
        self.duration_weeks = duration_weeks
        self.frequency = frequency
        self.intensity = intensity
        self.equipment = equipment or []
        self.session_duration = session_duration


class GenerateNutritionRequest:
    """Nutrition plan generation request"""
    def __init__(
        self,
        goal: str,
        diet_type: str = "balanced",
        duration_days: int = 30,
        meals_per_day: int = 3,
        daily_calories: int = 2000
    ):
        self.goal = goal
        self.diet_type = diet_type
        self.duration_days = duration_days
        self.meals_per_day = meals_per_day
        self.daily_calories = daily_calories


class CoachChatRequest:
    """Coaching chat request"""
    def __init__(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        message_type: str = "general"
    ):
        self.message = message
        self.conversation_id = conversation_id
        self.message_type = message_type


# ============================================================================
# Helper Functions
# ============================================================================

def log_request(endpoint: str, user_id: int, request_data: dict):
    """Log incoming request"""
    logger.info(
        f"[ENDPOINT: {endpoint}] User {user_id} | "
        f"Request: {str(request_data)[:100]}..."
    )


def log_response(endpoint: str, user_id: int, success: bool, duration: float):
    """Log response"""
    status = "SUCCESS" if success else "FAILED"
    logger.info(
        f"[ENDPOINT: {endpoint}] User {user_id} | "
        f"Status: {status} | Duration: {duration:.2f}s"
    )


# ============================================================================
# Workout Generation Endpoint
# ============================================================================

@integration_router.post("/workout/generate")
async def generate_workout_endpoint(
    goal: str,
    duration_weeks: int = 12,
    frequency: int = 4,
    intensity: str = "moderate",
    equipment: list = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized workout plan using RAG + Bedrock
    
    Flow:
    1. Validate user and profile
    2. Retrieve workout documents from RAG
    3. Call Bedrock AI model
    4. Store plan in database
    5. Return response with citations
    """
    import time
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    request_data = {
        "goal": goal,
        "duration_weeks": duration_weeks,
        "frequency": frequency,
        "intensity": intensity,
        "equipment": equipment
    }
    
    log_request("POST /ai/workout/generate", current_user.id, request_data)
    
    try:
        # Step 1: Get user profile
        logger.debug(f"[{request_id}] Fetching user profile")
        profile = ProfileQueries.get_profile(db, user_id=current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Create profile first."
            )
        
        # Step 2: Retrieve context from S3/RAG
        logger.info(f"[{request_id}] Retrieving workout context from RAG")
        rag_service = FitnessDocumentRetriever()
        workout_docs, citations = rag_service.retrieve_workout_documents(
            goal=goal,
            equipment=equipment or [],
            intensity=intensity
        )
        logger.debug(f"[{request_id}] Retrieved {len(workout_docs)} documents")
        
        # Step 3: Call Bedrock AI
        logger.info(f"[{request_id}] Calling Bedrock AI for workout generation")
        bedrock_service = EnhancedBedrockService()
        ai_result = bedrock_service.generate_workout_with_rag(
            user_profile={
                "age": profile.age,
                "weight": profile.weight,
                "fitness_level": profile.fitness_level.value,
                "goals": [profile.primary_goal.value],
                "medical_conditions": profile.medical_conditions
            },
            goal=goal,
            duration_weeks=duration_weeks,
            frequency=frequency,
            equipment=equipment or [],
            intensity=intensity,
            specific_requirements=[]
        )
        
        if not ai_result.get("success"):
            raise Exception(f"AI generation failed: {ai_result.get('error')}")
        
        logger.debug(f"[{request_id}] AI response received: {ai_result.get('tokens_estimated')} tokens")
        
        # Step 4: Store in database
        logger.info(f"[{request_id}] Storing workout plan in database")
        plan = WorkoutQueries.create_workout_plan(
            db,
            user_id=current_user.id,
            name=f"AI-Generated Workout - {goal.title()}",
            goal=goal,
            duration_weeks=duration_weeks,
            frequency_per_week=frequency,
            intensity=intensity,
            session_duration_minutes=60,
            equipment_needed=equipment or [],
            ai_generated=True,
            rag_documents_used=[doc.get("source") for doc in workout_docs],
            plan_content=ai_result.get("workout")
        )
        logger.debug(f"[{request_id}] Plan stored with ID: {plan.id}")
        
        # Step 5: Prepare response
        duration = time.time() - start_time
        log_response("POST /ai/workout/generate", current_user.id, True, duration)
        
        return {
            "success": True,
            "request_id": request_id,
            "data": {
                "plan_id": plan.id,
                "plan_name": plan.name,
                "goal": goal,
                "duration_weeks": duration_weeks,
                "frequency": frequency,
                "workout": ai_result.get("workout")
            },
            "rag_context": {
                "documents_retrieved": len(workout_docs),
                "citations": ai_result.get("citations", [])
            },
            "metrics": {
                "processing_time_seconds": duration,
                "tokens_used": ai_result.get("tokens_estimated", 0),
                "cost_estimate": f"${(ai_result.get('tokens_estimated', 0) * 0.00001):.4f}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        log_response("POST /ai/workout/generate", current_user.id, False, duration)
        logger.error(f"[{request_id}] Error: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workout generation failed: {str(e)}"
        )


# ============================================================================
# Nutrition Plan Generation Endpoint
# ============================================================================

@integration_router.post("/nutrition/generate")
async def generate_nutrition_endpoint(
    goal: str,
    diet_type: str = "balanced",
    duration_days: int = 30,
    meals_per_day: int = 3,
    daily_calories: int = 2000,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized nutrition plan using RAG + Bedrock
    
    Flow:
    1. Get user profile with dietary info
    2. Retrieve nutrition documents from RAG
    3. Call Bedrock for meal planning
    4. Store in database
    5. Return with citations
    """
    import time
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    request_data = {
        "goal": goal,
        "diet_type": diet_type,
        "daily_calories": daily_calories
    }
    
    log_request("POST /ai/nutrition/generate", current_user.id, request_data)
    
    try:
        # Step 1: Get profile
        logger.debug(f"[{request_id}] Fetching profile")
        profile = ProfileQueries.get_profile(db, user_id=current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Step 2: Retrieve nutrition context
        logger.info(f"[{request_id}] Retrieving nutrition context from RAG")
        rag_service = FitnessDocumentRetriever()
        nutrition_docs, citations = rag_service.retrieve_nutrition_documents(
            diet_type=diet_type,
            goal=goal,
            dietary_restrictions=profile.dietary_restrictions
        )
        logger.debug(f"[{request_id}] Retrieved {len(nutrition_docs)} documents")
        
        # Step 3: Call Bedrock
        logger.info(f"[{request_id}] Calling Bedrock for meal planning")
        bedrock_service = EnhancedBedrockService()
        ai_result = bedrock_service.generate_nutrition_with_rag(
            user_profile={
                "age": profile.age,
                "weight": profile.weight,
                "dietary_restrictions": profile.dietary_restrictions,
                "medical_conditions": profile.medical_conditions
            },
            goal=goal,
            duration_days=duration_days,
            meals_per_day=meals_per_day,
            daily_calories=daily_calories,
            diet_type=diet_type,
            preferred_foods=profile.preferred_foods,
            avoided_foods=profile.avoided_foods
        )
        
        if not ai_result.get("success"):
            raise Exception(f"AI generation failed: {ai_result.get('error')}")
        
        logger.debug(f"[{request_id}] AI response received")
        
        # Step 4: Store in database
        logger.info(f"[{request_id}] Storing meal plan in database")
        plan = DietQueries.create_diet_plan(
            db,
            user_id=current_user.id,
            name=f"AI-Generated Meal Plan - {diet_type.title()}",
            goal=goal,
            diet_type=diet_type,
            duration_days=duration_days,
            meals_per_day=meals_per_day,
            daily_calories=daily_calories,
            protein_grams=ai_result.get("meal_plan", {}).get("protein_grams", 0),
            carbs_grams=ai_result.get("meal_plan", {}).get("carbs_grams", 0),
            fats_grams=ai_result.get("meal_plan", {}).get("fats_grams", 0),
            dietary_restrictions=profile.dietary_restrictions,
            ai_generated=True,
            rag_documents_used=[doc.get("source") for doc in nutrition_docs],
            plan_content=ai_result.get("meal_plan")
        )
        logger.debug(f"[{request_id}] Plan stored with ID: {plan.id}")
        
        # Step 5: Response
        duration = time.time() - start_time
        log_response("POST /ai/nutrition/generate", current_user.id, True, duration)
        
        return {
            "success": True,
            "request_id": request_id,
            "data": {
                "plan_id": plan.id,
                "plan_name": plan.name,
                "goal": goal,
                "diet_type": diet_type,
                "daily_calories": daily_calories,
                "meal_plan": ai_result.get("meal_plan")
            },
            "rag_context": {
                "documents_retrieved": len(nutrition_docs),
                "citations": ai_result.get("citations", [])
            },
            "metrics": {
                "processing_time_seconds": duration,
                "tokens_used": ai_result.get("tokens_estimated", 0),
                "cost_estimate": f"${(ai_result.get('tokens_estimated', 0) * 0.00001):.4f}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        log_response("POST /ai/nutrition/generate", current_user.id, False, duration)
        logger.error(f"[{request_id}] Error: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Nutrition plan generation failed: {str(e)}"
        )


# ============================================================================
# Coaching Chat Endpoint
# ============================================================================

@integration_router.post("/chat")
async def coaching_chat_endpoint(
    message: str,
    conversation_id: str = None,
    message_type: str = "general",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI coach using RAG + Bedrock
    
    Flow:
    1. Get conversation history
    2. Retrieve health/fitness documents from RAG
    3. Call Bedrock for response
    4. Store message in database
    5. Return response with citations
    """
    import time
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    if not message or len(message.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    request_data = {
        "message": message[:50] + "..." if len(message) > 50 else message,
        "conversation_id": conversation_id,
        "message_type": message_type
    }
    
    log_request("POST /ai/chat", current_user.id, request_data)
    
    try:
        # Step 1: Get profile
        logger.debug(f"[{request_id}] Fetching profile")
        profile = ProfileQueries.get_profile(db, user_id=current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Step 2: Get conversation history
        logger.debug(f"[{request_id}] Retrieving conversation history")
        conversation_history = []
        if conversation_id:
            messages = ChatQueries.get_conversation_history(
                db,
                user_id=current_user.id,
                conversation_id=conversation_id,
                limit=5
            )
            conversation_history = [
                {"user": msg.user_message, "assistant": msg.ai_response}
                for msg in reversed(messages)
            ]
        
        # Step 3: Retrieve health context
        logger.info(f"[{request_id}] Retrieving health context from RAG")
        rag_service = FitnessDocumentRetriever()
        health_docs, citations = rag_service.retrieve_health_documents(
            query=message,
            medical_conditions=profile.medical_conditions
        )
        logger.debug(f"[{request_id}] Retrieved {len(health_docs)} documents")
        
        # Step 4: Call Bedrock
        logger.info(f"[{request_id}] Calling Bedrock for chat response")
        bedrock_service = EnhancedBedrockService()
        ai_result = bedrock_service.chat_with_coach_rag(
            user_message=message,
            user_profile={
                "age": profile.age,
                "weight": profile.weight,
                "fitness_level": profile.fitness_level.value,
                "medical_conditions": profile.medical_conditions
            },
            conversation_history=conversation_history
        )
        
        if not ai_result.get("success"):
            raise Exception(f"Chat failed: {ai_result.get('error')}")
        
        logger.debug(f"[{request_id}] AI response received")
        
        # Step 5: Store in database
        logger.info(f"[{request_id}] Storing message in database")
        conv_id = conversation_id or f"conv_{current_user.id}_{int(time.time())}"
        
        chat_msg = ChatQueries.create_chat_message(
            db,
            user_id=current_user.id,
            conversation_id=conv_id,
            user_message=message,
            ai_response=ai_result.get("ai_response"),
            message_type=message_type,
            rag_documents_used=[doc.get("source") for doc in health_docs],
            citations=ai_result.get("citations", []),
            tokens_used=ai_result.get("tokens_estimated", 0),
            estimated_cost=(ai_result.get("tokens_estimated", 0) * 0.00001)
        )
        logger.debug(f"[{request_id}] Message stored with ID: {chat_msg.id}")
        
        # Step 6: Response
        duration = time.time() - start_time
        log_response("POST /ai/chat", current_user.id, True, duration)
        
        return {
            "success": True,
            "request_id": request_id,
            "data": {
                "message_id": chat_msg.id,
                "conversation_id": conv_id,
                "response": ai_result.get("ai_response"),
                "message_type": message_type
            },
            "rag_context": {
                "documents_retrieved": len(health_docs),
                "citations": ai_result.get("citations", [])
            },
            "metrics": {
                "processing_time_seconds": duration,
                "tokens_used": ai_result.get("tokens_estimated", 0),
                "cost_estimate": f"${(ai_result.get('tokens_estimated', 0) * 0.00001):.4f}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        duration = time.time() - start_time
        log_response("POST /ai/chat", current_user.id, False, duration)
        logger.error(f"[{request_id}] Error: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )


# ============================================================================
# Dashboard Endpoint
# ============================================================================

@integration_router.get("/dashboard")
async def get_dashboard_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard with personalized insights
    Combines multiple queries for comprehensive view
    """
    import time
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    log_request("GET /ai/dashboard", current_user.id, {})
    
    try:
        logger.debug(f"[{request_id}] Fetching dashboard data")
        
        # Get complete summary
        dashboard = ComplexQueries.get_user_dashboard_summary(db, current_user.id)
        insights = ComplexQueries.get_user_insights(db, current_user.id)
        
        duration = time.time() - start_time
        log_response("GET /ai/dashboard", current_user.id, True, duration)
        
        return {
            "success": True,
            "request_id": request_id,
            "data": {
                "dashboard": dashboard,
                "insights": insights
            },
            "metrics": {
                "processing_time_seconds": duration
            }
        }
        
    except Exception as e:
        duration = time.time() - start_time
        log_response("GET /ai/dashboard", current_user.id, False, duration)
        logger.error(f"[{request_id}] Error: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard fetch failed: {str(e)}"
        )


# ============================================================================
# Export router for main.py
# ============================================================================

router = integration_router
