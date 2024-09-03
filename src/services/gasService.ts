import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, ethers } from 'ethers'

import { GAS_GAP_TOLERANCE } from '../constants'
import { BalanceError } from '../wallet/errors'
import { API } from './API'

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

const getGasPriceForToken = async (
  tokenAddress: string,
  API: API
): Promise<BigNumber> => {
  const gasPriceToken = await API.getGasPriceForToken(tokenAddress)

  return gasPriceToken
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
  totalGasCost: BigNumber,
  txValue: BigNumber,
  gasToken?: string
): Promise<void> => {
  let walletBalance: BigNumber
  if (gasToken && gasToken !== ethers.constants.AddressZero) {
    walletBalance = await getBalanceForToken(walletAddress, gasToken, provider)
  } else {
    walletBalance = await provider.getBalance(walletAddress)
    console.log('walletBalance', { walletBalance })
  }

  if (walletBalance.lt(totalGasCost.add(txValue))) throw new BalanceError()
}

const getBalanceForToken = async (
  walletAddress: string,
  tokenAddress: string,
  provider: StaticJsonRpcProvider
): Promise<BigNumber> => {
  const erc20Abi = ['function balanceOf(address owner) view returns (uint256)']
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider)
  try {
    const balance = await tokenContract.balanceOf(walletAddress)
    return balance
  } catch (error) {
    throw new Error('Error getting balance for token')
  }
}

export default {
  getGasPrice,
  getGasPriceForToken,
  getTotalCost,
  verifyHasEnoughBalance,
  getBalanceForToken
}
