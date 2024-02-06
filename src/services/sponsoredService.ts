import {
  DefaultSponsoredFunctions,
  SponsoredTransaction
} from '../wallet/types'

const isSponsoredAddress = async (
  functionSelector: string,
  walletAddress: string,
  targetAddress: string,
  sponsoredAddresses?: SponsoredTransaction[],
  proxyDelayAddress?: string
): Promise<boolean> => {
  const isTxSponsorisedByDefault = await _isTxSponsorisedByDefault(
    functionSelector,
    walletAddress,
    targetAddress,
    proxyDelayAddress
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
  proxyDelayAddress?: string
): Promise<boolean> => {
  if (
    functionSelector ===
      DefaultSponsoredFunctions.ADD_OWNER_FUNCTION_SELECTOR &&
    targetAddress === walletAddress
  )
    return true

  if (
    functionSelector ===
      DefaultSponsoredFunctions.SET_DELAY_TX_NONCE_SELECTOR &&
    targetAddress === proxyDelayAddress
  )
    return true

  return false
}

export default {
  isSponsoredAddress
}
