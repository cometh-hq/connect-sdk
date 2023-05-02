import type {
  EventFragment,
  FunctionFragment,
  Result
} from '@ethersproject/abi'
import type { Listener, Provider } from '@ethersproject/providers'
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils
} from 'ethers'

import type {
  OnEvent,
  PromiseOrValue,
  TypedEvent,
  TypedEventFilter,
  TypedListener
} from './common'
export interface P256SignerFactoryInterface extends utils.Interface {
  functions: {
    'create(uint256,uint256)': FunctionFragment
  }
  getFunction(nameOrSignatureOrTopic: 'create'): FunctionFragment
  encodeFunctionData(
    functionFragment: 'create',
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string
  decodeFunctionResult(functionFragment: 'create', data: BytesLike): Result
  events: {
    'NewSignerCreated(uint256,uint256,address)': EventFragment
  }
  getEvent(nameOrSignatureOrTopic: 'NewSignerCreated'): EventFragment
}
export interface NewSignerCreatedEventObject {
  x: BigNumber
  y: BigNumber
  signer: string
}
export type NewSignerCreatedEvent = TypedEvent<
  [BigNumber, BigNumber, string],
  NewSignerCreatedEventObject
>
export type NewSignerCreatedEventFilter =
  TypedEventFilter<NewSignerCreatedEvent>
export interface P256SignerFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this
  attach(addressOrName: string): this
  deployed(): Promise<this>
  interface: P256SignerFactoryInterface
  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>
  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>
  listeners(eventName?: string): Array<Listener>
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this
  removeAllListeners(eventName?: string): this
  off: OnEvent<this>
  on: OnEvent<this>
  once: OnEvent<this>
  removeListener: OnEvent<this>
  functions: {
    create(
      x: PromiseOrValue<BigNumberish>,
      y: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & {
        from?: PromiseOrValue<string>
      }
    ): Promise<ContractTransaction>
  }
  create(
    x: PromiseOrValue<BigNumberish>,
    y: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & {
      from?: PromiseOrValue<string>
    }
  ): Promise<ContractTransaction>
  callStatic: {
    create(
      x: PromiseOrValue<BigNumberish>,
      y: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>
  }
  filters: {
    'NewSignerCreated(uint256,uint256,address)'(
      x?: PromiseOrValue<BigNumberish> | null,
      y?: PromiseOrValue<BigNumberish> | null,
      signer?: null
    ): NewSignerCreatedEventFilter
    NewSignerCreated(
      x?: PromiseOrValue<BigNumberish> | null,
      y?: PromiseOrValue<BigNumberish> | null,
      signer?: null
    ): NewSignerCreatedEventFilter
  }
  estimateGas: {
    create(
      x: PromiseOrValue<BigNumberish>,
      y: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & {
        from?: PromiseOrValue<string>
      }
    ): Promise<BigNumber>
  }
  populateTransaction: {
    create(
      x: PromiseOrValue<BigNumberish>,
      y: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & {
        from?: PromiseOrValue<string>
      }
    ): Promise<PopulatedTransaction>
  }
}
