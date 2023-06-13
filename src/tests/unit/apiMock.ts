import apiService from '../../services/apiService'
import { getFunctionMock } from './testUtils'

type ApiMockPack = {
  apiMocks: ApiMock
  setupApiMocks: () => void
  expectApiFunctionToHaveBeenCalledWith: (
    functionName: keyof ApiMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any
  ) => void
}

type ApiMock = {
  getSponsoredAddresses: jest.Mock
  getNonce: jest.Mock
  connectToAlembicWallet: jest.Mock
  relayTransaction: jest.Mock
}

export const getApiMockPack = (): ApiMockPack => {
  const apiMocks = {
    getSponsoredAddresses: jest.fn(),
    getNonce: jest.fn(),
    connectToAlembicWallet: jest.fn(),
    relayTransaction: jest.fn()
  }

  const setupApiMocks = (): void => {
    getFunctionMock(apiService.getApi).mockImplementation(() => {
      return apiMocks
    })
  }

  const expectApiFunctionToHaveBeenCalledWith = (
    functionName: keyof ApiMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): void => {
    expect(apiMocks[functionName]).toHaveBeenCalledWith(...params)
  }

  return {
    apiMocks,
    setupApiMocks,
    expectApiFunctionToHaveBeenCalledWith
  }
}

export default { getApiMockPack }
