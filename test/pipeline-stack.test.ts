import * as fs from 'fs'
import * as path from 'path'
import { Template } from 'aws-cdk-lib/assertions'

describe('PipelineStack', () => {
  let template: Template

  beforeAll(() => {
    const templatePath = path.join(
      __dirname,
      '../cdk.out/PipelineStack.template.json'
    )
    const synthesizedTemplate = JSON.parse(
      fs.readFileSync(templatePath, 'utf8')
    )
    template = Template.fromJSON(synthesizedTemplate)
  })

  it('creates a CodeStar connection', () => {
    template.resourceCountIs('AWS::CodeStarConnections::Connection', 1)
    template.hasResourceProperties('AWS::CodeStarConnections::Connection', {
      ConnectionName: 'GitHubConnection',
      ProviderType: 'GitHub',
    })
  })

  it('creates a CodePipeline with correct name', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1)
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'Pipeline',
    })
  })

  it('creates necessary IAM roles with least privilege', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'codepipeline.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    })

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    })
  })
})
