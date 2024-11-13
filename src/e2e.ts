
import { Wallet, Contract } from "ethers";

// @ts-ignore
import erc20Abi from './abi/erc20.json' assert { type: "json" };
// @ts-ignore
import permit2Abi from './abi/permit2.json' assert { type: "json" };
import { parse, SwapnetClient, type IEncodeOptions, universalRouterByChainId, PERMIT2_ADDRESS, ChainId } from "./index.js";

const approveAsync = async (
    sellTokenAddress: string,
    sellAmount: bigint,
    ownerWallet: Wallet,
    spender: string,
): Promise<{ erc20ApprovalTxHash: string, permit2ApprovalTxHash: string, }> => {

    // approve permit2 contract to spend sellToken
    const tokenContract = new Contract(sellTokenAddress, erc20Abi.abi, ownerWallet);
    const erc20ApprovalTx = await tokenContract.approve(PERMIT2_ADDRESS, sellAmount);
    await erc20ApprovalTx.wait();

    // approve spender to spend sellToken from permit2 contract
    const permit2 = new Contract(PERMIT2_ADDRESS, permit2Abi.abi, ownerWallet);
    const permit2ApprovalTx = await permit2.approve(sellTokenAddress, spender, sellAmount, /* expiration = uint48.max */ (2n ** 48n - 1n));
    await permit2ApprovalTx.wait();

    return { erc20ApprovalTxHash: erc20ApprovalTx.hash, permit2ApprovalTxHash: permit2ApprovalTx.hash };
};

export const tradeE2eAsync = async (
    chainId: ChainId,
    sellTokenAddress: string,
    buyTokenAddress: string,
    sellAmount: bigint,
    encodeOptions: IEncodeOptions,
    senderWallet: Wallet,
    maxFeePerGas: bigint,
    maxPriorityFeePerGas: bigint,
    swapnetApiKey: string,
): Promise<{ error?: string, erc20ApprovalTxHash?: string, permit2ApprovalTxHash?: string, swapTxHash?: string }> => {

    let erc20ApprovalTxHash: string | undefined = undefined;
    let permit2ApprovalTxHash: string | undefined = undefined;
    let swapTxHash: string | undefined = undefined;
    let error: string | undefined = undefined;
    try {
        // create SwapNet client object
        const client = new SwapnetClient(swapnetApiKey);
    
        // query SwapNet API for optimal routing plan
        const res = await client.swapAsync(
            chainId,
            sellTokenAddress,
            buyTokenAddress,
            sellAmount,
            undefined,
        );
        if (!res.succeeded) {
            throw new Error(res.error);
        }

        // parse SwapNet API response
        const routingPlan = parse(res.swapResponse);

        // get router object by chainId
        const router = universalRouterByChainId.get(chainId);
        if (router === undefined) {
            throw new Error(`Router for chainId ${chainId} not found.`);
        }
    
        // use router to encode calldata, with injected options
        const calldata = router.encode(routingPlan, encodeOptions);

        // set allowances for sellToken, with permit2 contract
        const approvals = await approveAsync(sellTokenAddress, sellAmount, senderWallet, router.routerAddress);
        erc20ApprovalTxHash = approvals.erc20ApprovalTxHash;
        permit2ApprovalTxHash = approvals.permit2ApprovalTxHash;

        // build & send swap transaction
        const unsignedTx = await senderWallet.populateTransaction({
            chainId,
            to: router.routerAddress,
            data: calldata,
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            value: 0n,
            gasLimit: 1000000n,
        });
        const swapTx = await senderWallet.sendTransaction(unsignedTx);
        swapTxHash = swapTx.hash;
        await swapTx.wait();
    }
    catch(e) {
        error = (e as Error).message;
    }
    finally {
        return { error, erc20ApprovalTxHash, permit2ApprovalTxHash, swapTxHash };
    }
};