# File Upload Service Migration Script

## Overview

This script helps migrate from local file storage to the centralized file-upload-service.

## Prerequisites

- File upload service running
- MongoDB running
- Access to existing file directories
- Database access to update references

## Migration Steps

### 1. Backup Existing Files

```bash
# Backup current uploads directory
cd Local-Service-Marketplace/services/identity-service
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Move to safe location
mv uploads-backup-*.tar.gz ~/backups/
```

### 2. Add New Database Columns

```sql
-- Add fileId columns to keep both old and new during migration
BEGIN;

-- Users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_file_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_profile_picture_file_id ON users(profile_picture_file_id);

-- Providers table  
ALTER TABLE providers ADD COLUMN IF NOT EXISTS profile_picture_file_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_providers_profile_picture_file_id ON providers(profile_picture_file_id);

-- Provider documents table
ALTER TABLE provider_documents ADD COLUMN IF NOT EXISTS file_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_provider_documents_file_id ON provider_documents(file_id);

-- Provider portfolio table
ALTER TABLE provider_portfolio ADD COLUMN IF NOT EXISTS file_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_file_id ON provider_portfolio(file_id);

-- Attachments table (comms-service)
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS file_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_attachments_file_id ON attachments(file_id);

COMMIT;
```

### 3. Run Migration Script

Create file: `scripts/migrate-to-file-service.ts`

