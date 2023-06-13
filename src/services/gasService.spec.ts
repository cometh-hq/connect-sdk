const GAS_GAP_TOLERANCE = 20
jest.doMock('../constants', () => ({
  GAS_GAP_TOLERANCE
}))

import { BigNumber, ethers } from 'ethers'

import stubGasModal from '../tests/unit/stubGasModal'
import stubProvider from '../tests/unit/stubProvider'
import testUtils from '../tests/unit/testUtils'
import gasService from './gasService'

jest.mock('@ethersproject/providers')

jest.mock('../ui/GasModal')

describe('gasService', () => {
  const reward = BigNumber.from(10)
  const baseFeePerGas = BigNumber.from(100)
  const mockedEstimateGas = BigNumber.from(123)
  const mockedBalanceString = '0.12345'

  describe('estimateSafeTxGas', () => {
    const transactionData = {
      to: testUtils.EOA_ADDRESS,
      value: '1',
      data: '0x',
      operation: '0',
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce: '0x_nonce',
      signatures: '0x_signature'
    }

    it('Given a single call transaction, when predicting the safeTxGas, then call estimateGas with the correct parameters', async () => {
      const provider = new stubProvider()
      const estimateGas = jest.spyOn(provider, 'estimateGas')
      await gasService.estimateSafeTxGas(
        testUtils.WALLET_ADDRESS,
        [transactionData],
        provider
      )

      expect(estimateGas).toHaveBeenCalledWith({
        baseGas: '0',
        data: '0x',
        from: testUtils.WALLET_ADDRESS,
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        nonce: '0x_nonce',
        operation: '0',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        safeTxGas: '0',
        signatures: '0x_signature',
        to: testUtils.EOA_ADDRESS,
        value: '1'
      })
    })

    it('Given a single call transaction, when predicting the safeTxGas, then return the correct value', async () => {
      const safeTxGas = await gasService.estimateSafeTxGas(
        testUtils.WALLET_ADDRESS,
        [transactionData],
        new stubProvider()
      )

      expect(safeTxGas).toEqual(mockedEstimateGas)
    })

    it('Given a multisend transaction, when predicting the safeTxGas, then return the correct value', async () => {
      const to = testUtils.EOA_ADDRESS
      const value = '0'
      const data = '0x'

      const transactionDataMultisend = [
        { to, value, data },
        { to, value, data },
        { to, value, data }
      ]
      const safeTxGas = await gasService.estimateSafeTxGas(
        testUtils.WALLET_ADDRESS,
        transactionDataMultisend,
        new stubProvider()
      )

      expect(safeTxGas).toEqual(mockedEstimateGas.mul(3))
    })
  })
  describe('getGasPrice', () => {
    const rewardPercentile = 80
    it('Given the correct parameters, when getting the gas price, then call eth_feeHistory with the correct parameters', async () => {
      const provider = new stubProvider()
      const send = jest.spyOn(provider, 'send')
      await gasService.getGasPrice(provider, rewardPercentile)
      expect(send).toHaveBeenCalledWith('eth_feeHistory', [
        1,
        'latest',
        [rewardPercentile]
      ])
    })
    it('Given the correct parameters, when getting the gas price, then return the correct gas price', async () => {
      const result = await gasService.getGasPrice(
        new stubProvider(),
        rewardPercentile
      )
      const expectedResult = BigNumber.from(reward.add(baseFeePerGas)).add(
        BigNumber.from(reward.add(baseFeePerGas)).div(GAS_GAP_TOLERANCE)
      )
      expect(result).toEqual(expectedResult)
    })
  })
})
