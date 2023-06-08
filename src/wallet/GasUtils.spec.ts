import { BigNumber, ethers } from 'ethers'

import { getProviderMockPack } from '../../tests/unit/providerMock'
import BlockchainUtils from './BlockchainUtils'
import GasUtils from './GasUtils'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'
const WALLET_ADDRESS = '0xecf9D83633dC1DE88400945c0f97B76153a386ec'
const CHAIN_ID = 137
const RPC_URL = ''

jest.mock('./BlockchainUtils', () => ({
  getProvider: jest.fn()
}))

jest.mock('@/ui/GasModal', () => ({
  initModal: jest.fn(() => ({}))
}))

describe('GasUtils', () => {
  const reward = 10
  const baseFeePerGas = 100
  const {
    providerMocks,
    setupProviderMocks,
    expectProviderFunctionToHaveBeenCalledWith
  } = getProviderMockPack()
  beforeEach(() => {
    setupProviderMocks()
    providerMocks.estimateGas.mockReturnValue(BigNumber.from(123))
    providerMocks.send.mockReturnValue({
      reward: [[BigNumber.from(reward)]],
      baseFeePerGas: [BigNumber.from(baseFeePerGas)]
    })
  })
  describe('estimateSafeTxGas', () => {
    const walletAddress = WALLET_ADDRESS
    const transactionData = {
      to: EOA_ADDRESS,
      value: '1',
      data: '0x',
      operation: '0',
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce: '0x_nonce',
      signatures: '0x_signature'
    }

    it('Given a single call transaction, when predicting the safeTxGas, then call estimateGas with the correct parameters', async () => {
      await GasUtils.estimateSafeTxGas(
        walletAddress,
        [transactionData],
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL)
      )

      expectProviderFunctionToHaveBeenCalledWith('estimateGas', {
        baseGas: '0',
        data: '0x',
        from: WALLET_ADDRESS,
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        nonce: '0x_nonce',
        operation: '0',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        safeTxGas: '0',
        signatures: '0x_signature',
        to: EOA_ADDRESS,
        value: '1'
      })
    })

    it('Given a single call transaction, when predicting the safeTxGas, then return the correct value', async () => {
      const safeTxGas = await GasUtils.estimateSafeTxGas(
        walletAddress,
        [transactionData],
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL)
      )

      expect(safeTxGas).toEqual(BigNumber.from(123))
    })

    it('Given a multisend transaction, when predicting the safeTxGas, then return the correct value', async () => {
      const to = EOA_ADDRESS
      const value = '0'
      const data = '0x'

      const transactionDataMultisend = [
        { to, value, data },
        { to, value, data },
        { to, value, data }
      ]
      const safeTxGas = await GasUtils.estimateSafeTxGas(
        walletAddress,
        transactionDataMultisend,
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL)
      )

      expect(safeTxGas).toEqual(BigNumber.from(3 * 123))
    })
  })
})
