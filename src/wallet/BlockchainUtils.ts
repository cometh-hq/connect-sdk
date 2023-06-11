import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { networks } from '../constants'

const getProvider = (
  chainId: number,
  rpcUrl?: string
): StaticJsonRpcProvider => {
  return new StaticJsonRpcProvider(rpcUrl ? rpcUrl : networks[chainId].RPCUrl)
}

const getBalance = async (
  address: string,
  provider: StaticJsonRpcProvider
): Promise<BigNumber> => {
  return provider.getBalance(address)
}

export default {
  getProvider,
  getBalance
}
