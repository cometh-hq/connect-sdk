import { JsonRpcSigner, StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Bytes, constants, Wallet } from 'ethers'
import { formatUnits, hashMessage, isAddress } from 'ethers/lib/utils'
import { encodeMulti, MetaTransaction } from 'ethers-multisend'

import {
  DEFAULT_BASE_GAS_LOCAL_WALLET,
  DEFAULT_BASE_GAS_WEBAUTHN,
  DEFAULT_REWARD_PERCENTILE,
  EIP712_SAFE_MESSAGE_TYPE,
  EIP712_SAFE_TX_TYPES,
  networks
} from '../constants'
import { API } from '../services'
import delayModuleService from '../services/delayModuleService'
import deploymentManagerService from '../services/deploymentManagerService'
import gasService from '../services/gasService'
import safeService from '../services/safeService'
import simulateTxService from '../services/simulateTxService'
import sponsoredService from '../services/sponsoredService'
import tokenService from '../services/tokenService'
import { GasModal } from '../ui'
import { isMetaTransactionArray } from '../utils/utils'
import { AUTHAdapter } from './adapters'
import {
  AddGuardianError,
  CancelRecoveryError,
  DelayModuleAddressError,
  DisableGuardianError,
  EmptyBatchTransactionError,
  GetRecoveryError,
  GuardianAlreadyEnabledError,
  InvalidAddressFormatError,
  NetworkNotSupportedError,
  NewRecoveryNotSupportedError,
  NoAdapterFoundError,
  NoRecoveryRequestFoundError,
  NoSignerFoundError,
  ProjectParamsError,
  ProvidedNetworkDifferentThanProjectNetwork,
  RecoveryAlreadySetUp,
  RelayedTransactionPendingError,
  SetupDelayModuleError,
  TransactionDeniedError,
  WalletNotConnectedError,
  WrongRPCUrlError
} from './errors'
import { WebAuthnSigner } from './signers/WebAuthnSigner'
import {
  EnrichedOwner,
  MetaTransactionData,
  ProjectParams,
  RecoveryParamsResponse,
  RecoveryRequest,
  RelayedTransaction,
  RelayedTransactionDetails,
  RelayedTransactionStatus,
  SafeTransactionDataPartial,
  SafeTx,
  SendTransactionResponse,
  SponsoredTransaction,
  UIConfig,
  WalletInfos
} from './types'

export interface WalletConfig {
  authAdapter: AUTHAdapter
  apiKey: string
  rpcUrl?: string
  uiConfig?: UIConfig
  baseUrl?: string
  transactionTimeout?: number
  gasToken?: string
}
export class ComethWallet {
  public authAdapter: AUTHAdapter
  readonly chainId: number
  private connected = false
  private BASE_GAS: number
  private REWARD_PERCENTILE: number
  private API: API
  private provider: StaticJsonRpcProvider
  private sponsoredAddresses?: SponsoredTransaction[]
  private walletAddress?: string
  public signer?: JsonRpcSigner | Wallet | WebAuthnSigner
  public transactionTimeout?: number
  private projectParams?: ProjectParams
  private walletInfos?: WalletInfos
  private uiConfig: UIConfig
  private gasToken?: string

  constructor({
    authAdapter,
    apiKey,
    rpcUrl,
    baseUrl,
    uiConfig = {
      displayValidationModal: true
    },
    transactionTimeout,
    gasToken
  }: WalletConfig) {
    this.authAdapter = authAdapter
    this.chainId = +authAdapter.chainId
    this.API = new API(apiKey, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[this.chainId].RPCUrl
    )
    this.BASE_GAS = DEFAULT_BASE_GAS_WEBAUTHN
    this.REWARD_PERCENTILE = DEFAULT_REWARD_PERCENTILE
    this.uiConfig = uiConfig
    this.transactionTimeout = transactionTimeout
    this.gasToken = gasToken ?? constants.AddressZero
  }

  /**
   * Connection Section
   */

