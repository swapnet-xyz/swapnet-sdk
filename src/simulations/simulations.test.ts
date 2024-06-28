import { type BlockTag, JsonRpcProvider, Network } from "ethers";

import type { ISwapResponse } from "../common/interfaces.js";
import type { IEncodeOptions } from "../routers/types.js";
import { UniversalRouter } from "../routers/universalRouter/index.js";
import { resolveEncodeOptions } from "../routers/routerBase.js";
import { parse } from "../parser.js";

import orbitToPac10k from './assets/orbitToPac10k.json' assert { type: "json" };
import orbitToEth30k from './assets/orbitToEth30k.json' assert { type: "json" };
import ethToOrbit10 from './assets/ethToOrbit10.json' assert { type: "json" };
import { SettlementSimulation } from "./index.js";

let rpcUrl: string | undefined = process.env.RPC_URL;
if (rpcUrl === undefined || rpcUrl === "") {
    throw new Error(`Failed to find rpc url from environment!`);
};

const chainId = 81457;
const network = { chainId, name: "Blast Mainnet" };
const provider = new JsonRpcProvider(
    rpcUrl,
    network,
    { staticNetwork: Network.from(network) },
);

const routerAddress: string = "0xAA539Bcf648C0b4F8984FcDEb5228827e7AAC3AE";     // universal router (proxy) deployed address
const tokenProxyAddress: string = "0x000000000022d473030f116ddee9f6b43ac78ba3";     // permit2 deployed address
const router = new UniversalRouter(chainId, routerAddress, tokenProxyAddress);

const senderAddress: string = "0x3B2Be8413F34fc6491506B18c530A264c0f7adAE";     // user address

const simulateAsync = async (
    caseName: string,
    swapResponse: ISwapResponse,
    encodeOptions: IEncodeOptions,
    blockTag: BlockTag,
): Promise<void> => {

    const routingPlan = parse(swapResponse);    // parse swapnet API response

    const { amountOutMinimum, wrapInput, unwrapOutput } = resolveEncodeOptions(routingPlan, encodeOptions);

    const calldata = router.encode(routingPlan, encodeOptions);     // use router object to encode calldata, with injected options

    // simulate the calldata with an `eth_call` RPC call, with additional state override to assume sufficient token balances and approvals
    const { amountOut } = await SettlementSimulation
        .from(blockTag)
        .connect(provider)
        .runAsync(
            senderAddress,
            router.routerAddress,
            router.tokenProxyAddress,
            routingPlan.fromToken,
            routingPlan.toToken,
            routingPlan.amountIn,
            wrapInput,
            unwrapOutput,
            calldata,
        );

    if (amountOut < amountOutMinimum) {
        throw new Error(`Case ${caseName} failed as simulated amountOut ${amountOut} is less than amountOutMinimum ${amountOutMinimum}.`);
    }
    
    console.log(`Case '${caseName}' passed simulation!`);
}

await simulateAsync('10k ORBIT to PAC', orbitToPac10k, { slippageTolerance: 0.01 }, 5358636);
await simulateAsync('30k ORBIT to ETH', orbitToEth30k, { unwrapOutput: true, slippageTolerance: 0.01 }, 5364002);
await simulateAsync('10 ETH to ORBIT', ethToOrbit10, { wrapInput: true, slippageTolerance: 0.01 }, 5371440);