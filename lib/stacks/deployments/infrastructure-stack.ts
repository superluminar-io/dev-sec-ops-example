import { ArnFormat, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  FlowLogDestination,
  FlowLogTrafficType,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import { Cluster, ContainerImage } from 'aws-cdk-lib/aws-ecs'
import {
  CfnLoggingConfiguration,
  CfnWebACL,
  CfnWebACLAssociation,
} from 'aws-cdk-lib/aws-wafv2'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import {
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { NagSuppressions } from 'cdk-nag'
import { containerConfigs } from '../../containers/container-config'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'

interface InfrastructureStackProps extends StackProps {
  stageName: string
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props)

    // Create a CloudWatch log group for VPC flow logs
    const flowLogGroup = new LogGroup(
      this,
      `${props.stageName}-flow-log-group`,
      {
        logGroupName: `/aws/vpc-flow-logs/${props.stageName}`, // Custom log group name
      }
    )

    // Create an IAM role for the VPC flow logs to write to CloudWatch Logs
    const flowLogRole = new Role(this, `${props.stageName}-flow-log-role`, {
      assumedBy: new ServicePrincipal('vpc-flow-logs.amazonaws.com'), // Allows VPC flow logs to assume this role
    })

    // Add permissions to the flow log role to write to CloudWatch Logs
    flowLogRole.addToPolicy(
      new PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'], // Minimal permissions required for writing logs
        resources: [flowLogGroup.logGroupArn],
      })
    )

    // Suppression: Justified since this is a demo and the managed policy suffices
    NagSuppressions.addResourceSuppressions(flowLogRole, [
      {
        id: 'AwsSolutions-IAM4',
        reason:
          'AWS Managed policy has been reviewed and deemed appropriate for this example project.',
      },
    ])

    // Define the VPC with public and private subnets, one NAT Gateway, and flow logs
    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2, // Limited to 2 Availability Zones for simplicity
      vpcName: `${props.stageName}-vpc`,
      natGateways: 1, // Using a single NAT Gateway to reduce costs; consider High Availability in production
      subnetConfiguration: [
        {
          cidrMask: 24, // CIDR block size
          name: `${props.stageName}-public`, // Public subnet for internet-facing resources
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${props.stageName}-private`, // Private subnet for backend services
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      flowLogs: {
        MyVpcFlowLog: {
          trafficType: FlowLogTrafficType.ALL, // Captures all traffic for monitoring and troubleshooting
          destination: FlowLogDestination.toCloudWatchLogs(
            flowLogGroup,
            flowLogRole
          ), // Logs sent to CloudWatch
        },
      },
    })

    // Create an ECS cluster within the VPC
    const cluster = new Cluster(this, `${props.stageName}-Cluster`, {
      vpc,
      containerInsights: true, // Enables container insights for performance monitoring
    })

    // Map each container configuration to a container image object
    const containerImages = containerConfigs.map((containerConfig) => ({
      name: containerConfig.name,
      image: ContainerImage.fromEcrRepository(
        Repository.fromRepositoryName(
          this,
          `${containerConfig.name}-repository`,
          containerConfig.repositoryName
        ),
        StringParameter.fromStringParameterName(
          this,
          `${containerConfig.name}-image-tag`,
          `/ecr/${containerConfig.name}/imageTag`
        ).stringValue // Fetches the latest image tag from SSM Parameter Store
      ),
    }))

    // Creates a new Application Load Balanced Fargate Service for each container
    // This is simplified for demonstration; in real scenarios, you might combine services or use task definitions with multiple containers
    // TODO: Always use a CloudFront distribution in front of a load balancer
    // CloudFront provides several benefits:
    // 1. Improved security by acting as a shield against DDoS attacks
    // 2. Better performance through content caching at edge locations
    // 3. Reduced load on your origin servers
    // 4. Simplified SSL/TLS certificate management
    // 5. Additional features like custom error pages and URL signing
    const fargateApplicationLoadBalancedServices = containerImages.map(
      ({ name, image }) =>
        new ApplicationLoadBalancedFargateService(
          this,
          `${props.stageName}-${name}-FargateApplicationLoadBalancedService`,
          {
            cluster, // ECS Cluster
            taskImageOptions: {
              image,
              containerPort: 3000, // Assumes container exposes port 3000; adjust as needed
            },
            desiredCount: props.stageName === 'prod' ? 2 : 1, // Higher availability in production
            circuitBreaker: {
              rollback: true, // Automatic rollback on deployment failures
            },
          }
        )
    )

    // Apply suppressions and additional configurations to each Fargate service
    fargateApplicationLoadBalancedServices.forEach(
      (fargateApplicationLoadBalancedService) => {
        // Suppression: ELB access logs disabled; deemed unnecessary for example context
        NagSuppressions.addResourceSuppressions(
          fargateApplicationLoadBalancedService.loadBalancer,
          [
            {
              id: 'AwsSolutions-ELB2',
              reason:
                'Access logs are disabled for this Load Balancer as this is a demo. Enable in production for audit and troubleshooting purposes.',
            },
          ]
        )

        // Suppression: Open security group for demo; secure in production
        NagSuppressions.addResourceSuppressions(
          fargateApplicationLoadBalancedService.loadBalancer.connections
            .securityGroups,
          [
            {
              id: 'AwsSolutions-EC23',
              reason:
                'Security group allows 0.0.0.0/0 or ::/0 access for demonstration. In production, restrict access, ideally from CloudFront.',
            },
          ]
        )

        // Suppression: Acceptable wildcard permissions for demonstration; restrict in production
        NagSuppressions.addResourceSuppressions(
          fargateApplicationLoadBalancedService.taskDefinition,
          [
            {
              id: 'AwsSolutions-IAM5',
              reason:
                'Wildcard permissions are acceptable in this demo scenario. In a real environment, fine-tune permissions to least privilege.',
            },
          ]
        )

        // Suppression: Execution role policy also uses wildcard; ensure review and restriction in real applications
        const executionRolePolicy =
          fargateApplicationLoadBalancedService.taskDefinition.executionRole?.node.findChild(
            'DefaultPolicy'
          ) as Policy

        if (executionRolePolicy) {
          NagSuppressions.addResourceSuppressions(executionRolePolicy, [
            {
              id: 'AwsSolutions-IAM5',
              reason:
                'Wildcard permissions are used here for simplicity in the demo context. For production, review and restrict these policies carefully.',
            },
          ])
        }

        // Configure health check for the ALB target group
        fargateApplicationLoadBalancedService.targetGroup.configureHealthCheck({
          path: '/health', // Health check path
          healthyHttpCodes: '200', // Expecting HTTP 200 for a healthy response
        })

        // The WAF configuration includes basic AWS Managed Rules for common protections against known vulnerabilities.
        // Additional managed rule sets, such as SQLi, Linux, Windows, PHP, and Admin Protection, are available but not included
        // here to avoid disrupting the demo environment. These rules can block legitimate traffic and require careful tuning.
        // Consider adding them in production environments for enhanced security if your application requires those specific protections.
        const waf = new CfnWebACL(this, `${props.stageName}-WAF`, {
          defaultAction: { allow: {} }, // The default action is to allow requests unless a rule explicitly blocks them
          scope: 'REGIONAL', // WAF is applied regionally, matching the scope of the resources it's protecting
          visibilityConfig: {
            cloudWatchMetricsEnabled: true, // Enables CloudWatch metrics to monitor WAF activity
            metricName: 'WAFMetrics', // The base name for CloudWatch metrics associated with this WAF
            sampledRequestsEnabled: true, // Allows sampling of requests for detailed analysis
          },
          rules: [
            {
              // Rate limiting rule to protect against high-volume requests from a single IP address
              name: 'LimitRequests100',
              priority: 1, // Priority determines the order in which rules are evaluated; lower numbers are evaluated first
              action: { block: {} }, // Blocks requests that exceed the defined rate limit
              visibilityConfig: {
                cloudWatchMetricsEnabled: true, // Enables metrics specific to this rule for monitoring
                metricName: 'LimitRequests100', // Metric name for tracking rate limit enforcement
                sampledRequestsEnabled: true,
              },
              statement: {
                rateBasedStatement: {
                  limit: 100, // Sets a rate limit of 100 requests per 5 minutes from a single IP address
                  aggregateKeyType: 'IP', // The aggregation key type specifies that the limit is applied per IP address
                },
              },
            },
            {
              // AWS Managed Rule Set providing protection against common web vulnerabilities like XSS and SQL injection
              name: 'AWSManagedRulesCommonRuleSet',
              priority: 2, // Evaluated after the rate limiting rule; higher priority if lower numbers have not blocked the request
              overrideAction: { none: {} }, // Allows requests to pass unless the rule explicitly blocks them; no automatic blocking
              visibilityConfig: {
                cloudWatchMetricsEnabled: true, // Enables monitoring metrics for this managed rule set
                metricName: 'CommonRules',
                sampledRequestsEnabled: true,
              },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS', // Indicates AWS as the provider of this managed rule group
                  name: 'AWSManagedRulesCommonRuleSet', // Name of the specific managed rule group being used
                },
              },
            },
            {
              // Managed rule set that blocks requests with known bad inputs, such as malicious payloads
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              priority: 3, // Evaluated after the Common Rule Set; ensures common vulnerabilities are checked first
              overrideAction: { none: {} }, // Allows the rule to evaluate without enforcing a block unless explicitly triggered
              visibilityConfig: {
                cloudWatchMetricsEnabled: true, // Allows tracking of how often these rules are triggered
                metricName: 'KnownBadInputs',
                sampledRequestsEnabled: true,
              },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesKnownBadInputsRuleSet',
                },
              },
            },
            {
              // Blocks traffic from IP addresses that are part of known malicious activity, such as botnets
              name: 'AWSManagedRulesAmazonIpReputationList',
              priority: 4, // Evaluated after checking for common attacks and bad inputs
              overrideAction: { none: {} }, // Allows metrics gathering without disrupting legitimate traffic
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'AmazonIpReputation',
                sampledRequestsEnabled: true,
              },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesAmazonIpReputationList',
                },
              },
            },
            {
              // Provides basic bot protection, blocking known bad bots while allowing legitimate bots through
              name: 'AWSManagedRulesBotControlRuleSet',
              priority: 5, // Lowest priority in this set, ensuring that other protections are applied first
              overrideAction: { none: {} }, // No automatic blocking; primarily for monitoring bot activity
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'BotControl',
                sampledRequestsEnabled: true,
              },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesBotControlRuleSet',
                },
              },
            },
          ],
        })

        // Associate the WAF with the Application Load Balancer
        const wafAssociation = new CfnWebACLAssociation(
          this,
          `${props.stageName}-WAFAssociation`,
          {
            resourceArn:
              fargateApplicationLoadBalancedService.loadBalancer
                .loadBalancerArn,
            webAclArn: waf.attrArn, // WAF ARN
          }
        )
      }
    )
  }
}
