import { BigNumber, ethers } from 'ethers'

import SafeUtils from './SafeUtils'

const WALLET_ADDRESS = '0x5B76Bb156C4E9Aa322143d0061AFBd856482648D'
const CHAIN_ID = 137
const COUNTER_TEST_ADDRESS = '0x84ADD3fa2c2463C8cF2C95aD70e4b5F602332160'
const safeTxHash =
  '0x684e524decf23a8540aa689f9c745b7579bf906f528e60a31b6123e1a7b94ed8'

const transactionData = {
  to: COUNTER_TEST_ADDRESS,
  value: '0x00',
  data: '0x06661abd',
  operation: 0,
  safeTxGas: BigNumber.from(0).toString(),
  baseGas: BigNumber.from(0).toString(),
  gasPrice: BigNumber.from(0).toString(),
  gasToken: ethers.constants.AddressZero,
  refundReceiver: ethers.constants.AddressZero,
  nonce: BigNumber.from(128).toString()
}

127
describe('SafeUtils', () => {
  describe('getSafeTransactionHash', () => {
    it('Given a walletAddress with transactionData, when predicting transaction Hash, then return the correct hash', async () => {
      const predictedSafeTxHash = await SafeUtils.getSafeTransactionHash(
        WALLET_ADDRESS,
        transactionData,
        CHAIN_ID
      )

      expect(predictedSafeTxHash).toEqual(safeTxHash)
    })
  })
})
