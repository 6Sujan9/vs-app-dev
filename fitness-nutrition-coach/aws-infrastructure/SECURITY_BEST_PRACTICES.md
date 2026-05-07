# AWS Deployment - Security Best Practices

**Complete Security Configuration & Guidelines**

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────┐
│           Application Security (Layer 7)            │
├─────────────────────────────────────────────────────┤
│ ✓ Input validation (FastAPI Pydantic)              │
│ ✓ Output encoding (JSON safe)                      │
│ ✓ Rate limiting (10 req/min)                       │
│ ✓ CORS configuration                               │
│ ✓ Error handling (no stack traces)                 │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│          Authentication & Authorization              │
├─────────────────────────────────────────────────────┤
│ ✓ JWT token validation                             │
│ ✓ User isolation (users see own data)              │
│ ✓ Role-based access control (RBAC)                 │
│ ✓ IAM policies (principle of least privilege)      │
│ ✓ API key management (Secrets Manager)             │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│         Data Security (Encryption, Storage)         │
├─────────────────────────────────────────────────────┤
│ ✓ Encryption at rest (KMS)                         │
│ ✓ Encryption in transit (TLS 1.3)                  │
│ ✓ Password hashing (bcrypt)                        │
│ ✓ Secrets management (Secrets Manager)             │
│ ✓ No sensitive data in logs                        │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│           Network Security (VPC, SGs)               │
├─────────────────────────────────────────────────────┤
│ ✓ VPC isolation (private subnets)                  │
│ ✓ Security groups (firewall rules)                 │
│ ✓ NACLs (network access control lists)             │
│ ✓ VPC Flow Logs (network monitoring)               │
│ ✓ DDoS protection (CloudFront)                     │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│         Infrastructure Security (AWS)               │
├─────────────────────────────────────────────────────┤
│ ✓ Shared responsibility model                      │
│ ✓ AWS managed services (patching)                  │
│ ✓ Multi-AZ deployment (HA)                         │
│ ✓ Auto-scaling (resilience)                        │
│ ✓ CloudTrail (audit logging)                       │
└─────────────────────────────────────────────────────┘
```

---

## 1️⃣ Authentication & Authorization

### JWT Token Management
```python
# Best Practice: Backend (FastAPI)
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from datetime import datetime, timedelta
import jwt

security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # 32+ char random
ALGORITHM = "HS256"
EXPIRATION_HOURS = 24

def create_token(user_id: str):
    payload = {
        "sub": user_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=EXPIRATION_HOURS),
        "type": "access"
    }
    # ✓ Always use HS256 or RS256
    # ✓ Never use "none" algorithm
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Frontend Token Storage
```javascript
// ✓ GOOD: Store in secure HTTP-only cookie
// Browser handles storage, not accessible to JavaScript
fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: { 'Content-Type': 'application/json' }
})

// ❌ BAD: Don't store in localStorage (XSS vulnerable)
// localStorage.setItem('token', token);

// ⚠️  IF you must use localStorage:
// Only store short-lived tokens, refresh tokens in cookie
localStorage.setItem('accessToken', shortLivedToken);
// Refresh token in HTTP-only cookie
setCookie('refreshToken', refreshToken, { httpOnly: true });
```

### IAM Policies (Least Privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedRockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3*"
    },
    {
      "Sid": "S3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::fitness-coach-kb",
        "arn:aws:s3:::fitness-coach-kb/*"
      ]
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:fitness-coach/env*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:ACCOUNT:log-group:/aws/fitness-coach:*"
    }
  ]
}
```

---

## 2️⃣ Data Security

### Database Password Management
```bash
# ✓ BEST: Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name fitness-coach/db \
  --description "RDS credentials" \
  --secret-string '{
    "username":"admin",
    "password":"'$(openssl rand -base64 32)'",
    "host":"fitness-coach-db.xxxxx.rds.amazonaws.com",
    "port":5432,
    "dbname":"fitness_coach"
  }'

# Backend retrieves securely
import boto3

def get_db_credentials():
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId='fitness-coach/db')
    secrets = json.loads(response['SecretString'])
    return secrets['password']

# ❌ DON'T: Store in environment variables
# ❌ DON'T: Hardcode passwords
# ❌ DON'T: Store in git
```

### Encryption at Rest
```bash
# RDS Encryption
aws rds modify-db-instance \
  --db-instance-identifier fitness-coach-db \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:us-east-1:ACCOUNT:key/12345678-1234-1234-1234-123456789012 \
  --apply-immediately

# S3 Encryption
aws s3api put-bucket-encryption \
  --bucket fitness-coach-kb \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Bedrock (AWS managed, no action needed)
```

### Encryption in Transit
```bash
# ALB → EC2: HTTPS
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# EC2 → RDS: Encrypted (default with newer RDS)
# Frontend → CloudFront: HTTPS

# Client ↔ Bedrock: HTTPS (AWS SDK handles)
```

### Sensitive Data Logging
```python
# ✓ GOOD: Filter sensitive data
import logging
import json

