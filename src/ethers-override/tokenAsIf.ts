
import { Interface, JsonRpcApiProvider, keccak256, solidityPacked, toBeHex, zeroPadValue } from "ethers";
import { AddressAsIf } from "./addressAsIf.js";
import type { Access } from "./types.js";
// @ts-ignore
import erc20 from '../abi/erc20.json' assert { type: "json" };

const erc20Interface: Interface = new Interface(erc20.abi);

const findSlotKeyInternal = async (toAddress: string, data: string, provider: JsonRpcApiProvider): Promise<string []> => {

    const params = [{
        to: toAddress,
        gas: "0xac4b",
        gasPrice: "0x9184e72a000",
        value: "0x0",
        data,
    }];
    const res = await provider.send("eth_createAccessList", params);
    // console.log(JSON.stringify(res, null, 2));

    const access = (res.accessList as Access []).find(a => a.address.toLowerCase() === toAddress.toLowerCase());
    if (access === undefined || access.storageKeys === undefined) {
        throw new Error(`Failed to get slot keys for address ${toAddress} with calldata: ${data}.`);
    }
    return access.storageKeys.filter(key => !key.startsWith("0x000000000000000000000000")).map(key => key.toLowerCase());
}

const getBalanceOfSlotKey = (ownerAddress: string, mappingSlotNumber: number): string => {
    return keccak256(zeroPadValue(ownerAddress, 32) + toBeHex(mappingSlotNumber, 32).slice(2)).toLowerCase();
}

const balanceOfSlotNumberByToken: Map<string, number> = new Map();


const getAllowanceSlotKey = (ownerAddress: string, spenderAddress: string, mappingSlotNumber: number): string => {
    return keccak256(
        zeroPadValue(spenderAddress, 32)
        + keccak256(
            zeroPadValue(ownerAddress, 32)
            + toBeHex(mappingSlotNumber, 32).slice(2)
        ).slice(2)
    );
}

const allowanceSlotNumberByToken: Map<string, number> = new Map();

export class TokenAsIf extends AddressAsIf {
    private _method: "balanceOf" | "allowance" | undefined = undefined;
    private _provider: JsonRpcApiProvider | undefined = undefined;

    public constructor(address: string) {
        super(address);
    }

    public connect(provider: JsonRpcApiProvider): TokenAsIf {
        this._provider = provider;
        return this;
    }

    public balanceOf(ownerAddress: string): TokenAsIf {
        this._method = "balanceOf";

        const mapSlotNumber = balanceOfSlotNumberByToken.get(this.address);
        if (mapSlotNumber === undefined) {
            const calldata = erc20Interface.encodeFunctionData("balanceOf", [ownerAddress]);

            if (this._provider === undefined) {
                throw new Error(`Could not detect balanceOf mapping slot number as no provider is connected to TokenAsIf ${this.address}.`);
            }

            const promise = findSlotKeyInternal(this.address, calldata, this._provider)
            .then(visitedSlotKeys => {
                for (let mappingSlotNumber = 0; mappingSlotNumber < 20; mappingSlotNumber++) {
                    const key = getBalanceOfSlotKey(ownerAddress, mappingSlotNumber);
                    const slotKey = visitedSlotKeys.find(vk => vk === key);
                    if (slotKey !== undefined) {
                        // console.log(`slotNumber: ${mappingSlotNumber}`);
                        balanceOfSlotNumberByToken.set(this.address, mappingSlotNumber);
                        super.stateDiff(slotKey);
                        return;
                    }
                }
                throw new Error(`Failed to find balanceOf slot key for token ${this.address}!`);
            });

            this._registeredPromises.push(promise);
        }
        else {
            super.stateDiff(getBalanceOfSlotKey(ownerAddress, mapSlotNumber));
        }

        return this;
    }

    public allowance(ownerAddress: string, spenderAddress: string): TokenAsIf {
        this._method = "allowance";

        const mapSlotNumber = allowanceSlotNumberByToken.get(this.address);
        if (mapSlotNumber === undefined) {
            const calldata = erc20Interface.encodeFunctionData("allowance", [ownerAddress, spenderAddress]);

            if (this._provider === undefined) {
                throw new Error(`Could not detect allowance mapping slot number as no provider is connected to TokenAsIf ${this.address}.`);
            }

            const promise = findSlotKeyInternal(this.address, calldata, this._provider)
            .then(visitedSlotKeys => {
                for (let mappingSlotNumber = 0; mappingSlotNumber < 20; mappingSlotNumber++) {
                    const key = getAllowanceSlotKey(ownerAddress, spenderAddress, mappingSlotNumber);
                    const slotKey = visitedSlotKeys.find(vk => vk === key);
                    if (slotKey !== undefined) {
                        // console.log(`slotNumber: ${mappingSlotNumber}`);
                        allowanceSlotNumberByToken.set(this.address, mappingSlotNumber);
                        super.stateDiff(slotKey);
                        break;
                    }
                }
            });

            this._registeredPromises.push(promise);
        }
        else {
            super.stateDiff(getAllowanceSlotKey(ownerAddress, spenderAddress, mapSlotNumber));
        }

        return this;
    }

    public is(value: bigint): TokenAsIf {
        if (this._method === undefined) {
            throw new Error(`Method to call of AsIf at ${this.address} is not set!`);
        }

        if (this._method === "balanceOf" || this._method === "allowance") {
            if (typeof value !== 'bigint') {
                throw new Error(`Invalid value for ${this._method} of AsIf at ${this.address}.`)
            }
            const slotValue = solidityPacked([ "uint256" ], [ value ]);
            super.is(slotValue);
        }

        return this;
    }
};

export const tokenAt = (address: string): TokenAsIf => {
    return new TokenAsIf(address);
};