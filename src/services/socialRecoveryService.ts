import { utils } from 'ethers'

import socialRecoveryModuleABI from '../contracts/abis/socialRecoveryModule.json'
import { MetaTransactionData } from '../wallet/types'

const SocialRecoveryInterface = new utils.Interface(socialRecoveryModuleABI)

const prepareAddGuardianTx = async (
  socialRecoveryModuleAddress: string,
  walletAddress: string,
  newGuardian: string,
  newGuardianThreshold: number
): Promise<MetaTransactionData> => {
  const tx = {
    to: socialRecoveryModuleAddress,
    value: '0x00',
    data: SocialRecoveryInterface.encodeFunctionData(
      'addGuardianWithThreshold',
      [walletAddress, newGuardian, newGuardianThreshold]
    )
  }
  return tx
}

export default {
  prepareAddGuardianTx
}