class SensitiveDataFilter(logging.Filter):
    SENSITIVE_FIELDS = [
        'password', 'token', 'api_key', 'secret',
        'credit_card', 'ssn', 'email'
    ]
    
    def filter(self, record):
        if isinstance(record.msg, dict):
            record.msg = self._redact(record.msg)
        return True
    
    def _redact(self, data):
        if isinstance(data, dict):
            for key in self.SENSITIVE_FIELDS:
                if key in data:
                    data[key] = "***REDACTED***"
        return data

# Apply filter
logger = logging.getLogger()
logger.addFilter(SensitiveDataFilter())

# ❌ NEVER log:
# - Passwords
# - API keys
# - JWT tokens
# - Credit card numbers
# - PII (SSN, phone, address)
```

---

## 3️⃣ Network Security

### VPC Configuration
```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=fitness-coach-vpc}]' \
  --query 'Vpc.VpcId' \
  --output text)

# Create Public Subnet
PUBLIC_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' \
  --output text)

# Create Private Subnet
PRIVATE_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --query 'Subnet.SubnetId' \
  --output text)

# Create & attach Internet Gateway
IGW=$(aws ec2 create-internet-gateway \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW

# Route public traffic
ROUTE_TABLE=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $ROUTE_TABLE --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET --route-table-id $ROUTE_TABLE

# NAT Gateway for private subnet (outbound internet)
ELASTIC_IP=$(aws ec2 allocate-address --domain vpc --query 'PublicIp' --output text)
NAT_GW=$(aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET \
  --allocation-id $ELASTIC_IP \
  --query 'NatGateway.NatGatewayId' \
  --output text)
```

### Security Groups (Firewall Rules)
```bash
# ALB Security Group (Public)
ALB_SG=$(aws ec2 create-security-group \
  --group-name fitness-coach-alb-sg \
  --description "ALB - Allow HTTP/HTTPS from internet" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# ✓ Allow HTTPS (443) from internet
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# ✓ Allow HTTP (80) from internet (for redirect)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# EC2 Security Group (Private)
EC2_SG=$(aws ec2 create-security-group \
  --group-name fitness-coach-backend-sg \
  --description "Backend - Allow from ALB only" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# ✓ Allow from ALB only (not internet)
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp --port 8000 \
  --source-group $ALB_SG

# RDS Security Group (Private)
RDS_SG=$(aws ec2 create-security-group \
  --group-name fitness-coach-rds-sg \
  --description "RDS - Allow from EC2 only" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# ✓ Allow from EC2 only
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp --port 5432 \
  --source-group $EC2_SG
```

### Network Access Control Lists (NACLs)
```bash
# Public Subnet NACL
PUBLIC_NACL=$(aws ec2 create-network-acl \
  --vpc-id $VPC_ID \
  --query 'NetworkAcl.NetworkAclId' \
  --output text)

# Allow HTTPS inbound
aws ec2 create-network-acl-entry \
  --network-acl-id $PUBLIC_NACL \
  --rule-number 100 \
  --protocol tcp \
  --port-range From=443,To=443 \
  --cidr-block 0.0.0.0/0 \
  --ingress

# Allow HTTP inbound
aws ec2 create-network-acl-entry \
  --network-acl-id $PUBLIC_NACL \
  --rule-number 110 \
  --protocol tcp \
  --port-range From=80,To=80 \
  --cidr-block 0.0.0.0/0 \
  --ingress

# Allow ephemeral ports outbound
aws ec2 create-network-acl-entry \
  --network-acl-id $PUBLIC_NACL \
  --rule-number 120 \
  --protocol tcp \
  --port-range From=1024,To=65535 \
  --cidr-block 0.0.0.0/0 \
  --egress
```

---

## 4️⃣ Application Security

### Input Validation
```python
# FastAPI + Pydantic
from pydantic import BaseModel, validator, Field

class WorkoutRequest(BaseModel):
    goal: str
    duration_weeks: int = Field(ge=1, le=52)  # 1-52 weeks
    frequency: int = Field(ge=1, le=7)  # 1-7 days/week
    equipment: List[str]
    intensity: str
    specific_requirements: Optional[str] = Field(max_length=500)
    
    @validator('goal')
    def validate_goal(cls, v):
        allowed = ['muscle_gain', 'fat_loss', 'endurance', 'general_fitness']
        if v not in allowed:
            raise ValueError(f'Goal must be one of {allowed}')
        return v
    
    @validator('intensity')
    def validate_intensity(cls, v):
        allowed = ['beginner', 'intermediate', 'advanced', 'expert']
        if v not in allowed:
            raise ValueError(f'Intensity must be one of {allowed}')
        return v
    
    @validator('equipment')
    def validate_equipment(cls, v):
        allowed = ['dumbbell', 'barbell', 'kettlebell', 'cables', 'machines']
        for item in v:
            if item not in allowed:
                raise ValueError(f'Equipment "{item}" not allowed')
        return v

# FastAPI automatically:
# ✓ Type checking
# ✓ Range validation
# ✓ String encoding
# ✓ SQL injection prevention (parameterized queries)

# Usage
@app.post("/api/v1/integration/workout/generate")
async def generate_workout(request: WorkoutRequest):
    # ✓ Auto-validated by Pydantic
    # ✓ Type-safe
    # ✓ OpenAPI docs generated
    pass
```

### Rate Limiting
```python
# FastAPI Limiter
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/integration/workout/generate")
@limiter.limit("10/minute")  # 10 requests per minute
async def generate_workout(request: WorkoutRequest):
    pass

# Returns 429 Too Many Requests if exceeded
```

### CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fitness-coach.example.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,  # Cache preflight for 1 hour
)

# ❌ NEVER use allow_origins=["*"] with credentials
```

### Error Handling
```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # ✓ Log full error (internal only)
    logger.error(f"Error: {exc}", exc_info=True)
    
    # ✓ Return generic message (no details to user)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "request_id": request.state.request_id  # For debugging
        }
    )

# ❌ DON'T return stack traces
# ❌ DON'T reveal database details
# ❌ DON'T expose API structure
```

---

## 5️⃣ Compliance & Audit

### CloudTrail Logging
```bash
# Enable CloudTrail for all AWS API calls
aws cloudtrail create-trail \
  --name fitness-coach-trail \
  --s3-bucket-name fitness-coach-cloudtrail-logs \
  --include-global-service-events

aws cloudtrail start-logging --trail-name fitness-coach-trail

# CloudTrail logs:
# ✓ Who made the API call
# ✓ When (timestamp)
# ✓ What (API call details)
# ✓ Where (source IP)
# ✓ Result (success/failure)

# Query CloudTrail logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=fitness-coach-db \
  --max-results 10
```

### VPC Flow Logs
```bash
# Enable VPC Flow Logs for network monitoring
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids $VPC_ID \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/fitness-coach \
  --deliver-logs-permission-role-name vpc-flow-logs-role

# Logs network traffic:
# ✓ Source/destination IPs
# ✓ Ports
# ✓ Protocol
# ✓ Bytes transferred
# ✓ Accept/reject
```

### AWS Config
```bash
# Monitor compliance with security rules
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "encrypted-databases",
    "Description": "Checks if RDS instances are encrypted",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "RDS_STORAGE_ENCRYPTED"
    }
  }'

# Config checks:
# ✓ Encryption enabled
# ✓ Public access disabled
# ✓ Backup enabled
# ✓ IAM policies compliant
```

---

## 6️⃣ Incident Response

### Monitoring & Alerting
```bash
# High CPU Usage
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-high-cpu \
  --alarm-description "EC2 CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:fitness-coach-alerts

# Unauthorized API Attempts
# (Log via application logs)
# Alert if 401 errors > 10 in 5 minutes

# Database Connection Errors
aws cloudwatch put-metric-alarm \
  --alarm-name fitness-coach-db-errors \
  --alarm-description "DB errors > 5 in 5 min" \
  --metric-name ErrorCount \
  --namespace AWS/RDS \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# Bedrock API Errors
# Alert if failed invocations > 10% in 1 hour
```

### Incident Response Plan
```
1. DETECT
   ├─ CloudWatch alarms
   ├─ CloudTrail logs
   └─ Application logs with request_id

2. INVESTIGATE
   ├─ Check CloudWatch metrics
   ├─ Review application logs
   ├─ Query CloudTrail for changes
   └─ Check Security Groups

3. CONTAIN
   ├─ Scale down affected service
   ├─ Block malicious IP (WAF)
   ├─ Revoke compromised credentials
   └─ Enable enhanced monitoring

4. ERADICATE
   ├─ Patch security vulnerability
   ├─ Reset passwords
   ├─ Review and restrict IAM policies
   └─ Update security groups

5. RECOVER
   ├─ Restore from backup (if needed)
   ├─ Test service functionality
   ├─ Monitor for recurrence
   └─ Update runbooks

6. IMPROVE
   ├─ Post-incident review
   ├─ Update monitoring rules
   ├─ Implement automation
   └─ Share learnings
```

---

## ✅ Security Checklist

### Pre-Deployment
- [ ] All secrets in AWS Secrets Manager
- [ ] Environment variables reviewed
- [ ] IAM policies minimal privilege
- [ ] SSL certificate obtained
- [ ] VPC configured with subnets
- [ ] Security groups configured
- [ ] Database encryption enabled
- [ ] Backups configured

### Post-Deployment
- [ ] CloudTrail enabled
- [ ] VPC Flow Logs enabled
- [ ] CloudWatch alarms set
- [ ] S3 bucket versioning enabled
- [ ] Database Multi-AZ enabled
- [ ] Backup retention set to 7+ days
- [ ] Log retention set to 30+ days
- [ ] WAF rules configured

### Ongoing
- [ ] Monthly security audit
- [ ] Review IAM policies quarterly
- [ ] Update dependencies monthly
- [ ] Monitor CloudTrail logs weekly
- [ ] Review CloudWatch alarms weekly
- [ ] Test backup recovery monthly
- [ ] Penetration testing annually
- [ ] Update runbooks as needed

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Comprehensive Security Guide