  public async connect(walletAddress?: string): Promise<void> {
    if (!networks[this.chainId]) throw new NetworkNotSupportedError()

    const chainIdHex = await this.provider.send('eth_chainId', [])
    const chainId = parseInt(chainIdHex, 16)
    if (this.chainId !== chainId) throw new WrongRPCUrlError()

    if (!this.authAdapter) throw new NoAdapterFoundError()
    await this.authAdapter.connect(walletAddress)

    this.projectParams = await this.API.getProjectParams()
    if (this.chainId !== +this.projectParams.chainId)
      throw new ProvidedNetworkDifferentThanProjectNetwork()

    this.signer = this.authAdapter.getSigner()
    this.walletAddress = this.authAdapter.getWalletAddress()

    if (!this.signer) throw new NoSignerFoundError()
    if (!this.walletAddress) throw new WalletNotConnectedError()

    if (this.signer instanceof Wallet)
      this.BASE_GAS = DEFAULT_BASE_GAS_LOCAL_WALLET

    this.sponsoredAddresses = await this.API.getSponsoredAddresses()
    this.walletInfos = await this.API.getWalletInfos(this.walletAddress)
    this.connected = true
  }

  public getSponsoredAddresses(): SponsoredTransaction[] | undefined {
    return this.sponsoredAddresses
  }

  public getConnected(): boolean {
    return this.connected
  }

  public getProvider(): StaticJsonRpcProvider {
    return this.provider
  }

  public async getWalletInfos(): Promise<WalletInfos> {
    return await this.API.getWalletInfos(this.getAddress())
  }

  public getAddress(): string {
    return this.walletInfos?.address ?? ''
  }

  public async logout(): Promise<void> {
    if (this.authAdapter) await this.authAdapter.logout()

    this.connected = false
  }

  public async addOwner(newOwner: string): Promise<SendTransactionResponse> {
    const tx = await safeService.prepareAddOwnerTx(
      this.getAddress(),
      newOwner,
      this.provider
    )

    return await this.sendTransaction(tx)
  }

  public async removeOwner(owner: string): Promise<SendTransactionResponse> {
    const tx = await safeService.prepareRemoveOwnerTx(
      this.getAddress(),
      owner,
      this.provider
    )

    const localStorageSigner = window.localStorage.getItem(
      `cometh-connect-${this.getAddress()}`
    )

    if (
      localStorageSigner &&
      JSON.parse(localStorageSigner).signerAddress === owner
    )
      window.localStorage.removeItem(`cometh-connect-${this.getAddress()}`)

    return await this.sendTransaction(tx)
  }

  public async getOwners(): Promise<string[]> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    const isWalletDeployed = await safeService.isDeployed(
      this.walletInfos.address,
      this.provider
    )

    const owners = isWalletDeployed
      ? await safeService.getOwners(this.walletInfos.address, this.provider)
      : [this.walletInfos.initiatorAddress]

