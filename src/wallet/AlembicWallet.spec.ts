import { API } from '../services/API'
import { BurnerWalletAdaptor } from './adapters'
import { AlembicWallet } from './AlembicWallet'

jest.mock('@/ui/GasModal', () => ({
  initModal: jest.fn(() => ({}))
}))

jest.mock('@/services/API')

jest.mock('./WebAuthnUtils', () => ({
  getCurrentPublicKeyId: jest.fn(() => 'public-key-id')
}))

const apiKey = '4040b5d8-7aec-4c45-960e-04313adae563'

const alembicWallet = new AlembicWallet({
  apiKey,
  authAdapter: new BurnerWalletAdaptor('0x89')
})

describe('AlembicWallet', () => {
  describe('getUserInfos', () => {
    it('Given no parameter, when getting the user info, then return the correct user info', async () => {
      const userInfo = await alembicWallet.getUserInfos()

      expect(userInfo).toEqual({
        walletAddress: ''
      })
    })
    it('Given no parameter, when getting the user info, then the API constructor is called once', async () => {
      await alembicWallet.getUserInfos()
      expect(API).toHaveBeenCalledTimes(1)
    })
  })
})
