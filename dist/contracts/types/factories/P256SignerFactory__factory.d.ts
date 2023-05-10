import type { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'

import type {
  P256SignerFactory,
  P256SignerFactoryInterface
} from '../P256SignerFactory'
export declare class P256SignerFactory__factory {
  static readonly abi: readonly [
    {
      readonly anonymous: false
      readonly inputs: readonly [
        {
          readonly indexed: true
          readonly internalType: 'uint256'
          readonly name: 'x'
          readonly type: 'uint256'
        },
        {
          readonly indexed: true
          readonly internalType: 'uint256'
          readonly name: 'y'
          readonly type: 'uint256'
        },
        {
          readonly indexed: false
          readonly internalType: 'address'
          readonly name: 'signer'
          readonly type: 'address'
        }
      ]
      readonly name: 'NewSignerCreated'
      readonly type: 'event'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'uint256'
          readonly name: 'x'
          readonly type: 'uint256'
        },
        {
          readonly internalType: 'uint256'
          readonly name: 'y'
          readonly type: 'uint256'
        }
      ]
      readonly name: 'create'
      readonly outputs: readonly []
      readonly stateMutability: 'nonpayable'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'uint256'
          readonly name: 'x'
          readonly type: 'uint256'
        },
        {
          readonly internalType: 'uint256'
          readonly name: 'y'
          readonly type: 'uint256'
        }
      ]
      readonly name: 'getAddressFor'
      readonly outputs: readonly [
        {
          readonly internalType: 'address'
          readonly name: 'signer'
          readonly type: 'address'
        }
      ]
      readonly stateMutability: 'view'
      readonly type: 'function'
    }
  ]
  static createInterface(): P256SignerFactoryInterface
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): P256SignerFactory
}
