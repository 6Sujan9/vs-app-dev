# RAG (Retrieval-Augmented Generation) Implementation Guide

## Overview

This document provides comprehensive guidance on implementing Retrieval-Augmented Generation (RAG) with Amazon Bedrock for the AI Fitness Coach.

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Files](#implementation-files)
3. [Configuration](#configuration)
4. [AWS Setup](#aws-setup)
5. [Document Management](#document-management)
6. [Usage Examples](#usage-examples)
7. [API Integration](#api-integration)
8. [Monitoring](#monitoring)

---

## Architecture

### RAG Flow Diagram

```
User Query
    ↓
[RAG Retrieval Service]
    ├─ Query Knowledge Base (Bedrock KB)
    ├─ Search S3 Documents
    └─ Chunk & Format Context
    ↓
[Enhanced Bedrock Service]
    ├─ Build Prompt with Context
    ├─ Call Claude Model
    └─ Parse Response
    ↓
Response with Citations
    └─ Citations point to source documents
```

### Key Components

**1. RAG Retrieval Service** (`rag_retrieval.py`)
- Retrieves documents from Bedrock Knowledge Base
- Fetches documents from S3
- Chunks documents for better retrieval
- Formats context for prompts
- Extracts citations

**2. Enhanced Bedrock Service** (`bedrock_enhanced.py`)
- Integrates RAG with Bedrock API calls
- Builds optimized prompts with context
- Handles workout, nutrition, and chat generations
- Manages citations and metadata

**3. Configuration** (`config.py`)
- AWS credentials and settings
- Knowledge Base ID
- S3 bucket configuration
- RAG parameters (chunk size, max results)

---

## Implementation Files

### New Files Created

```
backend/app/services/
├── rag_retrieval.py              # RAG document retrieval
├── bedrock_enhanced.py           # Enhanced Bedrock with RAG
└── __init__.py                   # Updated imports
```

### Updated Files

```
backend/
├── app/core/config.py            # Added RAG settings
└── .env.example                  # Added RAG environment variables
```

---

## Configuration

### Environment Variables

Create/update `.env` file with:

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_KNOWLEDGE_BASE_ID=your-knowledge-base-id

# S3 Configuration for RAG
DOCUMENT_BUCKET_NAME=your-fitness-documents-bucket
S3_DOCUMENT_PREFIX=documents/

# RAG Settings
RAG_CHUNK_SIZE=1000              # Characters per chunk
RAG_CHUNK_OVERLAP=100            # Overlap between chunks
RAG_MAX_RESULTS=5                # Max documents to retrieve
```

### Settings Class

```python
# app/core/config.py

class Settings(BaseSettings):
    # AWS
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # Bedrock
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    BEDROCK_KNOWLEDGE_BASE_ID: Optional[str] = None
    
    # S3
    DOCUMENT_BUCKET_NAME: Optional[str] = None
    S3_DOCUMENT_PREFIX: str = "documents/"
    
    # RAG
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 100
    RAG_MAX_RESULTS: int = 5
```

---

## AWS Setup

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://your-fitness-documents-bucket --region us-east-1
```

### Step 2: Upload Sample Documents

Structure your bucket as:
```
s3://your-fitness-documents-bucket/
├── workouts/
│   ├── strength_training.txt
│   ├── cardio_guide.txt
│   └── flexibility_routines.txt
├── nutrition/
│   ├── macronutrient_guide.txt
│   ├── meal_prep_guide.txt
│   └── diet_types.txt
└── health/
    ├── injury_prevention.txt
    ├── recovery_strategies.txt
    └── medical_considerations.txt
```

### Step 3: Create IAM Role for Bedrock

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agent:Retrieve"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-fitness-documents-bucket",
        "arn:aws:s3:::your-fitness-documents-bucket/*"
      ]
    }
  ]
}
```

### Step 4: Create Bedrock Knowledge Base

Using AWS CLI:
```bash
aws bedrock-agent create-knowledge-base \
  --name fitness-knowledge-base \
  --description "Knowledge base for fitness and nutrition" \
  --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/BedrockRole \
  --knowledge-base-configuration type=VECTOR \
  --storage-configuration type=S3,s3StorageConfiguration={bucketArn=arn:aws:s3:::your-fitness-documents-bucket}
```

Or using the AWS Console:
1. Navigate to Bedrock → Knowledge Base
2. Click "Create Knowledge Base"
3. Name: "fitness-knowledge-base"
4. Select "Quick Create"
5. Choose your S3 bucket
6. Create Data Source
7. Configure embeddings model

### Step 5: Sync Knowledge Base

```bash
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DATA_SOURCE_ID
```

---

## Document Management

### Document Format

Store documents as text files with metadata:

**Example: workout_guide.txt**
```
# Strength Training for Beginners

## Overview
Strength training builds muscle and increases metabolism.

## Key Principles
1. Progressive overload - gradually increase weight
2. Proper form - quality over quantity
3. Adequate recovery - 48 hours between workouts

## Exercise Selection
- Compound movements: squat, deadlift, bench press
- Isolation exercises: bicep curl, tricep extension

## Program Structure
- Frequency: 3-4 sessions per week
- Duration: 45-60 minutes per session
- Rest periods: 60-90 seconds between sets

## Safety Considerations
- Always warm up properly
- Use appropriate weights
- Consider medical history
- Consult healthcare provider if needed
```

### Chunk Size Recommendations

- **Small chunks (500-1000 chars)**: Better retrieval precision
- **Medium chunks (1000-2000 chars)**: Balanced approach
- **Large chunks (2000+ chars)**: More context but less precision

### Citation Format

Documents should include source attribution:

```markdown
## Reference
- Source: S3 URI
- Author: Name
- Date: YYYY-MM-DD
- Version: 1.0
```

---

## Usage Examples

### Example 1: Generate Workout with RAG

```python
from app.services.bedrock_enhanced import EnhancedBedrockService

service = EnhancedBedrockService()

user_profile = {
    "age": 28,
    "weight": 75,
    "height": 180,
    "fitness_level": "intermediate",
    "goals": ["muscle_gain", "strength"],
    "medical_conditions": ["lower_back_pain"],
    "dietary_restrictions": []
}

result = service.generate_workout_with_rag(
    user_profile=user_profile,
    goal="muscle_gain",
    duration_weeks=12,
    frequency=4,
    equipment=["dumbbell", "barbell"],
    intensity="high",
    specific_requirements="Avoid heavy leg exercises due to back pain"
)

print(f"Generated workout with {result['rag_documents']} documents")
print(f"Citations: {result['citations']}")
print(f"Response: {result['workout']}")
```

### Example 2: Generate Nutrition Plan with RAG

```python
from app.services.bedrock_enhanced import EnhancedBedrockService

service = EnhancedBedrockService()

user_profile = {
    "age": 32,
    "weight": 85,
    "fitness_level": "intermediate",
    "dietary_restrictions": ["gluten_free"],
    "medical_conditions": ["type_2_diabetes"],
    "goals": ["weight_loss"]
}

result = service.generate_nutrition_with_rag(
    user_profile=user_profile,
    goal="weight_loss",
    duration_days=30,
    meals_per_day=3,
    daily_calories=1800,
    diet_type="mediterranean",
    preferred_foods=["fish", "olive_oil", "vegetables"],
    avoided_foods=["processed_foods", "sugary_drinks"]
)

print(f"RAG documents used: {result['rag_documents']}")
print(f"Meal plan: {result['meal_plan']}")
```

### Example 3: Chat with RAG Context

```python
from app.services.bedrock_enhanced import EnhancedBedrockService

service = EnhancedBedrockService()

user_profile = {
    "age": 25,
    "weight": 70,
    "fitness_level": "beginner",
    "goals": ["general_fitness"],
    "medical_conditions": ["asthma"],
    "dietary_restrictions": []
}

conversation_history = [
    {
        "user_message": "How should I start exercising?",
        "ai_response": "Start with moderate intensity, 3 days/week..."
    }
]

result = service.chat_with_coach_rag(
    user_message="Can I do high intensity interval training with asthma?",
    user_profile=user_profile,
    conversation_history=conversation_history
)

print(f"AI Response: {result['ai_response']}")
print(f"Sources: {result['citations']}")
```

### Example 4: Retrieve Specific Documents

```python
from app.services.rag_retrieval import FitnessDocumentRetriever

retriever = FitnessDocumentRetriever()

# Get workout documents
docs, citations = retriever.retrieve_workout_documents(
    goal="muscle_gain",
    equipment=["dumbbell"],
    intensity="high"
)

print(f"Found {len(docs)} relevant workout documents")
for doc in docs:
    print(f"- {doc.get('source')}: {doc.get('content')[:100]}...")
```

---

## API Integration

### Update Workout Route

```python
# backend/app/api/routes/workout.py

from app.services.bedrock_enhanced import EnhancedBedrockService

@router.post("/api/v1/workouts/generate")
async def generate_workout(
    request: WorkoutGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate AI workout plan using RAG."""
    
    # Get user profile
    user_profile = {
        "age": current_user.age,
        "weight": current_user.weight,
        "height": current_user.height,
        "fitness_level": current_user.fitness_level,
        "goals": current_user.goals,
        "medical_conditions": current_user.medical_conditions,
    }
    
    # Generate workout with RAG
    service = EnhancedBedrockService()
    result = service.generate_workout_with_rag(
        user_profile=user_profile,
        goal=request.goal,
        duration_weeks=request.duration_weeks,
        frequency=request.frequency,
        equipment=request.equipment,
        intensity=request.intensity,
        specific_requirements=request.specific_requirements,
    )
    
    # Store in database
    if result["success"]:
        workout_plan = WorkoutPlan(
            user_id=current_user.id,
            name=result["workout"].get("name", "Generated Plan"),
            goal=request.goal,
            duration_weeks=request.duration_weeks,
            frequency=request.frequency,
            equipment=request.equipment,
            intensity=request.intensity,
            exercises=result["workout"].get("exercises", []),
            bedrock_response=result["bedrock_response"],
            rag_documents_used=[c["source"] for c in result["citations"]],
            tokens_used=result["tokens_estimated"],
        )
        db.add(workout_plan)
        db.commit()
    
    return {
        "workout": result["workout"],
        "citations": result["citations"],
        "rag_documents": result["rag_documents"],
    }
```

### Response Format

```json
{
  "success": true,
  "workout": {
    "name": "12-Week Strength Building Program",
    "description": "Progressive strength training...",
    "exercises": [
      {
        "name": "Barbell Squat",
        "sets": 4,
        "reps": "6-8",
        "rest_seconds": 90
      }
    ]
  },
  "citations": [
    {
      "source": "s3://bucket/workouts/strength_training.txt",
      "score": "0.95"
    }
  ],
  "rag_documents": 3,
  "tokens_estimated": 1500
}
```

---

## Monitoring

### Log RAG Retrieval

```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"Retrieved {len(documents)} documents from knowledge base")
logger.debug(f"Query: {query}")
logger.debug(f"Documents: {[doc['source'] for doc in documents]}")
```

### Track Metrics

```python
from datetime import datetime

rag_metrics = {
    "timestamp": datetime.now(),
    "documents_retrieved": len(documents),
    "query": query,
    "response_time": time.time() - start_time,
    "citations": len(citations),
    "tokens_used": tokens_estimated,
}

logger.info(f"RAG Metrics: {rag_metrics}")
```

### Error Handling

```python
try:
    documents = retriever.retrieve_documents_from_knowledge_base(query, kb_id)
except Exception as e:
    logger.error(f"RAG retrieval failed: {e}")
    # Fall back to direct Bedrock call without RAG
    response = service._call_bedrock(prompt_without_rag)
```

---

## Best Practices

### 1. Document Organization

- **Structure**: Organize documents by category (workouts, nutrition, health)
- **Naming**: Use descriptive names that reflect content
- **Versioning**: Include version numbers in document names

### 2. Chunk Configuration

- **Size**: 1000-1500 characters works well for fitness content
- **Overlap**: 100-200 characters helps maintain context
- **Testing**: Experiment with sizes for your use case

### 3. Query Optimization

```python
# Good: Specific, descriptive query
query = "beginner strength training with dumbbells for muscle gain"

# Bad: Too vague
query = "workout"

# Better: Multi-faceted query
query = "strength training muscle hypertrophy progressive overload"
```

### 4. Citation Management

- Always include source attribution
- Store citation data in database
- Allow users to view source documents
- Update documents when knowledge base changes

### 5. Error Handling

```python
# Always have fallback for failed retrieval
try:
    documents = retrieve_from_kb(query)
except Exception:
    # Use S3 as fallback
    documents = retrieve_from_s3(query)
    
if not documents:
    # Use general prompt without context
    logger.warning("No documents retrieved, using general prompt")
```

### 6. Security

- Encrypt S3 objects at rest
- Use IAM roles for AWS authentication
- Sanitize user queries before sending
- Log sensitive operations
- Monitor for unusual access patterns

---

## Troubleshooting

### Problem: No Documents Retrieved

**Cause**: Knowledge base not properly configured or documents not indexed

**Solution**:
1. Verify knowledge base ID in .env
2. Check S3 bucket permissions
3. Confirm documents are in correct format
4. Re-sync knowledge base with: `start-ingestion-job`

### Problem: Slow Response Times

**Cause**: Large documents or poor network connection

**Solution**:
1. Reduce chunk size for faster retrieval
2. Decrease max_results parameter
3. Check AWS region configuration
4. Monitor Bedrock service metrics

### Problem: Irrelevant Documents

**Cause**: Poor query formation or document structure

**Solution**:
1. Improve document titles and summaries
2. Add metadata to documents
3. Refine query construction
4. Test with different queries

### Problem: RAG Context Too Large

**Cause**: Including too many documents in prompt

**Solution**:
1. Reduce RAG_MAX_RESULTS in config
2. Decrease chunk size
3. Increase max_tokens in Bedrock call
4. Filter documents by relevance score

---

## Cost Optimization

### 1. Bedrock Usage

- Charge: Per input/output tokens
- **Optimization**: Reduce context size, use shorter chunks
- **Monitoring**: Track tokens_used metric

### 2. S3 Storage

- **Optimization**: Archive old documents
- **Organization**: Use lifecycle policies
- **Versioning**: Keep only necessary versions

### 3. Knowledge Base

- **Optimization**: Batch ingestion jobs
- **Monitoring**: Track ingestion job status
- **Cleaning**: Remove duplicate documents

### Cost Estimation

```
Assuming:
- 1000 users
- 1 workout request per user per month
- Average 3 documents retrieved (≈2000 tokens input + 500 tokens output)

Monthly Cost:
- Bedrock: (1000 * 3 * 2500 tokens) / 1M * $0.003 ≈ $22.50
- S3: Minimal (< $1 for retrieval)
- Knowledge Base: Included
```

---

## Advanced Topics

### Custom Embeddings

```python
# Use custom embeddings instead of Titan
vectorKnowledgeBaseConfiguration={
    "embeddingModel": {
        "provider": "BEDROCK",
        "modelIdentifier": "cohere.embed-english-v3"
    }
}
```

### Multi-Modal RAG

```python
# Support images, documents, etc.
documents = [
    {"content": text_content},
    {"image": image_content},
    {"video": video_metadata}
]
```

### Fine-tuning

```python
# Fine-tune Claude for fitness domain
response = bedrock_client.create_model_customization_job(
    customizationName="fitness-claude",
    baseModelIdentifier=model_id,
    trainingDataConfig=training_data,
)
```

---

## Conclusion

RAG significantly improves the quality of AI responses by grounding them in your fitness knowledge base. By following this guide, you can:

1. ✅ Set up AWS infrastructure
2. ✅ Manage fitness documents
3. ✅ Retrieve relevant context
4. ✅ Generate personalized responses
5. ✅ Track citations and metrics
6. ✅ Monitor and optimize costs

For more information, see:
- [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Knowledge Base Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/BestPractices.html)
