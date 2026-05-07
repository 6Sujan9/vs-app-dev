# AI-Based Fitness and Nutrition Coach - System Architecture

## 1. HIGH-LEVEL SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                             │
│  (React/HTML-CSS-JS) - User Interface & Interaction             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER (FastAPI)                     │
│  - Request Validation                                            │
│  - Business Logic                                                │
│  - User Management                                               │
│  - RAG Orchestration                                             │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                  │
             ▼                                  ▼
┌──────────────────────────┐     ┌───────────────────────────────┐
│   DATABASE LAYER         │     │   AWS INTEGRATION LAYER       │
│  - PostgreSQL/MongoDB    │     │  - Amazon Bedrock (LLM)       │
│  - User Profiles         │     │  - Bedrock Knowledge Base     │
│  - Workout Plans         │     │  - Amazon S3 (Documents)      │
│  - Nutrition Plans       │     │  - AWS IAM (Security)         │
│  - Progress Tracking     │     └───────────────────────────────┘
│  - Chat History          │
└──────────────────────────┘
```

## 2. COMPONENT ARCHITECTURE

### Frontend (React SPA)
- **Components:**
  - User Profile Setup
  - Workout Plan Generator
  - Diet Plan Generator
  - AI Chat Assistant
  - Progress Dashboard
  - Analytics & Tracking

- **Services:**
  - API Client (Axios/Fetch)
  - Authentication Service
  - State Management (Redux/Context API)

### Backend API (FastAPI)
- **Core Services:**
  - `AuthService`: JWT-based authentication
  - `UserService`: Profile management
  - `RAGService`: Document retrieval from KB
  - `BedrockService`: LLM integration
  - `WorkoutService`: Workout generation logic
  - `NutritionService`: Diet plan generation logic
  - `ProgressService`: Tracking & analytics

- **Database Layer:**
  - ORM: SQLAlchemy (for SQL) or MongoEngine (for MongoDB)
  - Models: User, WorkoutPlan, NutritionPlan, ChatHistory, Progress

- **Security:**
  - JWT Token Management
  - Input Validation & Sanitization
  - Rate Limiting
  - AWS IAM Integration

### AWS Services Integration

#### Amazon Bedrock
- **Model Used:** Claude 3 (or latest available)
- **Invocation:** Synchronous API calls with context
- **Parameters:** Temperature, Max tokens, Stop sequences

#### Bedrock Knowledge Base
- **Purpose:** RAG with enterprise documents
- **Integration:** Vector search + metadata filtering
- **Document Types:** 
  - Fitness science papers
  - Nutrition guidelines (USDA, FDA)
  - Workout protocols
  - Diet templates

#### Amazon S3
- **Buckets:**
  - `kb-documents/`: Knowledge base documents
  - `user-data/`: User profile exports
  - `reports/`: Generated PDF reports

#### AWS Identity & Access Management
- **Roles:**
  - `BedrockAccessRole`: For API access
  - `LambdaExecutionRole`: If using Lambda
  - `S3AccessRole`: For document retrieval

## 3. DATA FLOW ARCHITECTURE

### Workflow: User Request → AI Response

```
1. USER INPUT (Frontend)
   └─ "Create a workout plan for weight loss"
      ├─ User Profile Data
      └─ Current Goals

2. VALIDATION (Backend)
   └─ Input validation
   └─ User authentication
   └─ Rate limit check

3. RAG RETRIEVAL (Backend)
   └─ Query to Bedrock Knowledge Base
   └─ Search relevant documents (vector + keyword)
   └─ Filter by relevance score (threshold: 0.7)

4. CONTEXT BUILDING (Backend)
   └─ Combine:
      ├─ User Profile
      ├─ Retrieved Documents
      ├─ User History
      └─ Health Metrics

5. BEDROCK INVOCATION (AWS)
   └─ System Prompt: Role definition + constraints
   └─ User Context: Personalized information
   └─ Retrieved Context: RAG documents
   └─ User Query: Actual request
   └─ Temperature: 0.7 (creative but reliable)

