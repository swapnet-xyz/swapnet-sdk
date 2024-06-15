import type { ISwapResponse, ITokenPrice, ITokenStaticInfo } from "../common/interfaces.js";
import type { IRoutingPlan, TokenOperation } from "../common/routingPlan.js";
import { parse } from "./parser.js";

const apiVersion = 'v1.0'
export class SwapnetClient {
    constructor (
        private readonly _apiKey: string,
        private readonly _baseUrl: string = 'https://app.swap-net.xyz',
    ) {}

    public async getSupportedTokensAsync(
        chainId: number,
    ): Promise<ITokenStaticInfo[]> {

        const url = `${this._baseUrl}/api/${apiVersion}/tokens?` +
            `apiKey=${this._apiKey}&` + 
            `chainId=${chainId}`;

        const response = await fetch(url);
        return (await response.json()) as ITokenStaticInfo[];
    }

    public async getRoutingPlanAsync(
        chainId: number,
        sellTokenAddress: string,
        buyTokenAddress: string,
        sellAmount: bigint | undefined,
        buyAmount: bigint | undefined,
        userAddress: string | undefined,
    ): Promise<IRoutingPlan> {

        if (sellAmount === undefined && buyAmount === undefined) {
            throw new Error(`Both sellAmount and buyAmount are missing!`);
        }

        if (sellAmount !== undefined && buyAmount !== undefined) {
            throw new Error(`Both sellAmount and buyAmount are specified!`);
        }

        const url = `${this._baseUrl}/api/${apiVersion}/swap?` +
            `apiKey=${this._apiKey}&` +
            `chainId=${chainId}&` +
            `sellToken=${sellTokenAddress}&` +
            `buyToken=${buyTokenAddress}` +
            (sellAmount !== undefined ? `&sellAmount=${sellAmount.toString()}` : "") +
            (buyAmount !== undefined ? `&buyAmount=${buyAmount.toString()}` : "") +
            (userAddress !== undefined ? `&userAddress=${userAddress}` : "");

        const response = await fetch(url);
        const swapResponse = (await response.json()) as ISwapResponse;
        return parse(swapResponse);
    }

    public async getTokenPricesAsync(
        chainId: number,
        tokenOps: TokenOperation [],
    ): Promise<ITokenPrice []> {

        const url = `${this._baseUrl}/api/${apiVersion}/prices?` +
            `apiKey=${this._apiKey}&` +
            `chainId=${chainId}&` +
            `tokens=${tokenOps.map(o => o.tokenInfo.address).join(',')}`;

        const response = await fetch(url);
        return (await response.json()) as ITokenPrice [];
    }
}