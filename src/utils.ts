import { type IRouteInfoInResponse, type IUniswapV3Details, type ILimitOrderDetails, } from "./common/interfaces.js";
import { type LiquidityInfo, type Swap, type TokenOperation, } from "./common/routingPlan.js";


export type TokenOperationNodeType =
    'SOURCE' |
    'PASSING_THROUGH' |
    'MERGING' |
    'FORKING' |
    'DESTINATION';

export const toSwap = (route: IRouteInfoInResponse, tokenOpsById: Map<number, TokenOperation>): Swap => {
    
    let liquidityInfo: LiquidityInfo;
    if (
        route.name.startsWith('UniswapV2') ||
        route.name.startsWith('ThrusterV2-3k') ||
        route.name.startsWith('ThrusterV2-10k') ||
        route.name.startsWith('RingswapV2')

    ) {
        liquidityInfo = {
            protocol: route.name,
            address: route.address,
        }
    }
    else if (
        route.name.startsWith('UniswapV3') ||
        route.name.startsWith('ThrusterV3') ||
        route.name.startsWith('RingswapV3')
    ) {
        if (route.details === undefined || (route.details as IUniswapV3Details).fee === undefined) {
            throw new Error(`Invalid Uniswap V3 route details!`);
        }

        let fee: bigint = BigInt((route.details as IUniswapV3Details).fee);

        liquidityInfo = {
            protocol: route.name,
            address: route.address,
            fee,
        }
    }
    else if (route.name.startsWith('CurveV1')) {
        liquidityInfo = {
            protocol: route.name,
            address: route.address,
        }
    }
    else if (route.name.startsWith('Orderbook')) {
        const details = route.details as ILimitOrderDetails;
        liquidityInfo = {
            protocol: "LimitOrder",
            address: details.maker,
            maker: details.maker,
            makerToken: details.makerToken,
            takerToken: details.takerToken,
            makerAmount: BigInt(details.makerAmount),
            takerAmount: BigInt(details.takerAmount),
            nonce: BigInt(details.nonce),
            deadline: BigInt(details.deadline),
            signature: details.signature,
        }
    }
    else {
        liquidityInfo = {
            protocol: route.name,
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

export const toNodeType = (tokenOp: TokenOperation): TokenOperationNodeType => {
    const { fromSwaps, toSwaps, } = tokenOp;

    if (fromSwaps.length === 0 && toSwaps.length === 0) {
        throw new Error(`Invalid TokenOperation node!`);
    }

    if (fromSwaps.length === 0) {
        return 'SOURCE';
    }

    if (toSwaps.length === 0) {
        return 'DESTINATION';
    }

    if (toSwaps.length === 1) {
        if (fromSwaps.length === 1) {
            return 'PASSING_THROUGH';
        }
        return 'MERGING';
    }

    return 'FORKING';
}

export const toAmountOutMinimum = (amountOut: bigint, slippageTolerance: number): bigint => {
    const slippageToleranceMillionth = BigInt(Math.floor(slippageTolerance * 10 ** 6));
    const oneMillion = BigInt(10 ** 6); 
    return amountOut * (oneMillion - slippageToleranceMillionth) / oneMillion;
}

export const fromTokenUnits = (tokenUnits: number, decimals: number): bigint => {
    return 10n ** BigInt(decimals) * (BigInt(Math.round(tokenUnits * 1e18))) / BigInt(1e18);
}

export const toTokenUnits = (tokenAmount: bigint, decimals: number): number => {
    return Number(tokenAmount * 10n ** 9n) / (10 ** (decimals + 9));
}