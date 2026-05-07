# FastAPI Backend Setup Guide

## Overview

This is a complete FastAPI backend for the AI Fitness and Nutrition Coach application. It includes:

- ✅ User authentication with JWT tokens
- ✅ User profile management
- ✅ AI workout plan generation (Bedrock integration)
- ✅ AI meal plan generation (Bedrock integration)
- ✅ Chat interface with AI coach
- ✅ Progress tracking
- ✅ Input validation with Pydantic
- ✅ Database integration with SQLAlchemy
- ✅ CORS support for frontend
- ✅ Comprehensive API documentation

## Folder Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/              # API endpoints
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── user.py          # User management
│   │       ├── workout.py       # Workout endpoints
│   │       ├── nutrition.py     # Nutrition endpoints
│   │       ├── chat.py          # Chat endpoints
│   │       └── progress.py      # Progress tracking
│   ├── core/
│   │   ├── config.py            # Configuration settings
│   │   └── security.py          # JWT and password utilities
│   ├── models/
│   │   └── __init__.py          # SQLAlchemy models
│   │       ├── User
│   │       ├── WorkoutPlan
│   │       ├── NutritionPlan
│   │       ├── ChatMessage
│   │       └── ProgressLog
│   ├── schemas/
│   │   └── __init__.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── auth.py              # Authentication logic
│   │   ├── user.py              # User management logic
│   │   ├── bedrock.py           # AI generation (Bedrock + RAG)
│   │   ├── workout.py           # Workout logic
│   │   ├── nutrition.py         # Nutrition logic
│   │   └── progress.py          # Progress tracking logic
│   ├── database.py              # Database connection
│   └── main.py                  # FastAPI app initialization
├── tests/
│   └── test_auth.py             # Authentication tests
├── main.py                      # Entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables example
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Local development setup
├── API_EXAMPLES.py              # Request/response examples
└── BACKEND_SETUP.md            # This file
```

## Installation & Setup

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Docker & Docker Compose (optional)

### 2. Create Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
```

**Key environment variables:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_coach
SECRET_KEY=your-secret-key-minimum-32-characters
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
BEDROCK_KNOWLEDGE_BASE_ID=your-kb-id
```

### 5. Database Setup

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
# Wait for PostgreSQL to start (check logs)
# Tables created automatically on app startup
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb -U postgres fitness_coach

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fitness_coach
```

### 6. Run the Application

```bash
# Development mode
python main.py

# Or with Uvicorn directly
uvicorn app.main:app --reload --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

### Auto-Generated Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Health Checks
```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/
```

## Authentication Flow

All endpoints (except auth endpoints) require JWT tokens.

### 1. Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "SecurePassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'

# Response:
# {
#   "access_token": "eyJhbGc...",
#   "refresh_token": "eyJhbGc...",
#   "token_type": "bearer",
#   "expires_in": 300
# }
```

### 3. Use Token in Requests
```bash
curl -X GET http://localhost:8000/api/v1/users/profile \
  -H "Authorization: Bearer eyJhbGc..."
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/verify` - Verify token

### User Profile
- `POST /api/v1/users/profile` - Create/update profile
- `GET /api/v1/users/profile` - Get profile
- `GET /api/v1/users/metrics` - Get user metrics

### Workouts
- `POST /api/v1/workouts/generate` - Generate AI workout plan
- `GET /api/v1/workouts/` - List user workouts
- `GET /api/v1/workouts/{id}` - Get specific workout
- `DELETE /api/v1/workouts/{id}` - Delete workout

### Nutrition
- `POST /api/v1/nutrition/generate` - Generate AI meal plan
- `GET /api/v1/nutrition/` - List user meal plans
- `GET /api/v1/nutrition/{id}` - Get specific plan
- `DELETE /api/v1/nutrition/{id}` - Delete plan

### Chat
- `POST /api/v1/chat/send` - Send message to AI coach
- `GET /api/v1/chat/history` - Get chat history
- `POST /api/v1/chat/clear` - Clear chat history

### Progress
- `POST /api/v1/progress/log` - Log progress
- `GET /api/v1/progress/` - Get progress logs
- `GET /api/v1/progress/analytics` - Get analytics
- `DELETE /api/v1/progress/{id}` - Delete log

## Database Models

### User
```python
- id: Integer (Primary Key)
- email: String (Unique)
- username: String (Unique)
- hashed_password: String
- first_name: String
- last_name: String
- age: Integer
- weight: Float (kg)
- height: Float (cm)
- gender: String
- fitness_level: String
- goals: JSON (List)
- dietary_restrictions: JSON (List)
- medical_conditions: JSON (List)
- is_active: Boolean
- created_at: DateTime
- updated_at: DateTime
```