6. RESPONSE GENERATION
   └─ LLM processes context
   └─ Generates structured response
   └─ Returns to backend

7. RESPONSE PROCESSING (Backend)
   └─ Parse response structure
   └─ Validate content
   └─ Store in database:
      ├─ User History
      ├─ Generated Plan
      └─ Metadata (retrieved docs, timestamp)

8. RESPONSE RETURN (Frontend)
   └─ Display to user
   └─ Store in local state
   └─ Enable user actions (save, download, etc.)
```

## 4. DATABASE SCHEMA

### Users Table
```sql
- id (UUID, PK)
- email (String, Unique)
- password_hash (String)
- first_name (String)
- last_name (String)
- age (Integer)
- weight (Float) - in kg
- height (Float) - in cm
- gender (String)
- fitness_level (Enum: beginner, intermediate, advanced)
- goals (JSON: ["weight_loss", "muscle_gain", "endurance"])
- dietary_restrictions (JSON: [])
- medical_conditions (JSON: [])
- created_at (DateTime)
- updated_at (DateTime)
```

### Workout Plans Table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- plan_name (String)
- description (Text)
- duration_weeks (Integer)
- exercises (JSON: [{name, reps, sets, duration}])
- difficulty_level (String)
- rag_documents_used (JSON: [doc_ids])
- bedrock_tokens_used (Integer)
- created_at (DateTime)
- updated_at (DateTime)
```

### Nutrition Plans Table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- plan_name (String)
- description (Text)
- daily_calories (Integer)
- macros (JSON: {proteins, carbs, fats})
- meals (JSON: [{meal_type, foods, calories}])
- restrictions (JSON: [])
- rag_documents_used (JSON: [doc_ids])
- bedrock_tokens_used (Integer)
- created_at (DateTime)
```

### Chat History Table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- session_id (UUID)
- user_message (Text)
- ai_response (Text)
- rag_context_used (JSON)
- model_version (String)
- tokens_used (Integer)
- created_at (DateTime)
```

### Progress Tracking Table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- date (Date)
- weight (Float)
- exercises_completed (Integer)
- meals_logged (Integer)
- notes (Text)
- metrics (JSON: {body_fat, muscle_mass, endurance})
- created_at (DateTime)
```

## 5. SECURITY ARCHITECTURE

- **Authentication:** JWT tokens with 1-hour expiry + refresh tokens
- **Authorization:** Role-based access control (RBAC)
- **Data Encryption:** TLS 1.3 in transit, AES-256 at rest
- **AWS Security:**
  - IAM roles with least privilege
  - VPC endpoints for private AWS service access
  - CloudTrail logging for audit
- **Input Validation:** Pydantic models with strict validation
- **Rate Limiting:** 100 requests/hour per user
- **CORS:** Restricted to frontend domain only

## 6. SCALABILITY CONSIDERATIONS

- **Backend:** Horizontal scaling with load balancer
- **Database:** Connection pooling, read replicas
- **AWS:** Auto-scaling groups for compute
- **Caching:** Redis for frequent queries (user profiles, RAG results)
- **Queue:** Celery/RabbitMQ for async tasks (PDF generation, batch processing)

## 7. MONITORING & LOGGING

- **Application Logs:** Structured logging (Python logging, JSON format)
- **Metrics:** Prometheus metrics (API latency, Bedrock token usage)
- **Monitoring:** CloudWatch dashboards for AWS service health
- **Tracing:** X-Ray for distributed tracing
- **Alerts:** SNS notifications for critical errors

## 8. DEVELOPMENT WORKFLOW

1. **Local Development:**
   - Mock AWS services with LocalStack
   - Docker containers for PostgreSQL/MongoDB
   - .env files for configuration

2. **Testing:**
   - Unit tests with pytest
   - Integration tests with test database
   - Mock Bedrock responses

3. **CI/CD:**
   - GitHub Actions for automated testing
   - Docker image builds
   - Deployment to AWS (CloudFormation/Terraform)

4. **Deployment Stages:**
   - Development (dev)
   - Staging (staging)
   - Production (prod)
