#!/opt/homebrew/opt/node/bin/node
import 'source-map-support/register' // Provides better stack traces for debugging in Node.js
import * as cdk from 'aws-cdk-lib' // Import the AWS CDK library
import { PipelineStack } from '../lib/stacks/pipelines/pipeline-stack' // Import the Pipeline stack definition
import { AwsSolutionsChecks } from 'cdk-nag' // Import CDK Nag checks for compliance and best practices
import { InfrastructureStack } from '../lib/stacks/deployments/infrastructure-stack' // Import the Infrastructure stack definition
import { ECRStack } from '../lib/stacks/deployments/ecr-stack'

// Define the AWS environment, pulling account and region details from environment variables
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT, // Default AWS account to use, typically set by the CDK CLI
  region: process.env.CDK_DEFAULT_REGION, // Default AWS region to deploy resources to, also set by the CDK CLI
}

// Initialize a new CDK application
const app = new cdk.App()

// Conditional setup for CDK Nag checks based on environment variables
// CDK Nag checks are used to validate the stacks against AWS best practices and compliance standards
if (
  process.env.NODE_ENV === 'PIPELINE_NAG' ||
  process.env.NODE_ENV === 'TEST'
) {
  cdk.Aspects.of(app).add(new AwsSolutionsChecks()) // Adds best practice checks from cdk-nag when in testing or specific nag environments
}

// Instantiate the Pipeline stack, which defines CI/CD pipelines for deploying application resources
new PipelineStack(app, 'PipelineStack', {
  env, // Use the specified AWS account and region for deploying the stack
})

// Conditionally synth the Infrastructure stack only when in the TEST environment
// In other stages this is deployed in the pipeline
if (process.env.NODE_ENV === 'TEST') {
  new InfrastructureStack(app, 'InfrastructureStack', {
    env, // Use the same environment configuration as the pipeline stack
    stageName: 'test', // Sets the stage name to 'test', used for environment-specific configurations
  })
  new ECRStack(app, 'ECRStack', {
    env, // Use the same environment configuration as the pipeline stack
  })
}
