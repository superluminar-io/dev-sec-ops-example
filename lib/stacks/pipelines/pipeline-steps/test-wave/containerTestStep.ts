import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildStep } from 'aws-cdk-lib/pipelines'
import { ContainerConfig } from '../../../../containers/container-config'

// Function to create a CodeBuild step that runs tests for a specific container
export const createContainerTestStep = (containerConfig: ContainerConfig) =>
  new CodeBuildStep(`${containerConfig.name}Test`, {
    buildEnvironment: {
      buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
      environmentVariables: {
        NODE_ENV: {
          value: 'TEST',
        },
      },
    },
    commands: ['cd $CONTAINER_PATH', 'npm ci', 'npm test'],
    env: {
      CONTAINER_PATH: containerConfig.contextPath,
    },
  })
