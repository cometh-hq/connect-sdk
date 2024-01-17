const GAS_GAP_TOLERANCE = 20
jest.doMock('../constants', () => ({
  GAS_GAP_TOLERANCE
}))

import { BigNumber, ethers } from 'ethers'

import stubProvider from '../tests/unit/stubProvider'
import gasService from './gasService'

const WALLET_ADDRESS = '0xecf9D83633dC1DE88400945c0f97B76153a386ec'

jest.mock('@ethersproject/providers')

jest.mock('../ui/GasModal')

describe('gasService', () => {
  const provider = new stubProvider.StubProvider()
  const reward = BigNumber.from(10)
  const baseFeePerGas = BigNumber.from(100)

  describe('getGasPrice', () => {
    const rewardPercentile = 80
    it('Given the correct parameters, when getting the gas price, then call eth_feeHistory with the correct parameters', async () => {
      const send = jest.spyOn(provider, 'send')
      await gasService.getGasPrice(provider, rewardPercentile)
      expect(send).toHaveBeenCalledWith('eth_feeHistory', [
        1,
        'latest',
        [rewardPercentile]
      ])
    })
    it('Given the correct parameters, when getting the gas price, then return the correct gas price', async () => {
      const result = await gasService.getGasPrice(provider, rewardPercentile)
      const expectedResult = BigNumber.from(reward.add(baseFeePerGas)).add(
        BigNumber.from(reward.add(baseFeePerGas)).div(GAS_GAP_TOLERANCE)
      )
      expect(result).toEqual(expectedResult)
    })
  })
  describe('verifyHasEnoughBalance', () => {
    it('Given a low gas cost and txValue, when the wallet balance has enough to pay for gas and txValue, then resolve without throwing an error', async () => {
      const totalGasCost = BigNumber.from(8000000)
      const txValue = BigNumber.from('12345')

      await expect(
        gasService.verifyHasEnoughBalance(
          provider,
          WALLET_ADDRESS,
          BigNumber.from(totalGasCost),
          BigNumber.from(txValue)
        )
      ).resolves.not.toThrow()
    })
    it('Given a low gas cost but high txValue, when the wallet balance does not have enough to pay for txValue, then throw an error', async () => {
      const totalGasCost = BigNumber.from(8000000)
      const txValue = BigNumber.from(
        ethers.utils.parseUnits('0.12345', 'ether').toString()
      )

      await expect(
        gasService.verifyHasEnoughBalance(
          provider,
          WALLET_ADDRESS,
          totalGasCost,
          txValue
        )
      ).rejects.toThrow(
        new Error('Not enough balance to send this value and pay for gas')
      )
    })
    it('Given a high gas cost but low txValue, when the wallet balance does not have enough to pay for gas, then throw an error', async () => {
      const totalGasCost = BigNumber.from(800000000000000)
      const txValue = BigNumber.from(
        ethers.utils.parseUnits('0.12345', 'ether').toString()
      )

      await expect(
        gasService.verifyHasEnoughBalance(
          provider,
          WALLET_ADDRESS,
          totalGasCost,
          txValue
        )
      ).rejects.toThrow(
        new Error('Not enough balance to send this value and pay for gas')
      )
    })
  })
})
