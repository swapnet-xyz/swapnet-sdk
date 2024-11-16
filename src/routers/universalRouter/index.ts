
import { Interface } from 'ethers';

// @ts-ignore
import universalRouterData from '../../abi/universalRouter.json' assert { type: "json" };
import { type IRoutingPlan } from '../../common/routingPlan.js';
import { universalRouterUname, type ChainIdType } from '../../common/unames.js';
import { PERMIT2_ADDRESS } from '../../ethers-override/permit2AsIf.js';
import { RouterBase, resolveEncodeOptions } from '../routerBase.js';
import type { IEncodeOptions } from '../types.js';

import { deployedAddressesByChainId } from './addresses.js';
import { CommandType, CONTRACT_BALANCE, RoutePlanner, ROUTER_AS_RECIPIENT, SENDER_AS_RECIPIENT, type IPermitWithSignature } from './routerCommands.js';
import { universalRouterPluginByLiquiditySourceUname } from '../../liquiditySourcePlugins/universalRouterPlugins.js';


const universalRouterInterface: Interface = new Interface(universalRouterData.abi);

export class UniversalRouter extends RouterBase {
    public constructor(_chainId: ChainIdType, _routerAddress: string, _tokenProxyAddress: string = PERMIT2_ADDRESS) {
        super(universalRouterUname, _chainId, _routerAddress, _tokenProxyAddress);
    }

    public encode(
        routingPlan: IRoutingPlan,
        options: IEncodeOptions & 
        {
            inputTokenPermit?: IPermitWithSignature,
        }
    ): string {
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

        const { tokenOps, amountIn, fromToken, toToken, } = routingPlan
        const planner = new RoutePlanner();


        if (inputTokenPermit !== undefined) {
            const { permit, signature} = inputTokenPermit;
            planner.addCommand(CommandType.PERMIT2_PERMIT, [ permit, signature ]);
        }

        if (wrapInput) {
            planner.addCommand(CommandType.WRAP_ETH, [ ROUTER_AS_RECIPIENT, amountIn ]);
        }
        else {
            planner.addCommand(CommandType.PERMIT2_TRANSFER_FROM, [
                fromToken,
                ROUTER_AS_RECIPIENT,
                amountIn,
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
            planner.addCommand(CommandType.SWEEP, [toToken, recipientAddress, amountOutMinimum]);
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
    }
}

export const universalRouterByChainId: Map<ChainIdType, UniversalRouter> = new Map();

Object.entries(deployedAddressesByChainId).map(([chainIdStr, routerAddress]) => {
    const chainId = parseInt(chainIdStr) as ChainIdType;
    universalRouterByChainId.set(chainId, new UniversalRouter(chainId, routerAddress));
});