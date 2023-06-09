import { SiweMessage } from 'siwe'

const createMessage = (address, nonce, chainId): SiweMessage => {
  const domain = window.location.host
  const origin = window.location.origin
  const statement = `Sign in with Ethereum to Alembic`
  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: chainId,
    nonce: nonce?.connectionNonce
  })

  return message
}

export default {
  createMessage
}
