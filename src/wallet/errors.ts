export class RelayedTransactionPendingError extends Error {
  constructor(public relayId: string) {
    super(
      `The transaction has not been confirmed yet on the network, you can track its progress using its relayId(${relayId})`
    )
  }
}

export class RelayedTransactionError extends Error {
  constructor() {
    super('Error during the relay of the transaction')
  }
}
