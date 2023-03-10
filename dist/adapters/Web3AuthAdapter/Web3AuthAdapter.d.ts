import { UserInfo } from '@web3auth/base';
import { ethers } from 'ethers';
import { EOAAdapter } from '../types';
export declare class Web3AuthAdapter implements EOAAdapter {
    private web3auth;
    private ethProvider;
    init(chainId: any, rpcTarget: any): Promise<void>;
    connect(): Promise<void>;
    logout(): Promise<void>;
    getAccount(): Promise<string | null>;
    getSigner(): ethers.Signer | null;
    getEthProvider(): ethers.providers.Web3Provider | null;
    getUserInfos(): Promise<Partial<UserInfo>>;
}
