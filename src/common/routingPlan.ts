import type { LiquiditySourceUname } from "./unames.js";

export interface LiquidityInfoBase {
    source: LiquiditySourceUname;
    address: string;
};

export interface LimitOrderInfo extends LiquidityInfoBase {
    maker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    nonce: bigint;
    deadline: bigint;
    signature: string;
};

export interface UniswapV3Info extends LiquidityInfoBase {
    fee: bigint;
};

export interface UniswapV4Info extends LiquidityInfoBase {
    fee: bigint;
    tickSpacing: bigint;
    hooks: string;
};

export interface UniswapV2Info extends LiquidityInfoBase {
    feeInBps: bigint;
};

export interface AerodromeV3Info extends LiquidityInfoBase {
    tickSpacing: bigint;
};

export interface BebopLimitOrderInfo extends LiquidityInfoBase {
    isSingleOrder: boolean;
    calldata: string;
    partialFillOffset: number;
};

// export interface UniswapV2Info extends LiquidityInfoBase {
// };

// export interface CurveV1Info extends LiquidityInfoBase {
// };

export type LiquidityInfo = LiquidityInfoBase
    | LimitOrderInfo
    | UniswapV2Info
    | UniswapV3Info
    | UniswapV4Info
    | AerodromeV3Info
    | BebopLimitOrderInfo;

export interface Swap {
    fromTokenOp: TokenOperation;
    toTokenOp: TokenOperation;
    amountIn: bigint;
    amountOut: bigint;
    liquidityInfo: LiquidityInfo;
};

export interface TokenOperation {
    tokenInfo: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        usdPrice?: number;
    };
    fromSwaps: Swap [];
    toSwaps: Swap [];
};

export interface IRoutingPlan {
    tokenOps: TokenOperation [],    // in topological order
    swaps: Swap [],               // in topological order
    fromToken: string,
    toToken: string,
    amountIn: bigint,
    amountOut: bigint,
};