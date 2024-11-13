
import { Interface, solidityPacked } from 'ethers';

// @ts-ignore
import universalRouterData from '../../abi/universalRouter.json' assert { type: "json" };
import { type IRoutingPlan, type UniswapV3Info } from '../../common/routingPlan.js';
import { PERMIT2_ADDRESS } from '../../ethers-override/permit2AsIf.js';
import { RouterBase, resolveEncodeOptions } from '../routerBase.js';
import type { IEncodeOptions } from '../types.js';

import { deployedAddressesByChainId } from './addresses.js';
import { getFewWrappedTokenAddress } from './fewTokenHelper.js';
import { CommandType, RoutePlanner, UniswapV2ForkNames, UniswapV3ForkNames, type IPermitWithSignature } from './routerCommands.js';
import { ChainId, LiquiditySourceUname, universalRouterUname } from '../../common/unames.js';


const CONTRACT_BALANCE = 2n ** 255n;
const SENDER_AS_RECIPIENT = '0x0000000000000000000000000000000000000001';
const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002';

const universalRouterInterface: Interface = new Interface(universalRouterData.abi);

const encodeV3RouteToPath = (inputTokenAddress: string, outputTokenAddress: string, feeAmount: number): string => {
    const types = ['address', 'uint24', 'address'];
    const path = [inputTokenAddress, feeAmount, outputTokenAddress];
  
    return solidityPacked(types, path)
}

const toV2ForkName = (source: LiquiditySourceUname): UniswapV2ForkNames => {
    if (source === LiquiditySourceUname.UniswapV2) {
        return UniswapV2ForkNames.Uniswap;
    }
    else if (source === LiquiditySourceUname.ThrusterV2_3k) {
        return UniswapV2ForkNames.Thruster3k;
    }
    else if (source === LiquiditySourceUname.ThrusterV2_10k) {
        return UniswapV2ForkNames.Thruster10k;
    }
    else if (source === LiquiditySourceUname.RingswapV2) {
        return UniswapV2ForkNames.Ringswap;
    }

    throw new Error(`Invalid V2 liquidity source ${source}!`);
}

const toV3ForkName = (source: LiquiditySourceUname): UniswapV3ForkNames => {
    if (source === LiquiditySourceUname.UniswapV3) {
        return UniswapV3ForkNames.Uniswap;
    }
    else if (source === LiquiditySourceUname.ThrusterV3) {
        return UniswapV3ForkNames.Thruster;
    }
    // else if (source === LiquiditySourceUname.RingswapV3) {
    //     return UniswapV3ForkNames.Ringswap;
    // }

    throw new Error(`Invalid V3 protocol ${source}!`);
}

export class UniversalRouter extends RouterBase {
    public constructor(_chainId: number, _routerAddress: string, _tokenProxyAddress: string = PERMIT2_ADDRESS) {
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

                const fromToken = tokenOp.tokenInfo.address;
                const toToken = toSwap.toTokenOp.tokenInfo.address;
                const { liquidityInfo } = toSwap;
                let { amountIn } = toSwap;
                if (j === toSwaps.length - 1) {
                    amountIn = CONTRACT_BALANCE;
                }

                if (
                    liquidityInfo.source === LiquiditySourceUname.UniswapV2 ||
                    liquidityInfo.source === LiquiditySourceUname.ThrusterV2_3k ||
                    liquidityInfo.source === LiquiditySourceUname.ThrusterV2_10k ||
                    liquidityInfo.source === LiquiditySourceUname.RingswapV2
                ) {
                    let path = [ fromToken, toToken ];
                    if (liquidityInfo.source === LiquiditySourceUname.RingswapV2) {
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
                        toV2ForkName(liquidityInfo.source),
                    ]);

                    if (liquidityInfo.source === LiquiditySourceUname.RingswapV2) {
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
                    liquidityInfo.source === LiquiditySourceUname.UniswapV3 ||
                    // liquidityInfo.source === LiquiditySourceUname.RingswapV3
                    liquidityInfo.source === LiquiditySourceUname.ThrusterV3
                ) {
                    let path: string;
                    // if (liquidityInfo.source === LiquiditySourceUname.RingswapV3) {
                    //     const fewWrappedFromToken = getFewWrappedTokenAddress(fromToken);
                    //     const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                    //     path = encodeV3RouteToPath(fewWrappedFromToken, fewWrappedToToken, Number((liquidityInfo as UniswapV3Info).fee));

                    //     planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                    //         fromToken,
                    //         ROUTER_AS_RECIPIENT,
                    //         amountIn,
                    //         true,
                    //     ]);
                    // }
                    // else {
                    path = encodeV3RouteToPath(fromToken, toToken, Number((liquidityInfo as UniswapV3Info).fee));
                    // }

                    planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                        ROUTER_AS_RECIPIENT,    // recipientIsUser
                        amountIn,
                        0n, // minAmountOut
                        path,
                        false,  // payerIsUser
                        toV3ForkName(liquidityInfo.source),
                    ]);

                    // if (liquidityInfo.source === LiquiditySourceUname.RingswapV3) {
                    //     const fewWrappedToToken = getFewWrappedTokenAddress(toToken);
                    //     planner.addCommand(CommandType.WRAP_UNWRAP_FEW_TOKEN, [
                    //         fewWrappedToToken,
                    //         ROUTER_AS_RECIPIENT,
                    //         0n, // minAmountOut
                    //         false,
                    //     ]);
                    // }
                }
                else if (liquidityInfo.source === LiquiditySourceUname.CurveV1) {
                    planner.addCommand(CommandType.CURVE_V1, [
                        liquidityInfo.address,
                        fromToken,
                        toToken,
                        amountIn,
                        0n, // minAmountOut
                    ]);
                }
                else {
                    throw new Error(`Unknown protocol ${liquidityInfo.source}!`);
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

export const universalRouterByChainId: Map<ChainId, UniversalRouter> = new Map();

Object.entries(deployedAddressesByChainId).map(([chainIdStr, routerAddress]) => {
    const chainId: ChainId = parseInt(chainIdStr);
    universalRouterByChainId.set(chainId, new UniversalRouter(chainId, routerAddress));
});