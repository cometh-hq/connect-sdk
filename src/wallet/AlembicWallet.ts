import {
  JsonRpcSigner,
  TransactionReceipt,
  Web3Provider
} from '@ethersproject/providers'
import Safe from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { BigNumber, Bytes, ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import {
  DEFAULT_BASE_GAS,
  DEFAULT_CHAIN_ID,
  DEFAULT_REWARD_PERCENTILE,
  DEFAULT_RPC_TARGET,
  EIP712_SAFE_MESSAGE_TYPE
} from '../constants'
import { API } from '../services'
import { EOAAdapter, EOAConstructor, Web3AuthAdapter } from './adapters'
import { AlembicProvider } from './AlembicProvider'
import {
  SendTransactionResponse,
  SponsoredTransaction,
  TransactionStatus,
  UserInfos
} from './types'

export interface AlembicWalletConfig {
  eoaAdapter?: EOAConstructor
  chainId?: number
  rpcTarget?: string
  apiKey: string
}
export class AlembicWallet {
  private eoaAdapter: EOAAdapter
  readonly chainId: number
  private rpcTarget: string
  private connected = false
  private BASE_GAS: number
  private REWARD_PERCENTILE: number

  private sponsoredAddresses?: SponsoredTransaction[]
  private safeSdk?: Safe
  private API: API

  constructor({
    eoaAdapter = Web3AuthAdapter,
    chainId = DEFAULT_CHAIN_ID,
    rpcTarget = DEFAULT_RPC_TARGET,
    apiKey
  }: AlembicWalletConfig) {
    this.chainId = chainId
    this.rpcTarget = rpcTarget
    this.eoaAdapter = new eoaAdapter()
    this.API = new API(apiKey)
    this.BASE_GAS = DEFAULT_BASE_GAS
    this.REWARD_PERCENTILE = DEFAULT_REWARD_PERCENTILE
  }

  /**
   * Connection Section
   */

  public async connect(): Promise<void> {
    // Return if does not match requirements
    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    await this.eoaAdapter.init(this.chainId, this.rpcTarget)
    await this.eoaAdapter.connect()

    const signer = this.getSigner()
    if (!signer) throw new Error('No signer found')

    const ownerAddress = await signer.getAddress()
    if (!ownerAddress) throw new Error('No ownerAddress found')

    const nonce = await this.API.getNonce(ownerAddress)
    this.sponsoredAddresses = await this.API.getSponsoredAddresses()

    const message: SiweMessage = this._createMessage(ownerAddress, nonce)
    const messageToSign = message.prepareMessage()
    const signature = await signer.signMessage(messageToSign)

    const smartWalletAddress = await this.API?.connectToAlembicWallet({
      message,
      signature,
      ownerAddress
    })

    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    })

    this.safeSdk = await Safe.create({
      ethAdapter: ethAdapter,
      safeAddress: smartWalletAddress
    })

    this.connected = true
  }

  public getConnected(): boolean {
    return this.connected
  }

  public async getUserInfos(): Promise<UserInfos> {
    if (!this.eoaAdapter) throw new Error('Cannot provide user infos')
    const userInfos = await this.eoaAdapter.getUserInfos()

    return {
      ...userInfos,
      ownerAddress: await this.getSigner()?.getAddress(),
      smartWalletAddress: this.getSmartWalletAddress()
    }
  }

  public getSmartWalletAddress(): string {
    return this.safeSdk?.getAddress() ?? ''
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

  public async logout(): Promise<void> {
    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    await this.eoaAdapter.logout()
    this.connected = false
  }

  /**
   * Signing Section
   */

  public getOwnerProvider(): Web3Provider {
    const provider = this.eoaAdapter.getEthProvider()
    if (!provider) throw new Error('getOwnerProvider: missing provider')
    return provider
  }

  public getSigner(): JsonRpcSigner | undefined {
    return this.getOwnerProvider()?.getSigner()
  }

  public async signMessage(messageToSign: string | Bytes): Promise<string> {
    const signer = this.getSigner()
    if (!signer) throw new Error('Sign message: missing signer')
    const messageHash = ethers.utils.hashMessage(messageToSign)

    const signature = await signer._signTypedData(
      {
        verifyingContract: await this.getSmartWalletAddress(),
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

  async sendTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<SendTransactionResponse> {
    if (!this.safeSdk) throw new Error('No Safe SDK found')

    const safeTxDataTyped = {
      to: safeTxData.to,
      value: safeTxData.value ?? 0,
      data: safeTxData.data,
      operation: safeTxData.operation ?? 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: safeTxData.gasToken ?? ethers.constants.AddressZero,
      refundReceiver: safeTxData.refundReceiver ?? ethers.constants.AddressZero
    }

    if (!this._isToSponsoredAddress(safeTxData.to)) {
      const { safeTxGas, baseGas, gasPrice } =
        await this.estimateTransactionGas(safeTxData)

      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = baseGas
      safeTxDataTyped.gasPrice = +gasPrice
    }

    const safeTransaction = await this.safeSdk.createTransaction({
      safeTransactionData: safeTxDataTyped
    })

    const safeTransactionHash = await this.safeSdk.getTransactionHash(
      safeTransaction
    )

    const signature = await this.safeSdk.signTypedData(safeTransaction)

    const relayId = await this.API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: signature.data,
      smartWalletAddress: this.safeSdk.getAddress()
    })

    return { relayId, safeTransactionHash }
  }

  private _isToSponsoredAddress(targetAddress: string): boolean {
    const sponsoredAddress = this.sponsoredAddresses?.find(
      (sponsoredAddress) => sponsoredAddress.targetAddress === targetAddress
    )
    return sponsoredAddress ? true : false
  }

  public async getRelayTxStatus(relayId: string): Promise<TransactionStatus> {
    return await this.API.getRelayTxStatus(relayId)
  }

  public async waitRelay(relayId: string): Promise<TransactionReceipt> {
    const provider = new AlembicProvider(this)
    const tx = await provider.getTransaction(relayId)
    return await tx.wait()
  }

  public async estimateTransactionGas(
    safeTxData: SafeTransactionDataPartial
  ): Promise<{
    safeTxGas: BigNumber
    baseGas: number
    gasPrice: BigNumber
  }> {
    const provider = new ethers.providers.StaticJsonRpcProvider(this.rpcTarget)

    const safeTxGas = await provider.estimateGas({
      from: this.getSmartWalletAddress(),
      to: safeTxData.to,
      value: safeTxData.value,
      data: safeTxData.data
    })

    const ethFeeHistory = await provider.send('eth_feeHistory', [
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
}
