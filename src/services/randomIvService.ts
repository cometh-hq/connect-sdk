import { getRandomValues } from './cryptoService'

export const getRandomIV = (): Uint8Array => {
  const array = new Uint8Array(16)
  getRandomValues(array)
  return array
}
