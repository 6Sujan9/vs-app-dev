"""
Safety Integration - How to Use Safety Features

This module shows how to integrate safety features into the FastAPI backend.
"""

# Example 1: Update main.py to include SafetyMiddleware
# ====================================================

"""
# In backend/app/main.py:

from fastapi import FastAPI
from app.middleware.safety_middleware import create_safety_middleware

app = FastAPI()

# Add safety middleware
app.add_middleware(create_safety_middleware())

# The middleware will automatically:
# 1. Validate all workout/nutrition requests
# 2. Reject dangerous inputs
# 3. Filter unsafe AI responses
# 4. Add medical disclaimers
"""


# Example 2: Update integration routes to use SafetyValidator
# ===========================================================

"""
# In backend/app/api/routes/integration.py:

from fastapi import Depends, HTTPException
from app.middleware.safety_middleware import SafetyValidator
from app.core.safety import validate_workout_request

validator = SafetyValidator()

@app.post("/api/v1/integration/workout/generate")
async def generate_workout(request: WorkoutGenerateRequest):
    '''Generate a workout with safety validation.'''
    
    # Step 1: Validate input
    validation = validator.validate_request(
        request.dict(),
        'workout'
    )
    
    # Log validation
    logger.info(f"Workout validation: {validation}")
    
    # If dangerous, reject
    if not validation['approved']:
        raise HTTPException(
            status_code=400,
            detail={
                'error': 'Request contains safety concerns',
                'violations': validation['violations'],
                'recommendation': 'Please consult a healthcare professional'
            }
        )
    
    # Step 2: Get user and context
    user = get_current_user(credentials)
    context = {
        'age': user.age,
        'medical_conditions': user.medical_conditions,
        'intensity': request.intensity,
    }
    
    # Step 3: Run integration (existing logic)
    result = await integration_service.process_workout_generation(
        user_id=user.id,
        request=request
    )
    
    # Step 4: Filter response
    if result.get('success'):
        filtered = validator.filter_response(
            result['workout']['description'],
            context,
            result.get('rag_documents', [])
        )
        
        # Update response with filtered content
        result['workout']['description'] = filtered['filtered_response']
        result['safety_info'] = {
            'is_safe': filtered['is_safe'],
            'removed_content_count': filtered['removed_content_count'],
        }
    
    return result
"""


# Example 3: Update integration service to use safety checks
# ==========================================================

"""
# In backend/app/services/integration.py:

from app.core.safety import (
    InputValidator,
    OutputFilter,
    RAGSafetyEnhancer,
    SafetyLevel
)

class EndToEndIntegrationService:
    def __init__(self, ...):
        self.safety_validator = InputValidator()
        self.safety_filter = OutputFilter()
        self.rag_enhancer = RAGSafetyEnhancer()
    
    async def process_workout_generation(self, user_id: int, request):
        '''Process with built-in safety checks.'''
        
        # Validate input
        validation = self.safety_validator.validate_workout_request(
            request.dict()
        )
        
        if validation.level == SafetyLevel.DANGEROUS:
            raise ValueError(f"Dangerous request: {validation.violations}")
        
        # Log if warning level
        if validation.level == SafetyLevel.WARNING:
            logger.warning(
                f"Warning-level request from user {user_id}: "
                f"{validation.violations}"
            )
        
        # Get RAG context
        rag_docs = await self._retrieve_fitness_context(request.goal)
        
        # Call Bedrock
        ai_response = await self._call_bedrock(
            prompt=self._build_workout_prompt(request),
            temperature=0.7
        )
        
        # Filter response
        filtered = self.safety_filter.filter_response(
            ai_response,
            {'intensity': request.intensity}
        )
        
        # Enhance with evidence
        enhanced, citations = self.rag_enhancer.enhance_with_evidence(
            filtered.filtered_response,
            rag_docs
        )
        
        # Add disclaimers
        final_response = self.safety_filter.add_disclaimers(
            enhanced,
            {'age': user.age, 'medical_conditions': user.medical_conditions}
        )
        
        # Store in database
        await self._store_workout_in_db(
            user_id=user_id,
            workout=final_response,
            safety_level=validation.level.value,
            rag_citations=citations
        )
        
        return {
            'success': True,
            'workout': final_response,
            'safety_level': validation.level.value,
            'disclaimers': ['medical', 'intensity', 'age-appropriate']
        }
"""


# Example 4: Frontend Safety Display
# ==================================

"""
// In frontend/src/components/IntegrationExample.jsx:

function displaySafetyInfo(result) {
    if (result.safety_note) {
        // Display safety warning
        showAlert({
            type: 'warning',
            title: 'Important Safety Information',
            message: result.safety_note,
            icon: '⚠️'
        });
    }
    
    // Display disclaimers
    if (result.workout && result.workout.includes('DISCLAIMER')) {
        const disclaimers = result.workout
            .split('\\n')
            .filter(line => line.includes('DISCLAIMER'))
            .map(line => <DisclaimerBox key={line}>{line}</DisclaimerBox>);
        
        renderDisclaimers(disclaimers);
    }
    
    // Show validation warnings
    if (result.validation?.violations?.length > 0) {
        showWarnings(result.validation.violations);
    }
}

// Safety context banner
function SafetyBanner() {
    return (
        <div className="safety-banner">
            <h3>⚠️ Medical Disclaimer</h3>
            <p>
                This fitness and nutrition advice is for educational purposes only.
                Always consult with a healthcare professional before starting any
                new exercise program or changing your diet.
            </p>
            <button onClick={() => goToDoctorInfo()}>Learn More</button>
        </div>
    );
}
"""


