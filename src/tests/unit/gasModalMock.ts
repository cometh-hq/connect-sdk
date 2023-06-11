import GasModalUtils from '../../wallet/GasModalUtils'
import { getFunctionMock } from './testUtils'

type GasModalMockPack = {
  gasModalMocks: GasModalMock
  setupGasModalMocks: () => void
  expectGasModalFunctionToHaveBeenCalledWith: (
    functionName: keyof GasModalMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any
  ) => void
}

type GasModalMock = {
  initModal: jest.Mock
}

export const getGasModalMockPack = (): GasModalMockPack => {
  const gasModalMocks = {
    initModal: jest.fn()
  }

  const setupGasModalMocks = (): void => {
    getFunctionMock(GasModalUtils.showGasModal).mockImplementation(() => {
      return gasModalMocks
    })
  }

  const expectGasModalFunctionToHaveBeenCalledWith = (
    functionName: keyof GasModalMock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): void => {
    expect(gasModalMocks[functionName]).toHaveBeenCalledWith(...params)
  }

  return {
    gasModalMocks,
    setupGasModalMocks,
    expectGasModalFunctionToHaveBeenCalledWith
  }
}

export default { getGasModalMockPack }
