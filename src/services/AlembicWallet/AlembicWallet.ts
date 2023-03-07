import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { SiweMessage } from 'siwe'

import {
  DEFAULT_CHAIN_ID,
  DEFAULT_RPC_TARGET,
  EOAAdapter,
  EOAConstructor,
  Web3AuthAdapter
} from '../../adapters'
import {
  EthProvider,
  OwnerAddress,
  SmartWalletAddress,
  UserNonceType
} from '../../types'
import { API } from '../API/API'
import { SmartWallet } from '../SmartWallet'
import { SmartWallet as SmartWalletType } from '../types'

export class AlembicWallet {
  private eoaAdapter: EOAAdapter
  private chainId: number
  private rpcTarget: string
  private isConnected = false
  private smartWalletAddress: SmartWalletAddress | null = null
  private ethProvider: EthProvider | null = null
  private smartWallet: SmartWalletType | null = null

  constructor(
    eoaAdapter: EOAConstructor = Web3AuthAdapter,
    chainId: number = DEFAULT_CHAIN_ID,
    rpcTarget: string = DEFAULT_RPC_TARGET
  ) {
    this.chainId = chainId
    this.rpcTarget = rpcTarget
    this.eoaAdapter = new eoaAdapter()
  }

  public async connect(): Promise<void> {
    // Return if does not match requirements

    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    if (!this.chainId) throw new Error('No chainId set')
    if (!this.rpcTarget) throw new Error('No rpcUrl set')

    // Initialize EOA adapter

    await this.eoaAdapter.init(this.chainId, this.rpcTarget)
    await this.eoaAdapter.connect()

    // We get the user account

    const account = await this.eoaAdapter.getAccount()
    if (!account) throw new Error('No account found')

    // We get the user nonce by calling AlembicAPI

    const nonce = await API.getNonce(account)
    if (!nonce) throw new Error('No nonce found')

    // We prepare and sign a message, using siwe, in order to prove the user identity

    const message: SiweMessage = this.createMessage(account, nonce)
    const messageToSign = message.prepareMessage()
    const signer = this.eoaAdapter.getSigner()
    if (!signer) throw new Error('No signer found')

    const signature = await signer.signMessage(messageToSign)

    if (!signature) throw new Error('No signature found')

    const smartWalletAddress = await API.connectToAlembicWallet({
      message,
      signature,
      ownerAddress: account
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
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected
  }

  public async logout(): Promise<void> {
    if (!this.eoaAdapter) throw new Error('No EOA adapter found')
    await this.eoaAdapter.logout()
    this.isConnected = false
  }

  private createMessage(
    address: OwnerAddress,
    nonce: UserNonceType
  ): SiweMessage {
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
  ): Promise<void> {
    if (!this.smartWallet) throw new Error('No smart wallet found')
    await this.smartWallet.sendTransaction(safeTxData)
  }
}