# Example 5: Testing Safety Features
# ===================================

"""
# In tests/test_safety.py:

from app.core.safety import (
    validate_workout_request,
    validate_nutrition_request,
    filter_ai_response,
)

def test_dangerous_request_rejected():
    '''Test that dangerous requests are rejected.'''
    request = {
        'goal': 'muscle_gain',
        'duration_weeks': 100,  # Too long
        'frequency': 10,  # Too frequent
    }
    
    result = validate_workout_request(request)
    assert not result.is_safe
    assert result.level == 'warning' or result.level == 'dangerous'

def test_medical_condition_flagged():
    '''Test medical conditions trigger disclaimers.'''
    request = {
        'goal': 'muscle_gain',
        'medical_conditions': ['heart_disease'],
    }
    
    result = validate_workout_request(request)
    assert result.requires_disclaimer
    assert 'Heart' in str(result.violations)

def test_unsafe_claims_filtered():
    '''Test that unsafe claims are filtered.'''
    response = 'This will cure your heart disease instantly with no side effects!'
    context = {}
    
    result = filter_ai_response(response, context)
    assert not result.is_safe
    assert 'cure' not in result.filtered_response.lower()

def test_forbidden_terms_detected():
    '''Test that forbidden terms are detected.'''
    request = {
        'goal': 'fat_loss',
        'specific_requirements': 'I want a starvation diet',
    }
    
    result = validate_nutrition_request(request)
    assert not result.is_safe
    assert any('starvation' in v for v in result.violations)
"""


# Example 6: Safety Configuration
# ===============================

"""
# In backend/.env:

# Safety feature toggles
SAFETY_ENABLED=true
STRICT_MODE=false  # If true, rejects all warnings, not just dangerous
REQUIRE_DISCLAIMERS=true
USE_RAG_VALIDATION=true  # Check claims against RAG sources
LOG_SAFETY_VIOLATIONS=true

# Validation parameters
MIN_SAFE_AGE=13
MAX_SAFE_AGE=120
MIN_SAFE_CALORIES=1200
MAX_SAFE_CALORIES=5000
MAX_EXERCISE_FREQUENCY=7
MAX_EXERCISE_DURATION_WEEKS=52

# Response filtering
AUTO_FILTER_UNSAFE_CONTENT=true
AUTO_ADD_DISCLAIMERS=true
REQUIRE_RAG_SOURCES=false  # Require evidence-based sources
"""


# Example 7: Safety Logging and Monitoring
# ========================================

"""
# Safety violations are logged to help monitor system health

# Log format:
[2024-01-15 10:30:45] WARNING Safety validation - Level: warning, Safe: false
Violations:
- Medical condition 'heart_disease' requires professional supervision
- Requires disclaimer: true

# Monitor these metrics:
1. Validation rejection rate (% of requests rejected as dangerous)
2. Warning rate (% of requests with warnings)
3. Unsafe content filtered count
4. Most common safety violations
5. User feedback on safety features

# Set up CloudWatch alarms:
- High validation rejection rate (>5%)
- Unusual safety violation patterns
- Rapid changes in safety metrics
"""


# Example 8: User Communication Strategy
# ======================================

"""
// Show progressively in UI:

1. ON FORM (INPUT VALIDATION)
   "⚠️ You reported heart disease. This plan will include disclaimers."

2. ON RESULTS (OUTPUT FILTERING)
   "⚠️ MEDICAL DISCLAIMER: This advice should not replace professional guidance."

3. IN DETAILS
   "📚 Based on evidence from: CDC, American Heart Association, ..."
   
4. AT BOTTOM
   "🏥 This plan should be reviewed by your healthcare provider."

// Tone: Helpful, not scary
// Be transparent about limitations
// Encourage professional consultation
"""


# Summary of Safety Features
# ==========================

"""
INPUT VALIDATION:
✓ Age range checks (13-120)
✓ BMI safety checks
✓ Exercise frequency limits (1-7 days/week)
✓ Duration limits (1-52 weeks)
✓ Calorie range validation
✓ Medical condition detection
✓ Forbidden term detection

OUTPUT FILTERING:
✓ Dangerous claim detection
✓ Unqualified medical claim filtering
✓ Dangerous combination detection
✓ Automatic disclaimer addition
✓ Evidence-based citations

RAG SAFETY ENHANCEMENT:
✓ Validate claims against sources
✓ Add evidence citations
✓ Reduce hallucinations
✓ Improve claim credibility

MIDDLEWARE INTEGRATION:
✓ Automatic validation on all requests
✓ Automatic response filtering
✓ Consistent disclaimer application
✓ Comprehensive logging

FRONTEND FEATURES:
✓ Safety warnings displayed
✓ Disclaimers highlighted
✓ Medical advice badges
✓ Healthcare provider link
"""
