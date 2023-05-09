import { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Bytes, ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import {
  BLOCK_EVENT_GAP,
  DEFAULT_BASE_GAS,
  DEFAULT_REWARD_PERCENTILE,
  EIP712_SAFE_MESSAGE_TYPE,
  EIP712_SAFE_TX_TYPES,
  networks
} from '../constants'
import { Safe__factory } from '../contracts/types/factories/Safe__factory'
import { SafeInterface } from '../contracts/types/Safe'
import { API } from '../services'
import { AUTHAdapter } from './adapters'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  SendTransactionResponse,
  SponsoredTransaction,
  UserInfos
} from './types'

export interface AlembicWalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
}
export class AlembicWallet {
  private authAdapter: AUTHAdapter
  readonly chainId: number
  private connected = false
  private BASE_GAS: number
  private REWARD_PERCENTILE: number
  private API: API
  private sponsoredAddresses?: SponsoredTransaction[]
  private walletAddress?: string

  // Contract Interfaces
  readonly SafeInterface: SafeInterface = Safe__factory.createInterface()

  constructor({ authAdapter, apiKey }: AlembicWalletConfig) {
    this.authAdapter = authAdapter
    this.chainId = +authAdapter.chaindId
    this.API = new API(apiKey, this.chainId)
    this.BASE_GAS = DEFAULT_BASE_GAS
    this.REWARD_PERCENTILE = DEFAULT_REWARD_PERCENTILE
  }

  /**
   * Connection Section
   */

  public async connect(): Promise<void> {
    // Return if does not match requirements
    if (!this.authAdapter) throw new Error('No EOA adapter found')
    if (!networks[this.chainId])
      throw new Error('This network is not supported')
    await this.authAdapter.init()
    await this.authAdapter.connect()

    const signer = this.authAdapter.getEthProvider()?.getSigner()
    if (!signer) throw new Error('No signer found')

    const ownerAddress = await signer.getAddress()
    if (!ownerAddress) throw new Error('No ownerAddress found')

    const nonce = await this.API.getNonce(ownerAddress)
    this.sponsoredAddresses = await this.API.getSponsoredAddresses()

    const message: SiweMessage = this._createMessage(ownerAddress, nonce)
    const messageToSign = message.prepareMessage()
    const signature = await signer.signMessage(messageToSign)

    const walletAddress = await this.API?.connectToAlembicWallet({
      message,
      signature,
      ownerAddress
    })

    this.sponsoredAddresses = await this.API.getSponsoredAddresses()
    this.connected = true
    this.walletAddress = walletAddress
  }

  public getConnected(): boolean {
    return this.connected
  }

  public async isDeployed(): Promise<boolean> {
    try {
      await Safe__factory.connect(
        this.getAddress(),
        this.getOwnerProvider()
      ).deployed()
      return true
    } catch (error) {
      return false
    }
  }

  public async getUserInfos(): Promise<UserInfos> {
    if (!this.authAdapter) throw new Error('Cannot provide user infos')
    const userInfos = await this.authAdapter.getUserInfos()

    return {
      ...userInfos,
      ownerAddress: await this.authAdapter.getSigner()?.getAddress(),
      walletAddress: this.getAddress()
    }
  }

  public getAddress(): string {
    return this.walletAddress ?? ''
  }

  private _createMessage(address, nonce): SiweMessage {
    const domain = window.location.host
    const origin = window.location.origin
    const statement = `Sign in with Ethereum to Alembic`
    const message = new SiweMessage({
      domain,
      address,
      statement,
      uri: origin,
      version: '1',
      chainId: this.chainId,
      nonce: nonce?.connectionNonce
    })

    return message
  }

  private _getBalance = async (address: string): Promise<BigNumber> => {
    const provider = this.getOwnerProvider()
    return provider.getBalance(address)
  }

  public async logout(): Promise<void> {
    if (!this.authAdapter) throw new Error('No EOA adapter found')
    await this.authAdapter.logout()
    this.connected = false
  }

  public async addOwner(newOwner: string): Promise<SendTransactionResponse> {
    const tx = {
      to: this.getAddress(),
      value: '0x0',
      data: this.SafeInterface.encodeFunctionData('addOwnerWithThreshold', [
        newOwner,
        1
      ])
    }

    return await this.sendTransaction(tx)
  }

  /**
   * Signing Message Section
   */

  public getOwnerProvider(): Web3Provider {
    const provider = this.authAdapter.getEthProvider()
    if (!provider) throw new Error('getOwnerProvider: missing provider')
    return provider
  }

  public async signMessage(messageToSign: string | Bytes): Promise<string> {
    const signer = this.authAdapter.getEthProvider()?.getSigner()
    if (!signer) throw new Error('Sign message: missing signer')
    const messageHash = ethers.utils.hashMessage(messageToSign)

    const signature = await signer._signTypedData(
      {
        verifyingContract: this.getAddress(),
        chainId: this.chainId
      },
      EIP712_SAFE_MESSAGE_TYPE,
      { message: messageHash }
    )

    return signature
  }

