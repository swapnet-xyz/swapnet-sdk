import { type IRoutingPlan } from "../common/routingPlan.js";
import { defaultRouters } from "./routerInfo.js";
import { type IRouter } from "./types.js";


export abstract class RouterBase implements IRouter {
    public readonly name: string;
    public readonly chainId: number;
    public readonly routerAddress: string;
    public readonly tokenProxyAddress: string;

    public constructor(_name: string, _chainId: number, _routerAddress: string | undefined = undefined, _tokenProxyAddress: string | undefined = undefined) {
        this.name = _name;
        this.chainId = _chainId;

        const defaultRouterInfo = defaultRouters.find(r => r.name === this.name && r.chainId === this.chainId);
        if (defaultRouterInfo === undefined) {
            if (_routerAddress === undefined || _tokenProxyAddress === undefined) {
                throw new Error(`Unable to find ${this.name} on chain ${this.chainId}!`);
            }
            this.routerAddress = _routerAddress;
            this.tokenProxyAddress = _tokenProxyAddress;
            return;
        }

        if (defaultRouterInfo.tokenProxyAddress === undefined) {
            throw new Error(`Invalid router info for ${this.name}: missing tokenProxyAddress!`);
        }

        this.routerAddress = _routerAddress === undefined ? defaultRouterInfo.routerAddress : _routerAddress;
        this.tokenProxyAddress = _tokenProxyAddress === undefined ? defaultRouterInfo.tokenProxyAddress : _tokenProxyAddress;
    }

    public abstract encode(routingPlan: IRoutingPlan, amountOutMinimum: bigint, recipientAddress: string | undefined): string;
}