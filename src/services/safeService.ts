import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'

import { BLOCK_EVENT_GAP, EIP712_SAFE_TX_TYPES } from '../constants'
import { Safe__factory } from '../contracts/types/factories'
import { SafeInterface } from '../contracts/types/Safe'
import { AlembicProvider } from '../wallet/AlembicProvider'
import {
  MetaTransactionData,
  SafeTransactionDataPartial
} from '../wallet/types'

const SafeInterface: SafeInterface = Safe__factory.createInterface()

const isDeployed = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider | AlembicProvider
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
  provider: StaticJsonRpcProvider | AlembicProvider
): Promise<number> => {
  return (await isDeployed(walletAddress, provider))
    ? (await Safe__factory.connect(walletAddress, provider).nonce()).toNumber()
    : 0
}

const getSuccessExecTransactionEvent = async (
  safeTxHash: string,
  walletAddress: string,
  provider: StaticJsonRpcProvider | AlembicProvider
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
  provider: StaticJsonRpcProvider | AlembicProvider
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

const isSafeOwner = async (
  walletAddress: string,
  signerAddress: string,
  provider: StaticJsonRpcProvider
): Promise<boolean> => {
  const safeInstance = await Safe__factory.connect(walletAddress, provider)
  return await safeInstance.isOwner(signerAddress)
}

const prepareAddOwnerTx = async (
  walletAddress: string,
  newOwner: string
): Promise<MetaTransactionData> => {
  const tx = {
    to: walletAddress,
    value: '0x0',
    data: SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
      newOwner,
      1
    ]),
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: ethers.constants.AddressZero,
    refundReceiver: ethers.constants.AddressZero
  }
  return tx
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
  transactionData: SafeTransactionDataPartial,
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
  isSafeOwner,
  prepareAddOwnerTx,
  formatWebAuthnSignatureForSafe,
  getSafeTransactionHash
}
