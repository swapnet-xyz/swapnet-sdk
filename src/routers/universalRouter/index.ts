
import { Interface } from 'ethers';

// @ts-ignore
import universalRouterData from '../../abi/universalRouter.json' assert { type: "json" };
import { type IRoutingPlan } from '../../common/routingPlan.js';
import { RouterBase, resolveEncodeOptions } from '../routerBase.js';
import type { IEncodeOptions } from '../types.js';

import { CommandType, CONTRACT_BALANCE, RoutePlanner, ROUTER_AS_RECIPIENT, SENDER_AS_RECIPIENT, type IPermitWithSignature } from './routerCommands.js';
import { universalRouterPluginByLiquiditySourceUname } from '../../liquiditySourcePlugins/universalRouterPlugins.js';
import { getAvailableChainIds, getPerChainFact, type PartialRecord } from '../../common/typeUtils.js';
import { ChainId, RouterUname } from '../../common/unames.js';
import { universalContractAllChainsFact } from './fact.js';


const universalRouterInterface: Interface = new Interface(universalRouterData.abi);

export const encodeForUniversalRouter = (
    routingPlan: IRoutingPlan,
    options: IEncodeOptions & {
        inputTokenPermit?: IPermitWithSignature,
    }
): string => {
    const {
        amountOutMinimum,
        wrapInput,
        unwrapOutput,
        deadline,
    } = resolveEncodeOptions(routingPlan, options);

    let { inputTokenPermit, recipientAddress } = options;

    if (recipientAddress === undefined) {
        recipientAddress = SENDER_AS_RECIPIENT;
    }

    const { tokenOps, from, to, } = routingPlan
    const planner = new RoutePlanner();


    if (inputTokenPermit !== undefined) {
        const { permit, signature} = inputTokenPermit;
        planner.addCommand(CommandType.PERMIT2_PERMIT, [ permit, signature ]);
    }

    if (wrapInput) {
        planner.addCommand(CommandType.WRAP_ETH, [ ROUTER_AS_RECIPIENT, from.amount ]);
    }
    else {
        planner.addCommand(CommandType.PERMIT2_TRANSFER_FROM, [
            from.address,
            ROUTER_AS_RECIPIENT,
            from.amount,
        ]);
    }

    tokenOps.forEach(tokenOp => {
        const { toSwaps } = tokenOp;
        if (toSwaps.length === 0) {
            return;
        }

        toSwaps.sort((r1, r2) => Number(BigInt(r1.amountIn) - BigInt(r2.amountIn)));

        toSwaps.forEach((toSwap, j) => {

            const fromTokenAddress = tokenOp.tokenInfo.address;
            const toTokenAddress = toSwap.toTokenOp.tokenInfo.address;
            const { liquidityInfo } = toSwap;
            let { amountIn } = toSwap;
            if (j === toSwaps.length - 1) {
                amountIn = CONTRACT_BALANCE;
            }

            const plugin = universalRouterPluginByLiquiditySourceUname[liquidityInfo.source];

            if (plugin === undefined) {
                throw new Error(`Unknown liquidity source ${liquidityInfo.source}!`);
            }

            plugin.addToPlanner(fromTokenAddress, toTokenAddress, amountIn, liquidityInfo, planner);
        });
    });

    if (unwrapOutput) {
        planner.addCommand(CommandType.UNWRAP_WETH, [recipientAddress, amountOutMinimum]);
    } else {
        planner.addCommand(CommandType.SWEEP, [to.address, recipientAddress, amountOutMinimum]);
    }

    const { commands, inputs } = planner;

    let calldata: string;
    if (deadline === undefined) {
        calldata = universalRouterInterface.encodeFunctionData('execute(bytes,bytes[])', [
            commands,
            inputs,
        ]);
    }
    else {
        calldata = universalRouterInterface.encodeFunctionData('execute(bytes,bytes[],uint256)', [
            commands,
            inputs,
            options.deadline,
        ]);
    }

    return calldata;
};

export class UniversalRouter extends RouterBase {
    public constructor(chainId: ChainId) {
        const { address, tokenProxy, } = getPerChainFact(universalContractAllChainsFact, chainId);
        super(RouterUname.Universal, chainId, address, tokenProxy);
    }

    public encode(
        routingPlan: IRoutingPlan,
        options: IEncodeOptions & 
        {
            inputTokenPermit?: IPermitWithSignature,
        }
    ): string {
        return encodeForUniversalRouter(routingPlan, options);
    }
}

export const universalRouterByChainId: PartialRecord<ChainId, UniversalRouter> = {};
getAvailableChainIds(universalContractAllChainsFact).forEach(chainId => {
    Object.assign(universalRouterByChainId, { [chainId]: new UniversalRouter(chainId)});
});