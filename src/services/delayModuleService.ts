import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { Contract, ethers, utils } from 'ethers'
import { _TypedDataEncoder, getAddress, hexZeroPad } from 'ethers/lib/utils'
import { MetaTransaction } from 'ethers-multisend'

import { SAFE_SENTINEL_OWNERS } from '../constants'
import delayModuleABI from '../contracts/abis/Delay.json'
import delayModuleFactoryABI from '../contracts/abis/DelayFactory.json'
import { AddressNotGuardianError } from '../wallet/errors'
import { RecoveryParamsResponse } from '../wallet/types'

const DelayModule = new utils.Interface(delayModuleABI)
const DelayModuleFactory = new utils.Interface(delayModuleFactoryABI)
const SENTINEL = hexZeroPad(SAFE_SENTINEL_OWNERS, 20)

export type DelayContext = {
  delayModuleAddress: string
  moduleFactoryAddress: string
  recoveryCooldown: number
  recoveryExpiration: number
}

const isDeployed = async ({
  delayAddress,
  provider
}: {
  delayAddress: string
  provider: StaticJsonRpcProvider
}): Promise<boolean> => {
  const delay = new Contract(delayAddress, delayModuleABI, provider)

  try {
    await delay.deployed()
    return true
  } catch (error) {
    return false
  }
}

const getDelayAddress = (
  safe: string,
  context: DelayContext
): Promise<string> => {
  const cooldown = context.recoveryCooldown
  const expiration = context.recoveryExpiration
  const moduleAddress = context.delayModuleAddress
  const factoryAddress = context.moduleFactoryAddress

  const args = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'uint256', 'uint256'],
    [safe, safe, safe, cooldown, expiration]
  )
  const initializer = DelayModule.encodeFunctionData('setUp', [args])

  const code = `0x602d8060093d393df3363d3d373d3d3d363d73${moduleAddress.slice(
    2
  )}5af43d82803e903d91602b57fd5bf3`

  const salt = ethers.utils.solidityKeccak256(
    ['bytes32', 'uint256'],
    [ethers.utils.keccak256(initializer), safe]
  )

  return Promise.resolve(
    ethers.utils.getCreate2Address(
      factoryAddress,
      salt,
      ethers.utils.keccak256(code)
    )
  )
}

const createSetTxNonceFunction = async (
  proxyDelayAddress: string,
  provider: StaticJsonRpcProvider
): Promise<MetaTransaction> => {
  const proxyDelayContract = new Contract(
    proxyDelayAddress,
    delayModuleABI,
    provider
  )

  const txNonce = await (await proxyDelayContract.txNonce()).toString()

  const newNonce = Number(txNonce) + 1

  return {
    to: proxyDelayAddress,
    value: '0x0',
    data: DelayModule.encodeFunctionData('setTxNonce', [newNonce]),
    operation: 0
  }
}

const getCurrentRecoveryParams = async (
  delayModuleAddress: string,
  provider: StaticJsonRpcProvider
): Promise<RecoveryParamsResponse> => {
  const contract = new Contract(delayModuleAddress, delayModuleABI, provider)

  const txNonce = await contract.txNonce()

  const [txCreatedAt, txHash] = await Promise.all([
    contract.getTxCreatedAt(txNonce),
    contract.getTxHash(txNonce)
  ])

  return { txCreatedAt, txHash }
}

const isQueueEmpty = async (
  moduleAddress: string,
  provider: StaticJsonRpcProvider
): Promise<boolean> => {
  const contract = new Contract(moduleAddress, delayModuleABI, provider)

  const [txNonce, queueNonce] = await Promise.all([
    contract.txNonce(),
    contract.queueNonce()
  ])

  return txNonce.eq(queueNonce)
}

const setUpDelayModule = async ({
  safe,
  cooldown,
  expiration
}: {
  safe: string
  cooldown: number
  expiration: number
}): Promise<string> => {
  const setUpArgs = utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'uint256', 'uint256'],
    [safe, safe, safe, cooldown, expiration]
  )

  return DelayModule.encodeFunctionData('setUp', [setUpArgs])
}

const encodeEnableModule = async (address: string): Promise<string> => {
  return DelayModule.encodeFunctionData('enableModule', [address])
}

const encodeDisableModule = async (
  prevModuleAddress: string,
  address: string
): Promise<string> => {
  return DelayModule.encodeFunctionData('disableModule', [
    prevModuleAddress,
    address
  ])
}

const findPrevModule = async (
  delayAddress: string,
  targetModule: string,
  provider: StaticJsonRpcProvider
): Promise<string> => {
  const delayContract = new Contract(delayAddress, delayModuleABI, provider)
  const moduleList = await delayContract.getModulesPaginated(SENTINEL, 1000)
  const index = moduleList.findIndex(
    (moduleToFind) => moduleToFind == targetModule
  )

  if (index === -1) throw new AddressNotGuardianError()

  let prevModule: string

  if (index !== 0) {
    prevModule = getAddress(moduleList[index - 1])
  } else {
    prevModule = getAddress(SENTINEL)
  }

  return prevModule
}

const encodeDeployDelayModule = async ({
  singletonDelayModule,
  initializer,
  safe
}: {
  singletonDelayModule: string
  initializer: string
  safe: string
}): Promise<string> => {
  return DelayModuleFactory.encodeFunctionData('deployModule', [
    singletonDelayModule,
    initializer,
    safe
  ])
}

const getGuardianAddress = async (
  delayAddress: string,
  provider: StaticJsonRpcProvider
): Promise<string> => {
  const delay = new Contract(delayAddress, delayModuleABI, provider)

  const modulesPaginated = await delay.getModulesPaginated(SENTINEL, 1)

  return modulesPaginated[0][0]
}

export default {
  getDelayAddress,
  isDeployed,
  createSetTxNonceFunction,
  getCurrentRecoveryParams,
  isQueueEmpty,
  setUpDelayModule,
  encodeDeployDelayModule,
  encodeEnableModule,
  encodeDisableModule,
  getGuardianAddress,
  findPrevModule
}
