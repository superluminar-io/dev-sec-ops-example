import { Stack, StackProps, Stage } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
} from 'aws-cdk-lib/pipelines'
import { CfnConnection } from 'aws-cdk-lib/aws-codestarconnections'
import { InfrastructureStack } from '../deployments/infrastructure-stack'
import { cdkNagStep } from './pipeline-steps/test-wave/cdkNagStep'
import { pipelineNagSuppressions } from './nag-suppressions/pipelineNagSupp'
import { createCodeScanStep } from './pipeline-steps/test-wave/codeScanStep'
import { synthStep } from './pipeline-steps/synth/synthStep'
import { ECRStack } from '../deployments/ecr-stack'
import { containerConfigs } from '../../containers/container-config'
import { createDockerBuildStep } from './pipeline-steps/docker-build-wave/createDockerBuildStep'
import { createEcrScanStep } from './pipeline-steps/test-wave/ecrScanStep'
import { createContainerTestStep } from './pipeline-steps/test-wave/containerTestStep'

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const env = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    }

    // Need to log in on the console after first deployment to finish connection to github, then restart the pipeline.
    // Go to CodePipeline, settings, update the connection to github and save.

    const ownerRepo = 'michelangelo17/dev-sec-ops-example'
    const branch = 'main'

    // Create a connection to GitHub for source code integration.
    // This uses AWS CodeStar Connections to securely connect to GitHub.
    const githubConnection = new CfnConnection(this, 'GitHubConnection', {
      connectionName: 'GitHubConnection',
      providerType: 'GitHub',
    })

    // Define the source of the pipeline as the GitHub repository.
    // This will trigger the pipeline whenever there are changes in the specified branch.
    const source = CodePipelineSource.connection(ownerRepo, branch, {
      connectionArn: githubConnection.attrConnectionArn,
      codeBuildCloneOutput: true,
    })

    // Create the pipeline and define the synthesis step.
    // The synth step is responsible for synthesizing the CDK app into a CloudFormation template.
    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      synth: synthStep(source),
    })

    // Define Stages that wrap InfrastructureStack
    // Stages are used to group related actions and ensure they are executed sequentially.

    // ECRStage is responsible for setting up the Elastic Container Registry (ECR).
    const ecrStage = new Stage(this, 'ECRStage', { env })
    new ECRStack(ecrStage, 'ECRStack', { env })

    // DevStage is responsible for setting up the development environment.
    const devStage = new Stage(this, 'DevStage', { env })
    new InfrastructureStack(devStage, 'DevInfrastructureStack', {
      stageName: 'dev',
      env,
    })

    // StagingStage is responsible for setting up the staging environment.
    const stagingStage = new Stage(this, 'StagingStage', { env })
    new InfrastructureStack(stagingStage, 'StagingInfrastructureStack', {
      stageName: 'staging',
      env,
    })

    // ProductionStage is responsible for setting up the production environment.
    const prodStage = new Stage(this, 'ProductionStage', { env })
    new InfrastructureStack(prodStage, 'ProductionInfrastructureStack', {
      stageName: 'prod',
      env,
    })

    // Waves allow for parallel execution of stages, which can speed up the pipeline.
    // This is useful for tasks that can be done concurrently, such as building Docker images.
    const dockerBuildWave = pipeline.addWave('DockerBuildWave')
    dockerBuildWave.addStage(ecrStage)
    containerConfigs.forEach((containerConfig) => {
      dockerBuildWave.addPost(createDockerBuildStep(this, containerConfig))
    })

    // DevWave ensures that the development environment is set up and tested before moving to further stages.
    const devWave = pipeline.addWave('DevWave')
    devWave.addStage(devStage)

    // TestWave includes security and compliance checks, which are crucial for DevSecOps practices.
    // These steps ensure that code and dependencies are secure before moving to staging.
    const testWave = pipeline.addWave('TestWave')
    testWave.addPost(cdkNagStep) // cdkNagStep checks for security and compliance issues in the CDK code.
    containerConfigs.forEach((containerConfig) => {
      testWave.addPost(
        createCodeScanStep(containerConfig) // Scans code for vulnerabilities with eslint.
      )
      testWave.addPost(createEcrScanStep(this, containerConfig)) // Scans Docker images for vulnerabilities.
      testWave.addPost(createContainerTestStep(containerConfig)) // Runs tests for each container
    })

    // StagingWave includes a manual approval step to ensure human oversight before deploying to production.
    const stagingWave = pipeline.addWave('StagingWave')
    stagingWave.addStage(stagingStage)
    stagingWave.addPost(
      new ManualApprovalStep('ApproveProduction', {
        comment: 'Review the staging deployment and approve for production',
      })
    )

    // ProductionWave deploys to the production environment.
    const prodWave = pipeline.addWave('ProductionWave')
    prodWave.addStage(prodStage)

    // Build the pipeline and apply any necessary security suppressions.
    pipeline.buildPipeline()
    pipelineNagSuppressions(this)
  }
}
