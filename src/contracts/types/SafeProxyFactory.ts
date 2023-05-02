/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
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
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export interface SafeProxyFactoryInterface extends utils.Interface {
  functions: {
    "calculateCreateProxyWithNonceAddress(address,bytes,uint256)": FunctionFragment;
    "createProxy(address,bytes)": FunctionFragment;
    "createProxyWithCallback(address,bytes,uint256,address)": FunctionFragment;
    "createProxyWithNonce(address,bytes,uint256)": FunctionFragment;
    "proxyCreationCode()": FunctionFragment;
    "proxyRuntimeCode()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "calculateCreateProxyWithNonceAddress"
      | "createProxy"
      | "createProxyWithCallback"
      | "createProxyWithNonce"
      | "proxyCreationCode"
      | "proxyRuntimeCode"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "calculateCreateProxyWithNonceAddress",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "createProxy",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "createProxyWithCallback",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "createProxyWithNonce",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "proxyCreationCode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "proxyRuntimeCode",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "calculateCreateProxyWithNonceAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createProxy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createProxyWithCallback",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createProxyWithNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proxyCreationCode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proxyRuntimeCode",
    data: BytesLike
  ): Result;

  events: {
    "ProxyCreation(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ProxyCreation"): EventFragment;
}

export interface ProxyCreationEventObject {
  proxy: string;
  singleton: string;
}
export type ProxyCreationEvent = TypedEvent<
  [string, string],
  ProxyCreationEventObject
>;

export type ProxyCreationEventFilter = TypedEventFilter<ProxyCreationEvent>;

export interface SafeProxyFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: SafeProxyFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    calculateCreateProxyWithNonceAddress(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createProxy(
      singleton: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createProxyWithCallback(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      callback: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createProxyWithNonce(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    proxyCreationCode(overrides?: CallOverrides): Promise<[string]>;

    proxyRuntimeCode(overrides?: CallOverrides): Promise<[string]>;
  };

  calculateCreateProxyWithNonceAddress(
    _singleton: PromiseOrValue<string>,
    initializer: PromiseOrValue<BytesLike>,
    saltNonce: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createProxy(
    singleton: PromiseOrValue<string>,
    data: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createProxyWithCallback(
    _singleton: PromiseOrValue<string>,
    initializer: PromiseOrValue<BytesLike>,
    saltNonce: PromiseOrValue<BigNumberish>,
    callback: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createProxyWithNonce(
    _singleton: PromiseOrValue<string>,
    initializer: PromiseOrValue<BytesLike>,
    saltNonce: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  proxyCreationCode(overrides?: CallOverrides): Promise<string>;

  proxyRuntimeCode(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    calculateCreateProxyWithNonceAddress(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    createProxy(
      singleton: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    createProxyWithCallback(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      callback: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    createProxyWithNonce(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    proxyCreationCode(overrides?: CallOverrides): Promise<string>;

    proxyRuntimeCode(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "ProxyCreation(address,address)"(
      proxy?: null,
      singleton?: null
    ): ProxyCreationEventFilter;
    ProxyCreation(proxy?: null, singleton?: null): ProxyCreationEventFilter;
  };

  estimateGas: {
    calculateCreateProxyWithNonceAddress(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createProxy(
      singleton: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createProxyWithCallback(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      callback: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createProxyWithNonce(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    proxyCreationCode(overrides?: CallOverrides): Promise<BigNumber>;

    proxyRuntimeCode(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    calculateCreateProxyWithNonceAddress(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createProxy(
      singleton: PromiseOrValue<string>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createProxyWithCallback(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      callback: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createProxyWithNonce(
      _singleton: PromiseOrValue<string>,
      initializer: PromiseOrValue<BytesLike>,
      saltNonce: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    proxyCreationCode(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    proxyRuntimeCode(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
