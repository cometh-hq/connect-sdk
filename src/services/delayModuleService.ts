import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Contract, utils } from 'ethers'
import { MetaTransaction } from 'ethers-multisend'

import delayModuleABI from '../contracts/abis/Delay.json'
import safeService from './safeService'

const DelayModule = new utils.Interface(delayModuleABI)

export type DelayContext = {
  delayModuleAddress: string
  moduleFactoryAddress: string
  recoveryCooldown: number
  recoveryExpiration: number
}

export const getDelayAddress = async (
  safe: string,
  provider: StaticJsonRpcProvider,
  context: DelayContext
): Promise<string> => {
  const nonce = await safeService.getNonce(safe, provider)
  const cooldown = context.recoveryCooldown
  const expiration = context.recoveryExpiration
  const delayModuleAddress = context.delayModuleAddress
  const factoryAddress = context.moduleFactoryAddress

  const args = utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'uint256', 'uint256'],
    [safe, safe, safe, cooldown, expiration]
  )
  const initializer = DelayModule.encodeFunctionData('setUp', [args])

  const code = `0x602d8060093d393df3363d3d373d3d3d363d73${delayModuleAddress.slice(
    2
  )}5af43d82803e903d91602b57fd5bf3`

  const salt = utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [utils.keccak256(initializer), nonce]
  )

  return Promise.resolve(
    utils.getCreate2Address(factoryAddress, salt, utils.keccak256(code))
  )
}

export const formatSetTxNonceFunction = async (
  safe: string,
  proxyDelayAddress: string,
  provider: StaticJsonRpcProvider
): Promise<MetaTransaction> => {
  const proxyDelayContract = new Contract(
    proxyDelayAddress,
    delayModuleABI,
    provider
  )

  const txNonce = (await proxyDelayContract.txNonce()) as number

  return {
    to: safe,
    value: '0x0',
    data: DelayModule.encodeFunctionData('setTxNonce', [txNonce + 1]),
    operation: 0
  }
}

export default {
  getDelayAddress,
  formatSetTxNonceFunction
}
