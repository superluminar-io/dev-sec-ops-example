import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { ECRStack } from '../lib/stacks/deployments/ecr-stack'
import { containerConfigs } from '../lib/containers/container-config'

describe('ECRStack', () => {
  let app: App
  let stack: ECRStack
  let template: Template

  beforeEach(() => {
    app = new App()
    stack = new ECRStack(app, 'TestECRStack')
    template = Template.fromStack(stack)
  })

  test('ECR Repositories are created for each container config', () => {
    containerConfigs.forEach((config) => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: config.repositoryName,
      })
    })
  })

  test('SSM Parameters are created for repository URIs', () => {
    containerConfigs.forEach((config) => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/ecr/${config.name}/repositoryUri`,
        Type: 'String',
      })
    })
  })

  test('Correct number of resources are created', () => {
    const resourceCount = Object.keys(template.toJSON().Resources).length
    expect(resourceCount).toBeGreaterThanOrEqual(containerConfigs.length * 2) // At least Repository and SSM Parameter for each config
    console.log(`Total number of resources: ${resourceCount}`)
  })

  test('Repository has correct properties', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: containerConfigs[0].repositoryName,
    })
  })
})