```typescript
import { Pool } from 'pg';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'marketplace',
});

const FILE_SERVICE_URL = process.env.FILE_UPLOAD_SERVICE_URL || 'http://localhost:4001';
const UPLOADS_BASE_PATH = './services/identity-service/uploads';

interface FileToMigrate {
  id: string;
  localPath: string;
  category: string;
  entityType: string;
  entityId: string;
  description?: string;
}

async function uploadToFileService(file: FileToMigrate): Promise<string> {
  const fullPath = join(UPLOADS_BASE_PATH, file.localPath);
  
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${fullPath}`);
    return null;
  }

  const stats = statSync(fullPath);
  if (stats.isDirectory()) {
    console.warn(`⚠️  Path is directory: ${fullPath}`);
    return null;
  }

  const formData = new FormData();
  formData.append('files', createReadStream(fullPath));
  formData.append('category', file.category);
  formData.append('linkedEntityType', file.entityType);
  formData.append('linkedEntityId', file.entityId);
  if (file.description) {
    formData.append('description', file.description);
  }

  try {
    const response = await axios.post(
      `${FILE_SERVICE_URL}/api/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-User-Id': 'migration-script',
          'X-User-Role': 'admin',
          'X-Tenant-Id': 'default',
        },
        timeout: 30000,
      }
    );

    return response.data.files[0].id;
  } catch (error) {
    console.error(`❌ Failed to upload ${file.localPath}:`, error.message);
    return null;
  }
}

async function migrateUserProfilePictures() {
  console.log('\n📸 Migrating user profile pictures...');
  
  const result = await pool.query(`
    SELECT id, profile_picture_url 
    FROM users 
    WHERE profile_picture_url IS NOT NULL 
      AND profile_picture_file_id IS NULL
  `);

  let migrated = 0;
  let failed = 0;

  for (const user of result.rows) {
    const localPath = user.profile_picture_url.replace('/uploads/', '');
    
    const fileId = await uploadToFileService({
      id: user.id,
      localPath,
      category: 'profile-picture',
      entityType: 'user',
      entityId: user.id,
      description: 'User profile picture',
    });

    if (fileId) {
      await pool.query(
        'UPDATE users SET profile_picture_file_id = $1 WHERE id = $2',
        [fileId, user.id]
      );
      migrated++;
      console.log(`✅ User ${user.id}: ${fileId}`);
    } else {
      failed++;
    }
  }

  console.log(`\n✨ User profile pictures: ${migrated} migrated, ${failed} failed`);
}

async function migrateProviderProfilePictures() {
  console.log('\n📸 Migrating provider profile pictures...');
  
  const result = await pool.query(`
    SELECT id, profile_picture_url 
    FROM providers 
    WHERE profile_picture_url IS NOT NULL 
      AND profile_picture_file_id IS NULL
  `);

  let migrated = 0;
  let failed = 0;

  for (const provider of result.rows) {
    const localPath = provider.profile_picture_url.replace('/uploads/', '');
    
    const fileId = await uploadToFileService({
      id: provider.id,
      localPath,
      category: 'profile-picture',
      entityType: 'provider',
      entityId: provider.id,
      description: 'Provider profile picture',
    });

    if (fileId) {
      await pool.query(
        'UPDATE providers SET profile_picture_file_id = $1 WHERE id = $2',
        [fileId, provider.id]
      );
      migrated++;
      console.log(`✅ Provider ${provider.id}: ${fileId}`);
    } else {
      failed++;
    }
  }

  console.log(`\n✨ Provider profile pictures: ${migrated} migrated, ${failed} failed`);
}

async function migrateProviderDocuments() {
  console.log('\n📄 Migrating provider documents...');
  
  const result = await pool.query(`
    SELECT id, provider_id, document_type, file_url 
    FROM provider_documents 
    WHERE file_url IS NOT NULL 
      AND file_id IS NULL
  `);

  let migrated = 0;
  let failed = 0;

  for (const doc of result.rows) {
    const localPath = doc.file_url.replace('/uploads/', '');
    
    const fileId = await uploadToFileService({
      id: doc.id,
      localPath,
      category: 'document',
      entityType: 'provider_document',
      entityId: doc.id,
      description: `${doc.document_type} for provider ${doc.provider_id}`,
    });

    if (fileId) {
      await pool.query(
        'UPDATE provider_documents SET file_id = $1 WHERE id = $2',
        [fileId, doc.id]
      );
      migrated++;
      console.log(`✅ Document ${doc.id}: ${fileId}`);
    } else {
      failed++;
    }
  }

  console.log(`\n✨ Provider documents: ${migrated} migrated, ${failed} failed`);
}

async function migrateProviderPortfolio() {
  console.log('\n🖼️  Migrating provider portfolio images...');
  
  const result = await pool.query(`
    SELECT id, provider_id, image_url, title 
    FROM provider_portfolio 
    WHERE image_url IS NOT NULL 
      AND file_id IS NULL
  `);

  let migrated = 0;
  let failed = 0;

  for (const item of result.rows) {
    const localPath = item.image_url.replace('/uploads/', '');
    
    const fileId = await uploadToFileService({
      id: item.id,
      localPath,
      category: 'portfolio',
      entityType: 'provider_portfolio',
      entityId: item.id,
      description: item.title || 'Portfolio image',
    });

    if (fileId) {
      await pool.query(
        'UPDATE provider_portfolio SET file_id = $1 WHERE id = $2',
        [fileId, item.id]
      );
      migrated++;
      console.log(`✅ Portfolio ${item.id}: ${fileId}`);
    } else {
      failed++;
    }
  }

  console.log(`\n✨ Portfolio images: ${migrated} migrated, ${failed} failed`);
}

async function main() {
  console.log('🚀 Starting file migration to file-upload-service...\n');
  console.log(`File Service URL: ${FILE_SERVICE_URL}`);
  console.log(`Uploads Base Path: ${UPLOADS_BASE_PATH}\n`);

  try {
    // Check file service is running
    const healthCheck = await axios.get(`${FILE_SERVICE_URL}/health`);
    console.log('✅ File upload service is healthy\n');

    // Run migrations
    await migrateUserProfilePictures();
    await migrateProviderProfilePictures();
    await migrateProviderDocuments();
    await migrateProviderPortfolio();

    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
```

### 4. Run Migration

```bash
# Install dependencies
cd Local-Service-Marketplace
pnpm add -D form-data @types/node

# Set environment
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_USER=postgres
export DATABASE_PASSWORD=postgres
export DATABASE_NAME=marketplace
export FILE_UPLOAD_SERVICE_URL=http://localhost:4001

# Run migration
npx ts-node scripts/migrate-to-file-service.ts
```

### 5. Verify Migration

```sql
-- Check how many files were migrated
SELECT 
  (SELECT COUNT(*) FROM users WHERE profile_picture_file_id IS NOT NULL) as users_migrated,
  (SELECT COUNT(*) FROM users WHERE profile_picture_url IS NOT NULL) as users_total,
  (SELECT COUNT(*) FROM providers WHERE profile_picture_file_id IS NOT NULL) as providers_migrated,
  (SELECT COUNT(*) FROM providers WHERE profile_picture_url IS NOT NULL) as providers_total,
  (SELECT COUNT(*) FROM provider_documents WHERE file_id IS NOT NULL) as documents_migrated,
  (SELECT COUNT(*) FROM provider_documents WHERE file_url IS NOT NULL) as documents_total;
```

### 6. Update Service Code

After successful migration, update services to use file IDs:

```typescript
// Before
async getUser(id: string) {
  const user = await this.userRepository.findById(id);
  return {
    ...user,
    profilePictureUrl: user.profile_picture_url,
  };
}

// After
async getUser(id: string) {
  const user = await this.userRepository.findById(id);
  
  // Use file service if available, fallback to legacy
  const profilePictureUrl = user.profile_picture_file_id
    ? `${FILE_UPLOAD_SERVICE_URL}/api/files/${user.profile_picture_file_id}/download`
    : user.profile_picture_url;
  
  return {
    ...user,
    profilePictureUrl,
  };
}
```

### 7. Cleanup (After Verification)

```sql
-- After confirming everything works, remove old columns (optional)
-- ONLY DO THIS AFTER THOROUGH TESTING!

-- ALTER TABLE users DROP COLUMN profile_picture_url;
-- ALTER TABLE providers DROP COLUMN profile_picture_url;
-- ALTER TABLE provider_documents DROP COLUMN file_url;
-- ALTER TABLE provider_portfolio DROP COLUMN image_url;

-- Delete old local files (optional)
-- rm -rf services/identity-service/uploads/
```

## Rollback Plan

If migration fails or issues arise:

1. **Keep old columns** - Don't drop `*_url` columns until fully stable
2. **Dual-read strategy** - Read from file service first, fallback to local
3. **Restore backup** - Use backup created in step 1
4. **Revert code** - Keep old file upload service code until migration complete

```typescript
// Dual-read pattern for safe migration
async getProfilePicture(user: User): Promise<string> {
  // Prefer new file service
  if (user.profile_picture_file_id) {
    try {
      return `${FILE_UPLOAD_SERVICE_URL}/api/files/${user.profile_picture_file_id}/download`;
    } catch (error) {
      console.warn('File service unavailable, using legacy URL');
    }
  }
  
  // Fallback to legacy local storage
  return user.profile_picture_url || '/default-avatar.png';
}
```

## Monitoring

Monitor migration progress:

```bash
# Watch file service logs
docker-compose logs -f file-upload-service

# Check MongoDB for uploaded files
docker-compose exec mongodb mongosh
> use file_service_db
> db.files.count()
> db.files.find().limit(10).pretty()

# Check PostgreSQL for updated records
docker-compose exec postgres psql -U postgres -d marketplace
# Run verification queries from step 5
```

## Troubleshooting

### "File not found" errors
- Check local file paths match database URLs
- Verify uploads directory exists and is readable

### "Connection timeout" errors
- Increase axios timeout: `timeout: 60000`
- Process files in smaller batches

### "HMAC signature mismatch"
- Verify GATEWAY_INTERNAL_SECRET is set correctly
- Or bypass HMAC for migration script (add env var)

---

**Status:** Ready for use  
**Last Updated:** 2024-01-09
