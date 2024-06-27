
// @ts-ignore
import universalRouterData from './universalRouter.json' assert { type: "json" };

import { Interface, solidityPacked } from 'ethers';
import { CommandType, RoutePlanner, UniswapV2ForkNames, UniswapV3ForkNames } from './routerCommands.js';
import { getFewWrappedTokenAddress } from './fewTokenHelper.js';
import { type IRoutingPlan, type UniswapV3Info } from '../../common/routingPlan.js';
import { RouterBase, resolveEncodeOptions } from '../routerBase.js';
import type { IEncodeOptions } from '../types.js';

const CONTRACT_BALANCE = 2n ** 255n;
const SENDER_AS_RECIPIENT = '0x0000000000000000000000000000000000000001';
const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002';

const universalRouterInterface: Interface = new Interface(universalRouterData.abi);

const encodeV3RouteToPath = (inputTokenAddress: string, outputTokenAddress: string, feeAmount: number): string => {
    const types = ['address', 'uint24', 'address'];
    const path = [inputTokenAddress, feeAmount, outputTokenAddress];
  
    return solidityPacked(types, path)
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
            const { permitSingle, signature} = inputTokenPermit;
            planner.addCommand(CommandType.PERMIT2_PERMIT, [permitSingle, signature]);
        }

        if (wrapInput) {
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
                const { liquidityInfo } = toSwap;
                let { amountIn } = toSwap;
                if (j === toSwaps.length - 1) {
                    amountIn = CONTRACT_BALANCE;
                }

                if (
                    liquidityInfo.protocol === "UniswapV2" ||
                    liquidityInfo.protocol === "ThrusterV2-3k" ||
                    liquidityInfo.protocol === "ThrusterV2-10k" ||
                    liquidityInfo.protocol === "RingswapV2"
                ) {
                    let path = [ fromToken, toToken ];
                    if (liquidityInfo.protocol === "RingswapV2") {
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
                        toV2ForkName(liquidityInfo.protocol),
                    ]);

                    if (liquidityInfo.protocol === "RingswapV2") {
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fewWrappedToToken,
                            ROUTER_AS_RECIPIENT,
                            0n, // minAmountOut
                            false,
                        ]);
                    }
                }
                else if (
                    liquidityInfo.protocol === "UniswapV3" ||
                    liquidityInfo.protocol === "ThrusterV3" ||
                    liquidityInfo.protocol === "RingswapV3"
                ) {
                    let path: string;
                    if (liquidityInfo.protocol === "RingswapV3") {
                        const fewWrappedFromToken = getFewWrappedTokenAddress(fromToken);
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        path = encodeV3RouteToPath(fewWrappedFromToken, fewWrappedToToken, Number((liquidityInfo as UniswapV3Info).fee));

                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fromToken,
                            ROUTER_AS_RECIPIENT,
                            amountIn,
                            true,
                        ]);
                    }
                    else {
                        path = encodeV3RouteToPath(fromToken, toToken, Number((liquidityInfo as UniswapV3Info).fee));
                    }

                    planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                        ROUTER_AS_RECIPIENT,    // recipientIsUser
                        amountIn,
                        0n, // minAmountOut
                        path,
                        false,  // payerIsUser
                        toV3ForkName(liquidityInfo.protocol),
                    ]);

                    if (liquidityInfo.protocol === "RingswapV3") {
                        const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                        planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                            fewWrappedToToken,
                            ROUTER_AS_RECIPIENT,
                            0n, // minAmountOut
                            false,
                        ]);
                    }
                }
                else if (liquidityInfo.protocol === "CurveV1") {
                    planner.addCommand(CommandType.CURVE_V1, [
                        liquidityInfo.address,
                        fromToken,
                        toToken,
                        amountIn,
                        0n, // minAmountOut
                    ]);
                }
                else {
                    throw new Error(`Unknown protocol ${liquidityInfo.protocol}!`);
                }
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