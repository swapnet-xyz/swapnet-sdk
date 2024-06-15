
export enum LsType {
    LimitOrder = 0x00,
    UniswapV2 = 0x01,
    UniswapV3 = 0x02,
    CurveV1 = 0x03,
    Unknown = 0xff,
};

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
  
export const accountingModelByLsType: Map<LsType, LsAccountingModel> = new Map();
accountingModelByLsType.set(
    LsType.LimitOrder,
    {
        preCalculation: false,  // avoid to be called in callbacks
        othersAsPayer: false,
        othersAsRecipient: true,
        paymentMode: 'Pull',
        // exactAmountInAsParam: false,
    }
);
accountingModelByLsType.set(
    LsType.UniswapV2,
    {
        preCalculation: true,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Prepay',
    }
);
accountingModelByLsType.set(
    LsType.UniswapV3,
    {
        preCalculation: false,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Callback',
    }
);
accountingModelByLsType.set(
    LsType.CurveV1,
    {
        preCalculation: false,
        othersAsPayer: false,
        othersAsRecipient: false,
        paymentMode: 'Pull',
    }
);

export interface LsInfoBase {
    type: LsType;
    address: string;
    protocol?: string;
};

export interface LimitOrderInfo extends LsInfoBase {
    type: LsType.LimitOrder;
    maker: string;
    makerToken: string;
    takerToken: string;
    makerAmount: bigint;
    takerAmount: bigint;
    nonce: bigint;
    deadline: bigint;
    signature: string;
};

export interface UniswapV2Info extends LsInfoBase {
    type: LsType.UniswapV2;
};

export interface UniswapV3Info extends LsInfoBase {
    type: LsType.UniswapV3;
    fee: bigint;
};

export interface CurveV1Info extends LsInfoBase {
    type: LsType.CurveV1;
};

export type LsInfo = LimitOrderInfo | UniswapV2Info | UniswapV3Info | CurveV1Info | LsInfoBase;

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