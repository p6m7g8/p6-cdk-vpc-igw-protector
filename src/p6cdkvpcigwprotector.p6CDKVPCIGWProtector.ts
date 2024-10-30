import type { DetachInternetGatewayCommandInput } from '@aws-sdk/client-ec2'
import type { Context } from 'aws-lambda'
import type { Logger } from 'winston'
import { EC2 } from '@aws-sdk/client-ec2'
import winston from 'winston'

// Configure the logger
const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'VPC-remediation' },
  transports: [new winston.transports.Console()],
})

const ec2 = new EC2({})

// Define the structure of the event details
interface VPCEvent {
  detail: {
    requestParameters: {
      internetGatewayId: DetachInternetGatewayCommandInput['InternetGatewayId']
      vpcId: DetachInternetGatewayCommandInput['VpcId']
    }
    errorCode?: string
    errorMessage?: string
  }
}

// Loop prevention function
function p6LoopPrevent(event: VPCEvent): boolean {
  if (event.detail.errorCode || event.detail.errorMessage) {
    logger.info('Previous API call resulted in an error. Ending')
    return true
  }
  return false
}

// Detach and delete Internet Gateway from VPC if not authorized
async function p6Ec2VpcInternetGatewayAuthorizedVpcOnly(event: VPCEvent): Promise<void> {
  if (p6LoopPrevent(event))
    return

  const igwId = event.detail.requestParameters.internetGatewayId
  const vpcId = event.detail.requestParameters.vpcId

  logger.info(`Processing Internet Gateway: ${igwId}`)
  try {
    // Detach IGW from VPC
    await ec2.detachInternetGateway({ InternetGatewayId: igwId, VpcId: vpcId })
    logger.info(`Detached IGW ${igwId} from VPC ${vpcId}`)

    // Delete IGW
    await ec2.deleteInternetGateway({ InternetGatewayId: igwId })
    logger.info(`Deleted IGW ${igwId}`)
  }
  catch (error) {
    logger.error(`Failed to process IGW ${igwId}: ${error}`)
  }
}

// Lambda handler
export async function handler(event: VPCEvent, _context?: Context): Promise<boolean> {
  await p6Ec2VpcInternetGatewayAuthorizedVpcOnly(event)
  return true
}

// Main function for developer testing
export async function main(): Promise<void> {
  logger.debug('Testing handler()')
  await handler({
    detail: {
      requestParameters: {
        internetGatewayId: 'igw-1234567890',
        vpcId: 'vpc-1234567890',
      },
    },
  })
}

// Execute main function if script is run directly
if (require.main === module) {
  main()
}
