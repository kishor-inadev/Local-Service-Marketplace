# Production Secrets Generator
# Local Service Marketplace Platform
# DO NOT COMMIT GENERATED SECRETS TO GIT

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "Production Secrets Generator" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Generate-SecureSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $base64 = [Convert]::ToBase64String($bytes)
    return $base64 -replace '\+', '-' -replace '/', '_' -replace '=', ''
}

Write-Host "Generating production secrets...`n" -ForegroundColor Yellow

# Generate secrets
$JWT_SECRET = Generate-SecureSecret -Length 64
$JWT_REFRESH_SECRET = Generate-SecureSecret -Length 64
$GATEWAY_SECRET = Generate-SecureSecret -Length 48
$DATABASE_PASSWORD = Generate-SecureSecret -Length 32
$REDIS_PASSWORD = Generate-SecureSecret -Length 32
$SESSION_SECRET = Generate-SecureSecret -Length 48
$ENCRYPTION_KEY = Generate-SecureSecret -Length 64
$SMTP_PASSWORD = Generate-SecureSecret -Length 32
$FILE_UPLOAD_SECRET = Generate-SecureSecret -Length 48

# Display secrets
Write-Host "========================================"  -ForegroundColor Green
Write-Host "GENERATED SECRETS - COPY TO SECURE LOCATION" -ForegroundColor Green
Write-Host "========================================`n"  -ForegroundColor Green

Write-Host "JWT_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $JWT_SECRET -ForegroundColor Green
Write-Host "JWT_REFRESH_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $JWT_REFRESH_SECRET -ForegroundColor Green
Write-Host "GATEWAY_INTERNAL_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $GATEWAY_SECRET -ForegroundColor Green
Write-Host "DATABASE_PASSWORD=" -NoNewline -ForegroundColor Yellow
Write-Host $DATABASE_PASSWORD -ForegroundColor Green
Write-Host "REDIS_PASSWORD=" -NoNewline -ForegroundColor Yellow
Write-Host $REDIS_PASSWORD -ForegroundColor Green
Write-Host "SESSION_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $SESSION_SECRET -ForegroundColor Green
Write-Host "ENCRYPTION_KEY=" -NoNewline -ForegroundColor Yellow
Write-Host $ENCRYPTION_KEY -ForegroundColor Green
Write-Host "SMTP_PASSWORD=" -NoNewline -ForegroundColor Yellow
Write-Host $SMTP_PASSWORD -ForegroundColor Green
Write-Host "FILE_UPLOAD_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host $FILE_UPLOAD_SECRET -ForegroundColor Green
Write-Host ""
Write-Host "STRIPE_SECRET_KEY=" -NoNewline -ForegroundColor Yellow
Write-Host "sk_live_REPLACE_WITH_REAL_STRIPE_KEY" -ForegroundColor Red
Write-Host "STRIPE_WEBHOOK_SECRET=" -NoNewline -ForegroundColor Yellow
Write-Host "whsec_REPLACE_WITH_REAL_WEBHOOK_SECRET" -ForegroundColor Red
Write-Host "TWILIO_AUTH_TOKEN=" -NoNewline -ForegroundColor Yellow
Write-Host "REPLACE_WITH_REAL_TWILIO_TOKEN" -ForegroundColor Red

# Create secrets.env file
Write-Host "`nCreating secrets.env file..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$envFile = @"
# Production Secrets - DO NOT COMMIT
# Generated: $timestamp

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
GATEWAY_INTERNAL_SECRET=$GATEWAY_SECRET
DATABASE_PASSWORD=$DATABASE_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
SMTP_PASSWORD=$SMTP_PASSWORD
FILE_UPLOAD_SECRET=$FILE_UPLOAD_SECRET

# Replace these with real values
STRIPE_SECRET_KEY=sk_live_REPLACE_WITH_REAL_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_REAL_WEBHOOK_SECRET
TWILIO_AUTH_TOKEN=REPLACE_WITH_REAL_TWILIO_TOKEN
"@

$envFile | Out-File -FilePath "secrets.env" -Encoding UTF8
Write-Host "Created: secrets.env" -ForegroundColor Green

# Create secrets.json
Write-Host "Creating secrets.json file..." -ForegroundColor Yellow
$secretsObj = @{
    JWT_SECRET = $JWT_SECRET
    JWT_REFRESH_SECRET = $JWT_REFRESH_SECRET
    GATEWAY_INTERNAL_SECRET = $GATEWAY_SECRET
    DATABASE_PASSWORD = $DATABASE_PASSWORD
    REDIS_PASSWORD = $REDIS_PASSWORD
    SESSION_SECRET = $SESSION_SECRET
    ENCRYPTION_KEY = $ENCRYPTION_KEY
    SMTP_PASSWORD = $SMTP_PASSWORD
    FILE_UPLOAD_SECRET = $FILE_UPLOAD_SECRET
    STRIPE_SECRET_KEY = "sk_live_REPLACE_WITH_REAL_STRIPE_KEY"
    STRIPE_WEBHOOK_SECRET = "whsec_REPLACE_WITH_REAL_WEBHOOK_SECRET"
    TWILIO_AUTH_TOKEN = "REPLACE_WITH_REAL_TWILIO_TOKEN"
}
$secretsObj | ConvertTo-Json | Out-File -FilePath "secrets.json" -Encoding UTF8
Write-Host "Created: secrets.json" -ForegroundColor Green

# Update .gitignore
Write-Host "`nUpdating .gitignore..." -ForegroundColor Yellow
$gitignoreAdd = "`nsecrets.env`nsecrets.json`n*.secret`n*.key`n.env.production`n.env.staging`n"

if (Test-Path ".gitignore") {
    $content = Get-Content ".gitignore" -Raw
    if ($content -notmatch "secrets\.env") {
        Add-Content -Path ".gitignore" -Value $gitignoreAdd
        Write-Host "Updated .gitignore" -ForegroundColor Green
    } else {
        Write-Host ".gitignore already updated" -ForegroundColor Green
    }
} else {
    $gitignoreAdd | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "Created .gitignore" -ForegroundColor Green
}

# Warnings
Write-Host "`n========================================"  -ForegroundColor Red
Write-Host "SECURITY WARNINGS" -ForegroundColor Red
Write-Host "========================================`n"  -ForegroundColor Red
Write-Host "DO NOT commit secrets.env or secrets.json to Git" -ForegroundColor Red
Write-Host "Store secrets in AWS Secrets Manager or similar" -ForegroundColor Yellow
Write-Host "Replace Stripe and Twilio placeholders" -ForegroundColor Yellow
Write-Host "Use different secrets for each environment`n" -ForegroundColor Yellow

Write-Host "========================================`n"  -ForegroundColor Green
Write-Host "Generation complete! See SECRETS_MANAGEMENT_GUIDE.md for next steps`n" -ForegroundColor White
