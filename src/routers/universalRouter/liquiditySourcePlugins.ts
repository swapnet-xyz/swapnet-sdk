
import { solidityPacked } from "ethers";

import type { LiquidityInfo, UniswapV3Info } from "../../common/routingPlan.js";
import type { PartialRecord } from "../../common/typeUtils.js";
import { LiquiditySourceUname } from "../../common/unames.js";

import { CommandType, ROUTER_AS_RECIPIENT, UniswapV2ForkNames, UniswapV3ForkNames, type RoutePlanner } from "./routerCommands.js";
import { getFewWrappedTokenAddress } from "./fewTokenHelper.js";


const buildForUniswapV2Like = (v2ForkName: UniswapV2ForkNames): (
    (
        fromTokenAddress: string,
        toTokenAddress: string,
        amountIn: bigint,
        liquidityInfo: LiquidityInfo,
        planner: RoutePlanner,
    ) => void
) => {
    return function (fromTokenAddress, toTokenAddress, amountIn, liquidityInfo, planner) {
        let path = [ fromTokenAddress, toTokenAddress ];
        if (liquidityInfo.source === LiquiditySourceUname.RingswapV2) {
            const fewWrappedFromToken = getFewWrappedTokenAddress(fromTokenAddress);
            const fewWrappedToToken = getFewWrappedTokenAddress(toTokenAddress);
            path = [ fewWrappedFromToken, fewWrappedToToken ];
    
            planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                fromTokenAddress,
                ROUTER_AS_RECIPIENT,
                amountIn,
                true,
            ]);
        }
    
        planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
            ROUTER_AS_RECIPIENT,    // recipientIsUser
            amountIn,
            0n, // minAmountOut
            path,
            false,  // payerIsUser
            v2ForkName,
        ]);
    
        if (liquidityInfo.source === LiquiditySourceUname.RingswapV2) {
            const fewWrappedToToken = getFewWrappedTokenAddress(toTokenAddress);
            planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                fewWrappedToToken,
                ROUTER_AS_RECIPIENT,
                0n, // minAmountOut
                false,
            ]);
        }
    }
};

const encodeV3RouteToPath = (inputTokenAddress: string, outputTokenAddress: string, feeAmount: number): string => {
    const types = ['address', 'uint24', 'address'];
    const path = [inputTokenAddress, feeAmount, outputTokenAddress];
  
    return solidityPacked(types, path)
}

const buildForUniswapV3Like = (v3ForkName: UniswapV3ForkNames): (
    (
        fromTokenAddress: string,
        toTokenAddress: string,
        amountIn: bigint,
        liquidityInfo: LiquidityInfo,
        planner: RoutePlanner,
    ) => void
) => {
    return function (fromTokenAddress, toTokenAddress, amountIn, liquidityInfo, planner) {
        let path: string;
        // if (liquidityInfo.source === LiquiditySourceUname.RingswapV3) {
        //     const fewWrappedFromToken = getFewWrappedTokenAddress(fromTokenAddress);
        //     const fewWrappedToToken = getFewWrappedTokenAddress(toTokenAddress);
        //     path = encodeV3RouteToPath(fewWrappedFromToken, fewWrappedToToken, Number((liquidityInfo as UniswapV3Info).fee));

        //     planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
        //         fromTokenAddress,
        //         ROUTER_AS_RECIPIENT,
        //         amountIn,
        //         true,
        //     ]);
        // }
        // else {
        path = encodeV3RouteToPath(fromTokenAddress, toTokenAddress, Number((liquidityInfo as UniswapV3Info).fee));
        // }

        planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
            ROUTER_AS_RECIPIENT,    // recipientIsUser
            amountIn,
            0n, // minAmountOut
            path,
            false,  // payerIsUser
            v3ForkName,
        ]);

        // if (liquidityInfo.source === LiquiditySourceUname.RingswapV3) {
        //     const fewWrappedToToken = getFewWrappedTokenAddress(toTokenAddress);
        //     planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
        //         fewWrappedToToken,
        //         ROUTER_AS_RECIPIENT,
        //         0n, // minAmountOut
        //         false,
        //     ]);
        // }
    };
};

export interface ILiquiditySourceUniversalRouterPlugin {
    addToPlanner: (fromTokenAddress: string, toTokenAddress: string, amountIn: bigint, liquidityInfo: LiquidityInfo, planner: RoutePlanner) => void;
};

export const universalRouterPluginByLiquiditySourceUname: PartialRecord<LiquiditySourceUname, ILiquiditySourceUniversalRouterPlugin> = {
    [LiquiditySourceUname.UniswapV2]: {
        addToPlanner: buildForUniswapV2Like(UniswapV2ForkNames.Uniswap),
    },
    [LiquiditySourceUname.ThrusterV2_3k]: {
        addToPlanner: buildForUniswapV2Like(UniswapV2ForkNames.Thruster3k),
    },
    [LiquiditySourceUname.ThrusterV2_10k]: {
        addToPlanner: buildForUniswapV2Like(UniswapV2ForkNames.Thruster10k),
    },
    [LiquiditySourceUname.RingswapV2]: {
        addToPlanner: buildForUniswapV2Like(UniswapV2ForkNames.Ringswap),
    },
    [LiquiditySourceUname.UniswapV3]: {
        addToPlanner: buildForUniswapV3Like(UniswapV3ForkNames.Uniswap),
    },
    [LiquiditySourceUname.ThrusterV3]: {
        addToPlanner: buildForUniswapV3Like(UniswapV3ForkNames.Thruster),
    },
    // [LiquiditySourceUname.RingswapV3]: {
    //     addToPlanner: buildForUniswapV3Like(UniswapV3ForkNames.Ringswap),
    // },
    [LiquiditySourceUname.CurveV1]: {
        addToPlanner: (fromTokenAddress, toTokenAddress, amountIn, liquidityInfo, planner) => {
            planner.addCommand(CommandType.CURVE_V1, [
                liquidityInfo.address,
                fromTokenAddress,
                toTokenAddress,
                amountIn,
                0n, // minAmountOut
            ]);
        }
    },
};