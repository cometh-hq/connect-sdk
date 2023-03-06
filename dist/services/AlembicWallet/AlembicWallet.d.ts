import { EOAConstructor } from '../../adapters'

export declare class AlembicWallet {
  #private
  constructor(eoaAdapter: EOAConstructor, chainId?: number, rpcTarget?: string)
  connect(): Promise<void>
  getIsConnected(): boolean
  logout(): Promise<void>
  private createMessage
}
