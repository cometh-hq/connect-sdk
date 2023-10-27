import { BigNumber } from 'ethers'

import stubProvider from '../tests/unit/stubProvider'
import simulateTxService from './simulateTxService'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'
const WALLET_ADDRESS = '0x8E6e853BBaF1B865BE7B05CC14CF11fC77534b3C'

const safeSingletonAddress = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
const multisendContractAddress = '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761'
const simulateTxAcessorAddress = '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da'

//single count tx
const safeFunctionToEstimateSingleCount =
  '0xb4faba0900000000000000000000000059ad6735bcd8152b84860cb256dd9e96b85f69da000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a41c5fb2110000000000000000000000004b758d3af4c8b2662bc485420077413dddd62e33000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

//multiple count tx
const safeFunctionToEstimateMultipleCount =
  '0xb4faba0900000000000000000000000059ad6735bcd8152b84860cb256dd9e96b85f69da000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002241c5fb211000000000000000000000000a238cbeb142c10ef7ad8442c6d1f9e89e07e776100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001648d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000010b0084add3fa2c2463c8cf2c95ad70e4b5f6023321600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000406661abd0084add3fa2c2463c8cf2c95ad70e4b5f6023321600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000406661abd0084add3fa2c2463c8cf2c95ad70e4b5f6023321600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000406661abd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

describe('SimulateTxService', () => {
  describe('estimateSafeTxGasWithSimulate', () => {
    const provider = new stubProvider.StubProvider()
    const call = jest.spyOn(provider, 'call')

    const walletAddress = WALLET_ADDRESS

    const safeTxData = {
      to: EOA_ADDRESS,
      value: '1',
      data: '0x'
    }

    it('Given a single call transaction, when predicting the safeTxGas, then send provider call with the correct parameters', async () => {
      await simulateTxService.estimateSafeTxGasWithSimulate(
        walletAddress,
        provider,
        safeTxData,
        multisendContractAddress,
        safeSingletonAddress,
        simulateTxAcessorAddress
      )

      expect(call).toHaveBeenCalledWith({
        to: safeSingletonAddress,
        value: '0',
        data: safeFunctionToEstimateSingleCount
      })
    })

    it('Given a single call transaction, when predicting the safeTxGas, then respond with the right increased value', async () => {
      const INCREASE_GAS_FACTOR = 1.1 // increase the gas by 10% as a security margin

      const safeTxGas = await simulateTxService.estimateSafeTxGasWithSimulate(
        walletAddress,
        provider,
        safeTxData,
        multisendContractAddress,
        safeSingletonAddress,
        simulateTxAcessorAddress
      )

      expect(safeTxGas).toEqual(
        BigNumber.from(
          Math.round(
            Number(BigNumber.from(8339)) * INCREASE_GAS_FACTOR
          ).toString()
        )
      )
    })

    it('Given a multisend transaction, when predicting the safeTxGas, then send provider call with the correct parameters', async () => {
      const provider = new stubProvider.StubProviderMultiSend()
      const call = jest.spyOn(provider, 'call')

      const safeTxData = [
        {
          data: '0x06661abd',
          to: '0x84ADD3fa2c2463C8cF2C95aD70e4b5F602332160',
          value: '0x00'
        },
        {
          data: '0x06661abd',
          to: '0x84ADD3fa2c2463C8cF2C95aD70e4b5F602332160',
          value: '0x00'
        },
        {
          data: '0x06661abd',
          to: '0x84ADD3fa2c2463C8cF2C95aD70e4b5F602332160',
          value: '0x00'
        }
      ]

      await simulateTxService.estimateSafeTxGasWithSimulate(
        walletAddress,
        provider,
        safeTxData,
        multisendContractAddress,
        safeSingletonAddress,
        simulateTxAcessorAddress
      )

      expect(call).toHaveBeenCalledWith({
        to: safeSingletonAddress,
        value: '0',
        data: safeFunctionToEstimateMultipleCount
      })
    })
  })
})
