# 🚀 AI Fitness Coach - Quick Start Guide

Get the complete system running in 5 minutes!

---

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database
- AWS Account with Bedrock enabled
- Git

---

## ⚡ 5-Minute Setup

### Step 1: Clone & Setup Backend (2 minutes)

```bash
cd fitness-nutrition-coach/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://localhost/fitness_db
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET=fitness-documents
KB_ID=your_knowledge_base_id
JWT_SECRET=your_secret_key_here
EOF

# Run migrations
alembic upgrade head

# Start server
python -m uvicorn app.main:app --reload
```

**✓ Backend running at http://localhost:8000**

---

### Step 2: Setup Frontend (2 minutes)

```bash
cd fitness-nutrition-coach/frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# Start development server
npm start
```

**✓ Frontend running at http://localhost:3000**

---

### Step 3: Test the Integration (1 minute)

```bash
# In a new terminal
cd fitness-nutrition-coach/testing

# Run the integration test suite
bash integration_test_suite.sh
```

**✓ All systems operational!**

---

## 🎯 First Steps

### 1. **Create Your Account**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "username": "yourname",
    "password": "SecurePassword123!"
  }'
```

### 2. **Login & Get Token**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePassword123!"
  }'

# Save the access_token from response
export TOKEN="your_token_here"
```

### 3. **Create Your Profile**
```bash
curl -X POST http://localhost:8000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "weight": 180,
    "height": 510,
    "gender": "male",
    "fitness_level": "intermediate",
    "primary_goal": "muscle_gain",
    "equipment_available": ["dumbbells", "barbell"]
  }'
```

### 4. **Generate Your First Workout**
```bash
curl -X POST http://localhost:8000/api/v1/ai/workout/generate \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain" \
  --data-urlencode "duration_weeks=12" \
  --data-urlencode "frequency=4" \
  --data-urlencode "intensity=high" \
  | jq '.'
```

**✓ Personalized workout generated in ~2 seconds!**

---

## 📚 What You Can Do

### Workout Generation
```bash
curl http://localhost:8000/api/v1/ai/workout/generate \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain|weight_loss|endurance"
```

**Returns**: Detailed 12-week workout plan with exercises, sets, reps, rest periods

### Nutrition Planning
```bash
curl http://localhost:8000/api/v1/ai/nutrition/generate \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "goal=muscle_gain" \
  --data-urlencode "diet_type=high_protein"
```

**Returns**: 30-day meal plan with macros and daily calories

### AI Coaching Chat
```bash
curl http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -G \
  --data-urlencode "message=How can I improve my bench press?"
```

**Returns**: Personalized coaching advice with citations

### Dashboard & Insights
```bash
curl http://localhost:8000/api/v1/ai/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.insights'
```

**Returns**: Personalized insights and recommendations

---

## 🔍 View API Documentation

The system includes interactive Swagger documentation:

```bash
# Open in browser
http://localhost:8000/docs
```

Or view ReDoc:
```bash
http://localhost:8000/redoc
```

---

## 📊 Understanding the Response

Every response includes:

```json
{
  "success": true,
  "request_id": "abc12345",           ← For tracking
  "data": {...},                       ← Generated content
  "rag_context": {
    "documents_retrieved": 3,          ← RAG performance
    "citations": [...]                 ← Document sources
  },
  "metrics": {
    "processing_time_seconds": 2.45,   ← Performance
    "tokens_used": 1542,               ← Cost tracking
    "cost_estimate": "$0.0154"         ← Actual cost
  }
}
```

---

## 🔗 System Architecture

```
Your Browser
    ↓
React App (Frontend)
    ↓
FastAPI Server (Backend)
    ├─→ Validate request
    ├─→ Fetch user profile (Database)
    ├─→ Retrieve documents (S3 + RAG)
    ├─→ Call Claude AI (Bedrock)
    ├─→ Store results (Database)
    └─→ Return response
    ↓
Display Results with Metrics
```

---

## 📁 Project Structure

```
fitness-nutrition-coach/
├── backend/
│   └── app/
│       ├── routes/integration_endpoints.py     ← Main endpoints
│       ├── services/bedrock_enhanced.py        ← AI service
│       ├── services/rag_retrieval.py           ← Document retrieval
│       ├── crud/queries.py                     ← Database queries
│       └── models/models.py                    ← Data models
│
├── frontend/
│   └── src/
│       ├── services/api.ts                     ← API client
│       └── components/AICoachIntegration.tsx   ← Main component
│
├── documentation/
│   └── END_TO_END_INTEGRATION.md               ← Deep dive guide
│
├── testing/
│   └── integration_test_suite.sh               ← Automated tests
│
├── INTEGRATION_SUMMARY.md                      ← Overview
└── QUICK_START.md                              ← This file
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Check dependencies
pip list | grep fastapi

# Check database connection
psql -U postgres -c "SELECT 1;"
```

