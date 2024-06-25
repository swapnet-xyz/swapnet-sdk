import Graph from "graph-data-structure";
import { type ISwapResponse, } from "../common/interfaces.js";
import { type LsSwap, type TokenOperation, type IRoutingPlan, } from "../common/routingPlan.js";
import { toLsSwap } from "../utils.js";

export const printRoutingPlan = (routingPlan: IRoutingPlan): void => {
    const { tokenOps, swaps } = routingPlan;
    const tokenOpToIndex: Map<TokenOperation, number> = new Map();
    const swapToIndex: Map<LsSwap, number> = new Map();
    tokenOps.forEach((tokenOp, i) => {
        tokenOpToIndex.set(tokenOp, i);
    });
    swaps.forEach((swap, i) => {
        swapToIndex.set(swap, i);
    });

    console.log(`Routing plan:`);
    console.log(`${routingPlan.amountIn} ${routingPlan.fromToken} => ${routingPlan.amountOut} ${routingPlan.toToken}`);
    tokenOps.forEach((tokenOp, i) => {
        console.log(`  ${i}: ${tokenOp.tokenInfo.symbol}, fromSwaps: ${tokenOp.fromSwaps.map(s => swapToIndex.get(s))},  toSwaps: ${tokenOp.toSwaps.map(s => swapToIndex.get(s))}`);
    });

    swaps.forEach((swap, i) => {
        console.log(`  ${i}: ${swap.lsInfo.protocol} ${swap.lsInfo.address}, fromTokenOp: ${tokenOpToIndex.get(swap.fromTokenOp)} ${swap.amountIn},  toTokenOp: ${tokenOpToIndex.get(swap.toTokenOp)} ${swap.amountOut}`);
    });

};

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

    const swapsByToTokenId: Map<number, LsSwap []> = new Map();
    const graph = Graph();
    swapResponse.routes.forEach(route => {
        const fromTokenId = route.fromTokens[0].referenceId;
        const toTokenId = route.toTokens[0].referenceId;
        graph.addEdge(fromTokenId.toString(), toTokenId.toString());

        if (!swapsByToTokenId.has(toTokenId)) {
            swapsByToTokenId.set(toTokenId, []);
        }
        const swap: LsSwap = toLsSwap(route, tokenOpsById);
        swap.fromTokenOp.toSwaps.push(swap);
        swap.toTokenOp.fromSwaps.push(swap);
        swapsByToTokenId.get(toTokenId)!.push(swap);
    });
    const sortedTokenOpIds = graph.topologicalSort().map(idString => parseInt(idString));


    const tokenOps: TokenOperation[] = [];
    const swaps: LsSwap[] = [];

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

    return {
        tokenOps,
        swaps,
        fromToken: sellTokenInfo.address,
        toToken: buyTokenInfo.address,
        amountIn: BigInt(swapResponse.sell.amount),
        amountOut: BigInt(swapResponse.buy.amount),
    };
}