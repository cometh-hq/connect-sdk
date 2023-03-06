import { EOAConstructor } from '../../adapters'

export declare class AlembicWallet {
  private eoaAdapter
  private chainId
  private rpcTarget
  private isConnected
  constructor(eoaAdapter: EOAConstructor, chainId?: number, rpcTarget?: string)
  connect(): Promise<void>
  getIsConnected(): boolean
  logout(): Promise<void>
  private createMessage
}
