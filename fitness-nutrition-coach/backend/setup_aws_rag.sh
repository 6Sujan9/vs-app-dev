#!/bin/bash

# AWS RAG Setup Script for Fitness Coach
# This script automates AWS infrastructure setup for RAG

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME=${BUCKET_NAME:-fitness-documents-$(date +%s)}
KB_NAME="fitness-knowledge-base"
KB_DESCRIPTION="Knowledge base for AI Fitness Coach with RAG"
IAM_ROLE_NAME="BedrockFitnessRole"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${BLUE}=== AWS RAG Setup for Fitness Coach ===${NC}\n"

# Step 1: Create IAM Role
echo -e "${BLUE}Step 1: Creating IAM Role...${NC}"

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

INLINE_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::'"$BUCKET_NAME"'",
        "arn:aws:s3:::'"$BUCKET_NAME"'/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:'"$AWS_REGION"'::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agent:Retrieve"
      ],
      "Resource": "*"
    }
  ]
}'

# Create role
if aws iam get-role --role-name $IAM_ROLE_NAME 2>/dev/null; then
    echo -e "${GREEN}✓ IAM Role already exists${NC}"
else
    echo "$TRUST_POLICY" > /tmp/trust-policy.json
    aws iam create-role \
        --role-name $IAM_ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region $AWS_REGION
    echo -e "${GREEN}✓ Created IAM Role${NC}"
fi

# Add inline policy
echo "$INLINE_POLICY" > /tmp/inline-policy.json
aws iam put-role-policy \
    --role-name $IAM_ROLE_NAME \
    --policy-name BedrockFitnessPolicy \
    --policy-document file:///tmp/inline-policy.json
echo -e "${GREEN}✓ Added inline policy${NC}"

# Step 2: Create S3 Bucket
echo -e "\n${BLUE}Step 2: Creating S3 Bucket...${NC}"

if aws s3 ls s3://$BUCKET_NAME 2>/dev/null; then
    echo -e "${GREEN}✓ S3 Bucket already exists${NC}"
else
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
    else
        aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION \
            --create-bucket-configuration LocationConstraint=$AWS_REGION
    fi
    echo -e "${GREEN}✓ Created S3 Bucket: s3://$BUCKET_NAME${NC}"
fi

# Step 3: Create folder structure and upload sample documents
echo -e "\n${BLUE}Step 3: Creating folder structure and sample documents...${NC}"

# Create temporary directory for documents
TEMP_DOC_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DOC_DIR" EXIT

# Create sample documents
mkdir -p $TEMP_DOC_DIR/workouts
mkdir -p $TEMP_DOC_DIR/nutrition
mkdir -p $TEMP_DOC_DIR/health

# Sample workout document
cat > $TEMP_DOC_DIR/workouts/strength_training.txt << 'EOF'
# Strength Training Guide

## Overview
Strength training builds muscle and increases metabolism. It's essential for overall health and fitness.

## Key Principles
1. Progressive Overload - gradually increase weight/reps
2. Proper Form - quality over quantity
3. Adequate Recovery - rest 48 hours between same muscle groups
4. Consistency - train 3-4 days per week

## Basic Exercises
- Squats: 4 sets × 6-8 reps
- Deadlifts: 4 sets × 5-8 reps
- Bench Press: 4 sets × 6-8 reps
- Rows: 4 sets × 6-8 reps

## Safety
- Always warm up
- Use appropriate weight
- Maintain proper form
- Listen to your body
EOF

# Sample nutrition document
cat > $TEMP_DOC_DIR/nutrition/macronutrients.txt << 'EOF'
# Macronutrients Guide

## Protein
- Role: Builds and repairs muscle
- Target: 0.7-1g per lb of body weight
- Sources: Chicken, fish, eggs, dairy, legumes

## Carbohydrates
- Role: Provides energy
- Target: 2-4g per lb for muscle gain
- Sources: Rice, oats, bread, fruits, vegetables

## Fats
- Role: Hormone production
- Target: 0.3-0.5g per lb
- Sources: Nuts, oils, avocado, fatty fish

## Meal Timing
- Pre-workout: Carbs + Protein (30-60 min before)
- Post-workout: Protein + Carbs (within 2 hours)
EOF

# Sample health document
cat > $TEMP_DOC_DIR/health/injury_prevention.txt << 'EOF'
# Injury Prevention Guide

## Common Issues and Prevention

### Lower Back Pain
- Strengthen core
- Avoid heavy deadlifts with poor form
- Use proper posture

### Knee Pain
- Proper squat form
- Strengthen quads and glutes
- Avoid deep squats if painful

### Shoulder Pain
- Warm up rotator cuffs
- Balance push/pull exercises
- Don't go too heavy on bench

## Recovery
- Sleep 7-9 hours
- Eat adequate protein
- Stay hydrated
- Take active recovery days
EOF

# Upload documents to S3
echo "Uploading documents to S3..."
aws s3 sync $TEMP_DOC_DIR/workouts s3://$BUCKET_NAME/documents/workouts/
aws s3 sync $TEMP_DOC_DIR/nutrition s3://$BUCKET_NAME/documents/nutrition/
aws s3 sync $TEMP_DOC_DIR/health s3://$BUCKET_NAME/documents/health/
echo -e "${GREEN}✓ Documents uploaded${NC}"

# Step 4: Create Bedrock Knowledge Base
echo -e "\n${BLUE}Step 4: Creating Bedrock Knowledge Base...${NC}"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${IAM_ROLE_NAME}"
BUCKET_ARN="arn:aws:s3:::${BUCKET_NAME}"

