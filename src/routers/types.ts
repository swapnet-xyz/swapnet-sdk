import { type IRoutingPlan } from "../common/routingPlan.js";
import type { ChainId } from "../common/unames.js";


export interface IEncodeOptions {
    slippageTolerance?: number,
    amountOutMinimum?: bigint,
    recipientAddress?: string,
    deadline?: bigint,
    wrapInput?: boolean,
    unwrapOutput?: boolean,
};

export interface IResolvedEncodeOptions {
    amountOutMinimum: bigint,
    wrapInput: boolean,
    unwrapOutput: boolean,
    deadline: bigint | undefined,
};

export interface IRouterInfo {
    name: string;
    chainId: ChainId;
    routerAddress: string;
    tokenProxyAddress: string | undefined;
};

export interface IRouter extends IRouterInfo {
    encode: (
        routingPlan: IRoutingPlan,
        options: IEncodeOptions,
    ) => string; 
};

export type RouterFactType = {
    address: string,
    tokenProxy?: string,
};