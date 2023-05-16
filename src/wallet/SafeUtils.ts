import { Web3Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

import { BLOCK_EVENT_GAP, EIP712_SAFE_TX_TYPES } from '../constants'
import { Safe__factory } from '../contracts/types/factories'
import { SafeInterface } from '../contracts/types/Safe'
import { AlembicProvider } from './AlembicProvider'
import { MetaTransactionData } from './types'

const SafeInterface: SafeInterface = Safe__factory.createInterface()

const isDeployed = async (
  walletAddress: string,
  provider: Web3Provider | AlembicProvider
): Promise<boolean> => {
  try {
    await Safe__factory.connect(walletAddress, provider).deployed()
    return true
  } catch (error) {
    return false
  }
}

const getNonce = async (
  walletAddress: string,
  provider: Web3Provider | AlembicProvider
): Promise<number> => {
  return (await isDeployed(walletAddress, provider))
    ? (await Safe__factory.connect(walletAddress, provider).nonce()).toNumber()
    : 0
}

const getSuccessExecTransactionEvent = async (
  safeTxHash: string,
  walletAddress: string,
  provider: Web3Provider | AlembicProvider
): Promise<any> => {
  const safeInstance = await Safe__factory.connect(walletAddress, provider)

  const transactionEvents = await safeInstance.queryFilter(
    safeInstance.filters.ExecutionSuccess(),
    BLOCK_EVENT_GAP
  )
  const filteredTransactionEvent = transactionEvents.filter(
    (e) => e.args.txHash === safeTxHash
  )

  return filteredTransactionEvent[0]
}

const getFailedExecTransactionEvent = async (
  safeTxHash: string,
  walletAddress: string,
  provider: Web3Provider | AlembicProvider
): Promise<any> => {
  const safeInstance = await Safe__factory.connect(walletAddress, provider)

  const transactionEvents = await safeInstance.queryFilter(
    safeInstance.filters.ExecutionFailure(),
    BLOCK_EVENT_GAP
  )
  const filteredTransactionEvent = transactionEvents.filter(
    (e) => e.args.txHash === safeTxHash
  )

  return filteredTransactionEvent[0]
}

const formatWebAuthnSignatureForSafe = (
  signerAddress: string,
  signature: string
): string => {
  return `${ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'uint256'],
    [signerAddress, 65]
  )}00${ethers.utils
    .hexZeroPad(
      ethers.utils.hexValue(ethers.utils.arrayify(signature).length),
      32
    )
    .slice(2)}${signature.slice(2)}`
}

const getSafeTransactionHash = (
  walletAddress: string,
  transactionData: MetaTransactionData,
  chainId: number
): string => {
  return ethers.utils._TypedDataEncoder.hash(
    {
      chainId,
      verifyingContract: walletAddress
    },
    EIP712_SAFE_TX_TYPES,
    transactionData
  )
}

export default {
  isDeployed,
  getNonce,
  getSuccessExecTransactionEvent,
  getFailedExecTransactionEvent,
  formatWebAuthnSignatureForSafe,
  getSafeTransactionHash
}
