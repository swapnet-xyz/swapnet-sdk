import Graph from "graph-data-structure";
import { type IBebopLimitOrderDetails, type IRouteInfoInResponse, type ISwapnetLimitOrderDetails, type ISwapResponse, type IUniswapV3Details, } from "./common/interfaces.js";
import { type Swap, type TokenOperation, type IRoutingPlan, type LiquidityInfo, } from "./common/routingPlan.js";
import { LiquiditySourceUname } from "./common/unames.js";

const toSwap = (route: IRouteInfoInResponse, tokenOpsById: Map<number, TokenOperation>): Swap => {
    
    let liquidityInfo: LiquidityInfo;
    if (
        route.name === LiquiditySourceUname.UniswapV2 ||
        route.name === LiquiditySourceUname.ThrusterV2_3k ||
        route.name === LiquiditySourceUname.ThrusterV2_10k ||
        route.name === LiquiditySourceUname.RingswapV2

    ) {
        liquidityInfo = {
            source: route.name,
            address: route.address,
        }
    }
    else if (
        route.name === LiquiditySourceUname.UniswapV3 ||
        route.name === LiquiditySourceUname.PancakeswapV3 ||
        route.name === LiquiditySourceUname.ThrusterV3
    ) {
        if (route.details === undefined || (route.details as IUniswapV3Details).fee === undefined) {
            throw new Error(`Invalid Uniswap V3 route details!`);
        }

        let fee: bigint = BigInt((route.details as IUniswapV3Details).fee);

        liquidityInfo = {
            source: route.name,
            address: route.address,
            fee,
        }
    }
    else if (route.name === LiquiditySourceUname.CurveV1) {
        liquidityInfo = {
            source: route.name,
            address: route.address,
        }
    }
    else if (route.name === LiquiditySourceUname.BebopLimitOrder) {
        const details = route.details as IBebopLimitOrderDetails;
        liquidityInfo = {
            source: route.name,
            address: route.address,
            isSingleOrder: details.isSingleOrder,
            calldata: details.calldata,
            partialFillOffset: details.partialFillOffset,
        };
    }
    else if (route.name === LiquiditySourceUname.NativeLimitOrder) {
        const details = route.details as ISwapnetLimitOrderDetails;
        liquidityInfo = {
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
    }
    else {
        liquidityInfo = {
            source: route.name,
            address: route.address,
        }
        // throw new Error(`Invalid route name ${route.name}!`);
    }

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
    }
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

    return {
        tokenOps,
        swaps,
        fromToken: sellTokenInfo.address,
        toToken: buyTokenInfo.address,
        amountIn: BigInt(swapResponse.sell.amount),
        amountOut: BigInt(swapResponse.buy.amount),
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
    console.log(`${routingPlan.amountIn} ${routingPlan.fromToken} => ${routingPlan.amountOut} ${routingPlan.toToken}`);
    tokenOps.forEach((tokenOp, i) => {
        console.log(`  ${i}: ${tokenOp.tokenInfo.symbol}, fromSwaps: ${tokenOp.fromSwaps.map(s => swapToIndex.get(s))},  toSwaps: ${tokenOp.toSwaps.map(s => swapToIndex.get(s))}`);
    });

    swaps.forEach((swap, i) => {
        console.log(`  ${i}: ${swap.liquidityInfo.source} ${swap.liquidityInfo.address}, fromTokenOp: ${tokenOpToIndex.get(swap.fromTokenOp)} ${swap.amountIn},  toTokenOp: ${tokenOpToIndex.get(swap.toTokenOp)} ${swap.amountOut}`);
    });

};