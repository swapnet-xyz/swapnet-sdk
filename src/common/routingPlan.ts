

export interface LsAccountingModel {
    preCalculation: boolean;     // allow to calculate exact `amountOut` according to `amountIn` before calling `swap`.
    othersAsPayer: boolean;
    othersAsRecipient: boolean;
    paymentMode: 'Prepay' | 'Callback' | 'Pull';
    // exactAmountInAsParam: boolean;  // if the LS takes exact amountIn as a parameter to call. 
                                    // Some LS, such as LimitOrder, might not as it relies on the token pulls in when calling callbacks.
  
    // routerAsPayer: boolean; // always true
    // routerAsRecipient: boolean; // always true
};
  
export const accountingModelByLsType: Map<string, LsAccountingModel> = new Map();
accountingModelByLsType.set(
    "LimitOrder",
    {
        preCalculation: false,  // avoid to be called in callbacks
        othersAsPayer: false,
        othersAsRecipient: true,
        paymentMode: 'Pull',
        // exactAmountInAsParam: false,
    }
);
accountingModelByLsType.set(
    "UniswapV2",
    {
        preCalculation: true,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Prepay',
    }
);
accountingModelByLsType.set(
    "UniswapV3",
    {
        preCalculation: false,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Callback',
    }
);
accountingModelByLsType.set(
    "CurveV1",
    {
        preCalculation: false,
        othersAsPayer: false,
        othersAsRecipient: false,
        paymentMode: 'Pull',
    }
);

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

export type TokenOperationNodeType =
    'SOURCE' |
    'PASSING_THROUGH' |
    'MERGING' |
    'FORKING' |
    'DESTINATION';

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