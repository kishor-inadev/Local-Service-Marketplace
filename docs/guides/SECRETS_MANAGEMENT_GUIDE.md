# 🔐 SECRETS MANAGEMENT GUIDE

**Platform:** Local Service Marketplace  
**Date:** March 15, 2026  
**Priority:** CRITICAL - P0  

---

## 🚨 CRITICAL SECURITY REQUIREMENTS

### **NEVER DO THIS:**
- ❌ Commit secrets to Git
- ❌ Store secrets in code or config files
- ❌ Share secrets via email or Slack
- ❌ Use the same secrets across environments
- ❌ Use weak or predictable secrets
- ❌ Leave default secrets in production

### **ALWAYS DO THIS:**
- ✅ Use a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- ✅ Generate strong, random secrets (32+ characters)
- ✅ Use different secrets for each environment
- ✅ Rotate secrets every 90 days
- ✅ Use environment variables to inject secrets
- ✅ Audit secret access regularly

---

## 📋 QUICK START

### **1. Generate Production Secrets**

```powershell
# Run the secrets generator
.\scripts\generate-production-secrets.ps1
```

This creates:
- `secrets.env` - Environment variable format
- `secrets.json` - JSON format for cloud secrets managers
- Displays all secrets in terminal (copy to secure location)

### **2. Store Secrets Securely**

Choose your secrets manager:

#### **Option A: AWS Secrets Manager** (Recommended for AWS deployments)
```bash
# Store secrets
aws secretsmanager create-secret \
  --name marketplace/production/secrets \
  --secret-string file://secrets.json

# Retrieve secrets
aws secretsmanager get-secret-value \
  --secret-id marketplace/production/secrets
```

#### **Option B: Azure Key Vault** (Recommended for Azure deployments)
```bash
# Store secrets
az keyvault secret set \
  --vault-name marketplace-vault \
  --name production-secrets \
  --file secrets.json

# Retrieve secrets
az keyvault secret show \
  --vault-name marketplace-vault \
  --name production-secrets
```

#### **Option C: Kubernetes Secrets** (For Kubernetes deployments)
```bash
# Create secret from file
kubectl create secret generic marketplace-secrets \
  --from-env-file=secrets.env \
  --namespace=production

# Use in deployment
kubectl set env deployment/api-gateway \
  --from=secret/marketplace-secrets
```

#### **Option D: Docker Compose Secrets** (For simple deployments)
```bash
# Use secrets file
docker-compose --env-file secrets.env up

# Or use Docker secrets (Swarm mode)
docker secret create jwt_secret secrets/jwt_secret.txt
```

### **3. Replace Placeholder Values**

Some secrets need manual configuration:

```bash
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_YOUR_REAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Twilio (get from https://console.twilio.com/)
TWILIO_AUTH_TOKEN=YOUR_REAL_AUTH_TOKEN_HERE
```

### **4. Update Deployment Configuration**

Update `docker-compose.yml` to use secrets:

```yaml
services:
  auth-service:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
```

---

## 🔑 SECRETS INVENTORY

### **Required Secrets:**

| Secret Name | Purpose | Length | Rotation |
|-------------|---------|--------|----------|
| `JWT_SECRET` | JWT token signing | 64+ chars | 90 days |
| `JWT_REFRESH_SECRET` | Refresh token signing | 64+ chars | 90 days |
| `GATEWAY_INTERNAL_SECRET` | Gateway auth | 48+ chars | 90 days |
| `DATABASE_PASSWORD` | PostgreSQL password | 32+ chars | 90 days |
| `REDIS_PASSWORD` | Redis password | 32+ chars | 90 days |
| `SESSION_SECRET` | Session encryption | 48+ chars | 90 days |
| `ENCRYPTION_KEY` | Data encryption | 64+ chars | 90 days |
| `STRIPE_SECRET_KEY` | Payment processing | From Stripe | Never* |
| `STRIPE_WEBHOOK_SECRET` | Webhook validation | From Stripe | Never* |
| `SMTP_PASSWORD` | Email sending | 32+ chars | 90 days |
| `TWILIO_AUTH_TOKEN` | SMS sending | From Twilio | Never* |
| `FILE_UPLOAD_SECRET` | File signatures | 48+ chars | 90 days |

*Stripe and Twilio secrets are managed by those services. Rotate if compromised.

---

## 🔄 SECRET ROTATION PROCESS

### **Every 90 Days:**

1. **Generate New Secrets**
   ```powershell
   .\scripts\generate-production-secrets.ps1
   ```

2. **Deploy New Secrets to Secrets Manager**
   ```bash
   aws secretsmanager update-secret \
     --secret-id marketplace/production/secrets \
     --secret-string file://secrets.json
   ```

3. **Update Services (Zero-Downtime)**
   ```bash
   # Option 1: Rolling update
   kubectl rollout restart deployment/api-gateway
   kubectl rollout restart deployment/auth-service
   
   # Option 2: Blue-green deployment
   # Deploy new version with new secrets
   # Switch traffic when ready
   # Decommission old version
   ```

