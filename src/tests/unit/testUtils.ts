export const getFunctionMock = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetFunction: (...args: any[]) => any
): jest.MockedFunction<typeof targetFunction> => {
  return targetFunction as jest.MockedFunction<typeof targetFunction>
}

export const WALLET_ADDRESS = '0xecf9D83633dC1DE88400945c0f97B76153a386ec'
export const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'

export default { getFunctionMock, WALLET_ADDRESS, EOA_ADDRESS }
