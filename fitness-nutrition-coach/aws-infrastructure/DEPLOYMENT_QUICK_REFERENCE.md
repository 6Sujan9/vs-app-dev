# AWS Deployment - Quick Reference

**5-Minute Quick Start Guide**

---

## 🚀 Pre-Flight Checklist (5 minutes)

```bash
# 1. Install AWS CLI
aws --version
# Expected: aws-cli/2.x

# 2. Configure AWS credentials
aws configure
# Enter: AWS Access Key ID
#        AWS Secret Access Key
#        Default region: us-east-1
#        Default output: json

# 3. Verify access
aws s3 ls
# Should show your S3 buckets
```

---

## 📦 Deployment Steps (45 minutes total)

### Step 1: Frontend Deployment (15 min)

```bash
# Build
cd frontend
npm run build

# Create S3 bucket
BUCKET_NAME="fitness-coach-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Upload files
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Get bucket URL
echo "Frontend URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

# (Optional) Create CloudFront distribution
# Use AWS Console or cloudfront-config.json from deployment guide
```

### Step 2: Database Setup (10 min)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier fitness-coach-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password $(openssl rand -base64 20) \
  --allocated-storage 20

# Wait for creation (5 min)
aws rds wait db-instance-available \
  --db-instance-identifier fitness-coach-db

# Get endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier fitness-coach-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database: $RDS_ENDPOINT"

# Run migrations
cd backend
DATABASE_URL="postgresql://admin:PASSWORD@$RDS_ENDPOINT:5432/fitness_coach" \
python -m alembic upgrade head
```

### Step 3: Backend Deployment (15 min)

```bash
# Create EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name fitness-coach-key \
  --query 'Instances[0].InstanceId' \
  --output text)

# Wait for instance
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Backend IP: $PUBLIC_IP"

# SSH and deploy
ssh -i fitness-coach-key.pem ec2-user@$PUBLIC_IP << 'EOF'
cd /opt/fitness-coach
docker-compose up -d
docker ps  # Verify container running
EOF

# Get ALB URL
# ALB_URL=$(aws elbv2 describe-load-balancers ...)
# echo "Backend URL: $ALB_URL"
```

### Step 4: Bedrock Setup (5 min)

```bash
# Check model access
aws bedrock-runtime list-foundation-models \
  | grep claude-3-sonnet

# Test API call
aws bedrock-runtime invoke-model \
  --model-id claude-3-sonnet-20240229-v1:0 \
  --body '{"prompt":"test"}' \
  --content-type application/json

# Create Knowledge Base
# (Use AWS Console for simplicity)
```

---

## 🧪 Testing

### Verify Deployment
```bash
# Frontend
curl -I https://d1234567.cloudfront.net/
# Expected: HTTP 200

# Backend
curl -X POST http://alb-url/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
# Expected: HTTP 200

# Database
psql -h $RDS_ENDPOINT -U admin -d fitness_coach -c "SELECT version();"
# Expected: PostgreSQL version

# Bedrock
python test_integration.py
# Expected: All tests pass ✓
```

---

## 📊 Environment Variables

### Create .env file
```bash
# Backend configuration
cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://admin:PASSWORD@RDS_ENDPOINT:5432/fitness_coach
DATABASE_POOL_SIZE=20

# AWS
BEDROCK_REGION=us-east-1
BEDROCK_MODEL=claude-3-sonnet-20240229-v1:0
KNOWLEDGE_BASE_ID=YOUR_KB_ID
S3_BUCKET=fitness-coach-kb

# Security
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256

# Frontend
FRONTEND_URL=https://d1234567.cloudfront.net
CORS_ORIGINS=https://d1234567.cloudfront.net

# Monitoring
LOG_LEVEL=info
ENVIRONMENT=production
EOF

# Store in Secrets Manager
aws secretsmanager create-secret \
  --name fitness-coach/env \
  --secret-string file://backend/.env
```

---

## 🔗 Connectivity Test

### Frontend to Backend
```bash
# 1. Get backend URL (ALB DNS)
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# 2. Update frontend .env
echo "REACT_APP_API_URL=http://$ALB_DNS" > frontend/.env

# 3. Rebuild frontend
cd frontend && npm run build

