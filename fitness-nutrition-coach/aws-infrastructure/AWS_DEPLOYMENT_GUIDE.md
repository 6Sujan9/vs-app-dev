# 🚀 AWS Deployment Guide - Complete Production Setup

**AI Fitness & Nutrition Coach on AWS**

Deploy your complete system: Frontend → Backend → Database → Bedrock AI

---

## 📋 Overview

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                       │
│                    (Caching & Distribution)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │   S3   │          │  ALB   │          │ Route  │
    │Frontend│          │Backend │          │  53    │
    └────────┘          │ Nginx  │          │  DNS   │
                        └───┬────┘          └────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │  EC2   │          │  RDS   │          │   S3   │
    │Backend │          │Database│          │Docs/KB │
    │(Python)│          │ PG SQL │          │(Files) │
    └────────┘          └────────┘          └────────┘
        │
        └──────────┬──────────┬──────────┐
                   │          │          │
                   ▼          ▼          ▼
            ┌──────────┐  ┌──────┐  ┌────────┐
            │ Bedrock  │  │ Role │  │CloudWatch
            │ Claude 3 │  │ IAM  │  │Logs
            └──────────┘  └──────┘  └────────┘
```

### Components
| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend | S3 + CloudFront | React app hosting & CDN |
| Backend | EC2 + ALB | FastAPI application |
| Database | RDS (PostgreSQL) | User data, plans, history |
| Storage | S3 | Knowledge base documents |
| AI | Amazon Bedrock | Claude 3 Sonnet API |
| DNS | Route 53 | Domain management |
| Logging | CloudWatch | Monitoring & debugging |
| Security | IAM + VPC | Access control |

---

## 🎯 Deployment Paths

### Path 1: Lambda Backend (Serverless)
**Best for:** Low traffic, cost-conscious, simple API  
**Setup time:** 30 minutes  
**Monthly cost:** ~$10-50  
**Trade-off:** 15-second cold start

### Path 2: EC2 Backend (Recommended)
**Best for:** Production, predictable traffic, full control  
**Setup time:** 45 minutes  
**Monthly cost:** ~$50-100  
**Trade-off:** Must manage server

**We'll cover EC2 (Recommended) + optional Lambda serverless option**

---

## 🔧 Pre-Deployment Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed & configured
- [ ] Docker installed (for local testing)
- [ ] Domain name purchased (optional, can use Route 53)
- [ ] SSL certificate ready (or use ACM)
- [ ] Bedrock Knowledge Base created
- [ ] S3 bucket for knowledge base documents
- [ ] Environment variables prepared
- [ ] Git repository (for CI/CD)

---

## 📊 Deployment Options Summary

| Feature | Lambda | EC2 |
|---------|--------|-----|
| Setup time | 20 min | 45 min |
| Cold start | 10-15s | Instant |
| Monthly cost | $10-50 | $50-100 |
| Auto-scaling | Built-in | Manual/ASG |
| Database | RDS | RDS |
| Best for | Dev/Low traffic | Production |

---

## Part 1: Frontend Deployment (S3 + CloudFront)

### Step 1a: Build Frontend
```bash
cd frontend
npm run build
# Creates: frontend/build/ folder
```

### Step 1b: Create S3 Bucket
```bash
AWS_REGION="us-east-1"
BUCKET_NAME="fitness-coach-$(date +%s)"

aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Block public access but allow CloudFront
aws s3api put-bucket-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 1c: Upload Files to S3
```bash
aws s3 sync frontend/build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

# Cache-control for index.html (always check for updates)
aws s3 cp frontend/build/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
  --content-type "text/html"
```

### Step 1d: Create CloudFront Distribution
```bash
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "fitness-coach-$(date +%s)",
  "Comment": "Fitness Coach Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "fitness-coach-s3",
        "DomainName": "BUCKET_NAME.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "fitness-coach-s3",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CacheBehaviors": [
    {
      "PathPattern": "/index.html",
      "TargetOriginId": "fitness-coach-s3",
      "ViewerProtocolPolicy": "redirect-to-https",
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": { "Forward": "none" }
      },
      "MinTTL": 0,
      "DefaultTTL": 0,
      "MaxTTL": 0
    }
  ]
}
EOF

# Create distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### Result
✅ Frontend available at CloudFront domain (e.g., `d1234567.cloudfront.net`)

---

## Part 2: Backend Deployment (EC2 + ALB)

### Step 2a: Create EC2 Instance
```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name fitness-coach-sg \
  --description "Fitness Coach Backend" \
  --query 'GroupId' \
  --output text)

