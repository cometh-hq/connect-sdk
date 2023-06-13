import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { getProviderMockPack } from '../tests/unit/providerMock'
import blockchainService from './blockchainService'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'

describe('blockchainService', () => {
  const mockedBalance = BigNumber.from(111)
  const { providerMocks, expectProviderFunctionToHaveBeenCalledWith } =
    getProviderMockPack()
  beforeEach(() => {
    providerMocks.getBalance.mockReturnValue(mockedBalance)
  })
  describe('getBalance', () => {
    it('Given an address, when getting the balance, then call getBalance with the right parameters', async () => {
      await blockchainService.getBalance(
        EOA_ADDRESS,
        providerMocks as unknown as StaticJsonRpcProvider
      )

      expectProviderFunctionToHaveBeenCalledWith('getBalance', EOA_ADDRESS)
    })
    it('Given an address, when getting the balance, then return the correct value', async () => {
      const balance = await blockchainService.getBalance(
        EOA_ADDRESS,
        providerMocks as unknown as StaticJsonRpcProvider
      )

      expect(balance).toEqual(mockedBalance)
    })
  })
})
