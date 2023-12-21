export const getFunctionMock = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetFunction: (...args: any[]) => any
): jest.MockedFunction<typeof targetFunction> => {
  return targetFunction as jest.MockedFunction<typeof targetFunction>
}
