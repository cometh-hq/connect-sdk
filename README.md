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
  jwtToken: TOKEN,
  apiKey: API_KEY,
  userName: USERNAME
})

const wallet = new ComethWallet({
  authAdapter: walletAdaptor,
  apiKey: API_KEY,
  rpcUrl: RPC_URL
})
```

To get an API key please [Contact us](https://alembic.tech/)

## Available methods

### Connect

```javascript
await wallet.connect()
```

This function create your credentials and identify you to the connect API.

### Logout

```javascript
await wallet.logout()
```

This function logs the user out and clears the cache.

### Get Address

```javascript
await wallet.getAddress()
```

This function returns the address of the wallet.

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

### Create New Signer Request

```javascript
await wallet.createNewSignerRequest()
```

This function create a new signer request that, when validated, enables to add a new device as signer of your smart wallet.

### Validate New Signer Request

```javascript
const newSignerRequest = {
  projectId: PROJECT_ID;
  userId: USER_IDENTIFIER;
  chainId: CHAIN_ID;
  walletAddress: WALLET_ADDRESS;
  signerAddress: SIGNER_ADDRESS;
  deviceData: DEVICE_DATA;
  type: NEW_SIGNER_REQUEST_TYPE;
}
 await wallet.validateNewSignerRequest(newSignerRequest)
```

This function validates a new signer request, enabling the targeted device to become a signer of your smart wallet.

### Get New Signer Request By User

```javascript
const newSignerRequests = await wallet.getNewSignerRequestByUser()
```

This function gets all new signer request for a given user.

### Delete a New Signer Request

```javascript
const signerAddress = SIGNER_ADDRESS

await wallet.deleteNewSignerRequest(signerAddress)
```

This function deletes a new signer request.

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
  jwtToken: TOKEN,
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
  jwtToken: TOKEN,
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
