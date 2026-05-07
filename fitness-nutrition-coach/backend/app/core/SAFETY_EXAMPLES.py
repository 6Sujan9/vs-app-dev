"""
Safety Features - Quick Reference & Code Examples

Practical examples for implementing safety features in the AI Fitness Coach.
"""

# ============================================================================
# PART 1: USING INPUT VALIDATION
# ============================================================================

from app.core.safety import (
    InputValidator,
    OutputFilter,
    SafetyLevel,
    validate_workout_request,
    validate_nutrition_request,
)

# Example 1a: Quick validation of workout request
# ================================================

request = {
    'age': 30,
    'weight_kg': 75,
    'height_m': 1.8,
    'goal': 'muscle_gain',
    'duration_weeks': 12,
    'frequency': 4,
    'intensity': 'intermediate'
}

result = validate_workout_request(request)
print(f"Is safe: {result.is_safe}")
print(f"Level: {result.level}")
print(f"Message: {result.message}")
if result.violations:
    print("Violations:")
    for v in result.violations:
        print(f"  - {v}")


# Example 1b: Handling validation results in FastAPI route
# ========================================================

from fastapi import HTTPException

async def generate_workout_with_safety(
    request: WorkoutGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    # Validate request
    validation = validate_workout_request(request.dict())
    
    # Reject if dangerous
    if validation.level == SafetyLevel.DANGEROUS:
        raise HTTPException(
            status_code=400,
            detail={
                'error': 'Request contains dangerous parameters',
                'violations': validation.violations
            }
        )
    
    # Approve with warnings if needed
    if validation.requires_disclaimer:
        logger.warning(
            f"Warning-level request from user {current_user.id}",
            extra={'violations': validation.violations}
        )
    
    # Continue with generation
    result = await generate_workout(request, current_user)
    
    # Add safety metadata to response
    result['safety_validation'] = {
        'is_safe': validation.is_safe,
        'level': validation.level.value,
        'requires_disclaimer': validation.requires_disclaimer
    }
    
    return result


# ============================================================================
# PART 2: USING OUTPUT FILTERING
# ============================================================================

# Example 2a: Filter AI-generated response
# ========================================

from app.core.safety import filter_ai_response, add_disclaimers

ai_response = (
    "This 100% guaranteed diet will cure your diabetes in 2 weeks "
    "with absolutely no side effects. Stop taking your medication immediately."
)

context = {
    'age': 45,
    'medical_conditions': ['diabetes'],
    'intensity': 'high'
}

# Filter unsafe content
filter_result = filter_ai_response(ai_response, context)

print(f"Is safe: {filter_result.is_safe}")
print(f"Safety level: {filter_result.level}")
print(f"Filtered response: {filter_result.filtered_response}")
print(f"Safety note: {filter_result.safety_note}")

# Add disclaimers
final_response = add_disclaimers(
    filter_result.filtered_response,
    context
)

# Removed: "100% guaranteed", "cure diabetes in 2 weeks", "no side effects", 
#          "stop taking your medication"
# Added: Medical disclaimer, condition disclaimer, diabetes disclaimer


# Example 2b: In integration service
# ==================================

class EndToEndIntegrationService:
    def __init__(self):
        self.safety_filter = OutputFilter()
    
    async def process_workout_generation(self, user_id: int, request):
        # ... validation and AI generation ...
        
        ai_response = await bedrock_service.invoke_model(
            prompt=self._build_prompt(request),
            model='claude-3-sonnet'
        )
        
        # Filter response for safety
        context = {
            'age': user.age,
            'medical_conditions': user.medical_conditions,
            'intensity': request.intensity
        }
        
        filter_result = self.safety_filter.filter_response(
            ai_response,
            context
        )
        
        # Check if filtering removed significant content
        if len(filter_result.removed_content) > 0:
            logger.warning(
                f"Unsafe content filtered: {len(filter_result.removed_content)} items",
                extra={'removed': filter_result.removed_content}
            )
        
        # Add disclaimers
        final_response = self.safety_filter.add_disclaimers(
            filter_result.filtered_response,
            context
        )
        
        return {
            'success': True,
            'response': final_response,
            'safety_filtered': not filter_result.is_safe,
            'disclaimers': self._extract_disclaimers(final_response)
        }


# ============================================================================
# PART 3: USING RAG SAFETY ENHANCEMENT
# ============================================================================

from app.core.safety import RAGSafetyEnhancer

# Example 3a: Validate claim against RAG sources
# ==============================================

rag_enhancer = RAGSafetyEnhancer()

rag_documents = [
    {
        'source': 'American Heart Association',
        'content': 'Running burns approximately 100 calories per mile for a 180lb person',
        'score': 0.95
    },
    {
        'source': 'Mayo Clinic',
        'content': 'Weight loss depends on diet, exercise, and metabolism',
        'score': 0.92
    }
]

# Claim to validate
claim = "Running 1 mile burns exactly 100 calories in all people"

is_supported, conflict = rag_enhancer.validate_against_sources(
    claim,
    rag_documents
)

if is_supported:
    print("Claim supported by evidence")
else:
    print(f"Claim not fully supported. Conflicting info: {conflict}")
    # Expected: "Claim not supported - doesn't account for individual differences"


# Example 3b: Enhance response with evidence
# ==========================================

response = "Running is an excellent way to burn calories and improve fitness."

enhanced_response, citations = rag_enhancer.enhance_with_evidence(
    response,
    rag_documents
)

print(enhanced_response)
# Output:
# "Running is an excellent way to burn calories and improve fitness.
#
# 📚 Based on evidence from:
# 1. American Heart Association (95% relevance)
# 2. Mayo Clinic (92% relevance)"

print(citations)
# ['American Heart Association', 'Mayo Clinic']


# ============================================================================
# PART 4: USING SAFETY MIDDLEWARE
# ============================================================================

# Example 4a: Apply middleware in main.py
# ======================================

from fastapi import FastAPI
from app.middleware.safety_middleware import create_safety_middleware

app = FastAPI()

# Add safety middleware - automatically validates all requests
app.add_middleware(create_safety_middleware())

# Now all endpoints under /api/v1/integration/ are protected


# Example 4b: Access safety validation in routes
# ==============================================

from starlette.requests import Request

@app.post("/api/v1/integration/workout/generate")
async def generate_workout(
    request_data: WorkoutGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    # Middleware already validated - check results
    safety_validation = request.state.safety_validation
    
    if safety_validation.requires_disclaimer:
        logger.info(
            f"User {current_user.id} making request with safety warnings: "
            f"{safety_validation.violations}"
        )
    
    # Proceed with generation
    # ... rest of implementation ...


# ============================================================================
# PART 5: USING SAFETY VALIDATOR CLASS
# ============================================================================

from app.middleware.safety_middleware import SafetyValidator

# Example 5a: Comprehensive validation and filtering
# =================================================

validator = SafetyValidator()

# Validate input
validation_report = validator.validate_request(
    {
        'age': 70,
        'goal': 'fitness',
        'medical_conditions': ['arthritis'],
        'intensity': 'advanced',
        'duration_weeks': 24
    },
    'workout'
)

print(validation_report)
# {
#   'is_safe': False,
#   'level': 'warning',
#   'message': 'Request contains safety concerns',
#   'violations': [
#       'Advanced intensity may need modification for age 70',
#       'Arthritis requires joint-friendly exercises'
#   ],
#   'requires_disclaimer': True,
#   'approved': True  # WARNING level still approved
# }

# Generate response
ai_response = "Do advanced 2-hour workouts with heavy weights daily..."

# Filter response
filter_report = validator.filter_response(
    ai_response,
    {
        'age': 70,
        'medical_conditions': ['arthritis'],
        'intensity': 'advanced'
    },
    rag_documents=rag_docs  # optional
)

print(filter_report['filtered_response'])
# Now includes modified intensity, joint-friendly exercises, 
# and medical disclaimers

# Validate against RAG
validation = validator.validate_against_rag(
    "Heavy weight training is safe for everyone",
    rag_documents
)

print(validation)
# {
#   'claim': 'Heavy weight training is safe for everyone',
#   'is_supported_by_sources': False,
#   'conflicting_information': 'Must be modified based on age and conditions',
#   'confidence': 'low'
# }


# ============================================================================
# PART 6: TESTING SAFETY FEATURES
# ============================================================================

import pytest
from fastapi.testclient import TestClient

# Example 6a: Unit tests
# ====================

class TestInputValidation:
    def test_age_below_minimum(self):
        request = {'age': 5, 'goal': 'fitness'}
        result = validate_workout_request(request)
        assert result.level == SafetyLevel.WARNING
        assert not result.is_safe
    
    def test_extreme_calorie_intake(self):
        request = {'daily_calories': 600}
        result = validate_nutrition_request(request)
        assert result.level == SafetyLevel.DANGEROUS
        assert not result.approved
    
    def test_forbidden_term_in_requirements(self):
        request = {
            'goal': 'weight_loss',
            'specific_requirements': 'I want a crash diet'
        }
        result = validate_nutrition_request(request)
        assert any('crash' in v for v in result.violations)
    
    def test_medical_condition_detected(self):
        request = {
            'goal': 'weight_loss',
            'medical_conditions': ['heart_disease']
        }
        result = validate_workout_request(request)
        assert result.requires_disclaimer
        assert 'Heart' in str(result.violations)


# Example 6b: Integration tests
# ============================

class TestSafetyIntegration:
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def auth_token(self, client):
        # Create test user and get token
        response = client.post('/api/v1/auth/register', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        response = client.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'Test123!'
        })
        return response.json()['access_token']
    
    def test_dangerous_request_rejected(self, client, auth_token):
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'age': 5,
                'goal': 'muscle_gain',
                'duration_weeks': 100,
                'frequency': 7
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 400
        assert response.json()['error_type'] == 'safety_violation'
        assert 'Age' in str(response.json()['violations'])
    
    def test_warning_request_approved(self, client, auth_token):
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'age': 75,
                'goal': 'fitness',
                'medical_conditions': ['arthritis'],
                'intensity': 'intermediate',
                'duration_weeks': 12,
                'frequency': 4
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['safety_info']['level'] == 'warning'
        assert 'age-specific' in data['safety_info']['disclaimers']
    
    def test_disclaimers_added_to_response(self, client, auth_token):
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'age': 65,
                'goal': 'fitness'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        data = response.json()
        # Check that disclaimer is in response
        assert 'MEDICAL DISCLAIMER' in data['workout']['description']
        assert 'healthcare professional' in data['workout']['description'].lower()


# ============================================================================
# PART 7: MONITORING & LOGGING
# ============================================================================

import logging
from functools import wraps

# Example 7a: Safety violation logging
# ==================================

safety_logger = logging.getLogger('safety')
handler = logging.FileHandler('logs/safety_violations.log')
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
safety_logger.addHandler(handler)


def log_safety_event(event_type, level, details):
    """Log safety-related events."""
    if level == SafetyLevel.DANGEROUS:
        safety_logger.critical(
            f"{event_type}: {details}",
            extra={'level': 'critical'}
        )
    elif level == SafetyLevel.WARNING:
        safety_logger.warning(
            f"{event_type}: {details}",
            extra={'level': 'warning'}
        )
    else:
        safety_logger.info(
            f"{event_type}: {details}",
            extra={'level': 'info'}
        )


# Example 7b: Monitor safety metrics
# ==================================

from collections import defaultdict
from datetime import datetime

class SafetyMetrics:
    def __init__(self):
        self.violations_by_type = defaultdict(int)
        self.rejections_by_reason = defaultdict(int)
        self.filtered_responses = 0
        self.disclaimers_added = 0
    
    def record_violation(self, violation_text):
        """Record a safety violation."""
        violation_type = self._categorize_violation(violation_text)
        self.violations_by_type[violation_type] += 1
    
    def record_rejection(self, reason):
        """Record a rejected request."""
        self.rejections_by_reason[reason] += 1
    
    def record_filtering(self):
        """Record that response was filtered."""
        self.filtered_responses += 1
    
    def get_metrics(self):
        """Get current metrics."""
        return {
            'violations_by_type': dict(self.violations_by_type),
            'rejections_by_reason': dict(self.rejections_by_reason),
            'filtered_responses': self.filtered_responses,
            'disclaimers_added': self.disclaimers_added
        }
    
    def _categorize_violation(self, text):
        if 'age' in text.lower():
            return 'age_violation'
        elif 'calorie' in text.lower():
            return 'calorie_violation'
        elif 'medical' in text.lower():
            return 'medical_condition'
        elif 'duration' in text.lower():
            return 'duration_violation'
        else:
            return 'other'


# ============================================================================
# PART 8: CONFIGURATION
# ============================================================================

# Example 8a: Environment variables for safety settings
# ==================================================

import os
from pydantic import BaseSettings

class SafetySettings(BaseSettings):
    # Feature toggles
    SAFETY_ENABLED: bool = os.getenv('SAFETY_ENABLED', 'true').lower() == 'true'
    STRICT_MODE: bool = os.getenv('STRICT_MODE', 'false').lower() == 'true'
    AUTO_FILTER_UNSAFE: bool = os.getenv('AUTO_FILTER_UNSAFE', 'true').lower() == 'true'
    AUTO_ADD_DISCLAIMERS: bool = os.getenv('AUTO_ADD_DISCLAIMERS', 'true').lower() == 'true'
    
    # Validation parameters
    MIN_SAFE_AGE: int = int(os.getenv('MIN_SAFE_AGE', '13'))
    MAX_SAFE_AGE: int = int(os.getenv('MAX_SAFE_AGE', '120'))
    MIN_SAFE_CALORIES: int = int(os.getenv('MIN_SAFE_CALORIES', '1200'))
    MAX_SAFE_CALORIES: int = int(os.getenv('MAX_SAFE_CALORIES', '5000'))
    
    # Logging
    LOG_SAFETY_VIOLATIONS: bool = os.getenv('LOG_SAFETY_VIOLATIONS', 'true').lower() == 'true'
    SAFETY_LOG_LEVEL: str = os.getenv('SAFETY_LOG_LEVEL', 'WARNING')

safety_settings = SafetySettings()


# Example 8b: Using safety settings in validators
# =============================================

class ConfigurableInputValidator(InputValidator):
    def __init__(self, settings: SafetySettings = None):
        super().__init__()
        self.settings = settings or safety_settings
        # Override defaults with settings
        self.MIN_SAFE_AGE = self.settings.MIN_SAFE_AGE
        self.MAX_SAFE_AGE = self.settings.MAX_SAFE_AGE
        self.MIN_SAFE_CALORIES = self.settings.MIN_SAFE_CALORIES
        self.MAX_SAFE_CALORIES = self.settings.MAX_SAFE_CALORIES


# ============================================================================
# SUMMARY
# ============================================================================

"""
SAFETY FEATURES SUMMARY:

1. INPUT VALIDATION
   - Validate age, BMI, frequency, duration, calories
   - Detect medical conditions
   - Flag forbidden terms
   - Categorize as SAFE, WARNING, or DANGEROUS

2. OUTPUT FILTERING
   - Detect unsafe claims
   - Check medical claim qualifications
   - Filter dangerous combinations
   - Remove disqualifying content

3. RAG ENHANCEMENT
   - Validate claims against evidence
   - Add citations to response
   - Improve hallucination resistance

4. MIDDLEWARE INTEGRATION
   - Automatic validation on all requests
   - Automatic response filtering
   - Consistent disclaimer application

5. LOGGING & MONITORING
   - Log all safety violations
   - Track metrics by type
   - Alert on anomalies

6. FRONTEND DISPLAY
   - Show safety warnings
   - Highlight disclaimers
   - Provide healthcare provider links

USAGE IN YOUR CODE:
- from app.core.safety import validate_workout_request
- from app.middleware.safety_middleware import SafetyValidator
- Add middleware in main.py
- Handle warnings in route handlers
- Display disclaimers in frontend
"""
