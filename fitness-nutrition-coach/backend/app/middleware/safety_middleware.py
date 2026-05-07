"""
Safety Middleware - Integration with FastAPI

Middleware to apply safety checks to all fitness/nutrition requests and responses.
"""

import logging
import json
from typing import Dict, Any, Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import HTTPException

from app.core.safety import (
    InputValidator,
    OutputFilter,
    RAGSafetyEnhancer,
    SafetyLevel,
    validate_workout_request,
    validate_nutrition_request,
    filter_ai_response,
    add_disclaimers,
)

logger = logging.getLogger(__name__)


class SafetyMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce safety on all API endpoints.
    
    - Validates input parameters
    - Filters unsafe responses
    - Adds medical disclaimers
    - Logs safety violations
    """
    
    # Routes that require safety validation
    SAFETY_ROUTES = {
        '/api/v1/integration/workout/generate': 'workout',
        '/api/v1/integration/nutrition/generate': 'nutrition',
    }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Dict[str, Any]:
        """
        Intercept request/response for safety checks.
        """
        # Check if this route requires safety validation
        route_type = None
        for route, req_type in self.SAFETY_ROUTES.items():
            if route in request.url.path:
                route_type = req_type
                break
        
        # If not a safety route, pass through
        if not route_type:
            return await call_next(request)
        
        # Get request body for validation
        try:
            body = await request.json()
        except:
            return await call_next(request)
        
        # Validate input based on request type
        validation_result = None
        if route_type == 'workout':
            validation_result = validate_workout_request(body)
        elif route_type == 'nutrition':
            validation_result = validate_nutrition_request(body)
        
        # Log validation result
        logger.info(
            f"Safety validation - Level: {validation_result.level}, "
            f"Safe: {validation_result.is_safe}",
            extra={'violations': validation_result.violations}
        )
        
        # Reject if dangerous
        if validation_result.level == SafetyLevel.DANGEROUS:
            return JSONResponse(
                status_code=400,
                content={
                    'success': False,
                    'error': 'Request contains dangerous parameters',
                    'error_type': 'safety_violation',
                    'violations': validation_result.violations,
                    'message': validation_result.message,
                    'recommendation': (
                        'Please consult a healthcare professional for personalized advice.'
                    )
                }
            )
        
        # Attach validation result to request state
        request.state.safety_validation = validation_result
        request.state.route_type = route_type
        
        # Call the actual endpoint
        response = await call_next(request)
        
        # Don't modify non-JSON responses
        if response.status_code != 200:
            return response
        
        # Parse response for output filtering
        try:
            response_body = json.loads(response.body.decode())
        except:
            return response
        
        # Filter AI response if present
        if route_type in response_body and isinstance(response_body[route_type], dict):
            context = {
                'age': body.get('age'),
                'medical_conditions': body.get('medical_conditions', []),
                'intensity': body.get('intensity'),
                'daily_calories': body.get('daily_calories'),
            }
            
            # Get the AI-generated text from the response
            ai_text = response_body[route_type].get('description', '')
            if ai_text:
                # Filter response
                filter_result = filter_ai_response(ai_text, context)
                
                # Update response with filtered content
                response_body[route_type]['description'] = filter_result.filtered_response
                
                # Add safety note if needed
                if filter_result.safety_note:
                    response_body['safety_note'] = filter_result.safety_note
                
                # Add disclaimers
                response_body[route_type]['description'] = add_disclaimers(
                    filter_result.filtered_response,
                    context
                )
                
                # Log filtering result
                if not filter_result.is_safe:
                    logger.warning(
                        f"Unsafe content filtered - {len(filter_result.removed_content)} items removed",
                        extra={'removed': filter_result.removed_content}
                    )
        
        # Return modified response
        return JSONResponse(
            status_code=response.status_code,
            content=response_body
        )


class SafetyValidator:
    """
    Standalone validator for use in route handlers.
    
    Usage:
        validator = SafetyValidator()
        validator.validate_and_filter(request, response, context)
    """
    
    def __init__(self):
        self.input_validator = InputValidator()
        self.output_filter = OutputFilter()
        self.rag_enhancer = RAGSafetyEnhancer()
    
    def validate_request(
        self,
        request_data: Dict[str, Any],
        request_type: str
    ) -> Dict[str, Any]:
        """
        Validate request and return comprehensive safety report.
        
        Args:
            request_data: Request parameters
            request_type: 'workout' or 'nutrition'
            
        Returns:
            Safety report dictionary
        """
        if request_type == 'workout':
            validation = self.input_validator.validate_workout_request(request_data)
        elif request_type == 'nutrition':
            validation = self.input_validator.validate_nutrition_request(request_data)
        else:
            raise ValueError(f"Unknown request type: {request_type}")
        
        return {
            'is_safe': validation.is_safe,
            'level': validation.level.value,
            'message': validation.message,
            'violations': validation.violations,
            'requires_disclaimer': validation.requires_disclaimer,
            'approved': validation.is_safe or validation.level == SafetyLevel.WARNING
        }
    
    def filter_response(
        self,
        response_text: str,
        context: Dict[str, Any],
        rag_documents: list = None
    ) -> Dict[str, Any]:
        """
        Filter AI response for safety and enhance with evidence.
        
        Args:
            response_text: AI-generated response
            context: Request context
            rag_documents: Optional RAG documents for evidence
            
        Returns:
            Safety-filtered response with disclaimers
        """
        # Filter for unsafe content
        filter_result = self.output_filter.filter_response(response_text, context)
        
        filtered_text = filter_result.filtered_response
        
        # Enhance with RAG evidence if available
        if rag_documents:
            filtered_text, citations = self.rag_enhancer.enhance_with_evidence(
                filtered_text,
                rag_documents
            )
        
        # Add disclaimers
        final_text = self.output_filter.add_disclaimers(filtered_text, context)
        
        return {
            'filtered_response': final_text,
            'is_safe': filter_result.is_safe,
            'level': filter_result.level.value,
            'removed_content_count': len(filter_result.removed_content),
            'removed_items': filter_result.removed_content,
            'safety_note': filter_result.safety_note,
            'disclaimers_added': True
        }
    
    def validate_against_rag(
        self,
        claim: str,
        rag_documents: list
    ) -> Dict[str, Any]:
        """
        Validate claim against RAG sources.
        
        Args:
            claim: Text claim to validate
            rag_documents: RAG retrieved documents
            
        Returns:
            Validation result
        """
        is_supported, conflict = self.rag_enhancer.validate_against_sources(
            claim,
            rag_documents
        )
        
        return {
            'claim': claim,
            'is_supported_by_sources': is_supported,
            'conflicting_information': conflict,
            'confidence': 'high' if is_supported else 'low'
        }


def create_safety_middleware() -> SafetyMiddleware:
    """Factory function to create safety middleware."""
    return SafetyMiddleware()
