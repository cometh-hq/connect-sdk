import {
  Address,
  Chain,
  GetBlockNumberReturnType,
  Hash,
  parseAbiItem,
  PublicClient,
  TransactionReceipt,
  Transport
} from 'viem'

import { ComethWallet } from '../../ComethWallet'

const _catchSuccessEvent = async (
  client: PublicClient<Transport, Chain>,
  address: Address,
  safeTxHash: Hash,
  currentBlockNumber: GetBlockNumberReturnType
): Promise<any> => {
  const successTransactionLogs = await client.getLogs({
    address,
    event: parseAbiItem(
      'event ExecutionSuccess(bytes32 txHash, uint256 payment)'
    ),
    fromBlock: currentBlockNumber - 300n
  })

  const filteredTransactionEvent = successTransactionLogs.find(
    (e) => e.args.txHash == safeTxHash
  )

  return filteredTransactionEvent
}

const _catchFailureEvent = async (
  client: PublicClient<Transport, Chain>,
  address: Address,
  safeTxHash: Hash,
  currentBlockNumber: GetBlockNumberReturnType
): Promise<any> => {
  const successTransactionLogs = await client.getLogs({
    address,
    event: parseAbiItem(
      'event ExecutionFailure(bytes32 txHash, uint256 payment)'
    ),
    fromBlock: currentBlockNumber - 300n
  })

  const filteredTransactionEvent = successTransactionLogs.find(
    (e) => e.args.txHash == safeTxHash
  )

  return filteredTransactionEvent
}

export const getTransaction = async (
  client: PublicClient<Transport, Chain>,
  wallet: ComethWallet,
  safeTxHash: Hash
): Promise<TransactionReceipt> => {
  const currentBlockNumber = await client.getBlockNumber()
  const from = (await wallet.getAddress()) as Address

  let txSuccessEvent: any = undefined
  let txFailureEvent: any = undefined

  while (!txSuccessEvent && !txFailureEvent) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    txSuccessEvent = await _catchSuccessEvent(
      client,
      from,
      safeTxHash,
      currentBlockNumber
    )
    txFailureEvent = await _catchFailureEvent(
      client,
      from,
      safeTxHash,
      currentBlockNumber
    )
  }

  if (txSuccessEvent) {
    let txResponse: TransactionReceipt | null = null
    while (txResponse === null) {
      try {
        txResponse = await client.getTransactionReceipt({
          hash: txSuccessEvent.transactionHash as Hash
        })
      } catch (err) {
        console.log(err)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return txResponse
  }
  if (txFailureEvent) {
    let txResponse: TransactionReceipt | null = null
    while (txResponse === null) {
      try {
        txResponse = await client.getTransactionReceipt({
          hash: txSuccessEvent.transactionHash as Hash
        })
      } catch (err) {
        console.log(err)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return txResponse
  }

  await new Promise((resolve) => setTimeout(resolve, 2000))
  return getTransaction(client, wallet, safeTxHash)
}
