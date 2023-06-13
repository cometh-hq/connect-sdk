/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import { getApiMockPack } from '../tests/unit/apiMock'
import { getFunctionMock } from '../tests/unit/testUtils'
import { BurnerWalletAdaptor } from './adapters'
import { AlembicWallet } from './AlembicWallet'
import GasUtils from './GasUtils'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'
const WALLET_ADDRESS = '0xecf9D83633dC1DE88400945c0f97B76153a386ec'

jest.mock('@/ui/GasModal', () => ({
  initModal: jest.fn(() => ({}))
}))

jest.mock('./BlockchainUtils', () => ({
  getProvider: jest.fn()
}))

jest.mock('./GasUtils', () => ({
  estimateSafeTxGas: jest.fn(),
  setTransactionGas: jest.fn()
}))

jest.mock('./WebAuthnUtils', () => ({
  getCurrentPublicKeyId: jest.fn(() => null)
}))

jest.mock('./ApiUtils', () => ({
  getApi: jest.fn()
}))

const chainId = 137
const apiKey = '4040b5d8-7aec-4c45-960e-04313adae563'
const authAdapter = new BurnerWalletAdaptor(ethers.utils.hexlify(chainId))

describe('AlembicWallet', () => {
  const alembicWallet = new AlembicWallet({
    apiKey,
    authAdapter
  })
  const { apiMocks, setupApiMocks, expectApiFunctionToHaveBeenCalledWith } =
    getApiMockPack()
  beforeEach(() => {
    setupApiMocks()
    getFunctionMock(GasUtils.estimateSafeTxGas).mockResolvedValue(123)
    getFunctionMock(GasUtils.setTransactionGas).mockResolvedValue({})
    apiMocks.getSponsoredAddresses.mockReturnValue([])
    apiMocks.getNonce.mockReturnValue(30)
    apiMocks.connectToAlembicWallet.mockReturnValue(WALLET_ADDRESS)
    apiMocks.relayTransaction.mockReturnValue('0x_mockedSafeTxHash')
  })
  describe('getUserInfos', () => {
    it('Given no parameter, when getting the user info, then return the correct user info', async () => {
      const userInfo = await alembicWallet.getUserInfos()

      expect(userInfo).toEqual({
        walletAddress: ''
      })
    })
  })
  describe('connect', () => {
    it('Given no parameter, when connecting, then isConnected become true', async () => {
      const alembicWallet = new AlembicWallet({
        apiKey,
        authAdapter
      })
      await alembicWallet.connect()
      const isConnected = alembicWallet.getConnected()

      expect(isConnected).toEqual(true)
    })
  })
  describe('logout', () => {
    it('Given no parameter, when using logout, then isConnected become false', async () => {
      const alembicWallet = new AlembicWallet({
        apiKey,
        authAdapter
      })
      await alembicWallet.connect()
      await alembicWallet.logout()
      const isConnected = alembicWallet.getConnected()

      expect(isConnected).toEqual(false)
    })
  })
  describe('sendTransaction', () => {
    const mockedSafeTxDataTyped = {
      to: EOA_ADDRESS,
      value: '1',
      data: '0x',
      operation: '0',
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce: '0'
    }
    beforeEach(() => {
      getFunctionMock(GasUtils.setTransactionGas).mockResolvedValue(
        mockedSafeTxDataTyped
      )
    })
    it('Given paremeters to value and data, when sending a transaction, then call getNonce for the signer address', async () => {
      const alembicWallet = new AlembicWallet({
        apiKey,
        authAdapter
      })
      const safeTxData = {
        to: EOA_ADDRESS,
        value: '1',
        data: '0x'
      }
      await alembicWallet.connect()
      await alembicWallet.sendTransaction(safeTxData)

      expectApiFunctionToHaveBeenCalledWith(
        'getNonce',
        authAdapter.getSigner().address
      )
    })
    it('Given paremeters to value and data, when sending a transaction, then call connectToAlembicWallet from the API', async () => {
      const alembicWallet = new AlembicWallet({
        apiKey,
        authAdapter
      })
      const safeTxData = {
        to: EOA_ADDRESS,
        value: '1',
        data: '0x'
      }
      await alembicWallet.connect()
      await alembicWallet.sendTransaction(safeTxData)

      const message = new SiweMessage({
        address: authAdapter.getSigner().address,
        chainId,
        domain: expect.any(String),
        issuedAt: expect.any(String),
        nonce: expect.any(String),
        statement: 'Sign in with Ethereum to Alembic',
        uri: expect.any(String),
        version: '1'
      })

      expect(apiMocks.connectToAlembicWallet).toHaveBeenCalledWith({
        message,
        ownerAddress: authAdapter.getSigner().address,
        signature: expect.any(String)
      })
    })
    it('Given to value and data, when sending a transaction, then return the safe transaction hash', async () => {
      const alembicWallet = new AlembicWallet({
        apiKey,
        authAdapter
      })
      const safeTxData = {
        to: EOA_ADDRESS,
        value: '1',
        data: '0x'
      }
      await alembicWallet.connect()
      const result = await alembicWallet.sendTransaction(safeTxData)

      expect(result).toEqual({ safeTxHash: '0x_mockedSafeTxHash' })
    })
  })
})
