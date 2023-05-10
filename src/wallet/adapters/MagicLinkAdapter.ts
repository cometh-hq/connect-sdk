import { Magic, MagicSDKAdditionalConfiguration } from 'magic-sdk'

import { AUTHAdapter } from './types'

export interface MagicLinkConfig {
  apiKey: string
  options?: MagicSDKAdditionalConfiguration
}

export class MagicLinkAdapter implements AUTHAdapter {
  private magic: Magic | null = null
  private magicConfig: MagicLinkConfig

  constructor(magicConfig: MagicLinkConfig) {
    this.magicConfig = magicConfig
  }

  public async init(): Promise<void> {
    if (!this.magicConfig) throw new Error('Missing config for magicLink')
    const { apiKey, options } = this.magicConfig

    const magic = new Magic(apiKey, options)
    this.magic = magic
  }
}
