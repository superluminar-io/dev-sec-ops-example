#!/bin/bash

# Install dependencies for the specified container path
# This ensures that the latest package versions are available for linting and auditing
echo "Installing dependencies..."
npm install --prefix $CONTAINER_PATH

# Step 1: Run ESLint Security Check
# ESLint is used with a security-focused configuration to detect potential vulnerabilities in JavaScript code
echo "Running ESLint Security Check..."
npx eslint $CONTAINER_PATH --config $CONTAINER_PATH/eslint.config.js

# Check if ESLint encountered any errors; if so, exit with a failure status
# Security linting is critical for catching unsafe code patterns before deployment
if [ $? -ne 0 ]; then
  echo "ESLint security check failed. See details above."
  exit 1
else
  echo "ESLint security check passed." # Indicates code passed security standards defined in the ESLint config
fi