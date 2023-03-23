import { RequestArguments } from 'eip1193-provider'
import { ethers } from 'ethers'

import { API } from '../../services/API/API'
import { SmartWallet } from '../SmartWallet'

export interface AlembicProviderConfig {
  ethProvider: ethers.providers.Web3Provider
  smartWallet: SmartWallet
  apiKey: string
}

export class AlembicProvider {
  private ethProvider: ethers.providers.Web3Provider
  private smartWallet: SmartWallet
  private API: API

  constructor({ ethProvider, smartWallet, apiKey }: AlembicProviderConfig) {
    this.ethProvider = ethProvider
    this.smartWallet = smartWallet
    this.API = new API(apiKey)
  }

  public async request(request: RequestArguments): Promise<any> {
    if (request.method === 'eth_sendTransaction') {
      const _params =
        request?.params && Array.isArray(request?.params) && request?.params[0]
          ? request?.params[0]
          : undefined
      if (_params) {
        const relayId = await this.smartWallet.sendTransaction(_params)
        if (!relayId) throw new Error('eth_sendTransaction error')
        return (await this.API.getRelayTxStatus(relayId))?.hash
      }
      throw new Error('eth_sendTransaction error')
    } else if (request.method === 'eth_getTransactionReceipt') {
      console.log('eth_getTransactionReceipt', request.params)
      return await this.ethProvider.send(
        request.method,
        (request.params || []) as Array<any>
      )
    } else {
      return await this.ethProvider.send(
        request.method,
        (request.params || []) as Array<any>
      )
    }
  }
}
