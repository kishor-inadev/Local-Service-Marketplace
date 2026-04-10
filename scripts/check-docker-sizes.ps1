# check-docker-sizes.ps1
# Displays Docker image sizes with colorized output

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Image Size Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""

# Get all service images
$images = docker images --format "{{.Repository}}:{{.Tag}}`t{{.Size}}`t{{.ID}}" | 
    Select-String "service|gateway" |
    ForEach-Object {
        $parts = $_ -split "`t"
        [PSCustomObject]@{
            Image = $parts[0]
            Size = $parts[1]
            ID = $parts[2]
            SizeInMB = if ($parts[1] -match "(\d+\.?\d*)MB") { 
                [double]$matches[1] 
            } elseif ($parts[1] -match "(\d+\.?\d*)GB") { 
                [double]$matches[1] * 1024 
            } else { 
                0 
            }
        }
    }

if ($images.Count -eq 0) {
    Write-Host "No service images found. Build them first with:" -ForegroundColor Yellow
    Write-Host "  docker compose build" -ForegroundColor Gray
    exit
}

# Display images with color coding
foreach ($img in $images | Sort-Object SizeInMB) {
    $color = if ($img.SizeInMB -lt 100) { 
        "Green" 
    } elseif ($img.SizeInMB -lt 300) { 
        "Yellow" 
    } else { 
        "Red" 
    }
    
    $imageName = $img.Image.PadRight(40)
    $size = $img.Size.PadLeft(10)
    
    Write-Host "  $imageName $size" -ForegroundColor $color
}

Write-Host ""

# Total statistics
$totalSizeMB = ($images | Measure-Object -Property SizeInMB -Sum).Sum
$averageSizeMB = ($images | Measure-Object -Property SizeInMB -Average).Average

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Statistics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "  Total Images: $($images.Count)" -ForegroundColor White
Write-Host "  Total Size: $([math]::Round($totalSizeMB, 2)) MB ($([math]::Round($totalSizeMB/1024, 2)) GB)" -ForegroundColor White
Write-Host "  Average Size: $([math]::Round($averageSizeMB, 2)) MB" -ForegroundColor White

if ($averageSizeMB -lt 100) {
    Write-Host ""
    Write-Host "Images are optimized!" -ForegroundColor Green
} elseif ($averageSizeMB -lt 300) {
    Write-Host ""
    Write-Host "Images could be optimized further" -ForegroundColor Yellow
    Write-Host "Run: .\scripts\optimize-docker-images.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Images need optimization!" -ForegroundColor Red
    Write-Host "Run: .\scripts\optimize-docker-images.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker System Usage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

docker system df

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Cleanup Commands" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Remove unused images:" -ForegroundColor White
Write-Host "  docker image prune -a" -ForegroundColor Gray
Write-Host ""
Write-Host "Remove build cache:" -ForegroundColor White
Write-Host "  docker builder prune" -ForegroundColor Gray
Write-Host ""
Write-Host "Full cleanup (careful!):" -ForegroundColor White
Write-Host "  docker system prune -a --volumes" -ForegroundColor Gray
Write-Host ""
