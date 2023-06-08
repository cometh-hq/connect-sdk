import BlockchainUtils from '../../src/wallet/BlockchainUtils'
import { getFunctionMock } from './testUtils'

type ProviderMockPack = {
  providerMocks: ProviderMock
  setupProviderMocks: () => void
  expectProviderFunctionToHaveBeenCalledWith: (
    functionName: keyof ProviderMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any
  ) => void
}

type ProviderMock = {
  estimateGas: jest.Mock
  send: jest.Mock
}

export const getProviderMockPack = (): ProviderMockPack => {
  const providerMocks = {
    estimateGas: jest.fn(),
    send: jest.fn()
  }

  const setupProviderMocks = (): void => {
    getFunctionMock(BlockchainUtils.getProvider).mockImplementation(() => {
      return providerMocks
    })
  }

  const expectProviderFunctionToHaveBeenCalledWith = (
    functionName: keyof ProviderMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): void => {
    expect(providerMocks[functionName]).toHaveBeenCalledWith(...params)
  }

  return {
    providerMocks,
    setupProviderMocks,
    expectProviderFunctionToHaveBeenCalledWith
  }
}

export default { getProviderMockPack }
