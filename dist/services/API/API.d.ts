import { SiweMessage } from 'siwe'

import { OwnerAddress, UserNonceType, WalletAddress } from '../../types'

export declare class API {
  static getNonce(account: string): Promise<UserNonceType | null>
  static connectToAlembicWallet({
    message,
    signature,
    ownerAddress
  }: {
    message: SiweMessage
    signature: string
    ownerAddress: OwnerAddress
  }): Promise<WalletAddress | null>
}
