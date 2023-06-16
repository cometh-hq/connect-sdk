import { JsonRpcSigner, StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Bytes, ethers, Wallet } from 'ethers'
import { encodeMulti } from 'ethers-multisend'
import { SiweMessage } from 'siwe'

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
import siweService from '../services/siweService'
import webAuthnService from '../services/webAuthnService'
import { GasModal } from '../ui'
import { AUTHAdapter } from './adapters'
import { WebAuthnSigner } from './signers/WebAuthnSigner'
import {
  MetaTransactionData,
  SafeTransactionDataPartial,
  SendTransactionResponse,
  SponsoredTransaction,
  UIConfig,
  UserInfos,
  WebAuthnOwner
} from './types'

export interface AlembicWalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
  rpcUrl?: string
  uiConfig?: UIConfig
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
  private signer?: JsonRpcSigner | Wallet | WebAuthnSigner
  private webAuthnOwner?: WebAuthnOwner
  private uiConfig = {
    displayValidationModal: true
  }

  constructor({ authAdapter, apiKey, rpcUrl }: AlembicWalletConfig) {
    this.authAdapter = authAdapter
    this.chainId = +authAdapter.chainId
    this.API = new API(apiKey, this.chainId)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[this.chainId].RPCUrl
    )
    this.BASE_GAS = DEFAULT_BASE_GAS
    this.REWARD_PERCENTILE = DEFAULT_REWARD_PERCENTILE
  }

  /**
   * Connection Section
   */

  public async connect(): Promise<void> {
    if (!networks[this.chainId])
      throw new Error('This network is not supported')

    if (await this._verifyWebAuthnOwner()) {
      if (!this.webAuthnOwner) throw new Error('No WebAuthn Signer found')

      this.walletAddress = this.webAuthnOwner.walletAddress
      this.signer = new WebAuthnSigner(
        this.webAuthnOwner.signerAddress,
        this.webAuthnOwner.publicKeyId
      )
    } else {
      if (!this.authAdapter) throw new Error('No EOA adapter found')

      await this.authAdapter.connect()
      const ownerAddress = await this.authAdapter.getSigner().getAddress()

      this.walletAddress = await this.API.getWalletAddress(ownerAddress)
      this.signer = this.authAdapter.getSigner()
    }

    if (!this.signer) throw new Error('No signer found')
    if (!this.walletAddress) throw new Error('No walletAddress found')

    const nonce = await this.API.getNonce(this.walletAddress)
    const message: SiweMessage = siweService.createMessage(
      this.walletAddress,
      nonce,
      this.chainId
    )
    const signature = await this.signMessage(message.prepareMessage())

    await this.API.connectToAlembicWallet({
      message,
      signature,
      walletAddress: this.walletAddress
    })

    this.sponsoredAddresses = await this.API.getSponsoredAddresses()
    this.connected = true
  }

  public getConnected(): boolean {
    return this.connected
  }

  public getProvider(): StaticJsonRpcProvider {
    return this.provider
  }

  public async getUserInfos(): Promise<Partial<UserInfos>> {
    try {
      const userInfos = await this.authAdapter.getUserInfos()
      return {
        ...userInfos,
        ownerAddress: await this.authAdapter.getSigner()?.getAddress(),
        walletAddress: this.getAddress()
      }
    } catch {
      return { walletAddress: this.getAddress() }
    }
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
          sponsoredAddress.targetAddress === safeTransactionData[i].to
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
      await gasService.verifyHasEnoughBalance(
        this.provider,
        this.REWARD_PERCENTILE,
        this.getAddress(),
        safeTxGas,
        this.BASE_GAS,
        safeTxData.value
      )
      if (this.uiConfig.displayValidationModal) {
        await this.displayModal(safeTxGas)
      }

      const gasPrice = await gasService.getGasPrice(
        this.provider,
        this.REWARD_PERCENTILE
      )

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
      await gasService.verifyHasEnoughBalance(
        this.provider,
        this.REWARD_PERCENTILE,
        this.getAddress(),
        safeTxGas,
        this.BASE_GAS,
        txValue
      )
      if (this.uiConfig.displayValidationModal) {
        this.displayModal(safeTxGas)
      }

      const gasPrice = await gasService.getGasPrice(
        this.provider,
        this.REWARD_PERCENTILE
      )
      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = this.BASE_GAS
      safeTxDataTyped.gasPrice = +gasPrice
    }

    const safeTxHash = await this._signAndSendTransaction(safeTxDataTyped)

    return { safeTxHash }
  }

  public async displayModal(safeTxGas: BigNumber): Promise<void> {
    const walletBalance = await this.provider.getBalance(this.getAddress())
    const gasPrice = await gasService.getGasPrice(
      this.provider,
      this.REWARD_PERCENTILE
    )
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
   * WebAuthn Section
   */

  public async getCurrentWebAuthnOwner(): Promise<WebAuthnOwner | undefined> {
    const publicKeyId = webAuthnService.getCurrentPublicKeyId()

    if (publicKeyId === null) return undefined

    const currentWebAuthnOwner = await this.API.getWebAuthnOwnerByPublicKeyId(
      <string>publicKeyId
    )

    if (currentWebAuthnOwner === null) return undefined

    return currentWebAuthnOwner
  }

  public async addWebAuthnOwner(): Promise<string> {
    const isDeployed = await safeService.isDeployed(
      this.getAddress(),
      this.getProvider()
    )
    if (!isDeployed)
      throw new Error(
        'You need to make a transaction before deploying a webAuth signer'
      )

    const getWebAuthnOwners = await this.API.getWebAuthnOwners(
      this.getAddress()
    )

    const signerName = `Alembic Connect - ${
      getWebAuthnOwners ? getWebAuthnOwners.length + 1 : 1
    }`

    const webAuthnCredentials = await webAuthnService.createCredentials(
      signerName
    )

    const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`
    const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`
    const publicKeyId = webAuthnCredentials.id

    const predictedSignerAddress = await webAuthnService.predictSignerAddress(
      publicKeyX,
      publicKeyY,
      this.chainId
    )

    const addOwnerTxData = await safeService.prepareAddOwnerTx(
      this.getAddress(),
      predictedSignerAddress
    )

    const addOwnerTxSignature = await this.signTransaction(addOwnerTxData)

    const message = `${publicKeyX},${publicKeyY},${publicKeyId}`
    const signature = await this.signMessage(message)

    await this.API.addWebAuthnOwner(
      this.getAddress(),
      signerName,
      publicKeyId,
      publicKeyX,
      publicKeyY,
      signature,
      message,
      JSON.stringify(addOwnerTxData),
      addOwnerTxSignature
    )

    await webAuthnService.waitWebAuthnSignerDeployment(
      publicKeyX,
      publicKeyY,
      this.chainId,
      this.getProvider()
    )

    webAuthnService.updateCurrentWebAuthnOwner(
      publicKeyId,
      publicKeyX,
      publicKeyY
    )

    this.signer = new WebAuthnSigner(predictedSignerAddress, publicKeyId)

    return predictedSignerAddress
  }

  private async _verifyWebAuthnOwner(): Promise<boolean> {
    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner()

    if (!currentWebAuthnOwner) return false

    this.webAuthnOwner = currentWebAuthnOwner

    const isSafeOwner = await safeService.isSafeOwner(
      currentWebAuthnOwner.walletAddress,
      currentWebAuthnOwner.signerAddress,
      this.getProvider()
    )

    if (!isSafeOwner) return false

    return true
  }
}
