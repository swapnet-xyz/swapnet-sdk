
import { pack } from '@ethersproject/solidity'
// @ts-ignore
import UniversalRouterData from '@uniswap/universal-router/artifacts/contracts/UniversalRouter.sol/UniversalRouter.json' assert { type: "json" };

import { Interface } from 'ethers';
import { CommandType, RoutePlanner, UniswapV2ForkNames, UniswapV3ForkNames } from './routerCommands.js';
import { CONTRACT_BALANCE, ROUTER_AS_RECIPIENT, SENDER_AS_RECIPIENT } from './constants.js';
import { getFewWrappedTokenAddress } from './fewTokenHelper.js';
import { type IRoutingPlan, type UniswapV3Info } from '../../common/routingPlan.js';
import { RouterBase } from '../routerBase.js';
import type { IEncodeOptions } from '../types.js';

const universalRouterInterface: Interface = new Interface(UniversalRouterData.abi);

const encodeV3RouteToPath = (inputTokenAddress: string, outputTokenAddress: string, feeAmount: number): string => {
    const types = ['address', 'uint24', 'address'];
    const path = [inputTokenAddress, feeAmount, outputTokenAddress];
  
    return pack(types, path)
}

const toV2ForkName = (protocol: string): UniswapV2ForkNames => {
    if (protocol === "UniswapV2") {
        return UniswapV2ForkNames.Uniswap;
    }
    else if (protocol === "ThrusterV2-3k") {
        return UniswapV2ForkNames.Thruster3k;
    }
    else if (protocol === "ThrusterV2-10k") {
        return UniswapV2ForkNames.Thruster10k;
    }
    else if (protocol === "RingswapV2") {
        return UniswapV2ForkNames.Ringswap;
    }

    throw new Error(`Invalid V2 protocol ${protocol}!`);
}

const toV3ForkName = (protocol: string): UniswapV3ForkNames => {
    if (protocol === "UniswapV3") {
        return UniswapV3ForkNames.Uniswap;
    }
    else if (protocol === "ThrusterV3") {
        return UniswapV3ForkNames.Thruster;
    }
    else if (protocol === "RingswapV3") {
        return UniswapV3ForkNames.Ringswap;
    }

    throw new Error(`Invalid V3 protocol ${protocol}!`);
}

export class UniversalRouter extends RouterBase {
    public constructor(_chainId: number, _routerAddress: string | undefined = undefined, _tokenProxyAddress: string | undefined = undefined) {
        super("universal router", _chainId, _routerAddress, _tokenProxyAddress);
    }

    public encode(
        routingPlan: IRoutingPlan,
        options: IEncodeOptions & 
        {
            inputTokenPermit?: {
                permitSingle: string,
                signature: string,
            },
        }
    ): string {
        const {
            amountOutMinimum,
            isInputNative,
            isOutputNative,
            deadline,
        } = this.resolveEncodeOptions(routingPlan, options);

        let { inputTokenPermit, recipientAddress } = options;

        if (recipientAddress === undefined) {
            recipientAddress = SENDER_AS_RECIPIENT;
        }

        const { tokenOps, amountIn, fromToken, toToken, } = routingPlan
        const planner = new RoutePlanner();


        if (inputTokenPermit !== undefined) {
            const { permitSingle, signature} = inputTokenPermit;
            planner.addCommand(CommandType.PERMIT2_PERMIT, [permitSingle, signature]);
        }

        if (isInputNative) {
            planner.addCommand(CommandType.WRAP_ETH, [ROUTER_AS_RECIPIENT, amountIn]);
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

                const fromToken = tokenOp.tokenInfo.address;
                const toToken = toSwap.toTokenOp.tokenInfo.address;
                const { lsInfo } = toSwap;
                let { amountIn } = toSwap;
                if (j === toSwaps.length - 1) {
                    amountIn = CONTRACT_BALANCE;
                }

                if (
                    lsInfo.protocol === "UniswapV2" ||
                    lsInfo.protocol === "ThrusterV2-3k" ||
                    lsInfo.protocol === "ThrusterV2-10k" ||
                    lsInfo.protocol === "RingswapV2"
                ) {
                    let path = [ fromToken, toToken ];
                    if (lsInfo.protocol === "RingswapV2") {
                        const fewWrappedFromToken = getFewWrappedTokenAddress(fromToken);
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        path = [ fewWrappedFromToken, fewWrappedToToken ];

                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fromToken,
                            ROUTER_AS_RECIPIENT,
                            amountIn,
                            true,
                        ]);
                    }

                    planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                        ROUTER_AS_RECIPIENT,    // recipientIsUser
                        amountIn,
                        0n, // minAmountOut
                        path,
                        false,  // payerIsUser
                        toV2ForkName(lsInfo.protocol),
                    ]);

                    if (lsInfo.protocol === "RingswapV2") {
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fewWrappedToToken,
                            ROUTER_AS_RECIPIENT,
                            amountOutMinimum,
                            false,
                        ]);
                    }
                }
                else if (
                    lsInfo.protocol === "UniswapV3" ||
                    lsInfo.protocol === "ThrusterV3" ||
                    lsInfo.protocol === "RingswapV3"
                ) {
                    let path: string;
                    if (lsInfo.protocol === "RingswapV3") {
                        const fewWrappedFromToken = getFewWrappedTokenAddress(fromToken);
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        path = encodeV3RouteToPath(fewWrappedFromToken, fewWrappedToToken, Number((lsInfo as UniswapV3Info).fee));

                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fromToken,
                            ROUTER_AS_RECIPIENT,
                            amountIn,
                            true,
                        ]);
                    }
                    else {
                        path = encodeV3RouteToPath(fromToken, toToken, Number((lsInfo as UniswapV3Info).fee));
                    }

                    planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                        ROUTER_AS_RECIPIENT,    // recipientIsUser
                        amountIn,
                        0n, // minAmountOut
                        path,
                        false,  // payerIsUser
                        toV3ForkName(lsInfo.protocol),
                    ]);

                    if (lsInfo.protocol === "RingswapV3") {
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fewWrappedToToken,
                            ROUTER_AS_RECIPIENT,
                            amountOutMinimum,
                            false,
                        ]);
                    }
                }
                else if (lsInfo.protocol === "CurveV1") {
                    planner.addCommand(CommandType.CURVE_V1, [
                        lsInfo.address,
                        fromToken,
                        toToken,
                        amountIn,
                        0n, // minAmountOut
                    ]);
                }
                else {
                    throw new Error(`Unknown protocol ${lsInfo.protocol}!`);
                }
            });
        });

        if (isOutputNative) {
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