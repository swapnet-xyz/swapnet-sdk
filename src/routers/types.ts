import { type IRoutingPlan } from "../common/routingPlan.js";


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
    chainId: number;
    routerAddress: string;
    tokenProxyAddress: string | undefined;
};

export interface IRouter extends IRouterInfo {
    encode: (
        routingPlan: IRoutingPlan,
        options: IEncodeOptions,
    ) => string; 
};