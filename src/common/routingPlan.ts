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
    isToken0Native: boolean;
};

export interface FluidInfo extends LiquidityInfoBase {
    hasNative: boolean;
};

export interface UniswapV2Info extends LiquidityInfoBase {
    feeInBps: bigint;
};

export interface RingswapV2Info extends LiquidityInfoBase {
    feeInBps: bigint;
    fromFewWrappedTokenAddress: string;
    toFewWrappedTokenAddress: string;
};

export interface AerodromeV3Info extends LiquidityInfoBase {
    tickSpacing: bigint;
};

export interface BebopLimitOrderInfo extends LiquidityInfoBase {
    isSingleOrder: boolean;
    calldata: string;
    partialFillOffset: number;
};

export interface ClipperLimitOrderInfo extends LiquidityInfoBase {
    calldata: string;
};


// export interface UniswapV2Info extends LiquidityInfoBase {
// };

export interface CurveV1Info extends LiquidityInfoBase {
    isLegacy: boolean;
    fromTokenIndex: number;
    toTokenIndex: number;
};

export interface BalancerV3Info extends LiquidityInfoBase {
    wrapToErc4626: boolean;
    unwrapFromErc4626: boolean;
};

export type LiquidityInfo = LiquidityInfoBase
    | LimitOrderInfo
    | UniswapV2Info
    | UniswapV3Info
    | UniswapV4Info
    | FluidInfo
    | AerodromeV3Info
    | RingswapV2Info
    | BebopLimitOrderInfo
    | ClipperLimitOrderInfo
    | CurveV1Info
    | BalancerV3Info;

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
    from: {
        address: string;
        amount: bigint;
        wrapFromNative: boolean;
    },
    to: {
        address: string;
        amount: bigint;
        unwrapToNative: boolean;
    },
};