# Account Abstraction SDK

Cometh Connect SDK allows developers to onboard their users with a seedless, gasless experience familiar to Web2 using Biometrics and web2 logins.

Account Abstraction (AA) improves transaction user experience by using smart contract wallets as primary accounts.

## Instanciate Wallet

```javascript
import {
  ComethWallet,
  ConnectAdaptor,
  SupportedNetworks
} from '@cometh/connect-sdk'

const walletAdaptor = new ConnectAdaptor({
  chainId: SupportedNetworks.POLYGON,
  apiKey: API_KEY
})

const wallet = new ComethWallet({
  authAdapter: walletAdaptor,
  apiKey: API_KEY,
  rpcUrl: RPC_URL
})
```

To get an API key please [Contact us](https://alembic.tech/)

## Available methods

### Create a Wallet

```javascript
await wallet.connect()
```

This function create a new wallet and connect to the API.

### Get Address

```javascript
await wallet.getAddress()
```

This function returns the address of the wallet.

### Instanciate a Wallet

```javascript
await wallet.connect(walletAddress)
```

You can also connect to a previously created wallet. You'll have to provide the wallet address of the previously created wallet.

### Logout

```javascript
await wallet.logout()
```

This function logs the user out and clears the cache.

### Get user infos

```javascript
await wallet.getUserInfos()
```

If the user is logged in with social media accounts, this function can be used to fetch user related data such as email, etc.

### Send transaction

```javascript
const tx = { to: DESTINATION, value: VALUE, data: DATA }
const relayId = await wallet.sendTransaction(tx)
```

This function relays the transaction data to the target address. The transaction fees can be sponsored.

### Send Batch transactions

```javascript
const txBatch = [
  { to: DESTINATION, value: VALUE, data: DATA },
  { to: DESTINATION, value: VALUE, data: DATA }
]
const relayId = await wallet.sendBatchTransactions(txBatch)
```

This function relays a batch of transaction data to the targeted addresses. The transaction fees can be sponsored as well.

### Sign Message

```javascript
const signature = await wallet.signMessage('hello')
```

Sign the given message using the EOA, owner of the smart wallet.

## Go further

### Interact with contract interface

```javascript
import {
  ComethWallet,
  ConnectAdaptor,
  ComethProvider,
  SupportedNetworks
} from '@cometh/connect-sdk'

const walletAdaptor = new ConnectAdaptor({
  chainId: SupportedNetworks.POLYGON,
  apiKey: API_KEY,
  userName: USERNAME
})

const wallet = new ComethWallet({
  authAdapter: walletAdaptor,
  apiKey: API_KEY,
  rpcUrl: RPC_URL
})

const provider = new ComethProvider(wallet)

const nftContract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  nftContractAbi,
  provider.getSigner()
)

const tx = await nftContract.count()
const txResponse = await tx.wait()
```

You can also interact with the interface of a contract, calling directly the contract functions.

### Web3Onboard connector

```javascript
import {
  ConnectAdaptor,
  SupportedNetworks,
  ConnectOnboardConnector
} from '@cometh/connect-sdk'
import injectedModule from '@web3-onboard/injected-wallets'
import Onboard from '@web3-onboard/core'

const walletAdaptor = new ConnectAdaptor({
  chainId: SupportedNetworks.POLYGON,
  apiKey: API_KEY,
  userName: USERNAME
})

const connectOnboardConnector = ConnectOnboardConnector({
  apiKey: process.env.NEXT_PUBLIC_ALEMBIC_API_KEY,
  authAdapter: walletAdaptor,
  rpcUrl: RPC_URL
})

const web3OnboardInstance = Onboard({
  wallets: [injectedModule(), connectOnboardConnector],
  chains: [
    {
      id: ethers.utils.hexlify(DEFAULT_CHAIN_ID),
      token: 'MATIC',
      label: 'Matic Mainnet',
      rpcUrl: 'https://polygon-rpc.com'
    }
  ]
})
```

You can also incorporate cometh connect to web3Onboard wallet modal solution.
