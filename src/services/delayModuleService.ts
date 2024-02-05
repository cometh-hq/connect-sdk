import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Contract, utils } from 'ethers'
import { MetaTransaction } from 'ethers-multisend'

import delayModuleABI from '../contracts/abis/Delay.json'

const DelayModule = new utils.Interface(delayModuleABI)

export type DelayContext = {
  delayModuleAddress: string
  moduleFactoryAddress: string
  recoveryCooldown: number
  recoveryExpiration: number
}

export const createSetTxNonceFunction = async (
  proxyDelayAddress: string,
  provider: StaticJsonRpcProvider
): Promise<MetaTransaction> => {
  const proxyDelayContract = new Contract(
    proxyDelayAddress,
    delayModuleABI,
    provider
  )

  const txNonce = await (await proxyDelayContract.txNonce()).toString()

  const newNonce = Number(txNonce) + 1

  return {
    to: proxyDelayAddress,
    value: '0x0',
    data: DelayModule.encodeFunctionData('setTxNonce', [newNonce]),
    operation: 0
  }
}

export const getCurrentRecoveryParams = async (
  delayModuleAddress: string,
  provider: StaticJsonRpcProvider
): Promise<{ txCreatedAt: string; txHash: string }> => {
  const contract = new Contract(delayModuleAddress, delayModuleABI, provider)

  const txNonce = await contract.txNonce()

  const [txCreatedAt, txHash] = await Promise.all([
    contract.getTxCreatedAt(txNonce),
    contract.getTxHash(txNonce)
  ])

  return { txCreatedAt, txHash }
}

export const isQueueEmpty = async (
  moduleAddress: string,
  provider: StaticJsonRpcProvider
): Promise<boolean> => {
  const contract = new Contract(moduleAddress, delayModuleABI, provider)

  const [txNonce, queueNonce] = await Promise.all([
    contract.txNonce(),
    contract.queueNonce()
  ])

  return txNonce.eq(queueNonce)
}

export default {
  createSetTxNonceFunction,
  getCurrentRecoveryParams,
  isQueueEmpty
}