# Allow SSH, HTTP, HTTPS, Database
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8000 --cidr 0.0.0.0/0

# Launch instance (t3.medium = 2vCPU, 4GB RAM, ~$30/month)
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --security-group-ids $SG_ID \
  --key-name fitness-coach-key \
  --user-data file://user-data.sh \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"
```

### Step 2b: User Data Script (user-data.sh)
```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Install AWS CLI
apt-get install -y awscli

# Create app directory
mkdir -p /opt/fitness-coach
cd /opt/fitness-coach

# Clone backend code (or upload via S3)
# git clone <your-repo> .

# Create .env file
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/fitness_coach
BEDROCK_REGION=us-east-1
BEDROCK_MODEL=claude-3-sonnet-20240229-v1:0
KNOWLEDGE_BASE_ID=XXXXX
S3_BUCKET=fitness-coach-kb
JWT_SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=production
LOG_LEVEL=info
ENVEOF

# Pull Docker image and run
docker-compose up -d
```

### Step 2c: Docker Setup (backend/docker-compose.yml)
```yaml
version: '3.8'

services:
  backend:
    image: fitness-coach-backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BEDROCK_REGION=${BEDROCK_REGION}
      - BEDROCK_MODEL=${BEDROCK_MODEL}
      - KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - ENVIRONMENT=production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### Step 2d: Create Application Load Balancer
```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name fitness-coach-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups $SG_ID \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name fitness-coach-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Register target
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID,Port=8000

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Result
✅ Backend available at ALB DNS (e.g., `fitness-coach-alb-xxx.elb.amazonaws.com`)

---

## Part 3: Database Deployment (RDS)

### Step 3a: Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier fitness-coach-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password $(openssl rand -base64 20) \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --multi-az \
  --vpc-security-group-ids $SG_ID \
  --enable-cloudwatch-logs-exports postgresql
```

### Step 3b: Verify Connection
```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier fitness-coach-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Test connection
psql -h $RDS_ENDPOINT -U admin -d fitness_coach
```

### Step 3c: Run Migrations
```bash
cd backend
export DATABASE_URL="postgresql://admin:password@$RDS_ENDPOINT:5432/fitness_coach"
python -m alembic upgrade head
```

### Result
✅ Database running, migrations applied

---

## Part 4: S3 Knowledge Base Setup

### Step 4a: Create Knowledge Base Bucket
```bash
aws s3 mb s3://fitness-coach-kb-$(date +%s)

# Upload documents
aws s3 sync knowledge-base/ s3://fitness-coach-kb/ \
  --include "*.pdf" \
  --include "*.txt" \
  --include "*.md"

# Set lifecycle policy for old documents
aws s3api put-bucket-lifecycle-configuration \
  --bucket fitness-coach-kb \
  --lifecycle-configuration file://lifecycle.json
```

### Step 4b: Create Bedrock Knowledge Base
```bash
aws bedrock-agent-runtime create-knowledge-base \
  --name fitness-coach-kb \
  --description "Fitness and nutrition documents" \
  --knowledge-base-configuration file://kb-config.json
```

### Result
✅ Knowledge base ready for RAG retrieval

---

## Part 5: Bedrock Setup

### Step 5a: Enable Bedrock Model Access
```bash
# Request access to Claude 3 model
aws bedrock-runtime get-foundation-model-availability \
  --model-identifier claude-3-sonnet-20240229-v1:0

# If not available, request access via AWS Console
```

### Step 5b: Create IAM Role for Backend
```bash
cat > bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agent-runtime:RetrieveAndGenerate",
        "bedrock-agent-runtime:Retrieve"
      ],
      "Resource": "arn:aws:bedrock:us-east-1:*:knowledge-base/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name fitness-coach-role \
  --policy-name bedrock-access \
  --policy-document file://bedrock-policy.json
```

### Result
✅ Bedrock ready for API calls