### WorkoutPlan
```python
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- name: String
- goal: String
- duration_weeks: Integer
- frequency: Integer
- equipment: JSON (List)
- intensity: String
- exercises: JSON (List)
- bedrock_response: Text
- rag_documents_used: JSON
- tokens_used: Integer
- created_at: DateTime
- updated_at: DateTime
```

### NutritionPlan
```python
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- name: String
- goal: String
- duration_days: Integer
- meals_per_day: Integer
- daily_calories: Integer
- diet_type: String
- protein_grams: Float
- carbs_grams: Float
- fats_grams: Float
- meals: JSON (List)
- bedrock_response: Text
- rag_documents_used: JSON
- tokens_used: Integer
- created_at: DateTime
- updated_at: DateTime
```

### ChatMessage
```python
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- user_message: Text
- ai_response: Text
- rag_context_used: JSON (List)
- bedrock_model: String
- tokens_used: Integer
- created_at: DateTime
```

### ProgressLog
```python
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- weight: Float (kg)
- body_fat_percentage: Float
- muscle_mass: Float
- chest: Float (cm)
- waist: Float (cm)
- hips: Float (cm)
- thighs: Float (cm)
- arms: Float (cm)
- exercises_completed: Integer
- meals_logged: Integer
- notes: Text
- created_at: DateTime
```

## AWS Bedrock Integration

### Configuration

The backend uses AWS Bedrock for AI generation with RAG (Retrieval-Augmented Generation).

**Required AWS Setup:**
1. AWS Account with Bedrock access
2. Claude 3 model enabled
3. Knowledge Base created in Bedrock
4. IAM credentials configured

**Environment variables:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_KNOWLEDGE_BASE_ID=your-kb-id
```

### Features

- **Workout Generation**: Creates personalized plans based on user profile and RAG documents
- **Meal Planning**: Generates nutrition plans considering dietary preferences
- **Chat Interface**: Real-time AI coaching with context from knowledge base
- **RAG Retrieval**: Automatically retrieves relevant documents for context

## Testing

### Run Tests
```bash
pytest tests/

# With coverage
pytest tests/ --cov=app
```

### Test File
- `tests/test_auth.py` - Authentication tests

## Development Commands

### Database Migrations (Alembic)
```bash
# Initialize migrations (one time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend alembic upgrade head
```

## Deployment

### Docker Build
```bash
# Build image
docker build -t fitness-coach-api:latest .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  fitness-coach-api:latest
```

### Production Considerations
1. Use strong SECRET_KEY (min 32 characters)
2. Enable HTTPS/TLS
3. Set DEBUG=False
4. Configure ALLOWED_ORIGINS for CORS
5. Use environment variables for secrets
6. Setup database backups
7. Configure logging
8. Monitor API health

## Troubleshooting

### Database Connection Error
```
Error: could not connect to server
Solution: Check DATABASE_URL and PostgreSQL running
```

### AWS Bedrock Error
```
Error: Unable to call bedrock
Solution: Verify AWS credentials and Bedrock access enabled
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS
Solution: Add frontend URL to ALLOWED_ORIGINS in .env
```

### Token Expiration
```
Error: Invalid token
Solution: Use refresh_token endpoint to get new access_token
```

## Performance Optimization

- Database connection pooling enabled
- JWT tokens with short expiry
- Async request handling
- Request/response compression via middleware
- Input validation to prevent invalid data

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ CORS protection
- ✅ Input validation with Pydantic
- ✅ SQL injection prevention (SQLAlchemy)
- ✅ Rate limiting ready
- ✅ HTTPS support

## Monitoring & Logging

Configure in `.env`:
```
LOG_LEVEL=INFO
```

Logs include:
- Authentication events
- API errors
- Database queries (when DEBUG=True)
- Bedrock API calls

## API Rate Limiting

Configure in middleware (not yet implemented):
- 1000 requests per hour per IP
- 100 requests per minute for auth endpoints

## Next Steps

1. ✅ Backend setup complete
2. ⏳ Connect frontend to backend
3. ⏳ Configure AWS Bedrock
4. ⏳ Setup database backups
5. ⏳ Configure monitoring
6. ⏳ Deploy to production

## Support

For issues or questions:
1. Check logs: `docker-compose logs backend`
2. Review BACKEND_SETUP.md
3. Check API docs: http://localhost:8000/docs
4. Review source code comments

---

**Backend Status**: ✅ Ready for frontend integration
**Last Updated**: April 25, 2024
