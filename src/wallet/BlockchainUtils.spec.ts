import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'

import { getProviderMockPack } from '../tests/unit/providerMock'
import BlockchainUtils from './BlockchainUtils'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'

describe('BlockchainUtils', () => {
  const mockedBalance = BigNumber.from(111)
  const { providerMocks, expectProviderFunctionToHaveBeenCalledWith } =
    getProviderMockPack()
  beforeEach(() => {
    providerMocks.getBalance.mockReturnValue(mockedBalance)
  })
  describe('getBalance', () => {
    it('Given an address, when getting the balance, then call getBalance with the right parameters', async () => {
      await BlockchainUtils.getBalance(
        EOA_ADDRESS,
        providerMocks as unknown as StaticJsonRpcProvider
      )

      expectProviderFunctionToHaveBeenCalledWith('getBalance', EOA_ADDRESS)
    })
    it('Given an address, when getting the balance, then return the correct value', async () => {
      const balance = await BlockchainUtils.getBalance(
        EOA_ADDRESS,
        providerMocks as unknown as StaticJsonRpcProvider
      )

      expect(balance).toEqual(mockedBalance)
    })
  })
})
