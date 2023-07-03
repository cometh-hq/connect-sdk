import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'

import { networks } from '../../constants'
import { API } from '../../services'
import safeService from '../../services/safeService'
import siweService from '../../services/siweService'
import webAuthnService from '../../services/webAuthnService'
import { parseHex } from '../../utils/utils'
import { WebAuthnSigner } from '../signers/WebAuthnSigner'
import { UserInfos, WebAuthnOwner } from '../types'
import { AUTHAdapter } from './types'

export class WebAuthnAdaptor implements AUTHAdapter {
  private signer?: WebAuthnSigner
  readonly chainId: string
  private API: API
  private provider: StaticJsonRpcProvider
  constructor(chainId: string, apiKey: string, rpcUrl?: string) {
    this.chainId = chainId
    this.API = new API(apiKey, +chainId)
    this.provider = new StaticJsonRpcProvider(
      rpcUrl ? rpcUrl : networks[+this.chainId].RPCUrl
    )
  }

  async connect(userId: string): Promise<void> {
    if (!userId) throw new Error('no userId found')

    const webAuthnOwners = await this.API.getWebAuthnOwnersByUserId(userId)

    if (webAuthnOwners.length !== 0) {
      const nonce = await this.API.getNonce(webAuthnOwners[0].walletAddress)
      const message: SiweMessage = siweService.createMessage(
        webAuthnOwners[0].walletAddress,
        nonce,
        +this.chainId
      )
      const { currentWebAuthnOwner, signature } = await this.signWithWebAuthn(
        webAuthnOwners,
        message.prepareMessage()
      )

      await this.API.connectToAlembicWallet({
        message,
        signature,
        walletAddress: webAuthnOwners[0].walletAddress,
        userId
      })

      this.signer = new WebAuthnSigner(
        currentWebAuthnOwner.publicKeyId,
        currentWebAuthnOwner.signerAddress
      )
    } else {
      const { publicKeyId, predictedSignerAddress } =
        await this.createWalletWithWebAuthn(userId)

      this.signer = new WebAuthnSigner(publicKeyId, predictedSignerAddress)
    }
  }

  async logout(): Promise<void> {
    if (!this.signer) throw new Error('No signer instance found')
    this.signer = undefined
  }

  async getAccount(): Promise<string> {
    if (!this.signer) throw new Error('No signer found')
    return this.signer.getAddress()
  }

  getSigner(): WebAuthnSigner {
    if (!this.signer) throw new Error('No signer found')
    return this.signer
  }

  async getUserInfos(): Promise<Partial<UserInfos>> {
    return { walletAddress: await this.getAccount() } ?? {}
  }

  private async signWithWebAuthn(
    webAuthnOwners: WebAuthnOwner[],
    challenge: string
  ): Promise<{
    currentWebAuthnOwner: WebAuthnOwner
    signature: string
  }> {
    const publicKeyCredentials: PublicKeyCredentialDescriptor[] =
      webAuthnOwners.map((webAuthnOwner) => {
        return {
          id: parseHex(webAuthnOwner.publicKeyId),
          type: 'public-key'
        }
      })

    const { encodedSignature, publicKeyId } =
      await webAuthnService.getWebAuthnSignature(
        ethers.utils.keccak256(ethers.utils.hashMessage(challenge)),
        publicKeyCredentials
      )

    const currentWebAuthnOwner = await this.getCurrentWebAuthnOwner(publicKeyId)

    if (!currentWebAuthnOwner) throw new Error('WebAuthn is undefined')

    const formattedSignature = safeService.formatWebAuthnSignatureForSafe(
      currentWebAuthnOwner.signerAddress,
      encodedSignature
    )

    return { currentWebAuthnOwner, signature: formattedSignature }
  }

  private async createWalletWithWebAuthn(
    userId: string
  ): Promise<{ publicKeyId: string; predictedSignerAddress: string }> {
    const signerName = `${userId} - 1`
    const webAuthnCredentials = await webAuthnService.createCredential(
      signerName
    )

    const publicKeyX = `0x${webAuthnCredentials.point.getX().toString(16)}`
    const publicKeyY = `0x${webAuthnCredentials.point.getY().toString(16)}`
    const publicKeyId = webAuthnCredentials.id

    const predictedSignerAddress = await webAuthnService.predictSignerAddress(
      publicKeyX,
      publicKeyY,
      +this.chainId
    )
    const walletAddress = await this.API.getWalletAddress(
      predictedSignerAddress
    )

    await this.API.createWalletWithWebAuthn({
      walletAddress,
      signerName,
      publicKeyId,
      publicKeyX,
      publicKeyY,
      userId
    })

    await webAuthnService.waitWebAuthnSignerDeployment(
      publicKeyX,
      publicKeyY,
      +this.chainId,
      this.provider
    )

    return { publicKeyId, predictedSignerAddress }
  }

  public async getCurrentWebAuthnOwner(
    publicKeyId: string
  ): Promise<WebAuthnOwner | undefined> {
    const currentWebAuthnOwner = await this.API.getWebAuthnOwnerByPublicKeyId(
      <string>publicKeyId
    )

    if (currentWebAuthnOwner === null) return undefined

    const isSafeOwner = await safeService.isSafeOwner(
      currentWebAuthnOwner.walletAddress,
      currentWebAuthnOwner.signerAddress,
      this.provider
    )

    if (!isSafeOwner) return undefined

    return currentWebAuthnOwner
  }
}