---

## Part 6: Environment Variables

### Step 6a: Create .env File
```bash
# Database
DATABASE_URL=postgresql://admin:PASSWORD@fitness-coach-db.xxxxx.rds.amazonaws.com:5432/fitness_coach
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Bedrock & RAG
BEDROCK_REGION=us-east-1
BEDROCK_MODEL=claude-3-sonnet-20240229-v1:0
KNOWLEDGE_BASE_ID=YOUR_KB_ID
S3_BUCKET=fitness-coach-kb
S3_REGION=us-east-1

# Frontend
FRONTEND_URL=https://d1234567.cloudfront.net
CORS_ORIGINS=https://d1234567.cloudfront.net

# Security
JWT_SECRET_KEY=YOUR_SECURE_SECRET_KEY
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Logging
LOG_LEVEL=info
ENVIRONMENT=production

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### Step 6b: Store in AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name fitness-coach/env \
  --description "Environment variables" \
  --secret-string file://.env
```

### Step 6c: Reference in EC2
```bash
# In user-data.sh
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id fitness-coach/env \
  --query SecretString \
  --output text)

echo "$SECRET" > /opt/fitness-coach/.env
```

---

## Part 7: Security Best Practices

### 7a: Network Security
- [x] Security groups restricted to necessary ports
- [x] Database in private subnet (no direct internet access)
- [x] ALB in public subnet, EC2 in private subnet
- [x] RDS backup enabled + multi-AZ
- [x] VPC Flow Logs enabled

```bash
# Enable VPC Flow Logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-xxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/fitness-coach
```

### 7b: API Security
- [x] HTTPS enforced (ALB redirect HTTP→HTTPS)
- [x] CORS configured (only frontend domain)
- [x] Rate limiting enabled
- [x] Input validation at backend
- [x] SQL injection prevention (ORM)

```bash
# SSL Certificate (use ACM)
aws acm request-certificate \
  --domain-name fitness-coach.example.com \
  --validation-method DNS
```

### 7c: IAM Security
- [x] EC2 role has minimal permissions
- [x] Database credentials in Secrets Manager
- [x] API keys not in code
- [x] CloudTrail enabled for audit

```bash
# Enable CloudTrail
aws cloudtrail create-trail \
  --name fitness-coach-trail \
  --s3-bucket-name fitness-coach-logs
```

### 7d: Data Security
- [x] Database encryption at rest
- [x] S3 encryption enabled
- [x] Backups encrypted
- [x] Sensitive fields not logged

```bash
# Enable RDS encryption
aws rds modify-db-instance \
  --db-instance-identifier fitness-coach-db \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:region:account:key/key-id
```

---

## Part 8: Monitoring & Logging

### 8a: CloudWatch Setup
```bash
# Create log group
aws logs create-log-group --log-group-name /aws/fitness-coach

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/fitness-coach \
  --retention-in-days 30
```

### 8b: Create Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-db-connections \
  --alarm-description "Alert when connections > 80" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 8c: Application Logging
```python
# In backend (main.py)
import logging
from pythonjsonlogger import jsonlogger

# JSON logs for CloudWatch
logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
```

---

## Part 9: CI/CD Pipeline (GitHub Actions)

### Step 9a: Create GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build frontend
        run: cd frontend && npm install && npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/build/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DIST_ID }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: |
          docker build -t fitness-coach:${{ github.sha }} backend/
          docker tag fitness-coach:${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/fitness-coach:latest
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}/fitness-coach:latest
      
      - name: Deploy to EC2
        run: |
          # SSH into EC2 and pull latest image
          ssh -i ${{ secrets.EC2_KEY }} ec2-user@${{ secrets.EC2_HOST }} << 'EOF'
          cd /opt/fitness-coach
          docker-compose pull
          docker-compose up -d
          EOF
