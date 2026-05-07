# Fitness & Nutrition Coach - Project Folder Structure

```
fitness-nutrition-coach/
│
├── ARCHITECTURE.md                          # System design and architecture documentation
├── README.md                                # Project overview and setup guide
├── .env.example                             # Example environment variables
├── .gitignore                               # Git ignore file
│
├── backend/                                 # FastAPI Backend Application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                         # FastAPI app factory
│   │   ├── dependencies.py                 # Dependency injection
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/                         # API v1 routes
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                 # Authentication endpoints
│   │   │   │   ├── users.py                # User profile endpoints
│   │   │   │   ├── workouts.py             # Workout generation endpoints
│   │   │   │   ├── nutrition.py            # Nutrition plan endpoints
│   │   │   │   ├── chat.py                 # AI chat endpoints
│   │   │   │   └── progress.py             # Progress tracking endpoints
│   │   │   └── v2/                         # Future API versions
│   │   │
│   │   ├── services/                       # Business Logic Layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py             # JWT, login, registration
│   │   │   ├── user_service.py             # User profile management
│   │   │   ├── bedrock_service.py          # Bedrock LLM integration
│   │   │   ├── rag_service.py              # Knowledge base retrieval
│   │   │   ├── workout_service.py          # Workout plan generation
│   │   │   ├── nutrition_service.py        # Diet plan generation
│   │   │   ├── progress_service.py         # Progress tracking
│   │   │   ├── chat_service.py             # Chat history & management
│   │   │   └── aws_service.py              # AWS service abstraction
│   │   │
│   │   ├── models/                         # SQLAlchemy/ODM Models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                     # User model
│   │   │   ├── workout_plan.py             # Workout plan model
│   │   │   ├── nutrition_plan.py           # Nutrition plan model
│   │   │   ├── chat_history.py             # Chat messages model
│   │   │   └── progress.py                 # Progress tracking model
│   │   │
│   │   ├── schemas/                        # Pydantic Request/Response Schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                     # Login, register schemas
│   │   │   ├── user.py                     # User profile schemas
│   │   │   ├── workout.py                  # Workout request/response
│   │   │   ├── nutrition.py                # Nutrition request/response
│   │   │   ├── chat.py                     # Chat message schemas
│   │   │   └── progress.py                 # Progress tracking schemas
│   │   │
│   │   ├── core/                           # Core Configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py                   # Settings management
│   │   │   ├── security.py                 # JWT, password hashing
│   │   │   ├── database.py                 # DB connection setup
│   │   │   └── constants.py                # App constants
│   │   │
│   │   └── utils/                          # Utility Functions
│   │       ├── __init__.py
│   │       ├── logger.py                   # Structured logging
│   │       ├── validators.py               # Input validation helpers
│   │       ├── formatters.py               # Response formatting
│   │       └── exceptions.py               # Custom exceptions
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                     # Pytest configuration
│   │   ├── test_auth.py                    # Auth tests
│   │   ├── test_bedrock.py                 # Bedrock integration tests
│   │   ├── test_rag.py                     # RAG service tests
│   │   └── test_services.py                # Service tests
│   │
│   ├── requirements.txt                    # Python dependencies
│   ├── .env.example                        # Example env variables
│   ├── Dockerfile                          # Docker image for backend
│   └── docker-compose.yml                  # Local development services
│
├── frontend/                                # React Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── index.js
│   │   ├── App.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── UserProfile/
│   │   │   │   ├── ProfileSetup.jsx
│   │   │   │   └── ProfileUpdate.jsx
│   │   │   ├── WorkoutPlan/
│   │   │   │   ├── WorkoutGenerator.jsx
│   │   │   │   ├── WorkoutDisplay.jsx
│   │   │   │   └── WorkoutHistory.jsx
│   │   │   ├── NutritionPlan/
│   │   │   │   ├── NutritionGenerator.jsx
│   │   │   │   ├── MealPlan.jsx
│   │   │   │   └── FoodDatabase.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   └── ChatHistory.jsx
│   │   │   ├── Progress/
│   │   │   │   ├── ProgressDashboard.jsx
│   │   │   │   ├── ProgressChart.jsx
│   │   │   │   └── ProgressLogger.jsx
│   │   │   ├── Layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── Common/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                      # Axios API client
│   │   │   ├── authService.js              # Auth logic
│   │   │   ├── userService.js              # User API calls
│   │   │   ├── workoutService.js           # Workout API calls
│   │   │   ├── nutritionService.js         # Nutrition API calls
│   │   │   ├── chatService.js              # Chat API calls
│   │   │   └── progressService.js          # Progress API calls
│   │   │
│   │   ├── store/                          # Redux/Context state management
│   │   │   ├── store.js                    # Redux store config
│   │   │   ├── authSlice.js                # Auth reducer
│   │   │   ├── userSlice.js                # User reducer
│   │   │   └── workoutSlice.js             # Workout reducer
│   │   │
│   │   ├── styles/
│   │   │   ├── index.css                   # Global styles
│   │   │   ├── variables.css               # CSS variables
│   │   │   └── components.css              # Component styles
│   │   │
│   │   └── utils/
│   │       ├── localStorage.js             # Local storage helper
│   │       └── validators.js               # Frontend validation
│   │
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── .dockerignore
│
├── aws-infrastructure/                      # AWS Infrastructure as Code
│   ├── terraform/
│   │   ├── main.tf                         # Main terraform config
│   │   ├── variables.tf                    # Variables
│   │   ├── outputs.tf                      # Outputs
│   │   ├── bedrock.tf                      # Bedrock setup
│   │   ├── s3.tf                           # S3 buckets
│   │   ├── rds.tf                          # RDS database
│   │   ├── iam.tf                          # IAM roles/policies
│   │   ├── lambda.tf                       # Lambda functions (optional)
│   │   └── vpc.tf                          # VPC configuration
│   │
│   ├── cloudformation/
│   │   └── template.yaml                   # CloudFormation template (alternative to Terraform)
│   │
│   ├── scripts/
│   │   ├── setup-kb.py                     # Setup Bedrock Knowledge Base
│   │   ├── upload-documents.py             # Upload docs to S3
│   │   └── create-iam-roles.sh             # IAM role creation
│   │
│   └── README.md                           # AWS setup documentation
│
├── knowledge-base/                          # Knowledge Base Documents
│   ├── fitness/
│   │   ├── exercises.md                    # Exercise database
│   │   ├── workout-protocols.md            # Training programs
│   │   └── fitness-science.md              # Scientific research
│   ├── nutrition/
│   │   ├── dietary-guidelines.md           # USDA guidelines
│   │   ├── macro-nutrition.md              # Macronutrient info
│   │   ├── meal-plans.md                   # Sample meal plans
│   │   └── food-database.md                # Food nutrients
│   └── health/
│       ├── health-conditions.md            # Condition guidelines
│       └── medical-considerations.md       # Safety information
│
├── docs/                                    # Documentation
│   ├── API.md                              # API documentation
│   ├── SETUP.md                            # Setup & installation
│   ├── DEPLOYMENT.md                       # Deployment guide
│   ├── CONTRIBUTING.md                     # Contributing guidelines
│   ├── TESTING.md                          # Testing guide
│   └── AWS_SETUP.md                        # Detailed AWS setup
│
└── docker-compose.yml                      # Root docker-compose (all services)
```

## Key Directory Descriptions

### Backend (`backend/`)
- **app/api/**: REST API endpoints organized by resource
- **app/services/**: Business logic, AWS integration, RAG
- **app/models/**: Database table definitions
- **app/schemas/**: Request/response validation
- **app/core/**: Configuration, security, database setup

### Frontend (`frontend/`)
- **components/**: React components grouped by feature
- **services/**: API client and business logic
- **store/**: Redux state management
- **styles/**: CSS and styling

### AWS Infrastructure (`aws-infrastructure/`)
- **terraform/**: Infrastructure as Code (IaC)
- **scripts/**: Setup and utility scripts
- **CloudFormation**: Alternative to Terraform

### Knowledge Base (`knowledge-base/`)
- Documents for RAG retrieval
- Organized by domain (fitness, nutrition, health)
- Uploaded to S3 and indexed in Bedrock KB

### Documentation (`docs/`)
- API specification
- Setup instructions
- Deployment procedures
- Contribution guidelines
