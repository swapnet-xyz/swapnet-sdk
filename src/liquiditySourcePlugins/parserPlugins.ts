
import { LiquiditySourceUname, type ChainId, type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type IUniswapV3Details, type IUniswapV2Details, type LiquidityInfo, type IAerodromeV3Details, type IUniswapV4Details } from "../index.js";


const convertWithoutDetails = (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
    return {
        source: route.name,
        address: route.address,
        chainId,
    };
};

const convertWithFeeInBps = (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
    if (route.details === undefined || (route.details as IUniswapV2Details).feeInBps === undefined) {
        throw new Error(`Invalid Uniswap V2 Like route details!`);
    }

    const feeInBps: bigint = BigInt((route.details as IUniswapV2Details).feeInBps);

    return {
        source: route.name,
        address: route.address,
        feeInBps,
        chainId,
    };
};

const convertWithFee = (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
    if (route.details === undefined || (route.details as IUniswapV3Details).fee === undefined) {
        throw new Error(`Invalid Uniswap V3 route details!`);
    }

    const fee: bigint = BigInt((route.details as IUniswapV3Details).fee);

    return {
        source: route.name,
        address: route.address,
        fee,
        chainId,
    };
};

const convertUniswapV4 = (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
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
        chainId,
    };
};

const notSupported = (route: IRouteInfoInResponse, _chainId: ChainId): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is not supported in parser!`);
};

const invalidRoute = (route: IRouteInfoInResponse, _chainId: ChainId): LiquidityInfo => {
    throw new Error(`Liquidity source ${route.name} is invalid in routing plan!`);
};

export interface ILiquiditySourceParserPlugin {
    convertToLiquidityInfo: (route: IRouteInfoInResponse, chainId: ChainId) => LiquidityInfo;
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
        convertToLiquidityInfo: convertWithoutDetails,
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
        convertToLiquidityInfo: (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
            const details = route.details as IBebopLimitOrderDetails;
            return {
                source: route.name,
                address: route.address,
                isSingleOrder: details.isSingleOrder,
                calldata: details.calldata,
                partialFillOffset: details.partialFillOffset,
                chainId,
            };
        },
    },
    [LiquiditySourceUname.NativeLimitOrder]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
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
                chainId,
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
        convertToLiquidityInfo: (route: IRouteInfoInResponse, chainId: ChainId): LiquidityInfo => {
            if (route.details === undefined || (route.details as IAerodromeV3Details).tickSpacing === undefined) {
                throw new Error(`Invalid Aerodrome V3 route details!`);
            }
            const tickSpacing: bigint = BigInt((route.details as IAerodromeV3Details).tickSpacing);
            return {
                source: route.name,
                address: route.address,
                tickSpacing,
                chainId,
            };
        },
    },
    [LiquiditySourceUname.Blasterswap]: {
        convertToLiquidityInfo: notSupported,
    },
};