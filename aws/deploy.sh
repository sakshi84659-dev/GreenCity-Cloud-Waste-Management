#!/bin/bash
set -e

STACK_NAME="${1:-greencity-cloud-stack}"
REGION="${2:-us-east-1}"
USE_LAB_ROLE="${3:-true}"

echo "============================================================"
echo " GreenCity Cloud Deployment Automation (Bash)"
echo " Stack: $STACK_NAME | Region: $REGION"
echo "============================================================"

# 1. Identity Check
echo "[1/6] Verifying AWS Identity..."
CALLER=$(aws sts get-caller-identity --output json 2>/dev/null || true)
if [ -z "$CALLER" ]; then
  echo "[ERROR] AWS credentials invalid or expired. Update credentials before deploying."
  exit 1
fi

ACCOUNT_ID=$(echo "$CALLER" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
echo "Authenticated to Account: $ACCOUNT_ID"

# 2. Template Validation
echo "[2/6] Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://$(dirname "$0")/cloudformation.yaml --region "$REGION" > /dev/null

# 3. Stack Deployment
echo "[3/6] Deploying CloudFormation Stack..."
aws cloudformation deploy \
  --template-file $(dirname "$0")/cloudformation.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides UseLabRole="$USE_LAB_ROLE"

# 4. Outputs
echo "[4/6] Querying Stack Outputs..."
EC2_IP=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='EC2PublicIP'].OutputValue" --output text)
RDS_HOST=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text)

echo "EC2 Public IP: $EC2_IP"
echo "RDS Endpoint:  $RDS_HOST"
echo "S3 Bucket:     $S3_BUCKET"
echo "Backend URL:   http://$EC2_IP:5000/api"
echo "Frontend URL:  http://$EC2_IP"

# 5. Budget Configuration
echo "[5/6] Creating Monthly Budget Alert..."
aws budgets create-budget --account-id "$ACCOUNT_ID" --cli-input-json file://$(dirname "$0")/budget.json 2>/dev/null || echo "Budget setup skipped (requires billing permission)."

echo "Deployment complete."
