import { Stack, StackProps } from 'aws-cdk-lib'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import { Construct } from 'constructs'
import { containerConfigs } from '../../containers/container-config'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { EnhancedScanning } from '@michelangelo17/cdk-ecr-enhanced-scanning' // Custom module for enhanced scanning, will port to a superluminar repo soon

export class ECRStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Loop through each container configuration to create ECR repositories and configure scanning
    containerConfigs.forEach((containerConfig) => {
      // Create an ECR repository for each container configuration
      const repository = new Repository(
        this,
        `${containerConfig.name}-repository`,
        {
          repositoryName: containerConfig.repositoryName, // Name of the repository as defined in the container configuration
        }
      )

      // Enable enhanced scanning for the repository to improve security by automatically detecting vulnerabilities
      // EnhancedScanning is a custom construct set up with the following default rules:
      // - scanFrequency: 'CONTINUOUS_SCAN': Scans images continuously for new vulnerabilities as they are discovered.
      // - repositoryFilters: Configures scanning to target specific repositories, using a wildcard filter to match repository names.
      const enhancedScanForRepo = new EnhancedScanning(
        this,
        `${containerConfig.name}-enhanced-scanning`,
        {
          repository, // Associates enhanced scanning with the newly created repository
        }
      )

      // Add NagSuppressions to the enhanced scanning construct to suppress cdk-nag warnings
      // Explanation of what is suppressed is availlable in the npm package readme
      enhancedScanForRepo.addNagSuppressions(this)

      // Store the repository URI in SSM Parameter Store for easy retrieval in other parts of the infrastructure
      // Useful for CI/CD pipelines to dynamically pull image URIs without hardcoding values
      new StringParameter(this, `${containerConfig.name}-repository-url`, {
        parameterName: `/ecr/${containerConfig.name}/repositoryUri`, // SSM parameter path where the repository URI is stored
        stringValue: repository.repositoryUri, // Actual URI of the ECR repository
      })
    })
  }
}
