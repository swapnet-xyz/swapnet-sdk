
export type EthCallOverride = {
    [address: string]: {
        balance: string,
        nonce: string,
        code: string,
        stateDiff: {
            [slot: string]: string,
        },
        state: {
            [slot: string]: string,
        },
    }
};

export type Access = {
    address: string;
    storageKeys: string[];
};