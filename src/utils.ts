
import { type TokenOperation } from "./common/routingPlan.js";
import { ChainId } from "./common/unames.js";


export type TokenOperationNodeType =
    'SOURCE' |
    'PASSING_THROUGH' |
    'MERGING' |
    'FORKING' |
    'DESTINATION';

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
};

export const toAmountOutMinimum = (amountOut: bigint, slippageTolerance: number): bigint => {
    const slippageToleranceMillionth = BigInt(Math.floor(slippageTolerance * 10 ** 6));
    const oneMillion = BigInt(10 ** 6); 
    return amountOut * (oneMillion - slippageToleranceMillionth) / oneMillion;
};

export const fromTokenUnits = (tokenUnits: number, decimals: number): bigint => {
    return 10n ** BigInt(decimals) * (BigInt(Math.round(tokenUnits * 1e18))) / BigInt(1e18);
};

export const toTokenUnits = (tokenAmount: bigint, decimals: number): number => {
    return Number(tokenAmount * 10n ** 9n) / (10 ** (decimals + 9));
};

export const toCanonicalCase = (address: string, chainId?: ChainId): string => {
    if (chainId === ChainId.Solana || chainId === ChainId.Sui) {
        return address;
    }
    return address.toLowerCase();
};

declare global {
  interface String {
    toCanonicalCase(chainId?: ChainId): string;
  }
}

String.prototype.toCanonicalCase = function (chainId?: ChainId): string {
  return toCanonicalCase(this.toString(), chainId);
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));