### Frontend shows blank page
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm start

# Check console for errors (F12)
# Check API_URL in .env matches backend
```

### API returns 401 Unauthorized
```bash
# Token may have expired, login again
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'

# Copy new token and use in requests
export TOKEN="new_token"
```

### AI generation is slow
```bash
# Check if Bedrock is responding
curl -X GET http://localhost:8000/health

# Check database performance
# Add indexes to frequently queried tables

# Consider enabling caching for RAG results
```

---

## 🎓 Learning Path

1. **Start Here**: This quick start guide
2. **Understand Flow**: Read `END_TO_END_INTEGRATION.md`
3. **Review Code**: Check `integration_endpoints.py`
4. **Run Tests**: Execute `integration_test_suite.sh`
5. **Experiment**: Use Swagger UI to test endpoints
6. **Deploy**: Use provided Docker setup

---

## ⚙️ Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/fitness_db

# AWS
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET=fitness-documents
KB_ID=bedrock_knowledge_base_id

# Security
JWT_SECRET=your_super_secret_key_min_32_chars

# Server
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

### Frontend Environment Variables
```bash
# API
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000

# Optional
REACT_APP_LOG_LEVEL=info
```

---

## 🚀 Common Commands

### Backend
```bash
# Start server with auto-reload
python -m uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Run tests
pytest

# Run specific test
pytest tests/test_api.py::test_workout_generation
```

### Frontend
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Testing
```bash
# Run all integration tests
bash testing/integration_test_suite.sh

# Run specific test
bash testing/integration_test_suite.sh workout

# Run performance tests
bash testing/integration_test_suite.sh performance
```

---

## 📈 Performance Expectations

| Operation | Time | Cost |
|-----------|------|------|
| **Workout Generation** | ~2.3s | $0.015 |
| **Nutrition Plan** | ~2.1s | $0.012 |
| **Chat Response** | ~1.8s | $0.008 |
| **Dashboard Load** | ~0.8s | Free |

All times include:
- Network latency
- RAG document retrieval
- Claude AI processing
- Database operations

---

## 🔐 Security Best Practices

1. **Use strong JWT_SECRET** (min 32 characters)
2. **Never commit .env file** (add to .gitignore)
3. **Use HTTPS in production** (configure SSL)
4. **Enable CORS properly** (specific origins only)
5. **Validate all inputs** (already implemented)
6. **Use environment variables** for secrets
7. **Enable database SSL** in production
8. **Set up rate limiting** (already configured)

---

## 📞 Getting Help

1. **Check logs**:
   ```bash
   # Backend logs
   tail -f logs/app.log
   
   # Browser console (F12)
   # Frontend errors shown with full stack trace
   ```

2. **View API docs**:
   ```bash
   http://localhost:8000/docs  # Swagger UI
   http://localhost:8000/redoc # ReDoc
   ```

3. **Read documentation**:
   - `INTEGRATION_SUMMARY.md` - Overview
   - `END_TO_END_INTEGRATION.md` - Complete guide
   - Code comments - Implementation details

---

## 🎉 You're All Set!

You now have a complete, production-ready AI Fitness Coach system with:

✅ **Frontend** - React TypeScript UI  
✅ **Backend** - FastAPI with all endpoints  
✅ **RAG** - Document retrieval from S3  
✅ **AI** - Claude 3 Sonnet via Bedrock  
✅ **Database** - PostgreSQL with 10 tables  
✅ **Monitoring** - Metrics and logging  
✅ **Testing** - Full integration test suite  
✅ **Documentation** - Complete guides  

### Next Steps:
1. Explore the dashboard at `http://localhost:3000`
2. Generate your first workout plan
3. Check the metrics and citations
4. Run the full test suite
5. Review the code and architecture
6. Deploy to production!

---

## 📚 Further Reading

- [END_TO_END_INTEGRATION.md](./documentation/END_TO_END_INTEGRATION.md) - Detailed architecture guide
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - Complete feature overview
- Code comments in `integration_endpoints.py` - Implementation details
- Swagger UI at `http://localhost:8000/docs` - Interactive API docs

---

**Happy coding! 🏋️‍♂️**
