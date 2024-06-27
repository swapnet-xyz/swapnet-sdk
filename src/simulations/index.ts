import type { BlockTag } from "ethers";
import { Interface, JsonRpcProvider, toQuantity } from "ethers";
import { LedgerState, permit2, addressAt, tokenAt } from "../ethers-override/index.js";

// @ts-ignore
import erc20 from '../abi/erc20.json' assert { type: "json" };
// @ts-ignore
import multicall3RevisedAbi from '../abi/multicall3Revised.json' assert { type: "json" };
// @ts-ignore
import multicall3RevisedCode from '../deployedBytecode/multicall3Revised.json' assert { type: "json" };

const erc20Interface: Interface = new Interface(erc20.abi);
const multicallInterface: Interface = new Interface(multicall3RevisedAbi.abi);
const multicallDeployedCode: string = multicall3RevisedCode.deployedBytecode;

const getGasForCalldata = (calldata: string): bigint => {

    let zeros: bigint = 0n;
    let nonZeros: bigint = 0n;

    for (let i = 0; i < calldata.length; i += 2) {
        const byteString = calldata.slice(i, i + 2);
        if (byteString === "00") {
            zeros += 1n;
        }
        else if (byteString !== "0x") {
            nonZeros += 1n;
        }
    }

    return zeros * 4n + nonZeros * 16n;
};

export class SwapSimulation {
    public static from(blockTag: BlockTag): SwapSimulation {
        return new SwapSimulation(blockTag);
    }

    private _ledgerState: LedgerState;
    private _provider: JsonRpcProvider | undefined = undefined;

    public constructor(blockTag: BlockTag) {
        this._ledgerState = LedgerState.from(blockTag);
    }

    public connect(provider: JsonRpcProvider): SwapSimulation {
        this._provider = provider;
        return this;
    }

    public async runAsync(
        senderAddress: string,
        routerAddress: string,
        tokenProxyAddress: string | undefined,
        sellTokenAddress: string,
        buyTokenAddress: string,
        sellAmount: bigint,
        calldata: string,
    ): Promise<{ gas: bigint, amountOut: bigint, }> {
        if (this._provider === undefined) {
            throw new Error(`No provider is connected with SwapSimulation.`);
        }

        const stateBuilder = this._ledgerState
            .asif(
                // suppose sender has sufficient native token (1 ether) for the Tx
                addressAt(senderAddress)
                    .balance()
                    .is("0x1000000000000000000")
            )
            .asif(
                addressAt(senderAddress)
                    .code()
                    .is(multicallDeployedCode)
            )
            .asif(
                tokenAt(sellTokenAddress)
                    .connect(this._provider)
                    .balanceOf(senderAddress)
                    .is(sellAmount + 1n)
            )
            .asif(
                tokenAt(sellTokenAddress)
                    .connect(this._provider)
                    .allowance(senderAddress, tokenProxyAddress === undefined ? routerAddress : tokenProxyAddress)
                    .is(sellAmount + 1n)
            );

        if (tokenProxyAddress !== undefined) {
            stateBuilder.asif(
                permit2(tokenProxyAddress)
                    .allowance(senderAddress, sellTokenAddress, routerAddress)
                    .is({
                        nonce: 1n,
                        expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
                        amount: sellAmount + 1n
                    })
            );
        }
        const [ blockTag, override ] = await stateBuilder.getStateAsync();

        const balanceOfCalldata = erc20Interface.encodeFunctionData("balanceOf", [ senderAddress ]);
        const multicallData = multicallInterface.encodeFunctionData("aggregate2", [[
            [buyTokenAddress, balanceOfCalldata],
            [routerAddress, calldata],
            [buyTokenAddress, balanceOfCalldata],
        ]]);

        const result = await this._provider.send("eth_call", [{
                from: senderAddress,
                to: senderAddress,
                gas: "0x4c4b40",
                gasPrice: "0x976A4E",
                value: "0x0",
                data: multicallData,
            },
            typeof (blockTag) === 'string' ? blockTag : `${toQuantity(blockTag)}`,
            override,
        ]);

        if (result.error && result.error.code === 3) {
            const error = multicallInterface.parseError(result.error.data)!;
            if (error) {
                console.log(`Parsed error: ` + error.signature);
                if (error.args.length > 0) {
                    console.log(`Parsed error: ` + error.args);
                    console.log(JSON.stringify(result));
                }
            }
        }
        // console.log(JSON.stringify(result, null, 2))
        const decodedResult = multicallInterface.decodeFunctionResult("aggregate2", result);
        const gas = BigInt(decodedResult[1][1]) + getGasForCalldata(calldata);
        const amountOut = BigInt(decodedResult[2][2]) - BigInt(decodedResult[2][0]);
        return { gas, amountOut };
    }
}