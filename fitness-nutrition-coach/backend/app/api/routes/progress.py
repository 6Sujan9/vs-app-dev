"""Progress routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProgressLogRequest, ProgressLogResponse, ProgressListResponse
from app.services.auth import AuthService
from app.services.progress import ProgressService

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])


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


@router.post("/log", response_model=ProgressLogResponse)
async def log_progress(
    request: ProgressLogRequest,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log progress.
    
    Example request:
    ```json
    {
        "weight": 75.5,
        "body_fat_percentage": 15.5,
        "muscle_mass": 60,
        "chest": 105,
        "waist": 85,
        "hips": 90,
        "thighs": 60,
        "arms": 35,
        "exercises_completed": 5,
        "meals_logged": 4,
        "notes": "Great workout today!"
    }
    ```
    """
    log = ProgressService.log_progress(db, user.id, request)
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log progress"
        )
    
    return log


@router.get("/", response_model=ProgressListResponse)
async def get_progress(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(100, ge=1, le=500),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get progress logs.
    
    Query parameters:
    - days: Get logs from last N days (default: 30)
    - limit: Number of results (default: 100, max: 500)
    """
    logs, total = ProgressService.get_user_progress(
        db=db,
        user_id=user.id,
        days=days,
        limit=limit
    )
    
    return ProgressListResponse(logs=logs, total=total)


@router.get("/analytics")
async def get_progress_analytics(
    days: int = Query(30, ge=1, le=365),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get progress analytics.
    
    Query parameters:
    - days: Analyze last N days (default: 30)
    """
    analytics = ProgressService.get_progress_analytics(db, user.id, days=days)
    return analytics


@router.patch("/{log_id}", response_model=ProgressLogResponse)
async def update_progress_log(
    log_id: int,
    request: ProgressLogRequest,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a progress log."""
    data = request.dict(exclude_unset=True)
    log = ProgressService.update_progress_log(db, user.id, log_id, data)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress log not found"
        )
    return log


@router.delete("/{log_id}")
async def delete_progress_log(
    log_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a progress log."""
    deleted = ProgressService.delete_progress_log(db, user.id, log_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress log not found"
        )
    
    return {"message": "Progress log deleted successfully"}