  /**
   * Transaction Section
   */

  private _signTransaction = async (
    safeTxData: SafeTransactionDataPartial,
    nonce?: number
  ): Promise<string> => {
    const signer = this.authAdapter.getEthProvider()?.getSigner()
    if (!signer) throw new Error('Sign message: missing signer')

    return await signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: this.getAddress()
      },
      EIP712_SAFE_TX_TYPES,
      {
        to: safeTxData.to,
        value: BigNumber.from(safeTxData.value).toString(),
        data: safeTxData.data,
        operation: 0,
        safeTxGas: BigNumber.from(safeTxData.safeTxGas).toString(),
        baseGas: BigNumber.from(safeTxData.baseGas).toString(),
        gasPrice: BigNumber.from(safeTxData.gasPrice).toString(),
        gasToken: ethers.constants.AddressZero,
        refundReceiver: ethers.constants.AddressZero,
        nonce: BigNumber.from(nonce ?? (await this._getNonce())).toString()
      }
    )
  }

  private _getNonce = async (): Promise<number> => {
    return (await this.isDeployed())
      ? (
          await Safe__factory.connect(
            this.getAddress(),
            this.getOwnerProvider()
          ).nonce()
        ).toNumber()
      : 0
  }

  private _toSponsoredAddress(targetAddress: string): boolean {
    const sponsoredAddress = this.sponsoredAddresses?.find(
      (sponsoredAddress) => sponsoredAddress.targetAddress === targetAddress
    )
    return sponsoredAddress ? true : false
  }

  public async _estimateTransactionGas(
    safeTxData: SafeTransactionDataPartial
  ): Promise<{
    safeTxGas: BigNumber
    baseGas: number
    gasPrice: BigNumber
  }> {
    const safeTxGas = await this.getOwnerProvider().estimateGas({
      from: this.getAddress(),
      to: safeTxData.to,
      value: safeTxData.value,
      data: safeTxData.data
    })

    const ethFeeHistory = await this.getOwnerProvider().send('eth_feeHistory', [
      1,
      'latest',
      [this.REWARD_PERCENTILE]
    ])
    const [reward, BaseFee] = [
      BigNumber.from(ethFeeHistory.reward[0][0]),
      BigNumber.from(ethFeeHistory.baseFeePerGas[0])
    ]

    return {
      safeTxGas,
      baseGas: this.BASE_GAS,
      gasPrice: reward.add(BaseFee)
    }
  }

  public async sendTransaction(
    safeTxData: MetaTransactionData
  ): Promise<SendTransactionResponse> {
    const nonce = await this._getNonce()

    const safeTxDataTyped = {
      to: safeTxData.to,
      value: safeTxData.value ?? 0,
      data: safeTxData.data,
      operation: 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce
    }

    if (!this._toSponsoredAddress(safeTxDataTyped.to)) {
      const { safeTxGas, baseGas, gasPrice } =
        await this._estimateTransactionGas(safeTxDataTyped)

      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = baseGas
      safeTxDataTyped.gasPrice = +gasPrice

      const walletBalance = await this._getBalance(this.getAddress())
      const totalGasCost = BigNumber.from(safeTxGas)
        .add(BigNumber.from(baseGas))
        .mul(BigNumber.from(gasPrice))

      if (
        walletBalance.lt(
          totalGasCost.add(BigNumber.from(safeTxDataTyped.value))
        )
      )
        throw new Error('Not enough balance to send this value and pay for gas')
    }

    const signature = await this._signTransaction(safeTxDataTyped, nonce)

    const safeTxHash = await this.API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: signature,
      walletAddress: this.getAddress()
    })

    return { safeTxHash }
  }

  public async getSuccessExecTransactionEvent(
    safeTxHash: string
  ): Promise<any> {
    const safeInstance = await Safe__factory.connect(
      this.getAddress(),
      this.getOwnerProvider()
    )

    const transactionEvents = await safeInstance.queryFilter(
      safeInstance.filters.ExecutionSuccess(),
      BLOCK_EVENT_GAP
    )
    const filteredTransactionEvent = transactionEvents.filter(
      (e) => e.args.txHash === safeTxHash
    )

    return filteredTransactionEvent[0]
  }

  public async getFailedExecTransactionEvent(safeTxHash: string): Promise<any> {
    const safeInstance = await Safe__factory.connect(
      this.getAddress(),
      this.getOwnerProvider()
    )

    const transactionEvents = await safeInstance.queryFilter(
      safeInstance.filters.ExecutionFailure(),
      BLOCK_EVENT_GAP
    )
    const filteredTransactionEvent = transactionEvents.filter(
      (e) => e.args.txHash === safeTxHash
    )

    return filteredTransactionEvent[0]
  }
}
