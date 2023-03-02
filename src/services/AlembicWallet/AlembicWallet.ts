import { EOAAdapter } from '@Adapters'

export class AlembicWallet {
  private _eoaAdapter: EOAAdapter | null = null

  constructor(_eoaAdapter) {
    this._eoaAdapter = _eoaAdapter
    this.connect()
  }

  public connect(): void {
    if (!this._eoaAdapter) {
      throw new Error('No EOA adapter found')
    }
    this._eoaAdapter.init()
  }
}
