import { arrayify } from '@ethersproject/bytes'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { pack as solidityPack } from '@ethersproject/solidity'
import { BigNumber } from 'ethers'
import { MetaTransaction } from 'ethers-multisend'

import { MAX_TRIES_SAFETXGAS } from '../constants'
import {
  Multisend__factory,
  Safe__factory,
  SimulateTxAcessor__factory
} from '../contracts/types/factories'
import { MultisendInterface } from '../contracts/types/Multisend'
import { SafeInterface } from '../contracts/types/Safe'
import { SimulateTxAcessorInterface } from '../contracts/types/SimulateTxAcessor'
import { isMetaTransactionArray, wait } from '../utils/utils'
import safeService from './safeService'

const MultisendContract: MultisendInterface =
  Multisend__factory.createInterface()
const SimulateTxContract: SimulateTxAcessorInterface =
  SimulateTxAcessor__factory.createInterface()
const SafeContract: SafeInterface = Safe__factory.createInterface()

const encodeMetaTransaction = (tx: MetaTransaction): string => {
  const data = arrayify(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [0, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

const encodeMultiSendDataForEstimate = (txs: MetaTransaction[]): string => {
  return `0x${txs.map((tx) => encodeMetaTransaction(tx)).join('')}`
}

const _addExtraGasForSafety = (safeTxGas: string): string => {
  const INCREASE_GAS_FACTOR = 1.1 // increase the gas by 10% as a security margin

  return Math.round(Number(safeTxGas) * INCREASE_GAS_FACTOR).toString()
}

const estimateSafeTxGasWithSimulate = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  safeTxData: MetaTransaction[] | MetaTransaction,
  multisendAddress: string,
  singletonAddress: string,
  simulateTxAcessorAddress: string
): Promise<BigNumber> => {
  let transaction: MetaTransaction

  if (isMetaTransactionArray(safeTxData) && safeTxData.length !== 1) {
    const multisendData = encodeMultiSendDataForEstimate(safeTxData)

    transaction = {
      to: multisendAddress,
      value: '0',
      data: MultisendContract.encodeFunctionData('multiSend', [multisendData]),
      operation: 1
    }
  } else {
    transaction = {
      ...safeTxData,
      operation: 0
    } as MetaTransaction
  }

  const isSafeDeployed = await safeService.isDeployed(walletAddress, provider)

  const transactionDataToEstimate = SimulateTxContract.encodeFunctionData(
    'simulate',
    [
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation!
    ]
  )

  // if the Safe is not deployed we can use the singleton address to simulate
  const to = isSafeDeployed ? walletAddress : singletonAddress

  const safeFunctionToEstimate = SafeContract.encodeFunctionData(
    'simulateAndRevert',
    [simulateTxAcessorAddress, transactionDataToEstimate]
  )

  let encodedResponse
  let safeTxGasCalculationTries = 0

  while (!encodedResponse && safeTxGasCalculationTries < MAX_TRIES_SAFETXGAS) {
    await wait(1000)
    safeTxGasCalculationTries++

    encodedResponse = await provider.call({
      to,
      value: '0',
      data: safeFunctionToEstimate
    })
  }

  if (!encodedResponse) throw new Error('Impossible to determine gas...')

  const safeTxGas = _decodeSafeTxGas(encodedResponse)

  return BigNumber.from(_addExtraGasForSafety(safeTxGas))
}

function _decodeSafeTxGas(encodedSafeTxGas: string): string {
  return Number(`0x${encodedSafeTxGas.slice(184).slice(0, 10)}`).toString()
}

export default {
  estimateSafeTxGasWithSimulate
}
