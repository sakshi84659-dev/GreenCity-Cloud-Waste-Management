# GreenCity Automated AWS Deployment Script (PowerShell)
# Deploys the complete Cloud Computing architecture to AWS Academy / Standard AWS accounts

param(
    [string]$StackName = "greencity-cloud-stack",
    [string]$Region = "us-east-1",
    [string]$UseLabRole = "true"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " GreenCity Cloud Deployment Automation" -ForegroundColor Cyan
Write-Host " Stack Name: $StackName | Region: $Region" -ForegroundColor Cyan
Write-Host "============================================================`n"

# 1. Verify AWS Identity
Write-Host "[1/6] Checking AWS CLI authentication..." -ForegroundColor Yellow
$caller = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
if (-not $caller) {
    Write-Host "`n[ERROR] AWS session token is invalid or expired!" -ForegroundColor Red
    Write-Host "To obtain your fresh college AWS Academy / Vocareum credentials:" -ForegroundColor Yellow
    Write-Host "1. Sign in to your college AWS Academy / Canvas portal" -ForegroundColor White
    Write-Host "2. Go to your Cloud Computing course -> Learner Lab" -ForegroundColor White
    Write-Host "3. Click 'Start Lab' and wait for the circle to turn green" -ForegroundColor White
    Write-Host "4. Click 'AWS Details' -> Show AWS CLI credentials" -ForegroundColor White
    Write-Host "5. Save them to C:\Users\dell\.aws\credentials (do not paste in chat!)" -ForegroundColor White
    Write-Host "6. Re-run this deployment script: .\aws\deploy.ps1`n" -ForegroundColor White
    exit 1
}

Write-Host "Authenticated to AWS Account: $($caller.Account)" -ForegroundColor Green

# 2. Validate CloudFormation Template
Write-Host "`n[2/6] Validating CloudFormation template..." -ForegroundColor Yellow
$templatePath = Join-Path $PSScriptRoot "cloudformation.yaml"
aws cloudformation validate-template --template-body "file://$templatePath" --region $Region | Out-Null
Write-Host "Template validation successful!" -ForegroundColor Green

# 3. Package Application Archive
Write-Host "`n[3/6] Packaging application bundle for EC2 bootstrap..." -ForegroundColor Yellow
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$zipPath = Join-Path $env:TEMP "greencity-app.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Package backend and frontend dist
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempPackageDir = Join-Path $env:TEMP "greencity_pkg"
if (Test-Path $tempPackageDir) { Remove-Item $tempPackageDir -Recurse -Force }
New-Item -ItemType Directory -Path "$tempPackageDir\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$tempPackageDir\frontend" -Force | Out-Null

Copy-Item "$projectRoot\backend\*" -Destination "$tempPackageDir\backend" -Recurse -Exclude "node_modules","uploads","*.log"
Copy-Item "$projectRoot\frontend\dist" -Destination "$tempPackageDir\frontend\dist" -Recurse
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempPackageDir, $zipPath)
Remove-Item $tempPackageDir -Recurse -Force
Write-Host "Package created: $zipPath ($( [Math]::Round((Get-Item $zipPath).Length / 1MB, 2) ) MB)" -ForegroundColor Green

# 4. Deploy or Update CloudFormation Stack
Write-Host "`n[4/6] Deploying CloudFormation Stack ($StackName)..." -ForegroundColor Yellow
Write-Host "Provisioning VPC, Subnets, Internet Gateway, Security Groups, EC2, RDS MySQL, S3, SSM and CloudWatch..."

aws cloudformation deploy `
    --template-file "$templatePath" `
    --stack-name "$StackName" `
    --region "$Region" `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --parameter-overrides UseLabRole=$UseLabRole

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] CloudFormation deployment failed." -ForegroundColor Red
    exit 1
}
Write-Host "CloudFormation stack deployed successfully!" -ForegroundColor Green

# 5. Retrieve Endpoints & Upload Application Archive to S3
Write-Host "`n[5/6] Uploading application package to S3 and registering secrets..." -ForegroundColor Yellow
$outputs = aws cloudformation describe-stacks --stack-name "$StackName" --region "$Region" --query "Stacks[0].Outputs" --output json | ConvertFrom-Json

$ec2Ip = ($outputs | Where-Object { $_.OutputKey -eq "EC2PublicIP" }).OutputValue
$rdsEndpoint = ($outputs | Where-Object { $_.OutputKey -eq "RDSEndpoint" }).OutputValue
$s3Bucket = ($outputs | Where-Object { $_.OutputKey -eq "S3BucketName" }).OutputValue
$cwLogGroup = ($outputs | Where-Object { $_.OutputKey -eq "CloudWatchLogGroup" }).OutputValue

aws s3 cp "$zipPath" "s3://$s3Bucket/deploy/greencity-app.zip" --region $Region
Write-Host "Uploaded application archive to s3://$s3Bucket/deploy/greencity-app.zip" -ForegroundColor Green

# Optional: Configure Budget
$budgetConfig = Join-Path $PSScriptRoot "budget.json"
aws budgets create-budget --account-id $($caller.Account) --cli-input-json "file://$budgetConfig" 2>$null

# 6. Verify Application Health & Run Integration Tests
Write-Host "`n[6/6] Verifying live application health on EC2..." -ForegroundColor Yellow
$healthUrl = "http://${ec2Ip}/api/health"
Write-Host "Probing $healthUrl (waiting up to 180s for EC2 initialization)..."

$maxAttempts = 36
$attempt = 0
$healthy = $false
while ($attempt -lt $maxAttempts -and -not $healthy) {
    $attempt++
    Start-Sleep -Seconds 5
    try {
        $res = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $healthy = $true
            Write-Host "EC2 Backend is healthy! Response: $($res | ConvertTo-Json -Compress)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Attempt $attempt/$maxAttempts: Waiting for EC2 packages to finish bootstrapping..." -ForegroundColor Gray
    }
}

if ($healthy) {
    Write-Host "`nRunning integration test suite against live AWS EC2 application..." -ForegroundColor Yellow
    $env:TEST_URL = "http://$ec2Ip"
    node "$projectRoot\backend\test_suite.js"
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " GreenCity AWS Cloud Deployment Complete!" -ForegroundColor Green
Write-Host " Permanent Web Application URL: http://${ec2Ip}" -ForegroundColor Green
Write-Host " REST API Base URL:             http://${ec2Ip}:5000/api" -ForegroundColor Green
Write-Host " Amazon RDS MySQL Endpoint:     $rdsEndpoint" -ForegroundColor Green
Write-Host " Amazon S3 Storage Bucket:      $s3Bucket" -ForegroundColor Green
Write-Host " Amazon CloudWatch Log Group:   $cwLogGroup" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
