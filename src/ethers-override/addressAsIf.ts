
import type { EthCallOverride } from "./types.js";

export class AddressAsIf {
    protected _field: "balance" | "nonce" | "code" | "stateDiff" | "state" | undefined = undefined;
    protected _slot: string | undefined = undefined;
    protected _value: string | undefined = undefined;

    protected _registeredPromises: Array<Promise<void>> = [];

    public constructor(public readonly address: string) {}

    public balance(): AddressAsIf {
        this._field = "balance";
        return this;
    }

    public nonce(): AddressAsIf {
        this._field = "nonce";
        return this;
    }

    public code(): AddressAsIf {
        this._field = "code";
        return this;
    }

    public stateDiff(slot: string): AddressAsIf {
        this._field = "stateDiff";
        this._slot = slot;
        return this;
    }

    public state(slot: string): AddressAsIf {
        this._field = "state";
        this._slot = slot;
        return this;
    }

    public is(value: any): AddressAsIf {
        // if (this._field === "balance" || this._field === "nonce") {
        //     if (typeof value !== 'bigint') {
        //         throw new Error(`Invalid value type for field ${this._field}.`)
        //     }
        //     this._value = defaultAbiCoder.encode([ "uint" ], [ value ]);
        //     return this;
        // }
        this._value = value.toString();
        return this;
    }

    public async valueAsync(): Promise<EthCallOverride> {

        await Promise.all(this._registeredPromises);

        if (this._field === undefined) {
            throw new Error(`Field of AsIf at ${this.address} is not set!`);
        }
        if (this._value === undefined) {
            throw new Error(`Value of AsIf at ${this.address} is not set!`);
        }

        if (this._field === "stateDiff" || this._field === "state") {
            if (this._slot === undefined) {
                throw new Error(`StateDiff slot of AsIf at ${this.address} is not set!`);
            }

            return {
                [this.address]: {
                    [this._field]: {
                        [this._slot]: this._value,
                    }
                }
            } as unknown as EthCallOverride;
        }

        return {
            [this.address]: {
                [this._field]: this._value,
            }
        } as unknown as EthCallOverride;
    }
};

export const addressAt = (address: string): AddressAsIf => {
    return new AddressAsIf(address);
};