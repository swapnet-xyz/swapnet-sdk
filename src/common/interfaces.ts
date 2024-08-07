
export interface ITokenAmountInfo {
    referenceId: number;
    amount: string;
}

export interface ITokenInfoInResponse {
    referenceId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    usdPrice?: number;
}

export interface IUniswapV3Details {
    fee: number;
}

export interface ILimitOrderDetails {
    id: string;
    maker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    nonce: bigint;
    deadline: bigint;
    signature: string;
}

export interface IBebopLimitOrderDetails extends ILimitOrderDetails {
    taker: string;
    receiver: string;
    packedCommands: bigint;
    orderFlags: bigint;
    signatureFlags: bigint;
}

export interface IRouteInfoInResponse {
    address: string;
    name: string;
    details?: IUniswapV3Details | ILimitOrderDetails | IBebopLimitOrderDetails;
    fromTokens: Array<ITokenAmountInfo>;
    toTokens: Array<ITokenAmountInfo>;
}

export interface ISwapResponse {
    aggregator: string;
    block?: number;
    nativeTokenUsdPrice?: number;
    tokens: Array<ITokenInfoInResponse>;
    sell: ITokenAmountInfo;
    buy: ITokenAmountInfo;
    routes: Array<IRouteInfoInResponse>;
    calldata?: string;
    estimatedGas?: string;
}

export interface ITokenStaticInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    metadata: {
        logoURI: string;
    };
}

export interface ITokenPrice {
    chainId: number;
    address: string;
    usdPrice: number;
}