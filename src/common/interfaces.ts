import type { ChainId, LiquiditySourceUname } from "./unames.js";

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

export interface IUniswapV2Details {
    feeInBps: number;
}

export interface IRingswapV2Details extends IUniswapV2Details {
    fromFewWrappedTokenAddress: string;
    toFewWrappedTokenAddress: string;
}

export interface IUniswapV3Details {
    fee: number;
}

export interface IUniswapV4Details {
    fee: number;
    tickSpacing: number;
    hooks: string;
    isToken0Native: boolean;
}

export interface IAerodromeV3Details {
    tickSpacing: number;
}

export interface ILimitOrderDetailsBase {
    id: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    deadline: bigint;
}

export interface ISwapnetLimitOrderDetails extends ILimitOrderDetailsBase {
    maker: string;
    nonce: bigint;
    signature: string;
}

export interface IBebopLimitOrderDetails extends ILimitOrderDetailsBase {
    isSingleOrder: boolean;
    partialFillOffset: number;
    calldata: string;
}

export type IEncodingDetails = IUniswapV2Details | IUniswapV3Details | IUniswapV4Details | IAerodromeV3Details | IRingswapV2Details | ILimitOrderDetailsBase;

export interface IRouteInfoInResponse {
    address: string;
    name: LiquiditySourceUname;
    details?: IEncodingDetails;
    fromTokens: Array<ITokenAmountInfo>;
    toTokens: Array<ITokenAmountInfo>;
}

export interface ISwapResponse {
    aggregator: string;
    router: string;
    block?: number;
    nativeTokenUsdPrice?: number;
    tokens: Array<ITokenInfoInResponse>;
    sell: ITokenAmountInfo & { wrapFromNative?: boolean; };
    buy: ITokenAmountInfo & { unwrapToNative?: boolean; };
    routes: Array<IRouteInfoInResponse>;
    estimatedGas?: string;
    calldata?: string;
    routerAddress?: string;
    gasLimit?: string;
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
    chainId: ChainId;
    address: string;
    usdPrice: number;
}