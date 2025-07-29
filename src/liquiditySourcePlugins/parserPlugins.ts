
import { LiquiditySourceUname, type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type IUniswapV3Details, type IUniswapV2Details, type LiquidityInfo, type IAerodromeV3Details, type IUniswapV4Details, type IRingswapV2Details, type RingswapV2Info } from "../index.js";


const convertWithoutDetails = (route: IRouteInfoInResponse): LiquidityInfo => {
    return {
        source: route.name,
        address: route.address,
    };
};

const convertWithFeeInBps = (route: IRouteInfoInResponse): LiquidityInfo => {
    if (route.details === undefined || (route.details as IUniswapV2Details).feeInBps === undefined) {
        throw new Error(`Invalid Uniswap V2 Like route details!`);
    }

    const feeInBps: bigint = BigInt((route.details as IUniswapV2Details).feeInBps);

    return {
        source: route.name,
        address: route.address,
        feeInBps,
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

const convertUniswapV4 = (route: IRouteInfoInResponse): LiquidityInfo => {
    if (route.details === undefined) {
        throw new Error(`Invalid Uniswap V4 route details!`);
    }

    const details = (route.details as IUniswapV4Details);

    if (details.fee === undefined || details.tickSpacing === undefined || details.hooks === undefined) {
        throw new Error(`Invalid Uniswap V4 route details!`);
    }

    const fee: bigint = BigInt(details.fee);
    const tickSpacing: bigint = BigInt(details.tickSpacing);

    return {
        source: route.name,
        address: details.hooks,
        fee,
        tickSpacing,
        isToken0Native: details.isToken0Native,
    };
};

const notSupported = (route: IRouteInfoInResponse): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is not supported in parser!`);
};

const invalidRoute = (route: IRouteInfoInResponse): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is invalid in routing plan!`);
};

export interface ILiquiditySourceParserPlugin {
    convertToLiquidityInfo: (route: IRouteInfoInResponse) => LiquidityInfo;
};


export const parserPluginByLiquiditySourceUname: Record<LiquiditySourceUname, ILiquiditySourceParserPlugin> = {
    [LiquiditySourceUname.UniswapV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.ThrusterV2_3k]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.ThrusterV2_10k]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.RingswapV2]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            const { fromFewWrappedTokenAddress, toFewWrappedTokenAddress } = route.details as IRingswapV2Details;
            return {
                source: route.name,
                address: route.address,
                fromFewWrappedTokenAddress,
                toFewWrappedTokenAddress,
            } as RingswapV2Info;
        },
    },
    [LiquiditySourceUname.UniswapV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.UniswapV4]: {
        convertToLiquidityInfo: convertUniswapV4,
    },
    [LiquiditySourceUname.PancakeswapV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.ThrusterV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    // [LiquiditySourceUname.RingswapV3]: {
    //     convertToLiquidityInfo: converWithFee,
    // },
    [LiquiditySourceUname.Cetus]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.CurveV1]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.BebopLimitOrder]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
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
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
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
        convertToLiquidityInfo: invalidRoute,
    },
    [LiquiditySourceUname.BebopOrderbook]: {
        convertToLiquidityInfo: invalidRoute,
    },
    [LiquiditySourceUname.Clipper]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.SushiswapV2]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.SushiswapV3]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.AerodromeV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.AerodromeV3]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            if (route.details === undefined || (route.details as IAerodromeV3Details).tickSpacing === undefined) {
                throw new Error(`Invalid Aerodrome V3 route details!`);
            }
            const tickSpacing: bigint = BigInt((route.details as IAerodromeV3Details).tickSpacing);
            return {
                source: route.name,
                address: route.address,
                tickSpacing,
            };
        },
    },
    [LiquiditySourceUname.Blasterswap]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.HyperswapV2]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.HyperswapV3]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.ProjectxV3]: {
        convertToLiquidityInfo: notSupported,
    },
};