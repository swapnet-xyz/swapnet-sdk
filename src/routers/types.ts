import { type IRoutingPlan } from "../common/routingPlan.js";


export interface IRouterInfo {
    name: string;
    chainId: number;
    routerAddress: string;
    tokenProxyAddress: string | undefined;
};

export interface IRouter extends IRouterInfo {
    encode: (
        routingPlan: IRoutingPlan,
        amountOutMinimum: bigint,
        recipientAddress: string | undefined,
    ) => string; 
};