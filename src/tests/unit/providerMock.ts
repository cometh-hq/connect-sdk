import blockchainService from '../../services/blockchainService'
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
  getBalance: jest.Mock
  signMessage: jest.Mock
}

export const getProviderMockPack = (): ProviderMockPack => {
  const providerMocks = {
    estimateGas: jest.fn(),
    send: jest.fn(),
    getBalance: jest.fn(),
    signMessage: jest.fn()
  }

  const setupProviderMocks = (): void => {
    getFunctionMock(blockchainService.getProvider).mockImplementation(() => {
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
