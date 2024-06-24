
import { pack } from '@ethersproject/solidity'
// @ts-ignore
import UniversalRouter from '@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json' assert { type: "json" };

import { Interface } from 'ethers';
import { CommandType, RoutePlanner } from './routerCommands.js';
import { CONTRACT_BALANCE, ROUTER_AS_RECIPIENT, SENDER_AS_RECIPIENT } from './constants.js';
import { accountingModelByLsType, type TokenOperation, type IRoutingPlan, type UniswapV3Info } from '../../common/routingPlan.js';
import { toNodeType } from '../../utils.js';

const universalRouterInterface: Interface = new Interface(UniversalRouter.abi);

function encodeV3RouteToPath(inputTokenAddress: string, outputTokenAddress: string, feeAmount: number): string {
    const types = ['address', 'uint24', 'address'];
    const path = [inputTokenAddress, feeAmount, outputTokenAddress];
  
    return pack(types, path)
}

const toCustody = (tokenOp: TokenOperation): boolean => {
    const nodeType = toNodeType(tokenOp);
    const { fromSwaps, toSwaps, } = tokenOp;
  
    if (nodeType === 'SOURCE') {
        if (toSwaps.some(t => accountingModelByLsType.get(t.lsInfo.protocol)!.othersAsPayer === false)) {
            return true;
        }
        return false;
    }
    else if (nodeType === 'DESTINATION') {
        if (fromSwaps.length > 1) {
          return true;
        }
        if (fromSwaps.some(f => accountingModelByLsType.get(f.lsInfo.protocol)!.othersAsRecipient === false)) {
          return true;
        }
        return false;
    }
    return true;
}

export const optimizeAndEncodeForUniswap = (
    routingPlan: IRoutingPlan,
    amountOutMinimum: bigint,
    recipientAddress: string | undefined = undefined
): string => {

    const { tokenOps, } = routingPlan;

    let recipient: string = recipientAddress === undefined ? SENDER_AS_RECIPIENT : recipientAddress;

    const planner = new RoutePlanner();

    tokenOps.forEach((tokenOp, i) => {
        const toSwaps = tokenOp.toSwaps;
        if (toSwaps.length === 0) {
            return;
        }
        toSwaps.sort((r1, r2) => Number(BigInt(r1.amountIn) - BigInt(r2.amountIn)));
        toSwaps.forEach((toSwap, j) => {

            const fromToken = tokenOp.tokenInfo.address;
            const toToken = toSwap.toTokenOp.tokenInfo.address;

            const payerIsUser = i === 0;
            // console.log(`custody: ${!payerIsUser} for node ${tokenOp.tokenInfo.symbol}`);
            const recipientIsUser = !toCustody(toSwap.toTokenOp);
            // console.log(`custody: ${!recipientIsUser} for node ${toSwap.toTokenOp.tokenInfo.symbol}`);
            const minAmountOut = recipientIsUser ? amountOutMinimum : 0n;
            let amountIn = BigInt(toSwap.amountIn);
            if (!payerIsUser && j === toSwaps.length - 1) {
                amountIn = CONTRACT_BALANCE;
            }

            if (toSwap.lsInfo.protocol === "UniswapV2" || toSwap.lsInfo.protocol === "UniswapV3") {
                let commandType: CommandType;
                let path: string | string [];
                if (toSwap.lsInfo.protocol === "UniswapV2") {
                    commandType = CommandType.V2_SWAP_EXACT_IN;
                    path = [ fromToken, toToken ]
                }
                else {
                    // if (toSwap.lsInfo.protocol === "UniswapV3")
                    const lsInfo = toSwap.lsInfo as UniswapV3Info;
                    commandType = CommandType.V3_SWAP_EXACT_IN;
                    path = encodeV3RouteToPath(fromToken, toToken, Number(lsInfo.fee));
                }

                planner.addCommand(commandType, [
                    recipientIsUser ? recipient : ROUTER_AS_RECIPIENT,
                    amountIn,
                    minAmountOut,
                    path,
                    payerIsUser,
                ]);
                // console.log(`V2V3_SWAP_EXACT_IN: ${recipientIsUser ? recipient : ROUTER_AS_RECIPIENT}, ${amountIn}, ${minAmountOut}, ${payerIsUser}, ${path}`);
            }
            else if (toSwap.lsInfo.protocol === "CurveV1") {
                if (payerIsUser) {
                    planner.addCommand(CommandType.PERMIT2_TRANSFER_FROM, [
                        fromToken,
                        ROUTER_AS_RECIPIENT,
                        amountIn,
                    ]);
                    // console.log(`PERMIT2_TRANSFER_FROM: ${fromToken}, ${amountIn}`);
                }
                planner.addCommand(CommandType.CURVE_V1, [
                    toSwap.lsInfo.address,
                    fromToken,
                    toToken,
                    amountIn,
                    minAmountOut,
                ]);
                // console.log(`CURVE_V1: ${toSwap.lsInfo.address}, ${amountIn}, ${minAmountOut}, ${fromToken}, ${toToken}`);
                if (recipientIsUser) {
                    planner.addCommand(CommandType.SWEEP, [
                        routingPlan.toToken,
                        recipient,
                        amountOutMinimum,
                    ]);
                    // console.log(`SWEEP_CURVE: ${routingPlan.toToken}, ${recipient}, ${amountOutMinimum}`);
                }
            }
            else {
                throw new Error(`Unknown protocol ${toSwap.lsInfo.protocol}!`);
            }
        });
    });

    if (toCustody(tokenOps[tokenOps.length - 1])) {
        // recipientIsUser === false holds for sure
        planner.addCommand(CommandType.SWEEP, [
            routingPlan.toToken,
            recipient,
            amountOutMinimum,
        ]);
        // console.log(`SWEEP_FINAL: ${routingPlan.toToken}, ${recipient}, ${amountOutMinimum}`);
    }

    const { commands, inputs } = planner
    const calldata = universalRouterInterface.encodeFunctionData('execute(bytes,bytes[])', [commands, inputs])

    return calldata;
}