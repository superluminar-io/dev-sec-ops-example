import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildStep } from 'aws-cdk-lib/pipelines'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Stack } from 'aws-cdk-lib'
import { ContainerConfig } from '../../../../containers/container-config'

// Function to create an ECR security scan step in a pipeline
export const createEcrScanStep = (
  scope: Stack,
  containerConfig: ContainerConfig
): CodeBuildStep => {
  return new CodeBuildStep(`${containerConfig.name}EcrSecurityScan`, {
    buildEnvironment: {
      buildImage: LinuxBuildImage.AMAZON_LINUX_2_5, // Amazon Linux 2023 is used for its compatibility and security updates
    },
    commands: [
      'chmod +x ./codebuild-scripts/ecr-scan.sh', // Ensures the script is executable, necessary for successful script execution
      './codebuild-scripts/ecr-scan.sh', // Executes the security scan script which is presumed to contain security checks
    ],
    env: {
      // Environment variables are set to provide necessary context for the scan
      ECR_REPOSITORY_NAME: containerConfig.repositoryName, // Specifies the repository being scanned
      APPLICATIONS: containerConfig.name, // Provides the application name for tracking purposes
    },
    rolePolicyStatements: [
      // Policy granting permissions to describe ECR images and scan findings
      new PolicyStatement({
        actions: ['ecr:DescribeImages', 'ecr:DescribeImageScanFindings'], // Necessary for accessing ECR image metadata and scan results
        resources: [
          `arn:aws:ecr:${scope.region}:${scope.account}:repository/${containerConfig.repositoryName}`, // Restricts access to the specific ECR repository
        ],
      }),
      // Policy granting permission to fetch the image tag from SSM Parameter Store
      new PolicyStatement({
        actions: ['ssm:GetParameter'], // Allows retrieval of image tag from SSM, ensuring that the correct version is scanned
        resources: [
          `arn:aws:ssm:${scope.region}:${scope.account}:parameter/ecr/${containerConfig.name}/imageTag`,
        ],
      }),
      // Policy statements related to Inspector2 for scanning coverage and findings
      new PolicyStatement({
        actions: ['inspector2:ListCoverage'], // Allows checking what is being scanned, important for visibility in security coverage
        resources: [
          `arn:aws:inspector2:${scope.region}:${scope.account}:/coverage/list`,
        ],
      }),
      new PolicyStatement({
        actions: ['inspector2:ListFindings'], // Allows listing findings, providing access to the results of the scans
        resources: [
          `arn:aws:inspector2:${scope.region}:${scope.account}:/findings/list`,
        ],
      }),
    ],
  })
}
