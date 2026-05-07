"""
RAG (Retrieval-Augmented Generation) Implementation Examples
Comprehensive examples showing how to use RAG with Amazon Bedrock
"""

# ============================================================================
# EXAMPLE 1: SETUP AND INITIALIZATION
# ============================================================================

"""
Step 1: Configure environment variables

Create or update .env file:
"""

# .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_KNOWLEDGE_BASE_ID=KB123456789
DOCUMENT_BUCKET_NAME=fitness-documents-bucket
S3_DOCUMENT_PREFIX=documents/
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=100
RAG_MAX_RESULTS=5


# ============================================================================
# EXAMPLE 2: CREATING S3 BUCKET AND UPLOADING DOCUMENTS
# ============================================================================

import boto3
import json

s3_client = boto3.client("s3", region_name="us-east-1")
bucket_name = "fitness-documents-bucket"

# Step 1: Create S3 bucket
try:
    s3_client.create_bucket(Bucket=bucket_name)
    print(f"Created bucket: {bucket_name}")
except s3_client.exceptions.BucketAlreadyOwnedByYou:
    print(f"Bucket already exists: {bucket_name}")

# Step 2: Upload workout documents
workout_content = """
# Complete Guide to Strength Training

## Introduction
Strength training is one of the most effective ways to build muscle and increase metabolism.
Regular strength training improves bone density, cardiovascular health, and overall fitness.

## Key Principles
1. Progressive Overload
   - Gradually increase weight, reps, or sets
   - Aim for 5-10% increase every 1-2 weeks
   - Track your workouts to measure progress

2. Proper Form
   - Quality always beats quantity
   - Slow, controlled movements (2 seconds up, 1 second pause, 3 seconds down)
   - Full range of motion on every rep

3. Adequate Recovery
   - Rest 48 hours between same muscle group workouts
   - Get 7-9 hours of sleep per night
   - Proper nutrition (protein, carbs, fats)

## Exercise Selection for Beginners
- Compound exercises: Squat, Deadlift, Bench Press, Barbell Row
- Assistance: Dumbbell Curls, Tricep Extensions, Lateral Raises
- Core: Planks, Dead Bugs, Bird Dogs

## Program Structure
- Frequency: 3-4 days per week
- Session Duration: 45-60 minutes
- Rest Between Sets: 60-90 seconds (heavy), 45-60 seconds (moderate)

## Safety Considerations
- Always warm up with light weights (5-10 minutes)
- Use appropriate weight for your level
- Never sacrifice form for heavier weight
- Stop if you experience sharp pain
- Consult a doctor before starting if you have medical conditions

## Progression Timeline
- Weeks 1-2: Get the form down with light weight
- Weeks 3-4: Increase weight by 5-10%
- Weeks 5-8: Continue progressive overload
- Weeks 9+: Consider changing exercises or rep ranges
"""

s3_client.put_object(
    Bucket=bucket_name,
    Key="workouts/strength_training_guide.txt",
    Body=workout_content.encode("utf-8"),
    ContentType="text/plain"
)
print("Uploaded: workouts/strength_training_guide.txt")

# Step 3: Upload nutrition documents
nutrition_content = """
# Nutrition Guide for Fitness Goals

## Macronutrients

### Protein
- Role: Builds and repairs muscle tissue
- Daily requirement: 0.7-1g per lb of body weight for muscle gain
- Sources: Chicken, Fish, Eggs, Greek Yogurt, Legumes, Whey Protein

### Carbohydrates
- Role: Provides energy for workouts
- Daily requirement: 2-4g per lb of body weight (varies by activity)
- Sources: Rice, Oats, Whole Wheat Bread, Sweet Potatoes, Fruits

### Fats
- Role: Hormone production, nutrient absorption
- Daily requirement: 0.3-0.5g per lb of body weight
- Sources: Olive Oil, Avocado, Nuts, Fatty Fish (Omega-3s)

## Calorie Requirements

For weight loss: 300-500 calorie deficit
For muscle gain: 300-500 calorie surplus
For maintenance: Maintenance level (TDEE)

## Meal Timing

- Pre-workout: Carbs + Protein (30-60 min before)
- Post-workout: Protein + Carbs (within 2 hours after)
- Throughout day: Distribute protein evenly (every 3-4 hours)

## Hydration
- Minimum: 8-10 glasses (64-80 oz) per day
- For intense exercise: Add 15-20 oz per 15 minutes of exercise
- Monitor urine color: pale yellow indicates good hydration

## Sample Daily Meal Plan (2000 calories)

Breakfast (500 cal):
- 3 eggs + 2 slices whole wheat toast
- 1 banana
- 1 tbsp peanut butter

Snack (200 cal):
- Greek yogurt (150g) + berries

Lunch (600 cal):
- Grilled chicken breast (150g)
- Brown rice (200g)
- Broccoli (150g)

Snack (200 cal):
- Protein shake
- Apple + almonds

Dinner (500 cal):
- Salmon (150g)
- Sweet potato (200g)
- Asparagus (150g)
"""

