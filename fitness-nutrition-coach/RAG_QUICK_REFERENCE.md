# RAG Implementation - Quick Reference Card

## 📋 Files at a Glance

| File | Purpose | Lines | Type |
|------|---------|-------|------|
| `rag_retrieval.py` | RAG document retrieval | 440 | Python |
| `bedrock_enhanced.py` | Enhanced Bedrock with RAG | 470 | Python |
| `setup_aws_rag.sh` | AWS setup (Linux/Mac) | 250 | Bash |
| `setup_aws_rag.bat` | AWS setup (Windows) | 200 | Batch |
| `RAG_README.md` | User guide | 500 | Docs |
| `RAG_IMPLEMENTATION_GUIDE.md` | Technical guide | 600 | Docs |
| `RAG_EXAMPLES.py` | Code examples | 600 | Python |

## 🚀 Quick Start (5 minutes)

```bash
# 1. Run setup script
chmod +x setup_aws_rag.sh
./setup_aws_rag.sh

# 2. Edit .env with AWS credentials
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# 3. Install dependencies
pip install boto3 anthropic

# 4. Test in Python
from app.services.bedrock_enhanced import EnhancedBedrockService
service = EnhancedBedrockService()
result = service.generate_workout_with_rag(...)
```

## 🏗️ Architecture in 30 Seconds

```
User Query
    ↓
Retrieve Documents (S3/KB)
    ↓
Format as Context
    ↓
Build Prompt
    ↓
Call Bedrock Claude
    ↓
Extract Citations
    ↓
Return Response
```

## 🔑 Key Classes

### RAGRetrievalService
```python
from app.services.rag_retrieval import RAGRetrievalService

retriever = RAGRetrievalService()

# Retrieve from Knowledge Base
docs = retriever.retrieve_documents_from_knowledge_base(
    query="muscle building",
    kb_id="KB123456789"
)

# Format for prompt
context = retriever.format_context_for_prompt(docs)

# Get citations
citations = retriever.extract_citations(docs)
```

### FitnessDocumentRetriever
```python
from app.services.rag_retrieval import FitnessDocumentRetriever

retriever = FitnessDocumentRetriever()

# Specialized retrievers
workout_docs, workout_cites = retriever.retrieve_workout_documents(
    goal="strength"
)

nutrition_docs, nutrition_cites = retriever.retrieve_nutrition_documents(
    diet_type="high_protein"
)

health_docs, health_cites = retriever.retrieve_health_documents(
    query="injury prevention"
)
```

### EnhancedBedrockService
```python
from app.services.bedrock_enhanced import EnhancedBedrockService

service = EnhancedBedrockService()

# Generate with RAG
result = service.generate_workout_with_rag(
    user_profile={...},
    goal="muscle_gain",
    duration_weeks=12,
    frequency=4,
    equipment=["dumbbell"],
    intensity="high"
)

# Result contains
{
    "success": True,
    "workout": {...},
    "citations": [...],
    "rag_documents": 3,
    "tokens_estimated": 1500
}
```

## ⚙️ Environment Variables

**Required**:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<YOUR_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
BEDROCK_KNOWLEDGE_BASE_ID=KB123456789
DOCUMENT_BUCKET_NAME=fitness-documents-bucket
```

**Optional** (with defaults):
```bash
RAG_CHUNK_SIZE=1000           # Default
RAG_CHUNK_OVERLAP=100         # Default
RAG_MAX_RESULTS=5             # Default
S3_DOCUMENT_PREFIX=documents/ # Default
```

## 📂 Document Organization

```
s3://fitness-documents-bucket/
├── documents/
│   ├── workouts/
│   │   ├── strength_training.txt
│   │   └── cardio_guide.txt
│   ├── nutrition/
│   │   ├── macronutrient_guide.txt
│   │   └── meal_prep_guide.txt
│   └── health/
│       ├── injury_prevention.txt
│       └── recovery_strategies.txt
```

## 💻 Common API Calls

### Generate Workout with RAG
```python
from app.services.bedrock_enhanced import EnhancedBedrockService

service = EnhancedBedrockService()

result = service.generate_workout_with_rag(
    user_profile={
        "age": 28,
        "weight": 75,
        "fitness_level": "intermediate",
        "goals": ["muscle_gain"],
        "medical_conditions": []
    },
    goal="muscle_gain",
    duration_weeks=12,
    frequency=4,
    equipment=["dumbbell", "barbell"],
    intensity="high"
)

# Use result
print(result["workout"])
print(result["citations"])
print(f"Documents used: {result['rag_documents']}")
```

### Generate Nutrition with RAG
```python
result = service.generate_nutrition_with_rag(
    user_profile={
        "age": 32,
        "weight": 85,
        "dietary_restrictions": ["gluten_free"],
        "medical_conditions": ["type_2_diabetes"]
    },
    goal="weight_loss",
    duration_days=30,
    meals_per_day=3,
    daily_calories=1800,
    diet_type="mediterranean",
    preferred_foods=["fish", "vegetables"],
    avoided_foods=["processed_foods"]
)

print(result["meal_plan"])
print(result["citations"])
```

### Chat with Coach using RAG
```python
result = service.chat_with_coach_rag(
    user_message="Can I do HIIT with asthma?",
    user_profile={
        "medical_conditions": ["asthma"]
    },
    conversation_history=[...]
)

print(result["ai_response"])
print(result["citations"])
```

## 🔧 Useful AWS CLI Commands

### Check Knowledge Base Status
```bash
# List Knowledge Bases
aws bedrock-agent list-knowledge-bases --region us-east-1

