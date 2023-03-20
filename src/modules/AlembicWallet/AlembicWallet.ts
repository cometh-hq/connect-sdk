import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import {
  DEFAULT_CHAIN_ID,
  DEFAULT_RPC_TARGET,
  EOAAdapter,
  EOAConstructor,
  Web3AuthAdapter
} from '../../adapters'
import { API } from '../../services/API/API'
import { TransactionStatus, UserInfos } from '../../types'
import { SmartWallet } from '../SmartWallet'

export interface IAlembicWalletConstructor {
  eoaAdapter?: EOAConstructor
  chainId?: number
  rpcTarget?: string
  apiKey: string
}
export class AlembicWallet {
  private eoaAdapter: EOAAdapter
  private chainId: number
  private rpcTarget: string
  private connected = false
  private smartWalletAddress: string | null = null
  private ethProvider: ethers.providers.Web3Provider | null = null
  private smartWallet: SmartWallet | null = null
  private ownerAddress: string | null = null
  private API: API | null = null

  constructor({
    eoaAdapter = Web3AuthAdapter,
    chainId = DEFAULT_CHAIN_ID,
    rpcTarget = DEFAULT_RPC_TARGET,
    apiKey
  }: IAlembicWalletConstructor) {
    if (!apiKey) throw new Error('No API key provided')

    this.chainId = chainId
    this.rpcTarget = rpcTarget
    this.eoaAdapter = new eoaAdapter()
    this.API = new API(apiKey)
  }

  public async connect(): Promise<void> {
    // Return if does not match requirements

    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    if (!this.chainId) throw new Error('No chainId set')
    if (!this.rpcTarget) throw new Error('No rpcUrl set')

    // Initialize EOA adapter

    await this.eoaAdapter.init(this.chainId, this.rpcTarget)
    await this.eoaAdapter.connect()

    // We get the owner address

    const ownerAddress = await this.eoaAdapter.getAccount()
    if (!ownerAddress) throw new Error('No account found')

    this.ownerAddress = ownerAddress

    // We get the user nonce by calling AlembicAPI

    const nonce = await this.API?.getNonce(ownerAddress)
    if (!nonce) throw new Error('No nonce found')

    // We prepare and sign a message, using siwe, in order to prove the user identity

    const message: SiweMessage = this.createMessage(ownerAddress, nonce)
    const messageToSign = message.prepareMessage()
    const signature = await this.signMessage(messageToSign)

    if (!signature) throw new Error('No signature found')

    const smartWalletAddress = await this.API?.connectToAlembicWallet({
      message,
      signature,
      ownerAddress: ownerAddress
    })
    if (!smartWalletAddress) throw new Error('Failed to connect to Alembic')

    // We set the connection status to true and store the ethProvider

    if (smartWalletAddress) {
      this.smartWalletAddress = smartWalletAddress
      this.ethProvider = this.eoaAdapter.getEthProvider()
    }

    // We initialize the smart wallet

    if (this.ethProvider && this.smartWalletAddress) {
      const smartWallet = new SmartWallet({
        smartWalletAddress: this.smartWalletAddress,
        ethProvider: this.ethProvider
      })
      await smartWallet.init()
      this.smartWallet = smartWallet
      this.connected = true
    }
  }

  public getConnected(): boolean {
    return this.connected
  }

  public async logout(): Promise<void> {
    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    await this.eoaAdapter.logout()
    this.connected = false
  }

  private createMessage(address, nonce): SiweMessage {
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

  public async sendTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<string | null> {
    if (!this.smartWallet) throw new Error('No smart wallet found')
    if (!this.API) throw new Error('No API found')
    const relayId = await this.smartWallet.sendTransaction(safeTxData, this.API)
    return relayId
  }

  public async getRelayTxStatus(
    relayId: string
  ): Promise<TransactionStatus | null | undefined> {
    if (!this.smartWallet) throw new Error('No smart wallet found')
    return await this.API?.getRelayTxStatus(relayId)
  }

  public async getUserInfos(): Promise<UserInfos> {
    if (!this.eoaAdapter || !this.ownerAddress || !this.smartWalletAddress)
      throw new Error('Cannot provide user infos')
    const userInfos = await this.eoaAdapter.getUserInfos()
    return {
      ...userInfos,
      ownerAddress: this.ownerAddress,
      smartWalletAddress: this.smartWalletAddress
    }
  }

  public getOwnerAddress(): string | null {
    return this.ownerAddress
  }

  public getSmartWalletAddress(): string | null {
    return this.smartWalletAddress
  }

  public async signMessage(messageToSign: string): Promise<string | undefined> {
    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    const signer = this.eoaAdapter.getSigner()
    const signature = await signer?.signMessage(messageToSign)
    return signature
  }
}