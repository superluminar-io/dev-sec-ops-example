#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Retrieve the latest image tag from SSM Parameter Store
# This is used to identify the specific image version to scan
LATEST_TAG=$(aws ssm get-parameter \
  --name "/ecr/$APPLICATIONS/imageTag" \
  --query "Parameter.Value" \
  --output text)

echo "Processing $APPLICATIONS with image tag: $LATEST_TAG"

# Check if LATEST_TAG is non-empty
# Ensures that the script does not continue with an undefined or empty tag
if [ -z "$LATEST_TAG" ]; then
  echo "Error: LATEST_TAG is empty."
  exit 1
fi

# Run the ECR scan and retrieve findings
# Scans the specified image and retrieves vulnerability findings
SCAN_FINDINGS=$(aws ecr describe-image-scan-findings \
  --repository-name "$ECR_REPOSITORY_NAME" \
  --image-id imageTag="$LATEST_TAG")

# Print the full scan findings for initial debugging
# Useful to verify the structure of the response and identify issues early
echo "Initial scan findings response:"
echo "$SCAN_FINDINGS" | jq .

# Check the scan status to ensure it is COMPLETE or ACTIVE
# These statuses indicate that the scan has finished processing
SCAN_STATUS=$(echo "$SCAN_FINDINGS" | jq -r '.imageScanStatus.status')

# Loop to wait until the scan status is COMPLETE if it is still in progress
# Retries up to MAX_ATTEMPTS with a delay to give the scan time to finish
MAX_ATTEMPTS=10
ATTEMPT=0
while [ "$SCAN_STATUS" == "IN_PROGRESS" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  echo "Waiting for scan to complete... Attempt $((ATTEMPT + 1))"
  sleep 10
  SCAN_FINDINGS=$(aws ecr describe-image-scan-findings \
    --repository-name "$ECR_REPOSITORY_NAME" \
    --image-id imageTag="$LATEST_TAG")
  SCAN_STATUS=$(echo "$SCAN_FINDINGS" | jq -r '.imageScanStatus.status')
  ATTEMPT=$((ATTEMPT + 1))
done

# Final check of the scan status
# Ensures that the scan has not failed or is still incomplete after the maximum attempts
if [ "$SCAN_STATUS" != "COMPLETE" ] && [ "$SCAN_STATUS" != "ACTIVE" ]; then
  echo "Error: Scan did not complete successfully. Current status: $SCAN_STATUS"
  exit 1
fi

# Parse the scan results using jq, handling nulls safely to prevent errors
# Extracts the count of CRITICAL and HIGH severity vulnerabilities
CRITICAL_COUNT=$(echo "$SCAN_FINDINGS" | jq '.imageScanFindings.findingSeverityCounts.CRITICAL // 0')
HIGH_COUNT=$(echo "$SCAN_FINDINGS" | jq '.imageScanFindings.findingSeverityCounts.HIGH // 0')

# Print all findings safely, focusing on severity, name, and description
# This helps identify what specific vulnerabilities are present without overwhelming output
echo "Final scan findings for $APPLICATIONS:"
echo "$SCAN_FINDINGS" | jq '.imageScanFindings.findings? // [] | map({severity: .severity, name: .name, description: .description})'

# Evaluate the vulnerability counts to determine if they exceed acceptable thresholds
# Exits the script if any critical or high-severity vulnerabilities are found
if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$HIGH_COUNT" -gt 0 ]; then
  echo "Vulnerabilities detected in $APPLICATIONS. Critical: $CRITICAL_COUNT, High: $HIGH_COUNT"
  exit 1
fi

# Output a success message if the scan passes, indicating that vulnerability levels are acceptable
echo "Security scan passed for $APPLICATIONS"