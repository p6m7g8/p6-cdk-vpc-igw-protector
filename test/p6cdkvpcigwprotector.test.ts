import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { P6CDKVPCIGWProtector } from '../src'

it('p6CDKVPCIGWProtector snapshot test', () => {
  const app = new cdk.App()
  const stack = new cdk.Stack(app, 'MyStack')

  // WHEN
  new P6CDKVPCIGWProtector(stack, 'p6-cdk-vpc-igw-protector', {})

  // THEN
  const template = Template.fromStack(stack).toJSON()
  expect(template).toMatchSnapshot()
})