# 4. Upload to S3
aws s3 sync build/ s3://$BUCKET_NAME --delete

# 5. Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# 6. Test from browser
# Frontend should communicate with Backend ✓
```

### Backend to Database
```bash
# SSH into EC2
ssh -i fitness-coach-key.pem ec2-user@$PUBLIC_IP

# Inside EC2:
docker exec fitness-coach-backend \
  python -c "from app.database import engine; \
             print(engine.connect())"

# Expected: <Connection object>
```

### Backend to Bedrock
```bash
# SSH into EC2
ssh -i fitness-coach-key.pem ec2-user@$PUBLIC_IP

# Test Bedrock connection
docker exec fitness-coach-backend \
  python -c "import boto3; \
             client = boto3.client('bedrock-runtime'); \
             print(client.list_foundation_models())"

# Expected: Model list
```

---

## 📋 Common Commands

### View Logs
```bash
# CloudWatch logs (backend)
aws logs tail /aws/fitness-coach --follow

# EC2 instance logs
ssh -i key.pem ec2-user@IP
docker logs -f fitness-coach-backend

# RDS slow query log
aws rds download-db-log-file-portion \
  --db-instance-identifier fitness-coach-db \
  --log-file-name error/postgresql.log
```

### Monitor Metrics
```bash
# EC2 CPU
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=$INSTANCE_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=fitness-coach-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Scale Resources
```bash
# Increase EC2 instance size
aws ec2 modify-instance-attribute \
  --instance-id $INSTANCE_ID \
  --instance-type "{\"Value\": \"t3.large\"}"

# Note: Requires instance stop/start

# Increase RDS instance
aws rds modify-db-instance \
  --db-instance-identifier fitness-coach-db \
  --db-instance-class db.t3.small \
  --apply-immediately

# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier fitness-coach-db-replica \
  --source-db-instance-identifier fitness-coach-db
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Frontend won't load** | Check S3 bucket public access; verify CloudFront origin |
| **API returns 502 Bad Gateway** | Check EC2 backend health; verify security group rules |
| **Database connection refused** | Check RDS security group; verify credentials |
| **Bedrock API errors** | Check IAM role permissions; verify model access |
| **High latency (>5sec)** | Check ALB target health; verify RDS performance |
| **High costs** | Check for unattached resources; enable auto-scaling |

---

## 💰 Cost Optimization

### Monthly Cost
```
EC2 (t3.medium):      $30
RDS (db.t3.micro):    $18
S3 + CloudFront:      $10
Bedrock (1M tokens):  $3
Other (ALB, logs):    $20
──────────────────────────
TOTAL:                $81
```

### Optimization
```bash
# 1. Use Reserved Instances (33% savings)
aws ec2 purchase-reserved-instances \
  --reserved-instances-offering-id xxxxx

# 2. Enable auto-scaling (pay only for usage)
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name fitness-coach-asg \
  --launch-template LaunchTemplateName=fitness-coach

# 3. Use S3 Intelligent-Tiering
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket fitness-coach-kb \
  --id auto-tiering \
  --intelligent-tiering-configuration ...

# 4. Monitor costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads ✓
- [ ] Backend responds ✓
- [ ] Database connected ✓
- [ ] Bedrock API works ✓
- [ ] Integration tests pass ✓
- [ ] CloudWatch alarms set ✓
- [ ] Backups configured ✓
- [ ] Logs being collected ✓
- [ ] SSL certificate applied ✓
- [ ] DNS pointing to CloudFront ✓

---

## 📞 Support Resources

| Resource | Purpose |
|----------|---------|
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | Full step-by-step guide |
| [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) | Architecture diagrams |
| [SECURITY_BEST_PRACTICES.md](SECURITY_BEST_PRACTICES.md) | Security configuration |
| [AWS CLI Documentation](https://docs.aws.amazon.com/cli/) | Command reference |
| [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/) | AI/ML setup |

---

## 🎯 Next Steps

1. **Deploy Frontend**: 5 minutes
2. **Deploy Database**: 10 minutes
3. **Deploy Backend**: 15 minutes
4. **Setup Bedrock**: 5 minutes
5. **Test Integration**: 10 minutes
6. **Monitor & Optimize**: Ongoing

**Total Time: ~45 minutes**

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Ready for Deployment

