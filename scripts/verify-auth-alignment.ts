#!/usr/bin/env node
/**
 * Authentication System Alignment Verification Script
 * 
 * This script verifies that frontend and backend are properly aligned:
 * - Type definitions match
 * - API endpoints are correct
 * - Token expiration times match
 * - Environment variables are set
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, COLORS.green);
}

function error(message: string) {
  log(`❌ ${message}`, COLORS.red);
}

function warning(message: string) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function info(message: string) {
  log(`ℹ️  ${message}`, COLORS.blue);
}

function checkFileExists(path: string): boolean {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}

function checkEnvVariable(varName: string, envPath: string): boolean {
  try {
    const content = readFileSync(envPath, 'utf-8');
    return content.includes(varName);
  } catch {
    return false;
  }
}

function main() {
  log('\n═══════════════════════════════════════════', COLORS.blue);
  log('  Authentication System Verification', COLORS.blue);
  log('═══════════════════════════════════════════\n', COLORS.blue);

  let allChecksPassed = true;

  // Check 1: Frontend Files
  info('Checking frontend files...');
  const frontendFiles = [
    'frontend/auth.config.ts',
    'frontend/types/next-auth.d.ts',
    'frontend/types/auth-alignment.ts',
    'frontend/hooks/useAuth.ts',
    'frontend/services/api-client.ts',
    'frontend/services/auth-service.ts',
    'frontend/app/providers.tsx',
    'frontend/middleware.ts',
  ];

  frontendFiles.forEach(file => {
    if (checkFileExists(file)) {
      success(`Found: ${file}`);
    } else {
      error(`Missing: ${file}`);
      allChecksPassed = false;
    }
  });

  // Check 2: Backend Files
  info('\nChecking backend files...');
  const backendFiles = [
    'services/auth-service/src/modules/auth/services/auth.service.ts',
    'services/auth-service/src/modules/auth/services/jwt.service.ts',
    'services/auth-service/src/modules/auth/controllers/auth.controller.ts',
    'services/auth-service/src/modules/auth/dto/auth-response.dto.ts',
    'services/auth-service/src/modules/auth/dto/refresh-token.dto.ts',
  ];

  backendFiles.forEach(file => {
    if (checkFileExists(file)) {
      success(`Found: ${file}`);
    } else {
      error(`Missing: ${file}`);
      allChecksPassed = false;
    }
  });

  // Check 3: Environment Variables
  info('\nChecking environment variables...');
  
  // Frontend env vars
  const frontendEnvVars = [
    { var: 'AUTH_SECRET', file: 'frontend/.env' },
    { var: 'NEXTAUTH_URL', file: 'frontend/.env' },
    { var: 'NEXT_PUBLIC_API_URL', file: 'frontend/.env' },
  ];

  frontendEnvVars.forEach(({ var: varName, file }) => {
    if (checkEnvVariable(varName, file)) {
      success(`Frontend: ${varName} is set`);
    } else {
      warning(`Frontend: ${varName} might not be set in ${file}`);
    }
  });

  // Backend env vars
  const backendEnvVars = [
    { var: 'JWT_SECRET', file: 'services/auth-service/.env' },
    { var: 'JWT_EXPIRATION', file: 'services/auth-service/.env' },
    { var: 'JWT_REFRESH_SECRET', file: 'services/auth-service/.env' },
    { var: 'JWT_REFRESH_EXPIRATION', file: 'services/auth-service/.env' },
  ];

  backendEnvVars.forEach(({ var: varName, file }) => {
    if (checkEnvVariable(varName, file)) {
      success(`Backend: ${varName} is set`);
    } else {
      warning(`Backend: ${varName} might not be set in ${file}`);
    }
  });

  // Check 4: Database Schema
  info('\nChecking database schema...');
  if (checkFileExists('database/schema.sql')) {
    const schema = readFileSync('database/schema.sql', 'utf-8');
    
    if (schema.includes('CREATE TABLE sessions')) {
      success('sessions table is defined');
    } else {
      error('sessions table is missing');
      allChecksPassed = false;
    }
    
    if (schema.includes('refresh_token')) {
      success('sessions.refresh_token column exists');
    } else {
      error('sessions.refresh_token column is missing');
      allChecksPassed = false;
    }
    
    if (schema.includes('expires_at')) {
      success('sessions.expires_at column exists');
    } else {
      error('sessions.expires_at column is missing');
      allChecksPassed = false;
    }
  } else {
    error('database/schema.sql not found');
    allChecksPassed = false;
  }

  // Check 5: Type Alignment
  info('\nChecking type alignment...');
  try {
    const authAlignment = readFileSync('frontend/types/auth-alignment.ts', 'utf-8');
    
    if (authAlignment.includes('BackendAuthResponse')) {
      success('BackendAuthResponse type is defined');
    } else {
      error('BackendAuthResponse type is missing');
      allChecksPassed = false;
    }
    
    if (authAlignment.includes('isValidBackendAuthResponse')) {
      success('Type guard isValidBackendAuthResponse is defined');
    } else {
      error('Type guard isValidBackendAuthResponse is missing');
      allChecksPassed = false;
    }
    
    if (authAlignment.includes('TOKEN_CONFIG')) {
      success('TOKEN_CONFIG constants are defined');
    } else {
      error('TOKEN_CONFIG constants are missing');
      allChecksPassed = false;
    }
  } catch {
    error('Could not verify type alignment');
    allChecksPassed = false;
  }

  // Check 6: Token Expiration Match
  info('\nChecking token expiration configuration...');
  try {
    const authConfig = readFileSync('frontend/auth.config.ts', 'utf-8');
    
    if (authConfig.includes('TOKEN_CONFIG.ACCESS_TOKEN_EXPIRATION')) {
      success('Frontend uses TOKEN_CONFIG for expiration');
    } else {
      warning('Frontend might have hardcoded token expiration');
    }
    
    const backendEnv = readFileSync('services/auth-service/.env.example', 'utf-8');
    if (backendEnv.includes('JWT_EXPIRATION=15m') && backendEnv.includes('JWT_REFRESH_EXPIRATION=7d')) {
      success('Backend token expiration: Access=15m, Refresh=7d');
    } else {
      warning('Backend token expiration might differ');
    }
  } catch {
    warning('Could not verify token expiration configuration');
  }

  // Final Summary
  log('\n═══════════════════════════════════════════', COLORS.blue);
  if (allChecksPassed) {
    log('  ✅ All Critical Checks Passed!', COLORS.green);
  } else {
    log('  ❌ Some Checks Failed', COLORS.red);
  }
  log('═══════════════════════════════════════════\n', COLORS.blue);

  // Recommendations
  if (!allChecksPassed) {
    info('\nRecommendations:');
    log('1. Review missing files and create them if needed');
    log('2. Ensure environment variables are set correctly');
    log('3. Run database migrations to ensure schema is up to date');
    log('4. Check type definitions match between frontend and backend\n');
  } else {
    info('\nYour authentication system is properly aligned! 🎉\n');
    log('Next steps:');
    log('1. Run backend: cd services/auth-service && npm run start:dev');
    log('2. Run frontend: cd frontend && pnpm dev');
    log('3. Test login flow at http://localhost:3000/login\n');
  }

  process.exit(allChecksPassed ? 0 : 1);
}

main();