4. **Verify Services**
   ```bash
   # Check service health
   curl https://api.marketplace.com/health
   
   # Test authentication
   curl -X POST https://api.marketplace.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

5. **Decommission Old Secrets**
   - Wait 7 days for rollback safety
   - Delete old secrets from secrets manager

---

## 🏢 ENVIRONMENT-SPECIFIC SECRETS

### **Development Environment**
```bash
# Use weak secrets for local development
JWT_SECRET=dev-jwt-secret-not-for-production
DATABASE_PASSWORD=postgres
```

### **Staging Environment**
```bash
# Use different secrets from production
JWT_SECRET=<generate-unique-staging-secret>
DATABASE_PASSWORD=<generate-unique-staging-secret>
```

### **Production Environment**
```bash
# Use strong, unique secrets
JWT_SECRET=<64-character-cryptographically-secure-random-string>
DATABASE_PASSWORD=<32-character-cryptographically-secure-random-string>
```

---

## 📊 SECRET ACCESS AUDIT

### **Who Needs Access:**

| Role | Secrets Access | Method |
|------|---------------|--------|
| Developers (Development) | All dev secrets | Local .env files |
| Developers (Production) | Read-only logs | None |
| DevOps Engineers | All secrets | Secrets manager (AWS/Azure) |
| CI/CD Pipeline | Deployment secrets | Service account |
| Production Services | Own secrets only | Environment injection |

### **Audit Log:**

Monitor secret access:

```bash
# AWS Secrets Manager audit
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=marketplace/production/secrets

# Azure Key Vault audit
az monitor activity-log list \
  --resource-group marketplace \
  --query "[?contains(resourceId, 'marketplace-vault')]"
```

---

## 🚨 INCIDENT RESPONSE

### **If Secrets Are Compromised:**

1. **Immediate Actions (Within 5 minutes)**
   - Rotate ALL compromised secrets immediately
   - Revoke access tokens
   - Lock affected accounts
   - Notify security team

2. **Generate New Secrets**
   ```powershell
   .\scripts\generate-production-secrets.ps1
   ```

3. **Deploy Emergency Update**
   ```bash
   # Update secrets
   aws secretsmanager update-secret \
     --secret-id marketplace/production/secrets \
     --secret-string file://secrets.json
   
   # Force restart all services
   kubectl rollout restart deployment --all
   ```

4. **Investigation**
   - Review audit logs
   - Identify breach source
   - Assess data exposure
   - Document incident

5. **Post-Incident**
   - Update security practices
   - Train team on prevention
   - Implement additional monitoring

---

## 📁 FILE STRUCTURE

```
Local-Service-Marketplace/
├── scripts/generate-production-secrets.ps1   # ✅ Commit this
├── secrets.env                        # ❌ NEVER commit
├── secrets.json                       # ❌ NEVER commit
├── .gitignore                         # ✅ Must exclude secrets
│
├── .env.example                       # ✅ Template (no secrets)
├── .env.development                   # ❌ Don't commit
├── .env.staging                       # ❌ Don't commit
├── .env.production                    # ❌ NEVER commit
│
├── api-gateway/.env.example           # ✅ Template
├── services/auth-service/.env.example # ✅ Template
└── ...
```

---

## ✅ VERIFICATION CHECKLIST

Before deploying to production:

- [ ] All secrets generated using `scripts/generate-production-secrets.ps1`
- [ ] Secrets stored in cloud secrets manager (AWS/Azure/GCP)
- [ ] Stripe keys replaced with real production keys
- [ ] Twilio token replaced with real production token
- [ ] Different secrets for staging and production
- [ ] .gitignore updated to exclude secrets
- [ ] No secrets committed to Git (verify with `git log --all -p | grep -i "jwt_secret"`)
- [ ] Secrets rotation schedule configured (90 days)
- [ ] Incident response plan documented
- [ ] Team trained on secrets management
- [ ] Audit logging enabled on secrets manager

---

## 🔗 INTEGRATION EXAMPLES

### **NestJS (.env file)**
```bash
# .env (DON'T COMMIT)
JWT_SECRET=your-generated-secret-here
DATABASE_PASSWORD=your-generated-secret-here
```

### **Docker Compose**
```yaml
services:
  auth-service:
    env_file:
      - secrets.env
    environment:
      - JWT_SECRET=${JWT_SECRET}
```

### **Kubernetes**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: marketplace-secrets
type: Opaque
stringData:
  jwt-secret: ${JWT_SECRET}
  database-password: ${DATABASE_PASSWORD}
```

### **AWS ECS Task Definition**
```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:marketplace/production/secrets:JWT_SECRET::"
    }
  ]
}
```

---

## 📞 SUPPORT

**Questions about secrets management?**
- 🔒 Security Team: security@marketplace.com
- 📚 Documentation: See security best practices in docs
- 🆘 Incident: Follow incident response plan above

---

**Last Updated:** March 15, 2026  
**Next Review:** June 15, 2026 (90-day rotation)
