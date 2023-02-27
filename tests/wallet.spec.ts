import { Wallet } from '../src/wallet'

describe('Test Hello World', () => {
  it(`Test Hello`, async () => {
    const wallet = new Wallet()
    expect(wallet.hello()).toEqual('hello world')
  })
})
