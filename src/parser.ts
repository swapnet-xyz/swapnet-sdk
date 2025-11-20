
import Graph from "graph-data-structure";

import { type IRouteInfoInResponse, type ISwapResponse, } from "./common/interfaces.js";
import { type Swap, type TokenOperation, type IRoutingPlan, type LiquidityInfo, } from "./common/routingPlan.js";
import { parserPluginByLiquiditySourceUname } from "./liquiditySourcePlugins/parserPlugins.js";
import { LiquiditySourceUname } from "./common/unames.js";


const toSwap = (route: IRouteInfoInResponse, tokenOpsById: Map<number, TokenOperation>): Swap => {
    
    const plugin = parserPluginByLiquiditySourceUname[route.name];
    if (plugin === undefined) {
        throw new Error(`Invalid liquidity source ${route.name}!`);
    }

    const liquidityInfo: LiquidityInfo = plugin.convertToLiquidityInfo(route);

    const fromTokenOp = tokenOpsById.get(route.fromTokens[0].referenceId);
    if (fromTokenOp === undefined) {
        throw new Error(`Missing tokenOp with ID ${route.fromTokens[0]}.`);
    }
    const toTokenOp = tokenOpsById.get(route.toTokens[0].referenceId);
    if (toTokenOp === undefined) {
        throw new Error(`Missing tokenOp with ID ${route.toTokens[0]}.`);
    }

    return {
        fromTokenOp,
        toTokenOp,
        amountIn: BigInt(route.fromTokens[0].amount),
        amountOut: BigInt(route.toTokens[0].amount),
        liquidityInfo,
    };
}

export const parse = (swapResponse: ISwapResponse): IRoutingPlan => {

    const tokenOpsById: Map<number, TokenOperation> = new Map();
    swapResponse.tokens.forEach(token => {
        tokenOpsById.set(token.referenceId, {
            tokenInfo: {
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                usdPrice: token.usdPrice,
            },
            fromSwaps: [],
            toSwaps: [],
        })
    });

    const swapsByToTokenId: Map<number, Swap []> = new Map();
    const graph = Graph();
    swapResponse.routes.forEach(route => {
        const fromTokenId = route.fromTokens[0].referenceId;
        const toTokenId = route.toTokens[0].referenceId;
        graph.addEdge(fromTokenId.toString(), toTokenId.toString());

        if (!swapsByToTokenId.has(toTokenId)) {
            swapsByToTokenId.set(toTokenId, []);
        }
        const swap: Swap = toSwap(route, tokenOpsById);
        swap.fromTokenOp.toSwaps.push(swap);
        swap.toTokenOp.fromSwaps.push(swap);
        swapsByToTokenId.get(toTokenId)!.push(swap);
    });
    const sortedTokenOpIds = graph.topologicalSort().map(idString => parseInt(idString));


    const tokenOps: TokenOperation[] = [];
    const swaps: Swap[] = [];

    sortedTokenOpIds.forEach(tokenOpId => {
        const tokenOp = tokenOpsById.get(tokenOpId);
        if (tokenOp === undefined) {
            throw new Error(`Cannot find token operation with ID ${tokenOpId}!`);
        }

        tokenOps.push(tokenOp);
        const swapsToCurrentToken = swapsByToTokenId.get(tokenOpId);
        if (swapsToCurrentToken === undefined) {
            if (tokenOpId === swapResponse.sell.referenceId) {
                return;
            }
            throw new Error(`Cannot find swaps to token operation with ID ${tokenOpId}!`);
        }
        swapsToCurrentToken.forEach(swap => {
            swaps.push(swap);
        });
    });

    const sellTokenInfo = swapResponse.tokens.find(token => token.referenceId === swapResponse.sell.referenceId)!;
    const buyTokenInfo = swapResponse.tokens.find(token => token.referenceId === swapResponse.buy.referenceId)!;

    const wrapFromNative = swapResponse.sell.wrapFromNative === true;
    const unwrapToNative = swapResponse.buy.unwrapToNative === true;

    return {
        tokenOps,
        swaps,
        from: {
            address: sellTokenInfo.address,
            amount: BigInt(swapResponse.sell.amount),
            wrapFromNative,
        },
        to: {
            address: buyTokenInfo.address,
            amount: BigInt(swapResponse.buy.amount),
            unwrapToNative,
        }
    };
}

export const printRoutingPlan = (routingPlan: IRoutingPlan): void => {
    const { tokenOps, swaps } = routingPlan;
    const tokenOpToIndex: Map<TokenOperation, number> = new Map();
    const swapToIndex: Map<Swap, number> = new Map();
    tokenOps.forEach((tokenOp, i) => {
        tokenOpToIndex.set(tokenOp, i);
    });
    swaps.forEach((swap, i) => {
        swapToIndex.set(swap, i);
    });

    console.log(`Routing plan:`);
    console.log(`${routingPlan.from.amount} ${routingPlan.from.address} => ${routingPlan.to.amount} ${routingPlan.to.address}`);
    tokenOps.forEach((tokenOp, i) => {
        console.log(`  ${i}: ${tokenOp.tokenInfo.symbol}, fromSwaps: ${tokenOp.fromSwaps.map(s => swapToIndex.get(s))},  toSwaps: ${tokenOp.toSwaps.map(s => swapToIndex.get(s))}`);
    });

    swaps.forEach((swap, i) => {
        console.log(`  ${i}: ${swap.liquidityInfo.source} ${swap.liquidityInfo.address}, fromTokenOp: ${tokenOpToIndex.get(swap.fromTokenOp)} ${swap.amountIn},  toTokenOp: ${tokenOpToIndex.get(swap.toTokenOp)} ${swap.amountOut}`);
    });

};

export const estimateGasLimit = (routingPlan: IRoutingPlan): bigint => {
    const renegadeSwaps = routingPlan.swaps.filter(s => s.liquidityInfo.source === LiquiditySourceUname.RenegadeLimitOrder);
    return BigInt(routingPlan.swaps.length) * 150000n + BigInt(renegadeSwaps.length) * 6000000n + 1000000n;
};