import type { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'

import type {
  SafeProxyFactory,
  SafeProxyFactoryInterface
} from '../SafeProxyFactory'
export declare class SafeProxyFactory__factory {
  static readonly abi: readonly [
    {
      readonly anonymous: false
      readonly inputs: readonly [
        {
          readonly indexed: false
          readonly internalType: 'contract GnosisSafeProxy'
          readonly name: 'proxy'
          readonly type: 'address'
        },
        {
          readonly indexed: false
          readonly internalType: 'address'
          readonly name: 'singleton'
          readonly type: 'address'
        }
      ]
      readonly name: 'ProxyCreation'
      readonly type: 'event'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'address'
          readonly name: '_singleton'
          readonly type: 'address'
        },
        {
          readonly internalType: 'bytes'
          readonly name: 'initializer'
          readonly type: 'bytes'
        },
        {
          readonly internalType: 'uint256'
          readonly name: 'saltNonce'
          readonly type: 'uint256'
        }
      ]
      readonly name: 'calculateCreateProxyWithNonceAddress'
      readonly outputs: readonly [
        {
          readonly internalType: 'contract GnosisSafeProxy'
          readonly name: 'proxy'
          readonly type: 'address'
        }
      ]
      readonly stateMutability: 'nonpayable'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'address'
          readonly name: 'singleton'
          readonly type: 'address'
        },
        {
          readonly internalType: 'bytes'
          readonly name: 'data'
          readonly type: 'bytes'
        }
      ]
      readonly name: 'createProxy'
      readonly outputs: readonly [
        {
          readonly internalType: 'contract GnosisSafeProxy'
          readonly name: 'proxy'
          readonly type: 'address'
        }
      ]
      readonly stateMutability: 'nonpayable'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'address'
          readonly name: '_singleton'
          readonly type: 'address'
        },
        {
          readonly internalType: 'bytes'
          readonly name: 'initializer'
          readonly type: 'bytes'
        },
        {
          readonly internalType: 'uint256'
          readonly name: 'saltNonce'
          readonly type: 'uint256'
        },
        {
          readonly internalType: 'contract IProxyCreationCallback'
          readonly name: 'callback'
          readonly type: 'address'
        }
      ]
      readonly name: 'createProxyWithCallback'
      readonly outputs: readonly [
        {
          readonly internalType: 'contract GnosisSafeProxy'
          readonly name: 'proxy'
          readonly type: 'address'
        }
      ]
      readonly stateMutability: 'nonpayable'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly [
        {
          readonly internalType: 'address'
          readonly name: '_singleton'
          readonly type: 'address'
        },
        {
          readonly internalType: 'bytes'
          readonly name: 'initializer'
          readonly type: 'bytes'
        },
        {
          readonly internalType: 'uint256'
          readonly name: 'saltNonce'
          readonly type: 'uint256'
        }
      ]
      readonly name: 'createProxyWithNonce'
      readonly outputs: readonly [
        {
          readonly internalType: 'contract GnosisSafeProxy'
          readonly name: 'proxy'
          readonly type: 'address'
        }
      ]
      readonly stateMutability: 'nonpayable'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly []
      readonly name: 'proxyCreationCode'
      readonly outputs: readonly [
        {
          readonly internalType: 'bytes'
          readonly name: ''
          readonly type: 'bytes'
        }
      ]
      readonly stateMutability: 'pure'
      readonly type: 'function'
    },
    {
      readonly inputs: readonly []
      readonly name: 'proxyRuntimeCode'
      readonly outputs: readonly [
        {
          readonly internalType: 'bytes'
          readonly name: ''
          readonly type: 'bytes'
        }
      ]
      readonly stateMutability: 'pure'
      readonly type: 'function'
    }
  ]
  static createInterface(): SafeProxyFactoryInterface
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SafeProxyFactory
}
