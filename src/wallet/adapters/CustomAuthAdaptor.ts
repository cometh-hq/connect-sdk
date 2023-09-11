import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers, Wallet } from 'ethers'

import { networks } from '../../constants'
import { API } from '../../services'
import burnerWalletService from '../../services/burnerWalletService'
import deviceService from '../../services/deviceService'
import tokenService from '../../services/tokenService'
import webAuthnService from '../../services/webAuthnService'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import { NewSignerRequest, NewSignerRequestType, UserInfos } from '../types'
import { AUTHAdapter } from './types'

export class CustomAuthAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner | Wallet
  readonly chainId: string
  private API: API
  private jwtToken: string
  private provider: StaticJsonRpcProvider

  constructor(
    chainId: string,
    jwtToken: string,
    apiKey: string,
    rpcUrl?: string,
    baseUrl?: string
  ) {
    this.chainId = chainId
    this.jwtToken = jwtToken
    this.API = new API(apiKey, +chainId, baseUrl)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    await this.initSigner(
      await webAuthnService.isWebAuthnCompatible(),
      walletAddress
    )

    if (!walletAddress) {
      const ownerAddress = await this.getAccount()
      if (!ownerAddress) throw new Error('No owner address found')
      await this.API.initWalletForUserID({ token: this.jwtToken, ownerAddress })
    }
  }

  async initSigner(
    isWebAuthnCompatible: boolean,
    walletAddress?: string
  ): Promise<void> {
    if (!isWebAuthnCompatible) {
      try {
        this.signer = await burnerWalletService.getSigner(
          this.jwtToken,
          walletAddress
        )
      } catch (err) {
        console.log(err)
        return
      }
    } else {
      try {
        const { publicKeyId, signerAddress } =
          await webAuthnService.createOrGetWebAuthnOwner(
            this.jwtToken,
            this.chainId,
            this.provider,
            this.API,
            walletAddress
          )
        this.signer = new WebAuthnSigner(publicKeyId, signerAddress)
      } catch (err) {
        console.log(err)
        return
      }
    }
  }

  public async createNewSignerRequest(): Promise<void> {
    const walletAddress = await this.API.getWalletAddressFromUserID(
      this.jwtToken
    )

    let addNewSignerRequest

    if (await webAuthnService.isWebAuthnCompatible()) {
      const { publicKeyX, publicKeyY, publicKeyId, signerAddress, deviceData } =
        await webAuthnService.createWebAuthnSigner(+this.chainId)

      addNewSignerRequest = {
        token: this.jwtToken,
        walletAddress,
        signerAddress,
        deviceData,
        type: NewSignerRequestType.WEBAUTHN,
        publicKeyId,
        publicKeyX,
        publicKeyY
      }
    } else {
      const decodedToken = tokenService.decodeToken(this.jwtToken)
      const userId = decodedToken?.payload.sub
      this.signer = ethers.Wallet.createRandom()
      window.localStorage.setItem(
        `cometh-connect-${userId}`,
        this.signer.privateKey
      )

      addNewSignerRequest = {
        token: this.jwtToken,
        walletAddress,
        signerAddress: this.signer?.address,
        deviceData: deviceService.getDeviceData(),
        type: NewSignerRequestType.BURNER_WALLET
      }
    }

    await this.API.createNewSignerRequest(addNewSignerRequest)
  }

  public async getNewSignerRequestByUser(): Promise<NewSignerRequest[] | null> {
    return await this.API.getNewSignerRequestByUser(this.jwtToken)
  }

  public async deleteNewSignerRequest(signerAddress: string): Promise<void> {
    return await this.API.deleteNewSignerRequest({
      token: this.jwtToken,
      signerAddress
    })
  }

  public async deployWebAuthnSigner(
    newSignerRequest: NewSignerRequest
  ): Promise<string> {
    return await this.API.deployWebAuthnSigner({
      token: this.jwtToken,
      walletAddress: newSignerRequest.walletAddress,
      publicKeyId: newSignerRequest.publicKeyId!,
      publicKeyX: newSignerRequest.publicKeyX!,
      publicKeyY: newSignerRequest.publicKeyY!,
      deviceData: newSignerRequest.deviceData
    })
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No Wallet instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No Wallet instance found')
    return this.signer.getAddress()
  }

  getSigner(): Wallet | WebAuthnSigner {
    if (!this.signer) throw new Error('No Wallet instance found')
    return this.signer
  }

  async getWalletAddress(): Promise<string> {
    return await this.API.getWalletAddressFromUserID(this.jwtToken)
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }
}
