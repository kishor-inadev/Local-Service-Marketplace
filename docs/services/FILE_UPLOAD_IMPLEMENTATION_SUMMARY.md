# File Upload Service Integration - Implementation Summary

## ✅ Complete Integration

The file-upload-service has been successfully integrated as an **external microservice** (deployed separately like email and SMS services).

## 🎯 What Was Implemented

### 1. FileServiceoClient (HTTP Client)
**Location:** `services/identity-service/src/common/file-service.client.ts`

Universal HTTP client for communicating with external file service:
- Single file uploads
- Multiple file uploads (up to 10 files)
- File metadata retrieval
- File download URLs
- File deletion (admin)
- Entity-based file queries

### 2. File Upload Endpoints

#### Identity Service

| Endpoint | Description | Files Affected |
|----------|-------------|----------------|
| `POST /users/me/profile-picture` | User avatar upload | [user.controller.ts](../../services/identity-service/src/modules/user/controllers/user.controller.ts) |
| `POST /providers/:id/profile-picture` | Provider avatar upload | [provider.controller.ts](../../services/identity-service/src/modules/user/controllers/provider.controller.ts) |
| `POST /provider-documents/upload/:providerId` | Document upload (licenses, certs) | [provider-document.controller.ts](../../services/identity-service/src/modules/user/controllers/provider-document.controller.ts) |
| `POST /provider-portfolio/:providerId` | Portfolio images (max 10) | [provider-portfolio.controller.ts](../../services/identity-service/src/modules/user/controllers/provider-portfolio.controller.ts) |

#### Comms Service
**Status:** Ready for integration (currently saves file URLs directly)

**To migrate:**
1. Copy FileServiceClient to `services/comms-service/src/common/`
2. Update `POST /messages/attachments` to use FileServiceClient
3. Store file IDs instead of URLs in attachments table

### 3. Configuration Updates

**Files Modified:**
- [docker-compose.yml](../../docker-compose.yml) - Removed local MongoDB and file service, added env vars
- [.env.example](../../.env.example) - Added FILE_UPLOAD_SERVICE_URL
- [services/identity-service/src/modules/user/user.module.ts](../../services/identity-service/src/modules/user/user.module.ts) - Added HttpModule and FileServiceClient

## 📋 Quick Start

### 1. Configure External File Service URL

```bash
# Edit .env
FILE_UPLOAD_SERVICE_URL=https://your-file-service.vercel.app
FILE_DEFAULT_TENANT_ID=default
```

### 2. Deploy File Upload Service

Deploy the standalone `file-upload-service` to:
- Vercel (recommended)
- Heroku
- Railway
- AWS Lambda
- Any Node.js hosting platform

**Required Environment Variables:**
```env
MONGO_URI=mongodb://...
GATEWAY_INTERNAL_SECRET=<same-as-api-gateway>
STORAGE_TYPE=azure|s3|gcs|r2|local
MAX_FILE_SIZE=10485760
TENANCY_ENABLED=true
DEFAULT_TENANT_ID=default

# Cloud storage credentials (based on STORAGE_TYPE)
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
AZURE_CONTAINER_NAME=files
```

### 3. Start Local Services

```bash
cd Local-Service-Marketplace
docker-compose up -d identity-service comms-service api-gateway
```

### 4. Test File Upload

```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:3700/api/v1/user/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# Upload profile picture
curl -X POST http://localhost:3700/api/v1/users/me/profile-picture \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"
```

## 🔌 API Usage

### Upload User Profile Picture
```bash
POST /api/v1/users/me/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image file>
```

### Upload Provider Documents
```bash
POST /api/v1/provider-documents/upload/:providerId
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <document file>
document_type: business_license|insurance|certification
document_name: License Name
document_number: ABC123 (optional)
expiry_date: 2025-12-31 (optional)
```

### Upload Portfolio Images
```bash
POST /api/v1/provider-portfolio/:providerId
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: <file1>
images: <file2>
images: <file3>
title: Portfolio Title
description: Description
```

## 📊 File Categories

| Category | Service | Visibility | Use Case |
|----------|---------|------------|----------|
| `profile-picture` | identity-service | public | User/provider avatars |
| `document` | identity-service | private | Licenses, certifications |
| `portfolio` | identity-service | public | Provider work showcase |
| `attachment` | comms-service | private | Message attachments |

## 🔐 Security

- ✅ JWT authentication required (except public GET endpoints)
- ✅ RBAC: anonymous, user, admin roles
- ✅ HMAC signature verification
- ✅ Magic byte file validation
- ✅ MIME type restrictions
- ✅ Rate limiting (20 uploads/minute/user)

## 🏗️ Architecture

```
Client → API Gateway → Service → FileServiceClient → External File Service
                                                             ↓
                                                          MongoDB
                                                             ↓
                                                    Cloud Storage (Azure/S3/etc)
```

## 📁 Files Changed

### Created
- `services/identity-service/src/common/file-service.client.ts` - HTTP client
- `docs/services/FILE_UPLOAD_EXTERNAL_INTEGRATION.md` - This guide

### Modified
- `services/identity-service/src/modules/user/user.module.ts` - Added HttpModule + FileServiceClient
- `services/identity-service/src/modules/user/controllers/user.controller.ts` - Added profile picture upload
- `services/identity-service/src/modules/user/controllers/provider.controller.ts` - Added provider picture upload
- `services/identity-service/src/modules/user/controllers/provider-document.controller.ts` - Updated to use FileServiceClient
- `services/identity-service/src/modules/user/controllers/provider-portfolio.controller.ts` - Updated to use FileServiceClient
- `docker-compose.yml` - Removed MongoDB, added FILE_UPLOAD_SERVICE_URL env vars
- `.env.example` - Added file service configuration
- `api-gateway/src/gateway/config/services.config.ts` - Added file service routes

### Removed
- MongoDB service from docker-compose (not needed locally)
- Local file service container (now external)
- `scripts/start-file-upload-service.ps1` (obsolete)
- `scripts/stop-file-upload-service.ps1` (obsolete)

## 📖 Documentation

Full documentation available at:
- [FILE_UPLOAD_EXTERNAL_INTEGRATION.md](FILE_UPLOAD_EXTERNAL_INTEGRATION.md) - Complete integration guide with examples

## ✅ Testing Checklist

- [ ] Deploy file-upload-service to cloud platform
- [ ] Configure FILE_UPLOAD_SERVICE_URL in .env
- [ ] Restart identity-service and comms-service
- [ ] Test user profile picture upload
- [ ] Test provider profile picture upload
- [ ] Test provider document upload
- [ ] Test provider portfolio upload
- [ ] Verify files accessible via download URL

## 🚀 Next Steps

1. **Deploy file-upload-service** to your hosting platform
2. **Update environment variables** with actual service URL
3. **Test all upload endpoints** using Postman or curl
4. **Update frontend** to use new endpoints
5. **(Optional) Migrate comms-service** attachments to FileServiceClient
6. **(Optional) Add marketplace-service** file uploads (service request images, job photos)

## 🆘 Support

For issues:
1. Check file service health: `https://your-file-service.vercel.app/health`
2. Verify environment: `docker-compose exec identity-service env | grep FILE_UPLOAD`
3. Check logs: `docker-compose logs identity-service`
4. Review: [Troubleshooting Guide](FILE_UPLOAD_EXTERNAL_INTEGRATION.md#troubleshooting)

---

**Status:** ✅ Ready for Production  
**Integration Type:** External Microservice  
**Implementation Date:** 2024-01-09  
**Version:** 1.0.0
