import type { ISwapResponse, ITokenStaticInfo } from "./common/interfaces.js";
import { RouterUname, type ChainId } from "./common/unames.js";

const resolveErrorAsync = async (response: Response): Promise<{ succeeded: boolean; error: string; }> => {
    
    if (response.status === 400 || response.status === 409 || response.status === 500) {
        const { error } = await response.json() as { error: string}
        return {
            succeeded: false,
            error,
        };
    }
    else if (response.status !== 200) {
        let error: string;
        if (response.status >= 500) {
            error = `Unknown server error with code ${response.status}.`;
        }
        else if (response.status >= 400) {
            error = `Unknown client error with code ${response.status}.`;
        }
        else {
            error = `Unknown status code ${response.status}.`;
        }
        return {
            succeeded: false,
            error,
        };
    }

    return {
        succeeded: true,
        error: "",
    };
}

export class SwapnetClient {
    constructor (
        private readonly _apiKey: string,
        private readonly _baseUrl: string = 'https://app.swap-net.xyz/api',
        private readonly _apiVersion: string = 'v1.0',
    ) {}

    public async getSupportedTokensAsync(
        chainId: ChainId,
    ): Promise<{
        succeeded: true,
        tokens: ITokenStaticInfo[],
    } | {
        succeeded: false,
        error: string,
    }> {

        const url = `${this._baseUrl}/${this._apiVersion}/tokens?` +
            `apiKey=${this._apiKey}&` + 
            `chainId=${chainId}`;

        const response = await fetch(url);

        const { succeeded, error } = await resolveErrorAsync(response);
        if (!succeeded) {
            return {
                succeeded: false,
                error,
            }
        }

        const tokens = (await response.json()) as ITokenStaticInfo[];
        return {
            succeeded: true,
            tokens,
        }
    }

    public async swapAsync(
        chainId: ChainId,
        sellTokenAddress: string,
        buyTokenAddress: string,
        sellAmount: bigint | undefined,
        buyAmount: bigint | undefined,
        useRfq: boolean | undefined = undefined,
        router: RouterUname | undefined = undefined,
        includeCalldata: boolean | undefined = undefined,
        userAddress: string | undefined = undefined,
        slippageTolerance: number | undefined = undefined,
    ): Promise<{
        succeeded: true,
        swapResponse: ISwapResponse,
    } | {
        succeeded: false,
        error: string,
    }> {

        if (sellAmount === undefined && buyAmount === undefined) {
            throw new Error(`Both sellAmount and buyAmount are missing!`);
        }

        if (sellAmount !== undefined && buyAmount !== undefined) {
            throw new Error(`Both sellAmount and buyAmount are specified!`);
        }

        if (includeCalldata) {
            if (userAddress === undefined || slippageTolerance === undefined) {
                throw new Error(`Both userAddress and slippageTolerance must be provided if calldata is requested!`);
            }
        }

        const url = `${this._baseUrl}/${this._apiVersion}/swap?` +
            `apiKey=${this._apiKey}&` +
            `chainId=${chainId}&` +
            `sellToken=${sellTokenAddress}&` +
            `buyToken=${buyTokenAddress}` +
            (sellAmount !== undefined ? `&sellAmount=${sellAmount.toString()}` : "") +
            (buyAmount !== undefined ? `&buyAmount=${buyAmount.toString()}` : "") +
            (useRfq !== undefined ? `&useRfq=${useRfq}` : "") +
            (router !== undefined ? `&router=${router}` : "") +
            (includeCalldata !== undefined ? `&includeCalldata=${includeCalldata}` : "") +
            (userAddress !== undefined ? `&userAddress=${userAddress}` : "") +
            (slippageTolerance !== undefined ? `&slippageTolerance=${slippageTolerance}` : "");

        const response = await fetch(url);
        const { succeeded, error } = await resolveErrorAsync(response);
        if (!succeeded) {
            return {
                succeeded: false,
                error,
            }
        }

        const swapResponse = (await response.json()) as ISwapResponse;
        return {
            succeeded: true,
            swapResponse,
        };
    }
}
