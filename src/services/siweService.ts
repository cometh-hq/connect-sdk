import { SiweMessage } from 'siwe'

import { UserNonceType } from '../wallet'

const createMessage = (
  address: string,
  nonce: UserNonceType,
  chainId: number
): SiweMessage => {
  const domain = window.location.host
  const origin = window.location.origin
  const statement = `Sign in with Ethereum to Cometh Connect`
  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId,
    nonce: nonce?.connectionNonce
  })

  return message
}

export default {
  createMessage
}
