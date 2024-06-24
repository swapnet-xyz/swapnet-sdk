

interface LiquidityAccountingModel {
    preCalculation: boolean;     // allow to calculate exact `amountOut` according to `amountIn` before calling `swap`.
    othersAsPayer: boolean;
    othersAsRecipient: boolean;
    paymentMode: 'Prepay' | 'Callback' | 'Pull';
    // exactAmountInAsParam: boolean;  // if the LS takes exact amountIn as a parameter to call. 
                                    // Some LS, such as LimitOrder, might not as it relies on the token pulls in when calling callbacks.
  
    // routerAsPayer: boolean; // always true
    // routerAsRecipient: boolean; // always true
};
  
export const clearingModelByProtocol: Map<string, LiquidityAccountingModel> = new Map();
clearingModelByProtocol.set(
    "LimitOrder",
    {
        preCalculation: false,  // avoid to be called in callbacks
        othersAsPayer: false,
        othersAsRecipient: true,
        paymentMode: 'Pull',
        // exactAmountInAsParam: false,
    }
);
clearingModelByProtocol.set(
    "UniswapV2",
    {
        preCalculation: true,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Prepay',
    }
);
clearingModelByProtocol.set(
    "UniswapV3",
    {
        preCalculation: false,
        othersAsPayer: true,
        othersAsRecipient: true,
        paymentMode: 'Callback',
    }
);
clearingModelByProtocol.set(
    "CurveV1",
    {
        preCalculation: false,
        othersAsPayer: false,
        othersAsRecipient: false,
        paymentMode: 'Pull',
    }
);
