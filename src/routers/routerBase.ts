import { type IRoutingPlan } from "../common/routingPlan.js";
import type { ChainId } from "../common/unames.js";
import { toAmountOutMinimum } from "../utils.js";
import { type IEncodeOptions, type IResolvedEncodeOptions, type IRouter } from "./types.js";


export abstract class RouterBase implements IRouter {

    public constructor(
        public readonly name: string,
        public readonly chainId: ChainId,
        public readonly routerAddress: string,
        public readonly tokenProxyAddress: string | undefined = undefined) {
    }

    public abstract encode(routingPlan: IRoutingPlan, options: IEncodeOptions): string;
}

export const resolveEncodeOptions = (routingPlan: IRoutingPlan, options: IEncodeOptions): IResolvedEncodeOptions => {
    let { slippageTolerance, amountOutMinimum, deadline, wrapInput, unwrapOutput } = options;

    if (slippageTolerance !== undefined && amountOutMinimum !== undefined) {
        throw new Error(`Conflict encoding options: both 'slippageTolerance' and 'amountOutMinimum' are specified.`);
    }

    if (amountOutMinimum === undefined) {
        if (slippageTolerance === undefined) {
            slippageTolerance = 0.01;
        }
        amountOutMinimum = toAmountOutMinimum(routingPlan.to.amount, slippageTolerance);
    }


    if (wrapInput === undefined) {
        wrapInput = false;
    }

    if (unwrapOutput === undefined) {
        unwrapOutput = false;
    }

    return {
        amountOutMinimum,
        wrapInput,
        unwrapOutput,
        deadline,
    };
}