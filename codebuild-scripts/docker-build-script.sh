#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Export environment variable for the image tag, using the current commit hash resolved by CodeBuild
export IMAGE_TAG="${CODEBUILD_RESOLVED_SOURCE_VERSION}"

# Retrieve the ECR repository URI from AWS SSM Parameter Store, which is used for building and pushing images
ECR_REPOSITORY_URI=$(aws ssm get-parameter \
    --name "/ecr/$CONTAINER_NAME/repositoryUri" \
    --query "Parameter.Value" \
    --output text)
export ECR_REPOSITORY_URI

# Retrieve the last built commit hash from SSM Parameter Store
# This helps in detecting changes since the last successful build
LAST_BUILT_COMMIT=$(aws ssm get-parameter \
    --name "/ecr/$CONTAINER_NAME/lastBuiltCommit" \
    --query "Parameter.Value" \
    --output text 2>/dev/null || echo "")

# If the parameter does not exist (e.g., first build), default to the initial commit of the repository
# Ensures the first build has a reference point
if [ -z "$LAST_BUILT_COMMIT" ]; then
    echo "No last built commit found. Using initial commit as reference."
    LAST_BUILT_COMMIT=$(git rev-list --max-parents=0 HEAD)
fi

# Check for changes in the specified path of the monorepo between the last built commit and the current commit
# This is used to optimize builds by only rebuilding when there are relevant changes
echo "Checking for changes in $CONTAINER_PATH between $LAST_BUILT_COMMIT and $CODEBUILD_RESOLVED_SOURCE_VERSION..."

CHANGES=$(git diff --name-only "$LAST_BUILT_COMMIT" "$CODEBUILD_RESOLVED_SOURCE_VERSION" -- "$CONTAINER_PATH" | wc -l)

# If changes are detected in the specified path, proceed with the build; otherwise, skip
if [ "$CHANGES" -gt 0 ]; then
    echo "Detected changes in $CONTAINER_PATH. Proceeding with build."
    BUILD_CONTAINER=true
else
    echo "No changes detected in $CONTAINER_PATH. Skipping build."
    exit 0
fi

# Build and push the container image only if changes are detected
if [ "$BUILD_CONTAINER" = "true" ]; then
    # Authenticate Docker with ECR using AWS credentials
    aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_REPOSITORY_URI"

    # Build the Docker image using the specified Dockerfile and context path
    docker build -t "$ECR_REPOSITORY_URI:$IMAGE_TAG" -f "$DOCKERFILE_PATH" "$CONTEXT_PATH"

    # Push the newly built image to the ECR repository
    docker push "$ECR_REPOSITORY_URI:$IMAGE_TAG"

    # Store the image tag in SSM Parameter Store for future reference in deployments or scans
    aws ssm put-parameter \
        --name "/ecr/$CONTAINER_NAME/imageTag" \
        --value "$IMAGE_TAG" \
        --type "String" \
        --overwrite

    # Update the last built commit hash in SSM to the current commit, marking it as the latest successful build
    aws ssm put-parameter \
        --name "/ecr/$CONTAINER_NAME/lastBuiltCommit" \
        --value "$CODEBUILD_RESOLVED_SOURCE_VERSION" \
        --type "String" \
        --overwrite
fi