s3_client.put_object(
    Bucket=bucket_name,
    Key="nutrition/nutrition_guide.txt",
    Body=nutrition_content.encode("utf-8"),
    ContentType="text/plain"
)
print("Uploaded: nutrition/nutrition_guide.txt")

# Step 4: Upload health/medical documents
health_content = """
# Health Considerations for Fitness

## Common Injuries and Prevention

### Lower Back Pain
Prevention:
- Strengthen core muscles
- Avoid heavy deadlifts with poor form
- Use proper posture
- Stretch hip flexors and hamstrings

Modifications:
- Replace deadlifts with trap bar deadlifts
- Use machines instead of free weights
- Focus on core stability exercises

### Knee Pain
Prevention:
- Ensure proper squat form (knees tracking over toes)
- Strengthen quadriceps and glutes
- Avoid deep squats if painful

Modifications:
- Use leg press instead of barbell squat
- Reduce range of motion initially
- Work on ankle and hip mobility

### Shoulder Pain
Prevention:
- Warm up rotator cuffs
- Balance pushing and pulling exercises
- Don't go too heavy on bench press

Modifications:
- Use machines instead of barbells
- Add extra rotator cuff work
- Consider physical therapy

## Medical Conditions

### Type 2 Diabetes
- Exercise improves insulin sensitivity
- Combine strength training + cardio
- Monitor blood sugar before/after workouts
- Consult with endocrinologist

### High Blood Pressure
- Avoid Valsalva maneuver (holding breath)
- Lower weights, higher reps
- Include regular cardio
- Reduce sodium intake

### Asthma
- Use rescue inhaler before exercise
- Warm up thoroughly
- Stay hydrated
- Avoid cold environments if possible

## Recovery Strategies

### Sleep
- 7-9 hours per night is optimal
- Keep bedroom cool and dark
- Avoid caffeine 6 hours before bed
- Establish consistent sleep schedule

### Nutrition
- Eat adequate protein (builds muscle)
- Don't drastically cut calories (allows recovery)
- Stay hydrated throughout day
- Include antioxidant-rich foods

### Active Recovery
- Light walking or yoga
- Foam rolling and stretching
- Massage or trigger point therapy
- Swimming or easy cycling

### Rest Days
- Take at least 1-2 complete rest days per week
- Listen to your body
- If feeling fatigued, take an extra rest day
- Deload week every 4-6 weeks (lighter weights, higher reps)
"""

s3_client.put_object(
    Bucket=bucket_name,
    Key="health/medical_considerations.txt",
    Body=health_content.encode("utf-8"),
    ContentType="text/plain"
)
print("Uploaded: health/medical_considerations.txt")


# ============================================================================
# EXAMPLE 3: USING RAG RETRIEVAL SERVICE
# ============================================================================

from app.services.rag_retrieval import FitnessDocumentRetriever
from app.core.config import settings

# Initialize retriever
retriever = FitnessDocumentRetriever()

# Retrieve workout documents
print("\n--- Retrieving Workout Documents ---")
workout_docs, workout_citations = retriever.retrieve_workout_documents(
    goal="muscle_gain",
    equipment=["dumbbell", "barbell"],
    intensity="high"
)

print(f"Retrieved {len(workout_docs)} workout documents:")
for doc in workout_docs:
    print(f"  - Source: {doc.get('source')}")
    print(f"    Content preview: {doc.get('content')[:100]}...")

print(f"\nCitations: {workout_citations}")

