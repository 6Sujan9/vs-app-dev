"""SQLAlchemy models for database tables."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    
    # Physical attributes
    age = Column(Integer)
    weight = Column(Float)  # kg
    height = Column(Float)  # cm
    gender = Column(String)  # male/female/other
    
    # Fitness profile
    fitness_level = Column(String)  # beginner/intermediate/advanced
    goals = Column(JSON)  # List of goals
    dietary_restrictions = Column(JSON)  # List of restrictions
    medical_conditions = Column(JSON)  # List of conditions
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    workouts = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    nutrition_plans = relationship("NutritionPlan", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")


class WorkoutPlan(Base):
    """Workout plan model."""
    
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text)
    goal = Column(String)  # muscle_gain, weight_loss, endurance
    duration_weeks = Column(Integer)
    frequency = Column(Integer)  # sessions per week
    equipment = Column(JSON)  # List of equipment
    intensity = Column(String)  # low, medium, high
    
    # AI generated content
    exercises = Column(JSON)  # List of exercises with details
    bedrock_response = Column(Text)  # Raw response from Bedrock
    rag_documents_used = Column(JSON)  # List of RAG document IDs
    tokens_used = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="workouts")


class NutritionPlan(Base):
    """Nutrition/meal plan model."""
    
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, nullable=False)
    description = Column(Text)
    goal = Column(String)  # muscle_gain, weight_loss, maintenance
    duration_days = Column(Integer)
    meals_per_day = Column(Integer)
    daily_calories = Column(Integer)
    diet_type = Column(String)  # vegan, keto, balanced, etc.
    
    # Nutritional targets
    protein_grams = Column(Float)
    carbs_grams = Column(Float)
    fats_grams = Column(Float)
    
    # AI generated content
    meals = Column(JSON)  # List of meals with foods
    bedrock_response = Column(Text)  # Raw response from Bedrock
    rag_documents_used = Column(JSON)  # List of RAG document IDs
    tokens_used = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="nutrition_plans")


class ChatMessage(Base):
    """Chat message model."""
    
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    
    # AI context
    rag_context_used = Column(JSON)  # Documents used for context
    bedrock_model = Column(String)
    tokens_used = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="chat_history")


class ProgressLog(Base):
    """Progress tracking model."""
    
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Physical metrics
    weight = Column(Float)  # kg
    body_fat_percentage = Column(Float)
    muscle_mass = Column(Float)
    
    # Measurements (cm)
    chest = Column(Float)
    waist = Column(Float)
    hips = Column(Float)
    thighs = Column(Float)
    arms = Column(Float)
    
    # Activity
    exercises_completed = Column(Integer, default=0)
    meals_logged = Column(Integer, default=0)
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="progress_logs")
