
import { ChainId } from "./unames.js";

export type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T; };

export type AllChainsFact<TPerChainFact> = {
    default: Partial<TPerChainFact>;
    // list all chains that this liquidity source is known to be available on
    // missing chains are considered not deployed
    overrideByChain: PartialRecord<ChainId, Partial<TPerChainFact>>;
};

export const getPerChainFact = <TPerChainFact>(allChainsFact: AllChainsFact<TPerChainFact>, chainId: ChainId): TPerChainFact => {
    const { default: defaultFact, overrideByChain } = allChainsFact;
    if (overrideByChain[chainId] === undefined) {
        throw new Error(`Liquidity source is not deployed on chain ${chainId}!`);
    }

    return {
        ...defaultFact,
        ...overrideByChain[chainId],
    } as TPerChainFact;
};