import { ethers } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'

import deploymentManagerABI from '../contracts/abis/deploymentManager.json'

const getGuardian = async ({
  guardianId,
  deploymentManagerAddress,
  provider
}: {
  guardianId: string
  deploymentManagerAddress: string
  provider: ethers.providers.Provider
}): Promise<string> => {
  const DeploymentManagerContract = new ethers.Contract(
    deploymentManagerAddress,
    deploymentManagerABI,
    provider
  )

  return DeploymentManagerContract.getGuardian(
    keccak256(Buffer.from(guardianId))
  )
}

export default {
  getGuardian
}
