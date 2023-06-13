import { API } from '../../services'
import { SponsoredTransaction, UserNonceType } from '../../wallet'
import testUtils from './testUtils'

class StubApi extends API {
  async getSponsoredAddresses(): Promise<SponsoredTransaction[]> {
    return []
  }
  async getNonce(): Promise<UserNonceType> {
    return {
      walletAddress: '0x_address',
      connectionNonce: 'nonce'
    }
  }
  async connectToAlembicWallet(): Promise<string> {
    return testUtils.WALLET_ADDRESS
  }
  async relayTransaction(): Promise<string> {
    return '0x_signature'
  }
}

export default StubApi
