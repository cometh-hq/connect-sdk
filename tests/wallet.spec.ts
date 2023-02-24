import { Wallet } from '../src/wallet'

describe('Test Hello World', () => {
  it(`Test Hello`, async () => {
    expect(Wallet.connect()).toEqual('hello world')
  })
})
