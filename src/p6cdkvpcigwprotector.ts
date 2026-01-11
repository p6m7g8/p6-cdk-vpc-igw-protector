import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as floyd from 'cdk-iam-floyd'

export interface IP6CDKVPCIGWProtectorProps {
}

export class P6CDKVPCIGWProtector extends cdk.Resource {
  constructor(scope: Construct, id: string, _props: IP6CDKVPCIGWProtectorProps) {
    super(scope, id)

    const policy = new floyd.Statement.Ec2()
      .allow()
      .toDetachInternetGateway()
      .toDeleteInternetGateway()
      .toDescribeVpcs()
      .toDescribeInternetGateways()
      .on('*')

    const fn = new lambdajs.NodejsFunction(this, 'p6CDKVPCIGWProtector', {
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: cdk.Duration.seconds(5),
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
    })

    fn.addToRolePolicy(policy)

    const rule = new events.Rule(this, 'vpcInternetGatewayAuthorizedVpcOnlyRule', {
      description: 'Detect unexpected Vpc Internet Gateways and remediates',
      eventPattern: {
        source: ['aws.ec2'],
        detail: {
          eventSource: ['ec2.amazonaws.com'],
          eventName: ['AttachInternetGateway'],
        },
      },
    })

    rule.addTarget(new targets.LambdaFunction(fn))
  }
}
