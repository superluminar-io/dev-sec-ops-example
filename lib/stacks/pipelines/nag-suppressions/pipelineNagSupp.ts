import { Stack } from 'aws-cdk-lib'
import { NagSuppressions } from 'cdk-nag'
import { containerConfigs } from '../../../containers/container-config'

// Common suppression reasons to reduce redundancy and improve readability
const reasonIam5 =
  'The permissions required by the construct are necessary for proper functioning. They have been reviewed and accepted as appropriate for this demonstration.'
const reasonCb4 =
  'KMS encryption is not enabled for this CodeBuild project because it is not necessary in this demo environment. For production, consider enabling KMS encryption to secure sensitive information.'

export const pipelineNagSuppressions = (stack: Stack) => {
  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/ArtifactsBucket/Resource',
    [
      {
        id: 'AwsSolutions-S1',
        reason:
          'Server access logging is disabled for the S3 bucket because this is a demo project. Enabling logging is not critical in this context.',
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Role/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Source/michelangelo17_dev-sec-ops-example/CodePipelineActionRole/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/TestWave/CdkNagCheck/CdkNagCheck/Role/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/TestWave/CdkNagCheck/CdkNagCheck/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/UpdatePipeline/SelfMutation/Role/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/UpdatePipeline/SelfMutation/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileRole/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileAsset1/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Build/Synth/CdkBuildProject/Role/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Build/Synth/CdkBuildProject/Resource',
    [
      {
        id: 'AwsSolutions-CB3',
        reason:
          'Privileged mode is enabled for Docker support in this CodeBuild project. This setting is required for the build process.',
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Build/Synth/CdkBuildProject/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/ECRStage/app1-build/app1-build/Role/DefaultPolicy/Resource',
    [
      {
        id: 'AwsSolutions-IAM5',
        reason: reasonIam5,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/ECRStage/app1-build/app1-build/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileAsset2/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileAsset3/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  containerConfigs.forEach((containerConfig) => {
    const containerName = containerConfig.name

    // AppSecurityCheck suppressions
    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}AppSecurityCheck/${containerName}AppSecurityCheck/Role/DefaultPolicy/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: reasonIam5,
        },
      ]
    )

    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}AppSecurityCheck/${containerName}AppSecurityCheck/Resource`,
      [
        {
          id: 'AwsSolutions-CB4',
          reason: reasonCb4,
        },
      ]
    )

    // EcrSecurityScan suppressions
    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}EcrSecurityScan/${containerName}EcrSecurityScan/Role/DefaultPolicy/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: reasonIam5,
        },
      ]
    )

    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}EcrSecurityScan/${containerName}EcrSecurityScan/Resource`,
      [
        {
          id: 'AwsSolutions-CB4',
          reason: reasonCb4,
        },
      ]
    )

    // ContainerTest suppressions
    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}Test/${containerName}Test/Role/DefaultPolicy/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: reasonIam5,
        },
      ]
    )

    NagSuppressions.addResourceSuppressionsByPath(
      stack,
      `/PipelineStack/Pipeline/Pipeline/TestWave/${containerName}Test/${containerName}Test/Resource`,
      [
        {
          id: 'AwsSolutions-CB4',
          reason: reasonCb4,
        },
      ]
    )
  })

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Build/Synth/CdkBuildProject/Resource',
    [
      {
        id: 'AwsSolutions-CB3',
        reason:
          'Privileged mode is enabled for Docker support in this CodeBuild project. This setting is required for the build process.',
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/Build/Synth/CdkBuildProject/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Pipeline/ECRStage/app1-build/app1-build/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileAsset2/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    '/PipelineStack/Pipeline/Assets/FileAsset3/Resource',
    [
      {
        id: 'AwsSolutions-CB4',
        reason: reasonCb4,
      },
    ]
  )
}
