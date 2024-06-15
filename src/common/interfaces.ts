
export interface ITokenStaticInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    metadata: {
        logoURI: string;
    };
}

export interface ISwapRequest {
    chainId: number | undefined;
    userAddress: string | undefined;
    inputToken: string;
    outputToken: string;
    inputAmount: bigint;
    apiKey: string;
}

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
    maker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    nonce: bigint;
    deadline: bigint;
    signature: string;
}

export interface IRouteInfoInResponse {
    address: string;
    name: string;
    details?: IUniswapV3Details | ILimitOrderDetails;
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

export interface ITokenPrice {
    chainId: number;
    address: string;
    usdPrice: number;
}