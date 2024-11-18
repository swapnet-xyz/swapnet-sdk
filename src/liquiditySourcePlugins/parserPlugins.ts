
import { LiquiditySourceUname, type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type IUniswapV3Details, type LiquidityInfo } from "../index.js";


const convertWithoutDetails = (route: IRouteInfoInResponse): LiquidityInfo => {
    return {
        source: route.name,
        address: route.address,
    };
};

const convertWithFee = (route: IRouteInfoInResponse): LiquidityInfo => {
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

const notSupported = (route: IRouteInfoInResponse): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is not supported in parser!`);
};

const invalidRoute = (route: IRouteInfoInResponse): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is invalid in routing plan!`);
};

export interface ILiquiditySourceParserPlugin {
    converToLiquidityInfo: (route: IRouteInfoInResponse) => LiquidityInfo;
};


export const parserPluginByLiquiditySourceUname: Record<LiquiditySourceUname, ILiquiditySourceParserPlugin> = {
    [LiquiditySourceUname.UniswapV2]: {
        converToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.ThrusterV2_3k]: {
        converToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.ThrusterV2_10k]: {
        converToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.RingswapV2]: {
        converToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.UniswapV3]: {
        converToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.PancakeswapV3]: {
        converToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.ThrusterV3]: {
        converToLiquidityInfo: convertWithFee,
    },
    // [LiquiditySourceUname.RingswapV3]: {
    //     converToLiquidityInfo: converWithFee,
    // },
    [LiquiditySourceUname.Cetus]: {
        converToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.CurveV1]: {
        converToLiquidityInfo: convertWithoutDetails,
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
    [LiquiditySourceUname.NativeOrderbook]: {
        converToLiquidityInfo: invalidRoute,
    },
    [LiquiditySourceUname.BebopOrderbook]: {
        converToLiquidityInfo: invalidRoute,
    },
    [LiquiditySourceUname.Clipper]: {
        converToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.SushiswapV2]: {
        converToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.SushiswapV3]: {
        converToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.Aerodrome]: {
        converToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.Blasterswap]: {
        converToLiquidityInfo: notSupported,
    },
};