# File Upload Service Integration - Deployed Externally

## 🎯 Overview

The file-upload-service has been integrated into the Local Service Marketplace platform as an **external microservice** (like email-service and sms-service), deployed separately from the main platform.

## ✅ Integration Complete

### 1. FileServiceClient Created
**Location:** `services/identity-service/src/common/file-service.client.ts`

Reusable HTTP client for communicating with the external file-upload-service:
- `uploadFile()` - Upload single file
- `uploadMultipleFiles()` - Upload up to 10 files at once
- `getFileById()` - Get file metadata
- `getFileDownloadUrl()` - Get download URL
- `deleteFile()` - Delete file (admin only)
- `getFilesByEntity()` - Get all files for an entity

### 2. File Upload Endpoints Implemented

#### Identity Service - File Uploads

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/users/me/profile-picture` | POST | Upload user profile picture | Yes (user) |
| `/providers/:id/profile-picture` | POST | Upload provider profile picture | Yes (provider/admin) |
| `/provider-documents/upload/:providerId` | POST | Upload provider documents | Yes (provider/admin) |
| `/provider-portfolio/:providerId` | POST | Upload portfolio images (max 10) | Yes (provider/admin) |

**Files:**
- `services/identity-service/src/modules/user/controllers/user.controller.ts`
- `services/identity-service/src/modules/user/controllers/provider.controller.ts`
- `services/identity-service/src/modules/user/controllers/provider-document.controller.ts`
- `services/identity-service/src/modules/user/controllers/provider-portfolio.controller.ts`

#### Comms Service - Message Attachments

**Current Endpoint:** `/messages/attachments`  
**Status:** Ready to be migrated to file service (currently saves URLs directly)

**To integrate:**
1. Copy FileServiceClient to comms-service
2. Update attachment upload to use FileServiceClient
3. Store file IDs instead of URLs

## 📦 Configuration

### Environment Variables

**Root `.env`:**
```env
# File Upload Service (External - Deployed Separately)
FILE_UPLOAD_SERVICE_URL=https://your-file-service.vercel.app
FILE_DEFAULT_TENANT_ID=default
```

**Docker Compose:**
```yaml
# identity-service
environment:
  - FILE_UPLOAD_SERVICE_URL=${FILE_UPLOAD_SERVICE_URL:-https://your-file-service.vercel.app}
  - DEFAULT_TENANT_ID=${FILE_DEFAULT_TENANT_ID:-default}

# comms-service
environment:
  - FILE_UPLOAD_SERVICE_URL=${FILE_UPLOAD_SERVICE_URL:-https://your-file-service.vercel.app}
  - DEFAULT_TENANT_ID=${FILE_DEFAULT_TENANT_ID:-default}
```

**API Gateway:**
- File upload routes (`/files/*`) proxy directly to external service
- All file endpoints accessible via: `http://localhost:3700/api/v1/files/*`

## 🔌 API Usage Examples

### 1. Upload User Profile Picture

```bash
curl -X POST http://localhost:3700/api/v1/users/me/profile-picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@profile.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "profilePictureUrl": "https://file-service.vercel.app/api/files/abc123/download"
    },
    "file": {
      "id": "abc123",
      "filename": "profile.jpg",
      "url": "https://file-service.vercel.app/api/files/abc123/download",
      "size": 51243,
      "mimeType": "image/jpeg",
      "category": "profile-picture"
    }
  },
  "message": "Profile picture uploaded successfully"
}
```

### 2. Upload Provider Profile Picture

```bash
curl -X POST http://localhost:3700/api/v1/providers/PROVIDER_ID/profile-picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@provider-photo.jpg"
```

### 3. Upload Provider Documents

```bash
curl -X POST http://localhost:3700/api/v1/provider-documents/upload/PROVIDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@license.pdf" \
  -F "document_type=business_license" \
  -F "document_name=Business License 2024" \
  -F "document_number=BL-12345"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-456",
    "provider_id": "provider-789",
    "document_type": "business_license",
    "document_name": "Business License 2024",
    "file_url": "https://file-service.vercel.app/api/files/xyz789/download",
    "verified": false,
    "uploaded_at": "2024-01-09T00:00:00Z"
  },
  "message": "Document uploaded successfully. Pending verification."
}
```

### 4. Upload Portfolio Images (Multiple)

```bash
curl -X POST http://localhost:3700/api/v1/provider-portfolio/PROVIDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@work1.jpg" \
  -F "images=@work2.jpg" \
  -F "images=@work3.jpg" \
  -F "title=Recent Projects" \
  -F "description=Commercial painting projects completed in 2024"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-123",
    "provider_id": "provider-789",
    "title": "Recent Projects",
    "description": "Commercial painting projects completed in 2024",
    "files": [
      {
        "id": "file-1",
        "filename": "work1.jpg",
        "url": "https://file-service.vercel.app/api/files/file-1/download",
        "category": "portfolio"
      },
      {
        "id": "file-2",
        "filename": "work2.jpg",
        "url": "https://file-service.vercel.app/api/files/file-2/download",
        "category": "portfolio"
      },
      {
        "id": "file-3",
        "filename": "work3.jpg",
        "url": "https://file-service.vercel.app/api/files/file-3/download",
        "category": "portfolio"
      }
    ]
  },
  "message": "Portfolio item created successfully"
}
```

### 5. Access Files Directly (via API Gateway)

```bash
# List all files
GET http://localhost:3700/api/v1/files

# Get file metadata
GET http://localhost:3700/api/v1/files/FILE_ID

# Download file
GET http://localhost:3700/api/v1/files/FILE_ID/download

# Filter by category
GET http://localhost:3700/api/v1/files?category=profile-picture

# Filter by linked entity
GET http://localhost:3700/api/v1/files?linkedEntityType=provider&linkedEntityId=PROVIDER_ID
```

## 🏗️ Architecture

```
Frontend/Client
      ↓
      ↓ (JWT Bearer Token)
      ↓
API Gateway (port 3700)
      ↓
      ├──→ Identity Service → FileServiceClient → External File Service
      ├──→ Comms Service → FileServiceClient → External File Service
      └──→ Direct: /files/* → External File Service
                                      ↓
                                External File Service
                                (Deployed on Vercel/Cloud)
                                      ↓
                                   MongoDB (file metadata)
                                      ↓
                               Cloud Storage (Azure/S3/GCS/R2)
```

## 📁 File Categories

| Category | Use Case | Service | Visibility |
|----------|----------|---------|------------|
| `profile-picture` | User/provider avatars | identity-service | public |
| `document` | Licenses, certifications, insurance | identity-service | private |
| `portfolio` | Provider work showcase | identity-service | public |
| `attachment` | Message attachments | comms-service | private |

## 🔐 Security Features

1. **JWT Authentication** - All uploads require valid JWT token
2. **RBAC** - Role-based access control (anonymous/user/admin)
3. **HMAC Verification** - File service verifies requests from API Gateway
4. **File Validation** - Magic byte detection, MIME type checking
5. **Size Limits** - Configurable max file size (default 10MB)
6. **Rate Limiting** - Prevents abuse (20 uploads/minute/user)

## 🚀 Deployment Requirements

### External File Service Must Have:

**Environment Variables:**
```env
PORT=4001
NODE_ENV=production
MONGO_URI=mongodb://...
GATEWAY_INTERNAL_SECRET=<shared-secret>
STORAGE_TYPE=azure          # or s3, gcs, r2, local
MAX_FILE_SIZE=10485760      # 10MB
TENANCY_ENABLED=true
DEFAULT_TENANT_ID=default

# Cloud storage credentials (based on STORAGE_TYPE)
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
AZURE_CONTAINER_NAME=files
```

**Deploy To:**
- Vercel (with MongoDB Atlas)
- Heroku
- Railway
- AWS Lambda
- Azure Functions
- Google Cloud Run

**Endpoints Required:**
- `POST /api/files/upload` - File upload
- `GET /api/files` - List files
- `GET /api/files/:id` - Get file metadata
- `GET /api/files/:id/download` - Download file
- `PATCH /api/files/:id` - Update metadata
- `DELETE /api/files/:id` - Delete file

## 📝 Frontend Integration

### React/Next.js Example

```typescript
// Upload profile picture
async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/users/me/profile-picture', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

// Upload portfolio images
async function uploadPortfolio(providerId: string, files: File[], metadata: any) {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  formData.append('title', metadata.title);
  formData.append('description', metadata.description);

  const response = await fetch(`/api/v1/provider-portfolio/${providerId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}
```

## 🔄 Migration from Local Storage

If you have existing files stored locally:

1. Files are currently stored with URLs (e.g., `/uploads/profile-pictures/abc.jpg`)
2. New uploads store file IDs and download URLs from file service
3. Both old and new formats work simultaneously (backwards compatible)
4. No migration script needed - new uploads automatically use file service

**Example dual-read pattern:**
```typescript
// Frontend can display either format
const imageUrl = user.profilePictureUrl || '/default-avatar.png';
// Works for both:
// - Old: /uploads/profile-pictures/abc.jpg
// - New: https://file-service.vercel.app/api/files/xyz/download
```

## ✅ Testing

### 1. Test File Upload Service Health

```bash
curl https://your-file-service.vercel.app/health
```

Expected:
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2024-01-09T00:00:00.000Z"
}
```

### 2. Test Profile Picture Upload

```bash
# Get JWT token first
TOKEN=$(curl -X POST http://localhost:3700/api/v1/user/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# Upload profile picture
curl -X POST http://localhost:3700/api/v1/users/me/profile-picture \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg"
```

### 3. Test Provider Document Upload

```bash
curl -X POST http://localhost:3700/api/v1/provider-documents/upload/PROVIDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@license.pdf" \
  -F "document_type=business_license" \
  -F "document_name=Test License"
```

## 📚 Related Documentation

- [FILE_UPLOAD_IMPLEMENTATION_SUMMARY.md](FILE_UPLOAD_IMPLEMENTATION_SUMMARY.md) - Quick reference
- [API Specification](../api/API_SPECIFICATION.md)
- [Architecture Overview](../architecture/ARCHITECTURE.md)

## 🆘 Troubleshooting

### Issue: "Failed to upload file to file service"

**Cause:** File service URL not configured or unreachable

**Solution:**
```bash
# Check environment variable
echo $FILE_UPLOAD_SERVICE_URL

# Update .env
FILE_UPLOAD_SERVICE_URL=https://your-actual-file-service.vercel.app

# Restart services
docker-compose restart identity-service comms-service
```

### Issue: "Maximum file size exceeded"

**Cause:** File larger than 10MB (default limit)

**Solution:** Configure file service with higher limit:
```env
# On file service deployment
MAX_FILE_SIZE=20971520  # 20MB
```

### Issue: "HMAC signature mismatch"

**Cause:** GATEWAY_INTERNAL_SECRET doesn't match between API Gateway and file service

**Solution:** Ensure same secret in both:
```env
# API Gateway .env
GATEWAY_INTERNAL_SECRET=your-shared-secret

# File Service .env (deployment platform)
GATEWAY_INTERNAL_SECRET=your-shared-secret
```

## 📋 Summary

✅ **file-upload-service treated as external microservice** (like email/SMS)  
✅ **FileServiceClient created** for HTTP communication  
✅ **File uploads implemented in identity-service:**
- User profile pictures
- Provider profile pictures
- Provider documents (licenses, certifications)
- Provider portfolio (work showcase)

✅ **API Gateway configured** to proxy to external file service  
✅ **Environment variables updated** for external service URL  
✅ **Docker Compose cleaned up** (MongoDB and local file service removed)  
✅ **Backwards compatible** with existing local file URLs  

**No database migration needed** - new uploads use file service, old uploads continue to work!

---

**Status:** Ready for production  
**Service Type:** External microservice (deployed separately)  
**Last Updated:** 2024-01-09
