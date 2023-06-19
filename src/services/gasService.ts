import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { GAS_GAP_TOLERANCE } from '../constants'
import { Safe__factory } from '../contracts/types/factories'
import { SafeInterface } from '../contracts/types/Safe'
import { MetaTransactionData } from '../wallet/types'

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

export default {
  getGasPrice,
  estimateSafeTxGas,
  getTotalCost,
  verifyHasEnoughBalance
}
