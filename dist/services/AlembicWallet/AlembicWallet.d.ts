import { EOAAdapter } from '../../adapters';
export declare class AlembicWallet {
    #private;
    constructor(eoaAdapter: EOAAdapter, chainId?: number, rpcTarget?: string);
    connect(): Promise<void>;
    getIsConnected(): boolean;
    logout(): Promise<void>;
    private createMessage;
}
