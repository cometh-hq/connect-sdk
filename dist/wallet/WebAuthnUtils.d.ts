import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { AlembicProvider } from './AlembicProvider'
declare const _default: {
  getCurrentPublicKeyId: () => string | null
  createCredentials: (signerName: string) => Promise<any>
  updateCurrentWebAuthnOwner: (
    publicKeyId: string,
    publicKeyX: string,
    publicKeyY: string
  ) => void
  getWebAuthnSignature: (hash: string, publicKey_Id: string) => Promise<string>
  predictSignerAddress: (
    publicKey_X: string,
    publicKey_Y: string,
    chainId: number
  ) => Promise<string>
  waitWebAuthnSignerDeployment: (
    publicKey_X: string,
    publicKey_Y: string,
    chainId: number,
    provider: StaticJsonRpcProvider | AlembicProvider
  ) => Promise<string>
}
export default _default
