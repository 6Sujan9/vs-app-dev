# End-to-End Integration Quick Reference

**Complete working example of Frontend ↔ Backend ↔ Database ↔ AI System**

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Backend .env file
cp .env.example .env

# Fill in:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
BEDROCK_KNOWLEDGE_BASE_ID=your-kb-id
DOCUMENT_BUCKET_NAME=your-bucket
DATABASE_URL=postgresql://user:pass@localhost/fitness_coach
JWT_SECRET=your-secret-key
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend
python main.py
# → API ready at http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm start
# → App ready at http://localhost:3000

# Terminal 3: PostgreSQL (if using Docker)
docker-compose up -d
```

### 4. Test Integration
```bash
# Run test suite
python test_integration.py

# Output shows complete workflow
# ✓ Register User
# ✓ Login
# ✓ Update Profile
# ✓ Generate Workout (Complete Integration Test)
# ✓ Validate Response
# ✓ Error Handling
```

---

## 📊 System Overview

```
React Frontend
    ↓ Form submission with JWT
    ├─ POST /api/v1/integration/workout/generate
    ├─ Headers: Authorization: Bearer {token}
    └─ Body: { goal, duration_weeks, ... }

FastAPI Backend (IntegrationService)
    ├─ Step 1: Authenticate user (JWT validation)
    ├─ Step 2: Validate request parameters
    ├─ Step 3: Retrieve context from S3/Knowledge Base (RAG)
    ├─ Step 4: Call Bedrock Claude 3 for AI generation
    ├─ Step 5: Store result in PostgreSQL database
    └─ Step 6: Return response with metadata

Response to Frontend
    ├─ success: true
    ├─ request_id: "uuid-for-tracking"
    ├─ workout: { generated plan }
    └─ metadata:
       ├─ rag_documents: count
       ├─ tokens_used: number
       ├─ processing_time_ms: duration
       └─ status_timeline: step breakdown
```

---

## 📁 Key Files

### Backend Integration
- [app/services/integration.py](app/services/integration.py) - Main orchestration service
- [app/api/routes/integration.py](app/api/routes/integration.py) - API endpoints
- [app/services/rag_retrieval.py](app/services/rag_retrieval.py) - S3/KB retrieval
- [app/services/bedrock.py](app/services/bedrock.py) - Bedrock API calls

### Frontend Integration
- [frontend/src/components/IntegrationExample.jsx](frontend/src/components/IntegrationExample.jsx) - React component

### Documentation
- [END_TO_END_INTEGRATION.md](END_TO_END_INTEGRATION.md) - Comprehensive guide
- [INTEGRATION_EXAMPLES.txt](INTEGRATION_EXAMPLES.txt) - cURL examples
- [test_integration.py](test_integration.py) - Automated tests

---

## 🔧 API Endpoints

### Generate Workout
```
POST /api/v1/integration/workout/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "goal": "muscle_gain",
  "duration_weeks": 12,
  "frequency": 4,
  "equipment": ["dumbbell", "barbell"],
  "intensity": "high",
  "specific_requirements": "No leg exercises"
}

Response (200 OK):
{
  "success": true,
  "request_id": "uuid",
  "workout": { ... },
  "metadata": {
    "rag_documents": 3,
    "tokens_used": 1250,
    "processing_time_ms": 2847,
    "status_timeline": { ... }
  }
}
```

### Generate Nutrition
```
POST /api/v1/integration/nutrition/generate
Authorization: Bearer {token}
Content-Type: application/json

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

---

## 🛡️ Error Handling

| Status | Cause | Solution |
|--------|-------|----------|
| 401 | Invalid/missing token | Login again |
| 400 | Validation error | Check form fields |
| 500 | Backend error | Check logs |
| 504 | Request timeout | Retry or use async |

---

## 📊 Database Schema

```sql
-- Users table (for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  age INTEGER,
  weight FLOAT,
  height INTEGER,
  fitness_level VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workout plans (stores generated workouts)
CREATE TABLE workout_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR NOT NULL,
  goal VARCHAR,
  duration_weeks INTEGER,
  exercises JSONB,
  ai_model VARCHAR,
  tokens_used INTEGER,
  rag_sources JSONB,
  raw_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrition plans (stores generated meal plans)
CREATE TABLE nutrition_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR NOT NULL,
  goal VARCHAR,
  daily_calories INTEGER,
  meals JSONB,
  ai_model VARCHAR,
  tokens_used INTEGER,
  rag_sources JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_nutrition_plans_user_id ON nutrition_plans(user_id);
```

---

## 📝 Logging

All requests include a unique `request_id` for tracking:

