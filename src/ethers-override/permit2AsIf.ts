
import { keccak256, solidityPacked, toBeHex, zeroPadValue } from "ethers";
import { AddressAsIf } from "./addressAsIf.js";

const getAllowanceSlotKey = (ownerAddress: string, tokenAddress: string, spenderAddress: string, mappingSlotNumber: number): string => {
    return keccak256(
        zeroPadValue(spenderAddress, 32)
        + keccak256(
            zeroPadValue(tokenAddress, 32)
            + keccak256(
                zeroPadValue(ownerAddress, 32)
                + toBeHex(mappingSlotNumber, 32).slice(2)
            ).slice(2)
        ).slice(2)
    );
}

const getNonceBitmapSlotKey = (ownerAddress: string, wordPos: bigint, mappingSlotNumber: number): string => {
    return keccak256(
        toBeHex(wordPos, 32)
        + keccak256(
            zeroPadValue(ownerAddress, 32)
            + toBeHex(mappingSlotNumber, 32).slice(2)
        ).slice(2)
    );
}

export type Permit2AllowanceValue = {
    nonce: bigint;
    expiration: bigint;
    amount: bigint;
};

export class Permit2AsIf extends AddressAsIf {
    private _method: "allowance" | "nonceBitmap" | undefined = undefined;
    private _allowanceMappingSlotNumber = 1;
    private _nonceBitmapMappingSlotNumber = 0;

    public constructor(address: string) {
        super(address);
    }

    public allowance(ownerAddress: string, tokenAddress: string, spenderAddress: string): Permit2AsIf {
        this._method = "allowance";
        super.stateDiff(getAllowanceSlotKey(ownerAddress, tokenAddress, spenderAddress, this._allowanceMappingSlotNumber));
        return this;
    }

    public nonceBitmap(ownerAddress: string, wordPos: bigint): Permit2AsIf {
        this._method = "nonceBitmap";
        const nonceBitmapSlotKey = getNonceBitmapSlotKey(ownerAddress, wordPos, this._nonceBitmapMappingSlotNumber);
        // console.log(`Calculated nonceBitmapSlotKey is ${nonceBitmapSlotKey}`);
        super.stateDiff(nonceBitmapSlotKey);
        return this;
    }

    public is(value: Permit2AllowanceValue | bigint): Permit2AsIf {
        if (this._method === undefined) {
            throw new Error(`Method to call of AsIf at ${this.address} is not set!`);
        }

        if (this._method === "allowance") {
            if (
                value === undefined
                || typeof value !== 'object'
                || typeof value.amount !== 'bigint'
                || typeof value.expiration !== 'bigint'
                || typeof value.nonce !== 'bigint'
            ) {
                throw new Error(`Invalid value for ${this._method} of Permit2AsIf.`)
            }
            const slotValue = solidityPacked(["uint48", "uint48", "uint160"], [ value.nonce, value.expiration, value.amount ]);
            super.is(slotValue);
        }
        else if (this._method === "nonceBitmap") {
            if (
                value === undefined
                || typeof value !== 'bigint'
            ) {
                throw new Error(`Invalid value for ${this._method} of Permit2AsIf.`)
            }
            const slotValue = solidityPacked(["uint"], [ value ]);
            super.is(slotValue);
        }

        return this;
    }
};

export const permit2 = (permit2Address: string): Permit2AsIf => new Permit2AsIf(permit2Address);