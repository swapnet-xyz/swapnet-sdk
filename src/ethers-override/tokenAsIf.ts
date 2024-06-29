
import { keccak256, solidityPacked, toBeHex, zeroPadValue } from "ethers";
import { AddressAsIf, addressAt } from "./addressAsIf.js";
import type { EthCallOverride } from "./types.js";
// @ts-ignore
import erc20 from '../abi/erc20.json' assert { type: "json" };
import { mergeDeep } from "./utils.js";

const getBalanceOfSlotKey = (ownerAddress: string, mappingSlotNumber: number): string => {
    return keccak256(zeroPadValue(ownerAddress, 32) + toBeHex(mappingSlotNumber, 32).slice(2)).toLowerCase();
}

const getAllowanceSlotKey = (ownerAddress: string, spenderAddress: string, mappingSlotNumber: number): string => {
    return keccak256(
        zeroPadValue(spenderAddress, 32)
        + keccak256(
            zeroPadValue(ownerAddress, 32)
            + toBeHex(mappingSlotNumber, 32).slice(2)
        ).slice(2)
    );
}

export class TokenAsIf extends AddressAsIf {
    private _method: "balanceOf" | "allowance" | undefined = undefined;

    public constructor(address: string) {
        super(address);
    }

    public balanceOf(ownerAddress: string): TokenAsIf {
        this._method = "balanceOf";
        super.stateDiff(getBalanceOfSlotKey(ownerAddress, /* balance map slot number */ 0));
        return this;
    }

    public allowance(ownerAddress: string, spenderAddress: string): TokenAsIf {
        this._method = "allowance";
        super.stateDiff(getAllowanceSlotKey(ownerAddress, spenderAddress, /* allowance map slot number */ 1));
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

    public async valueAsync(): Promise<EthCallOverride> {
        const valueOverride = await super.valueAsync();
        const codeOverride = await addressAt(this.address).code().is(erc20.deployedBytecode).valueAsync();
        return mergeDeep(valueOverride, codeOverride);
    }
};

export const tokenAt = (address: string): TokenAsIf => {
    return new TokenAsIf(address);
};