```

### Step 9b: Add GitHub Secrets
```bash
# In GitHub repo settings → Secrets
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=fitness-coach-frontend
CF_DIST_ID=ABCDEFG1234567
ECR_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com
EC2_HOST=fitness-coach-backend.example.com
EC2_KEY=<EC2_PRIVATE_KEY>
```

---

## Part 10: Cost Optimization

### Monthly Cost Breakdown
```
EC2 (t3.medium)           ~$30
RDS (db.t3.micro)         ~$18
S3 (100GB)                ~$2-3
CloudFront               ~$5-10
Bedrock (1M tokens)      ~$3
Other (ALB, NAT)         ~$20
────────────────────────────
TOTAL                    ~$80-85
```

### Optimization Tips
```
1. Use Reserved Instances (33% savings)
   aws ec2 purchase-reserved-instances --reserved-instances-offering-id xxx

2. Use Spot Instances for batch processing (70% savings)
   
3. Enable S3 Intelligent-Tiering
   aws s3api put-bucket-intelligent-tiering-configuration ...

4. Use RDS Read Replicas for scaling
   aws rds create-db-instance-read-replica ...

5. Implement caching (Redis)
   ElastiCache (redis): ~$15/month

6. Monitor via Cost Explorer
   aws ce get-cost-and-usage ...
```

---

## Part 11: Troubleshooting

### Common Issues

**Frontend not loading**
```bash
# Check S3 bucket
aws s3 ls s3://fitness-coach/

# Check CloudFront distribution
aws cloudfront get-distribution-config --id DIST_ID

# Clear cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

**Backend not responding**
```bash
# Check EC2 instance
aws ec2 describe-instances --instance-ids i-xxx

# Check Docker container
ssh -i key.pem ec2-user@instance-ip
docker ps
docker logs fitness-coach-backend

# Check ALB health
aws elbv2 describe-target-health --target-group-arn arn:aws:...
```

**Database connection errors**
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier fitness-coach-db

# Test connection
psql -h fitness-coach-db.xxx.rds.amazonaws.com -U admin -d fitness_coach

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxx
```

**Bedrock API errors**
```bash
# Check model access
aws bedrock-runtime list-foundation-models

# Check IAM role
aws iam get-role-policy --role-name fitness-coach-role --policy-name bedrock-access

# Test API call
aws bedrock-runtime invoke-model \
  --model-id claude-3-sonnet-20240229-v1:0 \
  --body '{"prompt":"test"}'
```

---

## Part 12: Scaling for Production

### Auto-Scaling
```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name fitness-coach-asg \
  --launch-template LaunchTemplateName=fitness-coach,Version='$Latest' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3 \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

### Caching
```bash
# Add ElastiCache (Redis)
aws elasticache create-cache-cluster \
  --cache-cluster-id fitness-coach-cache \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

### Content Delivery
- CloudFront: ✅ Already configured
- S3 Transfer Acceleration: $0.04 per GB
- Lambda@Edge: Run code at CloudFront edges

---

## ✅ Deployment Checklist

- [ ] AWS account with permissions
- [ ] Frontend built: `npm run build`
- [ ] S3 bucket created and populated
- [ ] CloudFront distribution created
- [ ] EC2 instance running
- [ ] RDS database created
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Bedrock Knowledge Base created
- [ ] IAM roles configured
- [ ] SSL certificate applied
- [ ] ALB health check passing
- [ ] Frontend-backend connection working
- [ ] Bedrock API calls working
- [ ] CloudWatch alarms set
- [ ] Backups configured
- [ ] CI/CD pipeline set up
- [ ] Monitoring dashboards created
- [ ] Load testing performed
- [ ] Security audit completed

---

## 🎯 Next Steps

1. **Start with Frontend**: S3 + CloudFront deployment (15 min)
2. **Deploy Backend**: EC2 + ALB setup (30 min)
3. **Setup Database**: RDS + migrations (15 min)
4. **Configure AI**: Bedrock + Knowledge Base (15 min)
5. **Test Integration**: Run end-to-end tests
6. **Setup Monitoring**: CloudWatch + alarms
7. **Implement CI/CD**: GitHub Actions workflow
8. **Optimize Costs**: Reserved instances, caching
9. **Scale for Load**: Auto-scaling, read replicas
10. **Go Live**: DNS update, smoke testing

---

## 📞 Support

Refer to:
- [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) - Detailed architecture
- [AWS_INFRASTRUCTURE.md](AWS_INFRASTRUCTURE.md) - IaC templates
- [SECURITY_BEST_PRACTICES.md](SECURITY_BEST_PRACTICES.md) - Security guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Production Ready

