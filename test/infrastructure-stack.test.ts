import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { InfrastructureStack } from '../lib/stacks/deployments/infrastructure-stack'

describe('InfrastructureStack', () => {
  let app: App
  let stack: InfrastructureStack
  let template: Template

  beforeEach(() => {
    app = new App()
    stack = new InfrastructureStack(app, 'TestStack', {
      stageName: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    })
    template = Template.fromStack(stack)
  })

  test('VPC is created', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
      Tags: [{ Key: 'Name', Value: 'test-vpc' }],
    })
  })

  test('ECS Cluster is created', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1)

    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: [{ Name: 'containerInsights', Value: 'enabled' }],
    })
  })

  test('Application Load Balancer is created', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    )
  })

  test('Fargate Service is created', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      DesiredCount: 1,
    })
  })

  test('WAF WebACL is created', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      DefaultAction: { Allow: {} },
      Scope: 'REGIONAL',
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: 'WAFMetrics',
        SampledRequestsEnabled: true,
      },
    })
  })

  test('WAF WebACL Association is created', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {})
  })

  test('VPC Flow Logs are enabled', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
    })
  })

  test('CloudWatch Log Group for VPC Flow Logs is created', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/vpc-flow-logs/test',
    })
  })
})
