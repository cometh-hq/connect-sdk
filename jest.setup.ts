import { webcrypto } from 'node:crypto'

import { TextDecoder, TextEncoder } from 'util'

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto
})
Object.assign(global, { TextDecoder, TextEncoder })
