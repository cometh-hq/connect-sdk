import { arrayify } from '@ethersproject/bytes'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { pack as solidityPack } from '@ethersproject/solidity'
import {
  _TypedDataEncoder,
  defaultAbiCoder,
  getAddress,
  hexValue,
  hexZeroPad
} from 'ethers/lib/utils'
import { MetaTransaction } from 'ethers-multisend'

import {
  BLOCK_EVENT_GAP,
  EIP712_SAFE_TX_TYPES,
  SAFE_SENTINEL_OWNERS
} from '../constants'
import { Safe__factory } from '../contracts/types/factories'
import {
  ExecutionFailureEvent,
  ExecutionSuccessEvent,
  SafeInterface
} from '../contracts/types/Safe'
import { ComethProvider } from '../wallet/ComethProvider'
import {
  AddressAlreadyOwnerError,
  AddressNotOwnerError,
  DelayModuleDoesNotExistError,
  IsModuleEnabledError,
  WalletDoesNotExistsError,
  WalletNotDeployedError
} from '../wallet/errors'
import {
  MetaTransactionData,
  SafeTransactionDataPartial
} from '../wallet/types'
import { API } from './API'

const SafeInterface: SafeInterface = Safe__factory.createInterface()

const isDeployed = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider | ComethProvider
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
  provider: StaticJsonRpcProvider | ComethProvider
): Promise<number> => {
  return (await isDeployed(walletAddress, provider))
    ? (await Safe__factory.connect(walletAddress, provider).nonce()).toNumber()
    : 0
}

const getSuccessExecTransactionEvent = async (
  safeTxHash: string,
  walletAddress: string,
  provider: StaticJsonRpcProvider | ComethProvider
): Promise<ExecutionSuccessEvent> => {
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
  provider: StaticJsonRpcProvider | ComethProvider
): Promise<ExecutionFailureEvent> => {
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
  if ((await isDeployed(walletAddress, provider)) === true) {
    return await safeInstance.isOwner(signerAddress)
  } else {
    throw new WalletNotDeployedError()
  }
}

const getOwners = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider
): Promise<string[]> => {
  const safeInstance = await Safe__factory.connect(walletAddress, provider)

  return await safeInstance.getOwners()
}

const prepareAddOwnerTx = async (
  walletAddress: string,
  newOwner: string,
  provider: StaticJsonRpcProvider
): Promise<MetaTransaction> => {
  if ((await isDeployed(walletAddress, provider)) === true) {
    const ownerList = await getOwners(walletAddress, provider)

    if (ownerList.find((owner) => owner === newOwner))
      throw new AddressAlreadyOwnerError()
  }

  const tx = {
    to: walletAddress,
    value: '0x0',
    data: SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
      newOwner,
      1
    ]),
    operation: 0
  }
  return tx
}

const prepareRemoveOwnerTx = async (
  walletAddress: string,
  owner: string,
  provider: StaticJsonRpcProvider
): Promise<MetaTransaction> => {
  if ((await isDeployed(walletAddress, provider)) === false)
    throw new WalletNotDeployedError()

  const prevOwner = await getSafePreviousOwner(walletAddress, owner, provider)

  const tx = {
    to: walletAddress,
    value: '0x0',
    data: SafeInterface.encodeFunctionData('removeOwner', [
      prevOwner,
      owner,
      1
    ]),
    operation: 0
  }
  return tx
}

const getSafePreviousOwner = async (
  walletAddress: string,
  owner: string,
  provider: StaticJsonRpcProvider
): Promise<string> => {
  const ownerList = await getOwners(walletAddress, provider)
  const index = ownerList.findIndex((ownerToFind) => ownerToFind == owner)

  if (index === -1) throw new AddressNotOwnerError()

  let prevOwner: string

  if (index !== 0) {
    prevOwner = getAddress(ownerList[index - 1])
  } else {
    prevOwner = getAddress(hexZeroPad(SAFE_SENTINEL_OWNERS, 20))
  }

  return prevOwner
}

const formatToSafeContractSignature = (
  signerAddress: string,
  signature: string
): string => {
  const dataOffsetInBytes = 65

  // signature verifier and data position
  const verifierAndDataPosition = defaultAbiCoder.encode(
    ['uint256', 'uint256'],
    [signerAddress, dataOffsetInBytes]
  )

  // signature type, 0 here
  const signatureType = '00'

  // zero padded length of verified signature
  const signatureLength = hexZeroPad(
    hexValue(arrayify(signature).length),
    32
  ).slice(2)

  // signatures bytes that are verified by the signature verifier
  const data = signature.slice(2)

  return `${verifierAndDataPosition}${signatureType}${signatureLength}${data}`
}

const getSafeTransactionHash = (
  walletAddress: string,
  transactionData: SafeTransactionDataPartial,
  chainId: number
): string => {
  return _TypedDataEncoder.hash(
    {
      chainId,
      verifyingContract: walletAddress
    },
    EIP712_SAFE_TX_TYPES,
    transactionData
  )
}

const getTransactionsTotalValue = async (
  safeTxData: MetaTransactionData[]
): Promise<string> => {
  let txValue = 0
  for (let i = 0; i < safeTxData.length; i++) {
    txValue += parseInt(safeTxData[i].value)
  }
  return txValue.toString()
}

const isSigner = async (
  signerAddress: string,
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  API: API
): Promise<boolean> => {
  try {
    const owner = await isSafeOwner(walletAddress, signerAddress, provider)

    if (!owner) return false
  } catch {
    const predictedWalletAddress = await API.getWalletAddress(signerAddress)

    if (predictedWalletAddress !== walletAddress) return false
  }

  return true
}

const getFunctionSelector = (transactionData: MetaTransactionData): string => {
  return transactionData.data.toString().slice(0, 10)
}

const _encodeMetaTransaction = (tx: MetaTransactionData): string => {
  const data = arrayify(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [0, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

const encodeMultiSendDataForEstimate = (txs: MetaTransactionData[]): string => {
  return `0x${txs.map((tx) => _encodeMetaTransaction(tx)).join('')}`
}

const getSafeVersion = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider
): Promise<string> => {
  try {
    await isDeployed(walletAddress, provider)

    const safe = await Safe__factory.connect(walletAddress, provider).deployed()

    return await safe.VERSION()
  } catch {
    throw new WalletNotDeployedError()
  }
}

const encodeEnableModule = async (address: string): Promise<string> => {
  return SafeInterface.encodeFunctionData('enableModule', [address])
}

const isModuleEnabled = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  moduleAddress: string
): Promise<boolean> => {
  if (!walletAddress) throw new WalletDoesNotExistsError()
  if (!moduleAddress || moduleAddress === '0x')
    throw new DelayModuleDoesNotExistError()
  if (!(await isDeployed(walletAddress, provider)))
    throw new WalletNotDeployedError()

  try {
    return Safe__factory.connect(walletAddress, provider).isModuleEnabled(
      moduleAddress
    )
  } catch {
    throw new IsModuleEnabledError()
  }
}

export default {
  isDeployed,
  getNonce,
  getSuccessExecTransactionEvent,
  getFailedExecTransactionEvent,
  isSafeOwner,
  getOwners,
  prepareAddOwnerTx,
  getSafePreviousOwner,
  prepareRemoveOwnerTx,
  formatToSafeContractSignature,
  getSafeTransactionHash,
  getTransactionsTotalValue,
  isSigner,
  getFunctionSelector,
  encodeMultiSendDataForEstimate,
  getSafeVersion,
  encodeEnableModule,
  isModuleEnabled
}
