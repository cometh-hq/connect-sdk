import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { GAS_GAP_TOLERANCE } from '../constants'
import {
  Multisend__factory,
  Safe__factory,
  SimulateTxAcessor__factory
} from '../contracts/types/factories'
import { MultisendInterface } from '../contracts/types/Multisend'
import { SafeInterface } from '../contracts/types/Safe'
import { SimulateTxAcessorInterface } from '../contracts/types/SimulateTxAcessor'
import { decodeSafeTxGas } from '../utils/utils'
import { MetaTransactionData } from '../wallet/types'
import safeService from './safeService'

const SafeContract: SafeInterface = Safe__factory.createInterface()
const MultiSendContract: MultisendInterface =
  Multisend__factory.createInterface()
const SimulateTxAcessor: SimulateTxAcessorInterface =
  SimulateTxAcessor__factory.createInterface()

const getGasPrice = async (
  provider: StaticJsonRpcProvider,
  rewardPercentile: number
): Promise<BigNumber> => {
  const ethFeeHistory = await provider.send('eth_feeHistory', [
    1,
    'latest',
    [rewardPercentile]
  ])
  const [reward, BaseFee] = [
    BigNumber.from(ethFeeHistory.reward[0][0]),
    BigNumber.from(ethFeeHistory.baseFeePerGas[0])
  ]

  const gasPrice = BigNumber.from(reward.add(BaseFee)).add(
    BigNumber.from(reward.add(BaseFee)).div(GAS_GAP_TOLERANCE)
  )
  return gasPrice
}

const estimateSafeTxGas = async (
  walletAddress: string,
  safeTransactionData: MetaTransactionData[],
  provider: StaticJsonRpcProvider
): Promise<BigNumber> => {
  let safeTxGas = BigNumber.from(0)
  for (let i = 0; i < safeTransactionData.length; i++) {
    safeTxGas = safeTxGas.add(
      await provider.estimateGas({
        ...safeTransactionData[i],
        from: walletAddress
      })
    )
  }
  return safeTxGas
}

const getTotalCost = async (
  safeTxGas: BigNumber,
  baseGas: number,
  gasPrice: BigNumber
): Promise<BigNumber> => {
  return BigNumber.from(safeTxGas)
    .add(BigNumber.from(baseGas))
    .mul(BigNumber.from(gasPrice))
}

const verifyHasEnoughBalance = async (
  provider: StaticJsonRpcProvider,
  walletAddress: string,
  safeTxGas: BigNumber,
  gasPrice: BigNumber,
  baseGas: number,
  txValue: string
): Promise<void> => {
  const walletBalance = await provider.getBalance(walletAddress)
  const totalGasCost = await getTotalCost(safeTxGas, baseGas, gasPrice)
  if (walletBalance.lt(totalGasCost.add(BigNumber.from(txValue))))
    throw new Error('Not enough balance to send this value and pay for gas')
}

const _parseSafeTxGasErrorResponse = (error: any): string => {
  // Ethers
  if (error?.error?.body) {
    const revertData = JSON.parse(error.error.body).error.data
    if (revertData && revertData.startsWith('Reverted ')) {
      const [, encodedResponse] = revertData.split('Reverted ')
      const safeTxGas = decodeSafeTxGas(encodedResponse)

      return safeTxGas
    }
  }

  // Web3
  const [, encodedResponse] = error.message.split('return data: ')
  const safeTxGas = decodeSafeTxGas(encodedResponse)

  return safeTxGas
}

const _addExtraGasForSafety = (safeTxGas: string): string => {
  const INCREASE_GAS_FACTOR = 1.05 // increase the gas by 5% as a security margin

  return Math.round(Number(safeTxGas) * INCREASE_GAS_FACTOR).toString()
}

const _isMetaTransactionArray = (
  safeTransactions: MetaTransactionData | MetaTransactionData[]
): safeTransactions is MetaTransactionData[] => {
  return (safeTransactions as MetaTransactionData[])?.length !== undefined
}

const estimateSafeTxGasWithSimulate = async (
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  safeTxData: MetaTransactionData[] | MetaTransactionData,
  multisendAddress: string
  /*   singletonAddress: string,
  simulateTxAccessorAddress: string */
): Promise<BigNumber> => {
  let transaction: MetaTransactionData

  if (_isMetaTransactionArray(safeTxData) && safeTxData.length !== 1) {
    const multisendData = safeService.encodeMultiSendDataForEstimate(safeTxData)

    transaction = {
      to: multisendAddress,
      value: '0',
      data: MultiSendContract.encodeFunctionData('multiSend', [multisendData]),
      operation: 1
    }
  } else {
    transaction = {
      ...safeTxData,
      operation: 0
    } as MetaTransactionData
  }

  const isSafeDeployed = await safeService.isDeployed(walletAddress, provider)

  const singletonAddress = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
  const simulateTxAccessorAddress = '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'

  const transactionDataToEstimate = SimulateTxAcessor.encodeFunctionData(
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
    [simulateTxAccessorAddress, transactionDataToEstimate]
  )

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: safeFunctionToEstimate
  }

  try {
    const encodedResponse = await provider.call(transactionToEstimateGas)

    const safeTxGas = decodeSafeTxGas(encodedResponse)

    return BigNumber.from(_addExtraGasForSafety(safeTxGas))

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    return BigNumber.from(_parseSafeTxGasErrorResponse(error))
  }
}

export default {
  estimateSafeTxGasWithSimulate,
  getGasPrice,
  estimateSafeTxGas,
  getTotalCost,
  verifyHasEnoughBalance
}
