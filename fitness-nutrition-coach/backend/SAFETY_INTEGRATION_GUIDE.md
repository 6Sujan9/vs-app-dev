# Safety Features Integration Guide

**Complete step-by-step guide to integrate safety features into existing backend code**

---

## 📋 Overview

This guide shows how to integrate the safety system into your existing FastAPI backend. The safety system consists of:

- **Input Validation**: Catch dangerous requests early
- **Output Filtering**: Remove unsafe content from AI responses
- **RAG Enhancement**: Validate claims against evidence
- **Middleware**: Automatic enforcement across all endpoints
- **Logging**: Track all safety violations

---

## 🚀 Quick Start (5 minutes)

### Step 1: Add Middleware to main.py

```python
# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.safety_middleware import create_safety_middleware  # ADD THIS
from app.api import routes

app = FastAPI(
    title="AI Fitness Coach",
    description="Complete fitness and nutrition planning with AI",
    version="1.0.0"
)

# Existing CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD SAFETY MIDDLEWARE - must be BEFORE other middleware
app.add_middleware(create_safety_middleware())

# Include routes
app.include_router(routes.auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(routes.users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(routes.integration.router, prefix="/api/v1/integration", tags=["integration"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Step 2: Update Integration Routes

```python
# backend/app/api/routes/integration.py

from fastapi import APIRouter, Depends, HTTPException
from starlette.requests import Request
from app.core.security import get_current_user
from app.core.safety import validate_workout_request, filter_ai_response
from app.services.integration import EndToEndIntegrationService
from app.schemas.integration import WorkoutGenerateRequest, NutritionGenerateRequest

router = APIRouter()
integration_service = EndToEndIntegrationService()

