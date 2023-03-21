# AlembicSDK

Alembic Account Abstraction SDK allows developers to onboard their users with a seedless, gasless experience familiar to Web2.

Account Abstraction (AA) improves transaction user experience by using smart contract wallets as primary accounts.
Our solution is compatible with EIP-4337.

## Instanciate Wallet

```javascript
import { AlembicWallet, UserInfos } from "alembic-sdk";

const wallet = new AlembicWallet({
      chainId: CHAIN_ID
      rpcTarget: RPC_URL
      apiKey: API_KEY,
    });

```

To get an API key please [Contact us](https://alembic.tech/)

## Available methods

### Connect

```javascript
await wallet.connect()
```

This function pops up the social login modal on UI.

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

### Get Relay Status

```javascript
const transactionStatus = await wallet.getRelayTxStatus(relayId)
// TransactionStatus:{hash: string,  status: string}
```

Returns the current transaction hash and the status of the relay (sent, mined, confirmed)

### Sign Message

```javascript
const signature = await wallet.signMessage('hello')
```

Sign the given message using the EOA, owner of the smart wallet.