# Retrieve nutrition documents
print("\n--- Retrieving Nutrition Documents ---")
nutrition_docs, nutrition_citations = retriever.retrieve_nutrition_documents(
    diet_type="high_protein",
    goal="muscle_gain",
    dietary_restrictions=[]
)

print(f"Retrieved {len(nutrition_docs)} nutrition documents:")
for doc in nutrition_docs:
    print(f"  - Source: {doc.get('source')}")

# Retrieve health documents
print("\n--- Retrieving Health Documents ---")
health_docs, health_citations = retriever.retrieve_health_documents(
    query="lower back pain exercises",
    medical_conditions=["lower_back_pain"]
)

print(f"Retrieved {len(health_docs)} health documents:")
for doc in health_docs:
    print(f"  - Source: {doc.get('source')}")


# ============================================================================
# EXAMPLE 4: GENERATING WORKOUT WITH RAG
# ============================================================================

from app.services.bedrock_enhanced import EnhancedBedrockService

print("\n--- Generating Workout with RAG ---")

service = EnhancedBedrockService()

user_profile = {
    "age": 28,
    "weight": 75,  # kg
    "height": 180,  # cm
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
    specific_requirements="Avoid heavy leg exercises due to back pain. Focus on upper body and core."
)

print(f"\nGeneration Success: {result['success']}")
print(f"RAG Documents Used: {result['rag_documents']}")
print(f"Tokens Estimated: {result['tokens_estimated']}")
print(f"\nCitations:")
for citation in result['citations']:
    print(f"  - {citation['source']} (score: {citation['score']})")

print(f"\nGenerated Workout:")
print(json.dumps(result['workout'], indent=2))


# ============================================================================
# EXAMPLE 5: GENERATING NUTRITION PLAN WITH RAG
# ============================================================================

print("\n--- Generating Nutrition Plan with RAG ---")

user_profile = {
    "age": 32,
    "weight": 85,  # kg
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

print(f"\nGeneration Success: {result['success']}")
print(f"RAG Documents Used: {result['rag_documents']}")
print(f"\nGenerated Meal Plan:")
print(json.dumps(result['meal_plan'], indent=2))


# ============================================================================
# EXAMPLE 6: CHAT WITH COACH USING RAG
# ============================================================================

print("\n--- Chat with Coach using RAG ---")

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
        "ai_response": "As a beginner, start with moderate intensity, 3 days per week..."
    }
]

result = service.chat_with_coach_rag(
    user_message="Can I do high intensity interval training with asthma?",
    user_profile=user_profile,
    conversation_history=conversation_history
)

print(f"\nChat Response Success: {result['success']}")
print(f"RAG Documents Used: {result['rag_documents']}")
print(f"\nAI Response:")
print(result['ai_response'])
print(f"\nCitations:")
for citation in result['citations']:
    print(f"  - {citation['source']}")


# ============================================================================
# EXAMPLE 7: DOCUMENT CHUNKING
# ============================================================================

print("\n--- Document Chunking ---")

documents = [
    {
        "content": "This is a long document about fitness...",
        "source": "s3://bucket/workouts/guide.txt"
    }
]

chunks = retriever.chunk_documents(
    documents=documents,
    chunk_size=500,
    overlap=50
)

print(f"Original documents: {len(documents)}")
print(f"After chunking: {len(chunks)}")
print(f"\nFirst chunk:")
print(chunks[0])


# ============================================================================
# EXAMPLE 8: PROMPT CONTEXT FORMATTING
# ============================================================================

print("\n--- Context Formatting for Prompt ---")

documents = [
    {"content": "Strength training builds muscle...", "source": "workout_guide.txt"},
    {"content": "Protein is essential for muscle growth...", "source": "nutrition_guide.txt"}
]

context = retriever.format_context_for_prompt(documents, max_tokens=2000)

print("Formatted context for prompt:")
print(context)


# ============================================================================
# EXAMPLE 9: ERROR HANDLING WITH FALLBACKS
# ============================================================================

print("\n--- Error Handling with Fallbacks ---")

def generate_with_fallback(user_profile, request_params):
    """Generate with fallback if RAG fails"""
    try:
        service = EnhancedBedrockService()
        result = service.generate_workout_with_rag(**request_params)
        
        if result['success']:
            return result
    except Exception as e:
        print(f"RAG generation failed: {e}")
    
    # Fallback: Generate without RAG context
    print("Using fallback: generating without RAG")
    prompt = f"Generate a workout plan for someone with profile: {user_profile}"
    response = service._call_bedrock(prompt)
    
    return {
        "success": True,
        "workout": {"description": response},
        "rag_documents": 0,
        "fallback": True
    }


