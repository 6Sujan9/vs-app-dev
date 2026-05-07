@echo off
REM AWS RAG Setup Script for Fitness Coach (Windows)
REM This script automates AWS infrastructure setup for RAG

setlocal enabledelayedexpansion

REM Configuration
set AWS_REGION=us-east-1
set KB_NAME=fitness-knowledge-base
set KB_DESCRIPTION=Knowledge base for AI Fitness Coach with RAG
set IAM_ROLE_NAME=BedrockFitnessRole

REM Generate bucket name with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BUCKET_NAME=fitness-documents-%mydate%%mytime%

echo.
echo === AWS RAG Setup for Fitness Coach ===
echo.

REM Get Account ID
echo Getting AWS Account ID...
for /f %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo Account ID: %ACCOUNT_ID%

REM Step 1: Create IAM Role
echo.
echo Step 1: Creating IAM Role...

aws iam get-role --role-name %IAM_ROLE_NAME% >nul 2>&1
if %errorlevel%==0 (
    echo ✓ IAM Role already exists
) else (
    echo Creating new IAM Role...
    
    REM Create trust policy
    (
        echo {
        echo   "Version": "2012-10-17",
        echo   "Statement": [
        echo     {
        echo       "Effect": "Allow",
        echo       "Principal": {
        echo         "Service": "bedrock.amazonaws.com"
        echo       },
        echo       "Action": "sts:AssumeRole"
        echo     }
        echo   ]
        echo }
    ) > trust-policy.json
    
    aws iam create-role ^
        --role-name %IAM_ROLE_NAME% ^
        --assume-role-policy-document file://trust-policy.json ^
        --region %AWS_REGION%
    
    echo ✓ Created IAM Role
    del trust-policy.json
)

REM Add inline policy
echo Adding inline policy...
(
    echo {
    echo   "Version": "2012-10-17",
    echo   "Statement": [
    echo     {
    echo       "Effect": "Allow",
    echo       "Action": [
    echo         "s3:GetObject",
    echo         "s3:ListBucket"
    echo       ],
    echo       "Resource": [
    echo         "arn:aws:s3:::!BUCKET_NAME!",
    echo         "arn:aws:s3:::!BUCKET_NAME!/*"
    echo       ]
    echo     },
    echo     {
    echo       "Effect": "Allow",
    echo       "Action": [
    echo         "bedrock:InvokeModel",
    echo         "bedrock:InvokeModelWithResponseStream"
    echo       ],
    echo       "Resource": "arn:aws:bedrock:%AWS_REGION%::foundation-model/*"
    echo     },
    echo     {
    echo       "Effect": "Allow",
    echo       "Action": [
    echo         "bedrock-agent:Retrieve"
    echo       ],
    echo       "Resource": "*"
    echo     }
    echo   ]
    echo }
) > inline-policy.json

aws iam put-role-policy ^
    --role-name %IAM_ROLE_NAME% ^
    --policy-name BedrockFitnessPolicy ^
    --policy-document file://inline-policy.json

echo ✓ Added inline policy
del inline-policy.json

REM Step 2: Create S3 Bucket
echo.
echo Step 2: Creating S3 Bucket...

aws s3 ls s3://%BUCKET_NAME% >nul 2>&1
if %errorlevel%==0 (
    echo ✓ S3 Bucket already exists: s3://%BUCKET_NAME%
) else (
    aws s3 mb s3://%BUCKET_NAME% --region %AWS_REGION%
    echo ✓ Created S3 Bucket: s3://%BUCKET_NAME%
)

REM Step 3: Create folder structure and upload sample documents
echo.
echo Step 3: Creating and uploading sample documents...

if not exist "temp_docs" mkdir temp_docs
if not exist "temp_docs\workouts" mkdir temp_docs\workouts
if not exist "temp_docs\nutrition" mkdir temp_docs\nutrition
if not exist "temp_docs\health" mkdir temp_docs\health

REM Create sample workout document
(
    echo # Strength Training Guide
    echo.
    echo ## Overview
    echo Strength training builds muscle and increases metabolism. It's essential for overall health and fitness.
    echo.
    echo ## Key Principles
    echo 1. Progressive Overload - gradually increase weight/reps
    echo 2. Proper Form - quality over quantity
    echo 3. Adequate Recovery - rest 48 hours between same muscle groups
    echo 4. Consistency - train 3-4 days per week
    echo.
    echo ## Basic Exercises
    echo - Squats: 4 sets × 6-8 reps
    echo - Deadlifts: 4 sets × 5-8 reps
    echo - Bench Press: 4 sets × 6-8 reps
    echo - Rows: 4 sets × 6-8 reps
    echo.
    echo ## Safety
    echo - Always warm up
    echo - Use appropriate weight
    echo - Maintain proper form
    echo - Listen to your body
) > temp_docs\workouts\strength_training.txt

REM Create sample nutrition document
(
    echo # Macronutrients Guide
    echo.
    echo ## Protein
    echo - Role: Builds and repairs muscle
    echo - Target: 0.7-1g per lb of body weight
    echo - Sources: Chicken, fish, eggs, dairy, legumes
    echo.
    echo ## Carbohydrates
    echo - Role: Provides energy
    echo - Target: 2-4g per lb for muscle gain
    echo - Sources: Rice, oats, bread, fruits, vegetables
    echo.
    echo ## Fats
    echo - Role: Hormone production
    echo - Target: 0.3-0.5g per lb
    echo - Sources: Nuts, oils, avocado, fatty fish
) > temp_docs\nutrition\macronutrients.txt

