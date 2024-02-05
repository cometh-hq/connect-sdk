import { JsonRpcSigner, StaticJsonRpcProvider } from '@ethersproject/providers'
import { BigNumber, Bytes, constants, Wallet } from 'ethers'
import { formatEther, hashMessage, parseUnits } from 'ethers/lib/utils'
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
import gasService from '../services/gasService'
import safeService from '../services/safeService'
import simulateTxService from '../services/simulateTxService'
import { GasModal } from '../ui'
import {
  isDefaultSponsorisedFunction,
  isMetaTransactionArray
} from '../utils/utils'
import { AUTHAdapter } from './adapters'
import { WebAuthnSigner } from './signers/WebAuthnSigner'
import {
  MetaTransactionData,
  ProjectParams,
  RecoveryRequest,
  SafeTransactionDataPartial,
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
  private projectParams?: ProjectParams
  private uiConfig: UIConfig

  constructor({
    authAdapter,
    apiKey,
    rpcUrl,
    baseUrl,
    uiConfig = {
      displayValidationModal: true
    }
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
  }

  /**
   * Connection Section
   */

  public async connect(walletAddress?: string): Promise<void> {
    if (!networks[this.chainId])
      throw new Error('This network is not supported')

    if (!this.authAdapter) throw new Error('No EOA adapter found')
    await this.authAdapter.connect(walletAddress)

    this.projectParams = await this.API.getProjectParams()
    this.signer = this.authAdapter.getSigner()
    this.walletAddress = this.authAdapter.getWalletAddress()

    if (!this.signer) throw new Error('No signer found')
    if (!this.walletAddress) throw new Error('No walletAddress found')

    if (this.signer instanceof Wallet)
      this.BASE_GAS = DEFAULT_BASE_GAS_LOCAL_WALLET

    this.sponsoredAddresses = await this.API.getSponsoredAddresses()
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
    if (!this.walletAddress) throw new Error('Wallet is not connected')

    return await safeService.getOwners(this.walletAddress, this.provider)
  }

  /**
   * Signing Message Section
   */

  public async signMessage(messageToSign: string | Bytes): Promise<string> {
    if (typeof messageToSign === 'string') {
      messageToSign = hashMessage(messageToSign)
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
        gasToken: constants.AddressZero,
        refundReceiver: constants.AddressZero,
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
      const functionSelector = safeService.getFunctionSelector(
        safeTransactionData[i]
      )

      const sponsoredAddress = this.sponsoredAddresses?.find(
        (sponsoredAddress) =>
          sponsoredAddress.targetAddress.toLowerCase() ===
          safeTransactionData[i].to.toLowerCase()
      )

      if (!sponsoredAddress && !isDefaultSponsorisedFunction(functionSelector))
        return false
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
    safeTxData: MetaTransaction
  ): Promise<SendTransactionResponse> {
    const safeTxDataTyped = await this.buildTransaction(safeTxData)

    const safeTxHash = await this._signAndSendTransaction(safeTxDataTyped)

    return { safeTxHash }
  }

  public async sendBatchTransactions(
    safeTxData: MetaTransaction[]
  ): Promise<SendTransactionResponse> {
    if (safeTxData.length === 0) {
      throw new Error('Empty array provided, no transaction to send')
    }
    const safeTxDataTyped = await this.buildTransaction(safeTxData)

    const safeTxHash = await this._signAndSendTransaction(safeTxDataTyped)

    return { safeTxHash }
  }

  public async displayModal(
    totalGasCost: BigNumber,
    txValue: BigNumber
  ): Promise<void> {
    const walletBalance = await this.provider.getBalance(this.getAddress())

    const totalCost = totalGasCost.add(txValue)

    const displayedTotalBalance = (+formatEther(
      parseUnits(walletBalance.toString(), 'wei')
    )).toFixed(3)

    const displayedTotalCost = (+formatEther(
      parseUnits(totalCost.toString(), 'wei')
    )).toFixed(3)

    if (
      !(await new GasModal().initModal(
        displayedTotalBalance,
        displayedTotalCost,
        networks[this.chainId].currency
      ))
    ) {
      throw new Error('Transaction denied')
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
      // Avoid a GS013 error if failure https://github.com/safe-global/safe-smart-account/blob/767ef36bba88bdbc0c9fe3708a4290cabef4c376/contracts/GnosisSafe.sol#L180
      safeTxGas: 10,
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
    if (!this.projectParams) throw new Error('Project params are null')

    const safeTxGas = await simulateTxService.estimateSafeTxGasWithSimulate(
      this.getAddress(),
      this.provider,
      safeTxData,
      this.projectParams.multisendContractAddress,
      this.projectParams.singletonAddress,
      this.projectParams.simulateTxAcessorAddress
    )

    const gasPrice = await gasService.getGasPrice(
      this.provider,
      this.REWARD_PERCENTILE
    )

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
      txValue
    )
  }

  public async buildTransaction(
    safeTxData: MetaTransaction | MetaTransaction[]
  ): Promise<SafeTransactionDataPartial> {
    if (!this.projectParams) throw new Error('Project params are null')

    let safeTxDataTyped
    let isSponsoredTransaction: boolean

    if (isMetaTransactionArray(safeTxData)) {
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
      isSponsoredTransaction = await this._isSponsoredTransaction(
        safeTxDataTyped
      )
    } else {
      safeTxDataTyped = {
        ...(await this._formatTransaction(
          safeTxData.to,
          safeTxData.value,
          safeTxData.data
        ))
      }
      isSponsoredTransaction = await this._isSponsoredTransaction([
        safeTxDataTyped
      ])
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
    }
    return safeTxDataTyped
  }

  async getRecoveryRequest(): Promise<RecoveryRequest | undefined> {
    if (!this.walletAddress) throw new Error('Wallet is not connected')

    const walletInfos = await this.API.getWalletInfos(this.walletAddress)
    if (!walletInfos.recoveryContext)
      throw new Error('No recovery parameters found')

    const isDeployed = await safeService.isDeployed(
      this.walletAddress,
      this.provider
    )
    if (!isDeployed) throw new Error('Wallet is not deployed yet')

    try {
      const isRecoveryQueueEmpty = await delayModuleService.isQueueEmpty(
        walletInfos.proxyDelayAddress,
        this.provider
      )

      if (isRecoveryQueueEmpty) {
        return undefined
      } else {
        return await delayModuleService.getCurrentRecoveryParams(
          walletInfos.proxyDelayAddress,
          this.provider
        )
      }
    } catch {
      throw new Error('Failed to get recovery request')
    }
  }

  async cancelRecoveryRequest(): Promise<SendTransactionResponse> {
    if (!this.walletAddress) throw new Error('Wallet is not connected')

    const walletInfos = await this.API.getWalletInfos(this.walletAddress)
    if (!walletInfos.recoveryContext)
      throw new Error('No recovery parameters found')

    const recoveryRequest = await this.getRecoveryRequest()
    if (!recoveryRequest) throw new Error('No recovery request found')

    try {
      const tx = await delayModuleService.createSetTxNonceFunction(
        walletInfos.proxyDelayAddress,
        this.provider
      )

      return await this.sendTransaction(tx)
    } catch {
      throw new Error('Failed to cancel recovery request')
    }
  }
}
