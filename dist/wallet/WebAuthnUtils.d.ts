import { Web3Provider } from '@ethersproject/providers'

import { AlembicProvider } from './AlembicProvider'
declare const _default: {
  createCredentials: (userId: string) => Promise<any>
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
    provider: Web3Provider | AlembicProvider
  ) => Promise<string>
}
export default _default
