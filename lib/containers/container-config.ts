// Defines the structure for each container configuration
export interface ContainerConfig {
  name: string // Unique name of the container used across the stack
  dockerfilePath: string // Path to the Dockerfile for building the image
  contextPath: string // Directory containing Dockerfile and related files
  repositoryName: string // ECR repository name for storing the container image
}

// Array of container configurations for defining multiple containers
export const containerConfigs: ContainerConfig[] = [
  {
    name: 'app1', // Identifier for this container; used for naming and referencing
    dockerfilePath: 'lib/containers/app1/Dockerfile', // Location of the Dockerfile
    contextPath: 'lib/containers/app1', // Build context directory
    repositoryName: 'app1-repo', // ECR repository for this container
  },
  // Add more containers as needed to scale the setup
]
