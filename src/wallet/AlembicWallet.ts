import { JsonRpcSigner, StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Bytes, ethers, Wallet } from 'ethers'
import { encodeMulti } from 'ethers-multisend'

import {
  DEFAULT_BASE_GAS,
  DEFAULT_REWARD_PERCENTILE,
  EIP712_SAFE_MESSAGE_TYPE,
  EIP712_SAFE_TX_TYPES,
  networks
} from '../constants'
import { API } from '../services'
import gasService from '../services/gasService'
import safeService from '../services/safeService'
import { GasModal } from '../ui'
import { AUTHAdapter, CustomAuthAdaptor } from './adapters'
import { PassEncodedSigner } from './signers'
import { AlembicAuthSigner } from './signers/AlembicAuthSigner'
import { WebAuthnSigner } from './signers/WebAuthnSigner'
import {
  AlembicInitOptions,
  MetaTransactionData,
  NewSignerRequest,
  SafeTransactionDataPartial,
  SendTransactionResponse,
  SponsoredTransaction,
  UIConfig,
  WalletInfos
} from './types'

export interface AlembicWalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
  rpcUrl?: string
  uiConfig?: UIConfig
  baseUrl?: string
}
export class AlembicWallet {
  public authAdapter: AUTHAdapter
  readonly chainId: number
  private connected = false
  private BASE_GAS: number
  private REWARD_PERCENTILE: number
  private API: API
  private provider: StaticJsonRpcProvider
  private sponsoredAddresses?: SponsoredTransaction[]
  private walletAddress?: string
  private signer?:
    | JsonRpcSigner
    | Wallet
    | WebAuthnSigner
    | AlembicAuthSigner
    | PassEncodedSigner

  private uiConfig: UIConfig = {
    displayValidationModal: true
  }

  constructor({ authAdapter, apiKey, rpcUrl, baseUrl }: AlembicWalletConfig) {
    this.authAdapter = authAdapter
    this.chainId = +authAdapter.chainId
    this.API = new API(apiKey, this.chainId, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[this.chainId].RPCUrl
    )
    this.BASE_GAS = DEFAULT_BASE_GAS
    this.REWARD_PERCENTILE = DEFAULT_REWARD_PERCENTILE
  }

  /**
   * Connection Section
   */

  public async connect(alembicInitOptions?: AlembicInitOptions): Promise<void> {
    if (!networks[this.chainId])
      throw new Error('This network is not supported')

    if (!this.authAdapter) throw new Error('No EOA adapter found')
    await this.authAdapter.connect(alembicInitOptions)

    this.signer = this.authAdapter.getSigner()
    this.walletAddress = await this.authAdapter.getWalletAddress()

    if (!this.signer) throw new Error('No signer found')
    if (!this.walletAddress) throw new Error('No walletAddress found')

    this.sponsoredAddresses = await this.API.getSponsoredAddresses()
    this.connected = true
  }

  public getConnected(): boolean {
    return this.connected
  }

  public getProvider(): StaticJsonRpcProvider {
    return this.provider
  }

  public async getUserInfos(): Promise<WalletInfos> {
    const walletInfos = await this.API.getWalletInfos(this.getAddress())
    return walletInfos
  }

  public getAddress(): string {
    return this.walletAddress ?? ''
  }

  public async logout(): Promise<void> {
    if (this.authAdapter) await this.authAdapter.logout()

    this.connected = false
  }

  public async addOwner(newOwner: string): Promise<SendTransactionResponse> {
    const tx = await safeService.prepareAddOwnerTx(this.getAddress(), newOwner)

    return await this.sendTransaction(tx)
  }

  /**
   * Signing Message Section
   */