    return owners
  }

  public async getEnrichedOwners(): Promise<EnrichedOwner[]> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    const owners = await this.getOwners()

    const webAuthnSigners = await this.API.getWebAuthnSignersByWalletAddress(
      this.walletInfos.address
    )

    const enrichedOwners = owners.map((owner) => {
      const webauthSigner = webAuthnSigners.find(
        (webauthnSigner) => webauthnSigner.signerAddress === owner
      )

      if (webauthSigner) {
        return {
          address: owner,
          deviceData: webauthSigner.deviceData,
          creationDate: webauthSigner.creationDate
        }
      } else {
        return { address: owner }
      }
    })

    return enrichedOwners
  }

  /**
   * Signing Message Section
   */

  public async signMessage(messageToSign: string | Bytes): Promise<string> {
    if (typeof messageToSign === 'string') {
      messageToSign = hashMessage(messageToSign)
    }

    if (!this.signer) throw new NoSignerFoundError()

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
    if (!this.signer) throw new NoSignerFoundError()

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
        gasToken: safeTxData.gasToken ?? constants.AddressZero,
        refundReceiver: constants.AddressZero,
        nonce: BigNumber.from(
          safeTxData.nonce
            ? safeTxData.nonce
            : await safeService.getNonce(this.getAddress(), this.getProvider())
        ).toString()
      }
    )
  }

  async getAddOwnerTransaction(
    newSignerAddress: string,
    externalSafeAddress: string
  ): Promise<SafeTx> {
    const safeTxData = await safeService.prepareAddOwnerTx(
      externalSafeAddress,
      newSignerAddress,
      this.provider
    )

    const safeTxDataTyped = {
      ...(await this._formatTransaction(
        safeTxData.to,
        safeTxData.value,
        safeTxData.data
      ))
    }

    return {
      domain: {
        chainId: this.chainId,
        verifyingContract: externalSafeAddress
      },
      types: EIP712_SAFE_TX_TYPES,
      message: {
        to: safeTxDataTyped.to,
        value: BigNumber.from(safeTxDataTyped.value).toString(),
        data: safeTxDataTyped.data,
        operation: safeTxDataTyped.operation,
        safeTxGas: BigNumber.from(safeTxDataTyped.safeTxGas).toString(),
        baseGas: BigNumber.from(safeTxDataTyped.baseGas).toString(),
        gasPrice: BigNumber.from(safeTxDataTyped.gasPrice).toString(),
        gasToken: safeTxDataTyped.gasToken ?? constants.AddressZero,
        refundReceiver: constants.AddressZero,
        nonce: BigNumber.from(
          safeTxDataTyped.nonce
            ? safeTxDataTyped.nonce
            : await safeService.getNonce(
                externalSafeAddress,
                this.getProvider()
              )
        ).toString()
      }
    }
  }

  private async _isSponsoredTransaction(
    safeTransactionData: MetaTransactionData[],
    delayModuleAddress?: string
  ): Promise<boolean> {
    if (!this.walletInfos) throw new WalletNotConnectedError()
    if (!this.projectParams) throw new ProjectParamsError()

    const effectiveProxyDelayAddress =
      delayModuleAddress ?? this.walletInfos.proxyDelayAddress

    for (let i = 0; i < safeTransactionData.length; i++) {
      const functionSelector = safeService.getFunctionSelector(
        safeTransactionData[i]
      )

      const isSponsored = await sponsoredService.isSponsoredAddress(
        functionSelector,
        this.walletInfos.address,
        safeTransactionData[i].to,
        this.sponsoredAddresses,
        effectiveProxyDelayAddress,
        this.projectParams.moduleFactoryAddress
      )

      if (!isSponsored) return false
    }
    return true
  }

  public async _signAndSendTransaction(
    safeTxDataTyped: SafeTransactionDataPartial
  ): Promise<RelayedTransaction> {
    const txSignature = await this.signTransaction(safeTxDataTyped)

    return await this.API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: txSignature,
      walletAddress: this.getAddress()
    })
  }

  public async relayTransaction(
    safeTxDataTyped: SafeTransactionDataPartial,
    txSignature: string,
    externalSafeAddress: string
  ): Promise<RelayedTransaction> {
    return await this.API.relayTransaction({
      safeTxData: safeTxDataTyped,
      signatures: txSignature,
      walletAddress: externalSafeAddress
    })
  }

  public async sendTransaction(
    safeTxData: MetaTransaction,
    delayModuleAddress?: string
  ): Promise<SendTransactionResponse> {
    const safeTxDataTyped = await this.buildTransaction(
      safeTxData,
      delayModuleAddress
    )

    return await this._signAndSendTransaction(safeTxDataTyped)
  }

  public async sendBatchTransactions(
    safeTxData: MetaTransaction[],
    delayModuleAddress?: string
  ): Promise<SendTransactionResponse> {
    if (safeTxData.length === 0) {
      throw new EmptyBatchTransactionError()
    }
    const safeTxDataTyped = await this.buildTransaction(
      safeTxData,
      delayModuleAddress
    )
    return await this._signAndSendTransaction(safeTxDataTyped)
  }

  public async getRelayedTransaction(
    relayId: string
  ): Promise<RelayedTransactionDetails> {
    return await this.API.getRelayedTransaction(relayId)
  }

  public async waitRelayedTransaction(
    relayId: string,
    maxRetries = 30,
    delay = 2000
  ): Promise<string> {
    for (let retries = 0; retries < maxRetries; retries++) {
      const relayedTransaction = await this.getRelayedTransaction(relayId)
      if (
        relayedTransaction.status.confirmed &&
        relayedTransaction.status.confirmed.status === 1
      ) {
        return relayedTransaction.status.confirmed.hash
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    throw new RelayedTransactionPendingError(relayId)
  }

  public async displayModal(
    totalGasCost: BigNumber,
    txValue: BigNumber
  ): Promise<void> {
    let walletBalance: BigNumber
    let currency: string

    if (this.gasToken && this.gasToken !== constants.AddressZero) {
      walletBalance = await gasService.getBalanceForToken(
        this.getAddress(),
        this.gasToken,
        this.provider
      )
      currency = await tokenService.getTokenName(this.gasToken, this.provider)
    } else {
      walletBalance = await this.provider.getBalance(this.getAddress())
      currency = networks[this.chainId].currency
    }

    const totalCost = totalGasCost.add(txValue)

    const displayedTotalBalance = formatUnits(walletBalance, 18)
    const displayedTotalCost = formatUnits(totalCost, 18)

    if (
      !(await new GasModal().initModal(
        displayedTotalBalance,
        displayedTotalCost,
        currency
      ))
    ) {
      throw new TransactionDeniedError()
    }
  }

  public async _formatTransaction(
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
      gasToken: constants.AddressZero,
      refundReceiver: constants.AddressZero,
      nonce: await safeService.getNonce(this.getAddress(), this.getProvider())
    }
  }

  public async estimateTxGasAndValue(
    safeTxData: MetaTransaction | MetaTransaction[]
  ): Promise<{
    safeTxGas: BigNumber
    gasPrice: BigNumber
    totalGasCost: BigNumber
    txValue: BigNumber
  }> {
    if (!this.projectParams) throw new ProjectParamsError()

    const safeTxGas = await simulateTxService.estimateSafeTxGasWithSimulate(
      this.getAddress(),
      this.provider,
      safeTxData,
      this.projectParams.multisendContractAddress,
      this.projectParams.singletonAddress,
      this.projectParams.simulateTxAcessorAddress
    )

    let gasPrice: BigNumber

    if (this.gasToken && this.gasToken !== constants.AddressZero) {
      gasPrice = await gasService.getGasPriceForToken(this.gasToken, this.API)
    } else {
      gasPrice = await gasService.getGasPrice(
        this.provider,
        this.REWARD_PERCENTILE
      )
    }

    const totalGasCost = await gasService.getTotalCost(
      safeTxGas,
      this.BASE_GAS,
      gasPrice
    )

    const txValue = BigNumber.from(
      isMetaTransactionArray(safeTxData)
        ? await safeService.getTransactionsTotalValue(safeTxData)
        : safeTxData.value
    )

    return {
      safeTxGas,
      gasPrice,
      totalGasCost,
      txValue
    }
  }

  public async verifyHasEnoughBalance(totalGasCost, txValue): Promise<void> {
    return await gasService.verifyHasEnoughBalance(
      this.provider,
      this.getAddress(),
      totalGasCost,
      txValue,
      this.gasToken
    )
  }

  public async buildTransaction(
    safeTxData: MetaTransaction | MetaTransaction[],
    delayModuleAddress?: string
  ): Promise<SafeTransactionDataPartial> {
    if (!this.projectParams) throw new ProjectParamsError()

    let safeTxDataTyped
    let isSponsoredTransaction: boolean

    if (isMetaTransactionArray(safeTxData)) {
      isSponsoredTransaction = await this._isSponsoredTransaction(
        safeTxData,
        delayModuleAddress
      )

      const multisendData = encodeMulti(
        safeTxData,
        this.projectParams.multisendContractAddress
      ).data

      safeTxDataTyped = {
        ...(await this._formatTransaction(
          this.projectParams.multisendContractAddress,
          '0',
          multisendData,
          1
        ))
      }
    } else {
      safeTxDataTyped = {
        ...(await this._formatTransaction(
          safeTxData.to,
          safeTxData.value,
          safeTxData.data
        ))
      }
      isSponsoredTransaction = await this._isSponsoredTransaction(
        [safeTxDataTyped],
        delayModuleAddress
      )
    }

    if (!isSponsoredTransaction) {
      const { safeTxGas, gasPrice, totalGasCost, txValue } =
        await this.estimateTxGasAndValue(safeTxData)

      await this.verifyHasEnoughBalance(totalGasCost, txValue)

      if (this.uiConfig.displayValidationModal) {
        await this.displayModal(totalGasCost, txValue)
      }

      safeTxDataTyped.safeTxGas = +safeTxGas
      safeTxDataTyped.baseGas = this.BASE_GAS
      safeTxDataTyped.gasPrice = +gasPrice
      safeTxDataTyped.gasToken = this.gasToken ?? constants.AddressZero
    }

    return safeTxDataTyped
  }

  async getRecoveryRequest(
    proxyDelayAddress?: string
  ): Promise<RecoveryRequest | undefined> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    if (
      proxyDelayAddress &&
      !(await safeService.isModuleEnabled(
        this.getAddress(),
        this.provider,
        proxyDelayAddress
      ))
    )
      throw new DelayModuleAddressError()

    const effectiveProxyDelayAddress =
      proxyDelayAddress ?? this.walletInfos.proxyDelayAddress
    if (!effectiveProxyDelayAddress) throw new NewRecoveryNotSupportedError()

    try {
      const isRecoveryQueueEmpty = await delayModuleService.isQueueEmpty(
        effectiveProxyDelayAddress,
        this.provider
      )

      if (isRecoveryQueueEmpty) {
        return undefined
      } else {
        return await delayModuleService.getCurrentRecoveryParams(
          effectiveProxyDelayAddress,
          this.provider
        )
      }
    } catch {
      throw new GetRecoveryError()
    }
  }

  async cancelRecoveryRequest(
    delayModuleAddress?: string
  ): Promise<SendTransactionResponse> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    if (
      delayModuleAddress &&
      !(await safeService.isModuleEnabled(
        this.getAddress(),
        this.provider,
        delayModuleAddress
      ))
    )
      throw new DelayModuleAddressError()

    const effectiveProxyDelayAddress =
      delayModuleAddress ?? this.walletInfos.proxyDelayAddress
    if (!effectiveProxyDelayAddress) throw new NewRecoveryNotSupportedError()

    const recoveryRequest = await this.getRecoveryRequest(
      effectiveProxyDelayAddress
    )
    if (!recoveryRequest) throw new NoRecoveryRequestFoundError()

    try {
      const tx = await delayModuleService.createSetTxNonceFunction(
        effectiveProxyDelayAddress,
        this.provider
      )

      return await this.sendTransaction(tx, effectiveProxyDelayAddress)
    } catch {
      throw new CancelRecoveryError()
    }
  }

  async getCurrentRecoveryParams(
    delayModuleAddress?: string
  ): Promise<RecoveryParamsResponse> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    if (
      delayModuleAddress &&
      !(await safeService.isModuleEnabled(
        this.getAddress(),
        this.provider,
        delayModuleAddress
      ))
    )
      throw new DelayModuleAddressError()

    const effectiveProxyDelayAddress =
      delayModuleAddress ?? this.walletInfos.proxyDelayAddress
    if (!effectiveProxyDelayAddress) throw new NewRecoveryNotSupportedError()

    return await delayModuleService.getCurrentRecoveryParams(
      effectiveProxyDelayAddress,
      this.provider
    )
  }

  async setUpRecovery(): Promise<SendTransactionResponse> {
    if (!this.projectParams) throw new ProjectParamsError()

    const { guardianId, deploymentManagerAddress } = this.projectParams

    const guardianAddress = await deploymentManagerService.getGuardian({
      guardianId,
      deploymentManagerAddress,
      provider: this.provider
    })

    return await this.setupDelayModule(guardianAddress)
  }

  async setupDelayModule(
    guardianAddress: string,
    expiration?: number,
    cooldown?: number
  ): Promise<SendTransactionResponse> {
    if (!this.walletInfos) throw new WalletNotConnectedError()
    if (!this.projectParams) throw new ProjectParamsError()

    const walletAddress = this.walletInfos.address

    expiration ??= this.projectParams.recoveryExpiration
    cooldown ??= this.projectParams.recoveryCooldown

    const { delayModuleAddress, moduleFactoryAddress } = this.projectParams

    const delayAddress = await delayModuleService.getDelayAddress(
      walletAddress,
      {
        moduleFactoryAddress,
        delayModuleAddress,
        recoveryCooldown: cooldown,
        recoveryExpiration: expiration
      }
    )

    this.walletInfos.proxyDelayAddress = delayAddress

    const isDeployed = await delayModuleService.isDeployed({
      delayAddress,
      provider: this.provider
    })

    if (isDeployed) throw new RecoveryAlreadySetUp()

    try {
      const delayModuleInitializer = await delayModuleService.setUpDelayModule({
        safe: walletAddress,
        cooldown,
        expiration
      })

      const setUpDelayTx = [
        {
          to: moduleFactoryAddress,
          value: '0',
          data: await delayModuleService.encodeDeployDelayModule({
            singletonDelayModule: delayModuleAddress,
            initializer: delayModuleInitializer,
            safe: walletAddress
          })
        },
        {
          to: walletAddress,
          value: '0',
          data: await safeService.encodeEnableModule(delayAddress)
        },
        {
          to: delayAddress,
          value: '0',
          data: await delayModuleService.encodeEnableModule(guardianAddress)
        }
      ]

      return await this.sendBatchTransactions(setUpDelayTx, delayAddress)
    } catch (error) {
      console.error('Error setting up delay module:', error)
      throw new SetupDelayModuleError()
    }
  }

  async getDelayModuleAddressFor(
    expiration: number,
    cooldown: number
  ): Promise<string> {
    if (!this.walletInfos) throw new WalletNotConnectedError()
    if (!this.projectParams) throw new ProjectParamsError()

    const { delayModuleAddress, moduleFactoryAddress } = this.projectParams

    const walletAddress = this.walletInfos.address

    const delayAddress = await delayModuleService.getDelayAddress(
      walletAddress,
      {
        moduleFactoryAddress,
        delayModuleAddress,
        recoveryCooldown: cooldown,
        recoveryExpiration: expiration
      }
    )

    return delayAddress
  }

  async getGuardianAddress(delayModuleAddress: string): Promise<string> {
    if (!this.walletInfos) throw new WalletNotConnectedError()
    const walletAddress = this.walletInfos.address

    if (
      delayModuleAddress &&
      !(await safeService.isModuleEnabled(
        walletAddress,
        this.provider,
        delayModuleAddress
      ))
    )
      throw new DelayModuleAddressError()

    return await delayModuleService.getGuardianAddress(
      delayModuleAddress,
      this.provider
    )
  }

  async addGuardian(
    delayModuleAddress: string,
    guardianAddress: string
  ): Promise<SendTransactionResponse> {
    if (!this.walletInfos) throw new WalletNotConnectedError()

    const walletAddress = this.walletInfos.address

    if (!isAddress(guardianAddress)) {
      throw new InvalidAddressFormatError()
    }

    if (
      delayModuleAddress &&
      !(await safeService.isModuleEnabled(
        walletAddress,
        this.provider,
        delayModuleAddress
      ))
    )
      throw new DelayModuleAddressError()

    if (
      await delayModuleService.getGuardianAddress(
        delayModuleAddress,
        this.provider
      )
    )
      throw new GuardianAlreadyEnabledError()

    this.walletInfos.proxyDelayAddress = delayModuleAddress

    try {
      const addGuardianTx = {
        to: delayModuleAddress,
        value: '0',
        data: await delayModuleService.encodeEnableModule(guardianAddress)
      }

      return await this.sendTransaction(addGuardianTx, delayModuleAddress)
    } catch {
      throw new AddGuardianError()
    }
  }

  async disableGuardian(
    guardianAddress: string,
    expiration?: number,
    cooldown?: number
  ): Promise<SendTransactionResponse> {
    if (!this.walletInfos) throw new WalletNotConnectedError()
    if (!this.projectParams) throw new ProjectParamsError()

    const walletAddress = this.walletInfos.address

    expiration ??= this.projectParams.recoveryExpiration
    cooldown ??= this.projectParams.recoveryCooldown

    const { delayModuleAddress, moduleFactoryAddress } = this.projectParams

    const delayAddress = await delayModuleService.getDelayAddress(
      walletAddress,
      {
        moduleFactoryAddress,
        delayModuleAddress,
        recoveryCooldown: cooldown,
        recoveryExpiration: expiration
      }
    )

    if (
      delayAddress &&
      !(await safeService.isModuleEnabled(
        walletAddress,
        this.provider,
        delayAddress
      ))
    )
      throw new DelayModuleAddressError()

    this.walletInfos.proxyDelayAddress = delayAddress

    const prevModuleAddress = await delayModuleService.findPrevModule(
      delayAddress,
      guardianAddress,
      this.provider
    )

    if (!prevModuleAddress) {
      throw new Error('Previous module not found')
    }

    try {
      const disableGuardianTx = {
        to: delayAddress,
        value: '0',
        data: await delayModuleService.encodeDisableModule(
          prevModuleAddress,
          guardianAddress
        )
      }

      return await this.sendTransaction(disableGuardianTx, delayAddress)
    } catch {
      throw new DisableGuardianError()
    }
  }
}