```
2024-01-15 10:30:42.100 | INFO | [a1b2c3d4] | Request status: initiated
2024-01-15 10:30:42.125 | INFO | [a1b2c3d4] | Request status: validating
2024-01-15 10:30:42.150 | INFO | [a1b2c3d4] | Request status: retrieving_context
2024-01-15 10:30:45.150 | INFO | [a1b2c3d4] | Request status: calling_ai
2024-01-15 10:30:45.300 | INFO | [a1b2c3d4] | Request status: storing_result
2024-01-15 10:30:45.325 | INFO | [a1b2c3d4] | Request status: completed
```

Monitor logs:
```bash
tail -f backend/logs/app.log | grep "[request_id]"
```

---

## 🚀 Scaling

### For High Load
1. Use connection pooling (PgBouncer)
2. Add caching (Redis)
3. Implement queuing (Celery)
4. Load balance backend instances (nginx)
5. Read replicas for database

### For Cost Control
1. Set token budget per user
2. Cache RAG results
3. Rate limiting (10 req/min)
4. Monitor Bedrock API costs

### For Reliability
1. Circuit breaker pattern
2. Retry with exponential backoff
3. Health checks
4. Database backups
5. Error alerts

---

## 🔍 Monitoring

### Key Metrics
```
- Request count (per hour)
- Average response time (< 5s target)
- Error rate (< 1% target)
- Token usage (per user)
- Cache hit rate (> 50% target)
- Database connection pool (< 80% usage)
```

### Dashboards
Create dashboards in CloudWatch/Datadog showing:
- API latency over time
- Error rate trends
- Token usage breakdown
- Top endpoints
- Error types

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Must be 3.9+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check database connection
python -c "from app.database import engine; engine.connect()"
```

### Frontend shows "API Error"
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS settings
# Verify ALLOWED_ORIGINS in .env

# Check token is valid
# Clear browser localStorage
```

### Bedrock errors
```bash
# Verify AWS credentials
aws s3 ls

# Check Knowledge Base ID
aws bedrock-agent list-knowledge-bases

# Check model availability
aws bedrock list-foundation-models
```

### Database errors
```bash
# Check PostgreSQL is running
psql -U postgres -d fitness_coach -c "SELECT 1"

# Check migrations
python -c "from app.database import Base; Base.metadata.create_all()"

# Check connection string
# Verify DATABASE_URL in .env
```

---

## 📚 Complete Examples

### Python/Requests
```python
import requests

TOKEN = "your-jwt-token"
BASE_URL = "http://localhost:8000/api/v1"

# Generate workout
response = requests.post(
    f"{BASE_URL}/integration/workout/generate",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={
        "goal": "muscle_gain",
        "duration_weeks": 12,
        "frequency": 4,
        "equipment": ["dumbbell", "barbell"],
        "intensity": "high"
    }
)

data = response.json()
print(f"Request ID: {data['request_id']}")
print(f"Workout: {data['workout']['name']}")
print(f"Time: {data['metadata']['processing_time_ms']}ms")
```

### JavaScript/Fetch
```javascript
const token = localStorage.getItem('access_token');

const response = await fetch(
  'http://localhost:8000/api/v1/integration/workout/generate',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goal: 'muscle_gain',
      duration_weeks: 12,
      frequency: 4,
      equipment: ['dumbbell', 'barbell'],
      intensity: 'high'
    })
  }
);

const data = await response.json();
console.log(`Workout: ${data.workout.name}`);
console.log(`Time: ${data.metadata.processing_time_ms}ms`);
```

### cURL
```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:8000/api/v1/integration/workout/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "muscle_gain",
    "duration_weeks": 12,
    "frequency": 4,
    "equipment": ["dumbbell", "barbell"],
    "intensity": "high"
  }'
```

---

## 📞 Support

For issues, check:
1. [END_TO_END_INTEGRATION.md](END_TO_END_INTEGRATION.md) - Full architecture
2. [INTEGRATION_EXAMPLES.txt](INTEGRATION_EXAMPLES.txt) - Request/response examples
3. Backend logs - Check [request_id] for specific request
4. AWS console - Verify Bedrock, S3, IAM setup
5. Database logs - Check PostgreSQL logs

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] AWS credentials configured
- [ ] Database migrations run
- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Can register user
- [ ] Can login and get token
- [ ] Can generate workout (full integration test)
- [ ] Response includes all required fields
- [ ] Error handling works (try invalid inputs)
- [ ] Logging includes request_id
- [ ] Performance acceptable (< 5s per request)
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] CORS configured for production domain
- [ ] JWT secret set securely
- [ ] Rate limiting enabled
- [ ] Load balancer configured
- [ ] SSL/TLS certificates installed

---

## 🎯 Next Steps

1. **Run integration tests**: `python test_integration.py`
2. **Test in browser**: Go to http://localhost:3000
3. **Generate a workout**: Fill form and submit
4. **Check logs**: Verify all steps completed
5. **Monitor metrics**: Track response time and token usage
6. **Deploy**: Follow deployment checklist above

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Production Ready ✓