  public async signMessage(messageToSign: string | Bytes): Promise<string> {
    if (typeof messageToSign === 'string') {
      messageToSign = ethers.utils.hashMessage(messageToSign)
    }

    if (!this.signer) throw new Error('Sign message: missing signer')

    return await this.signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: this.getAddress()
      },
      EIP712_SAFE_MESSAGE_TYPE,
      { message: messageToSign }
    )
  }

  async signTransaction(
    safeTxData: SafeTransactionDataPartial
  ): Promise<string> {
    if (!this.signer) throw new Error('Sign message: missing signer')

    return await this.signer._signTypedData(
      {
        chainId: this.chainId,
        verifyingContract: this.getAddress()
      },
      EIP712_SAFE_TX_TYPES,
      {
        to: safeTxData.to,
        value: BigNumber.from(safeTxData.value).toString(),
        data: safeTxData.data,
        operation: safeTxData.operation,
        safeTxGas: BigNumber.from(safeTxData.safeTxGas).toString(),
        baseGas: BigNumber.from(safeTxData.baseGas).toString(),
        gasPrice: BigNumber.from(safeTxData.gasPrice).toString(),
        gasToken: ethers.constants.AddressZero,
        refundReceiver: ethers.constants.AddressZero,
        nonce: BigNumber.from(
          safeTxData.nonce
            ? safeTxData.nonce
            : await safeService.getNonce(this.getAddress(), this.getProvider())
        ).toString()
      }
    )
  }

  private async _isSponsoredTransaction(
    safeTransactionData: MetaTransactionData[]
  ): Promise<boolean> {
    for (let i = 0; i < safeTransactionData.length; i++) {
      const sponsoredAddress = this.sponsoredAddresses?.find(
        (sponsoredAddress) =>
          sponsoredAddress.targetAddress.toLowerCase() ===
          safeTransactionData[i].to.toLowerCase()
      )

      if (!sponsoredAddress) return false
    }
    return true
  }

  public async _signAndSendTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<string> {
    const txSignature = await this.signTransaction(safeTxDataTyped)

    return await this.API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: txSignature,
      walletAddress: this.getAddress()
    })
  }

  public async sendTransaction(
    safeTxData: MetaTransactionData
  ): Promise<SendTransactionResponse> {
    const safeTxGas = await gasService.estimateSafeTxGas(
      this.getAddress(),
      [safeTxData],
      this.provider
    )

    const safeTxDataTyped = {
      ...(await this._prepareTransaction(
        safeTxData.to,
        safeTxData.value,
        safeTxData.data
      ))
    }

    if (!(await this._isSponsoredTransaction([safeTxDataTyped]))) {
      const gasPrice = await gasService.getGasPrice(
        this.provider,
        this.REWARD_PERCENTILE
      )
      await gasService.verifyHasEnoughBalance(
        this.provider,
        this.getAddress(),
        safeTxGas,
        gasPrice,
        this.BASE_GAS,
        safeTxData.value
      )
      if (this.uiConfig.displayValidationModal) {
        await this.displayModal(safeTxGas, gasPrice)
      }

      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = this.BASE_GAS
      safeTxDataTyped.gasPrice = +gasPrice
    }

    const safeTxHash = await this._signAndSendTransaction(safeTxDataTyped)

    return { safeTxHash }
  }

  public async sendBatchTransactions(
    safeTxData: MetaTransactionData[]
  ): Promise<SendTransactionResponse> {
    if (safeTxData.length === 0) {
      throw new Error('Empty array provided, no transaction to send')
    }

    const safeTxGas = await gasService.estimateSafeTxGas(
      this.getAddress(),
      safeTxData,
      this.provider
    )

    const safeTxDataTyped = {
      ...(await this._prepareTransaction(
        networks[this.chainId].multisendContractAddress,
        '0',
        encodeMulti(safeTxData).data,
        1
      ))
    }

    if (!(await this._isSponsoredTransaction(safeTxData))) {
      const txValue = await safeService.getTransactionsTotalValue(safeTxData)
      const gasPrice = await gasService.getGasPrice(
        this.provider,
        this.REWARD_PERCENTILE
      )
      await gasService.verifyHasEnoughBalance(
        this.provider,
        this.getAddress(),
        safeTxGas,
        gasPrice,
        this.BASE_GAS,
        txValue
      )
      if (this.uiConfig.displayValidationModal) {
        this.displayModal(safeTxGas, gasPrice)
      }

      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = this.BASE_GAS
      safeTxDataTyped.gasPrice = +gasPrice
    }

    const safeTxHash = await this._signAndSendTransaction(safeTxDataTyped)

    return { safeTxHash }
  }

  public async displayModal(
    safeTxGas: BigNumber,
    gasPrice: BigNumber
  ): Promise<void> {
    const walletBalance = await this.provider.getBalance(this.getAddress())
    const totalGasCost = await gasService.getTotalCost(
      safeTxGas,
      this.BASE_GAS,
      gasPrice
    )

    const displayedTotalBalance = (+ethers.utils.formatEther(
      ethers.utils.parseUnits(walletBalance.toString(), 'wei')
    )).toFixed(3)

    const displayedTotalGasCost = (+ethers.utils.formatEther(
      ethers.utils.parseUnits(totalGasCost.toString(), 'wei')
    )).toFixed(3)

    if (
      !(await new GasModal().initModal(
        displayedTotalBalance,
        displayedTotalGasCost
      ))
    ) {
      throw new Error('Transaction denied')
    }
  }

  public async _prepareTransaction(
    to: string,
    value: string,
    data: string,
    operation?: number
  ): Promise<SafeTransactionDataPartial> {
    return {
      to: to,
      value: value ?? '0',
      data: data,
      operation: operation ?? 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: ethers.constants.AddressZero,
      refundReceiver: ethers.constants.AddressZero,
      nonce: await safeService.getNonce(this.getAddress(), this.getProvider())
    }
  }

  /**
   * New Signer Request Section
   */

  public async createNewSignerRequest(): Promise<void> {
    if (!this.walletAddress) throw new Error('no wallet Address')

    if (!(this.authAdapter instanceof CustomAuthAdaptor))
      throw new Error('method not allowed for this authAdapter')

    await this.authAdapter.createNewSignerRequest(this.walletAddress)
  }

  public async validateNewSignerRequest(
    signerAddress: string
  ): Promise<SendTransactionResponse> {
    if (!this.walletAddress) throw new Error('no wallet Address')

    if (!(this.authAdapter instanceof CustomAuthAdaptor))
      throw new Error('method not allowed for this authAdapter')

    const addOwnerTxData = await safeService.prepareAddOwnerTx(
      this.walletAddress,
      signerAddress
    )
    const addOwnerTxSignature = await this.signTransaction(addOwnerTxData)
    const nonce = await safeService.getNonce(this.walletAddress, this.provider)

    const tx = await this.authAdapter.validateNewSignerRequest({
      signerAddress,
      addOwnerTxData,
      nonce,
      addOwnerTxSignature
    })

    return tx
  }

  public async getNewSignerRequestByUser(): Promise<NewSignerRequest[] | null> {
    if (!this.walletAddress) throw new Error('no wallet Address')

    if (!(this.authAdapter instanceof CustomAuthAdaptor))
      throw new Error('method not allowed for this authAdapter')

    return await this.authAdapter.getNewSignerRequestByUser()
  }

  public async deleteNewSignerRequest(signerAddress: string): Promise<void> {
    if (!this.walletAddress) throw new Error('no wallet Address')

    if (!(this.authAdapter instanceof CustomAuthAdaptor))
      throw new Error('method not allowed for this authAdapter')

    await this.authAdapter.deleteNewSignerRequest(signerAddress)
  }
}