# Get specific KB
aws bedrock-agent get-knowledge-base \
  --knowledge-base-id KB123456789 \
  --region us-east-1

# Check ingestion jobs
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id KB123456789 \
  --region us-east-1

# Get ingestion job status
aws bedrock-agent get-ingestion-job \
  --knowledge-base-id KB123456789 \
  --data-source-id DS123 \
  --ingestion-job-id JOB123 \
  --region us-east-1
```

### Sync Documents to Knowledge Base
```bash
# Upload new documents to S3
aws s3 cp workouts/ s3://fitness-documents/documents/workouts/ --recursive

# Trigger re-ingestion
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id KB123456789 \
  --data-source-id DS123 \
  --region us-east-1
```

## 🐛 Troubleshooting

### Problem: "No documents retrieved"
```bash
# Check KB status
aws bedrock-agent get-knowledge-base --knowledge-base-id KB123456789

# Check S3 bucket
aws s3 ls s3://fitness-documents/documents/ --recursive

# Verify ingestion completed
aws bedrock-agent list-ingestion-jobs --knowledge-base-id KB123456789
```

### Problem: "BEDROCK_KNOWLEDGE_BASE_ID not set"
```bash
# Update .env
BEDROCK_KNOWLEDGE_BASE_ID=KB123456789

# Or set environment variable
export BEDROCK_KNOWLEDGE_BASE_ID=KB123456789
```

### Problem: "AWS credentials not found"
```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### Problem: "Slow responses"
- Reduce RAG_MAX_RESULTS from 5 to 3
- Check AWS region latency
- Monitor CloudWatch logs

## 📊 Performance Baseline

| Operation | Time | Cost |
|-----------|------|------|
| Retrieve documents | 200-500ms | $0.00 (KB/S3) |
| Format context | 50-100ms | $0.00 (local) |
| Bedrock call | 2-5s | $0.01-0.02 |
| Parse response | 50-100ms | $0.00 (local) |
| **Total** | **2.5-5.5s** | **$0.01-0.02** |

## 📚 Documentation Map

```
RAG_README.md
├─ Quick Start (5 min)
├─ Architecture (5 min)
├─ Configuration (5 min)
└─ Troubleshooting (10 min)

RAG_IMPLEMENTATION_GUIDE.md
├─ Detailed AWS Setup (30 min)
├─ Usage Examples (20 min)
├─ Monitoring Setup (15 min)
├─ Best Practices (10 min)
└─ Advanced Topics (15 min)

RAG_EXAMPLES.py
├─ 12 Complete Examples
├─ Copy-Paste Ready
└─ Runnable Code

RAG_IMPLEMENTATION_SUMMARY.md
├─ Complete Overview
├─ File Descriptions
└─ Statistics
```

## ✅ Checklist

### Setup Phase
- [ ] Run setup script (setup_aws_rag.sh or setup_aws_rag.bat)
- [ ] Get Knowledge Base ID from script output
- [ ] Get S3 bucket name from script output
- [ ] Get Data Source ID from script output

### Configuration Phase
- [ ] Update .env with KB_ID
- [ ] Update .env with bucket name
- [ ] Add AWS credentials
- [ ] Verify all variables set

### Testing Phase
- [ ] Test document retrieval
- [ ] Test workout generation
- [ ] Test nutrition generation
- [ ] Test chat functionality
- [ ] Check citations in responses

### Integration Phase
- [ ] Update API routes
- [ ] Add citation display
- [ ] Store RAG metadata
- [ ] Test end-to-end
- [ ] Monitor token usage

## 🎓 Learning Path

1. **Start Here** (5 min): Read RAG_README.md - "Quick Start"
2. **Set Up** (5 min): Run setup script
3. **Configure** (2 min): Update .env
4. **Learn** (20 min): Read RAG_IMPLEMENTATION_GUIDE.md
5. **Practice** (20 min): Run examples from RAG_EXAMPLES.py
6. **Implement** (30 min): Integrate into your API routes
7. **Test** (15 min): Test all endpoints
8. **Monitor** (ongoing): Track costs and performance

## 🔗 Links

| Resource | Location | Time |
|----------|----------|------|
| Quick Start | RAG_README.md | 5 min |
| Setup Guide | RAG_IMPLEMENTATION_GUIDE.md | 30 min |
| Code Examples | RAG_EXAMPLES.py | 20 min |
| Full Summary | RAG_IMPLEMENTATION_SUMMARY.md | 10 min |
| This Card | RAG_QUICK_REFERENCE.md | 5 min |

## 💡 Pro Tips

1. **Test locally first** - Use RAG_EXAMPLES.py before production
2. **Monitor costs** - Track token usage and check CloudWatch
3. **Update documents regularly** - Keep KB in sync with latest info
4. **Use fallbacks** - Always have non-RAG generation fallback
5. **Track citations** - Store sources for transparency
6. **Tune chunk size** - Test 500-2000 chars for optimal retrieval
7. **Cache results** - Cache popular queries to reduce costs
8. **Log everything** - Enable detailed logging for debugging

## 🎯 Success Criteria

✅ Documents retrieved from Knowledge Base
✅ Context formatted correctly in prompts
✅ AI generates personalized responses
✅ Citations show document sources
✅ Responses include relevant information
✅ System runs within 5 seconds
✅ Cost per generation < $0.02
✅ No hallucinations detected

---

**Version**: 1.0
**Last Updated**: April 27, 2026
**Status**: ✅ Complete & Ready
