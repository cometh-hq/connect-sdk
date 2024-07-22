import {
  DefaultSponsoredFunctions,
  SponsoredTransaction
} from '../wallet/types'

const isSponsoredAddress = async (
  functionSelector: string,
  walletAddress: string,
  targetAddress: string,
  sponsoredAddresses?: SponsoredTransaction[],
  proxyDelayAddress?: string,
  delayModuleFactoryAddress?: string
): Promise<boolean> => {
  const isTxSponsorisedByDefault = await _isTxSponsorisedByDefault(
    functionSelector,
    walletAddress,
    targetAddress,
    proxyDelayAddress,
    delayModuleFactoryAddress
  )

  const isContractSponsorisedByProject = await _isContractSponsorisedByProject(
    targetAddress,
    sponsoredAddresses
  )

  if (isTxSponsorisedByDefault || isContractSponsorisedByProject) return true

  return false
}

const _isContractSponsorisedByProject = async (
  targetAddress: string,
  sponsoredAddresses?: SponsoredTransaction[]
): Promise<boolean> => {
  const sponsoredAddress = sponsoredAddresses?.find(
    (sponsoredAddress) =>
      sponsoredAddress.targetAddress.toLowerCase() ===
      targetAddress.toLowerCase()
  )

  return sponsoredAddress ? true : false
}

const _isTxSponsorisedByDefault = async (
  functionSelector: string,
  walletAddress: string,
  targetAddress: string,
  proxyDelayAddress?: string,
  delayModuleFactoryAddress?: string
): Promise<boolean> => {
  if (
    (functionSelector ===
      DefaultSponsoredFunctions.ADD_OWNER_FUNCTION_SELECTOR ||
      functionSelector ===
        DefaultSponsoredFunctions.REMOVE_OWNER_FUNCTION_SELECTOR) &&
    targetAddress === walletAddress
  )
    return true

  if (
    functionSelector ===
      DefaultSponsoredFunctions.SET_DELAY_TX_NONCE_SELECTOR &&
    targetAddress === proxyDelayAddress
  )
    return true

  if (
    functionSelector ===
      DefaultSponsoredFunctions.ENABLE_GUARDIAN_FUNCTION_SELECTOR &&
    (targetAddress === proxyDelayAddress || targetAddress === walletAddress)
  )
    return true

  if (
    functionSelector ===
      DefaultSponsoredFunctions.DEPLOY_DELAY_MODULE_FUNCTION_SELECTOR &&
    targetAddress === delayModuleFactoryAddress
  )
    return true

  if (
    functionSelector ===
      DefaultSponsoredFunctions.DISABLE_GUARDIAN_FUNCTION_SELECTOR &&
    targetAddress === proxyDelayAddress
  )
    return true

  return false
}

export default {
  isSponsoredAddress
}