REM Create sample health document
(
    echo # Injury Prevention Guide
    echo.
    echo ## Common Issues and Prevention
    echo.
    echo ### Lower Back Pain
    echo - Strengthen core
    echo - Avoid heavy deadlifts with poor form
    echo - Use proper posture
    echo.
    echo ### Knee Pain
    echo - Proper squat form
    echo - Strengthen quads and glutes
    echo - Avoid deep squats if painful
) > temp_docs\health\injury_prevention.txt

REM Upload to S3
echo Uploading documents...
aws s3 sync temp_docs\workouts s3://%BUCKET_NAME%/documents/workouts/
aws s3 sync temp_docs\nutrition s3://%BUCKET_NAME%/documents/nutrition/
aws s3 sync temp_docs\health s3://%BUCKET_NAME%/documents/health/

echo ✓ Documents uploaded
rmdir /s /q temp_docs

REM Step 4: Create Bedrock Knowledge Base
echo.
echo Step 4: Creating Bedrock Knowledge Base...

set ROLE_ARN=arn:aws:iam::%ACCOUNT_ID%:role/%IAM_ROLE_NAME%
set BUCKET_ARN=arn:aws:s3:::%BUCKET_NAME%

aws bedrock-agent create-knowledge-base ^
    --name "%KB_NAME%" ^
    --description "%KB_DESCRIPTION%" ^
    --role-arn "%ROLE_ARN%" ^
    --knowledge-base-configuration type=VECTOR,vectorKnowledgeBaseConfiguration={embeddingModel={provider=BEDROCK,modelIdentifier=amazon.titan-embed-text-v2:0}} ^
    --storage-configuration type=S3,s3StorageConfiguration={bucketArn=%BUCKET_ARN%} ^
    --region %AWS_REGION% > kb_response.json

for /f "tokens=*" %%i in ('jq -r ".knowledgeBase.id" kb_response.json') do set KB_ID=%%i
echo ✓ Created Knowledge Base: %KB_ID%
del kb_response.json

REM Step 5: Create Data Source
echo.
echo Step 5: Creating Data Source...

aws bedrock-agent create-data-source ^
    --knowledge-base-id "%KB_ID%" ^
    --name "fitness-documents-datasource" ^
    --description "Fitness and nutrition documents from S3" ^
    --data-source-configuration type=S3,s3DataSourceConfiguration={bucketArn=%BUCKET_ARN%} ^
    --region %AWS_REGION% > ds_response.json

for /f "tokens=*" %%i in ('jq -r ".dataSource.id" ds_response.json') do set DS_ID=%%i
echo ✓ Created Data Source: %DS_ID%
del ds_response.json

REM Step 6: Sync Knowledge Base
echo.
echo Step 6: Syncing Knowledge Base...

aws bedrock-agent start-ingestion-job ^
    --knowledge-base-id "%KB_ID%" ^
    --data-source-id "%DS_ID%" ^
    --region %AWS_REGION% > ingestion_response.json

for /f "tokens=*" %%i in ('jq -r ".ingestionJob.ingestionJobId" ingestion_response.json') do set JOB_ID=%%i
echo ✓ Started ingestion job: %JOB_ID%
del ingestion_response.json

REM Step 7: Create .env file
echo.
echo Step 7: Creating .env file...

if not exist ".env" (
    (
        echo # AWS Configuration
        echo AWS_REGION=%AWS_REGION%
        echo AWS_ACCESS_KEY_ID=^<YOUR_ACCESS_KEY^>
        echo AWS_SECRET_ACCESS_KEY=^<YOUR_SECRET_KEY^>
        echo.
        echo # Bedrock Configuration
        echo BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
        echo BEDROCK_KNOWLEDGE_BASE_ID=%KB_ID%
        echo.
        echo # S3 Configuration
        echo DOCUMENT_BUCKET_NAME=%BUCKET_NAME%
        echo S3_DOCUMENT_PREFIX=documents/
        echo.
        echo # RAG Settings
        echo RAG_CHUNK_SIZE=1000
        echo RAG_CHUNK_OVERLAP=100
        echo RAG_MAX_RESULTS=5
        echo.
        echo # Database
        echo DATABASE_URL=postgresql://user:password@localhost:5432/fitness_coach
        echo.
        echo # Security
        echo SECRET_KEY=your-secret-key-minimum-32-characters
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo REFRESH_TOKEN_EXPIRE_DAYS=7
        echo.
        echo # CORS
        echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
        echo.
        echo # Logging
        echo LOG_LEVEL=INFO
    ) > .env
    echo ✓ Created .env file
) else (
    echo Note: .env already exists
)

REM Summary
echo.
echo === Setup Complete ===
echo.
echo Configuration Summary:
echo   Account ID: %ACCOUNT_ID%
echo   Region: %AWS_REGION%
echo   IAM Role: %IAM_ROLE_NAME%
echo   S3 Bucket: s3://%BUCKET_NAME%
echo   Knowledge Base ID: %KB_ID%
echo   Knowledge Base Name: %KB_NAME%
echo.
echo Next Steps:
echo 1. Update .env with AWS credentials
echo 2. Install Python dependencies: pip install -r requirements.txt
echo 3. Run backend: python main.py
echo 4. Test RAG endpoints
echo.
echo Monitoring:
echo   Check ingestion status:
echo   aws bedrock-agent list-ingestion-jobs --knowledge-base-id %KB_ID% --region %AWS_REGION%
echo.
echo Documentation:
echo   See RAG_IMPLEMENTATION_GUIDE.md for detailed instructions
echo   See RAG_EXAMPLES.py for code examples
echo.

endlocal
