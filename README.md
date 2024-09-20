# DevSecOps Pipeline Example

This project demonstrates a comprehensive DevSecOps pipeline using AWS CDK, showcasing best practices for continuous integration, security scanning, and deployment across multiple environments. It incorporates automated security checks, container scanning, and infrastructure as code (IaC) principles to ensure a secure and efficient deployment pipeline.

## Table of Contents

- [DevSecOps Pipeline Example](#devsecops-pipeline-example)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Key Features](#key-features)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Setting Up the DevSecOps Pipeline](#setting-up-the-devsecops-pipeline)
  - [Pipeline Stages](#pipeline-stages)
  - [Security Measures](#security-measures)
  - [Security Demonstration: Resolving a Dependency Vulnerability](#security-demonstration-resolving-a-dependency-vulnerability)
  - [Known Issues and Limitations](#known-issues-and-limitations)
  - [Best Practices](#best-practices)
  - [Customization and Extension](#customization-and-extension)
  - [Code Structure and Key Files](#code-structure-and-key-files)
  - [Security Considerations](#security-considerations)
  - [Troubleshooting](#troubleshooting)

## Project Overview

This project showcases a DevSecOps pipeline that automates the build, test, and deployment process for a Node.js application using AWS CDK. The pipeline integrates various security measures, including static code analysis, dependency checks, and container scanning, aligning with DevSecOps principles to ensure secure and reliable deployments. The project is structured as a monorepo and uses TypeScript for infrastructure code, promoting type safety and maintainability.

### Key Features

- **Multi-Stage Deployment**: Supports deployment across development, staging, and production environments.
- **Automated Security Scanning**: Incorporates static code analysis, dependency vulnerability checks, and container image scanning.
- **Infrastructure as Code (IaC)**: Uses AWS CDK with TypeScript to define and deploy cloud resources programmatically.
- **CI/CD with Approval Gates**: Integrates manual approval steps before production deployments to ensure human oversight.
- **Dynamic Infrastructure**: Allows easy scaling and modification of the pipeline and infrastructure.
- **Container-based Deployment**: Utilizes Docker containers for consistent and isolated application deployment.
- **Monorepo Structure**: Organizes application code, infrastructure, and pipeline definitions in a single repository.
- **Enhanced ECR Scanning**: Implements advanced container scanning using a custom construct.

## Prerequisites

- **Node.js**: Version 20.14.9 or later.
- **AWS CLI**: Configured with permissions to deploy resources.
- **AWS CDK CLI**: Install using `npm install -g aws-cdk`.
- **Docker**: Required for building and testing containers locally.
- **GitHub Account**: For source code management and integration with AWS CodeStar Connections.

## Project Structure

The project is structured to separate application code, infrastructure, and pipeline definitions, promoting modularity and maintainability.

- **`bin/`**: Entry point for the CDK application.
  - **`dev-sec-ops-example.ts`**: Main CDK app definition.
- **`lib/`**: Core logic of the project.
  - **`containers/`**: Contains container configurations, Dockerfiles, and application code.
  - **`stacks/`**: Defines main stacks.
    - **`deployments/`**: Contains infrastructure stack definitions.
      - **`infrastructure-stack.ts`**: Defines AWS resources such as VPCs, ECS clusters, and WAF.
      - **`ecr-stack.ts`**: Defines ECR repositories for container images.
    - **`pipelines/`**: Contains CI/CD pipeline definitions.
      - **`pipeline-stack.ts`**: Defines the primary pipeline.
      - **`pipeline-steps/`**: Contains reusable steps used in the pipeline.
      - **`nag-suppressions/`**: Defines rules for suppressing CDK Nag warnings.
- **`test/`**: Test files for validating stack configurations.
- **`codebuild-scripts/`**: Contains scripts used in CodeBuild steps.
- **Configuration Files**: Various configuration files for the project.
- **`parse-cdk-nag-output.js`**: Script for parsing CDK Nag output.

## Setting Up the DevSecOps Pipeline

1. **Clone the repository**:

   ```bash
   git clone https://github.com/michelangelo17/dev-sec-ops-example.git
   cd dev-sec-ops-example
   ```

2. **Install project dependencies**:

   ```bash
   npm install
   ```

3. **Configure AWS CLI with the necessary credentials**:

   ```bash
   aws configure
   ```

4. **Update GitHub connection details**:

   - Modify the `ownerRepo` variable in `lib/stacks/pipelines/pipeline-stack.ts` to match your GitHub repository details.

5. **Set up AWS CodeStar connection for GitHub**:

   - In the AWS Console, go to Developer Tools > Settings > Connections.
   - Create a new connection to GitHub and complete the authorization process.
   - Note the ARN of the created connection.

6. **Update the connection ARN in the code**:

   - In `lib/stacks/pipelines/pipeline-stack.ts`, update the `connectionArn` variable with the ARN from step 5.

7. **Deploy the pipeline**:

   ```bash
   cdk deploy PipelineStack
   ```

## Pipeline Stages

The pipeline is designed with multiple stages to ensure code quality, security, and compliance before deployment:

1. **Source**: Fetches source code from GitHub using AWS CodeStar Connections.
2. **Build**: Compiles the application, runs tests, and synthesizes the CDK application.
3. **ECR Stage**: Sets up ECR repositories for container images.
4. **Docker Build Wave**: Builds and pushes Docker images to Amazon ECR. Utilizes caching to optimize build times.
5. **Test Wave**:
   - CDK Nag: Analyzes CDK code for compliance with AWS best practices.
   - ECR Scan: Scans Docker images for vulnerabilities using enhanced scanning features.
   - Code and Dependency Scan: Runs ESLint and npm audit for security checks.
6. **Dev Deployment**: Deploys to the development environment.
7. **Staging Deployment**: Deploys to the staging environment.
8. **Manual Approval**: Requires human approval before production deployment.
9. **Production Deployment**: Deploys to the production environment.

## Security Measures

1. **Static Code Analysis**: Uses ESLint with security-focused plugins.
2. **Dependency Scanning**: Utilizes npm audit for vulnerability checks.
3. **Container Scanning**: Leverages Amazon ECR enhanced scanning for image vulnerability detection.
4. **Infrastructure as Code (IaC) Scanning**: Integrates CDK Nag checks.
5. **Manual Approval Gate**: Introduces a manual review process before production deployment.
6. **Least Privilege IAM**: Implements finely scoped IAM permissions.
7. **Web Application Firewall (WAF)**: Configures basic WAF rules for application protection.
8. **VPC Flow Logs**: Enables VPC flow logs for network traffic monitoring.
9. **Non-root Users in Containers**: Implements best practice of running containers as non-root users.

## Security Demonstration: Resolving a Dependency Vulnerability

1. **Identify the Issue**:

   - Check the CodeBuild terminal output for security scan results, which will highlight outdated dependencies (e.g., `lodash` 4.17.15 in `lib/containers/app1/package.json`).

2. **Update the Dependency**:

   - Update the version in `package.json` to the latest secure version.

3. **Rebuild and Redeploy**:

   - Commit and push changes to trigger the pipeline.

4. **Verify the Fix**:

   - Monitor the pipeline logs to confirm that vulnerabilities have been addressed.

5. **Interpreting Scan Results**:

   - Review the ECR scan results in the AWS Console or pipeline logs.
   - Prioritize addressing high and critical severity vulnerabilities.
   - For medium and low severity issues, assess the risk and plan remediation accordingly.

6. **Taking Action**:
   - For critical vulnerabilities, consider rolling back to a previous version if immediate fix is not possible.
   - Update dependencies or apply patches as recommended by the scan results.
   - Re-scan images after applying fixes to ensure vulnerabilities are resolved.

## Known Issues and Limitations

1. **Intentional Vulnerabilities**: Some dependencies are intentionally outdated for demonstration purposes.
2. **Basic WAF Rules**: The WAF setup provides basic protection and should be enhanced for production use.
3. **CloudFront Integration**: The current setup doesn't include CloudFront, which should be considered for production deployments.
4. **Monitoring and Alerts**: Additional CloudWatch monitoring and alerting should be integrated for production readiness.
5. **Wildcard IAM Permissions**: Some IAM policies use wildcard permissions, which should be tightened in a production environment.

## Best Practices

1. **Infrastructure as Code**: Utilize CDK for managing cloud resources.
2. **Immutable Deployments**: Deploy new infrastructure rather than updating existing resources.
3. **Environment Parity**: Maintain consistent deployment processes across environments.
4. **Automated Security Scans**: Integrate security checks at every pipeline stage.
5. **Principle of Least Privilege**: Grant minimal necessary permissions.
6. **Logging and Monitoring**: Implement comprehensive monitoring for the pipeline and application.
7. **Approval Gates**: Use manual approvals for critical stages.
8. **Compliance Checks**: Leverage tools like CDK Nag for best practice adherence.
9. **Use of TypeScript for Infrastructure Code**: Enhances type safety and maintainability.
10. **Containerization of Applications**: Ensures consistency across different environments.

## Customization and Extension

To customize or extend this pipeline:

1. **Modify Pipeline Stages**: Add or remove stages in `PipelineStack`.
2. **Extend Security Checks**: Integrate additional security tools in the pipeline steps.
3. **Tailor Infrastructure**: Modify `InfrastructureStack` for application-specific resources.
4. **Update Application Code**: Adjust the application code and Docker configurations in the `containers` directory.
5. **Adjust CDK Context**: Update `cdk.json` for environment-specific configurations.
6. **Enhance Monitoring and Logging**: Add detailed logging and alerting using AWS services.
7. **Expand WAF Rules**: Enhance WAF configuration with additional rules.
8. **Implement Advanced Deployment Strategies**: Consider blue/green or canary deployments.
9. **Integrate Additional Security Services**: Explore AWS Shield, Macie, or Config for enhanced security.
10. **Refactor for Modularity**: Create reusable constructs for improved maintainability.
11. **Add Services**: Extend the `containerConfigs` array in `container-config.ts` to add more services to the pipeline.

## Code Structure and Key Files

- **`pipeline-stack.ts`**: Defines the main CI/CD pipeline structure and stages.
- **`infrastructure-stack.ts`**: Contains the core infrastructure components like VPC, ECS clusters, and WAF.
- **`ecr-stack.ts`**: Manages the creation and configuration of ECR repositories.
- **`container-config.ts`**: Central configuration for container definitions and build settings.

These files form the backbone of the project, defining the pipeline flow, infrastructure setup, and container configurations.

## Security Considerations

This project implements several security best practices:

1. **Least Privilege IAM Roles**: Each component is assigned minimal necessary permissions.
2. **WAF Configuration**: Basic rules are set up to protect against common web vulnerabilities.
3. **VPC Flow Logs**: Enabled for network traffic monitoring and security analysis.
4. **Container Security**: Non-root users are used in containers to reduce potential attack surface.
5. **Multi-layer Scanning**: Implements code, dependency, and container image scanning at various stages.

## Troubleshooting

Common issues and their resolutions:

1. **GitHub Connection Issues**:

   - Ensure the AWS CodeStar connection is properly set up and authorized.
   - Check the connection ARN in `pipeline-stack.ts` matches the one in AWS Console.

2. **CDK Deployment Failures**:

   - Review the CloudFormation events in the AWS Console for specific error messages.
   - Ensure your AWS CLI is configured with the correct credentials and region.

3. **Pipeline Execution Failures**:
   - Check the CodePipeline console for specific stage failures.
   - Review CodeBuild logs for detailed error messages in build and test stages.

---

For more detailed information on specific components or customization options, refer to the relevant files in the project structure.
