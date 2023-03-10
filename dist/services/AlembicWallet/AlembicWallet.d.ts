import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { EOAConstructor } from '../../adapters';
import { UserInfos } from '../../types';
export declare class AlembicWallet {
    private eoaAdapter;
    private chainId;
    private rpcTarget;
    private isConnected;
    private smartWalletAddress;
    private ethProvider;
    private smartWallet;
    private ownerAddress;
    constructor(eoaAdapter?: EOAConstructor, chainId?: number, rpcTarget?: string);
    connect(): Promise<void>;
    getIsConnected(): boolean;
    logout(): Promise<void>;
    private createMessage;
    sendTransaction(safeTxData: SafeTransactionDataPartial): Promise<void>;
    getUserInfos(): Promise<UserInfos>;
}
