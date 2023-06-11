import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

import { Safe__factory } from '../contracts/types/factories'
import { SafeInterface } from '../contracts/types/Safe'
import { GasModal } from '../ui/GasModal'
import BlockchainUtils from './BlockchainUtils'
import GasModalUtils from './GasModalUtils'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  UIConfig
} from './types'

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
    BigNumber.from(reward.add(BaseFee)).div(10)
  )
  return gasPrice
}

const setTransactionGas = async (
  safeTxDataTyped: SafeTransactionDataPartial,
  safeTxGas: BigNumber,
  provider: StaticJsonRpcProvider,
  rewardPercentile: number,
  baseGas: number,
  walletAddress: string,
  uiConfig: UIConfig
): Promise<SafeTransactionDataPartial> => {
  const gasPrice = await getGasPrice(provider, rewardPercentile)

  await calculateAndShowMaxFee(
    safeTxDataTyped.value,
    safeTxGas,
    baseGas,
    gasPrice,
    walletAddress,
    provider,
    uiConfig
  )
  return {
    ...safeTxDataTyped,
    safeTxGas: +safeTxGas, // gwei
    baseGas, // gwei
    gasPrice: +gasPrice // wei
  }
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

const calculateAndShowMaxFee = async (
  txValue: string,
  safeTxGas: BigNumber,
  baseGas: number,
  gasPrice: BigNumber,
  walletAddress: string,
  provider: StaticJsonRpcProvider,
  uiConfig: UIConfig
): Promise<void> => {
  const walletBalance = await BlockchainUtils.getBalance(
    walletAddress,
    provider
  )
  const totalGasCost = BigNumber.from(safeTxGas)
    .add(BigNumber.from(baseGas))
    .mul(BigNumber.from(gasPrice))

  if (walletBalance.lt(totalGasCost.add(BigNumber.from(txValue))))
    throw new Error('Not enough balance to send this value and pay for gas')

  if (uiConfig.displayValidationModal) {
    const totalFees = ethers.utils.formatEther(
      ethers.utils.parseUnits(
        BigNumber.from(safeTxGas).add(baseGas).mul(gasPrice).toString(),
        'wei'
      )
    )

    const balance = ethers.utils.formatEther(
      ethers.utils.parseUnits(
        BigNumber.from(
          await BlockchainUtils.getBalance(walletAddress, provider)
        ).toString(),
        'wei'
      )
    )

    if (!GasModalUtils.showGasModal(balance, totalFees)) {
      throw new Error('Transaction denied')
    }
  }
}

export default {
  getGasPrice,
  setTransactionGas,
  estimateSafeTxGas,
  calculateAndShowMaxFee
}