@router.post("/workout/generate")
async def generate_workout(
    request_body: WorkoutGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Generate personalized workout with safety validation."""
    
    # Middleware already validated - check safety info in request state
    safety_validation = getattr(request.state, 'safety_validation', None)
    
    try:
        # Generate workout using integration service
        result = await integration_service.process_workout_generation(
            current_user.id,
            request_body
        )
        
        # Add safety metadata to response
        response_data = {
            "success": True,
            "request_id": result['request_id'],
            "workout": result['workout'],
            "metadata": {
                "rag_documents_used": result.get('rag_documents_count', 0),
                "generation_time_ms": result.get('generation_time_ms', 0),
                "tokens_used": result.get('tokens_used', {}),
            },
            "safety_info": {
                "validation_level": safety_validation.level.value if safety_validation else "safe",
                "content_filtered": result.get('content_filtered', False),
                "disclaimers_added": result.get('disclaimers_added', []),
                "medical_clearance_recommended": safety_validation.requires_disclaimer if safety_validation else False,
            }
        }
        
        return response_data
    
    except Exception as e:
        logger.error(f"Error generating workout: {str(e)}", extra={
            'user_id': current_user.id,
            'request_id': request_body.request_id
        })
        raise HTTPException(
            status_code=500,
            detail="Error generating workout. Please try again."
        )


@router.post("/nutrition/generate")
async def generate_nutrition(
    request_body: NutritionGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Generate personalized nutrition plan with safety validation."""
    
    safety_validation = getattr(request.state, 'safety_validation', None)
    
    try:
        result = await integration_service.process_nutrition_generation(
            current_user.id,
            request_body
        )
        
        return {
            "success": True,
            "request_id": result['request_id'],
            "nutrition_plan": result['nutrition_plan'],
            "metadata": {
                "rag_documents_used": result.get('rag_documents_count', 0),
                "generation_time_ms": result.get('generation_time_ms', 0),
                "tokens_used": result.get('tokens_used', {}),
            },
            "safety_info": {
                "validation_level": safety_validation.level.value if safety_validation else "safe",
                "content_filtered": result.get('content_filtered', False),
                "disclaimers_added": result.get('disclaimers_added', []),
                "medical_clearance_recommended": safety_validation.requires_disclaimer if safety_validation else False,
            }
        }
    
    except Exception as e:
        logger.error(f"Error generating nutrition plan: {str(e)}", extra={
            'user_id': current_user.id,
            'request_id': request_body.request_id
        })
        raise HTTPException(
            status_code=500,
            detail="Error generating nutrition plan. Please try again."
        )
```

### Step 3: Update Integration Service

```python
# backend/app/services/integration.py

from app.core.safety import OutputFilter, RAGSafetyEnhancer

class EndToEndIntegrationService:
    def __init__(self):
        self.rag_service = RAGRetrievalService()
        self.bedrock_service = BedrockService()
        self.db_service = DatabaseService()
        self.output_filter = OutputFilter()  # ADD THIS
        self.rag_enhancer = RAGSafetyEnhancer()  # ADD THIS
    
    async def process_workout_generation(self, user_id: int, request: WorkoutGenerateRequest):
        """Process workout generation with safety."""
        
        # Create request tracking
        request_id = str(uuid.uuid4())
        timeline = []
        
        try:
            # Step 1: Validate input (already done by middleware)
            timeline.append({
                'step': 'Input Validation',
                'duration_ms': 10,
                'status': 'complete'
            })
            
            # Step 2: Retrieve RAG context
            start = time.time()
            rag_docs = await self.rag_service.retrieve_workout_context(
                goal=request.goal,
                age=request.age,
                medical_conditions=request.medical_conditions or [],
                intensity=request.intensity
            )
            timeline.append({
                'step': 'RAG Retrieval',
                'duration_ms': int((time.time() - start) * 1000),
                'documents_retrieved': len(rag_docs),
                'status': 'complete'
            })
            
            # Step 3: Generate with Bedrock
            start = time.time()
            ai_response = await self.bedrock_service.invoke_model(
                prompt=self._build_workout_prompt(request, rag_docs),
                model='claude-3-sonnet-20240229',
                max_tokens=2048
            )
            timeline.append({
                'step': 'AI Generation',
                'duration_ms': int((time.time() - start) * 1000),
                'status': 'complete'
            })
            
            # Step 4: Filter for safety
            start = time.time()
            context = {
                'age': request.age,
                'medical_conditions': request.medical_conditions or [],
                'intensity': request.intensity,
                'duration_weeks': request.duration_weeks
            }
            
            filter_result = self.output_filter.filter_response(
                ai_response,
                context
            )
            
            # Check if RAG sources validate claims
            rag_validation_result = self.rag_enhancer.validate_against_sources(
                ai_response,
                rag_docs
            )
            
            timeline.append({
                'step': 'Safety Filtering',
                'duration_ms': int((time.time() - start) * 1000),
                'unsafe_items_removed': len(filter_result.removed_content),
                'rag_validated': rag_validation_result[0],
                'status': 'complete'
            })
            
            # Step 5: Add disclaimers
            enhanced_response = self.output_filter.add_disclaimers(
                filter_result.filtered_response,
                context
            )
            
            # Step 6: Store in database
            start = time.time()
            db_result = await self.db_service.store_workout_in_db(
                user_id=user_id,
                request_id=request_id,
                workout_data=self._parse_response(enhanced_response),
                rag_sources=[doc.get('source') for doc in rag_docs],
                safety_filtered=not filter_result.is_safe,
                disclaimers_added=self._extract_disclaimers(enhanced_response)
            )
            timeline.append({
                'step': 'Database Storage',
                'duration_ms': int((time.time() - start) * 1000),
                'status': 'complete'
            })
            
            # Return results
            return {
                'success': True,
                'request_id': request_id,
                'workout': self._parse_response(enhanced_response),
                'rag_documents_count': len(rag_docs),
                'content_filtered': not filter_result.is_safe,
                'disclaimers_added': self._extract_disclaimers(enhanced_response),
                'timeline': timeline,
                'generation_time_ms': sum(t['duration_ms'] for t in timeline),
                'tokens_used': {
                    'input': ai_response.get('usage', {}).get('input_tokens', 0),
                    'output': ai_response.get('usage', {}).get('output_tokens', 0)
                }
            }
        
        except Exception as e:
            logger.error(f"Workout generation failed: {str(e)}", extra={
                'user_id': user_id,
                'request_id': request_id,
                'timeline': timeline
            })
            raise
    
    def _extract_disclaimers(self, response: str) -> list:
        """Extract which disclaimers were added to response."""
        disclaimers = []
        if '⚠️' in response or 'MEDICAL DISCLAIMER' in response:
            disclaimers.append('medical')
        if '🏥' in response or 'CONDITION DISCLAIMER' in response:
            disclaimers.append('condition')
        if '👤' in response or 'AGE DISCLAIMER' in response:
            disclaimers.append('age')
        if '⚡' in response or 'HIGH INTENSITY DISCLAIMER' in response:
            disclaimers.append('intensity')
        return disclaimers
```

---

## 📝 Detailed Integration Steps

### Step 4: Configure Logging

```python
# backend/app/core/logging_config.py

import logging
from logging.handlers import RotatingFileHandler
import json
from datetime import datetime

# Create logger
safety_logger = logging.getLogger('safety')
safety_logger.setLevel(logging.INFO)

# File handler with rotation
handler = RotatingFileHandler(
    'logs/safety_violations.log',
    maxBytes=10_000_000,  # 10MB
    backupCount=5
)

# JSON formatter for CloudWatch
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'violations'):
            log_data['violations'] = record.violations
        
        return json.dumps(log_data)