# ============================================================================
# EXAMPLE 10: TRACKING METRICS AND LOGGING
# ============================================================================

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

def generate_with_metrics(service, user_profile, request_params):
    """Generate and track metrics"""
    start_time = datetime.now()
    
    result = service.generate_workout_with_rag(**request_params)
    
    metrics = {
        "timestamp": start_time.isoformat(),
        "duration_seconds": (datetime.now() - start_time).total_seconds(),
        "success": result['success'],
        "documents_retrieved": result['rag_documents'],
        "citations": len(result.get('citations', [])),
        "tokens_used": result.get('tokens_estimated', 0),
        "user_id": user_profile.get('id', 'unknown')
    }
    
    logger.info(f"RAG Generation Metrics: {metrics}")
    
    return result, metrics


# ============================================================================
# EXAMPLE 11: BATCH PROCESSING MULTIPLE USERS
# ============================================================================

print("\n--- Batch Processing Multiple Users ---")

users = [
    {"id": 1, "name": "User1", "age": 28, "weight": 75, "fitness_level": "intermediate"},
    {"id": 2, "name": "User2", "age": 32, "weight": 85, "fitness_level": "beginner"},
    {"id": 3, "name": "User3", "age": 25, "weight": 65, "fitness_level": "advanced"}
]

service = EnhancedBedrockService()
results = []

for user in users:
    result = service.generate_workout_with_rag(
        user_profile=user,
        goal="muscle_gain",
        duration_weeks=8,
        frequency=3,
        equipment=["dumbbell"],
        intensity="moderate"
    )
    
    results.append({
        "user_id": user['id'],
        "success": result['success'],
        "documents": result['rag_documents']
    })
    
    print(f"Generated for {user['name']}: {result['success']}")

print(f"\nBatch Results Summary:")
print(f"Total users: {len(users)}")
print(f"Successful: {sum(1 for r in results if r['success'])}")


# ============================================================================
# EXAMPLE 12: CREATING KNOWLEDGE BASE PROGRAMMATICALLY
# ============================================================================

print("\n--- Creating Knowledge Base ---")

bedrock_agent_client = boto3.client(
    "bedrock-agent",
    region_name="us-east-1"
)

# This would typically be done once during setup
try:
    kb_response = bedrock_agent_client.create_knowledge_base(
        name="fitness-knowledge-base",
        description="Knowledge base for fitness and nutrition guidance",
        roleArn="arn:aws:iam::YOUR_ACCOUNT_ID:role/BedrockRole",
        knowledgeBaseConfiguration={
            "type": "VECTOR",
            "vectorKnowledgeBaseConfiguration": {
                "embeddingModel": {
                    "provider": "BEDROCK",
                    "modelIdentifier": "amazon.titan-embed-text-v2:0"
                }
            }
        },
        storageConfiguration={
            "type": "S3",
            "s3StorageConfiguration": {
                "bucketArn": f"arn:aws:s3:::{bucket_name}"
            }
        }
    )
    
    kb_id = kb_response['knowledgeBase']['id']
    print(f"Created Knowledge Base: {kb_id}")
    
except Exception as e:
    print(f"Knowledge Base creation error: {e}")
    print("This is normal if KB already exists")


# ============================================================================
# SUMMARY
# ============================================================================

"""
RAG Implementation Summary:

1. ✅ Create S3 bucket with fitness documents
2. ✅ Setup Bedrock Knowledge Base from S3
3. ✅ Initialize RAG Retriever
4. ✅ Use Enhanced Bedrock Service for generation
5. ✅ Handle errors with fallbacks
6. ✅ Track metrics and logging
7. ✅ Process multiple users in batch
8. ✅ Monitor costs and performance

Key Classes:
- RAGRetrievalService: Retrieves documents from KB and S3
- FitnessDocumentRetriever: Specialized retriever for fitness domain
- EnhancedBedrockService: Generates content with RAG context

Benefits:
- Grounded responses based on knowledge base
- Citations for transparency
- Better context for personalization
- Reduced hallucinations
- Trackable metrics
"""
