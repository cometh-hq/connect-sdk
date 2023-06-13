const GAS_GAP_TOLERANCE = 20
jest.doMock('../constants', () => ({
  GAS_GAP_TOLERANCE
}))

import { BigNumber, ethers } from 'ethers'

import { getProviderMockPack } from '../tests/unit/providerMock'
import { getFunctionMock } from '../tests/unit/testUtils'
import BlockchainUtils from './BlockchainUtils'
import GasModalUtils from './GasModalUtils'
import GasUtils from './GasUtils'

const EOA_ADDRESS = '0x4B758d3Af4c8B2662bC485420077413DDdd62E33'
const WALLET_ADDRESS = '0xecf9D83633dC1DE88400945c0f97B76153a386ec'
const CHAIN_ID = 137
const RPC_URL = 'https://polygon-rpc.com'

jest.mock('./BlockchainUtils', () => ({
  getProvider: jest.fn(),
  getBalance: jest.fn()
}))

jest.mock('./GasModalUtils', () => ({
  showGasModal: jest.fn()
}))

describe('GasUtils', () => {
  const reward = BigNumber.from(10)
  const baseFeePerGas = BigNumber.from(100)
  const mockedEstimateGas = BigNumber.from(123)
  const mockedBalanceString = '0.12345'
  const mockedBalance = ethers.utils.parseUnits(mockedBalanceString, 'ether')

  const {
    providerMocks,
    setupProviderMocks,
    expectProviderFunctionToHaveBeenCalledWith
  } = getProviderMockPack()
  beforeEach(() => {
    setupProviderMocks()
    providerMocks.estimateGas.mockReturnValue(mockedEstimateGas)
    providerMocks.send.mockReturnValue({
      reward: [[reward]],
      baseFeePerGas: [baseFeePerGas]
    })
    getFunctionMock(BlockchainUtils.getBalance).mockResolvedValue(mockedBalance)
    getFunctionMock(GasModalUtils.showGasModal).mockResolvedValue(true)
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

      expect(safeTxGas).toEqual(mockedEstimateGas)
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

      expect(safeTxGas).toEqual(mockedEstimateGas.mul(3))
    })
  })
  describe('calculateAndShowMaxFee', () => {
    it('Given the correct parameters, when calculating and showing the max fees, then call getBalance with the right parameters', async () => {
      await GasUtils.calculateAndShowMaxFee(
        '1',
        BigNumber.from(0),
        0,
        BigNumber.from(0),
        WALLET_ADDRESS,
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
        { displayValidationModal: true }
      )
      expect(BlockchainUtils.getBalance).toHaveBeenCalledWith(
        WALLET_ADDRESS,
        providerMocks
      )
    })
    it('Given the correct parameters, when calculating and showing the max fees, then call the gas modal with the right parameters', async () => {
      const safeTxGas = 20000
      const baseGas = 80000
      const gasPrice = 140
      await GasUtils.calculateAndShowMaxFee(
        '1',
        BigNumber.from(safeTxGas),
        baseGas,
        BigNumber.from(gasPrice),
        WALLET_ADDRESS,
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
        { displayValidationModal: true }
      )
      expect(GasModalUtils.showGasModal).toHaveBeenCalledWith(
        mockedBalanceString,
        ethers.utils.formatEther(
          BigNumber.from((safeTxGas + baseGas) * gasPrice)
        )
      )
    })
    it('Given a very high gas price and low balance, when calculating and showing the max fees, then throw an error', async () => {
      const safeTxGas = 2000000
      const baseGas = 8000000
      const gasPrice = 14000000000
      await expect(
        GasUtils.calculateAndShowMaxFee(
          '1',
          BigNumber.from(safeTxGas),
          baseGas,
          BigNumber.from(gasPrice),
          WALLET_ADDRESS,
          BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
          { displayValidationModal: true }
        )
      ).rejects.toThrow(
        new Error('Not enough balance to send this value and pay for gas')
      )
    })
    it('Given a sending amount matching the whole balance, when calculating and showing the max fees, then throw an error', async () => {
      const safeTxGas = 20000
      const baseGas = 80000
      const gasPrice = 140
      await expect(
        GasUtils.calculateAndShowMaxFee(
          ethers.utils.parseUnits(mockedBalanceString, 'ether').toString(),
          BigNumber.from(safeTxGas),
          baseGas,
          BigNumber.from(gasPrice),
          WALLET_ADDRESS,
          BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
          { displayValidationModal: true }
        )
      ).rejects.toThrow(
        new Error('Not enough balance to send this value and pay for gas')
      )
    })
  })
  describe('getGasPrice', () => {
    const rewardPercentile = 80
    it('Given the correct parameters, when getting the gas price, then call eth_feeHistory with the correct parameters', async () => {
      await GasUtils.getGasPrice(
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
        rewardPercentile
      )
      expectProviderFunctionToHaveBeenCalledWith('send', 'eth_feeHistory', [
        1,
        'latest',
        [rewardPercentile]
      ])
    })
    it('Given the correct parameters, when getting the gas price, then return the correct gas price', async () => {
      const result = await GasUtils.getGasPrice(
        BlockchainUtils.getProvider(CHAIN_ID, RPC_URL),
        rewardPercentile
      )
      const expectedResult = BigNumber.from(reward.add(baseFeePerGas)).add(
        BigNumber.from(reward.add(baseFeePerGas)).div(GAS_GAP_TOLERANCE)
      )
      expect(result).toEqual(expectedResult)
    })
  })
  describe('setTransactionGas', () => {
    it('Given a transactionData, when setting the transaction gas, then return the transactionData with the correct gas information', async () => {
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
      const provider = BlockchainUtils.getProvider(CHAIN_ID, RPC_URL)
      const safeTxGas = 10
      const rewardPercentile = 10
      const baseGas = 80000

      const result = await GasUtils.setTransactionGas(
        transactionData,
        BigNumber.from(safeTxGas),
        provider,
        rewardPercentile,
        baseGas,
        WALLET_ADDRESS,
        { displayValidationModal: true }
      )
      expect(result).toEqual({
        ...transactionData,
        safeTxGas: +safeTxGas,
        baseGas,
        gasPrice: +reward
          .add(baseFeePerGas)
          .add(BigNumber.from(reward.add(baseFeePerGas)).div(GAS_GAP_TOLERANCE))
      })
    })
  })
})