# Check if KB already exists
KB_ID=$(aws bedrock-agent list-knowledge-bases --region $AWS_REGION \
    --query "knowledgeBaseSummaries[?name=='$KB_NAME'].id" \
    --output text 2>/dev/null || echo "")

if [ -z "$KB_ID" ]; then
    KB_RESPONSE=$(aws bedrock-agent create-knowledge-base \
        --name "$KB_NAME" \
        --description "$KB_DESCRIPTION" \
        --role-arn "$ROLE_ARN" \
        --knowledge-base-configuration "type=VECTOR,vectorKnowledgeBaseConfiguration={embeddingModel={provider=BEDROCK,modelIdentifier=amazon.titan-embed-text-v2:0}}" \
        --storage-configuration "type=S3,s3StorageConfiguration={bucketArn=$BUCKET_ARN}" \
        --region $AWS_REGION)
    
    KB_ID=$(echo $KB_RESPONSE | jq -r '.knowledgeBase.id')
    echo -e "${GREEN}✓ Created Knowledge Base: $KB_ID${NC}"
else
    echo -e "${GREEN}✓ Knowledge Base already exists: $KB_ID${NC}"
fi

# Step 5: Create Data Source
echo -e "\n${BLUE}Step 5: Creating Data Source...${NC}"

DS_RESPONSE=$(aws bedrock-agent create-data-source \
    --knowledge-base-id "$KB_ID" \
    --name "fitness-documents-datasource" \
    --description "Fitness and nutrition documents from S3" \
    --data-source-configuration "type=S3,s3DataSourceConfiguration={bucketArn=$BUCKET_ARN}" \
    --region $AWS_REGION 2>/dev/null || echo "{}")

DS_ID=$(echo $DS_RESPONSE | jq -r '.dataSource.id' 2>/dev/null)

if [ "$DS_ID" != "null" ] && [ -n "$DS_ID" ]; then
    echo -e "${GREEN}✓ Created Data Source: $DS_ID${NC}"
else
    echo -e "${BLUE}Note: Data source may already exist. Getting existing data source...${NC}"
    DS_ID=$(aws bedrock-agent list-data-sources \
        --knowledge-base-id "$KB_ID" \
        --region $AWS_REGION \
        --query "dataSourceSummaries[0].id" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$DS_ID" ]; then
        echo -e "${GREEN}✓ Using existing Data Source: $DS_ID${NC}"
    fi
fi

# Step 6: Sync Knowledge Base
echo -e "\n${BLUE}Step 6: Syncing Knowledge Base...${NC}"

if [ -n "$DS_ID" ] && [ "$DS_ID" != "None" ]; then
    INGESTION=$(aws bedrock-agent start-ingestion-job \
        --knowledge-base-id "$KB_ID" \
        --data-source-id "$DS_ID" \
        --region $AWS_REGION 2>/dev/null || echo "{}")
    
    JOB_ID=$(echo $INGESTION | jq -r '.ingestionJob.ingestionJobId' 2>/dev/null)
    
    if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
        echo -e "${GREEN}✓ Started ingestion job: $JOB_ID${NC}"
        echo -e "${BLUE}Note: Ingestion may take a few minutes. Check status with:${NC}"
        echo "aws bedrock-agent get-ingestion-job --knowledge-base-id $KB_ID --data-source-id $DS_ID --ingestion-job-id $JOB_ID --region $AWS_REGION"
    else
        echo -e "${BLUE}Note: Ingestion already running or scheduled${NC}"
    fi
else
    echo -e "${RED}⚠ Could not sync - data source ID not available${NC}"
fi

# Step 7: Create .env file
echo -e "\n${BLUE}Step 7: Creating .env file...${NC}"

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_KEY>

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_KNOWLEDGE_BASE_ID=$KB_ID

# S3 Configuration
DOCUMENT_BUCKET_NAME=$BUCKET_NAME
S3_DOCUMENT_PREFIX=documents/

# RAG Settings
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=100
RAG_MAX_RESULTS=5

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_coach

# Security
SECRET_KEY=your-secret-key-minimum-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=INFO
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${RED}⚠ Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env${NC}"
else
    echo -e "${BLUE}Note: .env already exists. Update the following values:${NC}"
    echo "  BEDROCK_KNOWLEDGE_BASE_ID=$KB_ID"
    echo "  DOCUMENT_BUCKET_NAME=$BUCKET_NAME"
    echo "  AWS_ACCESS_KEY_ID=<YOUR_KEY>"
    echo "  AWS_SECRET_ACCESS_KEY=<YOUR_KEY>"
fi

# Summary
echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "\n${BLUE}Configuration Summary:${NC}"
echo "  Account ID: $ACCOUNT_ID"
echo "  Region: $AWS_REGION"
echo "  IAM Role: $IAM_ROLE_NAME"
echo "  S3 Bucket: s3://$BUCKET_NAME"
echo "  Knowledge Base ID: $KB_ID"
echo "  Knowledge Base Name: $KB_NAME"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update .env with AWS credentials"
echo "2. Install Python dependencies: pip install -r requirements.txt"
echo "3. Run backend: python main.py"
echo "4. Test RAG endpoints"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "  Check ingestion status:"
echo "  aws bedrock-agent list-ingestion-jobs --knowledge-base-id $KB_ID --region $AWS_REGION"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  See RAG_IMPLEMENTATION_GUIDE.md for detailed instructions"
echo "  See RAG_EXAMPLES.py for code examples"

# Cleanup
rm -f /tmp/trust-policy.json /tmp/inline-policy.json