handler.setFormatter(JSONFormatter())
safety_logger.addHandler(handler)

# Example usage in middleware
def log_safety_violation(level, violations, user_id, request_id):
    safety_logger.log(
        logging.WARNING if level == 'warning' else logging.CRITICAL,
        f"Safety violation detected: {', '.join(violations)}",
        extra={
            'user_id': user_id,
            'request_id': request_id,
            'violations': violations
        }
    )
```

### Step 5: Update Frontend to Display Safety Info

```jsx
// frontend/src/components/WorkoutGenerator.jsx

import React, { useState } from 'react';
import { SafetyWarningBanner } from './SafetyWarningBanner';
import { DisclaimerSection } from './DisclaimerSection';
import { EvidenceSection } from './EvidenceSection';

export function WorkoutGenerator() {
  const [workoutData, setWorkoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateWorkout = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/integration/workout/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        // Handle safety rejection
        const error_data = await response.json();
        if (response.status === 400 && error_data.error_type === 'safety_violation') {
          setError({
            type: 'safety_violation',
            message: error_data.message,
            violations: error_data.violations
          });
          return;
        }
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setWorkoutData(data);
      setError(null);
    } catch (err) {
      setError({
        type: 'error',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (error?.type === 'safety_violation') {
    return (
      <div className="error-container">
        <SafetyWarningBanner
          level="danger"
          violations={error.violations}
          message={error.message}
        />
        <p>Please modify your request and try again.</p>
        <a href="/health-resources">Learn about safe fitness guidelines</a>
      </div>
    );
  }

  if (workoutData) {
    return (
      <div className="results-container">
        {/* Show safety warnings if any */}
        {workoutData.safety_info.validation_level === 'warning' && (
          <SafetyWarningBanner
            level="warning"
            disclaimers={workoutData.safety_info.disclaimers_added}
            message="This plan includes special safety considerations"
          />
        )}

        {/* Show disclaimers prominently */}
        {workoutData.safety_info.disclaimers_added.length > 0 && (
          <DisclaimerSection
            disclaimers={workoutData.safety_info.disclaimers_added}
          />
        )}

        {/* Show the workout plan */}
        <div className="workout-plan">
          <h2>{workoutData.workout.name}</h2>
          <p>{workoutData.workout.description}</p>
          {/* ... rest of workout display ... */}
        </div>

        {/* Show evidence sources */}
        {workoutData.metadata.rag_documents_used > 0 && (
          <EvidenceSection
            documentsCount={workoutData.metadata.rag_documents_used}
            sources={['American Heart Association', 'American College of Sports Medicine']}
          />
        )}

        {/* Show healthcare provider callout */}
        <div className="callout">
          <h3>📞 Important</h3>
          <p>Always consult with a healthcare provider before starting a new fitness program,
             especially if you have any medical conditions.</p>
          <a href="https://www.healthcare.gov/find-care/" target="_blank">
            Find a healthcare provider near you
          </a>
        </div>
      </div>
    );
  }

  return <WorkoutForm onSubmit={handleGenerateWorkout} loading={loading} />;
}
```

### Step 6: Safety Warning Component

```jsx
// frontend/src/components/SafetyWarningBanner.jsx

import React from 'react';
import './SafetyWarningBanner.css';

export function SafetyWarningBanner({ level, violations, message }) {
  const icons = {
    danger: '🚫',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const colors = {
    danger: '#d32f2f',
    warning: '#f57c00',
    info: '#1976d2'
  };

  return (
    <div
      className="safety-banner"
      style={{
        backgroundColor: colors[level],
        borderLeftColor: colors[level],
        color: 'white',
        padding: '16px',
        borderRadius: '4px',
        marginBottom: '16px',
        borderLeft: '4px solid'
      }}
    >
      <h3>
        {icons[level]} Safety Notice
      </h3>
      {message && <p>{message}</p>}
      {violations && violations.length > 0 && (
        <ul>
          {violations.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
      {level === 'danger' && (
        <p style={{ marginTop: '12px', fontWeight: 'bold' }}>
          This request cannot be processed. Please review the above and try again.
        </p>
      )}
      {level === 'warning' && (
        <p style={{ marginTop: '12px', fontSize: '0.9em' }}>
          This plan can proceed but includes special considerations. 
          Review with your healthcare provider.
        </p>
      )}
    </div>
  );
}
```

### Step 7: Add Tests

```python
# backend/tests/test_safety_integration.py

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_token():
    """Get auth token for testing."""
    # Register and login
    response = client.post('/api/v1/auth/register', json={
        'email': 'test@example.com',
        'password': 'Test123!'
    })
    response = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'Test123!'
    })
    return response.json()['access_token']

class TestSafetyValidation:
    def test_dangerous_age_rejected(self, auth_token):
        """Test that requests with age < 13 are rejected."""
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'goal': 'fitness',
                'age': 5,
                'duration_weeks': 12
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert 'Age' in str(data['violations'])

    def test_extreme_calorie_rejected(self, auth_token):
        """Test that extreme calorie requests are rejected."""
        response = client.post(
            '/api/v1/integration/nutrition/generate',
            json={
                'goal': 'weight_loss',
                'daily_calories': 500,
                'duration_days': 30
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 400

    def test_medical_condition_warning(self, auth_token):
        """Test that medical conditions add disclaimers."""
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'goal': 'fitness',
                'age': 50,
                'medical_conditions': ['heart_disease'],
                'duration_weeks': 12,
                'frequency': 3,
                'intensity': 'intermediate'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['safety_info']['validation_level'] == 'warning'
        assert 'condition' in data['safety_info']['disclaimers_added']

    def test_safe_request_approved(self, auth_token):
        """Test that safe requests are approved."""
        response = client.post(
            '/api/v1/integration/workout/generate',
            json={
                'goal': 'muscle_gain',
                'age': 30,
                'duration_weeks': 12,
                'frequency': 4,
                'intensity': 'intermediate'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'workout' in data
        # Medical disclaimer is always included
        assert 'medical' in data['safety_info']['disclaimers_added']
```

---

## ✅ Integration Checklist

- [ ] **Step 1**: Add SafetyMiddleware to main.py
  - [ ] Import create_safety_middleware
  - [ ] Call app.add_middleware()
  - [ ] Verify middleware is registered

- [ ] **Step 2**: Update Integration Routes
  - [ ] Import safety modules in integration.py
  - [ ] Extract safety_validation from request.state
  - [ ] Add safety_info to response

- [ ] **Step 3**: Update Integration Service
  - [ ] Instantiate OutputFilter and RAGSafetyEnhancer
  - [ ] Add filtering step in process_*_generation methods
  - [ ] Add RAG validation
  - [ ] Add disclaimer application

- [ ] **Step 4**: Configure Logging
  - [ ] Set up rotating file handler
  - [ ] Create JSON formatter
  - [ ] Add safety_logger for violations

- [ ] **Step 5**: Update Frontend Components
  - [ ] Create SafetyWarningBanner component
  - [ ] Create DisclaimerSection component
  - [ ] Create EvidenceSection component
  - [ ] Update WorkoutGenerator/NutritionGenerator to display safety info

- [ ] **Step 6**: Add Tests
  - [ ] Add test_dangerous_age_rejected
  - [ ] Add test_extreme_calorie_rejected
  - [ ] Add test_medical_condition_warning
  - [ ] Add test_safe_request_approved
  - [ ] Add test_disclaimers_added
  - [ ] Add test_unsafe_content_filtered

- [ ] **Step 7**: Verify Integration
  - [ ] Test with curl/Postman
  - [ ] Test frontend integration
  - [ ] Check logs for violations
  - [ ] Verify disclaimers display
  - [ ] Test edge cases

---

## 🔍 Testing Integration

### Manual Testing with curl

```bash
# Test dangerous request (should be rejected)
curl -X POST http://localhost:8000/api/v1/integration/workout/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "muscle_gain",
    "age": 8,
    "duration_weeks": 100
  }'

# Expected: 400 Bad Request with safety violations

# Test warning request (should be approved with disclaimers)
curl -X POST http://localhost:8000/api/v1/integration/workout/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "fitness",
    "age": 75,
    "medical_conditions": ["arthritis"],
    "duration_weeks": 12,
    "frequency": 3,
    "intensity": "intermediate"
  }'

# Expected: 200 OK with safety_info.level = "warning" and disclaimers
```

### Running Test Suite

```bash
# Run all safety tests
pytest backend/tests/test_safety_integration.py -v

# Run specific test
pytest backend/tests/test_safety_integration.py::TestSafetyValidation::test_dangerous_age_rejected -v

# Run with coverage
pytest backend/tests/test_safety_integration.py --cov=app.core.safety --cov=app.middleware.safety_middleware
```

---

## 📊 Monitoring & Metrics

### CloudWatch Dashboard

Create a dashboard to monitor safety metrics:

```bash
aws cloudwatch put-metric-data \
  --namespace FitnessCoach/Safety \
  --metric-name RequestsValidated \
  --value 100

aws cloudwatch put-metric-data \
  --namespace FitnessCoach/Safety \
  --metric-name DangerousRequestsRejected \
  --value 2

aws cloudwatch put-metric-data \
  --namespace FitnessCoach/Safety \
  --metric-name WarningRequests \
  --value 8

aws cloudwatch put-metric-data \
  --namespace FitnessCoach/Safety \
  --metric-name UnsafeContentFiltered \
  --value 3
```

### Alerting

Set up CloudWatch alarms:

```bash
# Alert if rejection rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-high-rejection \
  --metric-name RejectionRate \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold

# Alert on unsafe content filtering
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-content-filtering \
  --metric-name UnsafeContentFiltered \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --period 3600
```

---

## 🎓 Best Practices

1. **Always log safety violations** - Use safety_logger for all violations
2. **Keep disclaimers prominent** - Show at top of response
3. **Be conservative** - When in doubt, flag as warning
4. **Test edge cases** - Boundary values for age, BMI, calories
5. **Monitor metrics** - Track rejection and filtering rates
6. **Escalate appropriately** - Alert on patterns of policy violations
7. **Update rules regularly** - Keep validation rules current with guidelines
8. **Document decisions** - Explain why certain rules exist in code comments

---

**Next Steps**: After integration, proceed to AWS deployment using `AWS_DEPLOYMENT_GUIDE.md`

