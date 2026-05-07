"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, TokenRefreshRequest
from app.services.auth import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Example request:
    ```json
    {
        "email": "user@example.com",
        "username": "username",
        "password": "securepassword123",
        "first_name": "John",
        "last_name": "Doe"
    }
    ```
    """
    user, error = AuthService.register_user(db, request)
    
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login user and get tokens.
    
    Example request:
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword123"
    }
    ```
    """
    user = AuthService.authenticate_user(db, request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/refresh", response_model=dict)
async def refresh_token(request: TokenRefreshRequest):
    """
    Refresh access token.
    
    Example request:
    ```json
    {
        "refresh_token": "eyJhbGc..."
    }
    ```
    """
    access_token = AuthService.refresh_access_token(request.refresh_token)
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/verify")
async def verify_token(request: Request, db: Session = Depends(get_db)):
    """
    Verify a token from Authorization header.
    """
    from app.core.security import SecurityService
    
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid"
        )
    
    token = auth_header.split(" ")[1]
    payload = SecurityService.verify_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return {
        "valid": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "age": user.age,
            "weight": user.weight,
            "height": user.height,
            "gender": user.gender,
            "fitness_level": user.fitness_level,
            "goals": user.goals,
            "dietary_restrictions": user.dietary_restrictions,
            "medical_conditions": user.medical_conditions,
            "is_active": user.is_active,
        }
    }
