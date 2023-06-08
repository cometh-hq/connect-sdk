import { ethers } from 'ethers'

import { networks } from '../constants'

const getProvider = (
  chainId: number,
  rpcUrl?: string
): ethers.providers.StaticJsonRpcProvider => {
  return new ethers.providers.StaticJsonRpcProvider(
    rpcUrl ? rpcUrl : networks[chainId].RPCUrl
  )
}

export default {
  getProvider
}
