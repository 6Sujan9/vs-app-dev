"""Chat routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse
from app.services.auth import AuthService
from app.services.progress import ChatService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])
chat_service = ChatService()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from authorization header."""
    logger.info(f"🔵 [get_current_user] Authorization header value: {authorization}")
    logger.info(f"🔵 [get_current_user] Header type: {type(authorization)}")
    
    if not authorization:
        logger.error("❌ [get_current_user] Authorization header is missing or empty!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        logger.info(f"🔵 [get_current_user] Parsing authorization header: {authorization[:50]}...")
        scheme, token = authorization.split()
        logger.info(f"🔵 [get_current_user] Scheme: {scheme}, Token (first 20 chars): {token[:20]}...")
        
        if scheme.lower() != "bearer":
            logger.error(f"❌ [get_current_user] Invalid scheme: {scheme}")
            raise ValueError()
    except Exception as e:
        logger.error(f"❌ [get_current_user] Error parsing authorization header: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    logger.info(f"🔵 [get_current_user] Verifying token with AuthService...")
    user = AuthService.get_current_user(db, token)
    
    if not user:
        logger.error("❌ [get_current_user] Token verification failed - invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    logger.info(f"✅ [get_current_user] User verified: {user.email}")
    return user


@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send message to AI coach.
    
    Example request:
    ```json
    {
        "message": "What should I eat for muscle gain?"
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
    
    # Send message
    message = chat_service.send_message(
        db=db,
        user_id=user.id,
        user_profile=user_profile,
        request=request
    )
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )
    
    return message


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(50, ge=1, le=200),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat history.
    
    Query parameters:
    - limit: Number of messages (default: 50, max: 200)
    """
    messages = chat_service.get_chat_history(db, user.id, limit=limit)
    return ChatHistoryResponse(messages=messages, total=len(messages))


@router.post("/clear")
async def clear_chat_history(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all chat history for user."""
    deleted_count = chat_service.delete_chat_history(db, user.id)
    return {"message": f"Deleted {deleted_count} messages"}
