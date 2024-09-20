import { BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildStep } from 'aws-cdk-lib/pipelines'

// Defines a CodeBuild step to run CDK Nag checks automatically triggered during CDK synthesis
export const cdkNagStep = new CodeBuildStep('CdkNagCheck', {
  buildEnvironment: {
    buildImage: LinuxBuildImage.AMAZON_LINUX_2_5, // Amazon Linux 2023 for latest security features and compatibility
    environmentVariables: {
      NODE_ENV: {
        value: 'TEST', // Setting NODE_ENV to 'TEST' automatically triggers CDK Nag during cdk synth, enforcing security and compliance checks
      },
    },
  },
  partialBuildSpec: BuildSpec.fromObject({
    version: '0.2',
    phases: {
      install: {
        'runtime-versions': {
          nodejs: 20, // Specifies Node.js version 20 for modern features, security, and performance
        },
        commands: ['npm ci', 'npm run build'], // Ensures a clean installation of dependencies and builds the project
      },
      build: {
        commands: ['npx cdk synth'], // Synthesizes the CDK app, which includes CDK Nag checks due to the NODE_ENV configuration
      },
    },
  }),
  commands: [],
})
