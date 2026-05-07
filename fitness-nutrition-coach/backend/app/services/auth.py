"""Authentication service."""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import SecurityService, pwd_context
from datetime import timedelta
from typing import Optional, Tuple


class AuthService:
    """Service for handling authentication."""

    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> Tuple[User, str]:
        """
        Register a new user.
        
        Args:
            db: Database session
            request: Registration request data
            
        Returns:
            Tuple of (User, error_message). Error message is None if successful.
        """
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.email == request.email) | (User.username == request.username)
        ).first()
        
        if existing_user:
            if existing_user.email == request.email:
                return None, "Email already registered"
            return None, "Username already taken"
        
        # Create new user
        user = User(
            email=request.email,
            username=request.username,
            hashed_password=SecurityService.hash_password(request.password),
            first_name=request.first_name,
            last_name=request.last_name,
        )
        
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user, None
        except IntegrityError:
            db.rollback()
            return None, "Failed to create user"

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user.
        
        Args:
            db: Database session
            email: User email
            password: User password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        if not SecurityService.verify_password(password, user.hashed_password):
            return None
        
        return user

    @staticmethod
    def create_tokens(user: User) -> TokenResponse:
        """
        Create access and refresh tokens for user.
        
        Args:
            user: User object
            
        Returns:
            TokenResponse with tokens
        """
        # Create tokens
        access_token = SecurityService.create_access_token(
            data={"sub": user.id, "email": user.email}
        )
        refresh_token = SecurityService.create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )
        
        # Prepare user data
        user_data = {
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
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=300,  # 5 minutes for demo, should be settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            user=user_data
        )

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[str]:
        """
        Create a new access token from refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New access token or None if invalid
        """
        payload = SecurityService.verify_token(refresh_token, token_type="refresh")
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            return None
        
        access_token = SecurityService.create_access_token(
            data={"sub": user_id, "email": email}
        )
        
        return access_token

    @staticmethod
    def get_current_user(db: Session, token: str) -> Optional[User]:
        """
        Get current user from token.
        
        Args:
            db: Database session
            token: Access token
            
        Returns:
            User object or None if token invalid
        """
        payload = SecurityService.verify_token(token, token_type="access")
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        return user
