
export interface LsInfoBase {
    protocol: string;
    address: string;
};

export interface LimitOrderInfo extends LsInfoBase {
    maker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    nonce: bigint;
    deadline: bigint;
    signature: string;
};

export interface UniswapV3Info extends LsInfoBase {
    fee: bigint;
};

// export interface UniswapV2Info extends LsInfoBase {
// };

// export interface CurveV1Info extends LsInfoBase {
// };

export type LsInfo = LsInfoBase
    | LimitOrderInfo
    | UniswapV3Info;

export interface LsSwap {
    fromTokenOp: TokenOperation;
    toTokenOp: TokenOperation;
    amountIn: bigint;
    amountOut: bigint;
    lsInfo: LsInfo;
};

export interface TokenOperation {
    tokenInfo: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        usdPrice?: number;
    };
    fromSwaps: LsSwap [];
    toSwaps: LsSwap [];
};

export interface IRoutingPlan {
    tokenOps: TokenOperation [],    // in topological order
    swaps: LsSwap [],               // in topological order
    fromToken: string,
    toToken: string,
    amountIn: bigint,
    amountOut: bigint,
};