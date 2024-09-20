import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildStep, CodePipelineSource } from 'aws-cdk-lib/pipelines'

// Defines a CodeBuild step in a CI/CD pipeline to synthesize CDK templates and run security checks
export const synthStep = (source: CodePipelineSource) =>
  new CodeBuildStep('Synth', {
    input: source, // The input source for the pipeline, typically from a repository like GitHub or CodeCommit
    buildEnvironment: {
      buildImage: LinuxBuildImage.AMAZON_LINUX_2_5, // Amazon Linux 2023 for enhanced security, up-to-date packages, and compatibility
      privileged: true, // Enables Docker functionality, necessary for builds involving containerization
    },
    installCommands: ['npm install -g aws-cdk'], // Installs AWS CDK globally to ensure the correct version is used for synthesis
    commands: [
      'npm ci', // Installs dependencies cleanly, ensuring the environment matches the lock file exactly, which is critical for consistency and security
      'npm run build', // Builds the application, preparing code and artifacts for further testing and synthesis
      'npm run pipeline-test', // Runs tests specific to the pipeline environment, ensuring the codebase meets quality and security standards
      'npm run pipeline-nag', // Runs CDK Nag checks tailored for pipeline execution to enforce security and compliance requirements
    ],
  })
