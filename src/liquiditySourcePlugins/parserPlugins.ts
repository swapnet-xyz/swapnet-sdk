
import { LiquiditySourceUname, type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type IUniswapV3Details, type IUniswapV2Details, type LiquidityInfo, type IAerodromeV3Details, type IUniswapV4Details, type IRingswapV2Details, type RingswapV2Info, type ICurveV1Details, type CurveV1Info, type IBalancerV3Details, type IClipperLimitOrderDetails, type IFluidDetails } from "../index.js";


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

const convertWithTickSpacing = (route: IRouteInfoInResponse): LiquidityInfo => {
    if (route.details === undefined || (route.details as IAerodromeV3Details).tickSpacing === undefined) {
        throw new Error(`Invalid Aerodrome V3 route details!`);
    }
    const tickSpacing: bigint = BigInt((route.details as IAerodromeV3Details).tickSpacing);
    return {
        source: route.name,
        address: route.address,
        tickSpacing,
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
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.ThrusterV2_10k]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.RingswapV2]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            if (route.details === undefined || (route.details as IUniswapV2Details).feeInBps === undefined) {
                throw new Error(`Invalid Uniswap V2 Like route details!`);
            }

            const feeInBps: bigint = BigInt((route.details as IUniswapV2Details).feeInBps);
            const { fromFewWrappedTokenAddress, toFewWrappedTokenAddress } = route.details as IRingswapV2Details;
            return {
                source: route.name,
                address: route.address,
                feeInBps,
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
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.CurveV1]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            const details = route.details as ICurveV1Details;
            return {
                source: route.name,
                address: route.address,
                isLegacy: details.isLegacy,
                fromTokenIndex: details.fromTokenIndex,
                toTokenIndex: details.toTokenIndex,
            } as CurveV1Info;
        },
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
    [LiquiditySourceUname.ClipperLimitOrder]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            const details = route.details as IClipperLimitOrderDetails;
            return {
                source: route.name,
                address: route.address,
                calldata: details.calldata,
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
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.SushiswapV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.SushiswapV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.AerodromeV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.AerodromeV3]: {
        convertToLiquidityInfo: convertWithTickSpacing,
    },
    [LiquiditySourceUname.Blasterswap]: {
        convertToLiquidityInfo: notSupported,
    },
    [LiquiditySourceUname.HyperswapV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.HyperswapV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.ProjectxV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.RaydiumClmm]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.RaydiumCpmm]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.OrcaClmm]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.HybraV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.KittenswapV4]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.GliquidV4]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.UpheavalV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.Fluid]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            if (route.details === undefined) {
                throw new Error(`No details found for Fluid route!`);
            }
            const { hasNative } = route.details as IFluidDetails;

            if (hasNative === undefined) {
                throw new Error(`Invalid Fluid route details!`);
            }
            return {
                source: route.name,
                address: route.address,
                hasNative,
            };
        },
    },
    [LiquiditySourceUname.BalancerV3]: {
        convertToLiquidityInfo: (route: IRouteInfoInResponse): LiquidityInfo => {
            if (route.details === undefined) {
                throw new Error(`No details found for Balancer V3 route!`);
            }
            const { wrapToErc4626, unwrapFromErc4626 } = route.details as IBalancerV3Details;

            if (wrapToErc4626 === undefined || unwrapFromErc4626 === undefined) {
                throw new Error(`Invalid Balancer V3 route details!`);
            }
            return {
                source: route.name,
                address: route.address,
                wrapToErc4626,
                unwrapFromErc4626,
            };
        },
    },
    [LiquiditySourceUname.UltrasolidV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.PancakeswapV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.QuickswapV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.QuickswapV3]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.AlienBaseV2]: {
        convertToLiquidityInfo: convertWithFeeInBps,
    },
    [LiquiditySourceUname.AlienBaseV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.OmniExchangeV3]: {
        convertToLiquidityInfo: convertWithFee,
    },
    [LiquiditySourceUname.QuickswapV4]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.HydrexFiV3]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.AerodromeForkV3]: {
        convertToLiquidityInfo: convertWithTickSpacing,
    },
    [LiquiditySourceUname.CamelotV3]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
    [LiquiditySourceUname.CamelotV4]: {
        convertToLiquidityInfo: convertWithoutDetails,
    },
};