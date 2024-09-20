import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildStep } from 'aws-cdk-lib/pipelines'
import { ContainerConfig } from '../../../../containers/container-config'

// Function to create a CodeBuild step that performs application code and dependency security checks
export const createCodeScanStep = (containerConfig: ContainerConfig) =>
  new CodeBuildStep(`${containerConfig.name}AppSecurityCheck`, {
    buildEnvironment: {
      buildImage: LinuxBuildImage.AMAZON_LINUX_2_5, // Amazon Linux 2023 is used for its latest security enhancements and compatibility with modern security tools
      environmentVariables: {
        NODE_ENV: {
          value: 'SECURITY_TEST', // Setting NODE_ENV to 'SECURITY_TEST' configures the environment specifically for security testing, ensuring that security-focused configurations are applied
        },
      },
    },
    commands: [
      'chmod +x ./codebuild-scripts/app-security-check.sh', // Makes the security check script executable, an essential step for successful script execution
      './codebuild-scripts/app-security-check.sh', // Executes the script, which is assumed to perform the actual security checks on the application code and dependencies
    ],
    env: {
      CONTAINER_PATH: containerConfig.contextPath, // Passes the container path as an environment variable to the script, enabling targeted scans within specified directories or containers
    },
  })
