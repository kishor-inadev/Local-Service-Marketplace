# Cleanup outdated documentation files
$docsPath = "docs"
$deleted = @()

# List of specific files to delete
$filesToDelete = @(
    # Dated Reports (6)
    'API_ENDPOINT_VALIDATION_REPORT_MARCH_14_2026.md',
    'COMPLETE_SYNC_VERIFICATION_MARCH_14_2026.md',
    'ENV_VARIABLES_COMPLETE_FIX_MARCH_14_2026.md',
    'FINAL_VERIFICATION_MARCH_14_2026.md',
    'IMPLEMENTATION_SUMMARY_MARCH_14_2026.md',
    'PRODUCTION_READINESS_REPORT_MARCH_15_2026.md',
    
    # COMPLETE Status Files (17)
    'AUTHENTICATION_COMPLETE.md',
    'AUTH_SYSTEM_COMPLETE.md',
    'BACKEND_IMPLEMENTATION_COMPLETE.md',
    'DATABASE_CRITICAL_FIXES_COMPLETE.md',
    'FRONTEND_IMPLEMENTATION_COMPLETE.md',
    'FRONTEND_COMPLETE_IMPLEMENTATION.md',
    'HIGH_MEDIUM_PRIORITY_IMPLEMENTATION_COMPLETE.md',
    'IMPLEMENTATION_COMPLETION_SUMMARY.md',
    'LOCATION_INTEGRATION_COMPLETE.md',
    'OAUTH_IMPLEMENTATION_COMPLETE.md',
    'PHASE_4_COMPLETE.md',
    'PRODUCTION_FIXES_COMPLETE.md',
    'RBAC_IMPLEMENTATION_COMPLETE.md',
    'SEEDING_IMPLEMENTATION_COMPLETE.md',
    'SYNC_COMPLETE.md',
    'SYNC_VERIFICATION_COMPLETE.md',
    'FRONTEND_PHASE_3_COMPLETE.md',
    
    # Phase Guides (9)
    'PHASE_1_IMPLEMENTATION_GUIDE.md',
    'PHASE_2_IMPLEMENTATION_GUIDE.md',
    'PHASE_2_COMPLETION_SUMMARY.md',
    'PHASE_3_IMPLEMENTATION_GUIDE.md',
    'PHASE_4_INSTALLATION.md',
    'PHASE_4_NEW_TABLES_GUIDE.md',
    'PHASE_5_FRONTEND_GUIDE.md',
    'PHASE_5_FRONTEND_IMPLEMENTATION_SUMMARY.md',
    'PHASE_6_TESTING_DEPLOYMENT.md',
    
    # Reports & Assessments (17)
    'API_GATEWAY_PRODUCTION_REPORT.md',
    'API_VERIFICATION_REPORT.md',
    'DATABASE_PRODUCTION_READINESS_AUDIT.md',
    'ENVIRONMENT_VARIABLES_AUDIT_REPORT.md',
    'FRONTEND_AUDIT_REPORT.md',
    'SECURITY_AUDIT_REPORT.md',
    'IMPLEMENTATION_STATUS.md',
    'IMPLEMENTATION_STATUS_REPORT.md',
    'MVP_IMPLEMENTATION_REPORT.md',
    'PRODUCTION_READINESS_FINAL_ASSESSMENT.md',
    'PRODUCTION_READINESS_REPORT.md',
    'WEEK_1_2_IMPLEMENTATION_REPORT.md',
    'FRONTEND_PROJECT_SUMMARY.md',
    'FRONTEND_FRONTEND_COMPLETION_REPORT.md',
    'PLATFORM_INTEGRATION_REPORT.md',
    'AUDIT_INDEX.md',
    'MASTER_IMPLEMENTATION_ROADMAP.md',
    
    # Status & Summary Files (12)
    'DASHBOARD_INTEGRATION_STATUS.md',
    'NOTIFICATION_INTEGRATION_STATUS.md',
    'GIT_STATUS.md',
    'ENV_FILES_STATUS.md',
    'DATABASE_SEEDING_SUMMARY.md',
    'LOCATION_INTEGRATION_SUMMARY.md',
    'FRONTEND_PHASE_2_IMPROVEMENTS.md',
    'QUICK_COMPLETION_GUIDE.md',
    'REMAINING_WORK_COMPLETION.md',
    'NO_BREAKING_CHANGES.md',
    'PROJECT_ESTIMATION.md',
    'QUICK_REFERENCE_GUIDE.md',
    
    # Authentication Duplicates (2)
    'AUTHENTICATION_AUDIT.md',
    'AUTHENTICATION_VERIFICATION.md',
    
    # API Gateway Duplicates (1)
    'API_GATEWAY_ROUTING_FIX.md',
    
    # Database Duplicates (5)
    'DATABASE_BACKEND_ALIGNMENT_REPORT.md',
    'DATABASE_BACKEND_FRONTEND_ALIGNMENT.md',
    'DATABASE_ENHANCEMENT_SUGGESTIONS.md',
    'DATABASE_OPTIMIZATIONS_APPLIED.md',
    'DATABASE_OPTIMIZATION_REPORT.md',
    
    # Frontend Duplicates (11)
    'FRONTEND_API_INTEGRATION.md',
    'FRONTEND_AUTH_REDIRECT_FIX.md',
    'FRONTEND_AUTH_TOKEN_FIX.md',
    'FRONTEND_BACKEND_ALIGNMENT.md',
    'FRONTEND_BACKEND_API_ALIGNMENT_REPORT.md',
    'FRONTEND_DESIGN_ENHANCEMENT.md',
    'FRONTEND_FEATURE_FLAGS.md',
    'FRONTEND_IMPROVEMENTS.md',
    'FRONTEND_README.md',
    'FRONTEND_RESPONSE_ERROR_ANALYSIS.md',
    'OPTIMISTIC_UI_SEARCH_IMPLEMENTATION.md',
    
    # Email Service Duplicates (4)
    'SERVICE_EMAIL_COMPREHENSIVE_DOCUMENTATION.md',
    'SERVICE_EMAIL_QUICK_START_GUIDE.md',
    'SERVICE_EMAIL_USAGE_GUIDE.md',
    'SMS_EMAIL_INTEGRATION_PLAN.md',
    
    # Environment/Config Duplicates (2)
    'ENVIRONMENT_VARIABLES_FIX_SUMMARY.md',
    'SERVICE_SMS_ENVIRONMENT_VARIABLES.md',
    
    # Seeding Duplicates (2)
    'SEED_QUICK_START.md',
    'SEED_REFERENCE_CARD.md',
    
    # Startup Duplicates (2)
    'MVP_STARTUP_GUIDE.md',
    'QUICK_START_INTEGRATION.md',
    
    # Verification/Alignment Reports (2 remaining - others already deleted)
    'COLUMN_ALIGNMENT_VERIFICATION.md',
    'COMPREHENSIVE_VALIDATION_REPORT.md',
    
    # Misc Duplicates (13)
    'BACKEND_FRONTEND_SYNC_FIX.md',
    'BACKEND_USER_CONTEXT_EXAMPLES.md',
    'BACKGROUND_JOBS_IMPLEMENTATION.md',
    'DOCUMENTATION_STRUCTURE.md',
    'DOCKER_OPTIMIZATION.md',
    'EMAIL_SMS_INTEGRATION.md',
    'MINOR_FIXES_APPLIED.md',
    'PRODUCTION_QUICK_FIX_GUIDE.md',
    'PROVIDER_DASHBOARD_BACKEND_IMPLEMENTATION.md',
    'PROVIDER_DASHBOARD_FILES.md',
    'PROVIDER_DASHBOARD_IMPLEMENTATION_PLAN.md',
    'PROVIDER_DASHBOARD_REQUIREMENTS.md',
    'SCALING_OPTIMIZATIONS.md',
    'SCHEMA_IMPLEMENTATION_GAP_REPORT.md',
    'STANDARDIZED_RESPONSE_IMPLEMENTATION.md'
)

Write-Host ""
Write-Host "=== Cleaning up outdated documentation ===" -ForegroundColor Cyan
Write-Host "Total files to delete: $($filesToDelete.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($fileName in $filesToDelete) {
    $filePath = Join-Path $docsPath $fileName
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        $deleted += $fileName
        Write-Host "Deleted: $fileName" -ForegroundColor Green
    } else {
        Write-Host "Not found: $fileName" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files deleted: $($deleted.Count)" -ForegroundColor Green
Write-Host "Files not found: $($filesToDelete.Count - $deleted.Count)" -ForegroundColor DarkGray

# Count remaining files
$remaining = (Get-ChildItem -Path $docsPath -Filter "*.md" -File).Count
Write-Host "Remaining .md files: $remaining" -ForegroundColor Yellow
Write-Host ""
