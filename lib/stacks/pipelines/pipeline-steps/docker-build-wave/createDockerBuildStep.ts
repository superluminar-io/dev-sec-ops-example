import { CodeBuildStep } from 'aws-cdk-lib/pipelines'
import { ContainerConfig } from '../../../../containers/container-config'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import { Stack } from 'aws-cdk-lib'

// Function to create a Docker build step in the pipeline
export const createDockerBuildStep = (
  scope: Stack,
  containerConfig: ContainerConfig
): CodeBuildStep => {
  // Retrieves the ECR repository by name to use for Docker image storage
  const repository = Repository.fromRepositoryName(
    scope,
    `${containerConfig.name}-repository`,
    containerConfig.repositoryName
  )

  return new CodeBuildStep(`${containerConfig.name}-build`, {
    commands: [
      'chmod +x ./codebuild-scripts/docker-build-script.sh', // Ensures the Docker build script is executable, a required step to run the script successfully
      './codebuild-scripts/docker-build-script.sh', // Executes the custom Docker build script that likely handles image building and pushing
    ],
    env: {
      CONTAINER_NAME: containerConfig.name, // Sets the container name, used within the script for tagging or identification purposes
      CONTAINER_PATH: containerConfig.contextPath, // Specifies the context path for Docker builds, typically where the Dockerfile is located
      DOCKERFILE_PATH: containerConfig.dockerfilePath, // Path to the Dockerfile, ensuring the correct file is used for building the image
      CONTEXT_PATH: containerConfig.contextPath, // Context path for the build process, used to include necessary files during the Docker build
    },
    rolePolicyStatements: [
      new PolicyStatement({
        // Permissions required for pushing images to ECR
        actions: [
          'ecr:BatchCheckLayerAvailability', // Checks which layers exist in the ECR repository
          'ecr:CompleteLayerUpload', // Completes an image layer upload to the ECR repository
          'ecr:InitiateLayerUpload', // Starts a new image layer upload to the ECR repository
          'ecr:PutImage', // Pushes the final image to the ECR repository
          'ecr:UploadLayerPart', // Uploads parts of the image layer to the ECR repository
        ],
        resources: [repository.repositoryArn], // Restricts these permissions to the specific ECR repository, aligning with the principle of least privilege
      }),
      new PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'], // Allows retrieval of the authorization token required to authenticate Docker with ECR
        resources: ['*'], // While wildcard access is used here, it's necessary since authorization tokens are account-wide
      }),
      new PolicyStatement({
        actions: ['ssm:GetParameter'], // Grants read access to SSM parameters, used for retrieving repository URI and commit information
        resources: [
          `arn:aws:ssm:${scope.region}:${scope.account}:parameter/ecr/${containerConfig.name}/repositoryUri`, // Retrieves the URI of the ECR repository
          `arn:aws:ssm:${scope.region}:${scope.account}:parameter/ecr/${containerConfig.name}/lastBuiltCommit`, // Retrieves the last built commit, possibly used for caching or build validation
        ],
      }),
      new PolicyStatement({
        actions: ['ssm:PutParameter'], // Grants write access to SSM parameters, used to update information like image tags and commit hashes
        resources: [
          `arn:aws:ssm:${scope.region}:${scope.account}:parameter/ecr/${containerConfig.name}/imageTag`, // Stores the image tag after a successful build
          `arn:aws:ssm:${scope.region}:${scope.account}:parameter/ecr/${containerConfig.name}/lastBuiltCommit`, // Updates the last built commit, ensuring the record reflects the latest build state
        ],
      }),
    ],
  })
}
