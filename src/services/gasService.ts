import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

import { GAS_GAP_TOLERANCE } from '../constants'
import MultisendAbi from '../contracts/abis/Multisend.json'
import safeAbi from '../contracts/abis/safe.json'
import SimulateTxAbi from '../contracts/abis/SimulateTxAcessor.json'
import { Safe__factory } from '../contracts/types/factories'
import { SafeInterface } from '../contracts/types/Safe'
import { decodeSafeTxGas } from '../utils/utils'
import { MetaTransactionData } from '../wallet/types'
import safeService from './safeService'

const SafeInterface: SafeInterface = Safe__factory.createInterface()

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

const estimateSafeTxGasWithSimulate = async (
  multisendAddress: string,
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  data: string
): Promise<BigNumber> => {
  const multiSendContract = new ethers.Contract(
    multisendAddress,
    MultisendAbi,
    provider
  )

  const multiSendTransaction = {
    to: multisendAddress,
    value: '0',
    data: multiSendContract.interface.encodeFunctionData('multiSend', [data]),
    operation: 1
  }

  const isSafeDeployed = await safeService.isDeployed(walletAddress, provider)

  const singletonAdress = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
  const simulateTxAccessor = '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'

  const safeContract = new ethers.Contract(singletonAdress, safeAbi, provider)

  const simulateTxAccessorContractInterface = new ethers.Contract(
    simulateTxAccessor,
    SimulateTxAbi,
    provider
  )

  const transactionDataToEstimate: string =
    simulateTxAccessorContractInterface.interface.encodeFunctionData(
      'simulate',
      [
        multiSendTransaction.to,
        multiSendTransaction.value,
        multiSendTransaction.data,
        multiSendTransaction.operation
      ]
    )

  // if the Safe is not deployed we can use the singleton address to simulate
  const to = isSafeDeployed ? walletAddress : singletonAdress

  const safeFunctionToEstimate: string =
    safeContract.interface.encodeFunctionData('simulateAndRevert', [
      simulateTxAccessor,
      transactionDataToEstimate
    ])

  const transactionToEstimateGas = {
    to,
    value: '0',
    data: safeFunctionToEstimate
  }

  try {
    const encodedResponse = await provider.call(transactionToEstimateGas)

    console.log({ encodedResponse })

    const safeTxGas = decodeSafeTxGas(encodedResponse)

    console.log({ safeTxGas })

    return BigNumber.from(safeTxGas)

    // if the call throws an error we try to parse the returned value
  } catch (error: any) {
    console.log(error)
    // return parseSafeTxGasErrorResponse(error)
  }

  return BigNumber.from(0)
}

export default {
  estimateSafeTxGasWithSimulate,
  getGasPrice,
  estimateSafeTxGas,
  getTotalCost,
  verifyHasEnoughBalance
}
