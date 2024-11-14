
import { LiquiditySourceUname, type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type IUniswapV3Details, type LiquidityInfo, type PartialRecord } from "../index.js";


const converWithoutDetails = (route: IRouteInfoInResponse): LiquidityInfo => {
    return {
        source: route.name,
        address: route.address,
    };
};

const converWithFee = (route: IRouteInfoInResponse): LiquidityInfo => {
    if (route.details === undefined || (route.details as IUniswapV3Details).fee === undefined) {
        throw new Error(`Invalid Uniswap V3 route details!`);
    }

    const fee: bigint = BigInt((route.details as IUniswapV3Details).fee);

    return {
        source: route.name,
        address: route.address,
        fee,
    };
};

export interface ILiquiditySourceParserPlugin {
    converToLiquidityInfo: (route: IRouteInfoInResponse) => LiquidityInfo;
};


export const parserPluginByLiquiditySourceUname: PartialRecord<LiquiditySourceUname, ILiquiditySourceParserPlugin> = {
    [LiquiditySourceUname.UniswapV2]: {
        converToLiquidityInfo: converWithoutDetails,
    },
    [LiquiditySourceUname.ThrusterV2_3k]: {
        converToLiquidityInfo: converWithoutDetails,
    },
    [LiquiditySourceUname.ThrusterV2_10k]: {
        converToLiquidityInfo: converWithoutDetails,
    },
    [LiquiditySourceUname.RingswapV2]: {
        converToLiquidityInfo: converWithoutDetails,
    },
    [LiquiditySourceUname.UniswapV3]: {
        converToLiquidityInfo: converWithFee,
    },
    [LiquiditySourceUname.PancakeswapV3]: {
        converToLiquidityInfo: converWithFee,
    },
    [LiquiditySourceUname.ThrusterV3]: {
        converToLiquidityInfo: converWithFee,
    },
    // [LiquiditySourceUname.RingswapV3]: {
    //     converToLiquidityInfo: converWithFee,
    // },
    [LiquiditySourceUname.CurveV1]: {
        converToLiquidityInfo: converWithoutDetails,
    },
    [LiquiditySourceUname.BebopLimitOrder]: {
        converToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            const details = route.details as IBebopLimitOrderDetails;
            return {
                source: route.name,
                address: route.address,
                isSingleOrder: details.isSingleOrder,
                calldata: details.calldata,
                partialFillOffset: details.partialFillOffset,
            };
        },
    },
    [LiquiditySourceUname.NativeLimitOrder]: {
        converToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            const details = route.details as ISwapnetLimitOrderDetails;
            return {
                source: route.name,
                address: details.maker,
                maker: details.maker,
                makerToken: details.makerToken,
                takerToken: details.takerToken,
                makerAmount: BigInt(details.makerAmount),
                takerAmount: BigInt(details.takerAmount),
                nonce: BigInt(details.nonce),
                deadline: BigInt(details.deadline),
                signature: details.signature,
            };
        },
    },
};