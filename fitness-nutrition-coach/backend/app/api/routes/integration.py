"""
Complete end-to-end integration example API route
Demonstrates: Frontend → Backend → RAG → Bedrock → Database → Frontend
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.schemas import WorkoutGenerateRequest, NutritionGenerateRequest
from app.services.auth import AuthService
from app.services.integration import EndToEndIntegrationService
from app.models import User

router = APIRouter(prefix="/api/v1/integration", tags=["integration"])
integration_service = EndToEndIntegrationService()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Extract and validate user from authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user = AuthService.get_current_user(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user


@router.post("/workout/generate")
async def generate_workout_integrated(
    request: WorkoutGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete end-to-end workout generation flow:
    
    1. Validates request parameters
    2. Retrieves fitness context from S3/Knowledge Base
    3. Calls Bedrock Claude for AI-powered generation
    4. Stores result in PostgreSQL database
    5. Returns response with metadata
    
    Request example:
    ```json
    {
        "goal": "muscle_gain",
        "duration_weeks": 12,
        "frequency": 4,
        "equipment": ["dumbbell", "barbell"],
        "intensity": "high",
        "specific_requirements": "No leg exercises"
    }
    ```
    
    Response includes:
    - Generated workout plan
    - Request ID for tracking
    - RAG documents used (citations)
    - Tokens used for billing
    - Processing timeline
    - Status at each step
    """
    # Get user profile for context
    user_profile = {
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "gender": user.gender,
        "fitness_level": user.fitness_level,
        "goals": user.goals or [],
        "medical_conditions": user.medical_conditions or [],
        "dietary_restrictions": user.dietary_restrictions or []
    }
    
    # Process through entire integration pipeline
    result = integration_service.process_workout_generation(
        db=db,
        user_id=user.id,
        user_profile=user_profile,
        request=request
    )
    
    if not result.get('success'):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get('error', 'Workout generation failed')
        )
    
    return result


@router.post("/nutrition/generate")
async def generate_nutrition_integrated(
    request: NutritionGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete end-to-end nutrition plan generation flow:
    
    1. Validates nutrition parameters
    2. Retrieves nutrition context from S3/Knowledge Base
    3. Calls Bedrock Claude for AI-powered meal planning
    4. Stores result in PostgreSQL database
    5. Returns detailed response with all metadata
    
    Request example:
    ```json
    {
        "goal": "muscle_gain",
        "duration_days": 30,
        "meals_per_day": 4,
        "daily_calories": 2800,
        "diet_type": "balanced",
        "preferred_foods": ["chicken", "rice"],
        "avoided_foods": ["peanuts"]
    }
    ```
    
    Response includes:
    - Personalized meal plan
    - Request ID for tracking
    - RAG sources (nutrition guidelines)
    - Token usage
    - Full processing timeline
    """
    # Get user profile
    user_profile = {
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "gender": user.gender,
        "fitness_level": user.fitness_level,
        "goals": user.goals or [],
        "medical_conditions": user.medical_conditions or [],
        "dietary_restrictions": user.dietary_restrictions or []
    }
    
    # Process through integration pipeline
    result = integration_service.process_nutrition_generation(
        db=db,
        user_id=user.id,
        user_profile=user_profile,
        request=request
    )
    
    if not result.get('success'):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get('error', 'Nutrition generation failed')
        )
    
    return result


# ==================== DETAILED WORKFLOW DOCUMENTATION ====================

"""
COMPLETE REQUEST-RESPONSE CYCLE

1️⃣  FRONTEND SENDS REQUEST
   └─ POST /api/v1/integration/workout/generate
      Headers: Authorization: Bearer {token}
      Body: { goal, duration_weeks, frequency, equipment, intensity }

2️⃣  BACKEND RECEIVES & AUTHENTICATES
   └─ get_current_user() validates JWT token
   └─ Extracts user profile from database
   └─ Validates request parameters

3️⃣  RETRIEVE CONTEXT FROM S3/KNOWLEDGE BASE (RAG)
   └─ Query: "fitness workout muscle_gain high intensity intermediate"
   └─ Sources:
      - Amazon Bedrock Knowledge Base (vector search)
      - S3 bucket with fitness documents
   └─ Returns: 3-5 most relevant documents with scores

4️⃣  CALL BEDROCK AI MODEL
   └─ Model: Claude 3 Sonnet
   └─ Prompt includes:
      - User profile (age, weight, fitness level, goals)
      - User constraints (medical conditions, restrictions)
      - RAG context (fitness science, guidelines)
      - Request parameters
   └─ Output: Structured workout plan JSON

5️⃣  STORE IN DATABASE (PostgreSQL)
   └─ Table: workout_plans
   └─ Stores:
      - Generated plan details
      - RAG sources used
      - AI model info
      - Tokens consumed
      - Raw response for audit trail
      - Timestamps

6️⃣  RETURN TO FRONTEND
   └─ Response includes:
      ✅ success: true
      ✅ request_id: UUID for tracking
      ✅ workout: Full generated plan
      ✅ metadata:
         - rag_documents: Count of sources
         - tokens_used: For billing
         - processing_time_ms: Performance metric
         - status_timeline: When each step completed


ERROR HANDLING AT EACH STEP
═══════════════════════════════

If validation fails → HTTP 400 Bad Request
If RAG retrieval fails → Uses default context
If Bedrock fails → HTTP 500, logs error, includes traceback
If database fails → Rollback, HTTP 500, error details
If auth fails → HTTP 401 Unauthorized


LOGGING & MONITORING
═══════════════════════════════

Every step logs:
- Request ID (UUID for correlation)
- User ID
- Step name & status
- Timestamp
- Duration since start
- Any errors with full context
- Token usage
- Document count

Example log:
  2024-01-15 10:30:45.123 - app.services.integration
  INFO - [a1b2c3d4-e5f6-7g8h] - Request status: calling_ai
  duration_ms: 1250, metadata: {'rag_docs': 3}


SCALABILITY DESIGN
═══════════════════════════════

1. Async Processing
   - Use Celery/Redis for long-running requests
   - Return request_id immediately, poll for status

2. Caching
   - Cache RAG results for similar queries
   - Cache Bedrock responses
   - TTL-based invalidation

3. Database Optimization
   - Indexes on user_id, created_at
   - Partitioning by date for large tables
   - Connection pooling (20 connections)

4. Rate Limiting
   - 10 requests/minute per user
   - 100 requests/minute per API key
   - Queue excess requests

5. Monitoring
   - Log every request/response
   - Track token usage per user
   - Alert on high error rates
   - Monitor Bedrock API latency

6. Load Balancing
   - Deploy multiple backend instances
   - Use load balancer (nginx, ALB)
   - Database replication (primary-replica)

7. Circuit Breaker
   - Fail fast if Bedrock down
   - Retry with exponential backoff
   - Fallback responses

8. Resource Limits
   - Max 30s timeout per request
   - Max 2000 tokens per request
   - Max 10MB payload
"""
